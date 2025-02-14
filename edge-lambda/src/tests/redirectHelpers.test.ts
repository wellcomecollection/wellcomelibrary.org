import { expect, test } from '@jest/globals';
import { URL } from 'url'
import { createRedirect } from '../redirectHelpers';
import { CloudFrontResultResponse } from 'aws-lambda';

test('returns a valid redirect', () => {
  const redirect: CloudFrontResultResponse = createRedirect(
    new URL('https://www.example.com')
  );

  expect(redirect.status).toEqual('301');
  const headers = redirect.headers;
  expect(headers).toEqual({
    location: [
      {
        key: 'Location',
        value: 'https://www.example.com/',
      },
    ],
    'access-control-allow-origin': [
      {
        key: 'Access-Control-Allow-Origin',
        value: '*',
      },
    ],
  });
});
