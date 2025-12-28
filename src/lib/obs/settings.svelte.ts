/**
 * @file Manages application settings and persistence.
 * @module settings
 */

/**
 * Discovery method for finding dynamic nodes.
 * 'css': Scans Browser Source Custom CSS settings.
 * 'broadcast': Uses OBS custom broadcast events for discovery.
 */
export type DiscoveryMethod = 'css' | 'broadcast';

class SettingsManager {
    /** @private */
    #discoveryMethod = $state<DiscoveryMethod>(
        (localStorage.getItem('flow_discovery_method') as DiscoveryMethod) || 'css'
    );

    /**
     * The current method used to discover dynamic browser nodes.
     * @type {DiscoveryMethod}
     */
    get discoveryMethod() {
        return this.#discoveryMethod;
    }

    set discoveryMethod(value: DiscoveryMethod) {
        this.#discoveryMethod = value;
        localStorage.setItem('flow_discovery_method', value);
    }

    constructor() {}

    /**
     * Toggles between 'css' and 'broadcast' discovery methods.
     */
    toggleDiscoveryMethod() {
        this.discoveryMethod = this.discoveryMethod === 'css' ? 'broadcast' : 'css';
    }
}

/**
 * Singleton instance of the SettingsManager.
 */
export const settings = new SettingsManager();
