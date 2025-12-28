import OBSWebSocket from 'obs-websocket-js';

// --- OBS Connection Types ---
export interface WSSDetails {
    IP: string;
    PORT: string;
    PW?: string;
}

export type OBSWebSocketWithStatus = OBSWebSocket & {
    status: 'connected' | 'disconnected';
    connected: boolean;
};

// --- API Types ---
export interface SaveFileBody {
    folder: string;
    filename: string;
    data: unknown;
}

export interface FileListQuery {
    folder: string;
}

export interface GetFileQuery {
    folder: string;
    filename: string;
}

// --- Storage Types ---
export type StorageSource = 'obsidian' | 'local';

// --- Global Scope ---
declare global {
    interface Window {
        obsWss?: OBSWebSocketWithStatus;
        websocketDetails?: WSSDetails;
    }
}