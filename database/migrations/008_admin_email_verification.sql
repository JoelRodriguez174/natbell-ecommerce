-- ============================================================================
-- 008_admin_email_verification.sql
-- Columnas de verificación de correo y recuperación de contraseñas de admin
-- ============================================================================

ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reset_password_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN admin_users.is_verified IS 'Indica si el administrador ha verificado su cuenta por email';
COMMENT ON COLUMN admin_users.verification_code IS 'Código OTP temporal de 6 dígitos para verificar el correo';
COMMENT ON COLUMN admin_users.verification_code_expires_at IS 'Fecha y hora de expiración del código de verificación (15 minutos)';
COMMENT ON COLUMN admin_users.reset_password_code IS 'Código OTP temporal para recuperación de contraseña';
COMMENT ON COLUMN admin_users.reset_password_expires_at IS 'Fecha y hora de expiración del código de recuperación';
