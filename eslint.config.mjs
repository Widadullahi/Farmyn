import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: path.join(root, "apps/web") });
export default [
  { ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/next-env.d.ts", "apps/backend/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { settings: { next: { rootDir: path.join(root, "apps/web") } }, rules: { "@typescript-eslint/no-unused-vars": "off", "@typescript-eslint/no-explicit-any": "off", "@next/next/no-img-element": "off", "react/no-unescaped-entities": "off" } },
];
