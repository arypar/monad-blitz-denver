import { create } from "zustand";
import { ZoneId, ZoneActivity, Transaction, UserBet, HeatLevel } from "@/types";
import { ZONE_IDS } from "@/lib/zones";

const ROUND_DURATION = 60_000; // 1 minute

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

export interface ActivityPoint {
  time: number;
  count: number; // cumulative total transactions
}

const MAX_CHART_POINTS = 60; // 60 seconds of data

interface GameStore {
  zones: Record<ZoneId, ZoneActivity>;
  activityHistory: Record<ZoneId, ActivityPoint[]>;
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
  tickChart: () => void; // samples cumulative count every second
  resolveRound: () => void;
  startNewRound: () => void;
}

function createFreshZones(): Record<ZoneId, ZoneActivity> {
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

export const useGameStore = create<GameStore>((set, get) => ({
  zones: createFreshZones(),
  activityHistory: createFreshHistory(),
  transactions: [],
  maxTransactions: 50,
  userBets: [],
  roundId: 1,
  roundEndTime: Date.now() + ROUND_DURATION,
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

    const updatedZone: ZoneActivity = {
      ...zone,
      totalVolume: zone.totalVolume + tx.amount,
      betCount: zone.betCount + 1,
      recentTxCount: zone.recentTxCount + 1,
      lastTxTimestamp: tx.timestamp,
      heatLevel: calcHeatLevel(zone.recentTxCount + 1),
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

    set({
      zones: updatedZones,
      transactions: newTransactions,
      totalPool: newTotalPool,
      flashZone: tx.zoneId,
      screenFlash: isBigBet,
      lastBigBet: isBigBet ? tx : state.lastBigBet,
    });
  },

  // Called every second to sample cumulative count
  tickChart: () => {
    const state = get();
    const now = Date.now();
    const newHistory = { ...state.activityHistory };

    ZONE_IDS.forEach((zid) => {
      const currentCount = state.zones[zid].betCount;
      newHistory[zid] = [
        ...newHistory[zid],
        { time: now, count: currentCount },
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

  resolveRound: () => {
    const state = get();
    let maxVol = -1;
    let winner: ZoneId = "pepperoni";
    ZONE_IDS.forEach((zid) => {
      const vol = state.zones[zid].totalVolume;
      if (vol > maxVol || (vol === maxVol && Math.random() > 0.5)) {
        maxVol = vol;
        winner = zid;
      }
    });

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

    set({
      isResolving: true,
      lastWinner: winner,
      roundResults: [result, ...state.roundResults].slice(0, 10),
      userBets: updatedBets,
      screenFlash: true,
    });
  },

  startNewRound: () => {
    const state = get();
    set({
      zones: createFreshZones(),
      activityHistory: createFreshHistory(),
      totalPool: 0,
      roundId: state.roundId + 1,
      roundEndTime: Date.now() + ROUND_DURATION,
      isResolving: false,
      lastWinner: null,
      flashZone: null,
      screenFlash: false,
    });
  },
}));
