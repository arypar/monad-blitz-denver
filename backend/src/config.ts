import "dotenv/config";

export const config = {
  monadRpcWs: process.env.MONAD_RPC_WS || "wss://rpc.monad.xyz",
  wsPort: parseInt(process.env.WS_PORT || "8080", 10),
} as const;
