/**
 * Deposit Section
 *
 * Component for depositing tokens to channel
 * Shows when channel is not initialized
 */

"use client";

import { useState } from "react";
import { Button, Input, Label, Card, CardContent } from "@tokamak/ui";
import { useDepositStore } from "@/stores/useDepositStore";
import { useGenerateMptKey } from "@/hooks/useGenerateMptKey";

interface DepositSectionProps {
  channelId: string;
}

export function DepositSection({ channelId }: DepositSectionProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  
  const currentUserMPTKey = useDepositStore((state) => state.currentUserDeposit.mptKey);
  const setCurrentUserMPTKey = useDepositStore((state) => state.setCurrentUserMPTKey);
  
  // Use the MPT key generation hook
  const { generate, isGenerating, error: mptKeyError } = useGenerateMptKey({
    channelId: channelId || null,
    slotIndex: 0,
    onMptKeyGenerated: setCurrentUserMPTKey,
  });

  const handleGenerateKey = async () => {
    const accountInfo = await generate();
    if (accountInfo) {
      console.log("✅ MPT Key generated successfully:", accountInfo.mptKey);
    }
  };

  const handleDeposit = async () => {
    setIsDepositing(true);
    // TODO: Implement deposit transaction
    console.log("Deposit:", { channelId, depositAmount, l2MptKey: currentUserMPTKey });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsDepositing(false);
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-6 pt-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Deposit Tokens</h3>
          <p className="text-gray-600 text-sm">
            Generate your L2 MPT Key and deposit tokens to the channel
          </p>
        </div>

        {/* L2 MPT Key */}
        <div>
          <Label>L2 MPT Key</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={currentUserMPTKey || ""}
              placeholder="Generate your L2 MPT Key"
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              onClick={handleGenerateKey}
              disabled={isGenerating || !!currentUserMPTKey}
              variant="outline"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </div>
          {mptKeyError && (
            <p className="text-sm text-red-500 mt-1">{mptKeyError}</p>
          )}
          {!mptKeyError && (
            <p className="text-sm text-gray-500 mt-1">
              Generate a unique key for this channel
            </p>
          )}
        </div>

        {/* Deposit Amount */}
        <div>
          <Label required>Deposit Amount</Label>
          <Input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Enter amount to deposit"
            className="mt-2"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter the amount of TON to deposit
          </p>
        </div>

        {/* Deposit Button */}
        <Button
          onClick={handleDeposit}
          disabled={!currentUserMPTKey || !depositAmount || isDepositing}
          className="w-full"
        >
          {isDepositing ? "Depositing..." : "Deposit"}
        </Button>
      </CardContent>
    </Card>
  );
}
