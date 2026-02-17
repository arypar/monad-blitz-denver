export type ZoneId = "pepperoni" | "mushroom" | "pineapple" | "olive" | "anchovy";

export interface ClassifiedTransaction {
  id: string;
  zoneId: ZoneId;
  txHash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: bigint;
  timestamp: number;
  contractName: string;
}

export interface ClassifiedTransactionMessage {
  type: "transaction";
  data: {
    id: string;
    zoneId: ZoneId;
    txHash: string;
    from: string;
    to: string;
    value: string;
    blockNumber: number;
    timestamp: number;
    contractName: string;
  };
}

export interface RegistryEntry {
  zoneId: ZoneId;
  protocolName: string;
  contractName: string;
  category: string;
}

export interface BlockStats {
  blockNumber: bigint;
  totalTxns: number;
  classifiedTxns: number;
  nativeTransfers: number;
  contractCreations: number;
  unclassifiedCalls: number;
  byZone: Record<ZoneId, number>;
}
