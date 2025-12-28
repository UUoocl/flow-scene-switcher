<script lang="ts">
  /**
   * @file Modal component for application settings.
   * @module SettingsModal
   */
  import { settings } from '../obs/settings.svelte';

  let showModal = $state(false);

  /**
   * Opens the settings modal.
   */
  export function open() {
      showModal = true;
  }

  /**
   * Closes the settings modal.
   */
  function close() {
      showModal = false;
  }
</script>

{#if showModal}
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
  <div class="bg-white p-6 rounded-lg shadow-xl w-96 flex flex-col gap-6">
      <div class="flex justify-between items-center border-b pb-2">
          <h2 class="text-xl font-bold text-gray-800">Settings</h2>
          <button onclick={close} class="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div class="flex flex-col gap-4">
          <div>
              <h3 class="text-sm font-bold text-gray-700 uppercase mb-2">Node Discovery Method</h3>
              <div class="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                  <button 
                      class="py-2 text-sm rounded-md transition-all"
                      class:bg-white={settings.discoveryMethod === 'css'}
                      class:shadow-sm={settings.discoveryMethod === 'css'}
                      class:text-blue-600={settings.discoveryMethod === 'css'}
                      onclick={() => settings.discoveryMethod = 'css'}
                  >
                      CSS Parsing
                  </button>
                  <button 
                      class="py-2 text-sm rounded-md transition-all"
                      class:bg-white={settings.discoveryMethod === 'broadcast'}
                      class:shadow-sm={settings.discoveryMethod === 'broadcast'}
                      class:text-blue-600={settings.discoveryMethod === 'broadcast'}
                      onclick={() => settings.discoveryMethod = 'broadcast'}
                  >
                      Broadcast
                  </button>
              </div>
              <p class="mt-2 text-xs text-gray-500 italic">
                  {#if settings.discoveryMethod === 'css'}
                      Scans OBS browser source Custom CSS for definitions.
                  {:else}
                      Broadcasts a request to all sources to identify themselves.
                  {/if}
              </p>
          </div>
      </div>

      <button 
          onclick={close}
          class="bg-gray-800 text-white py-2 rounded hover:bg-gray-900"
      >Done</button>
  </div>
</div>
{/if}