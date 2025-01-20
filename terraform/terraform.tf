terraform {
  required_version = ">= 0.9"

  backend "s3" {
    assume_role = {
      role_arn = "arn:aws:iam::760097843905:role/platform-developer"
    }

    bucket         = "wellcomecollection-platform-infra"
    key            = "terraform/wellcomelibrary.org.tfstate"
    dynamodb_table = "terraform-locktable"
    region         = "eu-west-1"
  }
}

data "terraform_remote_state" "cloudfront_core" {
  backend = "s3"

  config = {
    assume_role = {
      role_arn = "arn:aws:iam::760097843905:role/platform-read_only"
    }
    bucket = "wellcomecollection-platform-infra"
    key    = "terraform/platform-infrastructure/cloudfront/core.tfstate"
    region = "eu-west-1"
  }
}