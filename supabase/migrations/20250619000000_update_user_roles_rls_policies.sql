-- Drop the old, circular RLS policies and create new, secure policies.
--
-- REASON FOR THIS CHANGE:
-- This migration fixes the final RLS-related bug. The old policies created
-- a circular dependency. These new policies use the `get_my_role()` security
-- definer function (created in the previous migration) to safely check the
-- current user's role without causing an infinite loop.
--
-- The new policies are:
-- 1. "Users can view their own role": A simple policy allowing any
--    authenticated user to read only their own entry from the user_roles table.
-- 2. "Admins can manage all roles": A policy that uses `get_my_role()` to
--    grant full read and write access to the entire table only to users
--    with the 'admin' role.

-- Drop the old, circular RLS policies on the user_roles table.
DROP POLICY IF EXISTS "User roles are viewable by admins only" ON public.user_roles;
DROP POLICY IF EXISTS "User roles are manageable by admins only" ON public.user_roles;

-- Create a new policy that allows users to view their own role.
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a new policy that allows admins to manage all roles.
-- This uses the new get_my_role() function to avoid circular dependencies.
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin'); 