# We publish multiple versions of the Lambda@Edge functions.
# See https://docs.aws.amazon.com/lambda/latest/dg/configuration-versions.html
#
# The staging domains always use the latest version, whereas the prod domains
# use a pinned version.  Update the pinned versions below when you're ready
# to deploy from staging to prod.

locals {
  prod_lambda_function_versions = {
    archive         = "41"
    blog            = "58"
    encore          = "38"
    passthru        = "74"
    wellcomelibrary = "93"
  }
}

output "stage_lambda_function_versions" {
  value = {
    archive         = local.wellcome_library_archive_stage_version
    blog            = local.wellcome_library_blog_stage_version
    encore          = local.wellcome_library_encore_stage_version
    passthru        = local.wellcome_library_passthru_stage_version
    wellcomelibrary = local.wellcome_library_redirect_stage_version
  }
}
