import { createPublicClient, webSocket, type Block, type Transaction } from "viem";
import { config } from "./config.js";

const monad = {
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"], webSocket: [config.monadRpcWs] },
  },
} as const;

export type BlockWithTransactions = Block<bigint, true>;
export type MonadTransaction = Transaction;

export type MonadClient = ReturnType<typeof createPublicClient>;

export function createMonadClient(): MonadClient {
  return createPublicClient({
    chain: monad,
    transport: webSocket(config.monadRpcWs, {
      reconnect: { attempts: 10, delay: 2000 },
    }),
  });
}

export function watchNewBlocks(
  client: MonadClient,
  onBlock: (block: BlockWithTransactions) => void
) {
  console.log("[monitor] subscribing to new blocks...");

  const unwatch = client.watchBlocks({
    onBlock: async (blockHeader) => {
      try {
        const block = await client.getBlock({
          blockNumber: blockHeader.number,
          includeTransactions: true,
        });
        onBlock(block as BlockWithTransactions);
      } catch (err) {
        console.error(`[monitor] failed to fetch block ${blockHeader.number}:`, err);
      }
    },
    onError: (error) => {
      console.error("[monitor] block subscription error:", error);
    },
    emitOnBegin: false,
  });

  return unwatch;
}
