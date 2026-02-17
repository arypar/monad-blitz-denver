"use client";

import { useLiveFeed } from "@/hooks/useLiveFeed";
import { useGameStore } from "@/store/useGameStore";
import { ZONE_LIST } from "@/lib/zones";
import Header from "@/components/Header";
import ZoneRow from "@/components/ZoneRow";
import BettingPanel from "@/components/BettingPanel";
import ScreenFlash from "@/components/ScreenFlash";
import RoundResolution from "@/components/RoundResolution";

export default function Home() {
  useLiveFeed();

  const zones = useGameStore((s) => s.zones);
  const activityHistory = useGameStore((s) => s.activityHistory);
  const selectedZone = useGameStore((s) => s.selectedZone);
  const flashZone = useGameStore((s) => s.flashZone);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FAFAF8]">
      <ScreenFlash />
      <RoundResolution />

      {/* Header */}
      <div className="relative z-10 p-3 pb-0">
        <Header />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 min-h-0 flex gap-3 p-3">
        {/* Left: zone rows */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-1">
          {ZONE_LIST.map((zone, i) => (
            <ZoneRow
              key={zone.id}
              zone={zone}
              activity={zones[zone.id]}
              activityHistory={activityHistory[zone.id]}
              isSelected={selectedZone === zone.id}
              isFlashing={flashZone === zone.id}
              index={i}
            />
          ))}
        </div>

        {/* Right: betting panel */}
        <div className="w-[300px] flex-shrink-0">
          <BettingPanel />
        </div>
      </div>
    </div>
  );
}
