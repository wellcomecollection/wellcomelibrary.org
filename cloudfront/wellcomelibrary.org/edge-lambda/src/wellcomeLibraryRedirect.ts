import { CloudFrontRequestEvent, Context } from 'aws-lambda';
import {
  CloudFrontRequest,
  CloudFrontResultResponse,
} from 'aws-lambda/common/cloudfront';
import { getBnumberFromPath } from './paths';
import { getWork } from './bnumberToWork';
import { createRedirect } from './createRedirect';
import { redirectToRoot } from './redirectToRoot';
import { lookupStaticRedirect } from './lookupStaticRedirect';

import rawStaticRedirects from './staticRedirects.json';
const staticRedirects = rawStaticRedirects as Record<string, string>;

async function rewriteRequestUri(
  uri: string
): Promise<undefined | CloudFrontResultResponse> {
  const itemPathRegExp: RegExp = /^\/item\/.*/;
  const eventsPathRegExp: RegExp = /^\/events(\/)?.*/;

  const wellcomeCollectionHost = 'https://wellcomecollection.org';
  const notFoundRedirect = createRedirect(
    `${wellcomeCollectionHost}/works/not-found`
  );
  const staticRedirect = lookupStaticRedirect(staticRedirects, uri);

  if (staticRedirect) {
    return staticRedirect;
  } else if (uri.match(itemPathRegExp)) {
    // Try and find b-number in item path
    const bNumberResult = getBnumberFromPath(uri);

    if (bNumberResult instanceof Error) {
      console.error(bNumberResult);
      return notFoundRedirect;
    }

    // Find corresponding work id
    const bNumber = bNumberResult;
    const work = await getWork(bNumber);

    if (work instanceof Error) {
      console.error(work);
      return notFoundRedirect;
    }

    return createRedirect(`${wellcomeCollectionHost}/works/${work.id}`);
  } else if (uri.match(eventsPathRegExp)) {
    return createRedirect(`${wellcomeCollectionHost}/whats-on`);
  }
}

export const requestHandler = async (
  event: CloudFrontRequestEvent,
  _: Context
) => {
  const request: CloudFrontRequest = event.Records[0].cf.request;

  const rootRedirect = redirectToRoot(request);
  if (rootRedirect) {
    return rootRedirect;
  }

  const requestRedirect = await rewriteRequestUri(request.uri);

  if (requestRedirect) {
    return requestRedirect;
  }

  // If we've matched nothing so far then set the host header for Wellcome Library
  // In future we may want to redirect to wellcomecollection.org if we find no match
  request.headers.host = [{ key: 'host', value: 'wellcomelibrary.org' }];

  return request;
};
