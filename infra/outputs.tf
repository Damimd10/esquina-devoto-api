output "alb_dns" { value = aws_lb.app.dns_name }
output "cluster_name" { value = aws_ecs_cluster.app.name }
output "service_name" { value = aws_ecs_service.app.name }
output "ecr_url" { value = aws_ecr_repository.app.repository_url }
output "db_endpoint" { value = aws_db_instance.pg.address }
output "region" { value = var.aws_region }