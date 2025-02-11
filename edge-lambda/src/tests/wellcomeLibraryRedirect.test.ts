import * as origin from '../wellcomeLibraryRedirect';
import testRequest from './testEventRequest';
import { Context } from 'aws-lambda';
import { URL } from 'url'
import {
  testDataNoResults,
  testDataSingleResult,
} from './catalogueApiFixtures';
import { axios404, axiosNoResponse, expectedRedirect } from './testHelpers';
import {
  CloudFrontRequest,
  CloudFrontResultResponse,
} from 'aws-lambda/common/cloudfront';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { expect, jest, test, afterEach } from '@jest/globals';

import rawStaticRedirects from '../staticRedirects.json';
const staticRedirects = rawStaticRedirects as Record<string, string>;

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

type GenerateData = (uri?: string) => any;

type ExpectedRewrite = {
  uri: string;
  queryString?: string;
  out: CloudFrontResultResponse | CloudFrontRequest;
  generateData?: GenerateData[];
  error?: Error;
};

const rewriteTests = (): ExpectedRewrite[] => {
  return [
    // Item & player page tests
    {
      uri: '/item/b22425122',
      out: expectedRedirect('https://wellcomecollection.org/works/k2a8y7q6'),
      generateData: [() => testDataSingleResult],
    },
    {
      uri: '/item/b22425122',
      out: expectedRedirect('https://wellcomecollection.org/works/not-found'),
      generateData: [() => testDataNoResults, () => testDataNoResults],
    },
    {
      uri: '/player/b22425122',
      out: expectedRedirect('https://wellcomecollection.org/works/k2a8y7q6'),
      generateData: [() => testDataSingleResult],
    },
    {
      uri: '/player/b22425122',
      out: expectedRedirect('https://wellcomecollection.org/works/not-found'),
      generateData: [() => testDataNoResults, () => testDataNoResults],
    },
    {
      uri: '/item/not-bnumber',
      out: expectedRedirect('https://wellcomecollection.org/works/not-found'),
    },
    {
      uri: '/not-item',
      out: expectedRedirect('https://wellcomecollection.org/'),
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
      generateData: [
        () => 'https://iiif.wellcomecollection.org/presentation/v2/happy-path',
      ],
    },
    {
      uri: '/iiif/collection/not-found',
      out: expectedRedirect('https://wellcomecollection.org/'),
      error: axios404,
    },
    {
      uri: '/iiif/collection/no-response',
      out: expectedRedirect('https://wellcomecollection.org/'),
      error: axiosNoResponse,
    },
    {
      uri: '/iiif/collection/error',
      out: expectedRedirect('https://wellcomecollection.org/'),
      error: Error('nope'),
    },
    {
      uri: '/iiif/collection/invalid-url',
      out: expectedRedirect('https://wellcomecollection.org/'),
      generateData: [() => 'not_a_url'],
    },
    {
      uri: '/service/alto/happy-path/0',
      queryString: 'image=400',
      out: expectedRedirect(
        'https://iiif.wellcomecollection.org/text/alto/happy-path/b28047345_0403.jp2'
      ),
      generateData: [
        (url) => {
          // Simulate doing a lookup with a query string
          if (url?.endsWith('/service/alto/happy-path/0?image=400')) {
            return 'https://iiif.wellcomecollection.org/text/alto/happy-path/b28047345_0403.jp2';
          } else {
            return 'https://example.com/badpath';
          }
        },
      ],
    },
    {
      uri: '/ddsconf/happy-path',
      out: expectedRedirect('https://iiif.wellcomecollection.org/bar/bat'),
      generateData: [() => 'https://iiif.wellcomecollection.org/bar/bat'],
    },
    {
      uri: '/dds-static/happy-path',
      out: expectedRedirect('https://iiif.wellcomecollection.org/bar/bat'),
      generateData: [() => 'https://iiif.wellcomecollection.org/bar/bat'],
    },
    {
      uri: '/annoservices/search/happy-path',
      queryString: 'q=butterfly',
      out: expectedRedirect('https://iiif.wellcomecollection.org/bar/bat'),
      generateData: [() => 'https://iiif.wellcomecollection.org/bar/bat'],
    },
    {
      uri: '/collections/browse/authors/Wellcome Historical Medical Library./',
      out: expectedRedirect('https://wellcomecollection.org/collections'),
    },
    {
      uri: '/collections/browse/topics/Archives/',
      out: expectedRedirect('https://wellcomecollection.org/collections'),
    },
    {
      uri: '/collections/browse/genres/Archives/',
      out: expectedRedirect('https://wellcomecollection.org/collections'),
    },
    {
      uri: '/collections/browse/collections/digramc/',
      out: expectedRedirect('https://wellcomecollection.org/collections'),
    },
  ];
};

test.each(rewriteTests())(
  'Request path is rewritten: %o',
  async (expected: ExpectedRewrite) => {
    const request = testRequest({
      uri: expected.uri,
      querystring: expected.queryString,
    });

    if (expected.error) {
      mockedAxios.get.mockImplementation(async () => {
        return Promise.reject(expected.error);
      });
    }

    if (expected.generateData) {
      expected.generateData.forEach((generator) => {
        mockedAxios.get.mockImplementationOnce(
          async (url: string, config?: AxiosRequestConfig) => {
            const dataGenerator = generator as GenerateData;

            return {
              data: dataGenerator(url),
              status: 200,
              statusText: 'OK',
              headers: {},
              config: {},
            } as any;
          }
        );
      });
    }

    const originRequest = await origin.requestHandler(request, {} as Context);

    expect(originRequest).toStrictEqual(expected.out);
  }
);

const staticRedirectTests = Object.entries(staticRedirects).map(
  ([path, redirect]) => {
    // Ensure URLs come out with consistent parsing
    const urlRedirect = new URL(redirect);
    return {
      uri: path,
      out: expectedRedirect(urlRedirect.toString()),
    } as ExpectedRewrite;
  }
);

test.each(staticRedirectTests)(
  'Request path is rewritten: %o',
  async (expected: ExpectedRewrite) => {
    const request = testRequest({ uri: expected.uri });

    if (expected.generateData) {
      mockedAxios.get.mockResolvedValueOnce({ data: expected.generateData });
    }

    const originRequest = await origin.requestHandler(request, {} as Context);

    expect(originRequest).toStrictEqual(expected.out);
  }
);

test('redirects unknown paths to wellcomecollection.org', async () => {
  const request = testRequest({
    uri: '/unspecifiedPath',
    headers: {
      host: 'wellcomelibrary.org',
    },
  });

  const originRequest = await origin.requestHandler(request, {} as Context);

  expect(originRequest.status).toStrictEqual('301');
  expect(originRequest.headers).toStrictEqual({
    'access-control-allow-origin': [
      { key: 'Access-Control-Allow-Origin', value: '*' },
    ],
    location: [{ key: 'Location', value: 'https://wellcomecollection.org/' }],
  });
});

afterEach(() => {
  jest.resetAllMocks();
});
