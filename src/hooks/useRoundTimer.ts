"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";

export function useRoundTimer() {
  const roundEndTime = useGameStore((s) => s.roundEndTime);
  const bettingEndTime = useGameStore((s) => s.bettingEndTime);
  const isBettingOpenStore = useGameStore((s) => s.isBettingOpen);
  const roundId = useGameStore((s) => s.roundId);

  const [roundTimeLeft, setRoundTimeLeft] = useState(0);
  const [bettingTimeLeft, setBettingTimeLeft] = useState(0);

  useEffect(() => {
    function tick() {
      const now = Date.now();
      setRoundTimeLeft(Math.max(0, Math.ceil((roundEndTime - now) / 1000)));
      setBettingTimeLeft(Math.max(0, Math.ceil((bettingEndTime - now) / 1000)));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [roundEndTime, bettingEndTime]);

  const isBettingOpen = isBettingOpenStore && bettingTimeLeft > 0;

  const phase =
    roundId === 0
      ? "WAITING"
      : isBettingOpen
        ? "BETTING"
        : roundTimeLeft > 0
          ? "WAITING"
          : "COMPLETE";

  return {
    roundTimeLeft,
    bettingTimeLeft,
    phase,
    isBettingOpen,
    isLoading: roundId === 0,
  };
}
