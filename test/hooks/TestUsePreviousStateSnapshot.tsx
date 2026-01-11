"use client";

/**
 * Test page component for usePreviousStateSnapshot hook
 * 
 * Tests the hook with channel ID 10 to verify it correctly fetches
 * initial state from on-chain data using hooks from hooks/contract.
 */

import { useState } from "react";
import { usePreviousStateSnapshot } from "@/components/_hooks/usePreviousStateSnapshot";
import { Button } from "@tokamak/ui";

export default function TestUsePreviousStateSnapshot() {
  const [channelId, setChannelId] = useState<string>("10");
  const { previousStateSnapshot, isLoading, error, fetchSnapshot } =
    usePreviousStateSnapshot({
      channelId,
      bundleSnapshot: null,
    });

  const handleFetch = async () => {
    try {
      const snapshot = await fetchSnapshot();
      console.log("Fetched snapshot:", snapshot);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Test: usePreviousStateSnapshot Hook
      </h1>
      <p className="text-gray-600 mb-6">
        Testing with Channel ID: <strong>{channelId}</strong>
      </p>

      <div className="mb-4 space-x-2">
        <input
          type="text"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          placeholder="Channel ID"
          className="px-3 py-2 border rounded"
        />
        <Button onClick={handleFetch} disabled={isLoading}>
          {isLoading ? "Fetching..." : "Fetch Snapshot"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {previousStateSnapshot && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Snapshot Data:</h2>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Basic Info:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Channel ID:</strong> {previousStateSnapshot.channelId}
                </li>
                <li>
                  <strong>State Root:</strong>{" "}
                  {previousStateSnapshot.stateRoot}
                </li>
                <li>
                  <strong>Contract Address:</strong>{" "}
                  {previousStateSnapshot.contractAddress}
                </li>
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">
                Registered Keys ({previousStateSnapshot.registeredKeys.length}):
              </h3>
              <div className="max-h-40 overflow-y-auto bg-white p-2 rounded border">
                {previousStateSnapshot.registeredKeys.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {previousStateSnapshot.registeredKeys.map((key, idx) => (
                      <li key={idx} className="font-mono">
                        {key}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No registered keys</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">
                Storage Entries (
                {previousStateSnapshot.storageEntries.length}):
              </h3>
              <div className="max-h-40 overflow-y-auto bg-white p-2 rounded border">
                {previousStateSnapshot.storageEntries.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {previousStateSnapshot.storageEntries.map((entry, idx) => (
                      <li key={idx} className="font-mono">
                        <strong>Key:</strong> {entry.key}
                        <br />
                        <strong>Value:</strong> {entry.value}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No storage entries</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">
                Pre-allocated Leaves (
                {previousStateSnapshot.preAllocatedLeaves.length}):
              </h3>
              <div className="max-h-40 overflow-y-auto bg-white p-2 rounded border">
                {previousStateSnapshot.preAllocatedLeaves.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {previousStateSnapshot.preAllocatedLeaves.map(
                      (leaf, idx) => (
                        <li key={idx} className="font-mono">
                          <strong>Key:</strong> {leaf.key}
                          <br />
                          <strong>Value:</strong> {leaf.value}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-500">No pre-allocated leaves</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Raw JSON:</h3>
              <pre className="bg-white p-4 rounded border overflow-auto text-xs">
                {JSON.stringify(previousStateSnapshot, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800">Loading snapshot...</p>
        </div>
      )}
    </div>
  );
}
