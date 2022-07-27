import { CloudFrontRequestEvent, Context } from 'aws-lambda';
import { wellcomeCollectionRedirect } from './redirectHelpers';

export const requestHandler = async (
  event: CloudFrontRequestEvent,
  _: Context
) => {
  // If we've matched nothing we redirect to the top-level collections page
  console.warn(
    `Unable to redirect request ${JSON.stringify(event.Records[0].cf.request)}`
  );
  return wellcomeCollectionRedirect('/collections');
};
