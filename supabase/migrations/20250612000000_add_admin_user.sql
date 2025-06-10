-- Insert a new user into the auth.users table
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('password', gen_salt('bf')),
    NOW(),
    '',
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    NULL,
    NOW()
);

-- Insert the user into the public.users table (if you have one)
-- If your public user table has a different name, please change it here.
-- This part is commented out because I don't know your exact table structure.
-- If you have a public users table, you can uncomment and adapt this.
/*
WITH new_user AS (
    SELECT id FROM auth.users WHERE email = 'admin@example.com'
)
INSERT INTO public.users (id, email, role)
SELECT id, 'admin@example.com', 'admin' FROM new_user;
*/ 