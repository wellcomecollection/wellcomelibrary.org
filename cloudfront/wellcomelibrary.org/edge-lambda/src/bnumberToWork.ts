import { apiQuery, GetWorkResult, Identifier } from './api';

export async function getWork(bNumber: string): Promise<GetWorkResult> {
  const resultList = apiQuery({
    query: bNumber,
    include: ['identifiers'],
  });

  let work;

  for await (const result of resultList) {
    work = result;

    if (result.identifiers) {
      const identifiers: Identifier[] = result.identifiers;
      // If the work has a sierra-identifier identifier, that
      // preferentially indicates the work as being sourced
      // from Sierra, so use that work if we see it.
      const hasSierraId = identifiers.some(
        (thing) => thing.identifierType.id === 'sierra-identifier'
      );
      if (hasSierraId) {
        break;
      }
    }
  }

  if (work) {
    return work;
  } else {
    return Error('No matching Catalogue API results found');
  }
}
