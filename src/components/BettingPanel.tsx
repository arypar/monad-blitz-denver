"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { ZONES } from "@/lib/zones";
import { formatMON } from "@/lib/utils";

const QUICK_AMOUNTS = [0.1, 0.5, 1, 5, 10];

export default function BettingPanel() {
  const selectedZone = useGameStore((s) => s.selectedZone);
  const zones = useGameStore((s) => s.zones);
  const placeBet = useGameStore((s) => s.placeBet);
  const isResolving = useGameStore((s) => s.isResolving);
  const userBets = useGameStore((s) => s.userBets);
  const roundResults = useGameStore((s) => s.roundResults);
  const [amount, setAmount] = useState("1");
  const [justBet, setJustBet] = useState(false);

  const zone = selectedZone ? ZONES[selectedZone] : null;
  const activity = selectedZone ? zones[selectedZone] : null;

  const handleBet = useCallback(() => {
    if (!selectedZone || isResolving) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    placeBet(selectedZone, val);
    setJustBet(true);
    setTimeout(() => setJustBet(false), 1500);
  }, [selectedZone, amount, placeBet, isResolving]);

  const recentUserBets = userBets.slice(0, 4);
  const payout = zone && activity && parseFloat(amount) > 0 ? (parseFloat(amount) * activity.odds) : 0;

  return (
    <div className="card-panel flex flex-col h-full overflow-hidden w-full relative">
      <div className="relative z-10 flex-1 overflow-y-auto">
        {/* No zone selected */}
        {!zone && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <motion.div
              className="text-5xl mb-4"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🍕
            </motion.div>
            <p className="text-base font-bold text-gray-600 mb-1">Pick Your Slice</p>
            <p className="text-[11px] text-gray-400">Click a zone to place your bet</p>
            <motion.div
              className="mt-6 text-[10px] text-gray-300 uppercase tracking-widest"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Fortune favors the bold
            </motion.div>
          </div>
        )}

        {/* Zone selected - betting interface */}
        <AnimatePresence mode="wait">
          {zone && activity && (
            <motion.div
              key={selectedZone}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="p-4 space-y-3"
            >
              {/* Zone header */}
              <div
                className="rounded-xl p-3 relative overflow-hidden"
                style={{
                  background: `rgba(${zone.colorRgb}, 0.04)`,
                  border: `1px solid rgba(${zone.colorRgb}, 0.15)`,
                  borderTop: `3px solid ${zone.color}`,
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <motion.span
                    className="text-2xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {zone.toppingEmoji}
                  </motion.span>
                  <div className="flex-1">
                    <h3
                      className="text-base font-bold"
                      style={{ color: zone.color }}
                    >
                      {zone.name}
                    </h3>
                    <p className="text-[9px] text-gray-400">{zone.topping} slice</p>
                  </div>
                  <span
                    className="text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
                    style={{
                      background: `rgba(${zone.colorRgb}, 0.1)`,
                      color: zone.color,
                      border: `1px solid rgba(${zone.colorRgb}, 0.2)`,
                    }}
                  >
                    {activity.heatLevel}
                  </span>
                </div>

                {/* Big odds display */}
                <div className="text-center py-2">
                  <motion.div
                    key={activity.odds}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-numbers text-3xl font-bold"
                    style={{ color: zone.color }}
                  >
                    {activity.odds.toFixed(2)}x
                  </motion.div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider mt-0.5">Multiplier</p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center border border-gray-100">
                    <span className="text-[8px] text-gray-400 block">Volume</span>
                    <span className="font-numbers text-xs font-bold text-gray-800">
                      {formatMON(activity.totalVolume)} MON
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center border border-gray-100">
                    <span className="text-[8px] text-gray-400 block">Bets</span>
                    <span className="font-numbers text-xs font-bold text-gray-800">
                      {activity.betCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bet amount section */}
              <div>
                <label className="text-[9px] text-gray-400 uppercase tracking-wider mb-1.5 block font-bold">
                  Wager (MON)
                </label>

                {/* Quick amounts - casino chip style */}
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {QUICK_AMOUNTS.map((qa) => (
                    <motion.button
                      key={qa}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setAmount(qa.toString())}
                      className="py-2 rounded-lg text-[11px] font-numbers font-bold transition-all"
                      style={{
                        background: amount === qa.toString()
                          ? zone.color
                          : "#F9FAFB",
                        border: `1px solid ${amount === qa.toString() ? zone.color : "#E5E7EB"}`,
                        color: amount === qa.toString() ? "white" : "#6B7280",
                      }}
                    >
                      {qa}
                    </motion.button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 font-numbers text-base font-bold outline-none transition-all focus:ring-2 focus:ring-gray-300"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 font-numbers">MON</span>
                </div>
              </div>

              {/* Payout display */}
              {payout > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: "rgba(184, 134, 11, 0.06)",
                    border: "1px solid rgba(184, 134, 11, 0.15)",
                  }}
                >
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Potential Payout</span>
                  <motion.span
                    key={payout}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="font-numbers text-xl font-bold block"
                    style={{ color: "#B8860B" }}
                  >
                    {payout.toFixed(2)} MON
                  </motion.span>
                </motion.div>
              )}

              {/* BET BUTTON */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBet}
                disabled={isResolving || !parseFloat(amount)}
                className="relative w-full py-4 rounded-xl font-bold text-base uppercase tracking-widest overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: zone.color,
                  boxShadow: `0 2px 8px rgba(${zone.colorRgb}, 0.3)`,
                  color: "white",
                }}
              >
                <AnimatePresence mode="wait">
                  {justBet ? (
                    <motion.span
                      key="placed"
                      initial={{ scale: 0, rotateX: 90 }}
                      animate={{ scale: 1, rotateX: 0 }}
                      exit={{ scale: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      LOCKED IN!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="bet"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      BET {parseFloat(amount) || 0} MON
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Confetti explosion */}
              <AnimatePresence>
                {justBet && (
                  <div className="relative h-0 overflow-visible z-30">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                          width: Math.random() * 6 + 3,
                          height: Math.random() * 6 + 3,
                          backgroundColor: i % 3 === 0 ? zone.color : i % 3 === 1 ? "#B8860B" : "#E5E7EB",
                          left: "50%",
                          bottom: 20,
                        }}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{
                          x: (Math.random() - 0.5) * 250,
                          y: -Math.random() * 150 - 30,
                          opacity: 0,
                          scale: [1, 2, 0],
                          rotate: Math.random() * 720,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Your bets section */}
        {recentUserBets.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Your Bets</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="space-y-1">
              {recentUserBets.map((bet) => {
                const bZone = ZONES[bet.zoneId];
                return (
                  <motion.div
                    key={bet.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px]"
                    style={{
                      background: bet.status === "won"
                        ? "rgba(45, 155, 45, 0.06)"
                        : bet.status === "lost"
                        ? "rgba(230, 57, 70, 0.06)"
                        : "#F9FAFB",
                      border: `1px solid ${
                        bet.status === "won"
                          ? "rgba(45, 155, 45, 0.2)"
                          : bet.status === "lost"
                          ? "rgba(230, 57, 70, 0.2)"
                          : "#E5E7EB"
                      }`,
                    }}
                  >
                    <span>{bZone.toppingEmoji}</span>
                    <span className="text-gray-500 flex-1 truncate">{bZone.name}</span>
                    <span className="font-numbers text-gray-600">{bet.amount}</span>
                    <span
                      className="font-numbers font-bold"
                      style={{
                        color:
                          bet.status === "won"
                            ? "#2D9B2D"
                            : bet.status === "lost"
                            ? "#E63946"
                            : zone?.color || "#6B7280",
                      }}
                    >
                      {bet.status === "pending" ? `${bet.odds.toFixed(2)}x` : bet.status.toUpperCase()}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* PAST WINNERS SECTION */}
        <div className="px-4 pb-4 mt-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🏆</span>
            <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Past Winners</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {roundResults.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-[10px] text-gray-300">No rounds completed yet</p>
              <motion.p
                className="text-[9px] text-gray-300 mt-1"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                First round resolving soon...
              </motion.p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {roundResults.map((result, i) => {
                const winZone = ZONES[result.winnerZone];
                return (
                  <motion.div
                    key={result.roundId}
                    initial={i === 0 ? { scale: 0.8, opacity: 0, x: -20 } : false}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: i === 0
                        ? `rgba(${winZone.colorRgb}, 0.06)`
                        : "#F9FAFB",
                      border: `1px solid ${i === 0 ? `rgba(${winZone.colorRgb}, 0.15)` : "#E5E7EB"}`,
                    }}
                  >
                    <span className="font-numbers text-[10px] text-gray-300 w-6">#{result.roundId}</span>
                    <span className="text-sm">{winZone.toppingEmoji}</span>
                    <span
                      className="text-[11px] font-bold flex-1"
                      style={{ color: winZone.color }}
                    >
                      {winZone.name}
                    </span>
                    <span className="font-numbers text-[10px] text-gray-400">
                      {result.totalPool.toFixed(1)} MON
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
