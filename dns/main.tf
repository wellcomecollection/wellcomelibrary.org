# Third-party services
resource "aws_route53_record" "docs" {
  zone_id = data.aws_route53_zone.weco_zone.id
  name    = "docs.wellcomecollection.org"
  type    = "CNAME"
  records = ["hosting.gitbook.com"]
  ttl     = "300"

  provider = aws.dns
}

resource "aws_route53_record" "rank" {
  zone_id = data.aws_route53_zone.weco_zone.id
  name    = "rank.wellcomecollection.org"
  type    = "CNAME"
  records = ["cname.vercel-dns.com"]
  ttl     = "300"

  provider = aws.dns
}

# See https://help.shopify.com/en/manual/online-store/os/domains/add-a-domain/using-existing-domains/connecting-domains#set-up-your-existing-domain-to-connect-to-shopify

resource "aws_route53_record" "shop" {
  zone_id = data.aws_route53_zone.weco_zone.id
  name    = "shop.${data.aws_route53_zone.weco_zone.name}"
  type    = "CNAME"
  ttl     = "300"
  records = ["shops.myshopify.com"]

  provider = aws.dns
}

# Redirects
module "www" {
  source  = "./modules/redirect"
  from    = "www.wellcomecollection.org"
  to      = "wellcomecollection.org"
  zone_id = data.aws_route53_zone.weco_zone.id

  providers = {
    aws.dns = aws.dns
  }
}

# Delegates access to the identity account hosted zone
# See: https://github.com/wellcomecollection/identity

resource "aws_route53_zone" "account" {
  name = "account.${data.aws_route53_zone.weco_zone.name}"
}

resource "aws_route53_record" "account-ns" {
  zone_id = data.aws_route53_zone.weco_zone.id
  name    = "account.${data.aws_route53_zone.weco_zone.name}"
  type    = "NS"
  ttl     = "300"
  records = local.account_zone_name_servers

  provider = aws.dns
}

resource "aws_route53_record" "identity-ses-txt" {
  zone_id = data.aws_route53_zone.weco_zone.id
  name    = "_amazonses.${data.aws_route53_zone.weco_zone.name}"
  type    = "TXT"
  ttl     = "300"
  records = local.identity_ses_txt_records

  provider = aws.dns
}

resource "aws_route53_record" "identity-ses-dkim-cname" {
  for_each = local.identity_ses_dkim_records

  zone_id = data.aws_route53_zone.weco_zone.id
  name    = "${each.value}._domainkey.${data.aws_route53_zone.weco_zone.name}"
  type    = "CNAME"
  ttl     = "300"
  records = ["${each.value}.dkim.amazonses.com"]

  provider = aws.dns
}

module "stage_wellcomelibrary_org" {
  source = "./modules/dns_record"
  domain_name = "stage.wellcomelibrary.org"
  zone_id = data.aws_route53_zone.wellcomelibrary.id
  providers = {
    aws = aws.dns
  }
}