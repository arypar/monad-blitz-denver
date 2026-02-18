"use client";

import { useGameStore } from "@/store/useGameStore";
import { useContractPool } from "@/hooks/useContractPool";
import { useRoundTimer } from "@/hooks/useRoundTimer";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function BottomRow() {
  const { totalPool } = useContractPool();
  const { roundTimeLeft, bettingTimeLeft, isBettingOpen } = useRoundTimer();
  const roundId = useGameStore((s) => s.roundId);

  const poolDisplay =
    totalPool >= 1000
      ? `${(totalPool / 1000).toFixed(1)}k`
      : totalPool >= 1
      ? totalPool.toFixed(1)
      : totalPool.toFixed(2);

  const roundUrgent = roundTimeLeft <= 30;
  const roundCritical = roundTimeLeft <= 10;
  const bettingUrgent = bettingTimeLeft <= 15;
  const bettingCritical = bettingTimeLeft <= 5;

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

        {/* Betting Timer */}
        <div className={`pool-stat timer-stat${isBettingOpen ? (bettingCritical ? " critical" : bettingUrgent ? " urgent" : "") : ""}`}>
          <span className="pool-stat-label">
            {isBettingOpen ? "Betting Open" : "Betting Closed"}
          </span>
          <div className="pool-stat-value-row">
            {isBettingOpen && bettingTimeLeft > 0 ? (
              <>
                <span className="timer-value">
                  {formatTime(bettingTimeLeft)}
                </span>
                <span className={`timer-tag${bettingCritical ? " critical" : bettingUrgent ? " urgent" : ""}`}>
                  {bettingCritical ? "LAST CALL" : bettingUrgent ? "CLOSING" : "to bet"}
                </span>
              </>
            ) : (
              <span className="timer-tag">LOCKED</span>
            )}
          </div>
        </div>

        <div className="pool-banner-divider" />

        {/* Round Timer */}
        <div className={`pool-stat timer-stat${roundCritical ? " critical" : roundUrgent ? " urgent" : ""}`}>
          <span className="pool-stat-label">
            {roundId > 0 ? `Round #${roundId}` : "Connecting..."}
          </span>
          <div className="pool-stat-value-row">
            <span className="timer-value">
              {roundTimeLeft > 0 ? formatTime(roundTimeLeft) : "—:——"}
            </span>
            {roundTimeLeft > 0 && (
              <span className={`timer-tag${roundCritical ? " critical" : roundUrgent ? " urgent" : ""}`}>
                {roundCritical ? "ENDING" : roundUrgent ? "CLOSING" : "remaining"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
