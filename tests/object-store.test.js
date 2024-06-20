/**
 * @fileoverview Tests for the ObjectStore class.
 */
/*global describe, it, setTimeout, beforeEach, TextEncoder */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { ObjectStore } from "../src/object-store.js";
import assert from "node:assert";

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const ROOT_FOLDER_ID = "0";

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("ObjectStore", () => {
	let store;

	beforeEach(() => {
		store = new ObjectStore({ rootFolderId: ROOT_FOLDER_ID });
	});

	describe("Files", () => {
		describe("createFile()", () => {
			it("should create a new file at the root when no parentId is set", () => {
				const createdFile = store.createFile("foo.txt");
				const file = store.getFile(createdFile.id);

				assert.deepStrictEqual(file, createdFile);
				assert.strictEqual(file.name, "foo.txt");
				assert.strictEqual(file.size, 0);
				assert.strictEqual(file.id, createdFile.id);
				assert.strictEqual(file.type, "file");
				assert.strictEqual(file.created_at, file.modified_at);
				assert.strictEqual(file.parent_id, ROOT_FOLDER_ID);
			});

			it("should create a new file at the root with content", () => {
				const createdFile = store.createFile("foo.txt", {
					content: "Hello, world!",
				});
				const file = store.getFile(createdFile.id);

				assert.deepStrictEqual(file, createdFile);
				assert.strictEqual(file.name, "foo.txt");
				assert.strictEqual(file.size, 13);
				assert.strictEqual(file.id, createdFile.id);
				assert.strictEqual(file.type, "file");
				assert.strictEqual(file.created_at, file.modified_at);
				assert.strictEqual(file.parent_id, ROOT_FOLDER_ID);
			});

			it("should create a new file in a folder", () => {
				const folderId = store.createFolder("foo").id;
				const createdFile = store.createFile("bar.txt", {
					parentId: folderId,
				});
				const file = store.getFile(createdFile.id);

				assert.deepStrictEqual(file, createdFile);
				assert.strictEqual(file.name, "bar.txt");
				assert.strictEqual(file.size, 0);
				assert.strictEqual(file.id, createdFile.id);
				assert.strictEqual(file.type, "file");
				assert.strictEqual(file.created_at, file.modified_at);
				assert.strictEqual(file.parent_id, folderId);
			});

			it("should throw an error when the parent doesn't exist", () => {
				assert.throws(() => {
					store.createFile("foo.txt", { parentId: "123" });
				}, /Parent not found/u);
			});

			it("should throw an error when the parent ID is a file", () => {
				const parentId = store.createFile("foo.txt").id;
				assert.throws(() => {
					store.createFile("bar.txt", { parentId });
				}, /Parent is not a folder/u);
			});
		});

		describe("copyFile()", () => {
			it("should copy a file to a different folder", () => {
				const file = store.createFile("foo.txt", {
					content: "Hello, world!",
				});
				const folder = store.createFolder("bar");
				const copy = store.copyFile(file.id, { parentId: folder.id });

				assert.notStrictEqual(file.id, copy.id);
				assert.strictEqual(file.name, copy.name);
				assert.strictEqual(file.size, copy.size);
				assert.strictEqual(file.type, copy.type);
				assert.strictEqual(folder.id, copy.parent_id);
			});

			it("should copy a file to the same folder", () => {
				const folder = store.createFolder("foo");
				const file = store.createFile("bar.txt", {
					parentId: folder.id,
				});
				const copy = store.copyFile(file.id);

				assert.notStrictEqual(file.id, copy.id);
				assert.strictEqual(file.name, copy.name);
				assert.strictEqual(file.size, copy.size);
				assert.strictEqual(file.type, copy.type);
				assert.strictEqual(folder.id, copy.parent_id);
			});

			it("should copy a file and rename it", () => {
				const file = store.createFile("foo.txt", {
					content: "Hello, world!",
				});
				const folder = store.createFolder("bar");
				const copy = store.copyFile(file.id, {
					parentId: folder.id,
					name: "baz.txt",
				});

				assert.notStrictEqual(file.id, copy.id);
				assert.strictEqual(copy.name, "baz.txt");
				assert.strictEqual(file.size, copy.size);
				assert.strictEqual(file.type, copy.type);
				assert.strictEqual(folder.id, copy.parent_id);
			});

			it("should throw an error when the file doesn't exist", () => {
				assert.throws(() => {
					store.copyFile("123");
				}, /File "123" not found/u);
			});

			it("should throw an error when the object is a folder", () => {
				const folder = store.createFolder("foo");
				assert.throws(() => {
					store.copyFile(folder.id);
				}, /Not a file/u);
			});

			it("should throw an error when the parent doesn't exist", () => {
				const file = store.createFile("foo.txt");
				assert.throws(() => {
					store.copyFile(file.id, { parentId: "123" });
				}, /Parent not found/u);
			});

			it("should throw an error when the parent ID is a file", () => {
				const file = store.createFile("foo.txt");
				const parentId = store.createFile("bar.txt").id;
				assert.throws(() => {
					store.copyFile(file.id, { parentId });
				}, /Parent is not a folder/u);
			});
		});

		describe("getFile()", () => {
			it("should return a file", () => {
				const file = store.createFile("foo.txt");
				const retrievedFile = store.getFile(file.id);
				assert.deepStrictEqual(file, retrievedFile);
			});

			it("should throw an error when the file doesn't exist", () => {
				assert.throws(() => {
					store.getFile("123");
				}, /File not found/u);
			});

			it("should throw an error when the ID is a folder", () => {
				const folder = store.createFolder("foo");
				assert.throws(() => {
					store.getFile(folder.id);
				}, /Not a file/u);
			});
		});

		describe("getFileContent()", () => {
			it("should return a file's content as a string", () => {
				const file = store.createFile("foo.txt", {
					content: "Hello, world!",
				});
				const content = store.getFileContent(file.id);
				assert.strictEqual(content, "Hello, world!");
			});

			it("should return a file's content as a buffer", () => {
				const encoder = new TextEncoder();
				const file = store.createFile("foo.txt", {
					content: encoder.encode("Hello, world!").buffer,
				});
				const content = store.getFileContent(file.id, {
					asBuffer: true,
				});
				assert.deepStrictEqual(
					content,
					encoder.encode("Hello, world!").buffer,
				);
			});

			it("should throw an error when the file doesn't exist", () => {
				assert.throws(() => {
					store.getFileContent("123");
				}, /File "123" not found/u);
			});

			it("should throw an error when the ID is a folder", () => {
				const folder = store.createFolder("foo");
				assert.throws(() => {
					store.getFileContent(folder.id);
				}, /Not a file/u);
			});
		});

		describe("updateFile()", () => {
			it("should update a file's name", done => {
				const file = store.createFile("foo.txt");

				setTimeout(() => {
					store.updateFile(file.id, { name: "bar.txt" });
					const updatedFile = store.getFile(file.id);
					assert.strictEqual(updatedFile.name, "bar.txt");
					assert.notStrictEqual(
						updatedFile.created_at,
						updatedFile.modified_at,
					);
					assert.notStrictEqual(
						file.modified_at,
						updatedFile.modified_at,
					);
					done();
				}, 0);
			});

			it("should update a file's content with a string", done => {
				const file = store.createFile("foo.txt");

				setTimeout(() => {
					store.updateFile(file.id, { content: "Hello, world!" });
					const updatedFile = store.getFile(file.id);
					assert.strictEqual(updatedFile.size, 13);
					assert.notStrictEqual(
						updatedFile.created_at,
						updatedFile.modified_at,
					);
					assert.notStrictEqual(
						file.modified_at,
						updatedFile.modified_at,
					);
					done();
				}, 0);
			});

			it("should update a file's content with a buffer", done => {
				const file = store.createFile("foo.txt");
				const buffer = new TextEncoder().encode("Hello, world!").buffer;

				setTimeout(() => {
					store.updateFile(file.id, { content: buffer });
					const updatedFile = store.getFile(file.id);
					assert.strictEqual(updatedFile.size, 13);
					assert.notStrictEqual(
						updatedFile.created_at,
						updatedFile.modified_at,
					);
					assert.notStrictEqual(
						file.modified_at,
						updatedFile.modified_at,
					);
					done();
				}, 0);
			});

			it("should update a file's name and content", done => {
				const file = store.createFile("foo.txt");

				setTimeout(() => {
					store.updateFile(file.id, {
						name: "bar.txt",
						content: "Hello, world!",
					});
					const updatedFile = store.getFile(file.id);
					assert.strictEqual(updatedFile.name, "bar.txt");
					assert.strictEqual(updatedFile.size, 13);
					assert.notStrictEqual(
						updatedFile.created_at,
						updatedFile.modified_at,
					);
					assert.notStrictEqual(
						file.modified_at,
						updatedFile.modified_at,
					);
					done();
				}, 0);
			});

			it("should update a file's parent folder", done => {
				const folder1 = store.createFolder("foo");
				const folder2 = store.createFolder("bar");
				const file = store.createFile("baz.txt", {
					parentId: folder1.id,
				});

				setTimeout(() => {
					store.updateFile(file.id, { parentId: folder2.id });
					const updatedFile = store.getFile(file.id);

					assert.strictEqual(updatedFile.parent_id, folder2.id);
					assert.notStrictEqual(
						updatedFile.created_at,
						updatedFile.modified_at,
					);
					assert.notStrictEqual(
						file.modified_at,
						updatedFile.modified_at,
					);

					const updatedFolder1 = store.getFolder(folder1.id);
					assert.strictEqual(updatedFolder1.entries.length, 0);

					const updatedFolder2 = store.getFolder(folder2.id);
					assert.strictEqual(updatedFolder2.entries.length, 1);
					done();
				}, 0);
			});

			it("should throw an error when the file doesn't exist", () => {
				assert.throws(() => {
					store.updateFile("123", { name: "foo.txt" });
				}, /File not found/u);
			});

			it("should throw an error when the ID is a folder", () => {
				const folder = store.createFolder("foo");
				assert.throws(() => {
					store.updateFile(folder.id, { name: "bar.txt" });
				}, /Not a file/u);
			});
		});

		describe("deleteFile()", () => {
			it("should delete a file", () => {
				const file = store.createFile("foo.txt");
				store.deleteFile(file.id);
				assert.throws(() => {
					store.getFile(file.id);
				}, /File not found/u);
			});

			it("should delete a file in a folder", () => {
				const folderId = store.createFolder("foo").id;
				const file = store.createFile("bar.txt", {
					parentId: folderId,
				});
				store.deleteFile(file.id);
				assert.throws(() => {
					store.getFile(file.id);
				}, /File not found/u);
			});

			it("should throw an error when the file doesn't exist", () => {
				assert.throws(() => {
					store.deleteFile("123");
				}, /File not found/u);
			});

			it("should throw an error when the object is a folder", () => {
				const folder = store.createFolder("foo");
				assert.throws(() => {
					store.deleteFile(folder.id);
				}, /Not a file/u);
			});
		});
	});

	describe("Folders", () => {
		describe("createFolder()", () => {
			it("should create a new folder at the root when no parentId is set", () => {
				const createdFolder = store.createFolder("foo");
				const folder = store.getFolder(createdFolder.id);

				assert.deepStrictEqual(folder, createdFolder);
				assert.strictEqual(folder.name, "foo");
				assert.strictEqual(folder.id, createdFolder.id);
				assert.strictEqual(folder.type, "folder");
				assert.strictEqual(folder.created_at, folder.modified_at);
				assert.strictEqual(folder.parent_id, ROOT_FOLDER_ID);
			});

			it("should create a new folder in a folder", () => {
				const folderId = store.createFolder("foo").id;
				const createdFolder = store.createFolder("bar", {
					parentId: folderId,
				});
				const folder = store.getFolder(createdFolder.id);

				assert.deepStrictEqual(folder, createdFolder);
				assert.strictEqual(folder.name, "bar");
				assert.strictEqual(folder.id, createdFolder.id);
				assert.strictEqual(folder.type, "folder");
				assert.strictEqual(folder.created_at, folder.modified_at);
				assert.strictEqual(folder.parent_id, folderId);
			});

			it("should throw an error when the parent doesn't exist", () => {
				assert.throws(() => {
					store.createFolder("foo", { parentId: "123" });
				}, /Parent not found/u);
			});

			it("should throw an error when the parent ID is a file", () => {
				const parentId = store.createFile("foo.txt").id;
				assert.throws(() => {
					store.createFolder("bar", { parentId });
				}, /Parent is not a folder/u);
			});
		});

		describe("copyFolder()", () => {
			it("should copy a folder to the same folder", () => {
				const folder = store.createFolder("foo");
				const subfolder = store.createFolder("bar", {
					parentId: folder.id,
				});
				const copy = store.copyFolder(subfolder.id);

				assert.notStrictEqual(subfolder.id, copy.id);
				assert.strictEqual(subfolder.name, copy.name);
				assert.strictEqual(subfolder.type, copy.type);
				assert.strictEqual(subfolder.parent_id, copy.parent_id);
				assert.strictEqual(copy.parent_id, folder.id);
				assert.strictEqual(
					subfolder.entries.length,
					copy.entries.length,
				);
			});

			it("should copy a folder to a different folder", () => {
				const folder1 = store.createFolder("foo");
				const folder2 = store.createFolder("bar");
				const subfolder = store.createFolder("baz", {
					parentId: folder1.id,
				});
				const copy = store.copyFolder(subfolder.id, {
					parentId: folder2.id,
				});

				assert.notStrictEqual(subfolder.id, copy.id);
				assert.strictEqual(subfolder.name, copy.name);
				assert.strictEqual(subfolder.type, copy.type);
				assert.strictEqual(copy.parent_id, folder2.id);
				assert.strictEqual(copy.parent_id, folder2.id);
				assert.strictEqual(
					subfolder.entries.length,
					copy.entries.length,
				);
			});

			it("should copy a folder and rename it", () => {
				const folder = store.createFolder("foo");
				const subfolder = store.createFolder("bar", {
					parentId: folder.id,
				});
				const copy = store.copyFolder(subfolder.id, { name: "baz" });

				assert.notStrictEqual(subfolder.id, copy.id);
				assert.strictEqual(copy.name, "baz");
				assert.strictEqual(subfolder.type, copy.type);
				assert.strictEqual(copy.parent_id, folder.id);
				assert.strictEqual(
					subfolder.entries.length,
					copy.entries.length,
				);
			});

			it("should copy a folder and all of its entries", () => {
				const folder = store.createFolder("foo");
				store.createFile("bar.txt", { parentId: folder.id });
				const subfolder = store.createFolder("baz", {
					parentId: folder.id,
				});
				store.createFile("qux.txt", { parentId: subfolder.id });

				const copy = store.copyFolder(folder.id);

				// get updated entries
				const originalFolder = store.getFolder(folder.id);

				assert.notStrictEqual(originalFolder.id, copy.id);
				assert.strictEqual(originalFolder.name, copy.name);
				assert.strictEqual(originalFolder.type, copy.type);
				assert.strictEqual(copy.parent_id, ROOT_FOLDER_ID);
				assert.strictEqual(
					originalFolder.entries.length,
					copy.entries.length,
				);
				assert.strictEqual(
					originalFolder.entries[0].name,
					copy.entries[0].name,
				);
				assert.strictEqual(
					originalFolder.entries[1].name,
					copy.entries[1].name,
				);

				// get the subfolder entries
				const originalSubfolder = store.getFolder(subfolder.id);
				const copiedSubfolder = store.getFolder(copy.entries[1].id);

				assert.notStrictEqual(originalSubfolder.id, copiedSubfolder.id);
				assert.strictEqual(
					originalSubfolder.name,
					copiedSubfolder.name,
				);
				assert.strictEqual(
					originalSubfolder.type,
					copiedSubfolder.type,
				);
				assert.strictEqual(copiedSubfolder.parent_id, copy.id);
				assert.strictEqual(
					originalSubfolder.entries.length,
					copiedSubfolder.entries.length,
				);
				assert.strictEqual(
					originalSubfolder.entries[0].name,
					copiedSubfolder.entries[0].name,
				);
			});

			it("should throw an error when the folder doesn't exist", () => {
				assert.throws(() => {
					store.copyFolder("123");
				}, /Folder "123" not found/u);
			});

			it("should throw an error when the object is a file", () => {
				const file = store.createFile("foo.txt");
				assert.throws(() => {
					store.copyFolder(file.id);
				}, /Not a folder/u);
			});

			it("should throw an error when the parent doesn't exist", () => {
				const folder = store.createFolder("foo");
				assert.throws(() => {
					store.copyFolder(folder.id, { parentId: "123" });
				}, /Parent not found/u);
			});

			it("should throw an error when the parent ID is a file", () => {
				const folder = store.createFolder("foo");
				const parentId = store.createFile("bar.txt").id;
				assert.throws(() => {
					store.copyFolder(folder.id, { parentId });
				}, /Parent is not a folder/u);
			});
		});

		describe("getFolder()", () => {
			it("should return a folder", () => {
				const folder = store.createFolder("foo");
				const retrievedFolder = store.getFolder(folder.id);
				assert.deepStrictEqual(folder, retrievedFolder);
			});

			it("should return a folder with multiple entries", () => {
				const folder = store.createFolder("foo");
				store.createFile("bar.txt", { parentId: folder.id });
				store.createFolder("baz", { parentId: folder.id });

				const retrievedFolder = store.getFolder(folder.id);
				assert.strictEqual(retrievedFolder.entries.length, 2);

				// folder entries should not have an entries key to avoid deep recursion
				assert.strictEqual(
					retrievedFolder.entries[0].entries,
					undefined,
				);
				assert.strictEqual(
					retrievedFolder.entries[1].entries,
					undefined,
				);
			});

			it("should throw an error when the folder doesn't exist", () => {
				assert.throws(() => {
					store.getFolder("123");
				}, /Folder not found/u);
			});

			it("should throw an error when the ID is a file", () => {
				const file = store.createFile("foo.txt");
				assert.throws(() => {
					store.getFolder(file.id);
				}, /Not a folder/u);
			});
		});

		describe("updateFolder()", () => {
			it("should update a folder's name", done => {
				const folder = store.createFolder("foo");

				setTimeout(() => {
					store.updateFolder(folder.id, { name: "bar" });
					const updatedFolder = store.getFolder(folder.id);
					assert.strictEqual(updatedFolder.name, "bar");
					assert.notStrictEqual(
						updatedFolder.created_at,
						updatedFolder.modified_at,
					);
					assert.notStrictEqual(
						folder.modified_at,
						updatedFolder.modified_at,
					);
					done();
				}, 0);
			});

			it("should update a folder's parent folder", done => {
				const folder1 = store.createFolder("foo");
				const folder2 = store.createFolder("bar");
				const subfolder = store.createFolder("baz", {
					parentId: folder1.id,
				});

				setTimeout(() => {
					store.updateFolder(subfolder.id, { parentId: folder2.id });
					const updatedFolder = store.getFolder(subfolder.id);

					assert.strictEqual(updatedFolder.parent_id, folder2.id);
					assert.notStrictEqual(
						updatedFolder.created_at,
						updatedFolder.modified_at,
					);
					assert.notStrictEqual(
						subfolder.modified_at,
						updatedFolder.modified_at,
					);

					const updatedFolder1 = store.getFolder(folder1.id);
					assert.strictEqual(updatedFolder1.entries.length, 0);

					const updatedFolder2 = store.getFolder(folder2.id);
					assert.strictEqual(updatedFolder2.entries.length, 1);
					done();
				}, 0);
			});

			it("should throw an error when the folder doesn't exist", () => {
				assert.throws(() => {
					store.updateFolder("123", { name: "foo" });
				}, /Folder not found/u);
			});

			it("should throw an error when the ID is a file", () => {
				const file = store.createFile("foo.txt");
				assert.throws(() => {
					store.updateFolder(file.id, { name: "bar" });
				}, /Not a folder/u);
			});
		});

		describe("deleteFolder()", () => {
			it("should delete a folder", () => {
				const folder = store.createFolder("foo");
				store.deleteFolder(folder.id);
				assert.throws(() => {
					store.getFolder(folder.id);
				}, /Folder not found/u);
			});

			it("should delete a folder with entries", () => {
				const folder = store.createFolder("foo");
				store.createFile("bar.txt", { parentId: folder.id });
				store.createFolder("baz", { parentId: folder.id });

				store.deleteFolder(folder.id);
				assert.throws(() => {
					store.getFolder(folder.id);
				}, /Folder not found/u);
			});

			it("should delete a folder and all of its entries", () => {
				const folder = store.createFolder("foo");
				const file = store.createFile("bar.txt", {
					parentId: folder.id,
				});
				const subfolder = store.createFolder("baz", {
					parentId: folder.id,
				});
				store.createFile("qux.txt", { parentId: subfolder.id });

				store.deleteFolder(folder.id);
				assert.throws(() => {
					store.getFolder(folder.id);
				}, /Folder not found/u);
				assert.throws(() => {
					store.getFile(file.id);
				}, /File not found/u);
				assert.throws(() => {
					store.getFolder(subfolder.id);
				}, /Folder not found/u);
			});

			it("should throw an error when the folder doesn't exist", () => {
				assert.throws(() => {
					store.deleteFolder("123");
				}, /Folder not found/u);
			});

			it("should throw an error when the object is a file", () => {
				const file = store.createFile("foo.txt");
				assert.throws(() => {
					store.deleteFolder(file.id);
				}, /Not a folder/u);
			});
		});
	});
});
