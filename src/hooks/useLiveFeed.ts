"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import type { ZoneId, Transaction } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

interface ClassifiedTxMessage {
  type: "transaction";
  data: {
    id: string;
    zoneId: ZoneId;
    txHash: string;
    from: string;
    to: string;
    value: string;
    blockNumber: number;
    timestamp: number;
    contractName: string;
  };
}

export function useLiveFeed() {
  const addTransaction = useGameStore((s) => s.addTransaction);
  const decayRecentCounts = useGameStore((s) => s.decayRecentCounts);
  const tickChart = useGameStore((s) => s.tickChart);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let alive = true;

    function connect() {
      if (!alive) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[livefeed] connected to backend");
      };

      ws.onmessage = (event) => {
        try {
          const msg: ClassifiedTxMessage = JSON.parse(event.data);
          if (msg.type !== "transaction") return;

          const d = msg.data;
          const amount = parseFloat(d.value) || 0;

          const tx: Transaction = {
            id: d.id,
            zoneId: d.zoneId,
            address: d.from,
            amount: Math.round(amount * 1000) / 1000,
            timestamp: Date.now(),
            type: "bet",
          };

          addTransaction(tx);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!alive) return;
        console.log("[livefeed] disconnected, reconnecting in 2s...");
        reconnectTimeout.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    const chartInterval = setInterval(() => {
      tickChart();
    }, 1000);

    const decayInterval = setInterval(() => {
      decayRecentCounts();
    }, 3000);

    return () => {
      alive = false;
      clearTimeout(reconnectTimeout.current);
      clearInterval(chartInterval);
      clearInterval(decayInterval);
      wsRef.current?.close();
    };
  }, [addTransaction, decayRecentCounts, tickChart]);
}
