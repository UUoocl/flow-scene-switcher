/**
 * @file Main entry point for the Svelte application.
 * @module main
 */

import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

/**
 * Mounts the main {@link App} component to the DOM.
 * @returns {App} The mounted Svelte application instance.
 */
const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
