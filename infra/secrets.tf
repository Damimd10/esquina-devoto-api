# DATABASE_URL para la app
resource "aws_secretsmanager_secret" "db_url" {
  name = "${local.name}/DATABASE_URL"
  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "db_url_v" {
  secret_id     = aws_secretsmanager_secret.db_url.id
  secret_string = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.pg.address}:5432/${var.db_name}?sslmode=require"
}

# --- Supabase URL ---
resource "aws_secretsmanager_secret" "supabase_url" {
  name = "${local.name}/SUPABASE_URL"
  tags = local.tags
}

# --- Supabase Service Role Key ---
resource "aws_secretsmanager_secret" "supabase_service_role" {
  name = "${local.name}/SUPABASE_SERVICE_ROLE_KEY"
  tags = local.tags
}

# (Opcional) Supabase JWT secret si tu backend lo necesita
resource "aws_secretsmanager_secret" "supabase_jwt_secret" {
  name = "${local.name}/SUPABASE_JWT_SECRET"
  tags = local.tags
}