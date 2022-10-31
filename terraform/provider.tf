locals {
  default_tags = {
    TerraformConfigurationURL = "https://github.com/wellcomecollection/wellcomelibrary.org/tree/main/terraform"
    Department                = "Digital Platform"
    Division                  = "Wellcome Collection"
    Use                       = "wellcomelibrary.org redirects"
  }
}

provider "aws" {
  region = "eu-west-1"

  assume_role {
    role_arn = "arn:aws:iam::760097843905:role/platform-developer"
  }

  default_tags {
    tags = local.default_tags
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  assume_role {
    role_arn = "arn:aws:iam::760097843905:role/platform-developer"
  }

  default_tags {
    tags = local.default_tags
  }
}

provider "aws" {
  region = "eu-west-1"
  alias  = "dns"

  assume_role {
    role_arn = "arn:aws:iam::267269328833:role/wellcomecollection-assume_role_hosted_zone_update"
  }

  default_tags {
    tags = local.default_tags
  }
}
