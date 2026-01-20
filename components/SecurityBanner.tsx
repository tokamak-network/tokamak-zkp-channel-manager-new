/**
 * Security Banner Component
 *
 * Displays ZK proof security guarantee message
 * Shows that all participants are equally bound by proof verification
 */

import { ShieldCheck } from "lucide-react";

export function SecurityBanner() {
  return (
    <div
      className="flex items-start gap-3 font-mono"
      style={{
        width: 544,
        padding: "12px 16px",
        backgroundColor: "rgba(15, 188, 188, 0.08)",
        borderRadius: 6,
        border: "1px solid rgba(15, 188, 188, 0.2)",
      }}
    >
      <ShieldCheck
        className="flex-shrink-0"
        style={{ width: 20, height: 20, color: "#0FBCBC", marginTop: 2 }}
      />
      <div className="flex flex-col gap-1">
        <span
          className="font-medium"
          style={{ fontSize: 14, color: "#0FBCBC" }}
        >
          Don&apos;t Trust. Verify.
        </span>
        <span style={{ fontSize: 13, color: "#666666", lineHeight: "1.4" }}>
          Channel leaders and participants are equally bound by proof
          verification. No one can cheat.
        </span>
      </div>
    </div>
  );
}
