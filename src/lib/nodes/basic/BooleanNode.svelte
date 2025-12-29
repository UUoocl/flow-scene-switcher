<script lang="ts">
  /**
   * @file Svelte Flow node for a constant boolean value.
   * @module BooleanNode
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  /**
   * @typedef {object} BooleanNodeData
   * @property {boolean} value - The boolean value of the node.
   * @property {string} [label] - The display label for the node.
   */
  interface BooleanData extends Record<string, unknown> {
      value: boolean;
      label?: string;
  }

  let { data }: { data: BooleanData } = $props();
  let isEditingTitle = $state(false);

  $effect(() => {
    if (data.value === undefined) data.value = false;
    if (!data.label) data.label = "Boolean";
  });
</script>

<div class="node-card min-w-[100px] border-gray-400">
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
  
  <div class="node-body flex justify-center">
    <input 
      type="checkbox" 
      class="nodrag"
      bind:checked={data.value}
    />
  </div>

  <Handle type="source" position={Position.Right} id="value" class="!bg-gray-500 !w-3 !h-3" />
</div>