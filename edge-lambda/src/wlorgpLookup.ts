import { safeGet } from './safeGet';
import { URL } from 'url'

const apiBasePath = 'https://iiif.wellcomecollection.org/wlorgp';

function validateUrl(url: string): Error | URL {
  try {
    return new URL(url);
  } catch (_) {
    return Error(`Invalid URL: ${url}`);
  }
}

export async function wlorgpLookup(lookupUri: string): Promise<Error | URL> {
  const url = `${apiBasePath}${lookupUri}`;

  const lookupUrl = await safeGet<string>(url);

  if (lookupUrl instanceof Error) {
    return lookupUrl;
  }

  return validateUrl(lookupUrl);
}
