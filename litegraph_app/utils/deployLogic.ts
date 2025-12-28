import { LGraph, LGraphCanvas } from "litegraph.js";

let isDeployed = false;
let activeGraph: LGraph | null = null;

export function initDeployHandlers(graph: LGraph, canvas: LGraphCanvas) {
    activeGraph = graph;
    const deployBtn = document.getElementById('deploy');
    if (!deployBtn) return;

    updateButtonStyle(deployBtn, false);

    deployBtn.addEventListener('click', () => {
        if (isDeployed) {
            stopDeployment();
        } else {
            triggerDeployment();
        }
    });
}

export function forceStopDeployment() {
    if (isDeployed) {
        stopDeployment(); 
    }
}

// --- Start the Logic ---
export function triggerDeployment() {
    if (!window.obsWss || !window.obsWss.connected) {
        console.warn("Cannot deploy: OBS not connected.");
        alert("OBS is not connected.");
        return;
    }

    if (!activeGraph) return;

    console.log("Starting Graph Logic...");
    
    // 1. Start LiteGraph Engine
    activeGraph.start();
    
    // 2. Register OBS Listeners to trigger Graph Nodes
    registerObsListeners(activeGraph);

    isDeployed = true;
    const btn = document.getElementById('deploy');
    if (btn) updateButtonStyle(btn, true);
}

function stopDeployment() {
    console.log("Stopping Logic...");
    
    if (activeGraph) {
        activeGraph.stop();
    }
    
    // Unhook OBS listeners
    removeObsListeners();

    isDeployed = false;
    const btn = document.getElementById('deploy');
    if (btn) updateButtonStyle(btn, false);
}

// --- Bridge OBS WebSocket -> LiteGraph Nodes ---

const trackedEvents = [
    { key: 'CurrentProgramSceneChanged', nodeType: 'obs/events/scene_changed' },
    { key: 'InputMuteStateChanged', nodeType: 'obs/events/mute_changed' },
    { key: 'StreamStateChanged', nodeType: 'obs/events/stream_state' },
    { key: 'InputSettingsChanged', nodeType: 'obs/events/input_settings' }
];

function registerObsListeners(graph: LGraph) {
    if (!window.obsWss) return;

    trackedEvents.forEach(evt => {
        const listener = (data: any) => {
            // Find all nodes in the graph of this specific type
            const nodes = graph.findNodesByType(evt.nodeType);
            nodes.forEach((node: any) => {
                // Call the custom method we defined in ObsEventNode
                if (node.triggerEvent) {
                    node.triggerEvent(data);
                }
            });
        };
        
        // Store listener ref on window to remove later (simplified storage)
        (window as any)[`_listener_${evt.key}`] = listener;
        window.obsWss.on(evt.key as any, listener);
    });
}

function removeObsListeners() {
    if (!window.obsWss) return;

    trackedEvents.forEach(evt => {
        const listener = (window as any)[`_listener_${evt.key}`];
        if (listener) {
            window.obsWss!.off(evt.key as any, listener);
            delete (window as any)[`_listener_${evt.key}`];
        }
    });
}

function updateButtonStyle(btn: HTMLElement, active: boolean) {
    if (active) {
        btn.innerText = "Stop Logic";
        btn.style.backgroundColor = "#FF9800"; 
    } else {
        btn.innerText = "Start Logic";
        btn.style.backgroundColor = "#2196F3"; 
    }
}