// Encore links (search.wellcomelibrary.org)

locals {
  # This is the IP address of Encore before we started redirecting it.
  # Although Encore will eventually be decommissioned and this IP address
  # will stop working, it's kept here for easy rollback if necessary.
  encore_ip_address = "35.176.25.168"
}

module "wellcomelibrary_search_redirects" {
  source = "./modules/cloudfront_redirects"

  prod_domain_name   = "search.wellcomelibrary.org"
  stage_domain_name  = "search.stage.wellcomelibrary.org"
  origin_domain_name = "search.origin.wellcomelibrary.org"

  prod_redirect_function_arn  = local.wellcome_library_encore_redirect_arn_prod
  stage_redirect_function_arn = local.wellcome_library_encore_redirect_arn_stage

  acm_certificate_arn = module.cert-stage.arn
  route53_zone_id     = data.aws_route53_zone.zone.id

  providers = {
    aws.dns = aws.dns
  }
}

resource "aws_route53_record" "encore-origin" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "search.origin.wellcomelibrary.org"
  type    = "CNAME"
  records = [module.wellcomelibrary_search_redirects.prod_distro_domain_name]
  ttl     = "60"

  provider = aws.dns
}
