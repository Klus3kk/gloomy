import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off", // Turn off unused vars warnings
      "@next/next/no-html-link-for-pages": "off", // Turn off warnings for <a> tags
      "@next/next/no-img-element": "off", // Turn off warnings for <img> tags
    },
  },
];

export default eslintConfig;
