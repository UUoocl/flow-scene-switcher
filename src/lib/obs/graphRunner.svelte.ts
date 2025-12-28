/**
 * @file Contains the core logic for executing the node-based graph.
 * @module graphRunner
 */

import { obs } from './obs.svelte';
import type { Node, Edge } from '@xyflow/svelte';

/**
 * Executes the flow graph by listening to OBS events and propagating
 * actions through the connected nodes.
 */
export class GraphRunner {
    private getNodes: () => Node[];
    private getEdges: () => Edge[];
    
    /**
     * Reactive state indicating if the graph logic is currently running.
     * @type {boolean}
     */
    isRunning = $state(false);

    // Event handlers (stored to remove them later)
    private handlers: { [key: string]: (data: any) => void } = {};

    /**
     * @param {() => Node[]} getNodes - A function that returns the current array of nodes.
     * @param {() => Edge[]} getEdges - A function that returns the current array of edges.
     */
    constructor(getNodes: () => Node[], getEdges: () => Edge[]) {
        this.getNodes = getNodes;
        this.getEdges = getEdges;
    }

    /**
     * Starts the graph execution engine.
     * Registers listeners for OBS events.
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startListening();
        console.log("Graph Runner: Started");
    }

    /**
     * Stops the graph execution engine.
     * Removes all registered OBS event listeners.
     */
    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.stopListening();
        console.log("Graph Runner: Stopped");
    }

    /**
     * Registers the necessary OBS event listeners.
     * @private
     */
    private startListening() {
        // Define handlers
        this.handlers['CurrentProgramSceneChanged'] = (data) => {
            console.log('runner: scene changed', data);
            this.triggerEventNodes('obs/events/scene_changed', data);
        };
        this.handlers['InputMuteStateChanged'] = (data) => {
            this.triggerEventNodes('obs/events/mute_changed', data);
        };
        this.handlers['StreamStateChanged'] = (data) => {
             this.triggerEventNodes('obs/events/stream_state', data);
        };
        
        // --- Custom Events (Browser Source Outputs) ---
        this.handlers['BroadcastCustomEvent'] = (data: any) => {
            const event = data.eventData;
            
            // 1. Handle standard flow-output events
            if (event?.realm === 'flow-output' && event.sourceName && event.variable) {
                console.log(`Custom event received (standard): ${event.sourceName}.${event.variable}`, event.value);
                this.triggerBrowserOutputNodes(event.sourceName, event.variable, event.value);
            }
            
            // 2. Handle broadcastName specific events (Clarification 1)
            // We need to find which node matches this event broadcastName
            this.triggerNamedBroadcastNodes(data.eventData);
        };

        // Register with OBS
        obs.ws.on('CurrentProgramSceneChanged', this.handlers['CurrentProgramSceneChanged']);
        obs.ws.on('InputMuteStateChanged', this.handlers['InputMuteStateChanged']);
        obs.ws.on('StreamStateChanged', this.handlers['StreamStateChanged']);
        obs.ws.on('BroadcastCustomEvent' as any, this.handlers['BroadcastCustomEvent']);
    }

    /**
     * Removes all OBS event listeners.
     * @private
     */
    private stopListening() {
        // Remove from OBS
        obs.ws.off('CurrentProgramSceneChanged', this.handlers['CurrentProgramSceneChanged']);
        obs.ws.off('InputMuteStateChanged', this.handlers['InputMuteStateChanged']);
        obs.ws.off('StreamStateChanged', this.handlers['StreamStateChanged']);
        obs.ws.off('BroadcastCustomEvent' as any, this.handlers['BroadcastCustomEvent']);
        
        // Clear handlers
        this.handlers = {};
    }

    /**
     * Finds and triggers the initial "event" nodes in the graph.
     * @param nodeType - The type of event node to trigger (e.g., 'obs/events/scene_changed').
     * @param eventData - The data from the OBS event.
     * @private
     */
    private triggerEventNodes(nodeType: string, eventData: any) {
        const nodes = this.getNodes();
        const startNodes = nodes.filter(n => n.type === nodeType);
        
        for (const node of startNodes) {
            // Update event node data so connected Watch nodes see it
            node.data.eventData = eventData;
            this.executeNode(node.id, eventData);
        }
    }

    /**
     * Finds and triggers Browser Source nodes based on an incoming custom event.
     * @param sourceName - The name of the source that sent the event.
     * @param variable - The output variable name.
     * @param value - The value from the event.
     * @private
     */
    private triggerBrowserOutputNodes(sourceName: string, variable: string, value: any) {
        const nodes = this.getNodes();
        const browserNodes = nodes.filter(n => n.type === 'obs/browser_source' && (n.data as any).definition?.sourceName === sourceName);
        
        for (const node of browserNodes) {
            if (!(node.data as any).outputValues) (node.data as any).outputValues = {};
            (node.data as any).outputValues[variable] = value;
            this.triggerNextNodes(node.id, variable);
        }
    }

    /**
     * Finds and triggers Browser Source nodes where an output's broadcastName matches the event.
     * @param eventData - The full eventData object from the broadcast.
     * @private
     */
    private triggerNamedBroadcastNodes(eventData: any) {
        // We look for any browser_source node that has an output with a matching broadcastName
        // Usually, the eventData itself might just BE the broadcast.
        // We assume the eventData contains the name of the broadcast or we match against keys.
        
        const nodes = this.getNodes();
        const browserNodes = nodes.filter(n => n.type === 'obs/browser_source');

        for (const node of browserNodes) {
            const def = (node.data as any).definition;
            if (!def || !def.outputs) continue;

            for (const output of def.outputs) {
                // If the broadcast event matches the output's broadcastName
                // Note: We might need to check if the event matches the broadcastName exactly
                // or if the event has a property that matches.
                // Assuming Clarification 1: "the browser will emit an obs custom broadcast event with the broadcastName value"
                // This implies the event TYPE or a field matches.
                // Let's check for eventData.broadcastName or if eventData IS the name.
                
                if (eventData === output.broadcastName || eventData.broadcastName === output.broadcastName) {
                    if (!(node.data as any).outputValues) (node.data as any).outputValues = {};
                    (node.data as any).outputValues[output.name] = eventData.value ?? eventData;
                    this.triggerNextNodes(node.id, output.name);
                }
            }
        }
    }

    /**
     * Executes a single node and triggers the next connected nodes.
     * @param nodeId - The ID of the node to execute.
     * @param inputData - Any data passed from the previous node (currently unused).
     * @private
     */
    private async executeNode(nodeId: string, inputData: any) {
        const nodes = this.getNodes();
        const node = nodes.find(n => n.id === nodeId);
        
        if (!node) return;

        // Perform Node Logic
        try {
            const nextOutputId = await this.performNodeAction(node, inputData);
            this.triggerNextNodes(nodeId, nextOutputId);
        } catch (e) {
            console.error(`Error executing node ${node.id}:`, e);
        }
    }

    /**
     * Triggers the nodes connected to the outputs of a given node.
     * @param nodeId - The ID of the source node.
     * @param sourceHandleId - The specific output handle to trigger from (optional).
     * @private
     */
    private triggerNextNodes(nodeId: string, sourceHandleId: string | void) {
        const edges = this.getEdges();
        const outgoingEdges = edges.filter(e => {
            if (e.source !== nodeId) return false;
            if (sourceHandleId && e.sourceHandle && e.sourceHandle !== sourceHandleId) return false;
            return true;
        });

        for (const edge of outgoingEdges) {
            this.executeNode(edge.target, null);
        }
    }

    /**
     * Resolves the value for a node's input handle. If the handle is connected,
     * it recursively evaluates the source node. Otherwise, it returns a default value.
     * @param nodeId - The ID of the node.
     * @param handleId - The ID of the input handle.
     * @param defaultValue - A fallback value if the input is not connected.
     * @returns {*} The resolved value.
     * @private
     */
    private resolveInput(nodeId: string, handleId: string, defaultValue?: any): any {
        const edges = this.getEdges();
        const incomingEdge = edges.find(e => e.target === nodeId && e.targetHandle === handleId);
        if (!incomingEdge) return defaultValue;

        const nodes = this.getNodes();
        const sourceNode = nodes.find(n => n.id === incomingEdge.source);
        if (!sourceNode) return defaultValue;

        return this.evaluateNodeData(sourceNode, incomingEdge.sourceHandle);
    }

    /**
     * Evaluates the output value of a data-producing node.
     * @param node - The node to evaluate.
     * @param sourceHandleId - The specific output handle being evaluated (optional).
     * @returns {*} The output value of the node.
     * @private
     */
    private evaluateNodeData(node: Node, sourceHandleId?: string | null): any {
        switch (node.type) {
            case 'basic/number':
            case 'basic/string':
            case 'basic/boolean':
                return node.data.value;
            
            case 'basic/watch':
                return this.resolveInput(node.id, 'input');

            case 'math/operation': {
                const a = Number(this.resolveInput(node.id, 'a', 0));
                const b = Number(this.resolveInput(node.id, 'b', 0));
                const op = node.data.op as string;
                let res = 0;
                if (op === '+') res = a + b;
                if (op === '-') res = a - b;
                if (op === '*') res = a * b;
                if (op === '/') res = a / b;
                if (op === '%') res = a % b;
                node.data.result = res; 
                return res;
            }

            case 'math/compare': {
                const a = this.resolveInput(node.id, 'a');
                const b = this.resolveInput(node.id, 'b');
                const op = node.data.op as string;
                const nA = Number(a);
                const nB = Number(b);
                const useNum = !isNaN(nA) && !isNaN(nB);
                const vA = useNum ? nA : a;
                const vB = useNum ? nB : b;

                let res = false;
                if (op === '==') res = vA == vB;
                if (op === '!=') res = vA != vB;
                if (op === '>') res = vA > vB;
                if (op === '<') res = vA < vB;
                if (op === '>=') res = vA >= vB;
                if (op === '<=') res = vA <= vB;
                return res;
            }

            case 'obs/browser_source':
                if (sourceHandleId && (node.data as any).outputValues) {
                    return (node.data as any).outputValues[sourceHandleId];
                }
                return (node.data as any).outputValues || {};

            case 'obs/events/scene_changed':
            case 'obs/events/mute_changed':
            case 'obs/events/stream_state':
                return node.data.eventData;

            default:
                return node.data.value || node.data;
        }
    }

    /**
     * Performs the primary action of a given node.
     * @param node - The node to perform the action for.
     * @param data - The input data.
     * @returns {Promise<string | void>} The ID of the output handle to trigger next, if any.
     * @private
     */
    private async performNodeAction(node: Node, data: any): Promise<string | void> {
        if (node.type === 'logic/branch') {
            const condition = this.resolveInput(node.id, 'condition', false);
            return condition ? 'true' : 'false';
        }

        if (node.type === 'basic/watch') {
            const val = this.resolveInput(node.id, 'input');
            node.data = { ...node.data, value: val }; 
            return 'done';
        }

        if (node.type === 'obs/browser_source') {
            const def = (node.data as any).definition;
            if (def) {
                for (const input of def.inputs) {
                    const val = this.resolveInput(node.id, input.name);
                    if (val !== undefined) {
                        await obs.broadcastFlowInput(def.sourceName, input.name, val);
                    }
                }
            }
            return;
        }

        switch (node.type) {
            case 'obs/actions/set_scene': {
                const sceneName = this.resolveInput(node.id, 'scene', node.data.scene);
                if (sceneName) await obs.setScene(sceneName);
                break;
            }
            case 'obs/actions/set_mute': {
                const inputName = this.resolveInput(node.id, 'inputName', node.data.inputName);
                const mute = this.resolveInput(node.id, 'mute', node.data.mute);
                if (inputName) await obs.setMute(inputName, mute);
                break;
            }
             case 'obs/actions/control_stream': {
                const action = this.resolveInput(node.id, 'action', node.data.action);
                if (action) await obs.controlStream(action);
                break;
            }
            case 'obs/actions/set_input_settings': {
                const inputName = this.resolveInput(node.id, 'inputName', node.data.inputName);
                const rawSettings = this.resolveInput(node.id, 'settings', node.data.settings);
                const overlay = this.resolveInput(node.id, 'overlay', node.data.overlay);
                let settings = rawSettings;
                if (typeof rawSettings === 'string') {
                    try { settings = JSON.parse(rawSettings); } catch {}
                }
                if (inputName) await obs.setInputSettings(inputName, settings, overlay);
                break;
            }
        }

        if (node.type?.startsWith('obs/events/')) return 'trigger';
        return 'done';
    }
}
