module "wellcomelibrary_blog_redirects" {
  source = "./modules/cloudfront_redirects"

  prod_domain_name  = "blog.wellcomelibrary.org"
  stage_domain_name = "blog.stage.wellcomelibrary.org"

  prod_redirect_function_arn  = local.wellcome_library_blog_redirect_arn_prod
  stage_redirect_function_arn = local.wellcome_library_blog_redirect_arn_stage

  acm_certificate_arn = module.cert-stage.arn
  route53_zone_id     = data.aws_route53_zone.zone.id

  providers = {
    aws.dns = aws.dns
  }
}
