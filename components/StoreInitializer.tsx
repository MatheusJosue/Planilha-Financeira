"use client";

import { useEffect, useRef } from "react";
import { useFinanceStore } from "@/store/financeStore";
import { getMonthsToLoad } from "@/utils/dashboardConfigHelper";

export function StoreInitializer() {
  const { loadFromSupabase, isLoaded } = useFinanceStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isLoaded && !hasInitialized.current) {
      hasInitialized.current = true;

      // Check how many months to load based on dashboard configuration
      const initializeStore = async () => {
        const monthsToLoad = await getMonthsToLoad();
        await loadFromSupabase(monthsToLoad);
      };

      initializeStore();
    }
  }, [isLoaded, loadFromSupabase]);

  return null;
}
