"use client";

import { useEffect, useState, useMemo } from "react";
import { useGameStore } from "@/store/useGameStore";
import { ZONES } from "@/lib/zones";

interface FallingSlice {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
}

export default function WinCelebration() {
  const isResolving = useGameStore((s) => s.isResolving);
  const lastWinner = useGameStore((s) => s.lastWinner);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const zone = lastWinner ? ZONES[lastWinner] : null;

  const slices = useMemo<FallingSlice[]>(() => {
    if (!isResolving || !lastWinner) return [];
    return Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2.5,
      duration: 2.5 + Math.random() * 2.5,
      size: 60 + Math.random() * 90,
      rotation: Math.random() * 360,
      rotationSpeed: 200 + Math.random() * 400,
      wobble: 20 + Math.random() * 50,
    }));
  }, [isResolving, lastWinner]);

  useEffect(() => {
    if (isResolving && lastWinner) {
      setVisible(true);
      setFadingOut(false);
    } else if (!isResolving && visible) {
      setFadingOut(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setFadingOut(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isResolving, lastWinner, visible]);

  if (!visible || !zone) return null;

  return (
    <div className={`win-overlay${fadingOut ? " fading-out" : ""}`}>
      <div className="win-shower">
        {slices.map((s) => (
          <div
            key={s.id}
            className="win-slice"
            style={{
              left: `${s.x}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ["--rotate-start" as any]: `${s.rotation}deg`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ["--rotate-end" as any]: `${s.rotation + s.rotationSpeed}deg`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ["--wobble" as any]: `${s.wobble}px`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zone.sliceImage} alt="" />
          </div>
        ))}
      </div>

      <div className="win-announce">
        <div className="win-card" style={{ borderColor: zone.color }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="win-card-img" src={zone.sliceImageHot} alt={zone.displayName} />
          <div className="win-card-badge">🏆 WINNER</div>
          <div className="win-card-name" style={{ color: zone.color }}>{zone.name}</div>
          <div className="win-card-topping" style={{ textTransform: "capitalize" }}>{zone.displayName}</div>
          <div className="win-card-divider" style={{ background: zone.color }} />
          <div className="win-card-round">Round complete</div>
        </div>
      </div>
    </div>
  );
}
