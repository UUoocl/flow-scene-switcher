<script lang="ts">
  /**
   * @file Svelte Flow node for setting the current OBS program scene.
   * @module SetScene
   */
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import { obs } from '../../obs/obs.svelte';

  /**
   * @typedef {object} SetSceneData
   * @property {string} scene - The name of the scene to set.
   * @property {string} [label] - The display label for the node.
   */
  interface SetSceneData extends Record<string, unknown> {
      scene: string;
  }

  let { data }: { data: SetSceneData } = $props();

  $effect(() => {
    if (!data.scene) data.scene = '';
  });
</script>

<div class="node-card action-node">
  <!-- Input Handle for Trigger -->
  <Handle type="target" position={Position.Left} id="trigger" class="handle-trigger" />

  <div class="node-header">
    <span class="icon">📺</span>
    <span class="title">Set Scene</span>
  </div>
  
  <div class="node-body">
    <label for="sceneSelect" class="block text-xs font-medium text-gray-700 mb-1">Target Scene</label>
    <select 
      id="sceneSelect"
      class="w-full text-xs border border-gray-300 rounded p-1"
      bind:value={data.scene}
    >
      <option value="" disabled>Select a scene...</option>
      {#each obs.scenes as scene}
        <option value={scene}>{scene}</option>
      {/each}
    </select>
  </div>

  <!-- Output Handle for 'Done' (Chaining) -->
  <Handle type="source" position={Position.Right} id="done" class="handle-trigger" />
</div>
