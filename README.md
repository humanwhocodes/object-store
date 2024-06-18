# Object Store

by [Nicholas C. Zakas](https://humanwhocodes.com)

If you find this useful, please consider supporting my work with a [donation](https://humanwhocodes.com/donate) or [nominate me](https://stars.github.com/nominate/) for a GitHub Star.

## Description

An implementation of an in-memory object store modeled on cloud drives like Google Drive. This is useful mostly for testing purposes.

## Usage

### Node.js

Install using [npm][npm] or [yarn][yarn]:

```
npm install @humanwhocodes/object-store

# or

yarn add @humanwhocodes/object-store
```

Import into your Node.js project:

```js
// CommonJS
const { ObjectStore } = require("@humanwhocodes/object-store");

// ESM
import { ObjectStore } from "@humanwhocodes/object-store";
```

### Deno

Install using [JSR](https://jsr.io):

```shell
deno add @humanwhocodes/object-store

#or

jsr add @humanwhocodes/object-store
```

Then import into your Deno project:

```js
import { ObjectStore } from "@humanwhocodes/object-store";
```

### Bun

Install using this command:

```
bun add @humanwhocodes/object-store
```

Import into your Bun project:

```js
import { ObjectStore } from "@humanwhocodes/object-store";
```

### Browser

It's recommended to import the minified version to save bandwidth:

```js
import { ObjectStore } from "https://cdn.skypack.dev/@humanwhocodes/object-store?min";
```

However, you can also import the unminified version for debugging purposes:

```js
import { ObjectStore } from "https://cdn.skypack.dev/@humanwhocodes/object-store";
```

## API

TODO

## Developer Setup

1. Fork the repository
2. Clone your fork
3. Run `npm install` to setup dependencies
4. Run `npm test` to run tests

## License

Apache 2.0
