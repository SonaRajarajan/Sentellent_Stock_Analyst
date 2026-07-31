variable "aws_region" {
  type        = string
  default     = "ap-south-1" # AWS Mumbai Region for optimal Indian latency
  description = "AWS deployment region"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment"
}

variable "db_password" {
  type        = string
  default     = "SentellentPgVectorSecret2026!"
  sensitive   = true
  description = "PostgreSQL RDS Password"
}

variable "app_name" {
  type        = string
  default     = "sentellent-stock-analyst"
  description = "Application Base Name"
}
