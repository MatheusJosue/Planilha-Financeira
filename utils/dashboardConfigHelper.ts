import { createClient } from "@/lib/supabase-client";

/**
 * Determines how many months of transaction data should be loaded.
 * Returns 3 if the IncomeVsExpense chart is enabled (current month + 2 previous months).
 * Returns 1 by default for better performance when the chart is disabled (current month only).
 */
export async function getMonthsToLoad(): Promise<number> {
  try {
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      // Not logged in - default to single month for better performance
      return 1;
    }

    const { data: settings } = await supabaseClient
      .from("user_settings")
      .select("dashboard_config")
      .eq("user_id", user.id)
      .single();

    // Load 3 months if incomeVsExpense chart is enabled (default is true)
    // The chart requires historical data to display the comparison
    const incomeVsExpenseEnabled = settings?.dashboard_config?.incomeVsExpense !== false;

    return incomeVsExpenseEnabled ? 3 : 1;
  } catch (error) {
    console.error("Error checking dashboard config:", error);
    // Default to single month on error for better performance
    return 1;
  }
}

/**
 * Legacy function for backward compatibility.
 * @deprecated Use getMonthsToLoad() instead
 */
export async function checkIfShouldLoadMultipleMonths(): Promise<boolean> {
  const months = await getMonthsToLoad();
  return months > 1;
}
