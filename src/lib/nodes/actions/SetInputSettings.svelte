<script lang="ts">
  /**
   * @file Svelte Flow node for setting input settings of an OBS source.
   * @module SetInputSettings
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  /**
   * @typedef {object} SetInputSettingsData
   * @property {string} inputName - The name of the OBS input.
   * @property {string} settings - A JSON string representing the settings to apply.
   * @property {boolean} overlay - Whether to overlay the settings.
   * @property {string} [label] - The display label for the node.
   */
  interface SetInputSettingsData extends Record<string, unknown> {
      inputName: string;
      settings: string;
      overlay: boolean;
  }

  let { data }: { data: SetInputSettingsData } = $props();

  $effect(() => {
    if (!data.inputName) data.inputName = '';
    if (!data.settings) data.settings = '{}';
    if (data.overlay === undefined) data.overlay = true;
  });
</script>

<div class="node-card action-node">
  <Handle type="target" position={Position.Left} id="trigger" class="handle-trigger" />

  <div class="node-header">
    <span class="icon">⚙️</span>
    <span class="title">Set Input Settings</span>
  </div>
  
  <div class="node-body flex flex-col gap-2">
    <div>
      <label for="inputName" class="block text-xs font-medium text-gray-700">Input Name</label>
      <input 
        id="inputName"
        type="text" 
        class="w-full text-xs border border-gray-300 rounded p-1"
        bind:value={data.inputName}
      />
    </div>
    
    <div>
      <label for="settingsJson" class="block text-xs font-medium text-gray-700">Settings (JSON)</label>
      <textarea 
        id="settingsJson"
        class="w-full text-xs border border-gray-300 rounded p-1 h-16 font-mono"
        bind:value={data.settings}
      ></textarea>
    </div>

    <div class="flex items-center gap-2">
      <input 
        type="checkbox" 
        bind:checked={data.overlay}
        id="overlay-cb"
      />
      <label for="overlay-cb" class="text-xs font-medium text-gray-700">Overlay</label>
    </div>
  </div>

  <Handle type="source" position={Position.Right} id="done" class="handle-trigger" />
</div>
