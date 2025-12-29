<script lang="ts">
  /**
   * @file Component for selecting and adding different types of nodes to the flow graph.
   * @module NodeSelector
   */
  import { obs } from '../obs/obs.svelte';
  import { type Node } from '@xyflow/svelte';
  import { LOCAL_PREFIX, CUSTOM_NODES } from '../constants';
  import { onMount } from 'svelte';
  import { nanoid } from 'nanoid';

  /**
   * @typedef {object} NodeSelectorProps
   * @property {(type: string, label: string, extraData?: any) => void} onAdd - Callback function when a node is added.
   */
  let { onAdd }: { onAdd: (type: string, label: string, extraData?: any) => void } = $props();

  // Presets State
  let customPresets = $state<{name: string, data: any}[]>([]);

  const eventNodes = [
    { type: 'obs/events/scene_changed', label: 'Scene Changed' },
    { type: 'obs/events/mute_changed', label: 'Mute Changed' },
    { type: 'obs/events/stream_state', label: 'Stream State' },
    { type: 'obs/events/input_settings', label: 'Input Settings' },
  ];

  const actionNodes = [
    { type: 'obs/actions/set_scene', label: 'Set Scene' },
    { type: 'obs/actions/set_mute', label: 'Set Mute' },
    { type: 'obs/actions/control_stream', label: 'Control Stream' },
    { type: 'obs/actions/set_input_settings', label: 'Set Settings' },
    { type: 'obs/broadcast_event', label: 'Broadcast Event' },
  ];

  const logicNodes = [
    { type: 'logic/branch', label: 'Branch (If/Else)' },
  ];

  const basicNodes = [
    { type: 'basic/number', label: 'Number' },
    { type: 'basic/string', label: 'String' },
    { type: 'basic/boolean', label: 'Boolean' },
    { type: 'basic/watch', label: 'Watch' },
    { type: 'basic/object', label: 'Object Builder' },
  ];

  const mathNodes = [
    { type: 'math/operation', label: 'Math Op' },
    { type: 'math/compare', label: 'Compare' },
  ];

  async function loadCustomPresets() {
      const presets: {name: string, data: any}[] = [];

      // 1. LocalStorage
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${LOCAL_PREFIX}custom_`)) {
              const name = key.replace(`${LOCAL_PREFIX}custom_`, '');
              try {
                  const data = JSON.parse(localStorage.getItem(key) || '{}');
                  presets.push({ name, data });
              } catch {}
          }
      }

      // 2. Obsidian (via API)
      try {
          const params = new URLSearchParams({ folder: CUSTOM_NODES });
          const res = await fetch(`/api/file/list?${params.toString()}`);
          if (res.ok) {
              const files: string[] = await res.json();
              for (const filename of files) {
                   // Avoid duplicates from local if name matches?
                   // For now, let's just append with source indication or check existence
                   if (!presets.find(p => p.name === filename)) {
                        const pParams = new URLSearchParams({ folder: CUSTOM_NODES, filename });
                        const pRes = await fetch(`/api/file/get?${pParams.toString()}`);
                        if (pRes.ok) {
                            const data = await pRes.json();
                            presets.push({ name: filename, data });
                        }
                   }
              }
          }
      } catch (e) {
          console.error("Failed to load obsidian presets", e);
      }

      customPresets = presets;
  }

  function addPreset(preset: {name: string, data: any}) {
      // Create deep copy of data and regen IDs
      const data = JSON.parse(JSON.stringify(preset.data));
      if (data.inputs) {
          data.inputs = data.inputs.map((i: any) => ({ ...i, id: nanoid(6) }));
      }
      onAdd('obs/broadcast_event', data.label || preset.name, data);
  }

  $effect(() => {
      // Load presets when component mounts
      loadCustomPresets();
  });
</script>

<div class="absolute top-4 left-4 bg-white p-2 rounded shadow-md z-10 border border-gray-200 h-[80vh] overflow-y-auto w-48">
  <h3 class="text-xs font-bold text-gray-500 uppercase mb-2 flex justify-between">
      <span>Saved Presets</span>
      <button onclick={loadCustomPresets} class="text-[10px] bg-gray-100 px-1 rounded">🔄</button>
  </h3>
  <div class="flex flex-col gap-1 mb-4">
      {#each customPresets as preset}
          <button 
              onclick={() => addPreset(preset)}
              class="text-left text-xs bg-purple-100 hover:bg-purple-200 text-purple-900 px-2 py-1 rounded border border-purple-300"
              title={preset.name}
          >
              {preset.name}
          </button>
      {/each}
      {#if customPresets.length === 0}
          <span class="text-[10px] text-gray-400 italic px-2">No saved presets</span>
      {/if}
  </div>

  <h3 class="text-xs font-bold text-gray-500 uppercase mb-2">Events</h3>
  <div class="flex flex-col gap-1 mb-4">
    {#each eventNodes as node}
        <button 
            onclick={() => onAdd(node.type, node.label)}
            class="text-left text-xs bg-purple-50 hover:bg-purple-100 text-purple-900 px-2 py-1 rounded border border-purple-200"
        >
            {node.label}
        </button>
    {/each}
  </div>

  <h3 class="text-xs font-bold text-gray-500 uppercase mb-2">Logic & Flow</h3>
  <div class="flex flex-col gap-1 mb-4">
    {#each logicNodes as node}
        <button 
            onclick={() => onAdd(node.type, node.label)}
            class="text-left text-xs bg-orange-50 hover:bg-orange-100 text-orange-900 px-2 py-1 rounded border border-orange-200"
        >
            {node.label}
        </button>
    {/each}
  </div>

  <h3 class="text-xs font-bold text-gray-500 uppercase mb-2">Actions</h3>
  <div class="flex flex-col gap-1 mb-4">
    {#each actionNodes as node}
        <button 
            onclick={() => onAdd(node.type, node.label)}
            class="text-left text-xs bg-blue-50 hover:bg-blue-100 text-blue-900 px-2 py-1 rounded border border-blue-200"
        >
            {node.label}
        </button>
    {/each}
  </div>

  <h3 class="text-xs font-bold text-gray-500 uppercase mb-2 flex justify-between items-center px-1">
    <span>Browser Sources</span>
    <button 
        onclick={() => obs.discoverBrowserNodes()}
        class="text-[10px] bg-gray-100 hover:bg-gray-200 px-1 rounded border border-gray-300 transition-colors"
        title="Refresh Discovery"
    >
        🔄
    </button>
  </h3>
  <div class="flex flex-col gap-1 mb-4">
    {#each obs.browserNodes as node}
        <button 
            onclick={() => onAdd('obs/browser_source', node.sourceName, { definition: node })}
            class="text-left text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-2 py-1 rounded border border-emerald-200 truncate"
            title={node.sourceName}
        >
            {node.sourceName}
        </button>
    {/each}
    {#if obs.browserNodes.length === 0}
        <span class="text-[10px] text-gray-400 italic px-2">None discovered</span>
    {/if}
  </div>

  <h3 class="text-xs font-bold text-gray-500 uppercase mb-2">Math</h3>
  <div class="flex flex-col gap-1 mb-4">
    {#each mathNodes as node}
        <button 
            onclick={() => onAdd(node.type, node.label)}
            class="text-left text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-2 py-1 rounded border border-indigo-200"
        >
            {node.label}
        </button>
    {/each}
  </div>

  <h3 class="text-xs font-bold text-gray-500 uppercase mb-2">Basic Data</h3>
  <div class="flex flex-col gap-1">
    {#each basicNodes as node}
        <button 
            onclick={() => onAdd(node.type, node.label)}
            class="text-left text-xs bg-gray-50 hover:bg-gray-100 text-gray-900 px-2 py-1 rounded border border-gray-200"
        >
            {node.label}
        </button>
    {/each}
  </div>
</div>