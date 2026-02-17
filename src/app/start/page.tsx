"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ZONE_LIST } from "@/lib/zones";
import { Zone } from "@/types";

// ─── Screen enum ───────────────────────────────────────────────────────────────
type Screen = "intro" | "zones" | "howItWorks" | "cta";
const SCREENS: Screen[] = ["intro", "zones", "howItWorks", "cta"];
const SCREEN_DURATIONS: Record<Screen, number | null> = {
  intro: 3000,
  zones: null, // waits for interaction
  howItWorks: 4000,
  cta: null, // waits for click
};

// ─── Shared transition config ──────────────────────────────────────────────────
const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

// ─── Protocol data per zone ────────────────────────────────────────────────────
const ZONE_PROTOCOLS: Record<string, string[]> = {
  pepperoni: ["Kuru", "Bean", "Ambient"],
  mushroom: ["aPriori", "Curvance", "Shmonad"],
  pineapple: ["nad.fun", "LFJ", "PinkSale"],
  olive: ["Monorail", "Pyth", "LayerZero"],
  anchovy: ["aPuff", "Castora", "Yap"],
};

// ─── Pizza geometry ────────────────────────────────────────────────────────────
const VB = 560;
const PCX = VB / 2;
const PCY = VB / 2;
const CRUST_R = 158;
const CHEESE_R = 146;
const PIZZA_R = 143;
const N_SLICES = 5;
const SLICE_ANG = (2 * Math.PI) / N_SLICES;
const ANG_START = -Math.PI / 2;
const ARC_GAP = 0.025;

function polar(a: number, r: number) {
  return { x: PCX + r * Math.cos(a), y: PCY + r * Math.sin(a) };
}

function makeSlicePath(i: number) {
  const a1 = ANG_START + i * SLICE_ANG + ARC_GAP;
  const a2 = ANG_START + (i + 1) * SLICE_ANG - ARC_GAP;
  const p1 = polar(a1, PIZZA_R);
  const p2 = polar(a2, PIZZA_R);
  return `M${PCX},${PCY} L${p1.x},${p1.y} A${PIZZA_R},${PIZZA_R} 0 0,1 ${p2.x},${p2.y} Z`;
}

function sliceCenter(i: number, frac: number) {
  const a = ANG_START + (i + 0.5) * SLICE_ANG;
  return polar(a, PIZZA_R * frac);
}

function slicePull(i: number, dist: number) {
  const a = ANG_START + (i + 0.5) * SLICE_ANG;
  return { x: Math.cos(a) * dist, y: Math.sin(a) * dist };
}

function getAnchor(i: number): "start" | "middle" | "end" {
  const a = ANG_START + (i + 0.5) * SLICE_ANG;
  const c = Math.cos(a);
  return c > 0.3 ? "start" : c < -0.3 ? "end" : "middle";
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ screenIndex }: { screenIndex: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-1 bg-white/10">
      <motion.div
        className="h-full bg-white/40"
        initial={{ width: "0%" }}
        animate={{ width: `${((screenIndex + 1) / SCREENS.length) * 100}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Screen 1: Impact Intro ────────────────────────────────────────────────────
function IntroScreen() {
  const emojiPositions = [
    { x: -140, y: -90, rotate: -30 },
    { x: 150, y: -70, rotate: 25 },
    { x: -120, y: 80, rotate: 15 },
    { x: 130, y: 100, rotate: -20 },
    { x: 0, y: -130, rotate: 10 },
  ];

  return (
    <motion.div
      {...pageTransition}
      className="flex flex-col items-center justify-center h-full relative"
    >
      {/* Zone emojis scatter */}
      {ZONE_LIST.map((zone, i) => (
        <motion.span
          key={zone.id}
          className="absolute text-4xl"
          initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
          animate={{
            scale: 1,
            x: emojiPositions[i].x,
            y: emojiPositions[i].y,
            rotate: emojiPositions[i].rotate,
            opacity: 0.8,
          }}
          transition={{
            delay: 0.5 + i * 0.08,
            type: "spring",
            stiffness: 200,
            damping: 12,
          }}
        >
          {zone.toppingEmoji}
        </motion.span>
      ))}

      {/* PIZZA WARS title */}
      <motion.h1
        className="text-7xl sm:text-8xl font-bold tracking-tighter text-white relative z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 15,
          delay: 0.1,
        }}
      >
        PIZZA WARS
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-sm sm:text-base text-white/50 mt-4 tracking-[0.25em] uppercase"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        Real-time prediction market on Monad
      </motion.p>

      {/* Glow ring behind title */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(230,57,70,0.15) 0%, rgba(124,58,237,0.1) 40%, transparent 70%)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 2.5, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1.5, ease: "easeOut" }}
      />
    </motion.div>
  );
}

// ─── Screen 2: Pizza Slice Picker (Interactive) ───────────────────────────────
function ZonesScreen({
  onSelect,
}: {
  onSelect: (zone: Zone) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const handlePick = (zone: Zone) => {
    if (picked) return;
    setPicked(zone.id);
    setTimeout(() => onSelect(zone), 1200);
  };

  return (
    <motion.div
      {...pageTransition}
      className="flex flex-col items-center justify-center h-full px-4"
    >
      <motion.p
        className="text-xs sm:text-sm text-white/40 uppercase tracking-[0.3em] mb-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        5 zones battle every 3 minutes
      </motion.p>

      <motion.h2
        className="text-2xl sm:text-3xl font-bold text-white mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Pick your slice
      </motion.h2>

      {/* Pizza visualization */}
      <motion.div
        className="w-full flex-1 min-h-0 flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 18 }}
      >
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          className="max-h-[55vh] max-w-[90vw]"
          style={{ overflow: "visible" }}
        >
          {/* Glow filter for selected slice */}
          <defs>
            <filter id="sliceGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Crust ring */}
          <circle cx={PCX} cy={PCY} r={CRUST_R} fill="#8B6914" />
          <circle cx={PCX} cy={PCY} r={CRUST_R - 5} fill="#C4943D" />
          <circle cx={PCX} cy={PCY} r={CHEESE_R} fill="#D4A574" />

          {/* Slices + emoji toppings */}
          {ZONE_LIST.map((zone, i) => {
            const sel = picked === zone.id;
            const dim = picked !== null && !sel;
            const hov = hovered === zone.id && !picked;
            const pv = slicePull(i, sel ? 14 : 0);
            const emojiPos = sliceCenter(i, 0.52);

            return (
              <motion.g
                key={zone.id}
                animate={{ x: pv.x, y: pv.y }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.path
                  d={makeSlicePath(i)}
                  fill={zone.color}
                  initial={{ fillOpacity: 0 }}
                  animate={{
                    fillOpacity: dim ? 0.1 : hov ? 1 : 0.7,
                  }}
                  transition={{
                    fillOpacity: { delay: 0.4 + i * 0.06, duration: 0.3 },
                  }}
                  stroke={sel ? "#fff" : "rgba(255,255,255,0.06)"}
                  strokeWidth={sel ? 2.5 : 0.5}
                  filter={sel ? "url(#sliceGlow)" : undefined}
                  cursor={picked ? "default" : "pointer"}
                  role="button"
                  aria-label={`${zone.topping} - ${zone.name}`}
                  tabIndex={0}
                  onClick={() => handlePick(zone)}
                  onMouseEnter={() => !picked && setHovered(zone.id)}
                  onMouseLeave={() => setHovered(null)}
                />
                <text
                  x={emojiPos.x}
                  y={emojiPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={28}
                  style={{ pointerEvents: "none" }}
                  opacity={dim ? 0.15 : 1}
                >
                  {zone.toppingEmoji}
                </text>
              </motion.g>
            );
          })}

          {/* Center cheese dot */}
          <circle cx={PCX} cy={PCY} r={12} fill="#C4943D" stroke="#8B6914" strokeWidth={1.5} />

          {/* Connector lines + protocol labels */}
          {ZONE_LIST.map((zone, i) => {
            const lineStart = sliceCenter(i, CRUST_R / PIZZA_R + 0.05);
            const lineEnd = sliceCenter(i, 1.28);
            const labelPos = sliceCenter(i, 1.36);
            const anchor = getAnchor(i);
            const protocols = ZONE_PROTOCOLS[zone.id];
            const sel = picked === zone.id;
            const dim = picked !== null && !sel;
            const pv = slicePull(i, sel ? 14 : 0);

            return (
              <motion.g
                key={`label-${zone.id}`}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: dim ? 0.08 : 1,
                  x: pv.x,
                  y: pv.y,
                }}
                transition={{
                  opacity: { delay: 0.7 + i * 0.05, duration: 0.4 },
                  x: { type: "spring", stiffness: 300, damping: 20 },
                  y: { type: "spring", stiffness: 300, damping: 20 },
                }}
              >
                {/* Dashed connector from crust to label */}
                <line
                  x1={lineStart.x}
                  y1={lineStart.y}
                  x2={lineEnd.x}
                  y2={lineEnd.y}
                  stroke={zone.color}
                  strokeWidth={1}
                  strokeOpacity={0.25}
                  strokeDasharray="2 3"
                />

                {/* Zone topping name */}
                <text
                  x={labelPos.x}
                  y={labelPos.y - 2}
                  textAnchor={anchor}
                  fill={zone.color}
                  fontSize={12}
                  fontWeight={700}
                  fontFamily="var(--font-space), system-ui"
                >
                  {zone.topping}
                </text>

                {/* Protocol names */}
                {protocols.map((name, j) => (
                  <text
                    key={name}
                    x={labelPos.x}
                    y={labelPos.y + 13 + j * 13}
                    textAnchor={anchor}
                    fill="rgba(255,255,255,0.4)"
                    fontSize={9.5}
                    fontFamily="var(--font-space), system-ui"
                  >
                    {name}
                  </text>
                ))}
              </motion.g>
            );
          })}
        </svg>
      </motion.div>

      {/* Confirmation / hint */}
      <AnimatePresence>
        {picked ? (
          <motion.p
            key="confirm"
            className="text-sm font-bold text-white/70 tracking-widest uppercase py-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Nice pick.
          </motion.p>
        ) : (
          <motion.p
            key="hint"
            className="text-[11px] text-white/25 tracking-wider py-2"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            TAP A SLICE TO CONTINUE
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Screen 3: How It Works ────────────────────────────────────────────────────
function HowItWorksScreen({ chosenZone }: { chosenZone: Zone }) {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setBeat(1), 1200);
    const t2 = setTimeout(() => setBeat(2), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const beats = [
    {
      icon: chosenZone.toppingEmoji,
      text: "Pick your zone",
      sub: `You chose ${chosenZone.topping}`,
    },
    {
      icon: "💰",
      text: "Place your bet",
      sub: "Wager MON on your pick",
    },
    {
      icon: "🏆",
      text: "Win the pool",
      sub: "Highest on-chain activity wins",
    },
  ];

  return (
    <motion.div
      {...pageTransition}
      className="flex flex-col items-center justify-center h-full px-6"
    >
      <motion.p
        className="text-xs text-white/40 uppercase tracking-[0.3em] mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        How it works
      </motion.p>

      <div className="flex flex-col items-center gap-8">
        {beats.map((b, i) => (
          <AnimatePresence key={i}>
            {beat >= i && (
              <motion.div
                className="flex items-center gap-5"
                initial={{ opacity: 0, x: -40, scale: 0.9 }}
                animate={{
                  opacity: beat === i ? 1 : 0.5,
                  x: 0,
                  scale: beat === i ? 1 : 0.9,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              >
                <motion.span
                  className="text-4xl"
                  animate={
                    beat === i
                      ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                      : {}
                  }
                  transition={{
                    duration: 0.6,
                    repeat: beat === i ? Infinity : 0,
                    repeatDelay: 0.8,
                  }}
                >
                  {b.icon}
                </motion.span>
                <div>
                  <p
                    className="text-xl sm:text-2xl font-bold"
                    style={{
                      color:
                        beat === i ? chosenZone.color : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {b.text}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">{b.sub}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Screen 4: CTA ─────────────────────────────────────────────────────────────
function CtaScreen({ chosenZone }: { chosenZone: Zone }) {
  const router = useRouter();

  const enter = useCallback(() => {
    router.push("/");
  }, [router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") enter();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enter]);

  // Floating particles
  const particles = Array.from({ length: 16 }).map((_, i) => ({
    x: (Math.random() - 0.5) * 600,
    y: (Math.random() - 0.5) * 600,
    size: Math.random() * 6 + 2,
    delay: Math.random() * 2,
    duration: Math.random() * 3 + 3,
    color:
      i % 5 === 0
        ? chosenZone.color
        : ZONE_LIST[i % ZONE_LIST.length].color,
  }));

  return (
    <motion.div
      {...pageTransition}
      className="flex flex-col items-center justify-center h-full relative overflow-hidden"
    >
      {/* Background particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: "50%",
            top: "50%",
            opacity: 0,
          }}
          animate={{
            x: [0, p.x],
            y: [0, p.y],
            opacity: [0, 0.6, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Text */}
      <motion.p
        className="text-lg sm:text-xl text-white/60 font-medium mb-8 tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        The oven is hot.
      </motion.p>

      {/* CTA Button */}
      <motion.button
        onClick={enter}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className="relative px-10 py-4 rounded-2xl text-lg font-bold tracking-wider uppercase cursor-pointer"
        style={{
          background: chosenZone.color,
          color: "white",
          boxShadow: `0 0 40px rgba(${chosenZone.colorRgb}, 0.4), 0 0 80px rgba(${chosenZone.colorRgb}, 0.15)`,
        }}
      >
        {/* Pulsing glow ring */}
        <motion.span
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: [
              `0 0 20px rgba(${chosenZone.colorRgb}, 0.3)`,
              `0 0 50px rgba(${chosenZone.colorRgb}, 0.6)`,
              `0 0 20px rgba(${chosenZone.colorRgb}, 0.3)`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        Enter the Kitchen
      </motion.button>

      {/* Hint */}
      <motion.p
        className="mt-6 text-[10px] text-white/20 tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        or press Enter
      </motion.p>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StartPage() {
  const router = useRouter();
  const [screenIndex, setScreenIndex] = useState(0);
  const [chosenZone, setChosenZone] = useState<Zone>(ZONE_LIST[0]);

  const screen = SCREENS[screenIndex];

  const advance = useCallback(() => {
    setScreenIndex((prev) => Math.min(prev + 1, SCREENS.length - 1));
  }, []);

  // Auto-advance for timed screens
  useEffect(() => {
    const duration = SCREEN_DURATIONS[screen];
    if (duration === null) return;
    const timer = setTimeout(advance, duration);
    return () => clearTimeout(timer);
  }, [screen, advance]);

  const handleZoneSelect = (zone: Zone) => {
    setChosenZone(zone);
    advance();
  };

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Skip button */}
      <motion.button
        onClick={handleSkip}
        className="absolute top-5 right-6 z-50 text-[11px] text-white/25 hover:text-white/60 uppercase tracking-[0.2em] transition-colors cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Skip
      </motion.button>

      {/* Screen content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {screen === "intro" && <IntroScreen key="intro" />}
          {screen === "zones" && (
            <ZonesScreen key="zones" onSelect={handleZoneSelect} />
          )}
          {screen === "howItWorks" && (
            <HowItWorksScreen key="howItWorks" chosenZone={chosenZone} />
          )}
          {screen === "cta" && (
            <CtaScreen key="cta" chosenZone={chosenZone} />
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <ProgressBar screenIndex={screenIndex} />
    </div>
  );
}
