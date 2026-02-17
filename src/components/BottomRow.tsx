"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";

export default function BottomRow() {
  const totalPool = useGameStore((s) => s.totalPool);
  const roundEndTime = useGameStore((s) => s.roundEndTime);
  const roundId = useGameStore((s) => s.roundId);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      if (roundEndTime <= 0) {
        setTimeLeft(0);
        return;
      }
      const diff = Math.max(0, roundEndTime - Date.now());
      setTimeLeft(Math.ceil(diff / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [roundEndTime]);

  const poolDisplay =
    totalPool >= 1000
      ? `${(totalPool / 1000).toFixed(1)}k`
      : totalPool >= 1
      ? totalPool.toFixed(1)
      : totalPool.toFixed(2);

  const urgent = timeLeft <= 15;
  const critical = timeLeft <= 5;

  return (
    <div className="pool-banner">
      <div className="pool-banner-stats">
        <div className="pool-stat">
          <span className="pool-stat-label">Total Pool</span>
          <div className="pool-stat-value-row">
            <span className="pool-stat-value">{poolDisplay}</span>
            <span className="pool-stat-unit">MON</span>
          </div>
        </div>

        <div className="pool-banner-divider" />

        <div className={`pool-stat timer-stat${critical ? " critical" : urgent ? " urgent" : ""}`}>
          <span className="pool-stat-label">
            {roundId > 0 ? `Round #${roundId}` : "Connecting..."}
          </span>
          <div className="pool-stat-value-row">
            <span className="timer-value">
              {timeLeft > 0 ? `0:${String(timeLeft).padStart(2, "0")}` : "—:——"}
            </span>
            {timeLeft > 0 && (
              <span className={`timer-tag${critical ? " critical" : urgent ? " urgent" : ""}`}>
                {critical ? "LAST CALL" : urgent ? "CLOSING" : "remaining"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* "Own Your Slice" CTA — commented out for now
      <button className="own-slice-btn" onClick={...}>
        🍕 Own Your Slice
      </button> */}
    </div>
  );
}
