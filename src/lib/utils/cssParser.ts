/**
 * @file Utility functions for parsing flow definitions from CSS.
 * @module cssParser
 */

/**
 * Represents a single input or output port on a dynamic browser node.
 */
export interface FlowPort {
    /** The name of the port, derived from the CSS variable. */
    name: string;
    /** The data type of the port (e.g., 'number', 'string'). */
    type: string;
    /** For outputs, the custom event name to listen for. */
    broadcastName?: string;
}

/**
 * Represents the complete definition of a dynamic browser node,
 * including its source name and its inputs/outputs.
 */
export interface BrowserNodeDefinition {
    /** The name of the OBS browser source. */
    sourceName: string;
    /** An array of input ports. */
    inputs: FlowPort[];
    /** An array of output ports. */
    outputs: FlowPort[];
}

/**
 * Parses a CSS string to find flow input and output definitions.
 * @param {string} sourceName - The name of the OBS source being parsed.
 * @param {string} css - The CSS content to parse.
 * @returns {BrowserNodeDefinition | null} A definition object if flow variables are found, otherwise null.
 */
export function parseFlowCSS(sourceName: string, css: string): BrowserNodeDefinition | null {
    const inputs: FlowPort[] = [];
    const outputs: FlowPort[] = [];

    // Regex to match --flow-input-name: type;
    const inputRegex = /--flow-input-([a-zA-Z0-9-_]+):\s*([a-zA-Z0-9]+)/g;
    // Regex to match --flow-output-name: type;
    const outputRegex = /--flow-output-([a-zA-Z0-9-_]+):\s*([a-zA-Z0-9]+)/g;

    let match;
    while ((match = inputRegex.exec(css)) !== null) {
        inputs.push({ name: match[1], type: match[2].toLowerCase() });
    }

    while ((match = outputRegex.exec(css)) !== null) {
        outputs.push({ 
            name: match[1], 
            type: match[2].toLowerCase(),
            broadcastName: match[1] // Default to variable name as broadcastName
        });
    }

    if (inputs.length === 0 && outputs.length === 0) return null;

    return {
        sourceName,
        inputs,
        outputs
    };
}
