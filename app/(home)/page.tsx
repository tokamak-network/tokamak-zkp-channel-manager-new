/**
 * Home Page
 *
 * Landing page with Create Channel and Join Channel options
 */

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@tokamak/ui";
import { AccountHeader } from "@/components/AccountHeader";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Account Header - Top Right */}
      <AccountHeader />

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gray-900">
              Tokamak ZKP Channel Manager
            </h1>
            <p className="text-xl text-gray-600">
              Manage your zero-knowledge proof channels
            </p>
          </div>

          {/* Action Buttons - Vertical Layout */}
          <div className="flex flex-col gap-4 items-center pt-8">
            <Button
              size="lg"
              className="w-80 h-16 text-lg"
              onClick={() => router.push("/create-channel")}
            >
              Create Channel
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-80 h-16 text-lg"
              onClick={() => router.push("/join-channel")}
            >
              Join Channel
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
