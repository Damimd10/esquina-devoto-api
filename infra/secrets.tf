# DATABASE_URL para la app
resource "aws_secretsmanager_secret" "db_url" {
  name = "${local.name}/DATABASE_URL"
  tags = local.tags
}

resource "aws_secretsmanager_secret_version" "db_url_v" {
  secret_id     = aws_secretsmanager_secret.db_url.id
  secret_string = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.pg.address}:5432/${var.db_name}?sslmode=require"
}