import path from "node:path";
import { fileURLToPath } from "node:url";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const root = path.dirname(fileURLToPath(import.meta.url));
export default [
  { ignores: ["**/node_modules/**", "**/.next/**", "**/.open-next/**", "**/.aws-sam/**", "**/dist/**", "**/next-env.d.ts", "apps/backend/**"] },
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: path.join(root, "apps/web") } }, rules: { "@typescript-eslint/no-unused-vars": "off", "@typescript-eslint/no-explicit-any": "off", "@next/next/no-img-element": "off", "react/no-unescaped-entities": "off",
    // React Compiler advisories new in eslint-config-next 16; existing code predates them.
    "react-hooks/set-state-in-effect": "warn", "react-hooks/purity": "warn" } },
];
