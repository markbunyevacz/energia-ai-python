-- Create a security-definer function to check a user's role.
--
-- REASON FOR THIS FUNCTION:
-- The previous RLS policies on the 'user_roles' table created a circular
-- dependency: to read a user's role, the policy needed to check that same
-- user's role. This caused an infinite loop and a 500 error when the
-- application tried to fetch user data after login.
--
-- This function, with `SECURITY DEFINER`, runs with the privileges of the
-- user who created it (the database owner), allowing it to bypass the RLS
-- policies and safely retrieve the current user's role. This breaks the
-- circular dependency and is the standard, secure way to solve this issue.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
DECLARE
  my_role text;
BEGIN
  SELECT role INTO my_role FROM public.user_roles WHERE user_id = auth.uid();
  RETURN my_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 