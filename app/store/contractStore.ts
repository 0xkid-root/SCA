"use client";

import { create } from 'zustand';
import { AnalyzedContract, ContractFunction, analyzeContract } from '../lib/contractAnalyzer';

interface ContractInput {
  id: string;
  name: string;
  source: string;
}

interface ContractStore {
  contracts: ContractInput[];
  analyzedContracts: Map<string, AnalyzedContract>;
  selectedContract: string;
  activeTab: string;
  error: string | null;
  selectedFunction: ContractFunction | null;
  showSubFlow: boolean;
  
  // Actions
  addContract: () => void;
  removeContract: (id: string) => void;
  updateContractSource: (id: string, source: string) => void;
  updateContractName: (id: string, name: string) => void;
  analyzeContracts: () => void;
  setSelectedContract: (id: string) => void;
  setActiveTab: (tab: string) => void;
  setError: (error: string | null) => void;
  setSelectedFunction: (func: ContractFunction | null) => void;
  setShowSubFlow: (show: boolean) => void;
  addContractsFromFiles: (files: File[]) => Promise<void>;
}

export const useContractStore = create<ContractStore>((set, get) => ({
  contracts: [{ id: '1', name: 'Contract 1', source: '' }],
  analyzedContracts: new Map(),
  selectedContract: '1',
  activeTab: 'visualization',
  error: null,
  selectedFunction: null,
  showSubFlow: false,

  addContract: () => {
    const { contracts } = get();
    const newId = String(contracts.length + 1);
    set(state => ({
      contracts: [...state.contracts, { 
        id: newId, 
        name: `Contract ${newId}`, 
        source: '' 
      }]
    }));
  },

  removeContract: (id: string) => {
    const { contracts, analyzedContracts, selectedContract } = get();
    if (contracts.length > 1) {
      const newContracts = contracts.filter(c => c.id !== id);
      const newAnalyzed = new Map(analyzedContracts);
      newAnalyzed.delete(id);
      
      // If we're removing the selected contract, select the first available one
      const newSelectedContract = selectedContract === id ? newContracts[0].id : selectedContract;
      
      set({
        contracts: newContracts,
        analyzedContracts: newAnalyzed,
        selectedContract: newSelectedContract
      });
    }
  },

  updateContractSource: (id: string, source: string) => {
    set(state => ({
      contracts: state.contracts.map(c => 
        c.id === id ? { ...c, source } : c
      )
    }));
  },

  updateContractName: (id: string, name: string) => {
    set(state => ({
      contracts: state.contracts.map(c => 
        c.id === id ? { ...c, name } : c
      )
    }));
  },

  analyzeContracts: () => {
    try {
      const { contracts } = get();
      const newAnalyzed = new Map<string, AnalyzedContract>();
      let hasError = false;
      let errorMessage = '';
      
      // Filter out contracts with empty source
      const contractsToAnalyze = contracts.filter(c => c.source.trim());
      
      if (contractsToAnalyze.length === 0) {
        set({
          error: 'No contracts to analyze. Please add contract source code.',
          analyzedContracts: new Map()
        });
        return;
      }

      // Analyze each contract
      contractsToAnalyze.forEach(contract => {
        try {
          const analysis = analyzeContract(contract.source);
          newAnalyzed.set(contract.id, {
            ...analysis,
            name: contract.name // Ensure the contract name is preserved
          });
        } catch (err: any) {
          hasError = true;
          errorMessage += `Error analyzing ${contract.name}: ${err.message}\n`;
        }
      });

      if (hasError && newAnalyzed.size === 0) {
        // If all contracts failed to analyze
        set({
          error: errorMessage,
          analyzedContracts: new Map()
        });
        return;
      }

      // Set the first analyzed contract as selected if current selection is invalid
      const firstAnalyzedId = Array.from(newAnalyzed.keys())[0];
      
      set(state => ({
        analyzedContracts: newAnalyzed,
        error: hasError ? errorMessage : null,
        activeTab: 'visualization',
        selectedFunction: null,
        showSubFlow: false,
        selectedContract: state.selectedContract && newAnalyzed.has(state.selectedContract) 
          ? state.selectedContract 
          : firstAnalyzedId
      }));
    } catch (err: any) {
      set({
        error: `Error analyzing contracts: ${err.message}`,
        analyzedContracts: new Map()
      });
    }
  },

  setSelectedContract: (id: string) => set({ selectedContract: id }),
  setActiveTab: (tab: string) => set({ activeTab: tab }),
  setError: (error: string | null) => set({ error }),
  setSelectedFunction: (func: ContractFunction | null) => set({ selectedFunction: func }),
  setShowSubFlow: (show: boolean) => set({ showSubFlow: show }),

  addContractsFromFiles: async (files: File[]) => {
    try {
      const { contracts } = get();
      const newContracts: ContractInput[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await file.text();
        newContracts.push({
          id: String(contracts.length + i + 1),
          name: file.name.replace(/\.[^/.]+$/, ""),
          source: content
        });
      }

      set(state => ({
        contracts: [...state.contracts, ...newContracts],
        error: null
      }));
    } catch (err: any) {
      set({ error: 'Error reading contract files. Please try again.' });
    }
  }
}));