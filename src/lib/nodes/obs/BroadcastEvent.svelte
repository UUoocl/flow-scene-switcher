<script lang="ts">
  import { Handle, Position, useUpdateNodeInternals, useNodes, useEdges, type Node, type Edge } from '@xyflow/svelte';
  import { obs } from '../../obs/obs.svelte';
  import { nanoid } from 'nanoid';
  import { SAVED_FOLDER, CUSTOM_NODES, LOCAL_PREFIX } from '../../constants';

  interface NodeData {
      eventName: string;
      label?: string; // Explicit display title
      debounce: number;
      inputs: string[]; // List of input handle IDs
      // Deprecated single payload field, kept for migration if needed or fallback
      payload?: any; 
  }

  let { id, data }: { id: string; data: NodeData } = $props();

  // Initialize data safely
  $effect(() => {
    if (!data.eventName) data.eventName = 'my-custom-event';
    if (!data.label) data.label = data.eventName; 
    if (!data.debounce) data.debounce = 100;
    if (!data.inputs) data.inputs = [nanoid(6)]; // Start with one input
  });

  // Internal state
  let currentPayloadValue: any = $state({});
  let lastBroadcast = 0;
  let timeoutId: any = null;
  let showSaveUI = $state(false); // Renamed from showLibrary
  let isEditingTitle = $state(false);
  let saveFilename = $state(''); // New state for input
  
  // Library State
  let librarySource: 'local' | 'obsidian' = $state('local');

  const updateNodeInternals = useUpdateNodeInternals();
  const nodes = useNodes();
  const edges = useEdges();

  // --- Logic ---
  $effect(() => {
      const currentEdges = edges.current;
      const currentNodes = nodes.current;
      
      const newObject: Record<string, any> = {};

      if (data.inputs) {
        data.inputs.forEach(inputId => {
            const edge = currentEdges.find((e: Edge) => e.target === id && e.targetHandle === inputId);
            if (edge) {
                const sourceNode = currentNodes.find((n: Node) => n.id === edge.source);
                if (sourceNode) {
                    // Key is source label, fallback to ID
                    const key = sourceNode.data.label || sourceNode.id;
                    // Value is source value or whole data
                    const val = sourceNode.data.value ?? sourceNode.data;
                    
                    newObject[key as string] = val;
                }
            }
        });
      }

      // Check for changes
      if (JSON.stringify(newObject) !== JSON.stringify(currentPayloadValue)) {
          currentPayloadValue = newObject;
          triggerBroadcast();
      }
  });

  function triggerBroadcast() {
      if (timeoutId) clearTimeout(timeoutId);

      const now = Date.now();
      const delay = Math.max(0, data.debounce - (now - lastBroadcast));

      timeoutId = setTimeout(() => {
          performBroadcast();
          lastBroadcast = Date.now();
      }, data.debounce); 
  }

  function performBroadcast() {
      console.log(`Broadcasting ${data.eventName}`, currentPayloadValue);
      obs.broadcastEvent(data.eventName, currentPayloadValue);
  }

  function addInput() {
      if (!data.inputs) data.inputs = [];
      data.inputs.push(nanoid(6));
      setTimeout(() => updateNodeInternals(id), 0);
  }

  function removeInput(inputId: string) {
      if (!data.inputs || data.inputs.length <= 1) return;
      data.inputs = data.inputs.filter(i => i !== inputId);
      setTimeout(() => updateNodeInternals(id), 0);
  }

  // --- Persistence Logic ---

  function toggleSaveUI() {
      showSaveUI = !showSaveUI;
      if (showSaveUI) {
          saveFilename = data.label || data.eventName;
      }
  }

  async function savePreset() {
      if (!saveFilename) {
          alert("Please enter a name for the saved node.");
          return;
      }

      const preset = {
          eventName: data.eventName,
          label: saveFilename, // Use the filename as the label for the preset
          debounce: data.debounce,
          inputs: data.inputs 
      };

      try {
           if (librarySource === 'obsidian') {
               const payload = { folder: CUSTOM_NODES, filename: saveFilename, data: preset };
               await fetch('/api/file/save', {
                   method: 'POST',
                   headers: {'Content-Type': 'application/json'},
                   body: JSON.stringify(payload)
               });
           } else {
               localStorage.setItem(`${LOCAL_PREFIX}custom_${saveFilename}`, JSON.stringify(preset));
           }
           alert("Saved node preset!");
           showSaveUI = false;
      } catch (e) {
          console.error(e);
          alert("Failed to save.");
      }
  }

</script>

<div class="node-card min-w-[250px] bg-white border-2 border-purple-500 rounded-lg shadow-md">
  <div class="p-3 border-b bg-purple-100 rounded-t-lg flex justify-between items-center">
      <div class="flex items-center gap-2 overflow-hidden">
          <span class="text-xl">📡</span>
          {#if isEditingTitle}
            <input 
                type="text" 
                bind:value={data.label} 
                class="text-sm font-bold text-purple-900 bg-white border rounded px-1 w-32 nodrag"
                onblur={() => isEditingTitle = false}
                onkeydown={(e) => e.key === 'Enter' && (isEditingTitle = false)}
                autofocus
            />
          {:else}
            <button 
                class="font-bold text-sm text-purple-900 truncate hover:bg-purple-200 rounded px-1 text-left"
                ondblclick={() => isEditingTitle = true}
            >
                {data.label || 'Broadcast Event'}
            </button>
          {/if}
      </div>
      <button onclick={toggleSaveUI} class="text-xs text-purple-700 underline shrink-0 ml-2">
          save node
      </button>
  </div>

  {#if showSaveUI}
      <div class="p-2 bg-gray-50 border-b text-xs flex flex-col gap-2">
          <div class="flex gap-2">
              <button class:font-bold={librarySource === 'local'} onclick={() => librarySource = 'local'}>Local</button>
              <button class:font-bold={librarySource === 'obsidian'} onclick={() => librarySource = 'obsidian'}>Obsidian</button>
          </div>
          
          <div>
              <label class="block text-[10px] font-bold text-gray-500 mb-1">Name</label>
              <input 
                  type="text" 
                  bind:value={saveFilename} 
                  class="w-full border rounded p-1 text-xs nodrag" 
                  placeholder="My Custom Event"
              />
          </div>

          <button onclick={savePreset} class="bg-purple-600 text-white px-2 py-1 rounded w-full">Save</button>
      </div>
  {/if}

  <div class="p-3 flex flex-col gap-3">
      <div class="grid grid-cols-2 gap-2">
          <div>
              <label class="block text-xs font-bold text-gray-600">Event Name</label>
              <input type="text" bind:value={data.eventName} class="w-full text-xs p-1 border rounded nodrag" />
          </div>
          <div>
              <label class="block text-xs font-bold text-gray-600">Debounce (ms)</label>
              <input type="number" bind:value={data.debounce} class="w-full text-xs p-1 border rounded nodrag" />
          </div>
      </div>

      <div class="bg-gray-50 p-2 rounded border">
          <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payload Builder</label>
          
          <div class="flex flex-col gap-2 mb-2">
            {#if data.inputs}
                {#each data.inputs as inputId (inputId)}
                    <div class="relative flex items-center h-4">
                        <Handle 
                            type="target" 
                            position={Position.Left} 
                            id={inputId} 
                            class="!bg-blue-500 !w-3 !h-3"
                            style="left: -19px;"
                        />
                        <span class="text-[10px] text-gray-500 ml-1">Input Property</span>
                        <button 
                            onclick={() => removeInput(inputId)}
                            class="ml-auto text-red-400 hover:text-red-600 text-[10px] opacity-0 hover:opacity-100 transition-opacity nodrag"
                        >✕</button>
                    </div>
                {/each}
            {/if}
          </div>

          <button 
            onclick={addInput}
            class="bg-white hover:bg-gray-100 text-purple-700 text-[10px] py-1 rounded border border-dashed border-purple-300 w-full mb-2"
          >
              + Add Property
          </button>

          <div class="text-[10px] font-mono whitespace-pre-wrap break-all max-h-24 overflow-y-auto bg-white p-1 rounded border">
              {JSON.stringify(currentPayloadValue, null, 2)}
          </div>
      </div>
  </div>
</div>