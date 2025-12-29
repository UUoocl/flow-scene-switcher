/**
 * @file Manages the connection and communication with an OBS WebSocket server.
 * @module obs
 */

import OBSWebSocket, { type OBSWebSocketError } from 'obs-websocket-js';
import { parseFlowCSS, type BrowserNodeDefinition } from '../utils/cssParser';
import { settings } from './settings.svelte';

/**
 * Interface for OBS WebSocket connection details.
 */
export interface WSSDetails {
    /** The IP address of the OBS WebSocket server. */
    IP: string;
    /** The port of the OBS WebSocket server. */
    PORT: string;
    /** The password for the OBS WebSocket server. */
    PW: string;
}

/**
 * Manages the OBS WebSocket connection, state, and data retrieval.
 * This class is a singleton, exported as `obs`.
 */
class OBSManager {
    /**
     * Reactive state indicating if the WebSocket is connected and identified.
     * @type {boolean}
     */
    isConnected = $state(false);

    /**
     * Reactive state representing the current connection status.
     * @type {'disconnected' | 'connecting' | 'connected'}
     */
    status = $state<'disconnected' | 'connecting' | 'connected'>('disconnected');

    /**
     * Reactive list of available OBS scene names.
     * @type {string[]}
     */
    scenes = $state<string[]>([]);

    /**
     * Reactive list of discovered browser source nodes with flow definitions.
     * @type {BrowserNodeDefinition[]}
     */
    browserNodes = $state<BrowserNodeDefinition[]>([]);
    
    /** The underlying `obs-websocket-js` instance. */
    ws = new OBSWebSocket();

    constructor() {
        this.setupEventListeners();
        // Try auto-connect on init
        setTimeout(() => this.autoConnect(), 100);
    }

    /**
     * Sets up the listeners for OBS WebSocket events.
     * @private
     */
    private setupEventListeners() {
        this.ws.on('ConnectionOpened', () => {
            this.status = 'connected';
            this.isConnected = true;
        });

        this.ws.on('ConnectionClosed', () => {
            this.status = 'disconnected';
            this.isConnected = false;
        });

        this.ws.on('Identified', async () => {
             this.status = 'connected';
             this.isConnected = true;
             await this.fetchScenes();
             await this.discoverBrowserNodes();
        });

        this.ws.on('InputSettingsChanged', async (data: any) => {
            if (settings.discoveryMethod === 'css' && data.inputKind === 'browser_source') {
                await this.updateBrowserNode(data.inputName);
            }
        });

        this.ws.on('BroadcastCustomEvent' as any, (data: any) => {
            const event = data.eventData;
            // Listen for broadcast discovery responses
            if (settings.discoveryMethod === 'broadcast' && event?.realm === 'flowNode' && event.type === 'definition') {
                this.handleBroadcastDefinition(event);
            }
        });
    }

    /**
     * Attempts to automatically connect to the OBS WebSocket server
     * using a series of predefined credential retrieval methods.
     */
    async autoConnect() {
        // Automated connection attempts
        const methods = [
            this.fetchApiDetails,
            this.getLocalStorageDetails,
            this.getCssVariableDetails,
            this.getUrlParamDetails,
            // @ts-ignore
            () => window.websocketDetails || null
        ];

        for (const method of methods) {
            const details = await method();
            if (details) {
                if ((await this.connect(details)) === 'connected') {
                    return; // Success
                }
            }
        }
    }

    /**
     * Connects to the OBS WebSocket server using the provided details.
     * Caches successful connection details in local storage.
     * @param {WSSDetails} details - The connection details.
     * @returns {Promise<'connected' | 'failed'>} The result of the connection attempt.
     */
    async connect(details: WSSDetails): Promise<'connected' | 'failed'> {
        this.status = 'connecting';
        try {
            await this.ws.disconnect().catch(() => {});
            await this.ws.connect(`ws://${details.IP}:${details.PORT}`, details.PW, { rpcVersion: 1 });
            
            // Cache successful connection details
            localStorage.setItem('wssDetails', JSON.stringify(details));
            
            return 'connected';
        } catch (error) {
            console.error('OBS Connection failed:', error);
            this.status = 'disconnected';
            this.isConnected = false;
            return 'failed';
        }
    }

    /**
     * Disconnects from the OBS WebSocket server.
     */
    async disconnect() {
        await this.ws.disconnect();
    }

    /**
     * Fetches the list of scenes from OBS.
     */
    async fetchScenes() {
        if (!this.isConnected) return;
        try {
            const response = await this.ws.call('GetSceneList');
            // @ts-ignore
            this.scenes = response.scenes.map((s: any) => s.sceneName).reverse(); 
        } catch (e) {
            console.error("Failed to fetch scenes", e);
        }
    }

    /**
     * Scans all browser sources in OBS or broadcasts a discovery request
     * based on the current application settings.
     */
    async discoverBrowserNodes() {
        if (!this.isConnected) return;
        
        if (settings.discoveryMethod === 'css') {
            try {
                const { inputs } = await this.ws.call('GetInputList', { inputKind: 'browser_source' });
                const newNodes: BrowserNodeDefinition[] = [];

                for (const input of inputs) {
                    const { inputSettings } = await this.ws.call('GetInputSettings', { inputName: input.inputName as string });
                    const def = parseFlowCSS(input.inputName as string, (inputSettings.css as string) || "");
                    if (def) newNodes.push(def);
                }
                this.browserNodes = newNodes;
            } catch (e) {
                console.error("Failed to discover browser nodes via CSS", e);
            }
        } else {
            // Broadcast mode: clear current list and request new ones
            this.browserNodes = [];
            this.requestBroadcastDiscovery();
        }
    }

    /**
     * Broadcasts a discovery request to all connected clients.
     */
    requestBroadcastDiscovery() {
        if (!this.isConnected) return;
        console.log("Requesting broadcast discovery (flowNode)...");
        this.ws.call('BroadcastCustomEvent', {
            eventData: {
                realm: "flowNode",
                type: "discovery"
            }
        });
    }

    /**
     * Handles an incoming node definition from a broadcast event.
     * @param {any} event - The broadcast event data.
     * @private
     */
    private handleBroadcastDefinition(event: any) {
        // Enforce Suggestion 1: Verify structure and contents
        if (!event.sourceName || !event.inputs || !event.outputs) {
            console.warn("Invalid broadcast definition received", event);
            return;
        }

        const definition: BrowserNodeDefinition = {
            sourceName: event.sourceName,
            inputs: event.inputs.map((i: any) => ({ 
                name: i.name, 
                type: (i.dataType || i.type || 'string').toLowerCase() 
            })),
            outputs: event.outputs.map((o: any) => ({ 
                name: o.name || o.broadcastName, 
                type: (o.dataType || o.type || 'event').toLowerCase(),
                broadcastName: o.broadcastName || o.name
            }))
        };

        const index = this.browserNodes.findIndex(n => n.sourceName === definition.sourceName);
        if (index > -1) {
            this.browserNodes[index] = definition;
        } else {
            this.browserNodes.push(definition);
        }
        console.log(`Discovered node via broadcast: ${definition.sourceName}`);
    }

    /**
     * Updates or removes a browser node definition when its settings change in OBS.
     * @param {string} inputName - The name of the input that changed.
     * @private
     */
    async updateBrowserNode(inputName: string) {
        try {
            const { inputSettings } = await this.ws.call('GetInputSettings', { inputName });
            const def = parseFlowCSS(inputName, (inputSettings.css as string) || "");
            
            const index = this.browserNodes.findIndex(n => n.sourceName === inputName);
            if (def) {
                if (index > -1) this.browserNodes[index] = def;
                else this.browserNodes.push(def);
            } else {
                if (index > -1) this.browserNodes.splice(index, 1);
            }
        } catch (e) {}
    }

    // --- Action Wrappers ---

    /**
     * Sets the current program scene in OBS.
     * @param {string} sceneName - The name of the scene to switch to.
     */
    async setScene(sceneName: string) {
        if (!this.isConnected) return;
        return this.ws.call('SetCurrentProgramScene', { sceneName });
    }

    /**
     * Sets the mute state of an input in OBS.
     * @param {string} inputName - The name of the input.
     * @param {boolean} muted - The desired mute state.
     */
    async setMute(inputName: string, muted: boolean) {
        if (!this.isConnected) return;
        return this.ws.call('SetInputMute', { inputName, inputMuted: muted });
    }

    /**
     * Controls the OBS stream (start, stop, toggle).
     * @param {"StartStream" | "StopStream" | "ToggleStream"} action - The stream action to perform.
     */
    async controlStream(action: "StartStream" | "StopStream" | "ToggleStream") {
        if (!this.isConnected) return;
        return this.ws.call(action);
    }
    
    /**
     * Sets the settings for an input in OBS.
     * @param {string} inputName - The name of the input.
     * @param {object} settings - The settings object.
     * @param {boolean} [overlay=true] - Whether to overlay the settings.
     */
    async setInputSettings(inputName: string, settings: object, overlay: boolean = true) {
         if (!this.isConnected) return;
         return this.ws.call('SetInputSettings', { inputName, inputSettings: settings as any, overlay });
    }

    /**
     * Broadcasts a custom event to be received by browser sources.
     * This is used to send data to a dynamic browser node's inputs.
     * @param {string} sourceName - The target browser source name.
     * @param {string} variable - The input variable name.
     * @param {*} value - The value to send.
     */
    async broadcastFlowInput(sourceName: string, variable: string, value: any) {
        if (!this.isConnected) return;
        return this.ws.call('BroadcastCustomEvent', {
            eventData: {
                realm: "flow-input",
                targetSource: sourceName,
                variable,
                value
            }
        });
    }

    /**
     * Broadcasts a generic custom event to OBS.
     * @param {string} eventName - The name of the event.
     * @param {object} payload - The data payload.
     */
    async broadcastEvent(eventName: string, payload: object) {
        if (!this.isConnected) return;
        return this.ws.call('BroadcastCustomEvent', {
            eventData: {
                ...payload,
                broadcastName: eventName,
                // We add a specific realm or type if needed, but for generic
                // listeners, the payload + broadcastName is usually enough.
                realm: "flow-custom-event" 
            }
        });
    }

    // --- Data Retrieval Helpers ---

    /**
     * Fetches connection details from the `/api/obswss` endpoint.
     * @returns {Promise<WSSDetails | null>}
     */
    async fetchApiDetails(): Promise<WSSDetails | null> {
        try {
            const res = await fetch('/api/obswss');
            if (res.ok) return await res.json();
        } catch (e) {}
        return null;
    }

    /**
     * Retrieves connection details from local storage.
     * @returns {WSSDetails | null}
     */
    getLocalStorageDetails(): WSSDetails | null {
        try {
            const data = localStorage.getItem('wssDetails');
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    }

    /**
     * Retrieves connection details from a CSS custom property (`--websocket-details`).
     * @returns {WSSDetails | null}
     */
    getCssVariableDetails(): WSSDetails | null {
        try {
            const cssVar = getComputedStyle(document.body).getPropertyValue('--websocket-details').trim().replace(/^['"]|['"]$/g, '');
            return cssVar ? JSON.parse(cssVar) : null;
        } catch { return null; }
    }

    /**
     * Retrieves connection details from URL query parameters.
     * @returns {WSSDetails | null}
     */
    getUrlParamDetails(): WSSDetails | null {
        const params = new URLSearchParams(window.location.search);
        const IP = params.get('wssip');
        const PORT = params.get('wssport');
        if (IP && PORT) return { IP, PORT, PW: params.get('wsspw') || '' };
        return null;
    }
}

/**
 * The singleton instance of the OBSManager.
 * @type {OBSManager}
 */
export const obs = new OBSManager();
