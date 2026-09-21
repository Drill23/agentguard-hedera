import { NextResponse } from "next/server";
import type { SensitiveAction } from "~~/lib/agentguard/canonical";
import { hashAction } from "~~/lib/agentguard/canonical";
import {
  verifyTimeline,
  type ConsumptionEnvelope,
} from "~~/lib/agentguard/envelope";
import { submitTopicEnvelope } from "~~/services/hederaClient";
import { fetchAgentGuardTimeline } from "~~/services/mirrorNode";
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      topicId: string;
      network?: string;
      action: SensitiveAction;
      executor: string;
    };
    const evidence = await fetchAgentGuardTimeline(body.topicId, body.network);
    const checked = verifyTimeline(
      body.action,
      evidence.map((item) => item.envelope),
    );
    if (!checked.valid) return NextResponse.json(checked, { status: 422 });
    const envelope: ConsumptionEnvelope = {
      version: 1,
      type: "agentguard.consumption",
      actionHash: hashAction(body.action),
      nonce: body.action.nonce,
      consumedAt: new Date().toISOString(),
      executor: body.executor,
    };
    const receipt = await submitTopicEnvelope(body.topicId, envelope);
    return NextResponse.json(
      { valid: true, envelope, receipt },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Consumption failed" },
      { status: 400 },
    );
  }
}
