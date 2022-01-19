# Platform Infrastructure

[![Repo tests](https://img.shields.io/buildkite/31ad44a1e6bd7a592d4d21e7171f44962e52abe2cf7a6f8c3b/main.svg?label=repo%20tests)](https://buildkite.com/wellcomecollection/wellcome-library-repo-tests)

Wellcome Collection common infrastructure.

- [accounts](accounts/README.md): AWS account configuration, IAM etc.

- [assets](assets/README.md): Infrastructure for managing S3 buckets that contain "assets" (files or documents that are irretrievable).

- [builds](builds/README.md): Infrastructure for CI (mostly IAM for build agents).

- [images](images/README.md): Shared container definitions & repos (e.g. fluentbit, nginx).

- [critical](critical/README.md): Shared infrastructure for all projects, split into user_facing (api/cognito) and back_end (logs, shared config, networking).

- [cloudfront](cloudfront/README.md): Managing the infrastructure for Wellcome Collection's CloudFront distributions & DNS.

- [monitoring](monitoring/README.md): Grafana platform monitoring stack.

- **photography_backups**: Backup storage for photography (needs cleanup?)
