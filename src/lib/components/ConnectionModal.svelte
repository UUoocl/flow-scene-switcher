<script lang="ts">
  /**
   * @file Modal component for managing OBS WebSocket connection details.
   * @module ConnectionModal
   */
  import { obs } from '../obs/obs.svelte';

  let port = $state('4455');
  let password = $state('');
  let error = $state('');
  let isConnecting = $state(false);

  /**
   * Handles the connection attempt to the OBS WebSocket server.
   */
  async function handleConnect() {
    isConnecting = true;
    error = '';
    
    const result = await obs.connect({
        IP: 'localhost',
        PORT: port,
        PW: password
    });

    if (result === 'failed') {
        error = 'Connection failed. Check Port/Password.';
    }
    isConnecting = false;
  }
</script>

{#if obs.status === 'disconnected'}
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div class="bg-white p-6 rounded-lg shadow-xl w-96">
    <h2 class="text-xl font-bold mb-4 text-gray-800">Connect to OBS</h2>
    
    {#if error}
        <div class="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>
    {/if}

    <div class="space-y-4">
        <div>
            <label for="connectPort" class="block text-sm font-medium text-gray-700">Port</label>
            <input 
                id="connectPort"
                type="text" 
                bind:value={port}
                class="mt-1 w-full border border-gray-300 rounded p-2"
                placeholder="4455"
            />
        </div>
        <div>
            <label for="connectPassword" class="block text-sm font-medium text-gray-700">Password</label>
            <input 
                id="connectPassword"
                type="password" 
                bind:value={password}
                class="mt-1 w-full border border-gray-300 rounded p-2"
            />
        </div>
        
        <button 
            onclick={handleConnect}
            disabled={isConnecting}
            class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
            {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
    </div>
  </div>
</div>
{/if}