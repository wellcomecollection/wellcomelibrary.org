# How to add a static redirect to wellcomelibrary.org

A static redirect is for paths on wellcomelibrary.org that have a direct successor on wellcomecollection.org.
This is usually for fixed content (e.g. pages about visiting the library), not redirects to catalogue-based content.

You can see the current list of static redirects in `edge-lambda/src/staticRedirects.csv`.

To add a new static redirect:

1.  Add a new line to `edge-lambda/src/staticRedirects.csv`

2.  [Deploy a new version of the redirection Lambda](./deploy-redirect-lambda.md).

3.  (Optional) Issue a CloudFront invaliation for the path of the new redirect; otherwise you'll have to wait for any CloudFront caches to expire.
