"use client";

import React from "react";
import {
  ContractPoolContext,
  useContractPoolFetch,
} from "@/hooks/useContractPool";

export default function ContractPoolProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pool = useContractPoolFetch();
  return (
    <ContractPoolContext.Provider value={pool}>
      {children}
    </ContractPoolContext.Provider>
  );
}
