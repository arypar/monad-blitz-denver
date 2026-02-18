"use client";

import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/store/useGameStore";
import { ZONE_LIST, ZONES } from "@/lib/zones";
import { ZONE_IDS } from "@/lib/zones";
import type { ZoneId } from "@/types";
import ZoneTooltip from "./ZoneTooltip";

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedZone?: ZoneId | null;
}

export default function BettingModal({
  isOpen,
  onClose,
  preselectedZone,
}: BettingModalProps) {
  const placeBet = useGameStore((s) => s.placeBet);
  const zones = useGameStore((s) => s.zones);
  const isResolving = useGameStore((s) => s.isResolving);
  const isBettingOpen = useGameStore((s) => s.isBettingOpen);
  const bettingDisabled = isResolving || !isBettingOpen;

  const [selectedZones, setSelectedZones] = useState<Set<ZoneId>>(new Set());
  const [amount, setAmount] = useState("500");
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipZone, setTooltipZone] = useState<any>(null);

  useEffect(() => {
    if (isOpen && preselectedZone) {
      setSelectedZones((prev) => {
        const next = new Set(prev);
        next.add(preselectedZone);
        return next;
      });
    }
  }, [isOpen, preselectedZone]);

  const toggleZone = useCallback((zoneId: ZoneId) => {
    setSelectedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zoneId)) {
        next.delete(zoneId);
      } else {
        next.add(zoneId);
      }
      return next;
    });
  }, []);

  const setQuickAmount = useCallback((val: number) => {
    setAmount(val.toString());
  }, []);

  const numSelected = selectedZones.size;
  const amtNum = parseFloat(amount) || 0;
  const mult = numSelected === 0 ? 1 : 1.3 + numSelected * 0.45;
  const estYield = Math.round(amtNum * mult);

  const totalWeighted = ZONE_IDS.reduce(
    (sum, zid) => sum + zones[zid].weightedScore,
    0
  );

  const handlePlaceBet = useCallback(() => {
    if (bettingDisabled || amtNum <= 0 || numSelected === 0) return;
    const perZone = amtNum / numSelected;
    selectedZones.forEach((zoneId) => {
      placeBet(zoneId, perZone);
    });
    onClose();
  }, [bettingDisabled, amtNum, numSelected, selectedZones, placeBet, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className={`modal-overlay${isOpen ? " open" : ""}`}
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <div className="modal-title">make your own slice 🍕</div>
        {!isBettingOpen && (
          <div className="modal-sub" style={{ color: "#e63946", fontWeight: 600 }}>
            Betting is closed for this round. Wait for the next round to place bets.
          </div>
        )}
        <div className="modal-sub">
          Pick your toppings to hedge across zones. Win proportionally when any
          selected zone runs hot.
        </div>

        <div className="topping-grid">
          {ZONE_LIST.map((zone) => {
            const isSelected = selectedZones.has(zone.id);
            const zoneActivity = zones[zone.id];
            const winChance =
              totalWeighted > 0
                ? Math.round(
                    (zoneActivity.weightedScore / totalWeighted) * 100
                  )
                : 0;

            const handleImageMouseEnter = (e: React.MouseEvent<HTMLImageElement>, zone: any) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltipPosition({
                x: rect.left + rect.width / 2,
                y: rect.top
              });
              setTooltipZone(zone);
              setShowTooltip(true);
            };

            const handleImageMouseLeave = () => {
              setShowTooltip(false);
              setTooltipZone(null);
            };

            return (
              <div
                key={zone.id}
                className={`topping-item${isSelected ? " selected" : ""}`}
                onClick={() => toggleZone(zone.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="topping-img"
                  src={zone.sliceImage}
                  alt={zone.topping}
                  onMouseEnter={(e) => handleImageMouseEnter(e, zone)}
                  onMouseLeave={handleImageMouseLeave}
                />
                <div className="topping-info">
                  <div className="topping-name">{zone.topping}</div>
                  <div className="topping-stats">
                    {zone.protocol} · {winChance}%
                  </div>
                </div>
                <div className="topping-check">{isSelected ? "✓" : ""}</div>
              </div>
            );
          })}
        </div>

        <div className="modal-est">
          <div>
            <div className="modal-est-label">Est. yield if combo wins</div>
            <div className="modal-est-sub">
              {numSelected} zone{numSelected !== 1 ? "s" : ""} selected
            </div>
          </div>
          <div className="modal-est-val">+{estYield.toLocaleString()} MON</div>
        </div>

        <div className="modal-stake-row">
          <div className="modal-input-wrap">
            <span>◆</span>
            <input
              type="number"
              className="modal-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          <button className="modal-buy" onClick={handlePlaceBet} disabled={bettingDisabled || amtNum <= 0 || numSelected === 0}>
            {isBettingOpen ? "Place Bet" : "Betting Closed"}
          </button>
        </div>

        <div className="quick-row">
          <button className="quick-btn" onClick={() => setQuickAmount(0.1)}>
            0.1
          </button>
          <button className="quick-btn" onClick={() => setQuickAmount(0.5)}>
            0.5
          </button>
          <button className="quick-btn" onClick={() => setQuickAmount(1)}>
            1
          </button>
          <button className="quick-btn" onClick={() => setQuickAmount(5)}>
            5
          </button>
        </div>

        <div className="modal-footer">
          Settled on-chain · No fees · Instant payout
        </div>
      </div>
      
      {tooltipZone && (
        <ZoneTooltip 
          zone={tooltipZone} 
          isVisible={showTooltip} 
          position={tooltipPosition} 
        />
      )}
    </div>
  );
}
