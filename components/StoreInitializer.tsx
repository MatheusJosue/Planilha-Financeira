"use client";

import { useEffect, useRef } from "react";
import { useFinanceStore } from "@/store/financeStore";

export function StoreInitializer() {
  const { loadFromSupabase, isLoaded } = useFinanceStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isLoaded && !hasInitialized.current) {
      hasInitialized.current = true;
      loadFromSupabase();
    }
  }, [isLoaded, loadFromSupabase]);

  return null;
}
