-- Add selected_income_id column to recurring_transactions table
ALTER TABLE recurring_transactions
ADD COLUMN IF NOT EXISTS selected_income_id TEXT DEFAULT NULL;

-- Add comment to column
COMMENT ON COLUMN recurring_transactions.selected_income_id IS 'ID of the specific income transaction to use for variable_by_income calculation';
