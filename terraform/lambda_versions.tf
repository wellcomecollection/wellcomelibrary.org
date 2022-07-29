# We publish multiple versions of the Lambda@Edge functions.
# See https://docs.aws.amazon.com/lambda/latest/dg/configuration-versions.html
#
# The staging domains always use the latest version, whereas the prod domains
# use a pinned version.  Update the pinned versions below when you're ready
# to deploy from staging to prod.

locals {
  prod_lambda_function_versions = {
    archive         = "42"
    blog            = "59"
    catalogue       = "1"
    encore          = "39"
    passthru        = "75"
    wellcomelibrary = "94"
  }
}

output "stage_lambda_function_versions" {
  value = {
    archive         = local.wellcome_library_archive_stage_version
    blog            = local.wellcome_library_blog_stage_version
    catalogue       = local.wellcome_library_catalogue_stage_version
    encore          = local.wellcome_library_encore_stage_version
    passthru        = local.wellcome_library_passthru_stage_version
    wellcomelibrary = local.wellcome_library_redirect_stage_version
  }
}
