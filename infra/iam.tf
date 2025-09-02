# ---- Assume role policy (igual que ya tenías) ----
data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# ---- Execution role de ECS (igual) ----
resource "aws_iam_role" "ecs_task_execution" {
  name               = "${local.name}-task-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
  tags               = local.tags
}

# ---- Managed policy básica para pull de ECR y logs (igual) ----
resource "aws_iam_role_policy_attachment" "ecs_exec_attach" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ---- NUEVO: Policy para leer el secret DATABASE_URL ----
data "aws_iam_policy_document" "ecs_exec_read_db_secret" {
  statement {
    sid    = "ReadDbUrlSecret"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    # Importante: incluimos el ARN del secret y con wildcard para cubrir versiones/sufijos
    resources = [
      aws_secretsmanager_secret.db_url.arn,
      "${aws_secretsmanager_secret.db_url.arn}*"
    ]
  }

  # (Opcional) Si cifrás el secret con una KMS key propia, descomenta y ajusta:
  # statement {
  #   sid     = "DecryptKmsIfCustomerManaged"
  #   effect  = "Allow"
  #   actions = ["kms:Decrypt", "kms:DescribeKey"]
  #   resources = [aws_kms_key.secrets.arn]  # o var.kms_key_arn
  # }
}

resource "aws_iam_policy" "ecs_exec_read_db_secret" {
  name   = "${local.name}-exec-read-db-secret"
  policy = data.aws_iam_policy_document.ecs_exec_read_db_secret.json
}

resource "aws_iam_role_policy_attachment" "ecs_exec_read_db_secret_attach" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = aws_iam_policy.ecs_exec_read_db_secret.arn
}

data "aws_iam_policy_document" "ecs_exec_read_supabase_secrets" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [
      aws_secretsmanager_secret.supabase_url.arn,
      "${aws_secretsmanager_secret.supabase_url.arn}*",
      aws_secretsmanager_secret.supabase_service_role.arn,
      "${aws_secretsmanager_secret.supabase_service_role.arn}*",
      aws_secretsmanager_secret.supabase_jwt_secret.arn,
      "${aws_secretsmanager_secret.supabase_jwt_secret.arn}*",
    ]
  }
}

resource "aws_iam_policy" "ecs_exec_read_supabase_secrets" {
  name   = "${local.name}-exec-read-supabase"
  policy = data.aws_iam_policy_document.ecs_exec_read_supabase_secrets.json
}

resource "aws_iam_role_policy_attachment" "ecs_exec_read_supabase_secrets_attach" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = aws_iam_policy.ecs_exec_read_supabase_secrets.arn
}
