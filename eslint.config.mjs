import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  // 1. Global ignores - To prevent linting build files, etc.
  {
    ignores: [
      "dist/",
      "node_modules/",
      ".venv/",
      "downloads/",
      "logs/",
      "**/*.cjs",
    ],
  },

  // 2. Base configs for all TypeScript/JavaScript files
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // 3. Project-wide settings and general rules (non-React)
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": "warn", 
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Temporarily disable the most problematic rules
      "@typescript-eslint/no-require-imports": "off",
      "no-case-declarations": "off",
      "no-control-regex": "off",
      "no-useless-escape": "off",
      "no-prototype-builtins": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-useless-catch": "off",
      "no-empty": "off",
      "@typescript-eslint/no-namespace": "off",
      "no-duplicate-case": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  
  // 4. React-specific configuration (for JSX/TSX files ONLY)
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react: pluginReact,
    },
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
    },
    settings: {
        react: {
            version: "detect",
        },
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off", // Temporarily disable
    },
  }
];
