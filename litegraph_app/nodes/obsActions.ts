import { LGraphNode, LiteGraph } from "litegraph.js";

// Global Scenes list for dropdowns
export let availableScenes: string[] = ["Scene 1"];

export function updateSceneList(scenes: { sceneName: string }[]) {
    availableScenes = scenes.map(s => s.sceneName);
}

// --- Set Scene ---
export class ObsSetSceneNode extends LGraphNode {
    static title = "Set Scene";

    constructor() {
        super();
        this.title = "Set Scene";
        
        // Fix 2: Ensure width covers title + widgets
        this.size = [180, 60];

        this.addInput("Exec", LiteGraph.ACTION);
        this.addInput("Scene Name", "string");
        this.addOutput("Done", LiteGraph.EVENT);
        
        this.addWidget("combo", "Scene", availableScenes[0], (v) => {
            this.properties.scene = v;
        }, { values: () => availableScenes });

        this.properties = { scene: "" };
    }

    onAction(action: any) {
        const sceneName = this.getInputData(1) || this.properties.scene;
        if (window.obsWss && window.obsWss.connected && sceneName) {
            window.obsWss.call('SetCurrentProgramScene', { sceneName })
                .then(() => this.triggerSlot(0))
                .catch(err => console.error("OBS Error:", err));
        }
    }
}

// --- Set Mute ---
export class ObsSetMuteNode extends LGraphNode {
    static title = "Set Mute";

    constructor() {
        super();
        this.title = "Set Mute";
        this.size = [200, 80]; // Extra height for multiple widgets

        this.addInput("Exec", LiteGraph.ACTION);
        this.addInput("Input Name", "string");
        this.addInput("Mute", "boolean");
        this.addOutput("Done", LiteGraph.EVENT);

        this.properties = { inputName: "Mic/Aux", mute: true };
        this.addWidget("text", "Input", "Mic/Aux", (v) => this.properties.inputName = v);
        this.addWidget("toggle", "Mute", true, (v) => this.properties.mute = v);
    }

    onAction() {
        const inputName = this.getInputData(1) || this.properties.inputName;
        let mute = this.getInputData(2);
        if (mute === undefined) mute = this.properties.mute;

        if (window.obsWss && window.obsWss.connected) {
            window.obsWss.call('SetInputMute', { inputName, inputMuted: mute })
                .then(() => this.triggerSlot(0))
                .catch(err => console.error("OBS Error:", err));
        }
    }
}

// --- Control Stream ---
export class ObsControlStreamNode extends LGraphNode {
    static title = "Control Stream";

    constructor() {
        super();
        this.title = "Control Stream";
        this.size = [180, 60];

        this.addInput("Exec", LiteGraph.ACTION);
        this.addOutput("Done", LiteGraph.EVENT);
        
        this.properties = { action: "ToggleStream" };
        this.addWidget("combo", "Action", "ToggleStream", (v) => this.properties.action = v, { 
            values: ["StartStream", "StopStream", "ToggleStream"] 
        });
    }

    onAction() {
        if (window.obsWss && window.obsWss.connected) {
            window.obsWss.call(this.properties.action as any)
                .then(() => this.triggerSlot(0))
                .catch(err => console.error("OBS Error:", err));
        }
    }
}

// --- Set Input Settings (JSON) ---
export class ObsSetInputSettingsNode extends LGraphNode {
    static title = "Set Input Settings";

    constructor() {
        super();
        this.title = "Set Input Settings";
        this.size = [240, 100]; // Wide and Tall for JSON input usage

        this.addInput("Exec", LiteGraph.ACTION);
        this.addInput("Input Name", "string");
        this.addInput("Settings (JSON)", "string");
        this.addOutput("Done", LiteGraph.EVENT);

        this.properties = { inputName: "", overlay: true };
        this.addWidget("text", "Input", "", (v) => this.properties.inputName = v);
        this.addWidget("toggle", "Overlay", true, (v) => this.properties.overlay = v);
    }

    onAction() {
        const inputName = this.getInputData(1) || this.properties.inputName;
        const settingsStr = this.getInputData(2);
        const overlay = this.properties.overlay;

        if (window.obsWss && window.obsWss.connected && inputName) {
            try {
                const settingsObj = typeof settingsStr === 'object' ? settingsStr : JSON.parse(settingsStr || "{}");
                
                window.obsWss.call('SetInputSettings', { 
                    inputName, 
                    inputSettings: settingsObj,
                    overlay 
                }).then(() => this.triggerSlot(0));
            } catch (e) {
                console.error("Invalid JSON for settings", e);
            }
        }
    }
}


export function registerActionNodes() {
    LiteGraph.registerNodeType("obs/actions/set_scene", ObsSetSceneNode);
    LiteGraph.registerNodeType("obs/actions/set_mute", ObsSetMuteNode);
    LiteGraph.registerNodeType("obs/actions/control_stream", ObsControlStreamNode);
    LiteGraph.registerNodeType("obs/actions/set_input_settings", ObsSetInputSettingsNode);
}