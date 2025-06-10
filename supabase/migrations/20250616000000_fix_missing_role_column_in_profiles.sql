-- Add the missing 'role' column back to the 'profiles' table.
--
-- REASON FOR THIS FIX:
-- An investigation revealed that this column, which was defined in an early
-- migration (20240320000001_02_contract_analysis.sql), had been manually
-- deleted from the live database. This created a critical schema mismatch.
--
-- When a new user was created, a trigger attempted to write to this
-- non-existent column, causing the entire transaction to fail with a
-- "column 'role' of relation 'profiles' does not exist" error.
--
-- This migration restores the column to align the live schema with the
-- original intended structure, resolving the user creation bug.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'viewer'; 