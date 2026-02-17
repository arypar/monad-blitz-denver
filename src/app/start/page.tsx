"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { ZONE_LIST } from "@/lib/zones";
import { Zone } from "@/types";

// ─── Scene definitions ──────────────────────────────────────────────────────────
type Scene =
  | "titleDrop"
  | "theHook"
  | "zonesReveal"
  | "pizzaPicker"
  | "howItWorks"
  | "connectWallet"
  | "launchCta";

const SCENES: Scene[] = [
  "titleDrop",
  "theHook",
  "zonesReveal",
  "pizzaPicker",
  "howItWorks",
  "connectWallet",
  "launchCta",
];

const SCENE_DURATIONS: Record<Scene, number | null> = {
  titleDrop: 4000,
  theHook: 6000,
  zonesReveal: 5000,
  pizzaPicker: null,
  howItWorks: 5000,
  connectWallet: null,
  launchCta: null,
};

const INTERACTIVE_SCENES: Set<Scene> = new Set([
  "pizzaPicker",
  "connectWallet",
  "launchCta",
]);

// ─── Shared transition ──────────────────────────────────────────────────────────
const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

// ─── Protocol data ──────────────────────────────────────────────────────────────
const ZONE_PROTOCOLS: Record<string, string[]> = {
  pepperoni: ["Kuru", "Bean", "Ambient"],
  mushroom: ["aPriori", "Curvance", "Shmonad"],
  pineapple: ["nad.fun", "LFJ", "PinkSale"],
  olive: ["Monorail", "Pyth", "LayerZero"],
  anchovy: ["aPuff", "Castora", "Yap"],
};

// ─── Pizza geometry ─────────────────────────────────────────────────────────────
const VB = 560;
const PCX = VB / 2;
const PCY = VB / 2;
const CRUST_R = 158;
const CHEESE_R = 146;
const PIZZA_R = 143;
const SLICE_ANG = (2 * Math.PI) / 5;
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

// ─── Seeded random for SSR-safe positions ───────────────────────────────────────
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ─── Floating Pizza Background (every scene) ───────────────────────────────────
function FloatingPizzas({ count = 10, seed = 0 }: { count?: number; seed?: number }) {
  const pizzas = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: seededRandom(seed + i * 7) * 100,
        y: seededRandom(seed + i * 13) * 100,
        size: seededRandom(seed + i * 19) * 20 + 14,
        delay: seededRandom(seed + i * 23) * 6,
        duration: seededRandom(seed + i * 29) * 8 + 10,
        rotate: seededRandom(seed + i * 31) * 360,
        drift: (seededRandom(seed + i * 37) - 0.5) * 60,
      })),
    [count, seed]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {pizzas.map((p, i) => (
        <motion.span
          key={i}
          className="absolute select-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
          }}
          initial={{ opacity: 0, rotate: p.rotate }}
          animate={{
            opacity: [0, 0.12, 0.08, 0.12, 0],
            y: [0, p.drift, -p.drift, 0],
            x: [0, p.drift * 0.5, -p.drift * 0.3, 0],
            rotate: [p.rotate, p.rotate + 30, p.rotate - 20, p.rotate + 10],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          🍕
        </motion.span>
      ))}
    </div>
  );
}

// ─── Pizza Rain (title + CTA screens) ───────────────────────────────────────────
function PizzaRain({ count = 30 }: { count?: number }) {
  const slices = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: seededRandom(i * 43 + 7) * 100,
        delay: seededRandom(i * 17 + 3) * 4,
        duration: seededRandom(i * 11 + 5) * 3 + 3,
        size: seededRandom(i * 23 + 9) * 18 + 16,
        rotate: seededRandom(i * 31 + 2) * 720 - 360,
        wobble: (seededRandom(i * 41 + 1) - 0.5) * 80,
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {slices.map((s, i) => (
        <motion.span
          key={i}
          className="absolute select-none"
          style={{ left: `${s.x}%`, top: -40, fontSize: s.size }}
          animate={{
            y: [0, typeof window !== "undefined" ? window.innerHeight + 80 : 900],
            x: [0, s.wobble],
            rotate: [0, s.rotate],
            opacity: [0.7, 0.5, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          🍕
        </motion.span>
      ))}
    </div>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────────────────────
function ProgressBar({
  sceneIndex,
  total,
}: {
  sceneIndex: number;
  total: number;
}) {
  const pct = ((sceneIndex + 1) / total) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-6 flex items-center">
      {/* Track background */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(255,255,255,0.04)" }}
      />

      {/* Filled bar */}
      <motion.div
        className="h-full relative overflow-hidden"
        style={{
          background:
            "linear-gradient(90deg, #E63946, #c43030, #E63946, #D4A017)",
          backgroundSize: "200% 100%",
        }}
        initial={{ width: "0%" }}
        animate={{
          width: `${pct}%`,
          backgroundPosition: ["0% 0%", "100% 0%"],
        }}
        transition={{
          width: { duration: 0.6, ease: "easeOut" },
          backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" },
        }}
      >
        {/* Cheese drip texture */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(255,220,100,0.25) 18px, rgba(255,220,100,0.25) 20px)",
          }}
        />
      </motion.div>

      {/* Pizza emoji at the leading edge */}
      <motion.span
        className="absolute z-10 select-none"
        style={{ fontSize: 18, top: -7 }}
        initial={{ left: "0%" }}
        animate={{
          left: `${pct}%`,
          rotate: [0, 15, -15, 0],
        }}
        transition={{
          left: { duration: 0.6, ease: "easeOut" },
          rotate: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        🍕
      </motion.span>

      {/* Milestone pizza markers */}
      {Array.from({ length: total }).map((_, i) => {
        const pos = ((i + 1) / total) * 100;
        const reached = sceneIndex >= i;
        return (
          <motion.span
            key={i}
            className="absolute select-none"
            style={{
              left: `${pos}%`,
              top: -4,
              fontSize: 10,
              transform: "translateX(-50%)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: reached ? 0.7 : 0.15,
              scale: reached ? 1 : 0.7,
            }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            🍕
          </motion.span>
        );
      })}
    </div>
  );
}

// ─── Navigation Hint ────────────────────────────────────────────────────────────
function NavHint({ canGoBack, canGoForward }: { canGoBack: boolean; canGoForward: boolean }) {
  return (
    <motion.div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
    >
      {canGoBack && (
        <span className="text-white/20 text-[10px] tracking-widest uppercase flex items-center gap-1">
          <span className="inline-block border border-white/20 rounded px-1.5 py-0.5 text-[9px] font-mono">
            ←
          </span>
        </span>
      )}
      <span className="text-white/15 text-[10px] tracking-[0.2em] uppercase">
        use arrow keys 🍕
      </span>
      {canGoForward && (
        <span className="text-white/20 text-[10px] tracking-widest uppercase flex items-center gap-1">
          <span className="inline-block border border-white/20 rounded px-1.5 py-0.5 text-[9px] font-mono">
            →
          </span>
        </span>
      )}
    </motion.div>
  );
}

// ─── Scene 1: Title Drop ────────────────────────────────────────────────────────
function TitleDropScene() {
  const titleControls = useAnimation();
  const [showSubtitle, setShowSubtitle] = useState(false);

  useEffect(() => {
    const run = async () => {
      await titleControls.start({
        scale: [3, 0.9, 1.05, 1],
        opacity: [0, 1, 1, 1],
        y: ["-100%", "5%", "-2%", "0%"],
        transition: { duration: 0.8, times: [0, 0.5, 0.75, 1], ease: "easeOut" },
      });
      setShowSubtitle(true);
    };
    run();
  }, [titleControls]);

  const orbitEmojis = useMemo(
    () =>
      ZONE_LIST.map((z, i) => ({
        emoji: z.toppingEmoji,
        delay: i * 0.15,
        angle: (i / 5) * 360,
        color: z.color,
      })),
    []
  );

  return (
    <motion.div
      {...pageTransition}
      className="flex flex-col items-center justify-center h-full relative"
    >
      <PizzaRain count={35} />
      <FloatingPizzas count={12} seed={42} />

      {/* Cycling glow */}
      <motion.div
        className="absolute w-72 h-72 rounded-full"
        animate={{
          background: [
            "radial-gradient(circle, rgba(230,57,70,0.2) 0%, transparent 70%)",
            "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
            "radial-gradient(circle, rgba(212,160,23,0.2) 0%, transparent 70%)",
            "radial-gradient(circle, rgba(8,145,178,0.2) 0%, transparent 70%)",
            "radial-gradient(circle, rgba(234,88,12,0.2) 0%, transparent 70%)",
          ],
          scale: [2, 2.8, 2.4, 2.6, 2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Orbiting zone emojis */}
      {orbitEmojis.map((e, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl z-10"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 0.7,
            scale: 1,
            rotate: [e.angle, e.angle + 360],
            x: [
              Math.cos((e.angle * Math.PI) / 180) * 160,
              Math.cos(((e.angle + 360) * Math.PI) / 180) * 160,
            ],
            y: [
              Math.sin((e.angle * Math.PI) / 180) * 100,
              Math.sin(((e.angle + 360) * Math.PI) / 180) * 100,
            ],
          }}
          transition={{
            opacity: { delay: 0.8 + e.delay, duration: 0.4 },
            scale: { delay: 0.8 + e.delay, duration: 0.4 },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            x: { duration: 20, repeat: Infinity, ease: "linear" },
            y: { duration: 20, repeat: Infinity, ease: "linear" },
          }}
        >
          {e.emoji}
        </motion.span>
      ))}

      {/* Title */}
      <motion.h1
        className="text-7xl sm:text-9xl font-black tracking-tighter text-white relative z-20"
        style={{ fontFamily: "var(--font-nunito), system-ui", textShadow: "0 0 80px rgba(230,57,70,0.3)" }}
        animate={titleControls}
      >
        PIZZA WARS
      </motion.h1>

      {/* Subtitle */}
      <AnimatePresence>
        {showSubtitle && (
          <motion.p
            className="text-sm sm:text-base text-white/50 mt-4 tracking-[0.25em] uppercase z-20 flex items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            🍕 Real-time prediction market on Monad 🍕
          </motion.p>
        )}
      </AnimatePresence>

      {/* Big pizza behind title */}
      <motion.span
        className="absolute text-[200px] sm:text-[280px] z-0 select-none"
        style={{ opacity: 0.04 }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        🍕
      </motion.span>
    </motion.div>
  );
}

// ─── Scene 2: The Hook ──────────────────────────────────────────────────────────
function TheHookScene() {
  const [phase, setPhase] = useState(0);
  const [counter, setCounter] = useState(0);
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2500);
    const t3 = setTimeout(() => setPhase(3), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (phase >= 1 && !counterRef.current) {
      counterRef.current = setInterval(() => {
        setCounter((c) => {
          if (c >= 10000) {
            if (counterRef.current) clearInterval(counterRef.current);
            return 10000;
          }
          return Math.min(c + Math.floor(Math.random() * 400 + 200), 10000);
        });
      }, 50);
    }
    return () => {
      if (counterRef.current) clearInterval(counterRef.current);
    };
  }, [phase]);

  return (
    <motion.div
      {...pageTransition}
      className="flex flex-col items-center justify-center h-full relative px-6"
    >
      <FloatingPizzas count={10} seed={99} />

      {/* "Monad is fast" */}
      <motion.p
        className="text-xs text-white/30 uppercase tracking-[0.4em] mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Chapter I
      </motion.p>

      <AnimatePresence>
        {phase >= 0 && (
          <motion.h2
            className="text-3xl sm:text-5xl font-black text-white text-center z-10"
            style={{ fontFamily: "var(--font-nunito), system-ui" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Monad is fast.
          </motion.h2>
        )}
      </AnimatePresence>

      {/* Counter */}
      <AnimatePresence>
        {phase >= 1 && (
          <motion.div
            className="mt-8 flex items-baseline gap-3 z-10"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <motion.span
              className="text-5xl sm:text-7xl font-black text-white tabular-nums"
              style={{
                fontFamily: "var(--font-nunito), system-ui",
                letterSpacing: "-2px",
                textShadow:
                  counter >= 10000
                    ? "0 0 40px rgba(230,57,70,0.5)"
                    : "none",
              }}
            >
              {counter.toLocaleString()}
            </motion.span>
            <span className="text-xl sm:text-2xl text-white/40 font-bold">
              🍕/s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase >= 2 && (
          <motion.p
            className="text-sm sm:text-lg text-white/30 mt-4 text-center z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Really, really fast.
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase >= 3 && (
          <motion.p
            className="text-lg sm:text-2xl font-bold text-white/80 mt-10 text-center z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            What if you could{" "}
            <span
              className="font-black"
              style={{ color: "#E63946" }}
            >
              bet
            </span>{" "}
            on where those transactions go? 🍕
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Scene 3: Zones Reveal ──────────────────────────────────────────────────────
function ZonesRevealScene() {
  return (
    <motion.div
      {...pageTransition}
      className="flex flex-col items-center justify-center h-full relative px-4"
    >
      <FloatingPizzas count={8} seed={200} />

      <motion.p
        className="text-xs text-white/30 uppercase tracking-[0.4em] mb-3 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Chapter II
      </motion.p>

      <motion.h2
        className="text-2xl sm:text-4xl font-black text-white mb-8 z-10 text-center"
        style={{ fontFamily: "var(--font-nunito), system-ui" }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        5 zones. 5 toppings. One winner. 🍕
      </motion.h2>

      <div className="flex flex-wrap justify-center gap-3 max-w-xl z-10">
        {ZONE_LIST.map((zone, i) => (
          <motion.div
            key={zone.id}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{
              background: "#141414",
              border: "2.5px solid #111",
              minWidth: 200,
            }}
            initial={{ opacity: 0, x: i % 2 === 0 ? -120 : 120, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              delay: 0.5 + i * 0.2,
              type: "spring",
              stiffness: 200,
              damping: 18,
            }}
            whileHover={{ scale: 1.04, borderColor: zone.color }}
          >
            <span className="text-3xl">{zone.toppingEmoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: zone.color }}
                >
                  {zone.topping}
                </span>
                <span className="text-[10px]">🍕</span>
              </div>
              <p className="text-[11px] text-white/40">{zone.name}</p>
              <div className="flex gap-1 mt-1">
                {ZONE_PROTOCOLS[zone.id].map((p) => (
                  <span
                    key={p}
                    className="text-[9px] px-1.5 py-0.5 rounded-full text-white/30"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Decorative pizza divider */}
      <motion.div
        className="flex items-center gap-2 mt-6 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={i}
            className="text-lg"
            animate={{ rotate: [0, 20, -20, 0] }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          >
            🍕
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ─── Scene 4: Pizza Picker (Interactive) ────────────────────────────────────────
function PizzaPickerScene({
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
      className="flex flex-col items-center justify-center h-full px-4 relative"
    >
      <FloatingPizzas count={14} seed={333} />

      <motion.p
        className="text-xs sm:text-sm text-white/40 uppercase tracking-[0.3em] mb-1 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        🍕 5 zones battle every 3 minutes 🍕
      </motion.p>

      <motion.h2
        className="text-2xl sm:text-3xl font-bold text-white mb-2 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Pick your slice
      </motion.h2>

      <motion.div
        className="w-full flex-1 min-h-0 flex items-center justify-center z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: 0.3,
          type: "spring",
          stiffness: 200,
          damping: 18,
        }}
      >
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          className="max-h-[55vh] max-w-[90vw]"
          style={{ overflow: "visible" }}
        >
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

          {/* Slices */}
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

          <circle
            cx={PCX}
            cy={PCY}
            r={12}
            fill="#C4943D"
            stroke="#8B6914"
            strokeWidth={1.5}
          />

          {/* Connector lines + labels */}
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
                animate={{ opacity: dim ? 0.08 : 1, x: pv.x, y: pv.y }}
                transition={{
                  opacity: { delay: 0.7 + i * 0.05, duration: 0.4 },
                  x: { type: "spring", stiffness: 300, damping: 20 },
                  y: { type: "spring", stiffness: 300, damping: 20 },
                }}
              >
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
                <text
                  x={labelPos.x}
                  y={labelPos.y - 2}
                  textAnchor={anchor}
                  fill={zone.color}
                  fontSize={12}
                  fontWeight={700}
                  fontFamily="var(--font-nunito), system-ui"
                >
                  {zone.topping}
                </text>
                {protocols.map((name, j) => (
                  <text
                    key={name}
                    x={labelPos.x}
                    y={labelPos.y + 13 + j * 13}
                    textAnchor={anchor}
                    fill="rgba(255,255,255,0.4)"
                    fontSize={9.5}
                    fontFamily="var(--font-inter), system-ui"
                  >
                    {name}
                  </text>
                ))}
              </motion.g>
            );
          })}
        </svg>
      </motion.div>

      <AnimatePresence>
        {picked ? (
          <motion.p
            key="confirm"
            className="text-sm font-bold text-white/70 tracking-widest uppercase py-2 z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            🍕 Nice pick. 🍕
          </motion.p>
        ) : (
          <motion.p
            key="hint"
            className="text-[11px] text-white/25 tracking-wider py-2 z-10"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            TAP A SLICE TO CONTINUE 🍕
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Scene 5: How It Works ──────────────────────────────────────────────────────
function HowItWorksScene({ chosenZone }: { chosenZone: Zone }) {
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
      className="flex flex-col items-center justify-center h-full px-6 relative"
    >
      <FloatingPizzas count={10} seed={500} />

      <motion.p
        className="text-xs text-white/30 uppercase tracking-[0.4em] mb-3 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Chapter III
      </motion.p>

      <motion.p
        className="text-xs text-white/40 uppercase tracking-[0.3em] mb-10 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        How it works 🍕
      </motion.p>

      <div className="flex flex-col items-center gap-8 z-10">
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
                        beat === i
                          ? chosenZone.color
                          : "rgba(255,255,255,0.4)",
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

      {/* Pizza decorations after beats */}
      <motion.div
        className="flex gap-2 mt-10 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 3 }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
          >
            🍕
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ─── Scene 6: Connect Wallet ────────────────────────────────────────────────────
function ConnectWalletScene({ onConnected }: { onConnected: () => void }) {
  const { isConnected, address } = useAccount();
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    if (isConnected && !celebrated) {
      setCelebrated(true);
      const timer = setTimeout(() => onConnected(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, celebrated, onConnected]);

  return (
    <motion.div
      {...pageTransition}
      className="flex flex-col items-center justify-center h-full relative px-6"
    >
      <FloatingPizzas count={12} seed={777} />

      {/* Pizza confetti on connect */}
      {celebrated && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          {Array.from({ length: 25 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${seededRandom(i * 47 + 3) * 100}%`,
                top: -30,
              }}
              animate={{
                y: [0, typeof window !== "undefined" ? window.innerHeight : 800],
                rotate: [0, seededRandom(i * 31) * 720 - 360],
                opacity: [1, 0.6, 0],
              }}
              transition={{
                duration: seededRandom(i * 19) * 2 + 2,
                delay: seededRandom(i * 11) * 1,
                ease: "easeOut",
              }}
            >
              🍕
            </motion.span>
          ))}
        </div>
      )}

      <motion.p
        className="text-xs text-white/30 uppercase tracking-[0.4em] mb-3 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Almost there
      </motion.p>

      {!isConnected ? (
        <>
          <motion.h2
            className="text-2xl sm:text-4xl font-black text-white mb-3 text-center z-10"
            style={{ fontFamily: "var(--font-nunito), system-ui" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Connect to enter the kitchen 🍕
          </motion.h2>

          <motion.p
            className="text-sm text-white/30 mb-10 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            You&apos;ll need a wallet to place bets
          </motion.p>

          <motion.div
            className="z-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 15 }}
          >
            <ConnectButton.Custom>
              {({
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none" as const,
                        userSelect: "none" as const,
                      },
                    })}
                  >
                    <motion.button
                      onClick={openConnectModal}
                      className="relative px-10 py-4 rounded-2xl text-lg font-bold tracking-wider uppercase cursor-pointer"
                      style={{
                        background: "#E63946",
                        color: "white",
                        border: "2.5px solid rgba(255,255,255,0.1)",
                        boxShadow:
                          "0 0 40px rgba(230,57,70,0.4), 0 0 80px rgba(230,57,70,0.15)",
                      }}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <motion.span
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(230,57,70,0.3)",
                            "0 0 50px rgba(230,57,70,0.6)",
                            "0 0 20px rgba(230,57,70,0.3)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      🍕 Connect Wallet 🍕
                    </motion.button>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </motion.div>

          <motion.p
            className="mt-8 text-[10px] text-white/15 tracking-widest uppercase z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Monad Testnet
          </motion.p>
        </>
      ) : (
        <>
          <motion.h2
            className="text-2xl sm:text-4xl font-black text-white mb-4 text-center z-10"
            style={{ fontFamily: "var(--font-nunito), system-ui" }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            Welcome, chef! 🍕
          </motion.h2>

          <motion.div
            className="px-6 py-3 rounded-2xl z-10 flex items-center gap-3"
            style={{
              background: "#141414",
              border: "2.5px solid #222",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-2xl">🍕</span>
            <span className="text-white/60 text-sm font-mono">
              {address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : ""}
            </span>
          </motion.div>

          <motion.p
            className="text-sm text-white/30 mt-4 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Wallet connected! Taking you to the kitchen...
          </motion.p>
        </>
      )}
    </motion.div>
  );
}

// ─── Scene 7: Launch CTA ────────────────────────────────────────────────────────
function LaunchCtaScene({ chosenZone }: { chosenZone: Zone }) {
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

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        x: (seededRandom(i * 47 + 1) - 0.5) * 600,
        y: (seededRandom(i * 53 + 2) - 0.5) * 600,
        size: seededRandom(i * 59 + 3) * 6 + 2,
        delay: seededRandom(i * 61 + 4) * 2,
        duration: seededRandom(i * 67 + 5) * 3 + 3,
        color:
          i % 5 === 0
            ? chosenZone.color
            : ZONE_LIST[i % ZONE_LIST.length].color,
      })),
    [chosenZone.color]
  );

  return (
    <motion.div
      {...pageTransition}
      className="flex flex-col items-center justify-center h-full relative overflow-hidden"
    >
      <PizzaRain count={25} />
      <FloatingPizzas count={16} seed={999} />

      {/* Colored particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full z-0"
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

      <motion.p
        className="text-lg sm:text-xl text-white/60 font-medium mb-8 tracking-wide z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        🍕 The oven is hot. 🍕
      </motion.p>

      <motion.button
        onClick={enter}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.5,
          type: "spring",
          stiffness: 200,
          damping: 15,
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className="relative px-10 py-5 rounded-2xl text-xl font-black tracking-wider uppercase cursor-pointer z-10"
        style={{
          background: chosenZone.color,
          color: "white",
          border: "2.5px solid rgba(255,255,255,0.1)",
          fontFamily: "var(--font-nunito), system-ui",
          boxShadow: `0 0 40px rgba(${chosenZone.colorRgb}, 0.4), 0 0 80px rgba(${chosenZone.colorRgb}, 0.15)`,
        }}
      >
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
        🍕 Enter the Kitchen 🍕
      </motion.button>

      <motion.p
        className="mt-6 text-[10px] text-white/20 tracking-widest uppercase z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        or press Enter
      </motion.p>

      {/* Giant background pizza */}
      <motion.span
        className="absolute text-[300px] z-0 select-none"
        style={{ opacity: 0.03 }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        🍕
      </motion.span>
    </motion.div>
  );
}

// ─── Main Start Page ────────────────────────────────────────────────────────────
export default function StartPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [chosenZone, setChosenZone] = useState<Zone>(ZONE_LIST[0]);
  const [pickerDone, setPickerDone] = useState(false);
  const [walletDone, setWalletDone] = useState(false);

  const scene = SCENES[sceneIndex];

  const canAdvance = useCallback(() => {
    if (scene === "pizzaPicker" && !pickerDone) return false;
    if (scene === "connectWallet" && !walletDone) return false;
    return sceneIndex < SCENES.length - 1;
  }, [scene, sceneIndex, pickerDone, walletDone]);

  const canGoBack = sceneIndex > 0;

  const advance = useCallback(() => {
    setSceneIndex((prev) => Math.min(prev + 1, SCENES.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setSceneIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Auto-advance for timed scenes
  useEffect(() => {
    const duration = SCENE_DURATIONS[scene];
    if (duration === null) return;
    const timer = setTimeout(advance, duration);
    return () => clearTimeout(timer);
  }, [scene, advance]);

  // Arrow key navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && canAdvance()) {
        e.preventDefault();
        advance();
      }
      if (e.key === "ArrowLeft" && canGoBack) {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canAdvance, canGoBack, advance, goBack]);

  const handleZoneSelect = useCallback(
    (zone: Zone) => {
      setChosenZone(zone);
      setPickerDone(true);
      advance();
    },
    [advance]
  );

  const handleWalletConnected = useCallback(() => {
    setWalletDone(true);
    advance();
  }, [advance]);

  const handleSkip = () => {
    router.push("/");
  };

  // If wallet already connected when reaching that scene, auto-advance
  useEffect(() => {
    if (scene === "connectWallet" && isConnected) {
      setWalletDone(true);
      const timer = setTimeout(advance, 1500);
      return () => clearTimeout(timer);
    }
  }, [scene, isConnected, advance]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Skip button */}
      <motion.button
        onClick={handleSkip}
        className="absolute top-5 right-6 z-50 text-[11px] text-white/25 hover:text-white/60 uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Skip 🍕
      </motion.button>

      {/* Scene counter */}
      <motion.div
        className="absolute top-5 left-6 z-50 text-[10px] text-white/15 uppercase tracking-widest font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {sceneIndex + 1}/{SCENES.length}
      </motion.div>

      {/* Screen content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {scene === "titleDrop" && <TitleDropScene key="titleDrop" />}
          {scene === "theHook" && <TheHookScene key="theHook" />}
          {scene === "zonesReveal" && <ZonesRevealScene key="zonesReveal" />}
          {scene === "pizzaPicker" && (
            <PizzaPickerScene key="pizzaPicker" onSelect={handleZoneSelect} />
          )}
          {scene === "howItWorks" && (
            <HowItWorksScene key="howItWorks" chosenZone={chosenZone} />
          )}
          {scene === "connectWallet" && (
            <ConnectWalletScene
              key="connectWallet"
              onConnected={handleWalletConnected}
            />
          )}
          {scene === "launchCta" && (
            <LaunchCtaScene key="launchCta" chosenZone={chosenZone} />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation hint */}
      <NavHint canGoBack={canGoBack} canGoForward={canAdvance()} />

      {/* Progress bar */}
      <ProgressBar sceneIndex={sceneIndex} total={SCENES.length} />
    </div>
  );
}
