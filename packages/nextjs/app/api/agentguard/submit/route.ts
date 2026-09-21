import { NextResponse } from "next/server";
import type { SensitiveAction } from "~~/lib/agentguard/canonical";
import { createApprovalEnvelope } from "~~/lib/agentguard/envelope";
import { submitTopicEnvelope } from "~~/services/hederaClient";
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      topicId: string;
      action: SensitiveAction;
      decision: "approved" | "rejected";
      approvedBy: string;
    };
    const envelope = createApprovalEnvelope(body.action, {
      decision: body.decision,
      approvedBy: body.approvedBy,
      approvedAt: new Date().toISOString(),
    });
    const receipt = await submitTopicEnvelope(body.topicId, envelope);
    return NextResponse.json({ envelope, receipt }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed" },
      { status: 400 },
    );
  }
}
