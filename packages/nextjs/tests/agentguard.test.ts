import { describe, expect, it } from "vitest";
import { hashAction, type SensitiveAction } from "../lib/agentguard/canonical";
import {
  createApprovalEnvelope,
  verifyTimeline,
  type ConsumptionEnvelope,
} from "../lib/agentguard/envelope";
const action: SensitiveAction = {
  action: "pay",
  actor: "agent",
  expiresAt: "2030-01-01T00:00:00.000Z",
  nonce: "n-1",
  payload: { b: 2, a: 1 },
};
describe("AgentGuard", () => {
  it("hashes canonical payloads deterministically", () => {
    expect(hashAction(action)).toBe(
      hashAction({ ...action, payload: { a: 1, b: 2 } }),
    );
    expect(hashAction(action)).not.toBe(
      hashAction({ ...action, payload: { a: 1, b: 3 } }),
    );
  });
  it("accepts one fresh matching approval", () => {
    const approval = createApprovalEnvelope(action, {
      decision: "approved",
      approvedBy: "alice",
      approvedAt: "2029-01-01T00:00:00Z",
    });
    expect(
      verifyTimeline(action, [approval], new Date("2029-02-01")),
    ).toMatchObject({ valid: true });
  });
  it("rejects replay after consumption", () => {
    const approval = createApprovalEnvelope(action, {
      decision: "approved",
      approvedBy: "alice",
      approvedAt: "2029-01-01T00:00:00Z",
    });
    const consumed: ConsumptionEnvelope = {
      version: 1,
      type: "agentguard.consumption",
      actionHash: hashAction(action),
      nonce: action.nonce,
      consumedAt: "2029-01-02T00:00:00Z",
      executor: "agent",
    };
    expect(
      verifyTimeline(action, [approval, consumed], new Date("2029-02-01")),
    ).toEqual({ valid: false, reasons: ["approval already consumed"] });
  });
  it("rejects altered payload", () => {
    const approval = createApprovalEnvelope(action, {
      decision: "approved",
      approvedBy: "alice",
      approvedAt: "2029-01-01T00:00:00Z",
    });
    expect(
      verifyTimeline(
        { ...action, payload: { a: 9 } },
        [approval],
        new Date("2029-02-01"),
      ),
    ).toMatchObject({ valid: false });
  });
});
