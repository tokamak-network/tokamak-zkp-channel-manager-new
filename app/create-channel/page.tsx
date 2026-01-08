/**
 * Create Channel Page
 * 
 * Single-page flow for creating a channel:
 * Step 1: Create Channel Transaction
 * Step 2: MPT Key Generation + Deposit (Leader + Participants)
 * Step 3: Initialize State (Leader only)
 */

'use client';

import { useChannelFlowStore } from '@/stores';
import { Stepper } from '@tokamak/ui';
import { Step1CreateChannel } from './_components/Step1CreateChannel';
import { Step2Deposit } from './_components/Step2Deposit';
import { Step3InitializeState } from './_components/Step3InitializeState';

const STEPS = ['Create Channel', 'Deposit', 'Initialize State'];

export default function CreateChannelPage() {
  const step = useChannelFlowStore((state) => state.step);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Channel</h1>
        <p className="text-gray-600">Set up a new ZK-Rollup channel</p>
      </div>

      <div className="mb-8">
        <Stepper steps={STEPS} currentStep={step} />
      </div>

      <div className="mt-8">
        {step === 1 && <Step1CreateChannel />}
        {step === 2 && <Step2Deposit />}
        {step === 3 && <Step3InitializeState />}
      </div>
    </main>
  );
}

