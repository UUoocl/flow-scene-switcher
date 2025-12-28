<script lang="ts">
  /**
   * @file A modal component for saving and loading flow graphs.
   * @module SaveLoadModal
   */
  import { type Node, type Edge } from '@xyflow/svelte';
  import { LOCAL_PREFIX, SAVED_FOLDER } from '../constants';
  import { loadFlowData } from '../utils/storage';
  
  /**
   * @typedef {object} Props
   * @property {Node[]} nodes - The current array of nodes in the graph.
   * @property {Edge[]} edges - The current array of edges in the graph.
   * @property {(nodes: Node[], edges: Edge[]) => void} onLoad - Callback function to execute when a flow is loaded.
   */
  interface Props {
      nodes: Node[];
      edges: Edge[];
      onLoad: (nodes: Node[], edges: Edge[]) => void;
  }

  let { nodes, edges, onLoad }: Props = $props();

  let showModal = $state(false);
  let mode = $state<'save' | 'load'>('save');
  let filename = $state('');
  let source = $state<'local' | 'obsidian'>('obsidian');
  let fileList = $state<string[]>([]);
  let message = $state('');

  /**
   * Opens the modal in either 'save' or 'load' mode.
   * This is an exported method that can be called from the parent component.
   * @param {'save' | 'load'} newMode - The mode to open the modal in.
   */
  export function open(newMode: 'save' | 'load') {
      mode = newMode;
      showModal = true;
      message = '';
      filename = '';
      if (mode === 'load') refreshFileList();
  }

  function close() {
      showModal = false;
  }

  // --- API ---

  async function handleConfirm() {
      if (mode === 'save') {
          await saveFlow();
      } else {
         // Load is handled by clicking the file list item
      }
  }

  async function saveFlow() {
      if (!filename) {
          message = "Please enter a filename.";
          return;
      }

      const data = { nodes, edges, version: 1 };
      
      try {
          if (source === 'obsidian') {
              const payload = { folder: SAVED_FOLDER, filename, data };
              const res = await fetch('/api/file/save', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(payload)
              });
              if (!res.ok) throw new Error("Server error");
          } else {
              localStorage.setItem(LOCAL_PREFIX + filename, JSON.stringify(data));
          }
          message = "Saved successfully!";
          setTimeout(close, 1000);
      } catch (e) {
          console.error(e);
          message = "Failed to save.";
      }
  }

  async function loadFlow(selectedFile: string) {
      try {
          const loadedData = await loadFlowData(selectedFile, source);

          if (loadedData.nodes && loadedData.edges) {
              onLoad(loadedData.nodes, loadedData.edges);
              message = "Loaded!";
              setTimeout(close, 500);
          } else {
              message = "Invalid file format.";
          }
      } catch (e) {
          console.error(e);
          message = "Failed to load.";
      }
  }

  async function refreshFileList() {
      fileList = [];
      message = "Loading list...";
      
      try {
          if (source === 'obsidian') {
              const params = new URLSearchParams({ folder: SAVED_FOLDER });
              const res = await fetch(`/api/file/list?${params.toString()}`);
              if (res.ok) {
                  fileList = await res.json();
              }
          } else {
              for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && key.startsWith(LOCAL_PREFIX)) {
                      fileList.push(key.replace(LOCAL_PREFIX, ''));
                  }
              }
          }
          message = "";
      } catch (e) {
          message = "Failed to list files.";
      }
  }
  
  // Watch source change to refresh list in Load mode
  $effect(() => {
      if (showModal && mode === 'load') {
          refreshFileList();
      }
  });

</script>

{#if showModal}
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div class="bg-white p-6 rounded-lg shadow-xl w-96 flex flex-col gap-4">
      <h2 class="text-xl font-bold text-gray-800 capitalize">{mode} Flow</h2>

      <!-- Source Selection -->
      <div class="flex gap-2 text-sm">
          <button 
              class:font-bold={source === 'obsidian'}
              class="px-2 py-1 border rounded"
              onclick={() => source = 'obsidian'}
          >Obsidian</button>
          <button 
              class:font-bold={source === 'local'}
              class="px-2 py-1 border rounded"
              onclick={() => source = 'local'}
          >Local Browser</button>
      </div>

      {#if message}
          <div class="text-sm p-2 bg-yellow-100 text-yellow-800 rounded">{message}</div>
      {/if}

      {#if mode === 'save'}
          <div>
              <label for="saveFilename" class="block text-sm font-medium text-gray-700">Filename</label>
              <input 
                  id="saveFilename"
                  type="text" 
                  bind:value={filename}
                  class="w-full border p-2 rounded mt-1"
                  placeholder="my_flow"
              />
          </div>
          <button 
              onclick={handleConfirm}
              class="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >Save</button>
      {:else}
          <div class="border rounded h-48 overflow-y-auto p-2 bg-gray-50 flex flex-col gap-1">
              {#each fileList as file}
                  <button 
                      class="text-left text-sm px-2 py-1 hover:bg-blue-100 rounded"
                      onclick={() => loadFlow(file)}
                  >
                      {file}
                  </button>
              {/each}
              {#if fileList.length === 0}
                  <span class="text-gray-400 text-sm text-center mt-4">No files found.</span>
              {/if}
          </div>
      {/if}

      <button 
          onclick={close}
          class="text-gray-500 text-sm hover:underline self-center"
      >Cancel</button>
  </div>
</div>
{/if}