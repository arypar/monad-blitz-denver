import { Zone, ZoneId } from "@/types";

export const ZONES: Record<ZoneId, Zone> = {
  kuru: {
    id: "kuru",
    name: "Kuru DEX",
    topping: "Pepperoni",
    toppingEmoji: "🍕",
    color: "#E63946",
    colorRgb: "230, 57, 70",
    description: "The hottest DEX on Monad",
  },
  apriori: {
    id: "apriori",
    name: "Apriori",
    topping: "Jalapeño",
    toppingEmoji: "🌶️",
    color: "#2D9B2D",
    colorRgb: "45, 155, 45",
    description: "Liquid staking, extra spicy",
  },
  nadfun: {
    id: "nadfun",
    name: "NADfun",
    topping: "Pineapple",
    toppingEmoji: "🍍",
    color: "#D4A017",
    colorRgb: "212, 160, 23",
    description: "Meme coins — controversial & delicious",
  },
  curvance: {
    id: "curvance",
    name: "Curvance",
    topping: "Mushroom",
    toppingEmoji: "🍄",
    color: "#7C3AED",
    colorRgb: "124, 58, 237",
    description: "DeFi lending, deep & earthy",
  },
  monorail: {
    id: "monorail",
    name: "Monorail",
    topping: "Olive",
    toppingEmoji: "🫒",
    color: "#0891B2",
    colorRgb: "8, 145, 178",
    description: "Cross-chain bridge, smooth operator",
  },
  apuff: {
    id: "apuff",
    name: "aPuff Finance",
    topping: "Bacon",
    toppingEmoji: "🥓",
    color: "#EA580C",
    colorRgb: "234, 88, 12",
    description: "Yield farming, crispy returns",
  },
};

export const ZONE_LIST: Zone[] = Object.values(ZONES);
export const ZONE_IDS: ZoneId[] = Object.keys(ZONES) as ZoneId[];
