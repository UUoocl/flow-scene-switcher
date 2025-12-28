// 1. IMPORT STYLES
import 'litegraph.js/css/litegraph.css'; // <--- NEW IMPORT HERE
import './css/style.css';                // Your custom styles

import { LGraph, LGraphCanvas, LiteGraph } from 'litegraph.js';
import OBSWebSocket from 'obs-websocket-js';

import { OBSWebSocketWithStatus, StorageSource } from './types';
import { registerEventNodes } from './nodes/obsEvents';
import { registerActionNodes, updateSceneList } from './nodes/obsActions';
import { registerUtilNodes } from './nodes/utils';
import { manageObsConnection } from './lib/obsConnectionManager';
import { initFileHandlers, loadAndInject } from './utils/fileManager';
import { initDeployHandlers, forceStopDeployment, triggerDeployment } from './utils/deployLogic';

// 2. SETUP LITEGRAPH NODES
registerEventNodes();
registerActionNodes();
registerUtilNodes();

// ... (Rest of the file remains the same)

// 1. SETUP LITEGRAPH
registerEventNodes();
registerActionNodes();
registerUtilNodes();

const graph = new LGraph();
const canvasElem = document.getElementById('main-canvas') as HTMLCanvasElement;

// Resize canvas to fit container
function resizeCanvas() {
    const container = document.getElementById('editor-container');
    if (container && canvasElem) {
        canvasElem.width = container.clientWidth;
        canvasElem.height = container.clientHeight;
    }
}
window.addEventListener('resize', () => {
    resizeCanvas();
    if (graphCanvas) graphCanvas.resize();
});
resizeCanvas();

const graphCanvas = new LGraphCanvas(canvasElem, graph);
graphCanvas.allow_searchbox = true; // Allow right-click search

// 2. INITIALIZE GLOBAL OBJECT
window.obsWss = new OBSWebSocket() as OBSWebSocketWithStatus;

// 3. APP LOGIC EVENT LISTENERS
if (window.obsWss) {
    window.obsWss.on('Identified', async () => {
        console.log("✅ OBS Identified");
        document.getElementById('status')!.innerText = "Connected";
        document.getElementById('status')!.style.color = "#4CAF50";

        try {
            // 1. Load Scenes for Dropdowns
            const data = await window.obsWss!.call('GetSceneList');
            updateSceneList(data.scenes as any);
            
            // 2. CHECK FOR AUTO-DEPLOY
            const params = new URLSearchParams(window.location.search);
            let deployFile = params.get('deploy');
            const location = params.get('location') as StorageSource | null;

            if (deployFile && location) {
                if (location === 'obsidian') deployFile += '.json';
                
                console.log(`🚀 Auto-Deploying: ${deployFile}`);
                const success = await loadAndInject(deployFile, location, graph);
                
                if (success) {
                    setTimeout(() => {
                        triggerDeployment();
                    }, 500);
                }
            }
        } catch (e) { 
            console.error(e); 
        }
    });

    window.obsWss.on('ConnectionClosed', () => {
        document.getElementById('status')!.innerText = "Disconnected";
        document.getElementById('status')!.style.color = "red";
        forceStopDeployment();
    });
}

// 4. INITIALIZE UTILS
initFileHandlers(graph);
initDeployHandlers(graph, graphCanvas);

// 5. START CONNECTION
manageObsConnection();

// Start the drawing loop
graph.start();