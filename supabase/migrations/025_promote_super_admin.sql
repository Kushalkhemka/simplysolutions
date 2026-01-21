-- Promote khemkakushal1206@gmail.com to super_admin role
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'khemkakushal1206@gmail.com';

-- Verify the update
SELECT id, email, full_name, role 
FROM public.profiles 
WHERE email = 'khemkakushal1206@gmail.com';
