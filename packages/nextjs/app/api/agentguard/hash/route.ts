import { NextResponse } from "next/server";
import { hashAction, type SensitiveAction } from "~~/lib/agentguard/canonical";
export async function POST(request: Request) {
  const action = (await request.json()) as SensitiveAction;
  if (
    !action.action ||
    !action.actor ||
    !action.expiresAt ||
    !action.nonce ||
    action.payload === undefined
  )
    return NextResponse.json(
      { error: "action, actor, expiresAt, nonce and payload are required" },
      { status: 400 },
    );
  return NextResponse.json({ hash: hashAction(action), action });
}
