# AI agent guide

AgentGuard is a security boundary. Preserve its fail-closed behavior.

## Invariants

1. Hash the exact action passed to the downstream executor. Never hash a summary.
2. Object-key ordering must not affect the hash; array ordering must.
3. Verification requires one matching approval, a future expiration, an approved decision and no matching consumption.
4. Treat malformed or undecodable HCS messages as non-authoritative data. Do not turn them into approvals.
5. Never log, commit or send operator keys. `.env` stays local.
6. Verify immediately before consuming. Execute only after successful consumption, with target-side idempotency.
7. Never silently widen an approved action's recipient, amount, audience, payload, nonce or lifetime.

## Where to change code

- Protocol and pure validation: `packages/nextjs/lib/agentguard`
- HCS writes: `packages/nextjs/services/hederaClient.ts`
- Mirror Node reads: `packages/nextjs/services/mirrorNode.ts`
- HTTP boundary: `packages/nextjs/app/api/agentguard`

Add tests for any protocol change. Run `npm run next:check-types`, `npm run lint`, `npm test`, and `npm run next:build` before declaring work complete.

## Safe extension ideas

Add approver signatures, delegated policies, topic partitioning, authentication and idempotent downstream adapters. Do not add automatic approval, default-allow fallbacks, or secrets to HCS payloads.
