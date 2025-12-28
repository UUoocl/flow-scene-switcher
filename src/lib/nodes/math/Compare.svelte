<script lang="ts">
  /**
   * @file Svelte Flow node for comparing two input values.
   * @module Compare
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  /**
   * @typedef {object} CompareData
   * @property {string} op - The comparison operator ('==', '!=', '>', '<', '>=', '<=').
   * @property {boolean} [result] - The boolean result of the comparison.
   * @property {string} [label] - The display label for the node.
   */
  interface CompareData extends Record<string, unknown> {
      op: string;
      result?: boolean;
  }

  let { data }: { data: CompareData } = $props();

  $effect(() => {
    if (!data.op) data.op = '==';
  });
</script>

<div class="node-card min-w-[140px] border-cyan-400">
  <div class="relative pt-2">
    <Handle type="target" position={Position.Left} id="a" class="!bg-cyan-500 !top-3" />
    <span class="text-[10px] text-gray-500 absolute left-3 top-1">A</span>
    
    <Handle type="target" position={Position.Left} id="b" class="!bg-cyan-500 !top-8" />
    <span class="text-[10px] text-gray-500 absolute left-3 top-6">B</span>
  </div>

  <div class="node-header bg-cyan-100 border-cyan-200 mt-2">
    <span class="title text-cyan-900">Compare</span>
  </div>
  
  <div class="node-body">
    <select 
      class="nodrag w-full text-xs border border-gray-300 rounded p-1"
      bind:value={data.op}
    >
      <option value="==">==</option>
      <option value="!=">!=</option>
      <option value=">">&gt;</option>
      <option value="<">&lt;</option>
      <option value=">=">&gt;=</option>
      <option value="<=">&lt;=</option>
    </select>
  </div>

  <Handle type="source" position={Position.Right} id="result" class="!bg-cyan-500 !w-3 !h-3" />
</div>