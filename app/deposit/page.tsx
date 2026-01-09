/**
 * Deposit Page
 * 
 * Deposit tokens to a channel
 * Supports channel selection for participants
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Step2Deposit } from '@/app/create-channel/_components/Step2Deposit';

function DepositPageContent() {
  return <Step2Deposit />;
}

export default function DepositPage() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2 text-[var(--foreground)]">
          Deposit Tokens
        </h2>
        <p className="text-[var(--muted-foreground)]">
          Deposit tokens to your channel
        </p>
      </div>

      <Suspense fallback={
        <div className="p-8 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }>
        <DepositPageContent />
      </Suspense>
    </>
  );
}
