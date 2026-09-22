import type { AgentGuardEnvelope } from "~~/lib/agentguard/envelope";

const BASE: Record<string, string> = {
  testnet: "https://testnet.mirrornode.hedera.com",
  mainnet: "https://mainnet.mirrornode.hedera.com",
  previewnet: "https://previewnet.mirrornode.hedera.com",
};

const PAGE_SIZE = 100;
const MAX_PAGES = 100;

type MirrorMessage = {
  consensus_timestamp: string;
  message: string;
  sequence_number: number;
  running_hash: string;
};

type MirrorPage = {
  messages?: MirrorMessage[];
  links?: { next?: string | null };
};

export type ConsensusEnvelope = {
  consensusTimestamp: string;
  sequenceNumber: number;
  runningHash: string;
  envelope: AgentGuardEnvelope;
};

function decodeMessage(message: MirrorMessage): ConsensusEnvelope | null {
  try {
    const envelope = JSON.parse(
      Buffer.from(message.message, "base64").toString("utf8"),
    ) as AgentGuardEnvelope;
    if (envelope.version !== 1 || !envelope.type?.startsWith("agentguard."))
      return null;
    return {
      consensusTimestamp: message.consensus_timestamp,
      sequenceNumber: message.sequence_number,
      runningHash: message.running_hash,
      envelope,
    };
  } catch {
    return null;
  }
}

function nextPageUrl(base: string, next?: string | null): string | null {
  if (!next) return null;
  const url = new URL(next, base);
  const expectedOrigin = new URL(base).origin;
  if (url.origin !== expectedOrigin || !url.pathname.startsWith("/api/v1/"))
    throw new Error("Mirror node returned an unsafe pagination link");
  return url.toString();
}

export async function fetchAgentGuardTimeline(
  topicId: string,
  network = "testnet",
): Promise<ConsensusEnvelope[]> {
  if (!/^\d+\.\d+\.\d+$/.test(topicId)) throw new Error("Invalid topic ID");
  const base = process.env.HEDERA_MIRROR_URL ?? BASE[network] ?? BASE.testnet;
  let url: string | null =
    `${base}/api/v1/topics/${topicId}/messages?limit=${PAGE_SIZE}&order=asc`;
  const timeline: ConsensusEnvelope[] = [];
  let pages = 0;

  while (url) {
    if (++pages > MAX_PAGES)
      throw new Error("Mirror node pagination exceeded the safety limit");
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Mirror node error ${response.status}`);
    const data = (await response.json()) as MirrorPage;
    for (const message of data.messages ?? []) {
      const decoded = decodeMessage(message);
      if (decoded) timeline.push(decoded);
    }
    url = nextPageUrl(base, data.links?.next);
  }

  return timeline;
}
