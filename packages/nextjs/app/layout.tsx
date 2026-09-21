import type { Metadata } from "next";
import "~~/styles/globals.css";

export const metadata: Metadata = {
  title: "AgentGuard on Hedera",
  description:
    "Human approval gates for sensitive AI-agent actions using HCS and Mirror Node evidence.",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
