import { LGraphNode, LiteGraph } from "litegraph.js";

// Base class for OBS Event Nodes
class BaseObsEventNode extends LGraphNode {
    eventKey: string;

    constructor(title: string, eventKey: string) {
        super();
        this.title = title;
        this.eventKey = eventKey;
        
        // FIX 2: Auto-resize width based on title length
        // Base width 140, add 9px per extra character
        const minWidth = 140;
        const estimatedWidth = title.length * 9 + 40; 
        this.size = [Math.max(minWidth, estimatedWidth), 60];

        // Output 0 is the execution trigger, Output 1 is the Data object
        this.addOutput("On Event", LiteGraph.EVENT); 
        this.addOutput("Data", "object");
    }

    triggerEvent(data: any) {
        this.setOutputData(1, data);
        this.triggerSlot(0, data);
    }
}

// --- Specific Implementations ---

export class ObsSceneChangedNode extends BaseObsEventNode {
    // FIX 1: Static title prevents minification from mangling the menu name
    static title = "On Scene Changed";
    
    constructor() {
        super("On Scene Changed", "CurrentProgramSceneChanged");
    }
}

export class ObsMuteChangedNode extends BaseObsEventNode {
    static title = "On Mute Changed";

    constructor() {
        super("On Mute Changed", "InputMuteStateChanged");
    }
}

export class ObsStreamStateNode extends BaseObsEventNode {
    static title = "On Stream State";

    constructor() {
        super("On Stream State", "StreamStateChanged");
    }
}

export class ObsInputSettingsNode extends BaseObsEventNode {
    static title = "On Input Settings";

    constructor() {
        super("On Input Settings", "InputSettingsChanged");
    }
}

// Register Nodes
export function registerEventNodes() {
    // The key string 'obs/events/...' defines the folder structure
    LiteGraph.registerNodeType("obs/events/scene_changed", ObsSceneChangedNode);
    LiteGraph.registerNodeType("obs/events/mute_changed", ObsMuteChangedNode);
    LiteGraph.registerNodeType("obs/events/stream_state", ObsStreamStateNode);
    LiteGraph.registerNodeType("obs/events/input_settings", ObsInputSettingsNode);
}