import OBSWebSocket, { OBSWebSocketError } from 'obs-websocket-js';
import { WSSDetails, OBSWebSocketWithStatus } from '../types';

/**
 * Main Export: Manages the connection logic
 */
export async function manageObsConnection() {
    const obsWss = ensureGlobalObsWss();
    setupEventListeners(obsWss);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Automated connection attempts
    const methods = [
        fetchApiDetails,
        getLocalStorageDetails,
        getCssVariableDetails,
        getUrlParamDetails,
        () => window.websocketDetails || null
    ];

    for (const method of methods) {
        const details = await method();
        if (details && (await connectOBS(obsWss, details)) === 'connected') {
            return; // Success
        }
    }

    // FALLBACK: If all automated methods fail, show the custom modal
    console.warn("All automated connection methods failed. Prompting user with custom modal.");
    showConnectionModal(obsWss, "Could not connect automatically. Please enter details.");
}

/**
 * Fallback: Show a custom connection modal
 */
function showConnectionModal(obsWss: OBSWebSocketWithStatus, initialMessage?: string) {
    const modal = document.getElementById('connectionModal') as HTMLElement;
    const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
    const portInput = document.getElementById('connectPort') as HTMLInputElement;
    const passwordInput = document.getElementById('connectPassword') as HTMLInputElement;
    const errorDiv = document.getElementById('connectionError') as HTMLElement;

    if (!modal || !connectBtn || !portInput || !passwordInput || !errorDiv) return;

    // Show initial error message if provided
    if (initialMessage) {
        errorDiv.innerText = initialMessage;
        errorDiv.style.display = 'block';
    } else {
        errorDiv.style.display = 'none';
    }

    modal.style.display = 'block';
    passwordInput.focus();

    // Use a one-time listener to handle the connect click
    connectBtn.onclick = async () => {
        const manualDetails: WSSDetails = {
            IP: 'localhost',
            PORT: portInput.value,
            PW: passwordInput.value
        };

        // Provide visual feedback
        connectBtn.innerText = 'Connecting...';
        connectBtn.disabled = true;

        const result = await connectOBS(obsWss, manualDetails);

        // Reset button state
        connectBtn.innerText = 'Connect';
        connectBtn.disabled = false;

        if (result === 'connected') {
            modal.style.display = 'none'; // Hide on success
        } else {
            // Show error and keep modal open for another try
            errorDiv.innerText = 'Connection failed. Please check Port and Password.';
            errorDiv.style.display = 'block';
        }
    };
}


/**
 * Helpers: Instance Management
 */
function ensureGlobalObsWss(): OBSWebSocketWithStatus {
    if (!window.obsWss) {
        window.obsWss = new OBSWebSocket() as OBSWebSocketWithStatus;
    }
    if (typeof window.obsWss.connected === 'undefined') window.obsWss.connected = false;
    if (typeof window.obsWss.status === 'undefined') window.obsWss.status = 'disconnected';
    return window.obsWss;
}

function setupEventListeners(obsWss: OBSWebSocketWithStatus) {
    obsWss.off('ConnectionOpened', updateStatusOpened);
    obsWss.off('ConnectionClosed', updateStatusClosed);
    obsWss.off('Identified', updateStatusIdentified);
    obsWss.on('ConnectionOpened', updateStatusOpened);
    obsWss.on('ConnectionClosed', updateStatusClosed);
    obsWss.on('Identified', updateStatusIdentified);
}

const updateStatusOpened = () => { if (window.obsWss) window.obsWss.status = 'connected'; };
const updateStatusClosed = () => { if (window.obsWss) { window.obsWss.status = 'disconnected'; window.obsWss.connected = false; } };
const updateStatusIdentified = () => { if (window.obsWss) window.obsWss.connected = true; };


/**
 * Connection Logic
 */
async function connectOBS(obsWss: OBSWebSocketWithStatus, wssDetails: WSSDetails): Promise<'connected' | 'failed'> {
    try {
        await obsWss.disconnect().catch(() => {}); // Gracefully disconnect if already connected
        await obsWss.connect(`ws://${wssDetails.IP}:${wssDetails.PORT}`, wssDetails.PW, { rpcVersion: 1 });
        obsWss.status = 'connected';
        obsWss.connected = true;
        localStorage.setItem('wssDetails', JSON.stringify(wssDetails)); // Cache successful connection
        return 'connected';
    } catch (error) {
        const err = error as OBSWebSocketError;
        console.error(`Failed to connect to ${wssDetails.IP}:${wssDetails.PORT}`, err.message);
        obsWss.status = 'disconnected';
        obsWss.connected = false;
        return 'failed';
    }
}


/**
 * Data Retrieval Helpers
 */
async function fetchApiDetails(): Promise<WSSDetails | null> {
    try {
        const res = await fetch('/api/obswss');
        if (res.ok) return await res.json();
    } catch (e) {}
    return null;
}

function getLocalStorageDetails(): WSSDetails | null {
    try {
        const data = localStorage.getItem('wssDetails');
        return data ? JSON.parse(data) : null;
    } catch { return null; }
}

function getCssVariableDetails(): WSSDetails | null {
    try {
        const cssVar = getComputedStyle(document.body).getPropertyValue('--websocket-details').trim().replace(/^['"]|['"]$/g, '');
        return cssVar ? JSON.parse(cssVar) : null;
    } catch { return null; }
}

function getUrlParamDetails(): WSSDetails | null {
    const params = new URLSearchParams(window.location.search);
    const IP = params.get('wssip');
    const PORT = params.get('wssport');
    if (IP && PORT) return { IP, PORT, PW: params.get('wsspw') || '' };
    return null;
}