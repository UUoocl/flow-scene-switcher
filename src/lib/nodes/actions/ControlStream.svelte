<script lang="ts">
  /**
   * @file Svelte Flow node for controlling the OBS stream state.
   * @module ControlStream
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  /**
   * @typedef {object} ControlStreamData
   * @property {'StartStream' | 'StopStream' | 'ToggleStream'} action - The stream action to perform.
   * @property {string} [label] - The display label for the node.
   */
  interface ControlStreamData extends Record<string, unknown> {
      action: string;
  }

  let { data }: { data: ControlStreamData } = $props();

  $effect(() => {
    if (!data.action) data.action = 'ToggleStream';
  });
</script>

<div class="node-card action-node">
  <Handle type="target" position={Position.Left} id="trigger" class="handle-trigger" />

  <div class="node-header">
    <span class="icon">📡</span>
    <span class="title">Control Stream</span>
  </div>
  
  <div class="node-body">
    <label for="actionSelect" class="block text-xs font-medium text-gray-700 mb-1">Action</label>
    <select 
      id="actionSelect"
      class="w-full text-xs border border-gray-300 rounded p-1"
      bind:value={data.action}
    >
      <option value="ToggleStream">Toggle Stream</option>
      <option value="StartStream">Start Stream</option>
      <option value="StopStream">Stop Stream</option>
    </select>
  </div>

  <Handle type="source" position={Position.Right} id="done" class="handle-trigger" />
</div>
