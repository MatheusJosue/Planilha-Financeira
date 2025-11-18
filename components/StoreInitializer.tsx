"use client";

import { useEffect } from "react";
import { useFinanceStore } from "@/store/financeStore";

export function StoreInitializer() {
  const { loadFromSupabase, isLoaded } = useFinanceStore();

  useEffect(() => {
    if (!isLoaded) {
      loadFromSupabase();
    }
  }, [isLoaded, loadFromSupabase]);

  return null;
}
