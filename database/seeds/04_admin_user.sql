-- ============================================================================
-- 04_admin_user.sql
-- Usuario administrador inicial (password predeterminado: admin123!)
-- Hash generado con bcrypt ($2b$12$)
-- ============================================================================

INSERT INTO admin_users (email, password_hash, name)
VALUES (
    'admin@losarrayanes.com',
    '$2b$12$jtrkrw0UxyvIfelRzR1ww.31bG0pCQo3jzZuBu/MTF6AariFjUcfK',
    'Admin Los Arrayanes'
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name;
