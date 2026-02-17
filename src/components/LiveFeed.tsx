"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { ZONES } from "@/lib/zones";
import { truncateAddress, formatMON } from "@/lib/utils";

export default function LiveFeed() {
  const transactions = useGameStore((s) => s.transactions);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transactions.length > 0) {
      const timer = setTimeout(() => {
        setSeenIds((prev) => {
          const next = new Set(prev);
          transactions.forEach((tx) => next.add(tx.id));
          return next;
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [transactions]);

  // Auto-scroll to show newest on the left
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [transactions.length]);

  return (
    <div className="glass-panel px-3 py-2 mx-3 mb-3">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="relative flex items-center justify-center w-2 h-2 flex-shrink-0">
          <div className="absolute w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75" />
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
        </div>
        <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider flex-shrink-0">
          Live Feed
        </span>
        <div className="flex-1 h-px bg-white/5" />
        <span className="font-numbers text-[10px] text-white/25 flex-shrink-0">
          {transactions.length} txns
        </span>
      </div>

      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1">
        <AnimatePresence initial={false}>
          {transactions.slice(0, 20).map((tx) => {
            const zone = ZONES[tx.zoneId];
            const isNew = !seenIds.has(tx.id);
            return (
              <motion.div
                key={tx.id}
                layout
                initial={{ scale: 0.8, opacity: 0, x: -20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg flex-shrink-0"
                style={{
                  background: isNew ? `rgba(${zone.colorRgb}, 0.12)` : "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(${zone.colorRgb}, ${isNew ? 0.25 : 0.06})`,
                }}
              >
                <span className="text-xs">{zone.toppingEmoji}</span>
                <span className="font-numbers text-[10px] text-white/50">
                  {tx.address === "0xYOU" ? (
                    <span className="text-white font-bold">YOU</span>
                  ) : (
                    truncateAddress(tx.address)
                  )}
                </span>
                <span
                  className="font-numbers text-[10px] font-bold"
                  style={{ color: zone.color }}
                >
                  {formatMON(tx.amount)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
