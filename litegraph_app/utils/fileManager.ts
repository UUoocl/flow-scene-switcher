import { LGraph } from "litegraph.js";
import { SaveFileBody, StorageSource } from '../types';

const SAVED_FOLDER = "block-scene-switcher/saved";
const LOCAL_PREFIX = "obs_flow_lg_"; // Changed prefix to avoid conflicts with old blockly files

export function initFileHandlers(graph: LGraph) {
    initSaveModal(graph);
    initLoadModal(graph);
}

export async function loadAndInject(filename: string, source: StorageSource, graph: LGraph): Promise<boolean> {
    try {
        let data: any;
        if (source === 'obsidian') {
            data = await loadFromObsidian(filename);
        } else {
            data = loadFromLocal(filename);
        }
        
        graph.configure(data);
        return true;
    } catch (e) {
        console.error("Auto-load failed:", e);
        return false;
    }
}

// ... initSaveModal (logic mostly identical, just changing serialization) ...

function initSaveModal(graph: LGraph) {
    const saveBtn = document.getElementById('save');
    const modal = document.getElementById('saveModal');
    const closeBtn = document.getElementById('closeSave');
    const cancelBtn = document.getElementById('cancelSave');
    const confirmBtn = document.getElementById('confirmSave');
    const filenameInput = document.getElementById('saveFilename') as HTMLInputElement;
    const sourceSelect = document.getElementById('saveSource') as HTMLSelectElement;

    if (!saveBtn || !modal || !confirmBtn) return;

    saveBtn.addEventListener('click', () => {
        modal.style.display = "block";
        if (filenameInput) filenameInput.focus();
    });

    const closeModal = () => modal.style.display = "none";
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    confirmBtn.addEventListener('click', async () => {
        const filename = filenameInput ? filenameInput.value.trim() : "default";
        const source = sourceSelect ? (sourceSelect.value as StorageSource) : 'local';
        
        // LITEGRAPH SERIALIZATION
        const data = graph.serialize();

        if (source === 'obsidian') {
            await saveToObsidian(filename, data);
        } else {
            saveToLocal(filename, data);
        }
        
        closeModal();
    });
}

// ... Saving Logic (Keep existing fetch/localStorage calls from original, just ensure payload uses `data` var) ...

async function saveToObsidian(filename: string, data: unknown) {
    // (Same as original code)
    const payload: SaveFileBody = { folder: SAVED_FOLDER, filename, data };
    const res = await fetch('/api/file/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
    if(res.ok) alert("Saved!");
}

function saveToLocal(filename: string, data: unknown) {
    localStorage.setItem(LOCAL_PREFIX + filename, JSON.stringify(data));
    alert("Saved Locally!");
}

// ... Load Logic (UI logic same as original) ...

async function loadFromObsidian(filename: string) {
    const params = new URLSearchParams({ folder: SAVED_FOLDER, filename });
    const res = await fetch(`/api/file/get?${params.toString()}`);
    if (!res.ok) throw new Error("Download failed");
    return await res.json();
}

function loadFromLocal(filename: string) {
    const dataStr = localStorage.getItem(LOCAL_PREFIX + filename);
    if (!dataStr) throw new Error("File not found");
    return JSON.parse(dataStr);
}

// ... Refresh File List Logic (Same as original, just update fetchLocalList to use new prefix) ...
function fetchLocalList(): string[] {
    const files: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_PREFIX)) {
            files.push(key.replace(LOCAL_PREFIX, ''));
        }
    }
    return files;
}

// Re-implement `initLoadModal` and `refreshFileList` exactly as before but passing `graph` instead of workspace.
function initLoadModal(graph: LGraph) {
    const loadBtn = document.getElementById('load');
    const modal = document.getElementById('loadModal');
    const closeBtn = document.getElementById('closeLoad');
    const tabs = document.querySelectorAll('.tab-btn');
    let currentSource: StorageSource = 'obsidian';

    if (!loadBtn || !modal) return;
    
    loadBtn.addEventListener('click', () => {
        modal.style.display = "block";
        refreshFileList(currentSource, graph, modal);
    });

    closeBtn?.addEventListener('click', () => modal.style.display = "none");

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            (e.target as HTMLElement).classList.add('active');
            currentSource = (e.target as HTMLElement).dataset.source as StorageSource;
            refreshFileList(currentSource, graph, modal);
        });
    });
}

async function refreshFileList(source: StorageSource, graph: LGraph, modal: HTMLElement) {
    const container = document.getElementById('fileList');
    if (!container) return;
    container.innerHTML = "Loading...";
    
    // (Fetch logic similar to original, use `loadAndInject` defined above)
    let files: string[] = source === 'obsidian' ? await fetchObsidianList() : fetchLocalList();
    
    container.innerHTML = '';
    files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerText = file;
        div.onclick = async () => {
            await loadAndInject(file, source, graph);
            modal.style.display = "none";
        };
        container.appendChild(div);
    });
}

async function fetchObsidianList(): Promise<string[]> {
    try {
        const params = new URLSearchParams({ folder: SAVED_FOLDER });
        const res = await fetch(`/api/file/list?${params.toString()}`);
        return res.ok ? await res.json() : [];
    } catch { return []; }
}