locals {
  redirect_functions = {
    passthru           = "wellcomeLibraryPassthru"
    archive_redirect   = "wellcomeLibraryArchiveRedirect"
    catalogue_redirect = "wellcomeLibraryCatalogueRedirect"
    blog_redirect      = "wellcomeLibraryBlogRedirect"
    encore_redirect    = "wellcomeLibraryEncoreRedirect"
    redirect           = "wellcomeLibraryRedirect"
  }
}

resource "aws_lambda_function" "redirects" {
  for_each = local.redirect_functions

  provider = aws.us_east_1

  function_name = "cf_edge_wellcome_library_${each.key}"
  role          = aws_iam_role.edge_lambda_role.arn
  runtime       = "nodejs16.x"
  handler       = "${local.redirect_functions[each.key]}.requestHandler"
  publish       = true

  s3_bucket         = data.aws_s3_object.wellcome_library_redirect.bucket
  s3_key            = data.aws_s3_object.wellcome_library_redirect.key
  s3_object_version = data.aws_s3_object.wellcome_library_redirect.version_id
}

data "aws_s3_object" "wellcome_library_redirect" {
  provider = aws.us_east_1

  bucket = local.edge_lambdas_bucket
  key    = "wellcome_library/wellcome_library_redirect.zip"
}

resource "aws_iam_role" "edge_lambda_role" {
  provider = aws.us_east_1

  name_prefix        = "edge_lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda.json
}

resource "aws_iam_role_policy_attachment" "basic_execution_role" {
  role       = aws_iam_role.edge_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"

      identifiers = [
        "edgelambda.amazonaws.com",
        "lambda.amazonaws.com",
      ]
    }
  }
}
