-- ============================================================================
-- 04_admin_user.sql
-- Usuario administrador inicial (password predeterminado: admin123!)
-- Hash generado con bcrypt ($2b$12$)
-- ============================================================================

INSERT INTO admin_users (email, password_hash, name)
VALUES (
    'admin@losarrayanes.com',
    '$2b$12$eEqYOm/NdTiyG8HlXoh.QO3UUQjT0zsJsBvv/B34FFN4PcYKkkXhe',
    'Admin Los Arrayanes'
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name;
