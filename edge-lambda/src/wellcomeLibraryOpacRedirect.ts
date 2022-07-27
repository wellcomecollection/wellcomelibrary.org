import { CloudFrontRequest, CloudFrontRequestEvent, Context } from 'aws-lambda';
import { wellcomeCollectionRedirect } from './redirectHelpers';
import querystring from 'querystring';

export const requestHandler = async (
  event: CloudFrontRequestEvent,
  _: Context
) => {
  const request: CloudFrontRequest = event.Records[0].cf.request;

  request.headers.host = [{ key: 'host', value: 'search.wellcomelibrary.org' }];

  const path = request.uri;
  const qs: querystring.ParsedUrlQuery = querystring.parse(request.querystring);

  if (path.startsWith('/search')) {
    console.log(`@@AWLC ${JSON.stringify(qs)}`);
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
