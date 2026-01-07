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
            ".history/*",
            ".next/*",
            "out/*",
            "playwright-report/*",
            "test-results/*",
            "node_modules/*",
            "coverage/*",
            "dist/*",
            "build/*",
            "worker-build/*",
            "next-env.d.ts",
            "scripts/*"
        ],
    },
    ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
