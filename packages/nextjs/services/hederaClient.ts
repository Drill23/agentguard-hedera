import { Client, TopicMessageSubmitTransaction } from "@hiero-ledger/sdk";
export function getHederaClient() {
  const id = process.env.HEDERA_OPERATOR_ID;
  const key = process.env.HEDERA_OPERATOR_PRIVATE_KEY;
  if (!id || !key) throw new Error("Hedera operator is not configured");
  const client =
    (process.env.HEDERA_NETWORK ?? "testnet") === "mainnet"
      ? Client.forMainnet()
      : Client.forTestnet();
  return client.setOperator(id, key);
}
export async function submitTopicEnvelope(topicId: string, envelope: unknown) {
  if (!/^\d+\.\d+\.\d+$/.test(topicId)) throw new Error("Invalid topic ID");
  const client = getHederaClient();
  try {
    const response = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(envelope))
      .execute(client);
    const receipt = await response.getReceipt(client);
    return {
      transactionId: response.transactionId.toString(),
      status: receipt.status.toString(),
      topicId,
    };
  } finally {
    client.close();
  }
}
