import { Zone, ZoneId } from "@/types";

export const ZONES: Record<ZoneId, Zone> = {
  pepperoni: {
    id: "pepperoni",
    name: "DEX & Trading",
    topping: "Pepperoni",
    toppingEmoji: "🍕",
    color: "#E63946",
    colorRgb: "230, 57, 70",
    description: "Swaps, perps, and all things trading",
  },
  mushroom: {
    id: "mushroom",
    name: "Lending & Staking",
    topping: "Mushroom",
    toppingEmoji: "🍄",
    color: "#7C3AED",
    colorRgb: "124, 58, 237",
    description: "Lending, staking, yield farming",
  },
  pineapple: {
    id: "pineapple",
    name: "Meme & Launch",
    topping: "Pineapple",
    toppingEmoji: "🍍",
    color: "#D4A017",
    colorRgb: "212, 160, 23",
    description: "Meme coins and token launches",
  },
  olive: {
    id: "olive",
    name: "Infrastructure",
    topping: "Olive",
    toppingEmoji: "🫒",
    color: "#0891B2",
    colorRgb: "8, 145, 178",
    description: "Oracles, bridges, and infra",
  },
  anchovy: {
    id: "anchovy",
    name: "Gaming & Social",
    topping: "Anchovy",
    toppingEmoji: "🐟",
    color: "#EA580C",
    colorRgb: "234, 88, 12",
    description: "Games, social, AI, and NFTs",
  },
};

export const ZONE_LIST: Zone[] = Object.values(ZONES);
export const ZONE_IDS: ZoneId[] = Object.keys(ZONES) as ZoneId[];
