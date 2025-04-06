"use client";

import { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Panel,
} from 'reactflow';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { ContractFunction } from '../lib/contractAnalyzer';

interface FunctionSubFlowProps {
  func: ContractFunction;
}

export default function FunctionSubFlow({ func }: FunctionSubFlowProps) {
  const generateSubFlowElements = useCallback(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let yOffset = 0;

    // Function node
    nodes.push({
      id: 'function',
      type: 'default',
      data: {
        label: `${func.name}\n${func.visibility} ${func.stateMutability}`
      },
      position: { x: 250, y: yOffset },
      style: {
        background: '#e6f3ff',
        border: '2px solid #0066cc',
        padding: 10,
        borderRadius: '8px',
        width: 200
      }
    });
    yOffset += 100;

    // Input parameters
    if (func.inputs.length > 0) {
      func.inputs.forEach((input, index) => {
        const nodeId = `input-${index}`;
        nodes.push({
          id: nodeId,
          type: 'default',
          data: {
            label: `Input: ${input.name}\nType: ${input.type}`
          },
          position: { x: 50, y: yOffset + index * 80 },
          style: {
            background: '#f0f0f0',
            border: '1px solid #666',
            padding: 10,
            borderRadius: '8px',
            width: 150
          }
        });
        edges.push({
          id: `e-${nodeId}-function`,
          source: nodeId,
          target: 'function',
          animated: true
        });
      });
    }

    // Modifiers
    if (func.modifiers.length > 0) {
      func.modifiers.forEach((modifier, index) => {
        const nodeId = `modifier-${index}`;
        nodes.push({
          id: nodeId,
          type: 'default',
          data: {
            label: `Modifier: ${modifier}`
          },
          position: { x: 450, y: yOffset + index * 80 },
          style: {
            background: '#fff0e6',
            border: '2px solid #cc6600',
            padding: 10,
            borderRadius: '8px',
            width: 150
          }
        });
        edges.push({
          id: `e-function-${nodeId}`,
          source: 'function',
          target: nodeId,
          animated: true
        });
      });
    }

    // Dependencies
    if (func.dependencies.length > 0) {
      yOffset += Math.max(func.inputs.length, func.modifiers.length) * 80 + 50;
      func.dependencies.forEach((dep, index) => {
        const nodeId = `dep-${index}`;
        nodes.push({
          id: nodeId,
          type: 'default',
          data: {
            label: `Calls: ${dep}`
          },
          position: { x: 250, y: yOffset + index * 80 },
          style: {
            background: '#e6ffe6',
            border: '2px solid #00cc00',
            padding: 10,
            borderRadius: '8px',
            width: 150
          }
        });
        edges.push({
          id: `e-function-${nodeId}`,
          source: 'function',
          target: nodeId,
          animated: true
        });
      });
    }

    // Outputs
    if (func.outputs.length > 0) {
      yOffset += (func.dependencies.length || 1) * 80 + 50;
      func.outputs.forEach((output, index) => {
        const nodeId = `output-${index}`;
        nodes.push({
          id: nodeId,
          type: 'default',
          data: {
            label: `Output: ${output.name || 'return'}\nType: ${output.type}`
          },
          position: { x: 250, y: yOffset + index * 80 },
          style: {
            background: '#f0f0f0',
            border: '1px solid #666',
            padding: 10,
            borderRadius: '8px',
            width: 150
          }
        });
        edges.push({
          id: `e-function-${nodeId}`,
          source: 'function',
          target: nodeId,
          animated: true
        });
      });
    }

    return { nodes, edges };
  }, [func]);

  const elements = generateSubFlowElements();

  return (
    <div className="h-[600px] w-full border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      <ReactFlow
        nodes={elements.nodes}
        edges={elements.edges}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.2}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Panel position="top-right" className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {}}
            className="bg-white dark:bg-gray-800"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {}}
            className="bg-white dark:bg-gray-800"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {}}
            className="bg-white dark:bg-gray-800"
            title="Fit View"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </Panel>
        <Background color="#94a3b8" gap={16} size={1} />
        <Controls className="bg-white dark:bg-gray-800" showInteractive={false} />
        <MiniMap
          style={{
            height: 120,
            backgroundColor: 'rgb(248, 250, 252)',
          }}
          zoomable
          pannable
          className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg"
        />
      </ReactFlow>
    </div>
  );
}