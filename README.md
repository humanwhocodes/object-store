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

### Creating Files

```js
const store = new ObjectStore();
const file = store.createFile("foo.txt", { content: "Foo", parentId: "folder_id" });

console.log(file);
/*
{
    id: "file_id",
    name: "foo.txt",
    type: "file",
    parent_id: "parent_id",
    created_at: "2022-10-20T12:00:00Z",
    modified_at: "2022-10-20T12:00:00Z",
}
*/
```

**Note:** When `parentId` is omitted, the root folder is used.

### Retrieving Files

```js
const store = new ObjectStore();
const file = store.createFile("foo.txt", { content: "Foo" });
const retrievedFile = store.getFile(file.id);
console.log(retrievedFile);
/*
{
    id: "file_id",
    name: "foo.txt",
    type: "file",
    parent_id: "parent_id",
    created_at: "2022-10-20T12:00:00Z",
    modified_at: "2022-10-20T12:00:00Z",
}
*/
```

### Retrieving File Content

```js
const store = new ObjectStore();
const file = store.createFile("foo.txt", { content: "Foo" });
const content = store.getFileContent(file.id);
console.log(content);   // "Foo"
```

### Deleting Files

```js
const store = new ObjectStore();
const file = store.createFile("foo.txt", { content: "Foo" });

store.deleteFile(file.id);
```

### Creating Folders
```js
const store = new ObjectStore();
const folder = store.createFolder("my-folder", { parentId: "parent_folder_id" });
console.log(folder);
/*
{
    id: "folder_id",
    name: "my-folder",
    type: "folder",
    parent_id: "parent_id",
    created_at: "2022-10-20T12:00:00Z",
    modified_at: "2022-10-20T12:00:00Z",
    entries: []
}
*/
```

**Note:** When `parentId` is omitted, the root folder is used.

### Deleting Folders

```js
const store = new ObjectStore();
const folder = store.createFolder("my-folder");

store.deleteFolder(folder.id);
```

## Developer Setup

1. Fork the repository
2. Clone your fork
3. Run `npm install` to setup dependencies
4. Run `npm test` to run tests

## License

Apache 2.0
