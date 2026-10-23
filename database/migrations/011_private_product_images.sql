-- ============================================================================
-- 011_private_product_images.sql
-- Las fotos de productos dejan de ser públicas: solo el proxy /img del frontend (Vercel)
-- las lee, con la clave anon guardada como variable de servidor (SUPABASE_ANON_KEY, sin NEXT_PUBLIC).
-- Motivo: un scraper (php-requests) bajaba el catálogo entero varias veces por día desde las URLs
-- públicas y consumía el cupo de Cached Egress.
-- ============================================================================

-- 1. Permiso de lectura del bucket "products" para la clave anon (la usa solo el proxy /img).
--    Las subidas y borrados los hace el backend con la service key, que no pasa por RLS.
CREATE POLICY "Proxy /img puede leer fotos de productos"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'products');

-- 2. Hacer privado el bucket. Correr SOLO después de que el proxy /img esté desplegado en Vercel
--    con SUPABASE_ANON_KEY configurada y las fotos se vean bien en la tienda:
-- UPDATE storage.buckets SET public = false WHERE id = 'products';
