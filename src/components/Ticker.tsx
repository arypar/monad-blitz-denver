"use client";

import { useGameStore } from "@/store/useGameStore";
import { ZONES } from "@/lib/zones";
import { getTimeAgo, truncateAddress } from "@/lib/utils";

export default function Ticker() {
  const transactions = useGameStore((s) => s.transactions);
  const roundResults = useGameStore((s) => s.roundResults);
  const zones = useGameStore((s) => s.zones);

  const tickerItems: { id: string; content: React.ReactNode }[] = [];

  roundResults.slice(0, 5).forEach((r) => {
    const zone = ZONES[r.winnerZone];
    tickerItems.push({
      id: `winner-${r.roundId}`,
      content: (
        <>
          {zone.toppingEmoji}{" "}
          <b>{zone.displayName}</b>{" "}
          <span className="win">won Round #{r.roundId}</span>{" "}
          <span style={{ color: "#bbb" }}>· {getTimeAgo(r.timestamp)}</span>
        </>
      ),
    });
  });

  const recentTxs = transactions.slice(0, 15);
  const seen = new Set<string>();
  recentTxs.forEach((tx) => {
    if (seen.has(tx.zoneId)) return;
    seen.add(tx.zoneId);
    const zone = ZONES[tx.zoneId];
    const zoneActivity = zones[tx.zoneId];
    tickerItems.push({
      id: `zone-${tx.zoneId}-${tx.id}`,
      content: (
        <>
          {zone.toppingEmoji}{" "}
          <b>{zone.displayName}</b>{" "}
          {truncateAddress(tx.address)} {" "}
          <span style={{ color: "#b45309" }}>{zoneActivity.betCount} txns</span>
        </>
      ),
    });
  });

  if (tickerItems.length === 0) {
    return (
      <div className="ticker-wrap">
        <div className="ticker-label">Live</div>
        <div className="ticker-scroll">
          <div className="ticker-item" style={{ color: "#bbb" }}>
            Waiting for on-chain activity...
          </div>
        </div>
      </div>
    );
  }

  const doubledItems = [...tickerItems, ...tickerItems];

  return (
    <div className="ticker-wrap">
      <div className="ticker-label">Live</div>
      <div className="ticker-scroll">
        {doubledItems.map((item, i) => (
          <div className="ticker-item" key={`${item.id}-${i}`}>
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
