import { expect, test } from '@jest/globals';
import testRequest from './testEventRequest';
import * as origin from './wellcomeLibraryPassthru';
import { Context } from 'aws-lambda';
import { expectedRedirect } from './testHelpers';

test('redirects www. to root', () => {
  const request = testRequest('/foo', undefined, {
    host: [{ key: 'host', value: 'www.wellcomelibrary.org' }],
    'cloudfront-forwarded-proto': [
      { key: 'cloudfront-forwarded-proto', value: 'https' },
    ],
  });

  const resultPromise = origin.requestHandler(request, {} as Context);

  return expect(resultPromise).resolves.toEqual(
    expectedRedirect('https://wellcomelibrary.org/foo')
  );
});

test('http requests are redirected to https', () => {
  const request = testRequest('/foo', undefined, {
    host: [{ key: 'host', value: 'wellcomelibrary.org' }],
    'cloudfront-forwarded-proto': [
      { key: 'cloudfront-forwarded-proto', value: 'http' },
    ],
  });

  const resultPromise = origin.requestHandler(request, {} as Context);

  return expect(resultPromise).resolves.toEqual(
    expectedRedirect('https://wellcomelibrary.org/foo')
  );
});

test('redirects wellcomelibrary.org passthrus to wellcomecollection.org', async () => {
  const request = testRequest('/unknown', undefined, {
    host: [{ key: 'host', value: 'www.wellcomelibrary.org' }],
  });

  const originRequest = await origin.requestHandler(request, {} as Context);

  expect(originRequest.headers).toStrictEqual({
    location: [{ key: 'Location', value: 'https://wellcomecollection.org/' }],
    'access-control-allow-origin': [
      { key: 'Access-Control-Allow-Origin', value: '*' },
    ],
  });

  expect(originRequest.status).toEqual('302');
});
