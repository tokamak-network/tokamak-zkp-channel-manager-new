/**
 * Proof Status Badge Component
 *
 * Displays a status badge for proof status (verified, pending, rejected)
 */

import { CheckCircle, Clock, XCircle } from "lucide-react";

interface ProofStatusBadgeProps {
  status: "verified" | "pending" | "rejected";
}

export function ProofStatusBadge({ status }: ProofStatusBadgeProps) {
  switch (status) {
    case "verified":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    default:
      return null;
  }
}
