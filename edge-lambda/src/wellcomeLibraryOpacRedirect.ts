import { CloudFrontRequest, CloudFrontRequestEvent, Context } from 'aws-lambda';
import { CloudFrontResultResponse } from 'aws-lambda/common/cloudfront';
import { wellcomeCollectionRedirect } from './redirectHelpers';
import querystring from 'querystring';

function getSearchRedirect(
  path: string,
  qs: querystring.ParsedUrlQuery
): CloudFrontResultResponse | Error {
  const pathParts = path.split('/');

  // For URLs like /search/a?searchtype=Y&searcharg=health&searchscope=12&SORT=D
  if (typeof qs.searcharg === 'string') {
    return wellcomeCollectionRedirect(`/works?query=${qs.searcharg}`);
  }

  // For URLs like /search/o44843i
  if (pathParts.length >= 3) {
    const possibleObjectNumber = pathParts[2];

    if (possibleObjectNumber.match(/^o[0-9]+i$/)) {
      return wellcomeCollectionRedirect(
        `/works?query=${possibleObjectNumber.slice(1)}`
      );
    }
  }

  // If we've matched nothing we redirect to the top-level collections page
  //
  // Note that some of the query string values in OPAC are v weird, so we cast to JSON
  // before string interpolating to avoid type errors.
  console.warn(
    `Could not extract search term from path=${path}, qs=${JSON.stringify(qs)}`
  );
  return wellcomeCollectionRedirect('/collections/');
}

export const requestHandler = async (
  event: CloudFrontRequestEvent,
  _: Context
) => {
  const request: CloudFrontRequest = event.Records[0].cf.request;

  request.headers.host = [{ key: 'host', value: 'search.wellcomelibrary.org' }];

  const path = request.uri;
  const qs: querystring.ParsedUrlQuery = querystring.parse(request.querystring);

  if (path.startsWith('/search')) {
    return getSearchRedirect(path, qs);
  }

  // https://catalogue.wellcomelibrary.org/
  if (path === '/') {
    return wellcomeCollectionRedirect('/collections');
  }

  // Various URLs related to account management
  if (
    path.startsWith('/patroninfo') ||
    path === '/iii/cas/login' ||
    path === '/pinreset'
  ) {
    return wellcomeCollectionRedirect('/account');
  }

  // https://catalogue.wellcomelibrary.org/selfreg was the old self-registration page
  if (path.startsWith('/selfreg')) {
    return wellcomeCollectionRedirect('/signup');
  }

  // https://catalogue.wellcomelibrary.org/robots.txt
  if (path === '/robots.txt') {
    return wellcomeCollectionRedirect('/robots.txt');
  }

  // If we've matched nothing we redirect to the top-level collections page
  console.warn(
    `Unable to redirect request ${JSON.stringify(event.Records[0].cf.request)}`
  );
  return wellcomeCollectionRedirect('/collections');
};
