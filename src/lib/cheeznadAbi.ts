import type { ZoneId } from "@/types";

export const CHEEZNAD_ADDRESS =
  "0x570afd8CE31C90728B0e8926C6922dBc8DefFF70" as const;

export const ZONE_TO_ENUM: Record<ZoneId, number> = {
  pepperoni: 0,
  mushroom: 1,
  pineapple: 2,
  olive: 3,
  anchovy: 4,
};

export const cheeznadAbi = [
  {
    name: "getZoneTotal",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_zone", type: "uint8" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "_zone", type: "uint8" }],
    outputs: [],
  },
  {
    name: "getRoundTimeRemaining",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getBettingTimeRemaining",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getCurrentRoundPhase",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "isBettingOpen",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
