locals {
  name = "${var.project}-${var.env}"
  tags = {
    Project = var.project
    Env     = var.env
    Owner   = "infra-terraform"
  }

  # usamos 2 AZs
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}
