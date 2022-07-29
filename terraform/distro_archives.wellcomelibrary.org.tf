// DServe links (archives.wellcomelibrary.org)

module "wellcomelibrary_dserve_redirects" {
  source = "./modules/cloudfront_redirects"

  prod_domain_name   = "archives.wellcomelibrary.org"
  stage_domain_name  = "archives.stage.wellcomelibrary.org"
  origin_domain_name = "archives.origin.wellcomelibrary.org"

  prod_redirect_function_arn  = local.wellcome_library_archive_redirect_arn_prod
  stage_redirect_function_arn = local.wellcome_library_archive_redirect_arn_stage

  acm_certificate_arn = module.cert-stage.arn
  route53_zone_id     = data.aws_route53_zone.zone.id

  providers = {
    aws.dns = aws.dns
  }
}

resource "aws_route53_record" "dserve-origin" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "archives.origin.wellcomelibrary.org"
  type    = "CNAME"

  records = ["archives.wellcome.ac.uk."]
  ttl     = "60"

  provider = aws.dns
}
