"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useBalance, useAccount } from "wagmi";
import { formatEther } from "viem";

export default function CheesyNav() {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({
    address,
  });

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
