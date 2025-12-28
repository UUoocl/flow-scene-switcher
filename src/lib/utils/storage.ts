/**
 * @file Utility functions for loading and saving flow data.
 * @module storage
 */

import { LOCAL_PREFIX, SAVED_FOLDER } from '../constants';

/**
 * Loads flow data from either Obsidian (via API) or local browser storage.
 * @param {string} filename - The name of the file to load.
 * @param {'obsidian' | 'local'} source - The storage source to load from.
 * @returns {Promise<any>} A promise that resolves with the parsed flow data.
 * @throws Will throw an error if the file is not found or fails to parse.
 */
export async function loadFlowData(filename: string, source: 'obsidian' | 'local'): Promise<any> {
    if (source === 'obsidian') {
        const params = new URLSearchParams({ folder: SAVED_FOLDER, filename });
        const res = await fetch(`/api/file/get?${params.toString()}`);
        if (!res.ok) throw new Error("Download failed");
        return await res.json();
    } else {
        const str = localStorage.getItem(LOCAL_PREFIX + filename);
        if (!str) throw new Error("Not found locally");
        return JSON.parse(str);
    }
}