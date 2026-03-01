#!/usr/bin/env bash
# Build the frontend Docker image and push to AWS ECR.
# Usage (from digikrishi-fe):
#   ./scripts/push-to-ecr.sh
#   VITE_API_URL=https://api.yourdomain.com ./scripts/push-to-ecr.sh
#   ECR_REPO_NAME=digikrishi-web AWS_REGION=eu-north-1 IMAGE_TAG=v1.0.0 ./scripts/push-to-ecr.sh
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
# Optional: API URL baked into the frontend at build time (e.g. https://api.yourdomain.com)
VITE_API_URL="${VITE_API_URL:-}"

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
if [[ -n "$VITE_API_URL" ]]; then
  docker build --platform linux/amd64 -t "${ECR_URI}:${IMAGE_TAG}" --build-arg "VITE_API_URL=${VITE_API_URL}" .
else
  docker build --platform linux/amd64 -t "${ECR_URI}:${IMAGE_TAG}" .
fi

echo "→ Pushing to ECR..."
docker push "${ECR_URI}:${IMAGE_TAG}"

echo "✅ Done. Image: ${ECR_URI}:${IMAGE_TAG}"
