-- Step 1: Drop the trigger that was added to assign a default role.
DROP TRIGGER IF EXISTS on_new_user_assign_default_role ON auth.users;

-- Step 2: Drop the function used by the trigger.
DROP FUNCTION IF EXISTS public.assign_default_user_role();

-- Step 3: Drop the foreign key constraint that links user_roles to auth.users.
-- This will temporarily decouple the two tables to allow user creation.
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey; 