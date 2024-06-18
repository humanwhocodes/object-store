/**
 * @fileoverview Tests that Common JS can access npm package.
 */

const { ObjectStore } = require("../");
new ObjectStore();
console.log("CommonJS load: success");
