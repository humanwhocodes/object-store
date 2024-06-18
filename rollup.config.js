
export default [
    {
        input: "src/object-store.js",
        output: [
            {
                file: "dist/object-store.cjs",
                format: "cjs"
            },
            {
                file: "dist/object-store.mjs",
                format: "esm"
            },
            {
                file: "dist/object-store.js",
                format: "esm",
                banner: "// @ts-self-types=\"./object-store.d.ts\""
            }
        ]
    }
];
