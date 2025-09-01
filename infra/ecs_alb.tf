########################
# Security Groups
########################

# SG ALB (HTTP/HTTPS)
resource "aws_security_group" "alb" {
  name   = "${local.name}-alb-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

# SG ECS
resource "aws_security_group" "ecs" {
  name   = "${local.name}-ecs-sg"
  vpc_id = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

# ALB -> ECS :container_port
resource "aws_security_group_rule" "ecs_from_alb" {
  type                     = "ingress"
  security_group_id        = aws_security_group.ecs.id
  protocol                 = "tcp"
  from_port                = var.container_port
  to_port                  = var.container_port
  source_security_group_id = aws_security_group.alb.id
}

# ECS -> RDS :5432
resource "aws_security_group_rule" "rds_from_ecs" {
  type                     = "ingress"
  security_group_id        = aws_security_group.rds.id
  protocol                 = "tcp"
  from_port                = 5432
  to_port                  = 5432
  source_security_group_id = aws_security_group.ecs.id
}

########################
# ALB
########################
resource "aws_lb" "app" {
  name               = local.name
  load_balancer_type = "application"
  subnets            = module.vpc.public_subnets
  security_groups    = [aws_security_group.alb.id]
  tags               = local.tags
}

resource "aws_lb_target_group" "app" {
  name_prefix = "nest-"

  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    matcher             = "200-399"
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = local.tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

########################
# ECS
########################
resource "aws_ecs_cluster" "app" {
  name = local.name
  tags = local.tags
}

resource "aws_cloudwatch_log_group" "logs" {
  name              = "/ecs/${local.name}"
  retention_in_days = 14
  tags              = local.tags
}

# Si enable_nat_gateway = false, ejecutaremos la task en SUBRED PUBLICA con IP pública
# para que pueda hablar con Internet (ECR/Logs/Secrets) sin NAT.
# Si enable_nat_gateway = true, podés moverla a privada (ver service más abajo).
locals {
  ecs_subnets       = var.enable_nat_gateway ? module.vpc.private_subnets : module.vpc.public_subnets
  ecs_assign_pub_ip = var.enable_nat_gateway ? false : true
}

resource "aws_ecs_task_definition" "app" {
  family                   = local.name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name         = "app"
      image        = "${aws_ecr_repository.app.repository_url}:latest"
      essential    = true
      portMappings = [{ containerPort = var.container_port, hostPort = var.container_port }]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.logs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
      secrets = [
        { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.db_url.arn }
      ]
      environment = [
        { name = "PORT", value = tostring(var.container_port) }
        # agrega aquí otras variables NO sensibles si hace falta
      ]
    }
  ])

  tags = local.tags
}

# Task one-off de migraciones
resource "aws_ecs_task_definition" "migrate" {
  family                   = "${local.name}-migrate"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "migrate"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true
      # Prisma:
      command = ["npx", "prisma", "migrate", "deploy"]
      # TypeORM (alternativa):
      # command = ["npm","run","typeorm","migration:run"]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.logs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "migrate"
        }
      }
      secrets = [
        { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.db_url.arn }
      ]
    }
  ])

  tags = local.tags
}

resource "aws_ecs_service" "app" {
  name            = local.name
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = local.ecs_subnets
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = local.ecs_assign_pub_ip
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.http]
  tags       = local.tags
}
