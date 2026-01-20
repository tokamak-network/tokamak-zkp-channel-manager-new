/**
 * Create Channel Page
 *
 * Page for creating a new channel transaction
 */

"use client";

import { Suspense } from "react";
import { CreateChannelForm } from "./_components/CreateChannelForm";
import { SecurityBanner } from "@/components/SecurityBanner";

function CreateChannelPageContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-[40px] font-medium font-mono text-[#111111]">
        Create Channel
      </h1>

      {/* Security Banner */}
      <SecurityBanner />

      <CreateChannelForm />
    </div>
  );
}

export default function CreateChannelPage() {
  return (
    <Suspense
      fallback={
        <div>
          <h1 className="text-[40px] font-medium font-mono text-[#111111] mb-8">
            Create Channel
          </h1>
          <p className="text-[#999999] font-mono">Loading...</p>
        </div>
      }
    >
      <CreateChannelPageContent />
    </Suspense>
  );
}
