#!/usr/bin/env bash
# Build the Next.js app with OpenNext and deploy the farmyn-web stack.
# Usage: AWS_PROFILE=farmyn infra/web/deploy.sh [DomainName CertificateArn]
# CI sets CFN_ROLE_ARN so CloudFormation runs as the execution role (infra/ci).
set -euo pipefail
cd "$(dirname "$0")"
ROOT=$(cd ../.. && pwd)
STACK=farmyn-web
REGION=us-east-1
DOMAIN=${1:-}
CERT=${2:-}

API_ORIGIN=$(aws cloudformation describe-stacks --stack-name farmyn --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='ApiOrigin'].OutputValue" --output text)
API_DOMAIN=${API_ORIGIN#https://}

(cd "$ROOT/apps/web" && rm -rf .open-next && API_ORIGIN=$API_ORIGIN npx open-next build)

sam deploy --template-file template.yaml --stack-name $STACK --region $REGION \
  --resolve-s3 --capabilities CAPABILITY_IAM ${CFN_ROLE_ARN:+--role-arn $CFN_ROLE_ARN} --no-confirm-changeset --no-fail-on-empty-changeset \
  --parameter-overrides ApiDomain=$API_DOMAIN ${DOMAIN:+DomainName=$DOMAIN CertificateArn=$CERT}

out() { aws cloudformation describe-stacks --stack-name $STACK --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text; }
BUCKET=$(out AssetsBucket)
DIST=$(out DistributionId)
ON="$ROOT/apps/web/.open-next"

# Hashed build output is immutable; public/ files get a short cache.
aws s3 sync "$ON/assets/_next" "s3://$BUCKET/_assets/_next" --region $REGION \
  --cache-control "public,max-age=31536000,immutable"
aws s3 sync "$ON/assets" "s3://$BUCKET/_assets" --region $REGION --exclude "_next/*" \
  --cache-control "public,max-age=3600,must-revalidate" --delete
aws s3 sync "$ON/cache" "s3://$BUCKET/_cache" --region $REGION --delete

aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*" --query Invalidation.Id --output text
echo "Deployed: https://$(out DistributionDomain)"
