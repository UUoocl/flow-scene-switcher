<script lang="ts">
  /**
   * @file Svelte Flow node for branching logic based on a boolean condition.
   * @module Branch
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  /**
   * @typedef {object} BranchData
   * @property {string} [label] - The display label for the node.
   */
  let { data }: NodeProps = $props();
</script>

<div class="node-card min-w-[140px] border-orange-400">
  <!-- Trigger Input -->
  <Handle type="target" position={Position.Left} id="trigger" class="!bg-orange-500 !w-3 !h-3 !top-4" />
  
  <!-- Condition Input (Data) -->
  <Handle type="target" position={Position.Left} id="condition" class="!bg-orange-500 !w-3 !h-3 !top-12" />
  <span class="text-[10px] text-gray-500 absolute left-3 top-[44px]">Condition</span>

  <div class="node-header bg-orange-100 border-orange-200 ml-4">
    <span class="title text-orange-900">Branch</span>
  </div>
  
  <div class="node-body">
    <p class="text-[10px] text-gray-500 text-center">True / False</p>
  </div>

  <!-- True Output -->
  <Handle type="source" position={Position.Right} id="true" class="!bg-green-500 !w-3 !h-3 !top-4" />
  <span class="text-[10px] text-gray-500 absolute right-3 top-1">True</span>

  <!-- False Output -->
  <Handle type="source" position={Position.Right} id="false" class="!bg-red-500 !w-3 !h-3 !top-12" />
  <span class="text-[10px] text-gray-500 absolute right-3 top-[44px]">False</span>
</div>