import type { OpenNextConfig } from "@opennextjs/aws/types/open-next.js";

// No ISR, revalidateTag or next/image in this app: prerendered pages are read
// from S3 (s3-lite) and tag cache / revalidation queue are disabled.
const config = {
  default: {
    override: {
      wrapper: "aws-lambda",
      converter: "aws-apigw-v2",
      incrementalCache: "s3-lite",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  dangerous: { disableTagCache: true, disableIncrementalCache: false },
} satisfies OpenNextConfig;

export default config;
