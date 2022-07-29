import { CloudFrontRequest, CloudFrontRequestEvent, Context } from 'aws-lambda';
import { CloudFrontResultResponse } from 'aws-lambda/common/cloudfront';
import {
  getSierraIdentifierRedirect,
  wellcomeCollectionNotFoundRedirect,
  wellcomeCollectionRedirect,
} from './redirectHelpers';
import querystring from 'querystring';
import { calcCheckDigit } from './paths';

function getSearchRedirect(
  path: string,
  qs: string
): CloudFrontResultResponse | Error {
  const parsedQs: querystring.ParsedUrlQuery = querystring.parse(qs);
  const pathParts = path.split('/');

  // For URLs like /search/a?searchtype=Y&searcharg=health&searchscope=12&SORT=D
  if (typeof parsedQs.searcharg === 'string') {
    return wellcomeCollectionRedirect(`/works?query=${parsedQs.searcharg}`);
  }

  // For URLs like /search/o44843i
  const objectNumberRegex = /^\/search\/o(?<number>[0-9]+i).*/;
  const objectNumberMatch = path.match(objectNumberRegex);

  if (objectNumberMatch !== null) {
    const objectNumber = objectNumberMatch.groups!.number;

    return wellcomeCollectionRedirect(`/works?query=${objectNumber}`);
  }

  // For URLs like /search~S12?/Yhealth&searchscope=12&SORT=D
  const queryRegex = /^\/Y(?<query>[^&]+)&.*/;
  const queryMatch = qs.match(queryRegex);

  if (queryMatch !== null) {
    const query = queryMatch.groups!.query;

    return wellcomeCollectionRedirect(`/works?query=${query}`);
  }

  // For URLs like /search~S12?/mZines./mzines/-3,-1,0,B/browse
  const subjectRegex = /^\/m(?<query>[^/]+)\/.*/;
  const subjectMatch = qs.match(subjectRegex);

  if (subjectMatch !== null) {
    const query = subjectMatch.groups!.query;

    return wellcomeCollectionRedirect(`/works?subjects.label=${query}`);
  }

  // For URLs like /search/X?SEARCH=123&searchscope=7&SORT=AX&m=j
  if (parsedQs.m === 'j' && typeof parsedQs.SEARCH === 'string') {
    return wellcomeCollectionRedirect(
      `/works?workType=d&availabilities=online&query=${parsedQs.SEARCH}`
    );
  }

  // If we've matched nothing we redirect to the top-level collections page
  console.warn(`Could not extract search term from path=${path}, qs=${qs}`);
  return wellcomeCollectionRedirect('/collections/');
}

async function getWorksRedirect(
  path: string
): Promise<CloudFrontResultResponse> {
  const match = path.match(/^\/record=b(?<bnumber>[0-9]{7}).*/);

  if (match === null) {
    console.warn(`Unable to deduce b-number from path ${path}`);
    return wellcomeCollectionNotFoundRedirect;
  }

  const bnumber = match.groups!.bnumber;

  return getSierraIdentifierRedirect({
    sierraIdentifier: bnumber,
    sierraSystemNumber: `b${bnumber}${calcCheckDigit(parseInt(bnumber, 10))}`,
  });
}

export const requestHandler = async (
  event: CloudFrontRequestEvent,
  _: Context
) => {
  const request: CloudFrontRequest = event.Records[0].cf.request;

  request.headers.host = [{ key: 'host', value: 'search.wellcomelibrary.org' }];

  const path = request.uri;

  if (path.startsWith('/search')) {
    return getSearchRedirect(path, request.querystring);
  }

  if (path.startsWith('/record')) {
    return getWorksRedirect(path);
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
