// Fail the upload if the bundle cannot load a handler; an empty zip shipped unnoticed in 2025.
const path = require('path');

const handlers = [
  'wellcomeLibraryPassthru',
  'wellcomeLibraryArchiveRedirect',
  'wellcomeLibraryCatalogueRedirect',
  'wellcomeLibraryBlogRedirect',
  'wellcomeLibraryEncoreRedirect',
  'wellcomeLibraryRedirect',
];

for (const name of handlers) {
  const handler = require(path.resolve(__dirname, 'dist', name)).requestHandler;
  if (typeof handler !== 'function') {
    console.error(`dist/${name}.js has no requestHandler`);
    process.exit(1);
  }
}
console.log(`All ${handlers.length} handlers load from dist`);
