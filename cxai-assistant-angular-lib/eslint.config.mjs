import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import tsparser from "@typescript-eslint/parser";

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    ignores: [
        "**/dist/**",
        "**/node_modules/**",
        "**/*.generated.ts",
        "**/*.gen.ts"
    ],

    files: ["**/*.ts"],

    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates",
    ),

    languageOptions: {
        parser: tsparser,
        parserOptions: {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
        },
    },

    plugins: {},

    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@angular-eslint/prefer-inject": "warn",
        "@typescript-eslint/prefer-readonly": "warn",
        "@angular-eslint/prefer-standalone": "off",
        "@angular-eslint/prefer-on-push-component-change-detection": "error",

        "@typescript-eslint/no-unused-vars": ["warn", {
            argsIgnorePattern: "^_",
        }],

        "eqeqeq": ["error", "smart"],

        "@angular-eslint/component-selector": [
            "error",
            {
            type: "element",
            prefix: "lib",
            style: "kebab-case",
            },
        ],
    },
}, {
    files: ["**/*.html"],

    extends: compat.extends(
        "plugin:@angular-eslint/template/recommended",
        "plugin:@angular-eslint/template/accessibility",
    ),

    plugins: {},

    rules: {
        "@angular-eslint/template/click-events-have-key-events": "off",
        "@angular-eslint/template/interactive-supports-focus": "off",
    },
}, {
    files: ["**/*.scss"],

    extends: compat.extends(
        "plugin:@angular-eslint/template/recommended",
        "plugin:@angular-eslint/template/accessibility",
    ),

    plugins: {},
    rules: {},
}]);
