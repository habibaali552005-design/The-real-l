-- Rotate the admin password to an unknown random value so the previously
-- committed plaintext credential is no longer valid. The admin must reset
-- their password via the app's password-recovery flow.
UPDATE auth.users
SET encrypted_password = crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
    updated_at = now()
WHERE email = 'habibaali552005@gmail.com';
