import { CloudFrontHeaders, CloudFrontRequestEvent } from 'aws-lambda';
import { CloudFrontRequest } from 'aws-lambda/common/cloudfront';

// This event structure was sourced from the AWS docs as below.
// https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#example-origin-request
export const createCloudFrontRequestEvent = ({
  uri,
  querystring = '',
  headers = {},
}: {
  uri: string;
  querystring?: string;
  headers?: {
    host?: string;
    protocol?: string;
  };
}): CloudFrontRequestEvent => {
  const hostHeader: CloudFrontHeaders =
    typeof headers.host === 'string'
      ? { host: [{ key: 'host', value: headers.host }] }
      : {};

  const protoHeader: CloudFrontHeaders =
    typeof headers.protocol === 'string'
      ? {
          'cloudfront-forwarded-proto': [
            { key: 'cloudfront-forwarded-proto', value: headers.protocol },
          ],
        }
      : {};

  const cloudfrontHeaders = {
    ...hostHeader,
    ...protoHeader,
  };

  return {
    Records: [
      {
        cf: {
          config: {
            distributionId: 'EXAMPLE',
            distributionDomainName: '',
            requestId: '',
            eventType: 'origin-request',
          },
          request: createCloudFrontRequest({
            uri,
            querystring,
            headers: cloudfrontHeaders,
          }),
        },
      },
    ],
  };
};

export const createCloudFrontRequest = ({
  uri,
  querystring = '',
  headers = {},
}: {
  uri: string;
  querystring?: string;
  headers?: CloudFrontHeaders;
}) => {
  return {
    uri,
    querystring,
    method: 'GET',
    clientIp: '2001:cdba::3257:9652',
    headers: headers,
  } as CloudFrontRequest;
};

export default createCloudFrontRequestEvent;
