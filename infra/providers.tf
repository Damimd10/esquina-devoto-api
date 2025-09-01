terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.55" }
  }
  # Opcional: backend remoto S3 + DynamoDB
  # backend "s3" {
  #   bucket = "mi-tf-state"
  #   key    = "nest-api/prod/terraform.tfstate"
  #   region = "sa-east-1"
  #   dynamodb_table = "mi-tf-locks"
  # }
}

provider "aws" {
  region  = var.aws_region
  profile = "brasil"
}

data "aws_caller_identity" "current" {}

# obtenemos 2 AZs disponibles automáticamente (no asumimos a/b por si tu cuenta varía)
data "aws_availability_zones" "available" {
  state = "available"
}