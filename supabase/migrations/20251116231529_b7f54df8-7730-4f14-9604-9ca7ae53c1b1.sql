-- Create master admin user
-- First, we need to insert into auth.users (done through signup)
-- Then update their role to MASTER_ADMIN

-- Function to create master admin (call once)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if master admin already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'chrestopherm@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- User exists, update role to MASTER_ADMIN
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'MASTER_ADMIN')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Master admin role updated for existing user';
  ELSE
    RAISE NOTICE 'Master admin user does not exist. Please sign up with email: chrestopherm@gmail.com and password: Chrestopher@77';
  END IF;
END $$;