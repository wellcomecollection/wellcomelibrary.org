# How to deploy a new version of the redirect Lambdas

1.  Package and upload to S3 a ZIP for the Lambda definition

    ```console
    $ cd edge-lambda/
    $ yarn uploadToS3
    ...
    Finished uploading dist/wellcome_library_redirect.zip to s3://wellcomecollection-edge-lambdas/wellcome_library/wellcome_library_redirect.zip
    ```

    (Note: this automatically happens whenever new code is pushed to the main branch.)

2.  Apply the Terraform changes:

    ```console
    $ cd terraform/

    $ terraform plan -out=terraform.plan
    # review the changes

    $ terraform apply terraform.plan
    ```

    This will deploy the new version of the redirects to the *staging* domains.
    The new versions will be returned as an output:

    ```
    stage_lambda_function_versions = {
      "archive" = "28"
      "blog" = "45"
      "encore" = "24"
      "passthru" = "61"
      "wellcomelibrary" = "80"
    }
    ```

    We have [multiple versions of the Lambda@Edge functions][versions].
    When you upload a new zip package and run Terraform, it creates a new version.
    The staging domains always use the latest version, whereas the prod domains use a pinned version.

3.  Test the redirects in staging:

    ```console
    $ cd edge-lambda/
    $ yarn testRedirectsStage
    ```

4.  Update the versions of the Lambda functions in prod in `lambda_versions.tf`, using the versions output from Terraform above.
    Then do another Terraform plan/apply.

5.  Test the redirects in prod:

    ```console
    $ cd edge-lambda/
    $ yarn testRedirects
    ```

[versions]: https://docs.aws.amazon.com/lambda/latest/dg/configuration-versions.html
