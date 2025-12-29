<script lang="ts">
  /**
   * @file The main application component for the Flow Scene Switcher.
   * @module App
   */
  import { SvelteFlow, Background, Controls, type Node, type Edge, type NodeTypes } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { onMount } from 'svelte';

  // Components
  import ConnectionModal from './lib/components/ConnectionModal.svelte';
  import NodeSelector from './lib/components/NodeSelector.svelte';
  import SaveLoadModal from './lib/components/SaveLoadModal.svelte';
  import SettingsModal from './lib/components/SettingsModal.svelte';
  
  // Logic
  import { GraphRunner } from './lib/obs/graphRunner.svelte';
  import { obs } from './lib/obs/obs.svelte';
  import { loadFlowData } from './lib/utils/storage';

  // Node Types
  import SceneChanged from './lib/nodes/events/SceneChanged.svelte';
  import MuteChanged from './lib/nodes/events/MuteChanged.svelte';
  import StreamState from './lib/nodes/events/StreamState.svelte';
  import InputSettings from './lib/nodes/events/InputSettings.svelte';
  
  import SetScene from './lib/nodes/actions/SetScene.svelte';
  import SetMute from './lib/nodes/actions/SetMute.svelte';
  import ControlStream from './lib/nodes/actions/ControlStream.svelte';
  import SetInputSettings from './lib/nodes/actions/SetInputSettings.svelte';
  import BrowserSourceNode from './lib/nodes/obs/BrowserSourceNode.svelte';
  import BroadcastEvent from './lib/nodes/obs/BroadcastEvent.svelte';

  // Basic Nodes
  import NumberNode from './lib/nodes/basic/NumberNode.svelte';
  import StringNode from './lib/nodes/basic/StringNode.svelte';
  import BooleanNode from './lib/nodes/basic/BooleanNode.svelte';
  import WatchNode from './lib/nodes/basic/WatchNode.svelte';
  import ObjectNode from './lib/nodes/basic/ObjectNode.svelte';

  // Math Nodes
  import MathOperation from './lib/nodes/math/MathOperation.svelte';
  import Compare from './lib/nodes/math/Compare.svelte';

  // Logic Nodes
  import Branch from './lib/nodes/logic/Branch.svelte';

  // Define Custom Node Types
  const nodeTypes: NodeTypes = {
    'obs/events/scene_changed': SceneChanged,
    'obs/events/mute_changed': MuteChanged,
    'obs/events/stream_state': StreamState,
    'obs/events/input_settings': InputSettings,

    'obs/actions/set_scene': SetScene,
    'obs/actions/set_mute': SetMute,
    'obs/actions/control_stream': ControlStream,
    'obs/actions/set_input_settings': SetInputSettings,

    'obs/browser_source': BrowserSourceNode,
    'obs/broadcast_event': BroadcastEvent,

    'basic/number': NumberNode,
    'basic/string': StringNode,
    'basic/boolean': BooleanNode,
    'basic/watch': WatchNode,
    'basic/object': ObjectNode,

    'math/operation': MathOperation,
    'math/compare': Compare,

    'logic/branch': Branch,
  };

  // State
  let nodes = $state<Node[]>([]);
  let edges = $state<Edge[]>([]);
  let graphRunner = $state<GraphRunner>();
  let saveLoadModal: SaveLoadModal;
  let settingsModal: SettingsModal;

  // Initialize Graph Runner
  onMount(async () => {
    graphRunner = new GraphRunner(
        () => nodes,
        () => edges
    );

    // Check for auto-start params
    const params = new URLSearchParams(window.location.search);
    let startFile = params.get('start');
    const location = params.get('location') as 'obsidian' | 'local';

    if (startFile && location) {
        if (location === 'obsidian' && !startFile.endsWith('.json')) {
            startFile += '.json';
        }
        
        console.log(`Auto-loading: ${startFile} from ${location}`);
        try {
            const data = await loadFlowData(startFile, location);
            if (data.nodes && data.edges) {
                nodes = data.nodes;
                edges = data.edges;
                
                // Wait a bit for nodes to mount then start
                setTimeout(() => {
                    graphRunner?.start();
                }, 500);
            }
        } catch (e) {
            console.error("Auto-load failed:", e);
        }
    }
  });

  // Add Node Handler
  function handleAddNode(type: string, label: string, extraData: any = {}) {
    const id = crypto.randomUUID();
    const newNode: Node = {
        id,
        type,
        position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
        data: { label, ...extraData } 
    };
    nodes = [...nodes, newNode];
  }

  function handleLoad(newNodes: Node[], newEdges: Edge[]) {
      nodes = newNodes;
      edges = newEdges;
  }

  function toggleLogic() {
      console.log("Toggle Logic Clicked", graphRunner);
      if (graphRunner) {
          if (graphRunner.isRunning) {
              graphRunner.stop();
          } else {
              graphRunner.start();
          }
      }
  }
</script>

<div class="w-screen h-screen relative bg-gray-50">
  <!-- Top Bar / Status -->
  <div class="absolute top-0 right-0 p-4 z-10 flex gap-4 items-center">
    <div class="flex gap-2">
      <button 
          class="bg-white p-1 rounded shadow hover:bg-gray-50 border flex items-center justify-center"
          onclick={() => settingsModal.open()}
          title="Settings"
      >
        <span class="text-lg">⚙️</span>
      </button>

      <button 
          class="px-3 py-1 rounded shadow text-sm border transition-colors text-white"
          class:bg-blue-500={!graphRunner?.isRunning}
          class:hover:bg-blue-600={!graphRunner?.isRunning}
          class:bg-orange-500={graphRunner?.isRunning}
          class:hover:bg-orange-600={graphRunner?.isRunning}
          onclick={toggleLogic}
      >
          {graphRunner?.isRunning ? 'Stop Logic' : 'Start Logic'}
      </button>

      <button 
          class="bg-white px-3 py-1 rounded shadow text-sm hover:bg-gray-50 border"
          onclick={() => saveLoadModal.open('save')}
      >Save</button>
      <button 
          class="bg-white px-3 py-1 rounded shadow text-sm hover:bg-gray-50 border"
          onclick={() => saveLoadModal.open('load')}
      >Load</button>
    </div>

    <div class="bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow border border-gray-200 text-sm font-medium">
        OBS: 
        <span class={obs.isConnected ? 'text-green-600' : 'text-red-500'}>
            {obs.status}
        </span>
    </div>
    {#if obs.isConnected}
        <button 
            class="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600 shadow"
            onclick={() => obs.disconnect()}
        >
            Disconnect
        </button>
    {/if}
  </div>

  <!-- Node Selector Sidebar -->
  <NodeSelector onAdd={handleAddNode} />

  <!-- Flow Editor -->
  <SvelteFlow 
    bind:nodes 
    bind:edges 
    {nodeTypes}
    fitView
  >
    <Background />
    <Controls />
  </SvelteFlow>

  <!-- Modals -->
  <ConnectionModal />
  <SaveLoadModal bind:this={saveLoadModal} {nodes} {edges} onLoad={handleLoad} />
  <SettingsModal bind:this={settingsModal} />
</div>
