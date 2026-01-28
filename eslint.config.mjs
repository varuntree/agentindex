import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "agent-ralph-ui/**",
      "agent-ralph/**",
      "ralph/**",
      "node_modules/**",
      ".next/**",
      "drizzle/**",
      "pipeline/**",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
