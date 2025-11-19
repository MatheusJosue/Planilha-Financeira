-- Add max_percentage and max_value columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS max_percentage INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_value DECIMAL(10,2) DEFAULT NULL;

-- Add comment to columns
COMMENT ON COLUMN categories.max_percentage IS 'Maximum percentage of total expenses this category can represent';
COMMENT ON COLUMN categories.max_value IS 'Maximum absolute value for this category in a month';
