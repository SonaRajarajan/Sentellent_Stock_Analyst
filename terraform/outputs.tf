output "alb_dns_name" {
  value       = aws_lb.alb.dns_name
  description = "Public Load Balancer URL for Sentellent Equity Analyst App"
}

output "rds_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "AWS RDS PostgreSQL pgvector DB Endpoint"
}

output "ecr_backend_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "Backend ECR Repository URL"
}

output "ecr_frontend_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "Frontend ECR Repository URL"
}
