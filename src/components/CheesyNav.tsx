"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useBalance, useAccount } from "wagmi";
import { formatEther } from "viem";

export default function CheesyNav() {
  const transactions = useGameStore((s) => s.transactions);
  const [tps, setTps] = useState(0);
  const txTimestamps = useRef<number[]>([]);

  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({
    address,
  });

  useEffect(() => {
    if (transactions.length === 0) return;
    const latest = transactions[0];
    if (!latest) return;

    txTimestamps.current.push(Date.now());

    const fiveSecondsAgo = Date.now() - 5000;
    txTimestamps.current = txTimestamps.current.filter((t) => t > fiveSecondsAgo);

    const count = txTimestamps.current.length;
    const estimatedTps = Math.round((count / 5) * 10) / 10;
    setTps(estimatedTps);
  }, [transactions]);

  useEffect(() => {
    const interval = setInterval(() => {
      const fiveSecondsAgo = Date.now() - 5000;
      txTimestamps.current = txTimestamps.current.filter((t) => t > fiveSecondsAgo);
      const count = txTimestamps.current.length;
      const estimatedTps = Math.round((count / 5) * 10) / 10;
      setTps(estimatedTps);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogoClick = () => {
    window.location.reload();
  };

  const formattedBalance = (() => {
    if (!balanceData || !isConnected) return null;
    try {
      const val = Number(formatEther(balanceData.value));
      if (isNaN(val)) return null;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
      return val.toFixed(2);
    } catch {
      return null;
    }
  })();

  return (
    <nav>
      <div className="logo" onClick={handleLogoClick}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/assets/cheeznad.png" 
          alt="Cheeznad" 
          style={{ 
            transform: 'scale(3.8)', 
            transformOrigin: 'center' 
          }} 
        />
      </div>
      <div className="nav-right">
        <div className="tps-pill">
          <span className="tps-pill-dot-wrap">
            <span className={`tps-pill-dot${tps > 0 ? " active" : ""}`} />
          </span>
          <span className="tps-pill-value">{tps > 0 ? tps.toFixed(1) : "—"}</span>
          <span className="tps-pill-label">slices/s</span>
        </div>
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: { opacity: 0, pointerEvents: "none" as const, userSelect: "none" as const },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button className="connect-btn" onClick={openConnectModal}>
                        Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button className="connect-btn" onClick={openChainModal} style={{ background: "#ef4444" }}>
                        Wrong Network
                      </button>
                    );
                  }

                  return (
                    <button className="wallet-btn" onClick={openAccountModal}>
                      <span className="wallet-balance">
                        <span className="wallet-pizza">🍕</span>
                        {formattedBalance ?? "—"}
                      </span>
                      <span className="wallet-address">{account.displayName}</span>
                    </button>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </nav>
  );
}
