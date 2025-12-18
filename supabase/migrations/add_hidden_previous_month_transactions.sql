-- Create table to store hidden previous month transaction IDs
CREATE TABLE IF NOT EXISTS hidden_previous_month_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL,
    hidden_for_month TEXT NOT NULL, -- The month for which this transaction was hidden (e.g., "2024-12")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, transaction_id, hidden_for_month)
);

-- Add RLS policies
ALTER TABLE hidden_previous_month_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own hidden transactions
CREATE POLICY "Users can view their own hidden transactions"
    ON hidden_previous_month_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own hidden transactions
CREATE POLICY "Users can insert their own hidden transactions"
    ON hidden_previous_month_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own hidden transactions
CREATE POLICY "Users can delete their own hidden transactions"
    ON hidden_previous_month_transactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_hidden_previous_month_transactions_user_month
    ON hidden_previous_month_transactions(user_id, hidden_for_month);
