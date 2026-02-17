"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { ZONE_IDS } from "@/lib/zones";
import { generateAddress, randomBetween } from "@/lib/utils";
import { ZoneId, Transaction } from "@/types";

function getZoneWeights(tick: number): Record<ZoneId, number> {
  const cycle = Math.sin(tick * 0.01);
  const cycle2 = Math.cos(tick * 0.007);
  return {
    pepperoni: 3 + cycle * 1.5,
    mushroom: 2.5 + cycle2 * 1,
    pineapple: 4 + Math.sin(tick * 0.02) * 2,
    olive: 2 + cycle * 0.5,
    anchovy: 1.5 + cycle2 * 0.8,
  };
}

function pickWeightedZone(weights: Record<ZoneId, number>): ZoneId {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const zid of ZONE_IDS) {
    r -= weights[zid];
    if (r <= 0) return zid;
  }
  return ZONE_IDS[0];
}

function generateAmount(): number {
  const r = Math.random();
  if (r < 0.5) return randomBetween(0.05, 0.5);
  if (r < 0.8) return randomBetween(0.5, 2);
  if (r < 0.95) return randomBetween(2, 5);
  return randomBetween(5, 20);
}

export function useMockFeed() {
  const addTransaction = useGameStore((s) => s.addTransaction);
  const decayRecentCounts = useGameStore((s) => s.decayRecentCounts);
  const tickChart = useGameStore((s) => s.tickChart);
  const tickRef = useRef(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    function scheduleNext() {
      const delay = randomBetween(300, 2000);
      timeout = setTimeout(() => {
        tickRef.current++;
        const weights = getZoneWeights(tickRef.current);
        const zoneId = pickWeightedZone(weights);
        const amount = generateAmount();

        const tx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          zoneId,
          address: generateAddress(),
          amount: Math.round(amount * 1000) / 1000,
          timestamp: Date.now(),
          type: "bet",
        };

        addTransaction(tx);
        scheduleNext();
      }, delay);
    }

    scheduleNext();

    // Tick the chart every second to sample transaction rate
    const chartTickInterval = setInterval(() => {
      tickChart();
    }, 1000);

    // Decay heat every 3 seconds
    const decayInterval = setInterval(() => {
      decayRecentCounts();
    }, 3000);

    return () => {
      clearTimeout(timeout);
      clearInterval(chartTickInterval);
      clearInterval(decayInterval);
    };
  }, [addTransaction, decayRecentCounts, tickChart]);
}
