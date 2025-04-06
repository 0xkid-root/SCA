"use client";

import { Node, Edge } from 'reactflow';

export interface ContractFunction {
  name: string;
  type: string;
  inputs: Array<{ name: string; type: string }>;
  outputs: Array<{ name: string; type: string }>;
  stateMutability: string;
  visibility: string;
  modifiers: string[];
  payable: boolean;
  roles: string[];
  flowType: 'user' | 'owner' | 'admin' | 'system';
  dependencies: string[];
}

export interface ContractEvent {
  name: string;
  inputs: Array<{ name: string; type: string; indexed: boolean }>;
  anonymous: boolean;
  relatedFunctions: string[];
}

export interface ContractState {
  name: string;
  type: string;
  visibility: string;
  constant: boolean;
  value?: string;
  accessedBy: string[];
  modifiedBy: string[];
}

export interface SecurityIssue {
  severity: 'High' | 'Medium' | 'Low' | 'Info';
  description: string;
  location: string;
  recommendation: string;
  affectedFunctions?: string[];
}

export interface RoleDefinition {
  name: string;
  permissions: string[];
  functions: string[];
}

export interface AnalyzedContract {
  name: string;
  functions: ContractFunction[];
  events: ContractEvent[];
  stateVariables: ContractState[];
  securityIssues: SecurityIssue[];
  version: string;
  license?: string;
  inheritance: string[];
  modifiers: string[];
  roles: RoleDefinition[];
  hasOwnership: boolean;
  hasAccessControl: boolean;
}

function determineRole(funcName: string, source: string): string[] {
  const roles: string[] = [];
  
  if (source.includes('onlyOwner') || funcName.toLowerCase().includes('owner')) {
    roles.push('owner');
  }
  
  if (source.includes('onlyAdmin') || funcName.toLowerCase().includes('admin')) {
    roles.push('admin');
  }
  
  if (funcName.toLowerCase().includes('user') || 
      ['view', 'pure'].some(modifier => source.includes(modifier))) {
    roles.push('user');
  }
  
  return roles.length ? roles : ['user'];
}

function analyzeFunctionDependencies(funcName: string, source: string, allFunctions: string[]): string[] {
  const dependencies: string[] = [];
  
  allFunctions.forEach(otherFunc => {
    if (otherFunc !== funcName && 
        source.includes(otherFunc + '(')) {
      dependencies.push(otherFunc);
    }
  });
  
  return dependencies;
}

export function analyzeContract(contractSource: string): AnalyzedContract {
  try {
    const abi = JSON.parse(contractSource);
    if (Array.isArray(abi)) {
      return analyzeABI(abi);
    }
  } catch (e) {
    return analyzeSoliditySource(contractSource);
  }
  
  throw new Error("Invalid contract format");
}

function analyzeABI(abi: any[]): AnalyzedContract {
  const functions: ContractFunction[] = [];
  const events: ContractEvent[] = [];
  const stateVariables: ContractState[] = [];
  const securityIssues: SecurityIssue[] = [];
  const roles: RoleDefinition[] = [];

  const allFunctionNames = abi
    .filter(item => item.type === 'function')
    .map(item => item.name);

  abi.forEach((item) => {
    if (item.type === 'function') {
      const payable = item.stateMutability === 'payable';
      const functionRoles = determineRole(item.name, JSON.stringify(item));
      const dependencies = analyzeFunctionDependencies(item.name, JSON.stringify(abi), allFunctionNames);
      
      functions.push({
        name: item.name,
        type: item.type,
        inputs: item.inputs || [],
        outputs: item.outputs || [],
        stateMutability: item.stateMutability,
        visibility: item.visibility || 'public',
        modifiers: [],
        payable,
        roles: functionRoles,
        flowType: functionRoles.includes('owner') ? 'owner' : 
                 functionRoles.includes('admin') ? 'admin' : 
                 item.stateMutability === 'view' ? 'system' : 'user',
        dependencies
      });

      functionRoles.forEach(role => {
        const existingRole = roles.find(r => r.name === role);
        if (existingRole) {
          existingRole.functions.push(item.name);
        } else {
          roles.push({
            name: role,
            permissions: [],
            functions: [item.name]
          });
        }
      });
    } else if (item.type === 'event') {
      const relatedFunctions = functions
        .filter(f => JSON.stringify(item).includes(f.name))
        .map(f => f.name);

      events.push({
        name: item.name,
        inputs: item.inputs || [],
        anonymous: item.anonymous || false,
        relatedFunctions
      });
    }
  });

  return {
    name: 'Contract',
    functions,
    events,
    stateVariables,
    securityIssues,
    version: 'Unknown',
    inheritance: [],
    modifiers: [],
    roles,
    hasOwnership: functions.some(f => f.roles.includes('owner')),
    hasAccessControl: functions.some(f => f.roles.includes('admin'))
  };
}

function analyzeSoliditySource(source: string): AnalyzedContract {
  const functions: ContractFunction[] = [];
  const events: ContractEvent[] = [];
  const stateVariables: ContractState[] = [];
  const securityIssues: SecurityIssue[] = [];
  const modifiers: string[] = [];
  const roles: RoleDefinition[] = [];

  const contractNameMatch = source.match(/contract\s+(\w+)(?:\s+is\s+([\w,\s]+))?/);
  const contractName = contractNameMatch ? contractNameMatch[1] : 'Contract';
  const inheritance = contractNameMatch && contractNameMatch[2] 
    ? contractNameMatch[2].split(',').map(s => s.trim()) 
    : [];

  const versionMatch = source.match(/pragma\s+solidity\s+([^;]+)/);
  const version = versionMatch ? versionMatch[1].trim() : 'Unknown';

  const licenseMatch = source.match(/\/\/\s*SPDX-License-Identifier:\s*(.+)/);
  const license = licenseMatch ? licenseMatch[1].trim() : undefined;

  const modifierRegex = /modifier\s+(\w+)\s*\(([\s\S]*?)\)\s*{/g;
  let match;
  while ((match = modifierRegex.exec(source)) !== null) {
    modifiers.push(match[1]);
  }

  const functionNameRegex = /function\s+(\w+)/g;
  const allFunctionNames: string[] = [];
  while ((match = functionNameRegex.exec(source)) !== null) {
    allFunctionNames.push(match[1]);
  }

  const functionRegex = /function\s+(\w+)\s*\(([\s\S]*?)\)(?:\s+(public|private|internal|external))?\s*(?:(pure|view|payable))?\s*(?:returns\s*\(([\s\S]*?)\))?\s*(?:(?={)|\{)/g;

  while ((match = functionRegex.exec(source)) !== null) {
    const [_, name, inputsStr, visibility = 'public', mutability, outputsStr] = match;
    const functionSource = source.slice(match.index);
    const functionRoles = determineRole(name, functionSource);
    const dependencies = analyzeFunctionDependencies(name, functionSource, allFunctionNames);
    
    const inputs = inputsStr.split(',')
      .filter(param => param.trim())
      .map(param => {
        const [type, name] = param.trim().split(/\s+/);
        return { name: name || '', type };
      });

    const outputs = outputsStr
      ? outputsStr.split(',').map(param => {
          const [type, name] = param.trim().split(/\s+/);
          return { name: name || '', type };
        })
      : [];

    const functionBody = source.slice(match.index);
    const modifierMatch = functionBody.match(/(?:modifier\s+)([\w\s,]+)(?={)/);
    const functionModifiers = modifierMatch 
      ? modifierMatch[1].split(',').map(m => m.trim())
      : [];

    const isPayable = mutability === 'payable';
    
    if (isPayable) {
      securityIssues.push({
        severity: 'Medium',
        description: `Payable function '${name}' found`,
        location: `Function: ${name}`,
        recommendation: 'Ensure proper access controls and value validation are in place.',
        affectedFunctions: [name]
      });
    }

    functions.push({
      name,
      type: 'function',
      inputs,
      outputs,
      stateMutability: mutability || 'nonpayable',
      visibility,
      modifiers: functionModifiers,
      payable: isPayable,
      roles: functionRoles,
      flowType: functionRoles.includes('owner') ? 'owner' : 
               functionRoles.includes('admin') ? 'admin' : 
               mutability === 'view' ? 'system' : 'user',
      dependencies
    });

    functionRoles.forEach(role => {
      const existingRole = roles.find(r => r.name === role);
      if (existingRole) {
        existingRole.functions.push(name);
      } else {
        roles.push({
          name: role,
          permissions: [],
          functions: [name]
        });
      }
    });
  }

  const eventRegex = /event\s+(\w+)\s*\(([\s\S]*?)\)(?:\s+anonymous)?\s*;/g;
  while ((match = eventRegex.exec(source)) !== null) {
    const [_, name, paramsStr] = match;
    const anonymous = match[0].includes('anonymous');
    
    const inputs = paramsStr.split(',')
      .filter(param => param.trim())
      .map(param => {
        const parts = param.trim().split(/\s+/);
        const indexed = parts.includes('indexed');
        const type = parts[0];
        const name = parts[parts.length - 1];
        return { name, type, indexed };
      });

    const relatedFunctions = functions
      .filter(f => source.includes(`emit ${name}`))
      .map(f => f.name);

    events.push({
      name,
      inputs,
      anonymous,
      relatedFunctions
    });
  }

  const stateVarRegex = /(public|private|internal)\s+(constant\s+)?(\w+)\s+(\w+)(?:\s*=\s*([^;]+))?;/g;
  while ((match = stateVarRegex.exec(source)) !== null) {
    const [_, visibility, constant, type, name, value] = match;
    
    const accessedBy = functions
      .filter(f => source.includes(`${name}`))
      .map(f => f.name);
    
    const modifiedBy = functions
      .filter(f => source.includes(`${name} =`))
      .map(f => f.name);

    stateVariables.push({
      name,
      type,
      visibility,
      constant: !!constant,
      value: value?.trim(),
      accessedBy,
      modifiedBy
    });
  }

  if (source.includes('selfdestruct') || source.includes('suicide')) {
    const affectedFunctions = functions
      .filter(f => source.includes('selfdestruct') || source.includes('suicide'))
      .map(f => f.name);

    securityIssues.push({
      severity: 'High',
      description: 'Contract uses selfdestruct/suicide',
      location: 'Contract',
      recommendation: 'Avoid using selfdestruct as it can be dangerous and is deprecated.',
      affectedFunctions
    });
  }

  if (source.includes('tx.origin')) {
    const affectedFunctions = functions
      .filter(f => source.includes('tx.origin'))
      .map(f => f.name);

    securityIssues.push({
      severity: 'High',
      description: 'Usage of tx.origin found',
      location: 'Contract',
      recommendation: 'Use msg.sender instead of tx.origin for authentication.',
      affectedFunctions
    });
  }

  return {
    name: contractName,
    functions,
    events,
    stateVariables,
    securityIssues,
    version,
    license,
    inheritance,
    modifiers,
    roles,
    hasOwnership: functions.some(f => f.roles.includes('owner')),
    hasAccessControl: functions.some(f => f.roles.includes('admin'))
  };
}

export function generateFlowElements(contract: AnalyzedContract): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let yOffset = 0;

  // Contract node
  nodes.push({
    id: 'contract',
    type: 'default',
    data: { 
      label: (
        `${contract.name}\n` +
        `Version: ${contract.version}\n` +
        (contract.inheritance.length ? `Inherits: ${contract.inheritance.join(', ')}\n` : '') +
        (contract.license ? `License: ${contract.license}` : '')
      )
    },
    position: { x: 250, y: yOffset },
    style: { 
      background: '#e6f3ff', 
      border: '2px solid #0066cc', 
      padding: 10,
      borderRadius: '8px',
      width: 300,
      whiteSpace: 'pre-wrap'
    }
  });
  yOffset += 150;

  // Add roles
  contract.roles.forEach((role, index) => {
    const roleNodeId = `role-${role.name}`;
    nodes.push({
      id: roleNodeId,
      type: 'default',
      data: {
        label: `Role: ${role.name}\nFunctions: ${role.functions.length}`
      },
      position: { x: -300, y: yOffset + index * 100 },
      style: {
        background: '#f0f0f0',
        border: '2px solid #666',
        padding: 10,
        borderRadius: '8px',
        width: 200
      }
    });
    edges.push({
      id: `e-contract-${roleNodeId}`,
      source: 'contract',
      target: roleNodeId,
      animated: true,
      style: { stroke: '#666' }
    });
  });

  // Add state variables
  if (contract.stateVariables.length > 0) {
    const stateNodeId = 'state';
    nodes.push({
      id: stateNodeId,
      type: 'default',
      data: {
        label: `State Variables\n${contract.stateVariables.map(v => 
          `${v.visibility} ${v.type} ${v.name}${v.value ? ` = ${v.value}` : ''}\n` +
          `Accessed by: ${v.accessedBy.length} functions\n` +
          `Modified by: ${v.modifiedBy.length} functions`
        ).join('\n\n')}`
      },
      position: { x: -200, y: yOffset },
      style: {
        background: '#f0f0f0',
        border: '1px solid #666',
        padding: 10,
        borderRadius: '8px',
        width: 250,
        whiteSpace: 'pre-wrap'
      }
    });
    edges.push({
      id: `e-contract-${stateNodeId}`,
      source: 'contract',
      target: stateNodeId,
      animated: false,
      style: { stroke: '#666' }
    });
  }

  // Add functions
  contract.functions.forEach((func, index) => {
    const nodeId = `function-${index}`;
    const flowColors = {
      owner: { bg: '#ffe6e6', border: '#cc0000' },
      admin: { bg: '#fff0e6', border: '#cc6600' },
      user: { bg: '#e6ffe6', border: '#00cc00' },
      system: { bg: '#e6f3ff', border: '#0066cc' }
    };
    
    const colorScheme = flowColors[func.flowType];
    
    nodes.push({
      id: nodeId,
      type: 'default',
      data: {
        label: (
          `${func.name}(${func.inputs.map(i => `${i.type} ${i.name}`).join(', ')})\n` +
          `${func.outputs.length ? '→ ' + func.outputs.map(o => o.type).join(', ') + '\n' : ''}` +
          `${func.visibility} ${func.stateMutability}\n` +
          `Role: ${func.roles.join(', ')}\n` +
          (func.modifiers.length ? `Modifiers: ${func.modifiers.join(', ')}\n` : '') +
          (func.dependencies.length ? `Calls: ${func.dependencies.join(', ')}` : '')
        )
      },
      position: { x: 250, y: yOffset },
      style: {
        background: colorScheme.bg,
        border: `2px solid ${colorScheme.border}`,
        padding: 10,
        borderRadius: '8px',
        width: 300,
        whiteSpace: 'pre-wrap'
      }
    });

    // Add dependency edges
    func.dependencies.forEach(dep => {
      const depNodeId = `function-${contract.functions.findIndex(f => f.name === dep)}`;
      edges.push({
        id: `e-${nodeId}-${depNodeId}`,
        source: nodeId,
        target: depNodeId,
        animated: true,
        style: { stroke: colorScheme.border }
      });
    });

    edges.push({
      id: `e-contract-${nodeId}`,
      source: 'contract',
      target: nodeId,
      animated: true,
      style: { stroke: colorScheme.border }
    });
    yOffset += 150;
  });

  // Add events
  contract.events.forEach((event, index) => {
    const nodeId = `event-${index}`;
    nodes.push({
      id: nodeId,
      type: 'default',
      data: {
        label: (
          `Event: ${event.name}\n` +
          event.inputs.map(i => 
            `${i.type} ${i.indexed ? '(indexed) ' : ''}${i.name}`
          ).join('\n') +
          (event.anonymous ? '\nanonymous' : '') +
          (event.relatedFunctions.length ? `\n\nEmitted by:\n${event.relatedFunctions.join('\n')}` : '')
        )
      },
      position: { x: 700, y: 100 + index * 150 },
      style: { 
        background: '#fff0e6', 
        border: '2px solid #cc6600',
        borderRadius: '8px',
        padding: 10,
        width: 250,
        whiteSpace: 'pre-wrap'
      }
    });

    event.relatedFunctions.forEach(funcName => {
      const funcIndex = contract.functions.findIndex(f => f.name === funcName);
      if (funcIndex !== -1) {
        edges.push({
          id: `e-function-${funcIndex}-${nodeId}`,
          source: `function-${funcIndex}`,
          target: nodeId,
          animated: true,
          style: { stroke: '#cc6600' }
        });
      }
    });

    edges.push({
      id: `e-contract-${nodeId}`,
      source: 'contract',
      target: nodeId,
      animated: true,
      style: { stroke: '#cc6600' }
    });
  });

  // Add security issues
  if (contract.securityIssues.length > 0) {
    const securityNodeId = 'security';
    nodes.push({
      id: securityNodeId,
      type: 'default',
      data: {
        label: `Security Issues\n${contract.securityIssues.map(issue => 
          `[${issue.severity}] ${issue.description}\n` +
          (issue.affectedFunctions?.length ? 
            `Affected: ${issue.affectedFunctions.join(', ')}` : '')
        ).join('\n\n')}`
      },
      position: { x: -200, y: Math.max(yOffset, 500) },
      style: {
        background: '#ffe6e6',
        border: '2px solid #cc0000',
        padding: 10,
        borderRadius: '8px',
        width: 300,
        whiteSpace: 'pre-wrap'
      }
    });

    contract.securityIssues.forEach(issue => {
      issue.affectedFunctions?.forEach(funcName => {
        const funcIndex = contract.functions.findIndex(f => f.name === funcName);
        if (funcIndex !== -1) {
          edges.push({
            id: `e-function-${funcIndex}-security`,
            source: `function-${funcIndex}`,
            target: securityNodeId,
            animated: true,
            style: { stroke: '#cc0000' }
          });
        }
      });
    });

    edges.push({
      id: `e-contract-security`,
      source: 'contract',
      target: securityNodeId,
      animated: true,
      style: { stroke: '#cc0000' }
    });
  }

  return { nodes, edges };
}

export function generateUMLDiagram(contract: AnalyzedContract): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let yOffset = 0;

  // Contract class node
  nodes.push({
    id: 'contract',
    type: 'default',
    data: {
      label: (
        `${contract.name}\n` +
        `${'-'.repeat(30)}\n` +
        contract.stateVariables.map(v => 
          `${v.visibility === 'private' ? '-' : '+'} ${v.name}: ${v.type}`
        ).join('\n') +
        `\n${'-'.repeat(30)}\n` +
        contract.functions.map(f => 
          `${f.visibility === 'private' ? '-' : '+'} ${f.name}(${
            f.inputs.map(i => `${i.name}: ${i.type}`).join(', ')
          }): ${f.outputs.map(o => o.type).join(', ') || 'void'}`
        ).join('\n')
      )
    },
    position: { x: 300, y: yOffset },
    style: {
      background: '#e6f3ff',
      border: '2px solid #0066cc',
      padding: 10,
      borderRadius: '8px',
      width: 400,
      whiteSpace: 'pre-wrap',
      fontFamily: 'monospace'
    }
  });

  // Inheritance relationships
  contract.inheritance.forEach((parent, index) => {
    const parentId = `parent-${index}`;
    nodes.push({
      id: parentId,
      type: 'default',
      data: { label: parent },
      position: { x: 300 + index * 200, y: -100 },
      style: {
        background: '#f0f0f0',
        border: '2px solid #666',
        padding: 10,
        borderRadius: '8px',
        width: 150
      }
    });
    edges.push({
      id: `e-${parentId}-contract`,
      source: parentId,
      target: 'contract',
      animated: false,
      style: { stroke: '#666' }
    });
  });

  // Event nodes
  contract.events.forEach((event, index) => {
    const eventId = `event-${index}`;
    nodes.push({
      id: eventId,
      type: 'default',
      data: {
        label: (
          `«event»\n${event.name}\n` +
          `${'-'.repeat(20)}\n` +
          event.inputs.map(i => 
            `+ ${i.name}: ${i.type}${i.indexed ? ' (indexed)' : ''}`
          ).join('\n')
        )
      },
      position: { x: 800, y: 100 + index * 150 },
      style: {
        background: '#fff0e6',
        border: '2px solid #cc6600',
        padding: 10,
        borderRadius: '8px',
        width: 250,
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace'
      }
    });
  });

  return { nodes, edges };
}

export function generateStateDiagram(contract: AnalyzedContract): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Create nodes for state variables
  contract.stateVariables.forEach((stateVar, index) => {
    nodes.push({
      id: `state-${index}`,
      type: 'default',
      data: {
        label: `${stateVar.name}\n${stateVar.type}\n${stateVar.value || '(uninitialized)'}`
      },
      position: { x: 200, y: index * 150 },
      style: {
        background: '#e6ffe6',
        border: '2px solid #00cc00',
        padding: 10,
        borderRadius: '8px',
        width: 200,
        whiteSpace: 'pre-wrap'
      }
    });
  });

  // Create nodes for functions that modify state
  contract.functions
    .filter(func => {
      const modifiesState = contract.stateVariables.some(v => 
        v.modifiedBy.includes(func.name)
      );
      return modifiesState;
    })
    .forEach((func, index) => {
      const nodeId = `function-${index}`;
      nodes.push({
        id: nodeId,
        type: 'default',
        data: {
          label: `${func.name}\n${func.visibility} ${func.stateMutability}`
        },
        position: { x: 500, y: index * 150 },
        style: {
          background: '#e6f3ff',
          border: '2px solid #0066cc',
          padding: 10,
          borderRadius: '8px',
          width: 200,
          whiteSpace: 'pre-wrap'
        }
      });

      // Connect functions to the state variables they modify
      contract.stateVariables.forEach((stateVar, stateIndex) => {
        if (stateVar.modifiedBy.includes(func.name)) {
          edges.push({
            id: `e-${nodeId}-state-${stateIndex}`,
            source: nodeId,
            target: `state-${stateIndex}`,
            animated: true,
            label: 'modifies',
            style: { stroke: '#0066cc' }
          });
        }
      });
    });

  return { nodes, edges };
}