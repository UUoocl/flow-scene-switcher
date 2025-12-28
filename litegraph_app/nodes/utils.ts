import { LGraphNode, LiteGraph } from "litegraph.js";

export class ConsoleLogNode extends LGraphNode {
    constructor() {
        super();
        this.title = "Console Log";
        this.addInput("Exec", LiteGraph.ACTION);
        this.addInput("Message", 0); // Any type
        this.addOutput("Done", LiteGraph.EVENT);
    }

    onAction() {
        const msg = this.getInputData(1);
        console.log("[Graph Log]:", msg);
        this.triggerSlot(0);
    }
}

export function registerUtilNodes() {
    LiteGraph.registerNodeType("utils/console_log", ConsoleLogNode);
}