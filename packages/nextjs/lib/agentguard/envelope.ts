import type { SensitiveAction } from "./canonical";
import { hashAction } from "./canonical";
export type ApprovalEnvelope = {
  version: 1;
  type: "agentguard.approval";
  actionHash: string;
  decision: "approved" | "rejected";
  approvedBy: string;
  approvedAt: string;
  expiresAt: string;
  nonce: string;
};
export type ConsumptionEnvelope = {
  version: 1;
  type: "agentguard.consumption";
  actionHash: string;
  nonce: string;
  consumedAt: string;
  executor: string;
};
export type AgentGuardEnvelope = ApprovalEnvelope | ConsumptionEnvelope;
export function createApprovalEnvelope(
  action: SensitiveAction,
  input: Pick<ApprovalEnvelope, "decision" | "approvedBy" | "approvedAt">,
): ApprovalEnvelope {
  return {
    version: 1,
    type: "agentguard.approval",
    actionHash: hashAction(action),
    expiresAt: action.expiresAt,
    nonce: action.nonce,
    ...input,
  };
}
export function verifyEnvelope(
  action: SensitiveAction,
  envelope: ApprovalEnvelope,
  now = new Date(),
) {
  const reasons: string[] = [];
  if (envelope.version !== 1 || envelope.type !== "agentguard.approval")
    reasons.push("unsupported envelope");
  if (envelope.actionHash !== hashAction(action))
    reasons.push("payload hash mismatch");
  if (envelope.nonce !== action.nonce) reasons.push("nonce mismatch");
  if (envelope.expiresAt !== action.expiresAt) reasons.push("expiry mismatch");
  if (
    !Number.isFinite(Date.parse(envelope.expiresAt)) ||
    Date.parse(envelope.expiresAt) <= now.getTime()
  )
    reasons.push("approval expired");
  if (envelope.decision !== "approved") reasons.push("action not approved");
  return { valid: reasons.length === 0, reasons };
}
export function verifyTimeline(
  action: SensitiveAction,
  envelopes: AgentGuardEnvelope[],
  now = new Date(),
) {
  const approvals = envelopes.filter(
    (e): e is ApprovalEnvelope =>
      e.type === "agentguard.approval" &&
      e.actionHash === hashAction(action) &&
      e.nonce === action.nonce,
  );
  const consumptions = envelopes.filter(
    (e) =>
      e.type === "agentguard.consumption" &&
      e.actionHash === hashAction(action) &&
      e.nonce === action.nonce,
  );
  if (approvals.length !== 1)
    return {
      valid: false,
      reasons: [
        approvals.length === 0
          ? "approval not found"
          : "ambiguous approval history",
      ],
    };
  const checked = verifyEnvelope(action, approvals[0], now);
  if (!checked.valid) return checked;
  if (consumptions.length > 0)
    return { valid: false, reasons: ["approval already consumed"] };
  return { valid: true, reasons: [], approval: approvals[0] };
}
