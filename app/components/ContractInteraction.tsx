"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SIMPLE_STORAGE_ABI, SIMPLE_STORAGE_ADDRESS } from '../contracts/SimpleStorage';

export default function ContractInteraction() {
  const [value, setValue] = useState('');
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connectWallet() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return new ethers.BrowserProvider(window.ethereum);
      }
      throw new Error('Please install MetaMask');
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }

  async function storeValue() {
    setLoading(true);
    setError(null);
    try {
      const provider = await connectWallet();
      if (!provider) return;

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        SIMPLE_STORAGE_ADDRESS,
        SIMPLE_STORAGE_ABI,
        signer
      );

      const tx = await contract.store(value);
      await tx.wait();
      setValue('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function retrieveValue() {
    setLoading(true);
    setError(null);
    try {
      const provider = await connectWallet();
      if (!provider) return;

      const contract = new ethers.Contract(
        SIMPLE_STORAGE_ADDRESS,
        SIMPLE_STORAGE_ABI,
        provider
      );

      const result = await contract.retrieve();
      setStoredValue(result.toString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-4">Smart Contract Interaction</h2>
          <div className="flex gap-4 mb-4">
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter a number"
              className="flex-1"
            />
            <Button
              onClick={storeValue}
              disabled={loading || !value}
            >
              Store Value
            </Button>
          </div>
          <Button
            onClick={retrieveValue}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Retrieve Value
          </Button>
        </div>

        {storedValue && (
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <p className="text-lg">Stored Value: {storedValue}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
            <p>{error}</p>
          </div>
        )}
      </div>
    </Card>
  );
}