import React from 'react';
import { Zone } from '@/types';

interface TooltipProps {
  zone: Zone;
  isVisible: boolean;
  position: { x: number; y: number };
}

const ZONE_DETAILS = {
  pepperoni: {
    title: "Pepperoni (DEX & Trading)",
    category: "DEX:",
    protocols: "AethonSwap, Kansei, Kuru, KyberSwap, Definitive Finance, Mevx, LeverUp and more"
  },
  mushroom: {
    title: "Mushroom (Lending & Staking)",
    category: "Lending:",
    protocols: "Curvance, Euler Finance, Folks Finance, TownSquare, aPriori and more"
  },
  pineapple: {
    title: "Pineapple (Meme & Launch)",
    category: "Launchpads:",
    protocols: "bonad.fun, Clanker, Cult, Doppler, Flap, Mongu, Nad.fun, and more"
  },
  olive: {
    title: "Olive (Infrastructure)",
    category: "Oracle:",
    protocols: "Band, Blocksense, Chainlink, Chronicle, Orochi, Pyth, Stork, Supra Oracles, and more"
  },
  anchovy: {
    title: "Anchovy (Gaming, Social, AI, NFT & More)",
    category: "Gaming — Games:",
    protocols: "Bro Fun, ESP.Fun, Grimmy's, Levr Bet, LumiterraGame, M0narch, Magic Eden, and more"
  }
};

export default function ZoneTooltip({ zone, isVisible, position }: TooltipProps) {
  if (!isVisible) return null;

  const details = ZONE_DETAILS[zone.id];
  if (!details) return null;

  return (
    <div 
      className="zone-tooltip"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -120%)',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <div className="zone-tooltip-content">
        <div className="zone-tooltip-header">
          <span className="zone-tooltip-emoji">{zone.toppingEmoji}</span>
          <span className="zone-tooltip-title">{details.title}</span>
        </div>
        <div className="zone-tooltip-body">
          <div className="zone-tooltip-category">{details.category}</div>
          <div className="zone-tooltip-protocols">{details.protocols}</div>
        </div>
      </div>
    </div>
  );
}
