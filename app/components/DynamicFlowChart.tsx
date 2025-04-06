"use client";

import { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZoomIn, ZoomOut, RotateCw, Activity, GitBranch, Box } from "lucide-react";
import { AnalyzedContract, ContractFunction } from '../lib/contractAnalyzer';
import { generateFlowElements, generateUMLDiagram, generateStateDiagram } from '../lib/contractAnalyzer';

interface DynamicFlowChartProps {
  elements: AnalyzedContract;
  onFunctionClick?: (func: ContractFunction) => void;
}

const flowStyles = {
  background: 'rgba(0, 0, 0, 0.8)',
};

type DiagramType = 'flow' | 'uml' | 'state';

function Flow({ elements, onFunctionClick }: DynamicFlowChartProps) {
  const [diagramType, setDiagramType] = useState<DiagramType>('flow');
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const getDiagramElements = useCallback(() => {
    switch (diagramType) {
      case 'uml':
        return generateUMLDiagram(elements);
      case 'state':
        return generateStateDiagram(elements);
      default:
        return generateFlowElements(elements);
    }
  }, [diagramType, elements]);

  const { nodes, edges } = getDiagramElements();

  const [currentNodes, setNodes] = useState<Node[]>(nodes);
  const [currentEdges] = useState<Edge[]>(edges);

  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      return nds.map((node) => {
        const change = changes.find((c: any) => c.id === node.id);
        if (change) {
          return { ...node, position: change.position || node.position };
        }
        return node;
      });
    });
  }, []);

  const onNodeClick = useCallback((event: any, node: Node) => {
    if (onFunctionClick && node.id.startsWith('function-')) {
      const functionIndex = parseInt(node.id.split('-')[1]);
      onFunctionClick(elements.functions[functionIndex]);
    }
  }, [onFunctionClick, elements.functions]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={currentNodes}
        edges={currentEdges}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
        style={flowStyles}
        minZoom={0.2}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodesDraggable={true}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        panOnScroll={false}
        preventScrolling={true}
      >
        <Panel position="top-right" className="flex gap-2">
          <Select
            value={diagramType}
            onValueChange={(value: DiagramType) => setDiagramType(value)}
          >
            <SelectTrigger className="w-[180px] neon-border bg-black/50">
              <SelectValue placeholder="Select diagram type" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-none">
              <SelectItem value="flow" className="text-white">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Flow Diagram
                </div>
              </SelectItem>
              <SelectItem value="uml" className="text-white">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  UML Class Diagram
                </div>
              </SelectItem>
              <SelectItem value="state" className="text-white">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  State Diagram
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => zoomIn()}
            className="neon-border bg-black/50"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => zoomOut()}
            className="neon-border bg-black/50"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fitView({ duration: 800 })}
            className="neon-border bg-black/50"
            title="Fit View"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </Panel>
        <Background
          color="rgba(0, 255, 157, 0.2)"
          gap={16}
          size={1}
          className="bg-black/90"
        />
        <Controls
          className="bg-black/50 neon-border"
          showInteractive={false}
        />
        <MiniMap
          style={{
            height: 120,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          }}
          nodeColor={(node) => {
            switch (node.style?.background) {
              case '#e6f3ff':
                return '#00a2ff';
              case '#ffe6e6':
                return '#ff0066';
              case '#e6ffe6':
                return '#00ff9d';
              default:
                return '#666';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
          className="neon-border"
        />
      </ReactFlow>
    </div>
  );
}

export default function DynamicFlowChart(props: DynamicFlowChartProps) {
  return (
    <ReactFlowProvider>
      <Flow {...props} />
    </ReactFlowProvider>
  );
}