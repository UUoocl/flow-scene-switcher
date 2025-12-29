<script lang="ts">
  /**
   * @file Svelte Flow node for a constant string value.
   * @module StringNode
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  /**
   * @typedef {object} StringNodeData
   * @property {string} value - The string value of the node.
   * @property {string} [label] - The display label for the node.
   */
  interface StringData extends Record<string, unknown> {
      value: string;
      label?: string;
  }

  let { data }: { data: StringData } = $props();
  let isEditingTitle = $state(false);

  $effect(() => {
    if (data.value === undefined) data.value = "";
    if (!data.label) data.label = "String";
  });
</script>

<div class="node-card min-w-[150px] border-gray-400">
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
      type="text" 
      class="nodrag w-full text-xs border border-gray-300 rounded p-1"
      bind:value={data.value}
      placeholder="Value..."
    />
  </div>

  <Handle type="source" position={Position.Right} id="value" class="!bg-gray-500 !w-3 !h-3" />
</div>