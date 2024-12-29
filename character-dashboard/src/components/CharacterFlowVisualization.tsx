import React, { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const CharacterFlowVisualization = ({ characterData }) => {
  // Generate nodes based on character data
  const initialNodes = [
    {
      id: "character",
      type: "default",
      data: {
        label: characterData?.name || "Character Name",
      },
      position: { x: 250, y: 0 },
      className: "dark:bg-primary dark:text-primary-foreground p-2 rounded-md",
    },
    {
      id: "description",
      type: "default",
      data: {
        label: characterData?.description
          ? characterData.description.slice(0, 50) + "..."
          : "Description",
      },
      position: { x: 100, y: 100 },
      className: "dark:bg-muted p-2 rounded-md",
    },
    {
      id: "model",
      type: "default",
      data: {
        label: `Model: ${characterData?.modelProvider || "Not Set"}`,
      },
      position: { x: 400, y: 100 },
      className: "dark:bg-muted p-2 rounded-md",
    },
    {
      id: "voice",
      type: "default",
      data: {
        label: `Voice: ${characterData?.voice?.model || "Default"}`,
      },
      position: { x: 250, y: 200 },
      className: "dark:bg-muted p-2 rounded-md",
    },
    {
      id: "traits",
      type: "default",
      data: {
        label: `Traits: ${characterData?.traits?.join(", ") || "None"}`,
      },
      position: { x: 250, y: 300 },
      className: "dark:bg-muted p-2 rounded-md",
    },
  ];

  const initialEdges = [
    {
      id: "e1-2",
      source: "character",
      target: "description",
      animated: true,
      style: { stroke: "#94a3b8" }, // slate-400 for better visibility in dark mode
    },
    {
      id: "e1-3",
      source: "character",
      target: "model",
      animated: true,
      style: { stroke: "#94a3b8" },
    },
    {
      id: "e1-4",
      source: "character",
      target: "voice",
      style: { stroke: "#94a3b8" },
    },
    {
      id: "e1-5",
      source: "character",
      target: "traits",
      style: { stroke: "#94a3b8" },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="h-[calc(100vh-25rem)] w-full dark:bg-background rounded-md border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-right"
        nodesDraggable={true}
        nodesConnectable={false}
        className="dark:bg-background"
      >
        <Background
          variant="dots"
          gap={12}
          size={1}
          className="dark:bg-muted"
        />
        <Controls className="dark:bg-card dark:border-border" />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case "default":
                return "#94a3b8"; // slate-400
              default:
                return "#475569"; // slate-600
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="dark:bg-card dark:border-border"
        />
        <Panel position="top-left" className="dark:bg-card p-2 rounded-md">
          Character Visualization
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default CharacterFlowVisualization;
