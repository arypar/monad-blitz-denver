import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "./config.js";
import type { ZoneId } from "./types.js";

const ZONE_TO_ENUM: Record<ZoneId, number> = {
  pepperoni: 0,
  mushroom: 1,
  pineapple: 2,
  olive: 3,
  anchovy: 4,
};

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  testnet: true,
});

const cheeznadAbi = [
  {
    name: "distribute",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "_winningZone",
        internalType: "enum Cheeznad.Zone",
        type: "uint8",
      },
    ],
    outputs: [],
  },
  {
    name: "resetRound",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "getZoneTotal",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_zone", type: "uint8" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function getClients() {
  const key = config.oraclePrivateKey;
  if (!key) {
    throw new Error("[distributor] ORACLE_PRIVATE_KEY is not set");
  }

  const account = privateKeyToAccount(key as `0x${string}`);

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(),
  });

  return { publicClient, walletClient, account };
}

export async function distributeWinnings(winner: ZoneId): Promise<void> {
  const zoneEnum = ZONE_TO_ENUM[winner];
  console.log(
    `[distributor] distributing for winner: ${winner} (enum=${zoneEnum})`
  );

  const { publicClient, walletClient } = getClients();
  const contractAddress = config.contractAddress;

  async function hasDeposits(): Promise<boolean> {
    for (let i = 0; i < 5; i++) {
      const total = await publicClient.readContract({
        address: contractAddress,
        abi: cheeznadAbi,
        functionName: "getZoneTotal",
        args: [i],
      });
      if ((total as bigint) > BigInt(0)) return true;
    }
    return false;
  }

  const deposits = await hasDeposits();

  if (!deposits) {
    console.log(
      `[distributor] no deposits in any zone — calling resetRound() to start fresh`
    );

    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: cheeznadAbi,
      functionName: "resetRound",
    });

    console.log(`[distributor] resetRound tx sent: ${txHash}`);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    console.log(
      `[distributor] resetRound confirmed in block ${receipt.blockNumber} (status: ${receipt.status})`
    );

    return;
  }

  console.log(
    `[distributor] calling distribute(${zoneEnum}) for ${winner}`
  );

  const txHash = await walletClient.writeContract({
    address: contractAddress,
    abi: cheeznadAbi,
    functionName: "distribute",
    args: [zoneEnum],
  });

  console.log(`[distributor] distribute tx sent: ${txHash}`);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  console.log(
    `[distributor] distribute confirmed in block ${receipt.blockNumber} (status: ${receipt.status})`
  );
}
