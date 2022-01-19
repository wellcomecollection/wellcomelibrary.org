# wellcomelibrary.org

[![Repo tests](https://img.shields.io/buildkite/31ad44a1e6bd7a592d4d21e7171f44962e52abe2cf7a6f8c3b/main.svg?label=repo%20tests)](https://buildkite.com/wellcomecollection/wellcome-library-repo-tests) [![Repo tests](https://img.shields.io/buildkite/a227d606a40aacf257533d40481f74f5ac1335ffa6477873ee/main.svg?label=redirects)](https://buildkite.com/wellcomecollection/wellcome-library-redirects)

This is the CloudFront distribution for the old `wellcomelibrary.org` website.
It includes the code for redirecting users from the old site to the appropriate `wellcomecollection.org` URL.

## Key pieces

*   The CloudFront distributions are in the platform account.
    We have one distribution per subdomain of `wellcomelibrary.org` (e.g. `archives.wellcomelibrary.org`, `catalogue.wellcomelibrary.org`).

*   Each CloudFront distribution is connected to a Lambda@Edge function (defined in `edge-lambda`), which decides whether to redirect the user to the new site, or forward them to the old site.

    (We use Lambda@Edge instead of CloudFront Functions because we sometimes need to make HTTP requests before doing a redirect.
    e.g. looking up a b-number from a URL so we can find the appropriate works page.)

*   The Route 53 hosted zone for wellcomelibrary.org is defined in a D&T account.
    We create DNS records in that hosted zone that point to our CloudFront distributions.

## Key subdomains/services

*   `archives.wellcomelibrary.org` was a web front-end for the archive catalogue/CALM, powered by an application called DServe.
    We redirect requests to the Works pages on the new website.

*   `blog.wellcomelibrary.org` was the Wellcome Library blog.
    It's been backed up in the Wayback Machine by the Internet Archive, and we redirect requests to the archived version.

*   `search.wellcomelibrary.org` was a web front-end for the library catalogue/Sierra, powered by an application called Encore.
    As of January 2022, we are not redirecting Encore URLs.
    We will eventually redirect requests to the Works pages on the new website.

    Encore was also available at `wellcomelibrary.org` (no subdomain).

*   `catalogue.wellcomelibrary.org` was another web front-end for the library catalogue/Sierra, often referred to as the OPAC ([online public access catalogue][opac]) or WebPAC.
    As of January 2022, we are not redirecting OPAC URLs, and we have no immediate plans to do so.

*   `wellcomelibrary.org/iiif` and other paths (e.g. `/service/alto`) were IIIF services, including a IIIF Image API and IIIF presentation API.
    These services are now served from `iiif.wc.org`, and we redirect any requests for the old URLs to the new URLs.

[opac]: https://en.wikipedia.org/wiki/Online_public_access_catalog

## How to

*   [Get to the Route 53 Hosted Zone in the AWS Console](docs/route53-hosted-zone.md)
*   [Deploy a new version of the redirection Lambdas](docs/deploy-redirect-lambda.md)
