"use client";

import { useEffect } from "react";
import { useFinanceStore } from "@/store/financeStore";

export function StoreInitializer() {
  const { loadFromLocal, isLoaded } = useFinanceStore();

  useEffect(() => {
    if (!isLoaded) {
      loadFromLocal();
    }
  }, [isLoaded, loadFromLocal]);

  return null;
}
