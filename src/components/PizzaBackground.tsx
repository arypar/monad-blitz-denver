"use client";

import { useMemo } from "react";
import Image from "next/image";

const SLICE_IMAGES = [
  "/assets/pepperoni.png",
  "/assets/mushroom.png",
  "/assets/pineapple.png",
  "/assets/olives.png",
  "/assets/anchovies.png",
];

const SLICES_PER_SIDE = 10;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

type Side = "left" | "right";

interface SliceConfig {
  id: number;
  src: string;
  side: Side;
  offsetX: number;
  top: number;
  size: number;
  opacity: number;
  rotateStart: number;
  rotateEnd: number;
  duration: number;
  delay: number;
  animation: "pizzaFloat" | "pizzaDrift";
}

export default function PizzaBackground() {
  const slices = useMemo<SliceConfig[]>(() => {
    const rand = seededRandom(42);
    const items: SliceConfig[] = [];

    for (let s = 0; s < 2; s++) {
      const side: Side = s === 0 ? "left" : "right";
      for (let i = 0; i < SLICES_PER_SIDE; i++) {
        items.push({
          id: s * SLICES_PER_SIDE + i,
          src: SLICE_IMAGES[Math.floor(rand() * SLICE_IMAGES.length)],
          side,
          offsetX: rand() * 14 + 1,
          top: rand() * 92 + 2,
          size: Math.floor(rand() * 55 + 55),
          opacity: rand() * 0.25 + 0.35,
          rotateStart: Math.floor(rand() * 360),
          rotateEnd: Math.floor(rand() * 360),
          duration: rand() * 6 + 6,
          delay: rand() * -12,
          animation: rand() > 0.5 ? "pizzaFloat" : "pizzaDrift",
        });
      }
    }
    return items;
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {slices.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            ...(s.side === "left"
              ? { left: `${s.offsetX}%` }
              : { right: `${s.offsetX}%` }),
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            ["--pizza-rotate-start" as string]: `${s.rotateStart}deg`,
            ["--pizza-rotate-end" as string]: `${s.rotateEnd}deg`,
            animation: `${s.animation} ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        >
          <Image
            src={s.src}
            alt=""
            width={s.size}
            height={s.size}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
