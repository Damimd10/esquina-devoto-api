variable "aws_region" { default = "sa-east-1" } # Brasil (São Paulo)
variable "project" { default = "nest-api" }
variable "env" { default = "prod" }

# Costo: por defecto SIN NAT (tareas en subred pública, SGs estrictos).
variable "enable_nat_gateway" {
  type    = bool
  default = false
}

# App (ECS)
variable "cpu" { default = 512 }     # 0.5 vCPU
variable "memory" { default = 1024 } # 1 GB
variable "container_port" { default = 3000 }

# Base de datos
variable "db_engine_version" { default = "15" } # Postgres
variable "db_instance_class" { default = "db.t4g.micro" }
variable "db_name" { default = "appdb" }
variable "db_username" {}
variable "db_password" { sensitive = true }
variable "db_allocated_storage_gb" { default = 20 }

# (Opcional) dominio propio, para HTTPS con ACM/Route53 más tarde
variable "domain_name" { default = "" }
variable "hosted_zone_id" { default = "" }
