import Link from "next/link";
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500">
        AgentGuard on Hedera
      </p>
      <h1 className="max-w-4xl text-5xl font-bold leading-tight">
        Human approval bound to the exact action an AI agent will execute.
      </h1>
      <p className="mt-6 max-w-3xl text-lg opacity-75">
        Hash a complete action, record an expiring decision on Hedera Consensus
        Service, then verify consensus evidence through a Mirror Node before
        execution.
      </p>
      <Link
        href="/verify"
        className="mt-10 inline-block rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-black"
      >
        Open verifier
      </Link>
      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          [
            "1. Bind",
            "Canonical JSON and SHA-256 cover recipient, amount, body, expiry and nonce.",
          ],
          [
            "2. Record",
            "An operator submits the approval envelope to an HCS topic.",
          ],
          [
            "3. Verify and consume",
            "Mirror Node evidence must match, be fresh and remain unused; execution records consumption.",
          ],
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl border p-6">
            <h2 className="font-bold">{title}</h2>
            <p className="mt-3 text-sm opacity-70">{text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
