import { expect, test } from '@jest/globals';
import testRequest from './testEventRequest';
import * as origin from '../wellcomeLibraryPassthru';
import { Context } from 'aws-lambda';
import { expectedRedirect } from './testHelpers';

test('redirects www. to root', () => {
  const request = testRequest({
    uri: '/foo',
    headers: {
      host: 'www.wellcomelibrary.org',
      protocol: 'https',
    },
  });

  const resultPromise = origin.requestHandler(request, {} as Context);

  return expect(resultPromise).resolves.toEqual(
    expectedRedirect('https://wellcomelibrary.org/foo')
  );
});

test('http requests are redirected to https', () => {
  const request = testRequest({
    uri: '/foo',
    headers: {
      host: 'wellcomelibrary.org',
      protocol: 'http',
    },
  });

  const resultPromise = origin.requestHandler(request, {} as Context);

  return expect(resultPromise).resolves.toEqual(
    expectedRedirect('https://wellcomelibrary.org/foo')
  );
});

test('rewrites the host header if it exists', async () => {
  const request = testRequest({
    uri: '/',
    headers: {
      host: 'www.wellcomelibrary.org',
    },
  });

  const originRequest = await origin.requestHandler(request, {} as Context);

  expect(originRequest.headers).toStrictEqual({
    host: [{ key: 'host', value: 'wellcomelibrary.org' }],
  });
});
