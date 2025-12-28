<script lang="ts">
  /**
   * @file Svelte Flow node for performing basic mathematical operations.
   * @module MathOperation
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  /**
   * @typedef {object} MathOperationData
   * @property {string} op - The mathematical operator ('+', '-', '*', '/', '%').
   * @property {number} [a] - The value of operand A (optional, if connected).
   * @property {number} [b] - The value of operand B (optional, if connected).
   * @property {number} [result] - The computed result of the operation.
   * @property {string} [label] - The display label for the node.
   */
  interface MathData extends Record<string, unknown> {
      op: string;
      a?: number; // Optional local overrides if not connected
      b?: number;
      result?: number;
  }

  let { data }: { data: MathData } = $props();

  $effect(() => {
    if (!data.op) data.op = '+';
  });
</script>

<div class="node-card min-w-[140px] border-indigo-400">
  <!-- Inputs -->
  <div class="relative pt-2">
    <Handle type="target" position={Position.Left} id="a" class="!bg-indigo-500 !top-3" />
    <span class="text-[10px] text-gray-500 absolute left-3 top-1">A</span>
    
    <Handle type="target" position={Position.Left} id="b" class="!bg-indigo-500 !top-8" />
    <span class="text-[10px] text-gray-500 absolute left-3 top-6">B</span>
  </div>

  <div class="node-header bg-indigo-100 border-indigo-200 mt-2">
    <span class="title text-indigo-900">Math</span>
  </div>
  
  <div class="node-body">
    <select 
      class="nodrag w-full text-xs border border-gray-300 rounded p-1"
      bind:value={data.op}
    >
      <option value="+">+</option>
      <option value="-">-</option>
      <option value="*">*</option>
      <option value="/">/</option>
      <option value="%">%</option>
    </select>
  </div>

  <Handle type="source" position={Position.Right} id="result" class="!bg-indigo-500 !w-3 !h-3" />
</div>