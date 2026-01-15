/**
 * Home Page
 *
 * Landing page with wallet connection and channel management options
 * Based on Figma design:
 * - Not connected: node-id=3110-6058
 * - Connected: node-id=3110-6126
 */

"use client";

import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { AccountHeader } from "@/components/AccountHeader";

export default function HomePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();

  const handleConnect = () => {
    // Try to connect with injected connector first
    const injected = connectors.find((c) => c.id === "injected");
    if (injected) {
      connect({ connector: injected });
    } else if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-hidden ${
        !isConnected ? "bg-[#F8F8F8]" : "bg-white"
      }`}
    >
      {/* Account Header - Top Right */}
      <AccountHeader />

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div
          className="text-center space-y-8 w-full"
          style={{ maxWidth: "1440px" }}
        >
          {!isConnected ? (
            /* Wallet Not Connected State - node-id=3110-6058 */
            <div className="space-y-8">
              <div className="space-y-4">
                <h1
                  className="text-black"
                  style={{
                    fontFamily:
                      'var(--font-jersey-10), "Jersey 10", sans-serif',
                    fontSize: "64px",
                    fontWeight: "400",
                    lineHeight: "1.2",
                    letterSpacing: "0.02em",
                  }}
                >
                  Tokamak ZKP Channel Manager
                </h1>
                <p
                  style={{
                    fontSize: "20px",
                    lineHeight: "1.5",
                    fontFamily: 'var(--font-ibm-plex-mono), "IBM Plex Mono", monospace',
                    fontWeight: "400",
                    color: "#000000",
                  }}
                >
                  Manage your zero-knowledge proof channels
                </p>
              </div>

              {/* Connect Wallet Button - node-id=3110-6276 */}
              <div className="pt-8">
                <button
                  onClick={handleConnect}
                  disabled={isPending}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    width: "auto",
                    minWidth: "200px",
                    padding: "16px 32px",
                    fontSize: "18px",
                    fontFamily: 'monospace, "Courier New", Courier, monospace',
                    fontWeight: "400",
                    color: "#000000",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #000000",
                    borderRadius: "8px",
                    lineHeight: "1.5",
                    letterSpacing: "0",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  {isPending ? "Connecting..." : "Connect Wallet"}
                </button>
              </div>
            </div>
          ) : (
            /* Wallet Connected State - node-id=3110-6126 */
            <div className="space-y-8">
              <div className="space-y-4">
                <h1
                  className="text-black"
                  style={{
                    fontFamily:
                      'var(--font-jersey-10), "Jersey 10", sans-serif',
                    fontSize: "64px",
                    fontWeight: "400",
                    lineHeight: "1.2",
                    letterSpacing: "0.02em",
                  }}
                >
                  Tokamak ZKP Channel Manager
                </h1>
                <p
                  style={{
                    fontSize: "20px",
                    lineHeight: "1.5",
                    fontFamily: 'var(--font-ibm-plex-mono), "IBM Plex Mono", monospace',
                    fontWeight: "400",
                    color: "#000000",
                  }}
                >
                  Manage your zero-knowledge proof channels
                </p>
              </div>

              {/* Action Buttons - Side by Side */}
              <div className="flex flex-row gap-4 items-center justify-center pt-8">
                <button
                  onClick={() => router.push("/create-channel")}
                  className="text-white font-normal bg-[#4278F5] border border-[#ACCAFF] rounded-lg hover:opacity-90 transition-opacity"
                  style={{
                    width: "200px",
                    height: "64px",
                    fontSize: "18px",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  Create Channel
                </button>
                <button
                  onClick={() => router.push("/join-channel")}
                  className="text-white font-normal bg-[#7E57FB] border border-[#D8CFFF] rounded-lg hover:opacity-90 transition-opacity"
                  style={{
                    width: "200px",
                    height: "64px",
                    fontSize: "18px",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  Join Channel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
