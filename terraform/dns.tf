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

locals {
  cname_records = {
   "www.wellcomelibrary.org" = "wellcomelibrary.org"
  }
}

moved {
  from = aws_route53_record.www
  to   = aws_route53_record.cname["www.wellcomelibrary.org"]
}

resource "aws_route53_record" "cname" {
  for_each = local.cname_records

  zone_id = data.aws_route53_zone.zone.id
  name    = each.key
  type    = "CNAME"
  records = [each.value]
  ttl     = "60"

  provider = aws.dns
}

resource "aws_route53_record" "origin" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "origin.wellcomelibrary.org"
  type    = "A"
  records = ["195.143.129.236"]
  ttl     = "300"

  provider = aws.dns
}

resource "aws_route53_record" "stage" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "stage.wellcomelibrary.org"
  type    = "CNAME"
  records = [module.wellcomelibrary-stage.distro_domain_name]
  ttl     = "300"

  provider = aws.dns
}

resource "aws_route53_record" "stage-www" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "www.stage.wellcomelibrary.org"
  type    = "CNAME"
  records = [module.wellcomelibrary-stage.distro_domain_name]
  ttl     = "60"

  provider = aws.dns
}