"use client";

import { createContext, useContext, useMemo } from "react";
import { useReadContracts } from "wagmi";
import { formatEther } from "viem";
import { CHEEZNAD_ADDRESS, cheeznadAbi } from "@/lib/cheeznadAbi";
import { ZONE_IDS } from "@/lib/zones";
import type { ZoneId } from "@/types";

const ZONE_ENUM = [0, 1, 2, 3, 4] as const;

export interface ContractPoolData {
  totalPool: number;
  zoneTotals: Record<ZoneId, number>;
  zonePercentages: Record<ZoneId, number>;
  isLoading: boolean;
  error: Error | null;
}

const defaultPool: ContractPoolData = {
  totalPool: 0,
  zoneTotals: {} as Record<ZoneId, number>,
  zonePercentages: {} as Record<ZoneId, number>,
  isLoading: true,
  error: null,
};

export const ContractPoolContext =
  createContext<ContractPoolData>(defaultPool);

/**
 * Internal hook — call this ONCE in ContractPoolProvider.
 * All other components should use useContractPool() which reads from context.
 */
export function useContractPoolFetch(): ContractPoolData {
  const { data, isLoading, error } = useReadContracts({
    contracts: ZONE_ENUM.map((i) => ({
      address: CHEEZNAD_ADDRESS,
      abi: cheeznadAbi,
      functionName: "getZoneTotal" as const,
      args: [i] as const,
    })),
    query: { refetchInterval: 15_000 },
  });

  return useMemo(() => {
    const zoneTotals = {} as Record<ZoneId, number>;
    let totalPool = 0;

    ZONE_IDS.forEach((zoneId, idx) => {
      const result = data?.[idx];
      const raw =
        result && result.status === "success"
          ? (result.result as bigint)
          : BigInt(0);
      const value = Number(formatEther(raw));
      zoneTotals[zoneId] = value;
      totalPool += value;
    });

    const zonePercentages = {} as Record<ZoneId, number>;
    ZONE_IDS.forEach((zoneId) => {
      zonePercentages[zoneId] =
        totalPool > 0
          ? Math.round((zoneTotals[zoneId] / totalPool) * 1000) / 10
          : 0;
    });

    return { totalPool, zoneTotals, zonePercentages, isLoading, error: error ?? null };
  }, [data, isLoading, error]);
}

/** Read pool data from the shared context (no RPC calls). */
export function useContractPool(): ContractPoolData {
  return useContext(ContractPoolContext);
}
