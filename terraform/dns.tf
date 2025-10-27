locals {
  # Most of this block is a collection of DNS records that were in-place
  # before the platform team existed, most of which we don't actively manage.
  #
  # Many of these records may be defunct; we captured them in Terraform
  # in August 2022 so we had *a* snapshot of what these DNS records look like.
  #
  # This is for consistency with the DNS records that we do manage, and to
  # give us a bit of a safety net -- if we inadvertently blat a DNS record
  # as part of our changes, we should be able to roll it back.
  #
  # We may be able to remove these records in consultation with LS&S, if
  # we know the records are defunct.

  cname_records = {
    "www.wellcomelibrary.org" = "wellcomelibrary.org"

    "stage.wellcomelibrary.org"     = module.wellcomelibrary-stage.distro_domain_name
    "www.stage.wellcomelibrary.org" = module.wellcomelibrary-stage.distro_domain_name

    "deposit.wellcomelibrary.org" = "wt-hamilton.wellcome.ac.uk."

    "styleguide.wellcomelibrary.org" = "weblb01-1646100330.eu-west-1.elb.amazonaws.com."

    # Sectigo domain name validation records
    # Sent by Flavio V 29 October 2024
    "_7c0ad5539ffa30ea5ec245e2a0bafae8.wellcomelibrary.org" = "d8bee243be7bad3b187120d52975a807.7aad28fde9eebc5586ae99ca8ab05a6c.sectigo.com"
    # Sent by Flavio V 27 October 2025
    "_b454cb8d684ba147d6454f193f817b0c.wellcomelibrary.org" = "7621a5c71a9b6af099911bcfb318030.b0aeba595b8aa0730a2b21b4a8ccac95.sectigo.com"
  }

  a_records = {
    "encore.wellcomelibrary.org"           = "35.176.25.168"
    "localhost.wellcomelibrary.org"        = "127.0.0.1"
    "origin.wellcomelibrary.org"           = "195.143.129.236"
    "support.wellcomelibrary.org"          = "54.75.184.123"
    "support02.wellcomelibrary.org"        = "34.251.227.203"
    "wt-lon-sierrasso.wellcomelibrary.org" = "195.143.129.211"
  }

  mx_records = {
    "wellcomelibrary.org" = "0 wellcome-ac-uk.mail.protection.outlook.com"
  }

  ns_records = [
    "ns-1875.awsdns-42.co.uk.",
    "ns-574.awsdns-07.net.",
    "ns-337.awsdns-42.com.",
    "ns-1041.awsdns-02.org.",
  ]

  soa_records = {
    "wellcomelibrary.org" = "ns-1875.awsdns-42.co.uk. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
  }

  spf_records = [
    "v=spf1 include:spf.protection.outlook.com -all",
    "_globalsign-domain-verification=_oCvlC-4KkZ2udpJVZJtGuh7fNyu3K_ctmFQ4PPTXb",
    "_globalsign-domain-verification=vu-ONisR1AncBASgChXZgIHSOoEQ0VRpwPeTWE13XW",
    "C5Gnoujowp06bvP0R9XFqRxveoG80XT2kEy58fJBkEU=",
    "_globalsign-domain-verification=mAFp_6t1sYlUNXcKKfhI6wI-uF6BRFdqcaX1E-CQLv",
  ]

  txt_records = {
    "@.wellcomelibrary.org" = "y/k5s8yhrhyvygnz1mqeiqrr6y7yfydlkqx0ew26fgmijc2clcfzhahpm3sabpagex5+kosi5ihkczazqx1iba=="

    # This value was sent by Slack from Flavio V on 11 June 2024
    "_pki-validation.wellcomelibrary.org" = "4BC7-9858-1376-FF06-DA6A-241D-9F06-F452"
  }
}

resource "aws_route53_record" "print-wellcomelibrary-org" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "print.wellcomelibrary.org"
  type    = "A"
  alias {
    evaluate_target_health = true
    name                   = "wt-aws-lizard-alb-153923399.eu-west-1.elb.amazonaws.com"
    zone_id                = "Z32O12XQLNTSW2"
  }

  provider = aws.dns
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

resource "aws_route53_record" "txt" {
  for_each = local.txt_records

  zone_id = data.aws_route53_zone.zone.id
  name    = each.key
  type    = "TXT"
  records = [each.value]
  ttl     = 60

  provider = aws.dns
}

resource "aws_route53_record" "soa" {
  for_each = local.soa_records

  zone_id = data.aws_route53_zone.zone.id
  name    = each.key
  type    = "SOA"
  records = [each.value]
  ttl     = 900

  provider = aws.dns
}

resource "aws_route53_record" "mx" {
  for_each = local.mx_records

  zone_id = data.aws_route53_zone.zone.id
  name    = each.key
  type    = "MX"
  records = [each.value]
  ttl     = 300

  provider = aws.dns
}

resource "aws_route53_record" "ns" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "wellcomelibrary.org"
  type    = "NS"
  records = local.ns_records
  ttl     = 172800

  provider = aws.dns
}

resource "aws_route53_record" "spf" {
  zone_id = data.aws_route53_zone.zone.id
  name    = "wellcomelibrary.org"
  type    = "TXT"
  records = local.spf_records
  ttl     = 300

  provider = aws.dns
}
