locals {
  prod_distro_alternative_names = var.prod_domain_name == "" ? var.prod_domain_names : [
    var.prod_domain_name
  ]
  stage_distro_alternative_names = var.stage_domain_name == "" ? var.stage_domain_names : [
    var.stage_domain_name
  ]
}

module "cloudfront_prod" {
  source = "../cloudfront_distro"

  distro_alternative_names = local.prod_distro_alternative_names

  acm_certificate_arn = var.acm_certificate_arn

  origins = [
    {
      origin_id              = "origin"
      domain_name            = var.origin_domain_name
      origin_path            = null
      origin_protocol_policy = "match-viewer"
    }
  ]

  default_target_origin_id                       = "origin"
  default_lambda_function_association_event_type = "origin-request"
  default_lambda_function_association_lambda_arn = var.prod_redirect_function_arn
  default_forwarded_headers                      = ["Host", "CloudFront-Forwarded-Proto"]
}

module "cloudfront_stage" {
  source = "../cloudfront_distro"

  distro_alternative_names = local.stage_distro_alternative_names

  acm_certificate_arn = var.acm_certificate_arn

  origins = [
    {
      origin_id              = "origin"
      domain_name            = var.origin_domain_name
      origin_path            = null
      origin_protocol_policy = "match-viewer"
    }
  ]

  default_target_origin_id                       = "origin"
  default_lambda_function_association_event_type = "origin-request"
  default_lambda_function_association_lambda_arn = var.stage_redirect_function_arn
  default_forwarded_headers                      = ["Host", "CloudFront-Forwarded-Proto"]
}

resource "aws_route53_record" "prod" {
  for_each = toset(local.prod_distro_alternative_names)

  zone_id = var.route53_zone_id
  name    = each.key
  type    = "CNAME"

  records = [module.cloudfront_prod.distro_domain_name]
  ttl     = "60"

  provider = aws.dns
}

resource "aws_route53_record" "stage" {
  for_each = toset(local.stage_distro_alternative_names)

  zone_id = var.route53_zone_id
  name    = each.key
  type    = "CNAME"
  records = [module.cloudfront_stage.distro_domain_name]
  ttl     = "60"

  provider = aws.dns
}
