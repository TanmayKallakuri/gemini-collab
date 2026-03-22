import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  org: "tanmay-collab",
  project: "gemini-collab",
  silent: true,
  disableLogger: true,
});
