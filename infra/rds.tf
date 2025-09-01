# SG de RDS (recibirá solo desde ECS)
resource "aws_security_group" "rds" {
  name        = "${local.name}-rds-sg"
  description = "RDS SG"
  vpc_id      = module.vpc.vpc_id
  tags        = local.tags
}

resource "aws_db_subnet_group" "pg" {
  name       = "${local.name}-pg-subnets"
  subnet_ids = module.vpc.private_subnets
  tags       = local.tags
}

resource "aws_db_instance" "pg" {
  identifier     = "${local.name}-pg"
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage_gb
  storage_type      = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.pg.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  publicly_accessible     = false
  backup_retention_period = 7
  deletion_protection     = false
  skip_final_snapshot     = true

  tags = local.tags
}
