"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { ZONES } from "@/lib/zones";

export default function RoundResolution() {
  const isResolving = useGameStore((s) => s.isResolving);
  const lastWinner = useGameStore((s) => s.lastWinner);
  const totalPool = useGameStore((s) => s.totalPool);
  const roundId = useGameStore((s) => s.roundId);

  const winner = lastWinner ? ZONES[lastWinner] : null;

  return (
    <AnimatePresence>
      {isResolving && winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(12px)" }}
        >
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotateY: 90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative rounded-3xl p-10 text-center max-w-lg mx-4 bg-white"
            style={{
              borderTop: `4px solid ${winner.color}`,
              border: `1px solid #E5E7EB`,
              borderTopWidth: "4px",
              borderTopColor: winner.color,
              boxShadow: `0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(${winner.colorRgb}, 0.1)`,
            }}
          >
            {/* Confetti */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 8 + 3,
                  height: Math.random() * 8 + 3,
                  backgroundColor: i % 4 === 0 ? winner.color : i % 4 === 1 ? "#B8860B" : i % 4 === 2 ? "#E63946" : "#2D9B2D",
                  left: "50%",
                  top: "50%",
                }}
                animate={{
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  opacity: [1, 1, 0],
                  scale: [0, 2, 0],
                  rotate: Math.random() * 1080,
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.04,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              />
            ))}

            {/* Crown */}
            <motion.div
              className="text-4xl mb-2"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
            >
              👑
            </motion.div>

            <motion.div
              className="text-7xl mb-4"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              {winner.toppingEmoji}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] text-gray-400 uppercase tracking-[0.3em] mb-2"
            >
              Round #{roundId} Winner
            </motion.p>

            <motion.h2
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="text-4xl font-bold mb-2"
              style={{ color: winner.color }}
            >
              {winner.name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-400 mb-6"
            >
              {winner.topping} dominates the oven!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-4 rounded-2xl px-6 py-3"
              style={{
                background: "rgba(184, 134, 11, 0.06)",
                border: "1px solid rgba(184, 134, 11, 0.15)",
              }}
            >
              <div>
                <span className="text-[8px] text-gray-400 block uppercase tracking-wider">Pool</span>
                <span
                  className="font-numbers text-2xl font-bold"
                  style={{ color: "#B8860B" }}
                >
                  {totalPool.toFixed(1)} MON
                </span>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.3, 0.6] }}
              transition={{ delay: 2, duration: 2, repeat: Infinity }}
              className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest"
            >
              Next round incoming...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
