const zipLocation = 'dist/wellcome_library_redirect.zip';
const s3Bucket = 'wellcomecollection-edge-lambdas';
const s3Key = 'wellcome_library/wellcome_library_redirect.zip';
const roleArn = 'arn:aws:iam::760097843905:role/platform-ci';
// Lambda@Edge code lives in us-east-1; the CI container has no AWS region set.
const region = 'us-east-1';

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
const { fromTemporaryCredentials } = require("@aws-sdk/credential-providers")
const fs = require("fs")

const s3Client = new S3Client({
  region,
  credentials: fromTemporaryCredentials({
    params: { RoleArn: roleArn },
    clientConfig: { region }
  })
});

async function main() {
  const data = fs.readFileSync(zipLocation)

  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: s3Key,
    Body: data,
    ACL: 'private',
    ContentType: 'application/zip'
  })

  const result = await s3Client.send(command)
  console.log(`Finished uploading ${zipLocation} to s3://${s3Bucket}/${s3Key} (version ${result.VersionId})`)
}

// Fail the build step if the upload fails, rather than logging and exiting 0.
main().catch((e) => {
  console.error('Error:', e.stack);
  process.exit(1);
});
