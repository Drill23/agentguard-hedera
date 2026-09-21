import type { AgentGuardEnvelope } from "~~/lib/agentguard/envelope";
const BASE: Record<string, string> = {
  testnet: "https://testnet.mirrornode.hedera.com",
  mainnet: "https://mainnet.mirrornode.hedera.com",
  previewnet: "https://previewnet.mirrornode.hedera.com",
};
type MirrorMessage = {
  consensus_timestamp: string;
  message: string;
  sequence_number: number;
  running_hash: string;
};
export type ConsensusEnvelope = {
  consensusTimestamp: string;
  sequenceNumber: number;
  runningHash: string;
  envelope: AgentGuardEnvelope;
};
export async function fetchAgentGuardTimeline(
  topicId: string,
  network = "testnet",
): Promise<ConsensusEnvelope[]> {
  if (!/^\d+\.\d+\.\d+$/.test(topicId)) throw new Error("Invalid topic ID");
  const base = process.env.HEDERA_MIRROR_URL ?? BASE[network] ?? BASE.testnet;
  const response = await fetch(
    `${base}/api/v1/topics/${topicId}/messages?limit=100&order=asc`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Mirror node error ${response.status}`);
  const data = (await response.json()) as { messages: MirrorMessage[] };
  return (data.messages ?? []).flatMap((message) => {
    try {
      const envelope = JSON.parse(
        Buffer.from(message.message, "base64").toString("utf8"),
      ) as AgentGuardEnvelope;
      if (envelope.version !== 1 || !envelope.type?.startsWith("agentguard."))
        return [];
      return [
        {
          consensusTimestamp: message.consensus_timestamp,
          sequenceNumber: message.sequence_number,
          runningHash: message.running_hash,
          envelope,
        },
      ];
    } catch {
      return [];
    }
  });
}
