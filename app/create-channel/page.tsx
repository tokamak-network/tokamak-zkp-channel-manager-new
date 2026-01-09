/**
 * Create Channel Page
 *
 * Page for creating a new channel transaction
 */

"use client";

import { Suspense } from "react";
import { Step1CreateChannel } from "./_components/Step1CreateChannel";

function CreateChannelPageContent() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2 text-[var(--foreground)]">
          Create Channel
        </h2>
        <p className="text-[var(--muted-foreground)]">
          Set up a new ZK-Rollup channel
        </p>
      </div>

      <div className="mt-8">
        <Step1CreateChannel />
      </div>
    </>
  );
}

export default function CreateChannelPage() {
  return (
    <Suspense
      fallback={
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2 text-[var(--foreground)]">
            Create Channel
          </h2>
          <p className="text-[var(--muted-foreground)]">Loading...</p>
        </div>
      }
    >
      <CreateChannelPageContent />
    </Suspense>
  );
}
