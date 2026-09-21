# AgentGuard on Hedera

AgentGuard is a Scaffold HBAR external template for putting a human gate in front of sensitive AI-agent actions. An approval is useful only when it is bound to the exact payload the executor will use. AgentGuard canonicalizes the complete action, hashes it, records the approval on Hedera Consensus Service (HCS), and checks immutable consensus evidence through a Mirror Node before execution. A second HCS message consumes the approval, so it cannot be replayed silently.

## What is load-bearing

HCS is the coordination and ordering layer, not decorative logging. An executor must find exactly one matching, fresh approval in the topic and no prior consumption before it proceeds. Removing HCS removes the shared source of truth between approver and executor. Mirror Node supplies consensus timestamp, sequence number and running hash evidence.

## Quick start

Prerequisites: Node.js 20.18.3+, Git and a Hedera testnet account with HBAR.

```bash
npx create-scaffold-hbar@latest my-agentguard --template Drill23/agentguard-hedera
cd my-agentguard
cp packages/nextjs/.env.example packages/nextjs/.env
npm install
npm run next:dev
```

Open `http://localhost:3000`. The local verifier at `/verify` demonstrates payload binding without needing credentials.

## Configure Hedera testnet

Set these only in `packages/nextjs/.env`. Never commit that file.

```dotenv
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT
HEDERA_OPERATOR_PRIVATE_KEY=YOUR_PRIVATE_KEY
AGENTGUARD_TOPIC_ID=0.0.YOUR_TOPIC
```

Create a dedicated HCS topic for the app. Give the operator only the permissions and funds it needs. Production systems should separate the approver identity from the server operator and add application authentication around mutation endpoints.

## Action and envelope

An action contains `action`, `actor`, optional `audience`, `expiresAt`, unique `nonce`, and an arbitrary `payload`. Canonical JSON sorts object keys recursively before SHA-256. Arrays remain ordered.

An approval envelope commits to the action hash, nonce, expiration, decision, approver and approval time. A consumption envelope commits to the same action hash and nonce. Mirror Node messages are processed in consensus order.

## API flow

1. `POST /api/agentguard/hash` with the action to preview its deterministic hash.
2. A human reviews every material action field.
3. `POST /api/agentguard/submit` with `topicId`, action, `decision` and `approvedBy`. The server submits an HCS approval envelope.
4. `POST /api/agentguard/verify` with `topicId`, network and action. The server reads Mirror Node evidence and rejects missing, ambiguous, altered, expired, rejected or consumed approvals.
5. Immediately before side effects, `POST /api/agentguard/consume`. It verifies again, then records consumption on HCS. The caller executes only after the consumption transaction succeeds.

This starter demonstrates the protocol boundary. A production executor should make consumption and the downstream side effect recoverable as one workflow, use idempotency at the target service, require authenticated approvers, and set topic submit keys appropriately.

## Commands

```bash
npm run next:check-types
npm run lint
npm test
npm run next:build
npm run next:dev
```

## Evidence

Verified Hedera testnet evidence:

- HCS topic: https://hashscan.io/testnet/topic/0.0.10652713
- Topic creation transaction: https://hashscan.io/testnet/transaction/0.0.10650574-1790018058-780075269
- Test-fixture message transaction: https://hashscan.io/testnet/transaction/0.0.10650574-1790018075-281060274
- Mirror Node message API: https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10652713/messages

The on-chain message is explicitly labeled `agentguard.test-fixture` and `approvedBy: AgentGuard test fixture`; it is proof of the template integration, not a representation of a real human approval.

## Architecture

- `packages/nextjs/lib/agentguard`: canonical hashing and state-machine checks
- `packages/nextjs/services/hederaClient.ts`: HCS submission with the Hiero SDK
- `packages/nextjs/services/mirrorNode.ts`: consensus evidence retrieval and decoding
- `packages/nextjs/app/api/agentguard`: hash, submit, verify and consume routes
- `packages/nextjs/tests`: deterministic hash, mutation, approval and replay tests

## Security notes

- Approval must cover recipient, amount, body and any other field that changes the effect.
- Nonces must be unique for the action scope.
- Short expirations limit stale approval risk.
- The demo reads the latest 100 topic messages. Production deployments should page the Mirror Node API or partition topics before that bound can omit relevant history.
- A public HCS topic exposes envelope metadata. Put secrets neither in actions nor envelopes. Hashing predictable secrets does not make them safe.

## License

MIT. Copyright 2026 Adriano Almeida.
