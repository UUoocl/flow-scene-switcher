<script lang="ts">
  /**
   * @file Svelte Flow node for handling OBS Scene Changed events.
   * @module SceneChanged
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  
  /**
   * @typedef {object} SceneChangedNodeData
   * @property {string} [label] - The display label for the node.
   * @property {any} [eventData] - The last event data received from OBS.
   */
  let { data }: NodeProps = $props();
</script>

<div class="node-card event-node">
  <div class="node-header">
    <span class="icon">🎬</span>
    <span class="title">On Scene Changed</span>
  </div>
  
  <div class="node-body">
    <p class="text-xs text-gray-500">Triggers when the active scene changes.</p>
  </div>

  <!-- Output Handle for the 'Event' trigger -->
  <Handle type="source" position={Position.Right} id="trigger" class="handle-trigger" />
</div>