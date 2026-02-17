import { WebSocketServer, WebSocket } from "ws";
import { config } from "./config.js";
import type { ClassifiedTransaction, ClassifiedTransactionMessage } from "./types.js";

let wss: WebSocketServer | null = null;

export function startServer(): WebSocketServer {
  wss = new WebSocketServer({ port: config.wsPort });

  wss.on("listening", () => {
    console.log(`[server] WebSocket server listening on ws://localhost:${config.wsPort}`);
  });

  wss.on("connection", (ws, req) => {
    const clientAddr = req.socket.remoteAddress ?? "unknown";
    console.log(`[server] client connected: ${clientAddr}`);

    ws.send(JSON.stringify({ type: "connected", message: "Monad transaction feed active" }));

    ws.on("close", () => {
      console.log(`[server] client disconnected: ${clientAddr}`);
    });

    ws.on("error", (err) => {
      console.error(`[server] client error (${clientAddr}):`, err.message);
    });
  });

  wss.on("error", (err) => {
    console.error("[server] WebSocket server error:", err);
  });

  return wss;
}

export function broadcast(transactions: ClassifiedTransaction[]): void {
  if (!wss) return;

  const readyClients: WebSocket[] = [];
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      readyClients.push(client);
    }
  });

  if (readyClients.length === 0) return;

  for (const tx of transactions) {
    const message: ClassifiedTransactionMessage = {
      type: "transaction",
      data: {
        id: tx.id,
        zoneId: tx.zoneId,
        txHash: tx.txHash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        blockNumber: Number(tx.blockNumber),
        timestamp: tx.timestamp,
        contractName: tx.contractName,
      },
    };

    const payload = JSON.stringify(message);

    for (const client of readyClients) {
      client.send(payload);
    }
  }
}

export function getClientCount(): number {
  if (!wss) return 0;
  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) count++;
  });
  return count;
}
