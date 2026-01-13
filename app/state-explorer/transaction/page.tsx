/**
 * Transaction Component
 *
 * Component for creating and viewing transactions
 * Shows when channel is active (initialized)
 */

"use client";

import { useState } from "react";
import { Button, Input, Label, Card, CardContent } from "@tokamak/ui";

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  timestamp: Date;
  status: "pending" | "completed";
}

export function TransactionPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");

  const handleCreateTransaction = async () => {
    // TODO: Implement transaction creation
    const newTx: Transaction = {
      id: Date.now().toString(),
      from: "0x...",
      to: toAddress,
      amount,
      timestamp: new Date(),
      status: "pending",
    };
    setTransactions([...transactions, newTx]);
    setShowCreateForm(false);
    setToAddress("");
    setAmount("");
  };

  return (
    <div className="space-y-6">
      {/* Create Transaction Button */}
      {!showCreateForm && (
        <div>
          <Button onClick={() => setShowCreateForm(true)}>
            Create New Transaction
          </Button>
        </div>
      )}

      {/* Create Transaction Form */}
      {showCreateForm && (
        <Card className="max-w-2xl">
          <CardContent className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold">Create Transaction</h3>

            <div>
              <Label required>To Address</Label>
              <Input
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="Enter recipient address (0x...)"
                className="mt-2 font-mono"
              />
            </div>

            <div>
              <Label required>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-2"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateTransaction} className="flex-1">
                Create Transaction
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setToAddress("");
                  setAmount("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No transactions yet. Create your first transaction above.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{tx.amount} TON</p>
                      <p className="text-sm text-gray-600 font-mono">
                        To: {tx.to}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {tx.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tx.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
