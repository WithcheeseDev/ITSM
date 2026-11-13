terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

variable "bedrock_region" {
  type    = string
  default = "ap-southeast-1" # Lambda Function URL and Bedrock are not offered in ap-southeast-7, so the AI API runs in Singapore
}

variable "ai_model" {
  type    = string
  default = "apac.amazon.nova-pro-v1:0" # Claude models are blocked for this (channel program) account
}

variable "region" {
  type    = string
  default = "ap-southeast-7" # Thailand: S3 is available here; CloudFront is global
}

variable "prefix" {
  type    = string
  default = "itsm"
}

variable "env" {
  type    = string
  default = "dev"
}

provider "aws" {
  region = var.region
  default_tags {
    tags = { Project = var.prefix, Environment = var.env, ManagedBy = "terraform" }
  }
}

provider "aws" {
  alias  = "sg"
  region = var.bedrock_region
  default_tags {
    tags = { Project = var.prefix, Environment = var.env, ManagedBy = "terraform" }
  }
}

data "aws_caller_identity" "me" {}

locals {
  name = "${var.prefix}-${var.env}"
}

# Private bucket for the Vite build (dist/); only CloudFront can read it (OAC)
resource "aws_s3_bucket" "spa" {
  bucket        = "${local.name}-spa-${data.aws_caller_identity.me.account_id}"
  force_destroy = true # dev only: lets `terraform destroy` remove a non-empty bucket
}

resource "aws_s3_bucket_public_access_block" "spa" {
  bucket                  = aws_s3_bucket.spa.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "spa" {
  bucket = aws_s3_bucket.spa.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_cloudfront_origin_access_control" "spa" {
  name                              = "${local.name}-spa-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_cloudfront_cache_policy" "disabled" { name = "Managed-CachingDisabled" }
data "aws_cloudfront_cache_policy" "optimized" { name = "Managed-CachingOptimized" }

resource "aws_cloudfront_distribution" "spa" {
  enabled             = true
  comment             = "${local.name} SPA"
  default_root_object = "index.html"
  price_class         = "PriceClass_200" # includes Asia

  origin {
    domain_name              = aws_s3_bucket.spa.bucket_regional_domain_name
    origin_id                = "spa"
    origin_access_control_id = aws_cloudfront_origin_access_control.spa.id
  }

  default_cache_behavior {
    target_origin_id       = "spa"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
  }

  origin {
    domain_name = trimsuffix(trimprefix(aws_lambda_function_url.ai.function_url, "https://"), "/")
    origin_id   = "ai"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 60
    }
    custom_header {
      name  = "x-origin-secret"
      value = random_password.origin.result
    }
  }

  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "ai"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.disabled.id
  }

  # React Router: unknown paths fall back to index.html
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

data "aws_iam_policy_document" "spa" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.spa.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.spa.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "spa" {
  bucket     = aws_s3_bucket.spa.id
  policy     = data.aws_iam_policy_document.spa.json
  depends_on = [aws_s3_bucket_public_access_block.spa]
}

output "bucket" { value = aws_s3_bucket.spa.bucket }
output "distribution_id" { value = aws_cloudfront_distribution.spa.id }
output "url" { value = "https://${aws_cloudfront_distribution.spa.domain_name}" }

# ---- AI Assist: Lambda (Function URL, only reachable with the CloudFront secret header) -> Bedrock ----

resource "random_password" "origin" {
  length  = 40
  special = false
}

data "archive_file" "ai" {
  type        = "zip"
  source_dir  = "${path.module}/../../build/lambda" # npm run build:lambda
  output_path = "${path.module}/.terraform/ai.zip"
}

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ai" {
  name               = "${local.name}-ai-assist"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

resource "aws_iam_role_policy_attachment" "ai_logs" {
  role       = aws_iam_role.ai.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "ai_bedrock" {
  name = "bedrock-invoke"
  role = aws_iam_role.ai.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]
      Resource = "*" # inference profiles fan out to several regions; dev only
    }]
  })
}

resource "aws_cloudwatch_log_group" "ai" {
  provider = aws.sg
  name              = "/aws/lambda/${local.name}-ai-assist"
  retention_in_days = 14
}

resource "aws_lambda_function" "ai" {
  provider = aws.sg
  function_name    = "${local.name}-ai-assist"
  role             = aws_iam_role.ai.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  filename         = data.archive_file.ai.output_path
  source_code_hash = data.archive_file.ai.output_base64sha256
  memory_size      = 512
  timeout          = 30
  environment {
    variables = {
      AI_PROVIDER    = "bedrock"
      AI_MODEL       = var.ai_model
      BEDROCK_REGION = var.bedrock_region
      ORIGIN_SECRET  = random_password.origin.result
    }
  }
  depends_on = [aws_cloudwatch_log_group.ai, aws_iam_role_policy_attachment.ai_logs]
}

resource "aws_lambda_function_url" "ai" {
  provider = aws.sg
  function_name      = aws_lambda_function.ai.function_name
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "url" {
  provider = aws.sg
  statement_id           = "AllowFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.ai.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "url_invoke" {
  provider = aws.sg
  statement_id             = "AllowFunctionUrlInvoke"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.ai.function_name
  principal                = "*"
  invoked_via_function_url = true
}
