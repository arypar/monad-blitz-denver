"use client";

import { useState, useCallback } from "react";
import { useGameStore } from "@/store/useGameStore";
import { ZONES } from "@/lib/zones";
import type { ZoneId } from "@/types";

interface SimpleBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneId: ZoneId | null;
}

export default function SimpleBetModal({ isOpen, onClose, zoneId }: SimpleBetModalProps) {
  const placeBet = useGameStore((s) => s.placeBet);
  const isResolving = useGameStore((s) => s.isResolving);
  const [amount, setAmount] = useState("0.5");

  const zone = zoneId ? ZONES[zoneId] : null;
  const amtNum = parseFloat(amount) || 0;

  const handlePlaceBet = useCallback(() => {
    if (isResolving || amtNum <= 0 || !zoneId) return;
    placeBet(zoneId, amtNum);
    onClose();
  }, [isResolving, amtNum, zoneId, placeBet, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!zone) return null;

  return (
    <div className={`modal-overlay${isOpen ? " open" : ""}`} onClick={handleOverlayClick}>
      <div className="simple-modal">
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="simple-modal-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="simple-modal-img" src={zone.sliceImageHot} alt={zone.displayName} />
          <div>
            <div className="simple-modal-zone">{zone.name}</div>
            <div className="simple-modal-topping" style={{ textTransform: "capitalize" }}>{zone.displayName}</div>
          </div>
        </div>

        <div className="simple-modal-input-row">
          <div className="modal-input-wrap">
            <span>◆</span>
            <input
              type="number"
              className="modal-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
          <button
            className="modal-buy"
            onClick={handlePlaceBet}
            disabled={isResolving || amtNum <= 0}
          >
            Place Bet
          </button>
        </div>

        <div className="quick-row">
          <button className="quick-btn" onClick={() => setAmount("0.1")}>0.1</button>
          <button className="quick-btn" onClick={() => setAmount("0.5")}>0.5</button>
          <button className="quick-btn" onClick={() => setAmount("1")}>1</button>
          <button className="quick-btn" onClick={() => setAmount("5")}>5</button>
        </div>

        <div className="modal-footer">Settled on-chain · No fees · Instant payout</div>
      </div>
    </div>
  );
}
