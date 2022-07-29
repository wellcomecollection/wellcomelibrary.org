// OPAC links (catalogue.wellcomelibrary.org)

locals {
  # This is the IP address of OPAC before we started redirecting it.
  # Although OPAC will eventually be decommissioned and this IP address
  # will stop working, it's kept here for easy rollback if necessary.
  opac_ip_address = "195.143.129.134"
}

module "wellcomelibrary_catalogue_redirects" {
  source = "./modules/cloudfront_redirects"

  # This isn't enabled yet; see
  # https://github.com/wellcomecollection/platform/issues/5580
  disable_prod_redirect = true

  prod_domain_name   = "catalogue.wellcomelibrary.org"
  stage_domain_name  = "catalogue.stage.wellcomelibrary.org"
  origin_domain_name = "catalogue.origin.wellcomelibrary.org"

  prod_redirect_function_arn  = local.wellcome_library_catalogue_redirect_arn_prod
  stage_redirect_function_arn = local.wellcome_library_catalogue_redirect_arn_stage

  acm_certificate_arn = module.cert-stage.arn
  route53_zone_id     = data.aws_route53_zone.zone.id

  providers = {
    aws.dns = aws.dns
  }
}

# This will have to be removed when we enable redirects in prod, or the
# DNS record for the redirect will conflict with this one.
resource "aws_route53_record" "opac-prod" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "catalogue.wellcomelibrary.org"
  type    = "A"

  records = [local.opac_ip_address]
  ttl     = "300"

  provider = aws.dns
}

resource "aws_route53_record" "opac-origin" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "catalogue.origin.wellcomelibrary.org"
  type    = "A"

  records = [local.opac_ip_address]
  ttl     = "60"

  provider = aws.dns
}
