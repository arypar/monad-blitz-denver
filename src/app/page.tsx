"use client";

import { useState, useCallback } from "react";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { useGameStore } from "@/store/useGameStore";
import { ZONE_LIST } from "@/lib/zones";
import CheesyNav from "@/components/CheesyNav";
// import Ticker from "@/components/Ticker";
import ZoneRow from "@/components/ZoneRow";
import BottomRow from "@/components/BottomRow";
import PastWinners from "@/components/PastWinners";
// import BettingModal from "@/components/BettingModal";
import SimpleBetModal from "@/components/SimpleBetModal";
import WinCelebration from "@/components/WinCelebration";
import type { ZoneId } from "@/types";

export default function Home() {
  useLiveFeed();

  const zones = useGameStore((s) => s.zones);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);

  const openModal = useCallback((zoneId?: string) => {
    if (zoneId) {
      setSelectedZone(zoneId as ZoneId);
    }
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedZone(null);
  }, []);

  return (
    <div className="page">
      <CheesyNav />
      <BottomRow />
      {/* <Ticker /> */}

      <div className="zones-card">
        {ZONE_LIST.map((zone) => (
          <ZoneRow
            key={zone.id}
            zone={zone}
            activity={zones[zone.id]}
            onOpenModal={openModal}
          />
        ))}
      </div>

      <PastWinners />

      {/* Multi-zone "make your own slice" modal — commented out for now */}
      {/* <BettingModal
        isOpen={modalOpen}
        onClose={closeModal}
        preselectedZone={selectedZone}
      /> */}

      <SimpleBetModal
        isOpen={modalOpen}
        onClose={closeModal}
        zoneId={selectedZone}
      />
      <WinCelebration />
    </div>
  );
}
