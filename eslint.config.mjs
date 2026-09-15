import { plugin as shadcn } from "@shadcn/lint";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Design-system contract enforcement — scoped to src/components/ui/** only.
  // Not applied repo-wide: the marketing/section pages use raw accent colors
  // (e.g. indigo variants) as a deliberate visual choice, and the demo/OG-image
  // pages need inline styles for canvas/Satori rendering. See DESIGN.md and
  // specs/0013-shadcn-lint-scoped-rollout.md.
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    plugins: { shadcn },
    rules: {
      "shadcn/no-restyle": ["error", { allow: ["layout"] }],
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-inline-styles": "error",
      "shadcn/require-static-classes": "error",
    },
  },
  // Callers that compose ui/ components — enforce no-restyle only, since this
  // file legitimately needs its own spacing/layout/color choices elsewhere.
  {
    files: ["src/components/sections/Contact.tsx"],
    plugins: { shadcn },
    rules: {
      "shadcn/no-restyle": ["error", { allow: ["layout"] }],
    },
  },
  {
    files: ["src/__tests__/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: [
      "src/app/demos/rag-pipeline/page.tsx",
      "src/app/demos/vector-search/page.tsx",
      "src/app/demos/multimodal/page.tsx",
      "src/app/demos/quantization/page.tsx",
    ],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "coverage/**",
    "out/**",
    "test-results/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
