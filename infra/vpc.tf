module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = local.name
  cidr = "10.0.0.0/16"

  azs = local.azs

  # Subredes:
  # - públicas: ALB + (opcional) tasks ECS públicas si evitamos NAT
  # - privadas: RDS (y ECS si activás NAT + endpoints)
  public_subnets  = ["10.0.10.0/24", "10.0.11.0/24"]
  private_subnets = ["10.0.20.0/24", "10.0.21.0/24"]

  enable_dns_hostnames = true
  enable_dns_support   = true

  # Para mantener costos bajos por defecto:
  enable_nat_gateway     = var.enable_nat_gateway
  single_nat_gateway     = var.enable_nat_gateway
  one_nat_gateway_per_az = false

  tags = local.tags
}
