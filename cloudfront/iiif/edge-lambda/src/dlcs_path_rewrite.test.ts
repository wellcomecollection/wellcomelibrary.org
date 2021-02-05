import * as origin from './dlcs_path_rewrite';
import testRequest from './test_event_request';
import { Context } from 'aws-lambda';

interface ExpectedRewrite {
  in: string
  out: string
}

const rewrite_tests = (): Array<ExpectedRewrite> => {
  return [
    {
      in: '/image/B0009851.jpg/full/1338%2C/0/default.jpg',
      out: '/B0009851/full/1338%2C/0/default.jpg'
    },
    {
      in: '/image/B0009852.JPG/full/1338%2C/0/default.jpg',
      out: '/B0009852/full/1338%2C/0/default.jpg'
    },
    {
      in: '/image/B0009853/full/1338%2C/0/default.jpg',
      out: '/B0009853/full/1338%2C/0/default.jpg'
    }
  ]
}

test.each(rewrite_tests())(
    'checks that path rewrite is valid',
    (expected:ExpectedRewrite) => {
      const requestCallback = jest.fn((_, request) => request);
      const r = testRequest(expected.in)

      origin.request(r, {} as Context, requestCallback);

      expect(r.Records[0].cf.request.uri).toBe(expected.out);
    }
);