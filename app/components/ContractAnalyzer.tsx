"use client";

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Code, FileJson, Shield, Plus, Trash2, Upload, Download } from "lucide-react";
import { SecurityIssue } from '../lib/contractAnalyzer';
import DynamicFlowChart from './DynamicFlowChart';
import FunctionSubFlow from './FunctionSubFlow';
import { Input } from "@/components/ui/input";
import { useContractStore } from '../store/contractStore';

export default function ContractAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    contracts,
    analyzedContracts,
    selectedContract,
    activeTab,
    error,
    selectedFunction,
    showSubFlow,
    addContract,
    removeContract,
    updateContractSource,
    updateContractName,
    analyzeContracts,
    setSelectedContract,
    setActiveTab,
    setError,
    setSelectedFunction,
    setShowSubFlow,
    addContractsFromFiles
  } = useContractStore();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    await addContractsFromFiles(Array.from(files));
  };

  const downloadContract = (contract: { name: string; source: string }) => {
    const blob = new Blob([contract.source], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.name}.sol`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderSecurityIssue = (issue: SecurityIssue) => {
    const severityColors = {
      High: 'neon-border-purple bg-purple-500/10',
      Medium: 'neon-border bg-emerald-500/10',
      Low: 'neon-border-blue bg-blue-500/10',
      Info: 'border-white/20 bg-white/5'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Alert className={`${severityColors[issue.severity]} backdrop-blur-lg mb-4`}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            {issue.severity} Risk - {issue.location}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">{issue.description}</p>
            <p className="text-sm font-medium">Recommendation:</p>
            <p className="text-sm">{issue.recommendation}</p>
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-lg neon-border bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <motion.h2 
            className="text-2xl font-bold neon-text"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Contract Analysis Dashboard
          </motion.h2>
          <div className="flex gap-2">
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".sol,.json"
              multiple
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="neon-border bg-black/50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Contracts
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                onClick={addContract}
                className="neon-border bg-black/50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contract
              </Button>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contracts.map((contract, index) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="rounded-lg neon-border bg-black/50 p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={contract.name}
                  onChange={(e) => updateContractName(contract.id, e.target.value)}
                  className="text-lg font-semibold bg-transparent border-none p-0 focus:outline-none neon-text"
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadContract(contract)}
                    className="hover:neon-border"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {contracts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContract(contract.id)}
                      className="hover:neon-border"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Code className="h-4 w-4" />
                <span>Solidity contract source code or ABI</span>
              </div>
              <Textarea
                placeholder="// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Example {
    // Paste your contract here
}"
                value={contract.source}
                onChange={(e) => updateContractSource(contract.id, e.target.value)}
                className="font-mono bg-black/30 border-white/10 min-h-[200px]"
              />
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="mt-6"
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={analyzeContracts} 
            className="w-full neon-border bg-black/50 hover:bg-emerald-500/20"
            disabled={!contracts.some(c => c.source.trim())}
          >
            Analyze Contracts
          </Button>
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {analyzedContracts.size > 0 && (
        <div className="rounded-lg neon-border bg-black/50 backdrop-blur-sm p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-black/50 neon-border">
              <TabsTrigger value="visualization" className="data-[state=active]:neon-text">
                <FileJson className="h-4 w-4 mr-2" />
                Visualization
              </TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:neon-text">
                <Code className="h-4 w-4 mr-2" />
                Contract Details
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:neon-text">
                <Shield className="h-4 w-4 mr-2" />
                Security Analysis
                {Array.from(analyzedContracts.values()).reduce((sum, contract) => 
                  sum + contract.securityIssues.length, 0) > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs neon-border rounded-full">
                    {Array.from(analyzedContracts.values()).reduce((sum, contract) => 
                      sum + contract.securityIssues.length, 0)}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visualization" className="space-y-4">
              {showSubFlow && selectedFunction ? (
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFunction(null);
                      setShowSubFlow(false);
                    }}
                    className="neon-border bg-black/50"
                  >
                    Back to Contract Flow
                  </Button>
                  <FunctionSubFlow func={selectedFunction} />
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    {Array.from(analyzedContracts.entries()).map(([id, contract]) => (
                      <Button
                        key={id}
                        variant={selectedContract === id ? "default" : "outline"}
                        onClick={() => setSelectedContract(id)}
                        className={selectedContract === id ? 
                          "neon-border bg-emerald-500/20" : 
                          "neon-border bg-black/50"}
                      >
                        {contract.name}
                      </Button>
                    ))}
                  </div>
                  <div className="h-[800px] w-full rounded-lg neon-border bg-black/50 overflow-hidden">
                    {analyzedContracts.get(selectedContract) && (
                      <DynamicFlowChart
                        elements={analyzedContracts.get(selectedContract)!}
                        onFunctionClick={(func) => {
                          setSelectedFunction(func);
                          setShowSubFlow(true);
                        }}
                      />
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <div className="flex gap-2 mb-4">
                {Array.from(analyzedContracts.entries()).map(([id, contract]) => (
                  <Button
                    key={id}
                    variant={selectedContract === id ? "default" : "outline"}
                    onClick={() => setSelectedContract(id)}
                    className={selectedContract === id ? 
                      "neon-border bg-emerald-500/20" : 
                      "neon-border bg-black/50"}
                  >
                    {contracts.find(c => c.id === id)?.name || contract.name}
                  </Button>
                ))}
              </div>

              {analyzedContracts.get(selectedContract) && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 neon-text">
                      <Code className="h-4 w-4" />
                      Functions ({analyzedContracts.get(selectedContract)!.functions.length})
                    </h4>
                    <div className="grid gap-3">
                      {analyzedContracts.get(selectedContract)!.functions.map((func, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 rounded-lg cursor-pointer ${
                            func.payable ? 'neon-border-purple bg-purple-500/10' :
                            func.stateMutability === 'view' ? 'neon-border bg-emerald-500/10' :
                            'neon-border-blue bg-blue-500/10'
                          }`}
                          onClick={() => {
                            setSelectedFunction(func);
                            setShowSubFlow(true);
                            setActiveTab('visualization');
                          }}
                        >
                          <p className="font-mono">
                            {func.name}({func.inputs.map(i => `${i.type} ${i.name}`).join(', ')})
                            {func.outputs.length ? ' → ' + func.outputs.map(o => o.type).join(', ') : ''}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-sm px-2 py-1 rounded-full bg-white/10">
                              {func.visibility}
                            </span>
                            <span className="text-sm px-2 py-1 rounded-full bg-white/10">
                              {func.stateMutability}
                            </span>
                            {func.modifiers.map((modifier, idx) => (
                              <span 
                                key={idx}
                                className="text-sm px-2 py-1 rounded-full neon-border"
                              >
                                {modifier}
                              </span>
                            ))}
                            {func.roles.map((role, idx) => (
                              <span 
                                key={idx}
                                className="text-sm px-2 py-1 rounded-full neon-border-purple"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                          {func.dependencies.length > 0 && (
                            <div className="mt-2 text-sm text-gray-400">
                              Dependencies: {func.dependencies.join(', ')}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {analyzedContracts.get(selectedContract)!.events.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3 neon-text">
                        Events ({analyzedContracts.get(selectedContract)!.events.length})
                      </h4>
                      <div className="grid gap-3">
                        {analyzedContracts.get(selectedContract)!.events.map((event, index) => (
                          <motion.div 
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-lg neon-border-blue bg-blue-500/10"
                          >
                            <p className="font-mono">
                              {event.name}({event.inputs.map(i => 
                                `${i.type}${i.indexed ? ' indexed' : ''} ${i.name}`
                              ).join(', ')})
                            </p>
                            {event.anonymous && (
                              <span className="text-sm px-2 py-1 rounded-full bg-white/10 mt-2 inline-block">
                                anonymous
                              </span>
                            )}
                            {event.relatedFunctions.length > 0 && (
                              <div className="mt-2 text-sm text-gray-400">
                                Emitted by: {event.relatedFunctions.join(', ')}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analyzedContracts.get(selectedContract)!.stateVariables.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3 neon-text">
                        State Variables ({analyzedContracts.get(selectedContract)!.stateVariables.length})
                      </h4>
                      <div className="grid gap-3">
                        {analyzedContracts.get(selectedContract)!.stateVariables.map((variable, index) => (
                          <motion.div 
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-lg neon-border bg-emerald-500/10"
                          >
                            <p className="font-mono">
                              {variable.visibility} {variable.type} {variable.name}
                              {variable.value ? ` = ${variable.value}` : ''}
                            </p>
                            <div className="mt-2 text-sm text-gray-400">
                              <div>Accessed by: {variable.accessedBy.join(', ') || 'None'}</div>
                              <div>Modified by: {variable.modifiedBy.join(', ') || 'None'}</div>
                            </div>
                            {variable.constant && (
                              <span className="text-sm px-2 py-1 rounded-full neon-border mt-2 inline-block">
                                constant
                              </span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5" />
                <h4 className="text-lg font-semibold neon-text">Security Analysis</h4>
              </div>

              {Array.from(analyzedContracts.entries()).map(([id, contract]) => (
                <div key={id} className="space-y-4">
                  <h5 className="text-lg font-semibold neon-text">
                    {contracts.find(c => c.id === id)?.name || contract.name}
                  </h5>
                  
                  {contract.securityIssues.length === 0 ? (
                    <Alert className="neon-border bg-emerald-500/10">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>No Security Issues Found</AlertTitle>
                      <AlertDescription>
                        The initial analysis didn't detect any common security issues. However, always conduct thorough audits before deployment.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {contract.securityIssues.map((issue, index) => (
                        <div key={index}>
                          {renderSecurityIssue(issue)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}