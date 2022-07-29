variable "prod_domain_name" {
  type = string
}

variable "stage_domain_name" {
  type = string
}

variable "origin_domain_name" {
  type = string
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
