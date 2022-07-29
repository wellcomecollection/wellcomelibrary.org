import { findWorkWithIdentifierValue, GetWorkResult } from './catalogueApi';
import { SierraIdentifier } from './paths';

export async function getWork(
  sierraIdentifier: SierraIdentifier
): Promise<GetWorkResult> {
  const sierraIdWork = await findWorkWithIdentifierValue({
    identifierValue: sierraIdentifier.sierraIdentifier,
    identifierType: 'sierra-identifier',
  });
  if (sierraIdWork) {
    return sierraIdWork;
  }

  if (sierraIdentifier.sierraSystemNumber) {
    const sierraSysNumWork = await findWorkWithIdentifierValue({
      identifierValue: sierraIdentifier.sierraSystemNumber,
      identifierType: 'sierra-system-number',
    });
    if (sierraSysNumWork) {
      return sierraSysNumWork;
    }
  }

  return Error('No matching Catalogue API results found');
}
