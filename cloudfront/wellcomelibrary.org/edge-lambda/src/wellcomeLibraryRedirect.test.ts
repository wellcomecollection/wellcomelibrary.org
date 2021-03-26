import * as origin from './wellcomeLibraryRedirect';
import testRequest from './testEventRequest';
import { Context } from 'aws-lambda';
import {
  testDataNoResults,
  testDataSingleResult,
} from './catalogueApiFixtures';
import {
  axios404,
  axiosNoResponse,
  expectedPassthru,
  expectedRedirect,
  expectedServerError,
} from './testHelpers';
import {
  CloudFrontRequest,
  CloudFrontResultResponse,
} from 'aws-lambda/common/cloudfront';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { expect, jest, test } from '@jest/globals';

import rawStaticRedirects from './staticRedirects.json';
const staticRedirects = rawStaticRedirects as Record<string, string>;

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

type GenerateData = (uri?: string) => any;

type ExpectedRewrite = {
  uri: string;
  queryString?: string;
  out: CloudFrontResultResponse | CloudFrontRequest;
  generateData?: GenerateData;
  error?: Error;
};

const rewriteTests = (): ExpectedRewrite[] => {
  return [
    // Item page tests
    {
      uri: '/item/b21293302',
      out: expectedRedirect('https://wellcomecollection.org/works/k2a8y7q6'),
      generateData: () => testDataSingleResult,
    },
    {
      uri: '/item/b21293302',
      out: expectedRedirect('https://wellcomecollection.org/works/not-found'),
      generateData: () => testDataNoResults,
    },
    {
      uri: '/item/not-bnumber',
      out: expectedRedirect('https://wellcomecollection.org/works/not-found'),
    },
    {
      uri: '/not-item',
      out: expectedPassthru('/not-item'),
    },
    // Events pages redirect
    {
      uri: '/events',
      out: expectedRedirect('https://wellcomecollection.org/whats-on'),
    },
    {
      uri: '/events/any-thing',
      out: expectedRedirect('https://wellcomecollection.org/whats-on'),
    },
    // Static redirects (complementary to staticRedirectTests)
    {
      uri: '/using-the-library/',
      out: expectedRedirect(
        'https://wellcomecollection.org/pages/Wuw19yIAAK1Z3Smm'
      ),
    },
    {
      uri: '/using-the-library',
      out: expectedRedirect(
        'https://wellcomecollection.org/pages/Wuw19yIAAK1Z3Smm'
      ),
    },
    // API uris redirect
    {
      uri: '/iiif/collection/happy-path',
      out: expectedRedirect(
        'https://iiif.wellcomecollection.org/presentation/v2/happy-path'
      ),
      generateData: () =>
        'https://iiif.wellcomecollection.org/presentation/v2/happy-path',
    },
    {
      uri: '/iiif/collection/not-found',
      out: expectedServerError(
        'Got 404 from https://iiif.wellcomecollection.org/wlorgp/iiif/collection/not-found'
      ),
      error: axios404,
    },
    {
      uri: '/iiif/collection/no-response',
      out: expectedServerError(
        'No response from https://iiif.wellcomecollection.org/wlorgp/iiif/collection/no-response'
      ),
      error: axiosNoResponse,
    },
    {
      uri: '/iiif/collection/error',
      out: expectedServerError(
        'Unknown error from https://iiif.wellcomecollection.org/wlorgp/iiif/collection/error: Error: nope'
      ),
      error: Error('nope'),
    },
    {
      uri: '/iiif/collection/invalid-url',
      out: expectedServerError('Invalid URL: not_a_url'),
      generateData: () => 'not_a_url',
    },
    {
      uri: '/service/alto/happy-path/0',
      queryString: 'image=400',
      out: expectedRedirect(
        'https://iiif.wellcomecollection.org/text/alto/happy-path/b28047345_0403.jp2'
      ),
      generateData: (url) => {
        // Simulate doing a lookup with a query string
        if (url?.endsWith('/service/alto/happy-path/0?image=400')) {
          return 'https://iiif.wellcomecollection.org/text/alto/happy-path/b28047345_0403.jp2';
        } else {
          return 'https://example.com/badpath';
        }
      },
    },
    {
      uri: '/ddsconf/happy-path',
      out: expectedRedirect('https://iiif.wellcomecollection.org/bar/bat'),
      generateData: () => 'https://iiif.wellcomecollection.org/bar/bat',
    },
    {
      uri: '/dds-static/happy-path',
      out: expectedRedirect('https://iiif.wellcomecollection.org/bar/bat'),
      generateData: () => 'https://iiif.wellcomecollection.org/bar/bat',
    },
    {
      uri: '/annoservices/search/happy-path',
      queryString: 'q=butterfly',
      out: expectedRedirect('https://iiif.wellcomecollection.org/bar/bat'),
      generateData: () => 'https://iiif.wellcomecollection.org/bar/bat',
    },
  ];
};

test.each(rewriteTests())(
  'Request path is rewritten: %o',
  async (expected: ExpectedRewrite) => {
    const request = testRequest(expected.uri, expected.queryString);

    if (expected.error) {
      mockedAxios.get.mockImplementation(async () => {
        return Promise.reject(expected.error);
      });
    }

    if (expected.generateData) {
      mockedAxios.get.mockImplementationOnce(
        async (url: string, config?: AxiosRequestConfig) => {
          const dataGenerator = expected.generateData as GenerateData;

          return {
            data: dataGenerator(url),
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
          } as AxiosResponse;
        }
      );
    }

    const originRequest = await origin.requestHandler(request, {} as Context);

    expect(originRequest).toStrictEqual(expected.out);
  }
);

const staticRedirectTests = Object.entries(staticRedirects).map(
  ([path, redirect]) => {
    return {
      uri: path,
      out: expectedRedirect(redirect),
    } as ExpectedRewrite;
  }
);

test.each(staticRedirectTests)(
  'Request path is rewritten: %o',
  async (expected: ExpectedRewrite) => {
    const request = testRequest(expected.uri);

    if (expected.generateData) {
      mockedAxios.get.mockResolvedValueOnce({ data: expected.generateData });
    }

    const originRequest = await origin.requestHandler(request, {} as Context);

    expect(originRequest).toStrictEqual(expected.out);
  }
);

test('rewrites the host header if it exists', async () => {
  const request = testRequest('/', undefined, {
    host: [{ key: 'host', value: 'notwellcomelibrary.org' }],
  });

  const originRequest = await origin.requestHandler(request, {} as Context);

  expect(originRequest.headers).toStrictEqual({
    host: [{ key: 'host', value: 'wellcomelibrary.org' }],
  });
});

test('adds the host header if it is missing', async () => {
  const request = testRequest('/', undefined);

  const originRequest = await origin.requestHandler(request, {} as Context);

  expect(originRequest.headers).toStrictEqual({
    host: [{ key: 'host', value: 'wellcomelibrary.org' }],
  });
});

test('leaves other headers unmodified', async () => {
  const request = testRequest('/', undefined, {
    host: [{ key: 'host', value: 'notwellcomelibrary.org' }],
    connection: [{ key: 'connection', value: 'close' }],
    authorization: [
      { key: 'authorization', value: 'Basic YWxhZGRpbjpvcGVuc2VzYW1l' },
    ],
  });

  const originRequest = await origin.requestHandler(request, {} as Context);

  expect(originRequest.headers).toStrictEqual({
    host: [{ key: 'host', value: 'wellcomelibrary.org' }],
    connection: [{ key: 'connection', value: 'close' }],
    authorization: [
      { key: 'authorization', value: 'Basic YWxhZGRpbjpvcGVuc2VzYW1l' },
    ],
  });
});
