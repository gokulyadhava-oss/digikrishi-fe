#!/usr/bin/env bash
# Build the frontend Docker image and push to AWS ECR.
# Usage (from digikrishi-fe):
#   ./scripts/push-to-ecr.sh
#   (Script loads .env automatically, so VITE_GOOGLE_MAPS_API_KEY and VITE_API_URL from .env are used.)
#   Or pass inline: VITE_APP_URL=https://api.digikrishi.com VITE_GOOGLE_MAPS_API_KEY=xxx ./scripts/push-to-ecr.sh
#   Force clean build: NO_CACHE=1 ./scripts/push-to-ecr.sh
#
# Requires: aws CLI, docker. AWS credentials must be configured.

set -e

export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if ! command -v aws &>/dev/null; then
  echo "Error: aws CLI not found. Install it (e.g. brew install awscli) and run: aws configure"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$FE_DIR"

ECR_REPO_NAME="${ECR_REPO_NAME:-digikrishi-web}"
AWS_REGION="${AWS_REGION:-eu-north-1}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Load .env from project root so VITE_* are available (e.g. VITE_GOOGLE_MAPS_API_KEY). .env is not copied into the image.
if [[ -f "$FE_DIR/.env" ]]; then
  set -a
  source "$FE_DIR/.env"
  set +a
fi
# Override with current shell env (so you can also: VITE_GOOGLE_MAPS_API_KEY=xxx ./scripts/push-to-ecr.sh)
VITE_API_URL="${VITE_API_URL:-}"
VITE_APP_URL="${VITE_APP_URL:-}"
VITE_GOOGLE_MAPS_API_KEY="${VITE_GOOGLE_MAPS_API_KEY:-}"

echo "→ Resolving AWS account ID..."
AWS_ACCOUNT_ID="$(aws sts get-caller-identity --region "$AWS_REGION" --query Account --output text)"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo "→ Ensuring ECR repository exists: ${ECR_REPO_NAME} (${AWS_REGION})..."
aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" --region "$AWS_REGION" 2>/dev/null ||
  aws ecr create-repository --repository-name "$ECR_REPO_NAME" --region "$AWS_REGION"

echo "→ Logging Docker into ECR..."
aws ecr get-login-password --region "$AWS_REGION" |
  docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Build for linux/amd64 so the image runs on EC2 (x86_64)
echo "→ Building image: ${ECR_URI}:${IMAGE_TAG} (linux/amd64)..."
[[ -z "$VITE_GOOGLE_MAPS_API_KEY" ]] && echo "⚠ Warning: VITE_GOOGLE_MAPS_API_KEY not set — Maps will show 'API Key Missing'. Set it in .env or pass when running this script."
BUILD_ARGS=(--platform linux/amd64 -t "${ECR_URI}:${IMAGE_TAG}")
[[ -n "$VITE_API_URL" ]]             && BUILD_ARGS+=(--build-arg "VITE_API_URL=${VITE_API_URL}")
[[ -n "$VITE_APP_URL" ]]             && BUILD_ARGS+=(--build-arg "VITE_APP_URL=${VITE_APP_URL}")
[[ -n "$VITE_GOOGLE_MAPS_API_KEY" ]] && BUILD_ARGS+=(--build-arg "VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}")
# Use NO_CACHE=1 to force a clean build (e.g. after fixing env vars)
if [[ -n "${NO_CACHE:-}" ]]; then
  BUILD_ARGS=(--no-cache "${BUILD_ARGS[@]}")
fi
docker build "${BUILD_ARGS[@]}" .

echo "→ Pushing to ECR..."
docker push "${ECR_URI}:${IMAGE_TAG}"

echo "✅ Done. Image: ${ECR_URI}:${IMAGE_TAG}"
