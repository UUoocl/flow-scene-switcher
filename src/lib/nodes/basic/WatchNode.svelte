<script lang="ts">
  /**
   * @file Svelte Flow node to display the value of its input.
   * @module WatchNode
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  /**
   * @typedef {object} WatchNodeData
   * @property {any} value - The value currently displayed by the node.
   * @property {string} [label] - The display label for the node.
   */
  interface WatchData extends Record<string, unknown> {
      value: any;
      label?: string;
  }

  let { data }: { data: WatchData } = $props();

  // The GraphRunner will update data.value when it executes/evaluates
</script>

<div class="node-card min-w-[120px] border-yellow-400">
  <Handle type="target" position={Position.Left} id="input" class="!bg-yellow-500 !w-3 !h-3" />

  <div class="node-header bg-yellow-100 border-yellow-200">
    <span class="title text-yellow-900">Watch</span>
  </div>
  
  <div class="node-body">
    <div class="bg-black text-green-400 font-mono text-xs p-2 rounded min-h-[24px] break-all">
      {JSON.stringify(data.value ?? '...', null, 2)}
    </div>
  </div>
</div>