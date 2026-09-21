import { NextResponse } from "next/server";
import type { SensitiveAction } from "~~/lib/agentguard/canonical";
import { verifyTimeline } from "~~/lib/agentguard/envelope";
import { fetchAgentGuardTimeline } from "~~/services/mirrorNode";
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      topicId: string;
      network?: string;
      action: SensitiveAction;
    };
    const evidence = await fetchAgentGuardTimeline(body.topicId, body.network);
    const result = verifyTimeline(
      body.action,
      evidence.map((item) => item.envelope),
    );
    return NextResponse.json(
      { ...result, evidence },
      { status: result.valid ? 200 : 422 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 400 },
    );
  }
}
