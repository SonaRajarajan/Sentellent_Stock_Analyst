resource "aws_db_subnet_group" "rds" {
  name       = "${var.app_name}-rds-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.app_name}-rds-sg"
  description = "Security group for PostgreSQL RDS pgvector DB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = "${var.app_name}-pgvector"
  allocated_storage      = 20
  max_allocated_storage  = 50
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t4g.micro"
  db_name                = "stock_analyst_db"
  username               = "postgres"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  publicly_accessible    = false
}
