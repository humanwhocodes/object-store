import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                process: false,
                URL: false,
                console: false
            },
        }
    }
];
