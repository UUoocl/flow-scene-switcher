<script lang="ts">
  /**
   * @file Svelte Flow node for interacting with an OBS browser source dynamically defined by CSS.
   * @module BrowserSourceNode
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import { type BrowserNodeDefinition } from '../../utils/cssParser';

  /**
   * @typedef {object} BrowserNodeData
   * @property {BrowserNodeDefinition} definition - The parsed definition of the browser source node.
   * @property {string} [label] - The display label for the node.
   * @property {Record<string, any>} [outputValues] - Stores the last values received from output events.
   */
  interface BrowserNodeData extends Record<string, unknown> {
      definition: BrowserNodeDefinition;
  }

  let { data }: { data: BrowserNodeData } = $props();
  let def = $derived(data.definition);
</script>

<div class="node-card min-w-[200px] border-emerald-500">
  <div class="node-header bg-emerald-100 border-emerald-200">
    <span class="icon">🌐</span>
    <span class="title text-emerald-900">{def.sourceName}</span>
  </div>
  
  <div class="node-body flex justify-between p-4 gap-4">
    <!-- Inputs Column -->
    <div class="flex flex-col gap-4">
      {#each def.inputs as input}
        <div class="relative flex items-center h-4">
          <Handle 
            type="target" 
            position={Position.Left} 
            id={input.name} 
            class="!bg-emerald-500 !left-[-22px]" 
          />
          <span class="text-[10px] text-gray-600 font-mono uppercase">{input.name}</span>
        </div>
      {/each}
    </div>

    <!-- Outputs Column -->
    <div class="flex flex-col gap-4 items-end">
      {#each def.outputs as output}
        <div class="relative flex items-center h-4">
          <span class="text-[10px] text-gray-600 font-mono uppercase">{output.name}</span>
          <Handle 
            type="source" 
            position={Position.Right} 
            id={output.name} 
            class="!bg-emerald-500 !right-[-22px]" 
          />
        </div>
      {/each}
    </div>
  </div>
</div>