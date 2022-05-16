// Encore links (search.wellcomelibrary.org)

locals {
  # This is the IP address of Encore before we started redirecting it.
  # Although Encore will eventually be decommissioned and this IP address
  # will stop working, it's kept here for easy rollback if necessary.
  encore_ip_address = "35.176.25.168"
}

module "wellcomelibrary_encore-prod" {
  source = "./modules/cloudfront_distro"

  distro_alternative_names = [
    "search.wellcomelibrary.org"
  ]
  acm_certificate_arn = module.cert-prod.arn

  origins = [{
    origin_id : "origin"
    domain_name : "search.origin.wellcomelibrary.org"
    origin_path : null
    origin_protocol_policy : "match-viewer"
  }]

  default_target_origin_id                       = "origin"
  default_lambda_function_association_event_type = "origin-request"
  default_lambda_function_association_lambda_arn = local.wellcome_library_encore_redirect_arn_stage
  default_forwarded_headers                      = ["Host"]
}

module "wellcomelibrary_encore-stage" {
  source = "./modules/cloudfront_distro"

  distro_alternative_names = [
    "search.stage.wellcomelibrary.org"
  ]
  acm_certificate_arn = module.cert-stage.arn

  origins = [{
    origin_id : "origin"
    domain_name : "search.origin.wellcomelibrary.org"
    origin_path : null
    origin_protocol_policy : "http-only"
  }]

  default_target_origin_id                       = "origin"
  default_lambda_function_association_event_type = "origin-request"
  default_lambda_function_association_lambda_arn = local.wellcome_library_encore_redirect_arn_stage
  default_forwarded_headers                      = ["Host"]
}

resource "aws_route53_record" "encore-prod" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "search.wellcomelibrary.org"
  type    = "CNAME"
  records = [module.wellcomelibrary_encore-prod.distro_domain_name]
  ttl     = "300"

  provider = aws.dns
}

resource "aws_route53_record" "encore-origin" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "search.origin.wellcomelibrary.org"
  type    = "CNAME"
  records = [module.wellcomelibrary_encore-prod.distro_domain_name]
  ttl     = "60"

  provider = aws.dns
}

resource "aws_route53_record" "encore-stage" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "search.stage.wellcomelibrary.org"
  type    = "CNAME"
  records = [module.wellcomelibrary_encore-stage.distro_domain_name]
  ttl     = "60"

  provider = aws.dns
}