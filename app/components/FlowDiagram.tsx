"use client";

import { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
} from 'react-flow-renderer';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'User Interface' },
    position: { x: 250, y: 0 },
    style: { background: '#f0f0f0', border: '1px solid #222' }
  },
  {
    id: '2',
    data: { label: 'Smart Contract' },
    position: { x: 250, y: 100 },
    style: { background: '#e6f3ff', border: '1px solid #0066cc' }
  },
  {
    id: '3',
    data: { label: 'Blockchain Network' },
    position: { x: 250, y: 200 },
    style: { background: '#e6ffe6', border: '1px solid #006600' }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true }
];

export default function FlowDiagram() {
  const onNodeClick = useCallback((event: any, node: Node) => {
    console.log('click', node);
  }, []);

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}