import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tokamak ZKP Channel Manager",
    template: "%s | Tokamak ZKP",
  },
  description: "ZK-Rollup State Channel Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        {/* 
          TODO: Add providers here
          - WagmiProvider
          - QueryClientProvider
          - ThemeProvider
        */}
        {children}
      </body>
    </html>
  );
}
