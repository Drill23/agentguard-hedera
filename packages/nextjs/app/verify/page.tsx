"use client";
import { useState } from "react";
const sample = JSON.stringify(
  {
    action: "send-payment",
    actor: "agent:invoice-bot",
    audience: "vendor:acme",
    expiresAt: "2026-10-04T23:59:00Z",
    nonce: "invoice-1042",
    payload: { amount: "125.00", currency: "USD", recipient: "0.0.1234" },
  },
  null,
  2,
);
export default function Verify() {
  const [value, setValue] = useState(sample);
  const [hash, setHash] = useState("");
  async function calculate() {
    const response = await fetch("/api/agentguard/hash", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: value,
    });
    const data = await response.json();
    setHash(data.hash ?? data.error);
  }
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold">Action hash verifier</h1>
      <p className="mt-3 opacity-70">
        Change any field and the approval hash changes.
      </p>
      <textarea
        aria-label="Sensitive action JSON"
        className="mt-8 min-h-96 w-full rounded-xl border bg-transparent p-4 font-mono text-sm"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        onClick={calculate}
        className="mt-4 rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-black"
      >
        Calculate action hash
      </button>
      {hash && (
        <code className="mt-6 block break-all rounded-lg border p-4">
          {hash}
        </code>
      )}
    </main>
  );
}
