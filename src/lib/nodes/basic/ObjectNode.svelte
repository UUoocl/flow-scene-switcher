<script lang="ts">
  import { Handle, Position, useUpdateNodeInternals, useNodes, useEdges, type Node, type Edge } from '@xyflow/svelte';
  import { nanoid } from 'nanoid';

  interface NodeData {
      label?: string;
      inputs: string[]; // List of input handle IDs
      value?: Record<string, any>;
  }

  let { id, data }: { id: string; data: NodeData } = $props();

  // Initialize
  $effect(() => {
    if (!data.label) data.label = "Object Builder";
    if (!data.inputs) data.inputs = [nanoid(6)];
    if (!data.value) data.value = {};
  });

  const updateNodeInternals = useUpdateNodeInternals();
  const nodes = useNodes();
  const edges = useEdges();

  let isEditingTitle = $state(false);

  // --- Logic ---
  $effect(() => {
      const currentEdges = edges.current;
      const currentNodes = nodes.current;
      
      const newObject: Record<string, any> = {};
      let hasChanges = false;

      if (data.inputs) {
        data.inputs.forEach(inputId => {
            const edge = currentEdges.find((e: Edge) => e.target === id && e.targetHandle === inputId);
            if (edge) {
                const sourceNode = currentNodes.find((n: Node) => n.id === edge.source);
                if (sourceNode) {
                    // Key is source label, fallback to ID or type
                    const key = sourceNode.data.label || sourceNode.id;
                    // Value is source value or whole data
                    const val = sourceNode.data.value ?? sourceNode.data;
                    
                    newObject[key as string] = val;
                }
            }
        });
      }

      // Deep compare to avoid unnecessary updates if possible, 
      // but for now simple JSON stringify check is robust enough for small objects.
      if (JSON.stringify(newObject) !== JSON.stringify(data.value)) {
          data.value = newObject;
      }
  });

  function addInput() {
      if (!data.inputs) data.inputs = [];
      data.inputs.push(nanoid(6));
      // updateNodeInternals handled by effect on length change usually, 
      // but explicit call is safer for dynamic handles.
      setTimeout(() => updateNodeInternals(id), 0);
  }

  function removeInput(inputId: string) {
      if (!data.inputs || data.inputs.length <= 1) return;
      data.inputs = data.inputs.filter(i => i !== inputId);
      setTimeout(() => updateNodeInternals(id), 0);
  }

</script>

<div class="node-card min-w-[150px] border-cyan-500">
  <div class="node-header bg-cyan-100 border-cyan-200">
    {#if isEditingTitle}
      <input 
          type="text" 
          bind:value={data.label} 
          class="text-xs font-bold text-cyan-900 bg-white border rounded px-1 w-full nodrag"
          onblur={() => isEditingTitle = false}
          onkeydown={(e) => e.key === 'Enter' && (isEditingTitle = false)}
      />
    {:else}
      <span 
        class="title text-cyan-900 cursor-text"
        ondblclick={() => isEditingTitle = true}
        title="Double click to rename"
      >
        {data.label}
      </span>
    {/if}
  </div>

  <div class="node-body flex flex-col gap-2">
      {#if data.inputs}
        {#each data.inputs as inputId (inputId)}
            <div class="relative flex items-center h-4">
                <Handle 
                    type="target" 
                    position={Position.Left} 
                    id={inputId} 
                    class="!bg-cyan-500 !w-3 !h-3"
                />
                <span class="text-[10px] text-gray-400 ml-2">Property Source</span>
                <button 
                    onclick={() => removeInput(inputId)}
                    class="ml-auto text-red-400 hover:text-red-600 text-[10px] opacity-0 hover:opacity-100 transition-opacity nodrag"
                >✕</button>
            </div>
        {/each}
      {/if}
      
      <button 
        onclick={addInput}
        class="mt-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-[10px] py-1 rounded border border-dashed border-cyan-300 w-full"
      >
          + Add Property
      </button>

      <!-- Preview -->
      <div class="bg-gray-50 p-1 rounded border text-[10px] font-mono whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
          {JSON.stringify(data.value, null, 2)}
      </div>
  </div>

  <Handle type="source" position={Position.Right} id="output" class="!bg-cyan-500 !w-3 !h-3" />
</div>
