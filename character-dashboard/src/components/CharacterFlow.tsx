import React, { useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  Handle,
  Position,
} from "@xyflow/react";
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  Bot,
  Brain,
  Waves,
  Dna,
} from "lucide-react";

// Custom Node Types
const CyberNode = ({ data, isConnectable }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div
      className={`group transition-all duration-300 ${isExpanded ? "min-h-[120px]" : "h-12"}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-2 p-3 bg-primary cursor-pointer group hover:bg-primary/90 transition-colors"
          onClick={toggleExpanded}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-primary-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-primary-foreground" />
          )}
          <div className="flex items-center gap-2">
            {data.icon}
            <span className="font-semibold text-primary-foreground">
              {data.label}
            </span>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-3 space-y-2">
            {data.content?.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
                <span>{item}</span>
              </div>
            ))}
            {data.processing && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Processing: {data.processing}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />

      {/* Connection Lines */}
      <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -right-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

const nodeTypes = {
  cyber: CyberNode,
};

const CharacterFlow = ({ character }) => {
  // Initial nodes with cybernetic styling
  const initialNodes = [
    {
      id: "core",
      type: "cyber",
      position: { x: 250, y: 0 },
      data: {
        label: "Core System",
        icon: <Cpu className="w-4 h-4 text-primary-foreground" />,
        content: [
          `Name: ${character?.name || "Initializing..."}`,
          `Provider: ${character?.modelProvider || "System Loading..."}`,
        ],
        processing: "Core systems active",
      },
    },
    {
      id: "personality",
      type: "cyber",
      position: { x: 0, y: 200 },
      data: {
        label: "Personality Matrix",
        icon: <Brain className="w-4 h-4 text-primary-foreground" />,
        content: [
          "Emotional Processing",
          "Behavioral Patterns",
          "Response Generation",
        ],
        processing: "Analyzing patterns",
      },
    },
    {
      id: "voice",
      type: "cyber",
      position: { x: 250, y: 200 },
      data: {
        label: "Voice Synthesis",
        icon: <Waves className="w-4 h-4 text-primary-foreground" />,
        content: [
          `Model: ${character?.voice?.model || "Default"}`,
          `Speed: ${character?.voice?.speed || "1.0"}x`,
          `Pitch: ${character?.voice?.pitch || "1.0"}`,
        ],
        processing: "Calibrating voice patterns",
      },
    },
    {
      id: "traits",
      type: "cyber",
      position: { x: 500, y: 200 },
      data: {
        label: "Genetic Traits",
        icon: <Dna className="w-4 h-4 text-primary-foreground" />,
        content: character?.traits || ["No traits defined"],
        processing: "Evolving characteristics",
      },
    },
    {
      id: "interface",
      type: "cyber",
      position: { x: 250, y: 400 },
      data: {
        label: "Neural Interface",
        icon: <Bot className="w-4 h-4 text-primary-foreground" />,
        content: [
          "Memory Integration Active",
          "Response Protocol Online",
          "Learning Systems Engaged",
        ],
        processing: "Neural pathways forming",
      },
    },
  ];

  // Edges with cybernetic styling
  const initialEdges = [
    {
      id: "e-core-personality",
      source: "core",
      target: "personality",
      animated: true,
      style: { stroke: "#0ea5e9", strokeWidth: 2 }, // sky-500
      className: "animate-pulse",
    },
    {
      id: "e-core-voice",
      source: "core",
      target: "voice",
      animated: true,
      style: { stroke: "#0ea5e9", strokeWidth: 2 },
    },
    {
      id: "e-core-traits",
      source: "core",
      target: "traits",
      animated: true,
      style: { stroke: "#0ea5e9", strokeWidth: 2 },
    },
    {
      id: "e-personality-interface",
      source: "personality",
      target: "interface",
      animated: true,
      style: { stroke: "#0ea5e9", strokeWidth: 2 },
    },
    {
      id: "e-voice-interface",
      source: "voice",
      target: "interface",
      animated: true,
      style: { stroke: "#0ea5e9", strokeWidth: 2 },
    },
    {
      id: "e-traits-interface",
      source: "traits",
      target: "interface",
      animated: true,
      style: { stroke: "#0ea5e9", strokeWidth: 2 },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        className="dark:bg-background"
      >
        <Background
          variant="dots"
          gap={12}
          size={1}
          className="dark:bg-muted"
          color="#0ea5e9"
        />
        <Controls className="dark:bg-card dark:border-border" />
        <MiniMap
          nodeColor={(node) => "#0ea5e9"}
          maskColor="rgba(0, 0, 0, 0.2)"
          className="dark:bg-card dark:border-border"
        />
        <Panel position="top-left" className="dark:bg-card p-2 rounded-md">
          <div className="flex items-center gap-2 text-sm">
            <Cpu className="w-4 h-4 text-primary" />
            <span>Neural Network Status: Active</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default CharacterFlow;
