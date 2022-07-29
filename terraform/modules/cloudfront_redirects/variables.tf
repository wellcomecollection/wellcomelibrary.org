variable "prod_domain_name" {
  type    = string
  default = ""
}

variable "stage_domain_name" {
  type    = string
  default = ""
}

variable "prod_domain_names" {
  type    = list(string)
  default = []
}

variable "stage_domain_names" {
  type    = list(string)
  default = []
}

variable "origin_domain_name" {
  type    = string
  default = "origin.wellcomelibrary.org"
}

variable "prod_redirect_function_arn" {
  type = string
}

variable "stage_redirect_function_arn" {
  type = string
}

variable "acm_certificate_arn" {
  type = string
}

variable "route53_zone_id" {
  type = string
}
