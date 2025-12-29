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
  let isEditingTitle = $state(false);

  $effect(() => {
    if (data.value === undefined) data.value = 0;
    if (!data.label) data.label = "Number";
  });
</script>

<div class="node-card min-w-[120px] border-gray-400">
  <div class="node-header bg-gray-100 border-gray-200">
    {#if isEditingTitle}
      <input 
          type="text" 
          bind:value={data.label} 
          class="text-xs font-bold text-gray-700 bg-white border rounded px-1 w-full nodrag"
          onblur={() => isEditingTitle = false}
          onkeydown={(e) => e.key === 'Enter' && (isEditingTitle = false)}
      />
    {:else}
      <span 
        class="title text-gray-700 cursor-text"
        ondblclick={() => isEditingTitle = true}
        title="Double click to rename"
      >
        {data.label}
      </span>
    {/if}
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