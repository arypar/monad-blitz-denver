import { create } from "zustand";
import { ZoneId, ZoneActivity, Transaction, UserBet, HeatLevel } from "@/types";
import { ZONE_IDS } from "@/lib/zones";

function calcHeatLevel(recentTxCount: number): HeatLevel {
  if (recentTxCount >= 12) return "onfire";
  if (recentTxCount >= 7) return "hot";
  if (recentTxCount >= 3) return "warm";
  return "cold";
}

function calcOdds(zoneVolume: number, totalPool: number): number {
  if (zoneVolume === 0 || totalPool === 0) return 6.0;
  const share = zoneVolume / totalPool;
  const odds = Math.max(1.1, (1 / share) * 0.9);
  return Math.round(odds * 100) / 100;
}

interface RoundResult {
  roundId: number;
  winnerZone: ZoneId;
  totalPool: number;
  timestamp: number;
}

interface ZoneScoreData {
  txCount: number;
  multiplier: number;
  weightedScore: number;
}

export interface ActivityPoint {
  time: number;
  count: number;
}

export interface BlockPoint {
  blockNumber: number;
  count: number;
}

const MAX_CHART_POINTS = 60;
const MAX_BLOCKS = 30;

interface GameStore {
  zones: Record<ZoneId, ZoneActivity>;
  multipliers: Record<ZoneId, number>;
  activityHistory: Record<ZoneId, ActivityPoint[]>;
  blockHistory: Record<ZoneId, BlockPoint[]>;
  allBlocks: number[];
  transactions: Transaction[];
  maxTransactions: number;
  userBets: UserBet[];
  roundId: number;
  roundEndTime: number;
  totalPool: number;
  isActive: boolean;
  selectedZone: ZoneId | null;
  flashZone: ZoneId | null;
  screenFlash: boolean;
  lastBigBet: Transaction | null;
  roundResults: RoundResult[];
  isResolving: boolean;
  lastWinner: ZoneId | null;

  addTransaction: (tx: Transaction) => void;
  placeBet: (zoneId: ZoneId, amount: number) => void;
  setSelectedZone: (zoneId: ZoneId | null) => void;
  clearFlash: () => void;
  clearScreenFlash: () => void;
  decayRecentCounts: () => void;
  tickChart: () => void;
  handleRoundStart: (data: {
    roundNumber: number;
    multipliers: Record<ZoneId, number>;
    endsAt: number;
  }) => void;
  handleRoundEnd: (data: {
    roundNumber: number;
    winner: ZoneId;
    scores: Record<ZoneId, ZoneScoreData>;
  }) => void;
  handlePastWinners: (winners: {
    roundNumber: number;
    winnerZone: ZoneId;
    endedAt: string;
  }[]) => void;
}

function defaultMultipliers(): Record<ZoneId, number> {
  const m = {} as Record<ZoneId, number>;
  ZONE_IDS.forEach((id) => { m[id] = 1.0; });
  return m;
}

function createFreshZones(multipliers?: Record<ZoneId, number>): Record<ZoneId, ZoneActivity> {
  const m = multipliers || defaultMultipliers();
  const zones = {} as Record<ZoneId, ZoneActivity>;
  ZONE_IDS.forEach((id) => {
    zones[id] = {
      zoneId: id,
      totalVolume: 0,
      betCount: 0,
      odds: 6.0,
      heatLevel: "cold",
      lastTxTimestamp: 0,
      recentTxCount: 0,
      multiplier: m[id] ?? 1.0,
      weightedScore: 0,
    };
  });
  return zones;
}

function createFreshHistory(): Record<ZoneId, ActivityPoint[]> {
  const h = {} as Record<ZoneId, ActivityPoint[]>;
  const now = Date.now();
  ZONE_IDS.forEach((id) => {
    h[id] = [{ time: now, count: 0 }];
  });
  return h;
}

function createFreshBlockHistory(): Record<ZoneId, BlockPoint[]> {
  const h = {} as Record<ZoneId, BlockPoint[]>;
  ZONE_IDS.forEach((id) => {
    h[id] = [];
  });
  return h;
}

export const useGameStore = create<GameStore>((set, get) => ({
  zones: createFreshZones(),
  multipliers: defaultMultipliers(),
  activityHistory: createFreshHistory(),
  blockHistory: createFreshBlockHistory(),
  allBlocks: [],
  transactions: [],
  maxTransactions: 50,
  userBets: [],
  roundId: 0,
  roundEndTime: 0,
  totalPool: 0,
  isActive: true,
  selectedZone: null,
  flashZone: null,
  screenFlash: false,
  lastBigBet: null,
  roundResults: [],
  isResolving: false,
  lastWinner: null,

  addTransaction: (tx: Transaction) => {
    const state = get();
    if (state.isResolving) return;
    const zone = state.zones[tx.zoneId];
    const newTotalPool = state.totalPool + tx.amount;
    const newBetCount = zone.betCount + 1;
    const multiplier = state.multipliers[tx.zoneId] ?? 1.0;

    const updatedZone: ZoneActivity = {
      ...zone,
      totalVolume: zone.totalVolume + tx.amount,
      betCount: newBetCount,
      recentTxCount: zone.recentTxCount + 1,
      lastTxTimestamp: tx.timestamp,
      heatLevel: calcHeatLevel(zone.recentTxCount + 1),
      multiplier,
      weightedScore: Math.round(newBetCount * multiplier * 100) / 100,
    };

    const updatedZones = { ...state.zones, [tx.zoneId]: updatedZone };
    ZONE_IDS.forEach((zid) => {
      updatedZones[zid] = {
        ...updatedZones[zid],
        odds: calcOdds(updatedZones[zid].totalVolume, newTotalPool),
      };
    });

    const isBigBet = tx.amount >= 2;
    const newTransactions = [tx, ...state.transactions].slice(0, state.maxTransactions);

    // Update block history for this zone + global block list
    const newBlockHistory = { ...state.blockHistory };
    let newAllBlocks = state.allBlocks;
    if (tx.blockNumber) {
      const bn = tx.blockNumber;

      // Add to global block list if new
      if (newAllBlocks.length === 0 || newAllBlocks[newAllBlocks.length - 1] !== bn) {
        newAllBlocks = [...newAllBlocks, bn].slice(-MAX_BLOCKS);
      }

      // Add to zone-specific block counts
      const zoneBlocks = [...newBlockHistory[tx.zoneId]];
      const lastBlock = zoneBlocks[zoneBlocks.length - 1];
      if (lastBlock && lastBlock.blockNumber === bn) {
        zoneBlocks[zoneBlocks.length - 1] = {
          ...lastBlock,
          count: lastBlock.count + 1,
        };
      } else {
        zoneBlocks.push({ blockNumber: bn, count: 1 });
      }
      newBlockHistory[tx.zoneId] = zoneBlocks.slice(-MAX_BLOCKS);
    }

    set({
      zones: updatedZones,
      transactions: newTransactions,
      totalPool: newTotalPool,
      flashZone: tx.zoneId,
      screenFlash: isBigBet,
      lastBigBet: isBigBet ? tx : state.lastBigBet,
      blockHistory: newBlockHistory,
      allBlocks: newAllBlocks,
    });
  },

  tickChart: () => {
    const state = get();
    const now = Date.now();
    const newHistory = { ...state.activityHistory };

    const totalWeighted = ZONE_IDS.reduce(
      (sum, zid) => sum + state.zones[zid].weightedScore,
      0
    );

    ZONE_IDS.forEach((zid) => {
      const chance =
        totalWeighted > 0
          ? Math.round((state.zones[zid].weightedScore / totalWeighted) * 1000) / 10
          : 0;
      newHistory[zid] = [
        ...newHistory[zid],
        { time: now, count: chance },
      ].slice(-MAX_CHART_POINTS);
    });

    set({ activityHistory: newHistory });
  },

  placeBet: (zoneId: ZoneId, amount: number) => {
    const state = get();
    if (state.isResolving) return;
    const zone = state.zones[zoneId];

    const bet: UserBet = {
      id: `bet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      zoneId,
      amount,
      odds: zone.odds,
      timestamp: Date.now(),
      status: "pending",
    };

    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      zoneId,
      address: "0xYOU",
      amount,
      timestamp: Date.now(),
      type: "bet",
    };

    set({ userBets: [bet, ...state.userBets] });
    state.addTransaction(tx);
  },

  setSelectedZone: (zoneId: ZoneId | null) => set({ selectedZone: zoneId }),
  clearFlash: () => set({ flashZone: null }),
  clearScreenFlash: () => set({ screenFlash: false }),

  decayRecentCounts: () => {
    const state = get();
    const updatedZones = { ...state.zones };
    let changed = false;
    ZONE_IDS.forEach((zid) => {
      if (updatedZones[zid].recentTxCount > 0) {
        const decayed = Math.max(0, updatedZones[zid].recentTxCount - 1);
        updatedZones[zid] = {
          ...updatedZones[zid],
          recentTxCount: decayed,
          heatLevel: calcHeatLevel(decayed),
        };
        changed = true;
      }
    });
    if (changed) set({ zones: updatedZones });
  },

  handleRoundStart: (data) => {
    const { roundNumber, multipliers, endsAt } = data;
    set({
      zones: createFreshZones(multipliers),
      multipliers,
      activityHistory: createFreshHistory(),
      blockHistory: createFreshBlockHistory(),
      allBlocks: [],
      totalPool: 0,
      roundId: roundNumber,
      roundEndTime: endsAt,
      isResolving: false,
      lastWinner: null,
      flashZone: null,
      screenFlash: false,
    });
  },

  handleRoundEnd: (data) => {
    const state = get();
    const { winner, scores } = data;

    const result: RoundResult = {
      roundId: state.roundId,
      winnerZone: winner,
      totalPool: state.totalPool,
      timestamp: Date.now(),
    };

    const updatedBets = state.userBets.map((bet) => {
      if (bet.status === "pending") {
        return { ...bet, status: (bet.zoneId === winner ? "won" : "lost") as "won" | "lost" };
      }
      return bet;
    });

    const updatedZones = { ...state.zones };
    ZONE_IDS.forEach((zid) => {
      if (scores[zid]) {
        updatedZones[zid] = {
          ...updatedZones[zid],
          weightedScore: scores[zid].weightedScore,
        };
      }
    });

    set({
      zones: updatedZones,
      isResolving: true,
      lastWinner: winner,
      roundResults: [result, ...state.roundResults].slice(0, 10),
      userBets: updatedBets,
      screenFlash: true,
    });
  },

  handlePastWinners: (winners) => {
    const results: RoundResult[] = winners.map((w) => ({
      roundId: w.roundNumber,
      winnerZone: w.winnerZone,
      totalPool: 0,
      timestamp: new Date(w.endedAt).getTime(),
    }));
    set({ roundResults: results });
  },
}));
