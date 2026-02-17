"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { ZONES } from "@/lib/zones";

export default function ScreenFlash() {
  const screenFlash = useGameStore((s) => s.screenFlash);
  const lastBigBet = useGameStore((s) => s.lastBigBet);
  const clearScreenFlash = useGameStore((s) => s.clearScreenFlash);

  useEffect(() => {
    if (screenFlash) {
      const timer = setTimeout(clearScreenFlash, 500);
      return () => clearTimeout(timer);
    }
  }, [screenFlash, clearScreenFlash]);

  const zone = lastBigBet ? ZONES[lastBigBet.zoneId] : null;

  return (
    <AnimatePresence>
      {screenFlash && zone && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0.08 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: `rgba(${zone.colorRgb}, 0.06)`,
          }}
        />
      )}
    </AnimatePresence>
  );
}
