"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zone, ZoneActivity } from "@/types";
import { ActivityPoint, useGameStore } from "@/store/useGameStore";
import { formatMON } from "@/lib/utils";
import ActivityTrendline from "./OddsTrendline";

interface ZoneRowProps {
  zone: Zone;
  activity: ZoneActivity;
  activityHistory: ActivityPoint[];
  isSelected: boolean;
  isFlashing: boolean;
  index: number;
}

export default function ZoneRow({
  zone,
  activity,
  activityHistory,
  isSelected,
  isFlashing,
  index,
}: ZoneRowProps) {
  const setSelectedZone = useGameStore((s) => s.setSelectedZone);
  const isResolving = useGameStore((s) => s.isResolving);
  const lastWinner = useGameStore((s) => s.lastWinner);

  const isWinner = lastWinner === zone.id && isResolving;
  const isHot = activity.heatLevel === "hot" || activity.heatLevel === "onfire";

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => setSelectedZone(zone.id)}
      className="relative flex items-stretch cursor-pointer group"
      style={{ flex: "1 1 0%" }}
    >
      {/* Flash on new transaction */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-20 rounded-xl"
            initial={{ opacity: 0.15 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: `linear-gradient(90deg, rgba(${zone.colorRgb}, 0.12), transparent)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Left: Pizza Slice Info */}
      <div
        className="flex-shrink-0 w-[200px] flex items-center gap-3 pl-4 pr-3 rounded-l-xl transition-all duration-300"
        style={{
          background: isSelected
            ? `rgba(${zone.colorRgb}, 0.06)`
            : isWinner
            ? "rgba(184, 134, 11, 0.06)"
            : "#FFFFFF",
          borderLeft: `3px solid ${isSelected ? zone.color : isWinner ? "#B8860B" : isHot ? `rgba(${zone.colorRgb}, 0.4)` : `rgba(${zone.colorRgb}, 0.15)`}`,
          borderTop: "1px solid #E5E7EB",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        {/* Topping emoji */}
        <motion.div
          className="text-2xl flex-shrink-0"
          animate={
            isWinner
              ? { scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] }
              : activity.heatLevel === "onfire"
              ? { scale: [1, 1.1, 1] }
              : {}
          }
          transition={{
            duration: activity.heatLevel === "onfire" ? 0.5 : 0.8,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        >
          {zone.toppingEmoji}
        </motion.div>

        {/* Name + stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3
              className="text-sm font-bold truncate leading-tight transition-colors duration-200"
              style={{
                color: isSelected ? zone.color : "#1a1a1a",
              }}
            >
              {zone.name}
            </h3>
            {isWinner && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-xs"
              >
                👑
              </motion.span>
            )}
          </div>
          <p className="text-[9px] text-gray-400 leading-tight">{zone.topping}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <motion.span
              key={activity.totalVolume}
              initial={{ color: zone.color }}
              animate={{ color: "#6B7280" }}
              transition={{ duration: 0.8 }}
              className="font-numbers text-[10px]"
            >
              {formatMON(activity.totalVolume)} MON
            </motion.span>
            <span className="text-gray-200">|</span>
            <span
              className="font-numbers text-[10px] font-bold"
              style={{ color: isHot ? zone.color : "#6B7280" }}
            >
              {activity.odds.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Heat indicator */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor:
                activity.heatLevel === "onfire" ? "#E63946"
                : activity.heatLevel === "hot" ? "#EA580C"
                : activity.heatLevel === "warm" ? "#D4A017"
                : "#D1D5DB",
            }}
          />
          <span
            className="text-[7px] uppercase font-bold tracking-wider"
            style={{
              color:
                activity.heatLevel === "onfire" ? "#E63946"
                : activity.heatLevel === "hot" ? "#EA580C"
                : activity.heatLevel === "warm" ? "#D4A017"
                : "#9CA3AF",
            }}
          >
            {activity.heatLevel}
          </span>
        </div>
      </div>

      {/* Right: Trendline */}
      <div
        className="flex-1 min-w-0 rounded-r-xl transition-all duration-300 relative overflow-hidden"
        style={{
          background: isSelected ? `rgba(${zone.colorRgb}, 0.02)` : "#FFFFFF",
          borderRight: "1px solid #E5E7EB",
          borderTop: "1px solid #E5E7EB",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <ActivityTrendline
          data={activityHistory}
          color={zone.color}
          colorRgb={zone.colorRgb}
          isSelected={isSelected}
        />
      </div>
    </motion.div>
  );
}
