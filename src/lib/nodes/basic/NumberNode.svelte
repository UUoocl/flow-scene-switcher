<script lang="ts">
  /**
   * @file Svelte Flow node for a constant number value.
   * @module NumberNode
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  /**
   * @typedef {object} NumberNodeData
   * @property {number} value - The numerical value of the node.
   * @property {string} [label] - The display label for the node.
   */
  interface NumberData extends Record<string, unknown> {
      value: number;
      label?: string;
  }

  let { data }: { data: NumberData } = $props();

  $effect(() => {
    if (data.value === undefined) data.value = 0;
  });
</script>

<div class="node-card min-w-[120px] border-gray-400">
  <div class="node-header bg-gray-100 border-gray-200">
    <span class="title text-gray-700">Number</span>
  </div>
  
  <div class="node-body">
    <input 
      type="number" 
      class="nodrag w-full text-xs border border-gray-300 rounded p-1"
      bind:value={data.value}
    />
  </div>

  <Handle type="source" position={Position.Right} id="value" class="!bg-gray-500 !w-3 !h-3" />
</div>