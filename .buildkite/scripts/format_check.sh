#!/usr/bin/env bash
# Fails the build on unformatted Terraform; run `terraform fmt -recursive` to fix.
set -o errexit
set -o nounset

ROOT=$(git rev-parse --show-toplevel)

docker run --tty --rm \
  --volume "$ROOT":/repo \
  --workdir /repo \
  public.ecr.aws/hashicorp/terraform:light fmt -check -recursive -diff
