import * as origin from '../wellcomeLibraryCatalogueRedirect';
import testRequest from './testEventRequest';
import { Context } from 'aws-lambda';
import { results, resultWithIdentifier } from './catalogueApiFixtures';
import { expectedRedirect } from './testHelpers';
import axios from 'axios';
import { expect, jest, test } from '@jest/globals';
import { CatalogueResultsList } from '../catalogueApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const opacHeaders = {
  host: 'catalogue.wellcomelibrary.org',
  protocol: 'https',
};

type TestCase = {
  testDescription: string;
  path: string;
  qs?: string;
  results?: CatalogueResultsList;
  resolvedUri: string;
};

const rootTest = [
  {
    testDescription: 'root URL',
    path: '',
    resolvedUri: 'https://wellcomecollection.org/collections',
  },
];

const searchPageTests = [
  'X',
  'Y',
  'j',
  'l',
  'a',
  't',
  'q',
  'e',
  'v',
  'y',
  'g',
  'm',
  'o',
  'd',
  'h',
].map((code) => ({
  testDescription: `search page (/search/${code})`,
  path: '',
  resolvedUri: 'https://wellcomecollection.org/collections',
}))
  
const searchTests = [
  {
    testDescription: 'search for a single word (variant 1)',
    path: '/search/a',
    qs: 'searchtype=Y&searcharg=health&searchscope=12&SORT=D',
    resolvedUri: 'https://wellcomecollection.org/works?query=health',
  },
  {
    testDescription: 'search for a single word (variant 2)',
    path: '/search/t',
    qs: 'searchtype=Y&searcharg=health&searchscope=12&SORT=D',
    resolvedUri: 'https://wellcomecollection.org/works?query=health',
  },
  {
    testDescription: 'search for a single word (variant 3)',
    path: '/search~S12',
    qs:
      '/Yhealth&searchscope=12&SORT=D/Yhealth&searchscope=12&SORT=D&SUBKEY=health/1%2C32000%2C32000%2CB/frameset&FF=Yhealth&searchscope=12&SORT=D&1%2C1%2C',
    resolvedUri: 'https://wellcomecollection.org/works?query=health',
  },
  {
    testDescription: 'search for multiple (variant 1)',
    path: '/search/a',
    qs: 'searchtype=Y&searcharg=florence+nightingale&searchscope=12&SORT=D',
    resolvedUri:
      'https://wellcomecollection.org/works?query=florence%20nightingale',
  },
  {
    testDescription: 'search for multiple (variant 2)',
    path: '/search~S12',
    qs:
      '/searchtype=Y&searcharg=florence+nightingale&searchscope=12&SORT=DZ&extended=0&SUBMIT=Search&searchlimits=&searchorigarg=Yflorence+nightingale%26SORT%3DD',
    resolvedUri:
      'https://wellcomecollection.org/works?query=florence%20nightingale',
  },
  {
    testDescription: 'search for object number',
    path: '/search/o44843i',
    resolvedUri: 'https://wellcomecollection.org/works?query=44843i',
  },
  {
    testDescription: 'search for a subject heading',
    path: '/search~S12',
    qs: '/mZines./mzines/-3,-1,0,B/browse',
    resolvedUri: 'https://wellcomecollection.org/works?subjects.label=Zines.',
  },
  {
    testDescription: 'search for e-journals',
    path: '/search/X',
    qs: 'SEARCH=123&searchscope=7&SORT=AX&m=j',
    resolvedUri:
      'https://wellcomecollection.org/works?workType=d&availabilities=online&query=123',
  },
  {
    testDescription: 'search for a bib (variant 1)',
    path: '/record=b1191208',
    results: results([
      resultWithIdentifier('xy6nsffh', 'sierra-identifier', '1191208'),
    ]),
    resolvedUri: 'https://wellcomecollection.org/works/xy6nsffh',
  },
  {
    testDescription: 'search for a bib (variant 2)',
    path: '/record=b1191208~S12',
    results: results([
      resultWithIdentifier('xy6nsffh', 'sierra-identifier', '1191208'),
    ]),
    resolvedUri: 'https://wellcomecollection.org/works/xy6nsffh',
  },
  {
    testDescription: 'search for a bib (no results)',
    path: '/record=b1191208~S12',
    results: results([]),
    resolvedUri: 'https://wellcomecollection.org/works/not-found',
  },
  {
    testDescription: 'search for a long phrase (from Stories)',
    path: '/search~S12',
    qs:
      '/Ycollateral+damage&searchscope=12&SORT=D/Ycollateral+damage&searchscope=12&SORT=D&SUBKEY=collateral+damage/1%2C10%2C10%2CB/frameset&FF=Ycollateral+damage&searchscope=12&SORT=D&1%2C1%2C',
    resolvedUri:
      'https://wellcomecollection.org/works?query=collateral+damage',
  },
];

const accountTests = [
  {
    testDescription: 'patron page',
    path: '/patroninfo',
    resolvedUri: 'https://wellcomecollection.org/account',
  },
  {
    testDescription: 'patron page (variant 2)',
    path: '/patroninfo~S7/1109730/top',
    resolvedUri: 'https://wellcomecollection.org/account',
  },
  {
    testDescription: 'log in page',
    path: '/iii/cas/login',
    resolvedUri: 'https://wellcomecollection.org/account',
  },
  {
    testDescription: 'password reset page',
    path: '/pinreset',
    resolvedUri: 'https://wellcomecollection.org/account',
  },
  {
    testDescription: 'sign up page',
    path: '/selfreg',
    resolvedUri: 'https://wellcomecollection.org/signup',
  },
];

const fallbackTest = [
  {
    testDescription: 'unrecognised URL',
    path: '/notfound',
    resolvedUri: 'https://wellcomecollection.org/collections',
  },
];

const robotsTest = [
  {
    testDescription: 'robots.txt',
    path: '/robots.txt',
    resolvedUri: 'https://wellcomecollection.org/robots.txt',
  },
];

const opacTests = rootTest
  .concat(searchPageTests)
  .concat(searchTests)
  .concat(accountTests)
  .concat(fallbackTest)
  .concat(robotsTest);

test.each(opacTests)('Redirect for $testDescription', ({ testDescription, path, resolvedUri, qs, results}: TestCase) => {
    const request = testRequest({
      uri: path,
      querystring: qs,
      headers: opacHeaders,
    });
  
    results &&
      mockedAxios.get.mockResolvedValue({
        data: results,
      });
  
    const resultPromise = origin.requestHandler(request, {} as Context);
    return expect(resultPromise).resolves.toEqual(
      expectedRedirect(resolvedUri)
    );
});
