locals {
  cname_records = {
   "www.wellcomelibrary.org" = "wellcomelibrary.org"

   "stage.wellcomelibrary.org"     = module.wellcomelibrary-stage.distro_domain_name
   "www.stage.wellcomelibrary.org" = module.wellcomelibrary-stage.distro_domain_name

   "deposit.wellcomelibrary.org" = "wt-hamilton.wellcome.ac.uk."
  }

  a_records = {
    "encore.wellcomelibrary.org"           = "35.176.25.168"
    "libsys.wellcomelibrary.org"           = "195.143.129.134"
    "localhost.wellcomelibrary.org"        = "127.0.0.1"
    "origin.wellcomelibrary.org"           = "195.143.129.236"
    "print.wellcomelibrary.org"            = "195.143.129.141"
    "support.wellcomelibrary.org"          = "54.75.184.123"
    "support02.wellcomelibrary.org"        = "34.251.227.203"
    "wt-lon-sierrasso.wellcomelibrary.org" = "195.143.129.211"
  }
}

resource "aws_route53_record" "prod-internal" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "wellcomelibrary.org"
  type    = "A"
  records = ["195.143.129.236"]
  ttl     = "60"

  weighted_routing_policy {
    weight = 0
  }

  set_identifier = "internal"

  provider = aws.dns
}

resource "aws_route53_record" "prod-cloudfront" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "wellcomelibrary.org"
  type    = "A"

  weighted_routing_policy {
    weight = 50
  }

  alias {
    name                   = module.wellcomelibrary-prod.distro_domain_name
    evaluate_target_health = false
    // This is a fixed value for CloudFront distributions, see:
    // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-route53-aliastarget.html
    zone_id = "Z2FDTNDATAQYW2"
  }

  set_identifier = "cloudfront"

  provider = aws.dns
}

resource "aws_route53_record" "alpha" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "alpha.wellcomelibrary.org"
  type    = "A"

  alias {
    name                   = "s3-website-eu-west-1.amazonaws.com"
    evaluate_target_health = true

    # This is a fixed value for S3 websites, see
    # https://docs.aws.amazon.com/general/latest/gr/s3.html#s3_website_region_endpoints
    zone_id = "Z1BKCTXD74EZPE"
  }

  provider = aws.dns
}

resource "aws_route53_record" "cname" {
  for_each = local.cname_records

  zone_id = data.aws_route53_zone.zone.id
  name    = each.key
  type    = "CNAME"
  records = [each.value]
  ttl     = 60

  provider = aws.dns
}

resource "aws_route53_record" "a" {
  for_each = local.a_records

  zone_id = data.aws_route53_zone.zone.id
  name    = each.key
  type    = "A"
  records = [each.value]
  ttl     = 60

  provider = aws.dns
}
