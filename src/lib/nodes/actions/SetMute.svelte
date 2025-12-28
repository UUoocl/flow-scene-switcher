<script lang="ts">
  /**
   * @file Svelte Flow node for setting the mute state of an OBS input.
   * @module SetMute
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  /**
   * @typedef {object} SetMuteData
   * @property {string} inputName - The name of the OBS input to mute/unmute.
   * @property {boolean} mute - The desired mute state (true for muted, false for unmuted).
   * @property {string} [label] - The display label for the node.
   */
  interface SetMuteData extends Record<string, unknown> {
      inputName: string;
      mute: boolean;
  }

  let { data }: { data: SetMuteData } = $props();

  // Initialize defaults
  $effect(() => {
      if (!data.inputName) data.inputName = 'Mic/Aux';
      if (data.mute === undefined) data.mute = true;
  });
</script>

<div class="node-card action-node">
  <Handle type="target" position={Position.Left} id="trigger" class="handle-trigger" />

  <div class="node-header">
    <span class="icon">🔇</span>
    <span class="title">Set Mute</span>
  </div>
  
  <div class="node-body flex flex-col gap-2">
    <div>
      <label for="inputName" class="block text-xs font-medium text-gray-700">Input Name</label>
      <input 
        id="inputName"
        type="text" 
        class="w-full text-xs border border-gray-300 rounded p-1"
        bind:value={data.inputName}
        placeholder="Mic/Aux"
      />
    </div>
    <div class="flex items-center gap-2">
      <input 
        type="checkbox" 
        bind:checked={data.mute}
        id="mute-cb"
      />
      <label for="mute-cb" class="text-xs font-medium text-gray-700">Mute</label>
    </div>
  </div>

  <Handle type="source" position={Position.Right} id="done" class="handle-trigger" />
</div>
