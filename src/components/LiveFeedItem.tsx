"use client";

import { motion } from "framer-motion";
import { Transaction } from "@/types";
import { ZONES } from "@/lib/zones";
import { truncateAddress, formatMON, getTimeAgo } from "@/lib/utils";

interface LiveFeedItemProps {
  tx: Transaction;
  isNew: boolean;
}

export default function LiveFeedItem({ tx, isNew }: LiveFeedItemProps) {
  const zone = ZONES[tx.zoneId];

  return (
    <motion.div
      layout
      initial={isNew ? { x: -40, opacity: 0, scale: 0.95 } : false}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg mb-1"
      style={{
        background: isNew
          ? `linear-gradient(90deg, rgba(${zone.colorRgb}, 0.15), transparent)`
          : "rgba(255,255,255,0.02)",
        borderLeft: `3px solid ${zone.color}`,
      }}
    >
      {/* Flash overlay on new entries */}
      {isNew && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ background: `rgba(${zone.colorRgb}, 0.2)` }}
          animate={{ background: "rgba(0,0,0,0)" }}
          transition={{ duration: 0.6 }}
        />
      )}

      {/* Topping emoji */}
      <span className="text-sm flex-shrink-0">{zone.toppingEmoji}</span>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="font-numbers text-xs truncate"
            style={{ color: zone.color }}
          >
            {tx.address === "0xYOU" ? "YOU" : truncateAddress(tx.address)}
          </span>
          <span className="text-[10px] text-white/30">bet on</span>
          <span
            className="text-xs font-semibold"
            style={{ color: zone.color }}
          >
            {zone.name}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span
          className="font-numbers text-xs font-bold"
          style={{ color: zone.color }}
        >
          {formatMON(tx.amount)} MON
        </span>
        <span className="text-[9px] text-white/25 font-numbers">
          {getTimeAgo(tx.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
