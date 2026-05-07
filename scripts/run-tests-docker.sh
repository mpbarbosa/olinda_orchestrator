#!/usr/bin/env bash

set -euo pipefail

# This script runs the test suite in a Docker container. It mounts the project directory and a named volume for node_modules to speed up subsequent runs.
# By default it upgrades npm in the container to the host's installed npm version so lockfile behavior stays aligned.
# You can override the npm version by setting the DOCKER_NPM_VERSION environment variable.
DEFAULT_NODE_IMAGE="node:20-bookworm"
DOCKER_NODE_IMAGE="${DOCKER_NODE_IMAGE:-$DEFAULT_NODE_IMAGE}"
DOCKER_HOST_NPM_VERSION="$(npm --version)"
echo "Host npm version: ${DOCKER_HOST_NPM_VERSION}"
DOCKER_NPM_VERSION="${DOCKER_NPM_VERSION:-${DOCKER_HOST_NPM_VERSION:-11.14.0}}"
echo "NPM version: ${DOCKER_NPM_VERSION}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Project root: ${PROJECT_ROOT}"
PROJECT_NAME="${DOCKER_PROJECT_NAME:-$(basename "$PROJECT_ROOT")}"
echo "Project name: ${PROJECT_NAME}"
NODE_IMAGE="${DOCKER_NODE_IMAGE:-node:20-bookworm}"
echo "Node image: ${NODE_IMAGE}"

NODE_MODULES_VOLUME="${DOCKER_NODE_MODULES_VOLUME:-${PROJECT_NAME//[^a-zA-Z0-9_.-]/_}_node_modules}"
echo "Node modules volume: ${NODE_MODULES_VOLUME}"
TTY_FLAG=""

if [ -t 1 ]; then
  TTY_FLAG="-t"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run tests in a container" >&2
  exit 1
fi

echo "Running test suite in Docker with image ${NODE_IMAGE}"
echo "Upgrading npm in the container to ${DOCKER_NPM_VERSION}"

docker run --rm ${TTY_FLAG} \
  --volume "${PROJECT_ROOT}:/workspace" \
  --volume "${NODE_MODULES_VOLUME}:/workspace/node_modules" \
  --workdir /workspace \
  "${NODE_IMAGE}" \
  bash -lc "npm install --global npm@${DOCKER_NPM_VERSION} && npm ci && npm test"
