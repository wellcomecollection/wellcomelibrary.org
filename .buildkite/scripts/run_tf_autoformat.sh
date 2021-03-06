#!/usr/bin/env bash

set -o errexit
set -o nounset

ROOT=$(git rev-parse --show-toplevel)

# Run the Terraform autoformatting
docker run --tty --rm \
  --volume "$ROOT":/repo \
  --workdir /repo \
  public.ecr.aws/hashicorp/terraform:light fmt -recursive

# If there are any changes, push to GitHub immediately and fail the
# build.  This will abort the remaining jobs, and trigger a new build
# with the reformatted code.
set +o errexit
git diff --exit-code
has_changes=$?
set -o errexit

if (( has_changes == 0 ))
then
  echo "*** There were no changes from auto-formatting"
  exit 0
else
  echo "*** There were changes from formatting, creating a commit"

  git config user.name "Buildkite on behalf of Wellcome Collection"
  git config user.email wellcomedigitalplatform@wellcome.ac.uk
  git remote add ssh-origin "$BUILDKITE_REPO"

  git fetch ssh-origin
  git checkout --track "ssh-origin/$BUILDKITE_BRANCH"

  git add --verbose --update
  git commit -m "Apply auto-formatting rules"
  git push ssh-origin "HEAD:$BUILDKITE_BRANCH"

  # We exit here to fail the build, so Buildkite will skip to the next
  # build, which includes the autoformat commit.
  exit 1
fi
