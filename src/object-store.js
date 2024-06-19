/**
 * @fileoverview A utility for mimicking a cloud drive.
 */

/* global TextEncoder */

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

let nextId = 0;

/**
 * Represents an entry in the object store.
 * @abstract
 */
class Entry {
	/**
	 * A unique ID to represent the entry.
	 * @type {string}
	 */
	id = String(nextId++);

	/**
	 * The name of the entry.
	 * @type {string}
	 */
	#name;

	/**
	 * The type of the entry.
	 * @type {"file"|"folder"}
	 */
	type;

	/**
	 * The store to which the entry belongs.
	 * @type {ObjectStore}
	 */
	store;

	/**
	 * The date and time when the entry was created.
	 * @type {Date}
	 * @readonly
	 */
	createdAt = new Date();

	/**
	 * The date and time when the entry was last modified.
	 * @type {Date}
	 */
	modifiedAt = new Date();

	/**
	 * Creates a new instance.
	 * @param {string} name The name of the entry.
	 * @param {"file"|"folder"} type The type of the entry.
	 * @param {Object} options Additional options.
	 * @param {ObjectStore} options.store The store to which the entry belongs.
	 */
	constructor(name, type, { store }) {
		this.#name = name;
		this.type = type;
		this.store = store;
	}

	/**
	 * The name of the entry.
	 * @type {string}
	 */
	get name() {
		return this.#name;
	}

	/**
	 * Sets the name of the entry.
	 * @param {string} newName The new name of the entry.
	 */
	set name(newName) {
		this.#name = newName;
		this.modifiedAt = new Date();
	}

	/**
	 * Converts the entry to a JSON object.
	 * @returns {Object} The JSON object representing the entry.
	 */
	toJSON() {
		return this.toMiniJSON();
	}

	/**
	 * Converts the entry to a JSON object with minimal information.
	 * @returns {Object} The JSON object representing the entry.
	 */
	toMiniJSON() {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			parent_id: this.store.getParent(this.id)?.id,
			created_at: this.createdAt.toISOString(),
			modified_at: this.modifiedAt.toISOString(),
		};
	}
}

/**
 * Represents a file in the object store.
 */
class File extends Entry {
	/**
	 * The content of the file.
	 * @type {string|ArrayBuffer|undefined}
	 */
	#content;

	/**
	 * Creates a new instance.
	 * @param {string} name The name of the file.
	 * @param {string|ArrayBuffer|undefined} content The content of the file.
	 * @param {Object} options Additional options.
	 * @param {ObjectStore} options.store The store to which the file belongs.
	 * @param {string} [options.id] The ID of the file.
	 */
	constructor(name, content, { store, id }) {
		super(name, "file", { store });

		this.#content = content;

		if (id) {
			this.id = id;
		}
	}

	/**
	 * The content of the file.
	 * @type {string|ArrayBuffer|undefined}
	 */
	get content() {
		return this.#content;
	}

	/**
	 * Sets the content of the file.
	 * @param {string|ArrayBuffer|undefined} value The content of the file.
	 */
	set content(value) {
		this.#content = value;
		this.modifiedAt = new Date();
		this.store.getParent(this.id).modifiedAt = this.modifiedAt;
	}

	/**
	 * Retrieves the size of the content in bytes;
	 * @returns {number} The size of the content.
	 */
	get size() {
		if (!this.#content) {
			return 0;
		}

		if (this.#content instanceof ArrayBuffer) {
			return this.#content.byteLength;
		}

		const encoder = new TextEncoder();
		return encoder.encode(this.#content).byteLength;
	}

	/**
	 * Converts the file to a JSON object.
	 * @returns {Object} The JSON object representing the file.
	 * @override
	 */
	toMiniJSON() {
		return {
			...super.toMiniJSON(),
			size: this.size,
		};
	}
}

/**
 * Represents a folder in the object store.
 */
class Folder extends Entry {
	/**
	 * The entries in the folder.
	 * @type {Entry[]}
	 */
	#entries = [];

	/**
	 * Creates a new instance.
	 * @param {string} name The name of the folder.
	 * @param {Object} options Additional options.
	 * @param {ObjectStore} options.store The store to which the folder belongs.
	 * @param {Entry[]} [options.entries] The entries in the folder.
	 * @param {string} [options.id] The ID of the folder.
	 */
	constructor(name, { store, id, entries = [] }) {
		super(name, "folder", { store });

		this.#entries = entries;

		if (id) {
			this.id = id;
		}
	}

	/**
	 * Adds an entry to the folder.
	 * @param {Entry} entry The entry to add.
	 * @returns {void}
	 */
	add(entry) {
		this.#entries.push(entry);
		this.modifiedAt = new Date();
		entry.modifiedAt = new Date(this.modifiedAt);
	}

	/**
	 * Removes an entry from the folder.
	 * @param {Entry} entry The entry to remove.
	 * @returns {void}
	 */
	remove(entry) {
		this.#entries = this.#entries.filter(e => e.id !== entry.id);
		this.modifiedAt = new Date();
		entry.modifiedAt = new Date(this.modifiedAt);
	}

	/**
	 * Gets the entries iterator in the folder.
	 * @returns {IterableIterator<Entry>} The entries in the folder.
	 */
	entries() {
		return this.#entries.values();
	}

	/**
	 * Converts the folder to a JSON object.
	 * @returns {Object} The JSON object representing the folder.
	 */
	toJSON() {
		return {
			...super.toJSON(),
			entries: this.#entries.map(entry => entry.toMiniJSON()),
		};
	}
}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Represents an object store.
 */
export class ObjectStore {
	/**
	 * The root folder of the store.
	 * @type {Folder}
	 */
	#root;

	/**
	 * The objects in the store.
	 * @type {Map<string, Entry>}
	 */
	#objects = new Map();

	/**
	 * The parents of the objects in the store.
	 * @type {Map<string, Folder>}
	 */
	#parents = new Map();

	/**
	 * Creates a new instance.
	 * @param {Object} options Additional options.
	 * @param {string} [options.rootFolderId] The ID of the root folder.
	 */
	constructor({ rootFolderId } = {}) {
		this.#root = new Folder("root", { store: this, id: rootFolderId });
		this.#register(this.#root, undefined);
	}

	/**
	 * Registers an entry in the store.
	 * @param {Entry} entry The entry to register.
	 * @param {Folder|undefined} parent The ID of the parent folder.
	 * @returns {void}
	 */
	#register(entry, parent) {
		this.#parents.set(entry.id, parent);
		this.#objects.set(entry.id, entry);
		parent?.add(entry);
	}

	/**
	 * Unregisters an entry from the store.
	 * @param {Entry} entry The entry to unregister.
	 * @returns {void}
	 */
	#unregister(entry) {
		const parent = this.#parents.get(entry.id);
		this.#parents.delete(entry.id);
		this.#objects.delete(entry.id);
		parent.remove(entry);
	}

	/**
	 * Gets the parent of the given entry.
	 * @param {string} id The ID of the object to get the parent of.
	 * @returns {Folder|undefined} The parent of the object or `undefined` if not found.
	 */
	getParent(id) {
		return this.#parents.get(id);
	}

	//-----------------------------------------------------------------------------
	// Files
	//-----------------------------------------------------------------------------

	/**
	 * Creates a new file as a child of the given parent.
	 * @param {string} name The name of the file.
	 * @param {Object} [options] Additional options.
	 * @param {string} [options.parentId] The ID of the parent folder.
	 * @param {string|ArrayBuffer|undefined} [options.content] The content of the file.
	 * @returns {string} The ID of the file.
	 * @throws {Error} If the parent is not found or is not a folder.
	 */
	createFile(name, { parentId = this.#root.id, content } = {}) {
		const parent = this.#objects.get(parentId);

		if (!parent) {
			throw new TypeError("Parent not found.");
		}

		if (parent.type !== "folder") {
			throw new TypeError("Parent is not a folder.");
		}

		const file = new File(name, content, { store: this });

		this.#register(file, /** @type {Folder} */ (parent));

		return file.toJSON();
	}

	/**
	 * Gets the file record.
	 * @param {string} id The ID of the file.
	 * @returns {Object} The file record.
	 * @throws {Error} If the file is not found.
	 * @throws {Error} If the file is not a file.
	 */
	getFile(id) {
		const file = this.#objects.get(id);

		if (!file) {
			throw new TypeError("File not found.");
		}

		if (file.type !== "file") {
			throw new TypeError("Not a file.");
		}

		return file.toJSON();
	}

	/**
	 * Gets the content of a file.
	 * @param {string} id The ID of the file.
	 * @returns {string|ArrayBuffer|undefined} The content of the file.
	 * @throws {Error} If the file is not found.
	 * @throws {Error} If the file is not a file.
	 */
	getFileContent(id) {
		const file = this.#objects.get(id);

		if (!file) {
			throw new TypeError(`File "${id}" not found.`);
		}

		if (file.type !== "file") {
			throw new TypeError("Not a file.");
		}

		return /** @type {File} */ (file).content;
	}

	/**
	 * Updates a file.
	 * @param {string} id The ID of the file to update.
	 * @param {Object} options The options to update the file.
	 * @param {string} [options.name] The new name of the file.
	 * @param {string|ArrayBuffer|undefined} [options.content] The new content of the file.
	 * @param {string} [options.parentId] The ID of the new parent folder.
	 * @returns {Object} The updated file record.
	 * @throws {Error} If the file is not found.
	 * @throws {Error} If the file is not a file.
	 */
	updateFile(id, { name, content, parentId }) {
		const file = this.#objects.get(id);

		if (!file) {
			throw new TypeError("File not found.");
		}

		if (file.type !== "file") {
			throw new TypeError("Not a file.");
		}

		if (name) {
			file.name = name;
		}

		if (content) {
			/** @type {File} */ (file).content = content;
		}

		if (parentId) {
			const newParent = this.#objects.get(parentId);

			if (!newParent) {
				throw new TypeError(`Parent "${parentId}" not found.`);
			}

			if (newParent.type !== "folder") {
				throw new TypeError(`Parent "${parentId}" not a folder.`);
			}

			this.#parents.get(file.id).remove(file);
			this.#register(file, /** @type {Folder} */ (newParent));
		}

		return file.toJSON();
	}

	/**
	 * Deletes a file.
	 * @param {string} id The ID of the file to delete.
	 * @returns {void}
	 * @throws {Error} If the file is not found.
	 * @throws {Error} If the file is not a file.
	 */
	deleteFile(id) {
		const file = this.#objects.get(id);

		if (!file) {
			throw new TypeError("File not found.");
		}

		if (file.type !== "file") {
			throw new TypeError("Not a file.");
		}

		this.#unregister(file);
	}

	//-----------------------------------------------------------------------------
	// Folders
	//-----------------------------------------------------------------------------

	/**
	 * Creates a new folder as a child of the given parent.
	 * @param {string} name The name of the folder.
	 * @param {Object} [options] Additional options.
	 * @param {string} [options.parentId] The ID of the parent folder.
	 * @returns {string} The ID of the folder.
	 * @throws {Error} If the parent is not found or is not a folder.
	 */
	createFolder(name, { parentId = this.#root.id } = {}) {
		const parent = this.#objects.get(parentId);

		if (!parent) {
			throw new TypeError("Parent not found.");
		}

		if (parent.type !== "folder") {
			throw new TypeError("Parent is not a folder.");
		}

		const folder = new Folder(name, { store: this });

		this.#register(folder, /** @type {Folder} */ (parent));

		return folder.toJSON();
	}

	/**
	 * Gets the folder record.
	 * @param {string} id The ID of the folder.
	 * @returns {Object} The folder record.
	 */
	getFolder(id) {
		const folder = this.#objects.get(id);

		if (!folder) {
			throw new TypeError("Folder not found.");
		}

		if (folder.type !== "folder") {
			throw new TypeError("Not a folder.");
		}

		return folder.toJSON();
	}

	/**
	 * Updates a folder.
	 * @param {string} id The ID of the folder to update.
	 * @param {Object} options The options to update the folder.
	 * @param {string} [options.name] The new name of the folder.
	 * @param {string} [options.parentId] The ID of the new parent folder.
	 * @returns {Object} The updated folder record.
	 */
	updateFolder(id, { name, parentId }) {
		const folder = this.#objects.get(id);

		if (!folder) {
			throw new TypeError("Folder not found.");
		}

		if (folder.type !== "folder") {
			throw new TypeError("Not a folder.");
		}

		if (name) {
			folder.name = name;
		}

		if (parentId) {
			const newParent = this.#objects.get(parentId);

			if (!newParent) {
				throw new TypeError(`Parent "${parentId}" not found.`);
			}

			if (newParent.type !== "folder") {
				throw new TypeError(`Parent "${parentId}" not a folder.`);
			}

			this.#parents.get(folder.id).remove(folder);
			this.#register(folder, /** @type {Folder} */ (newParent));
		}

		return folder.toJSON();
	}

	/**
	 * Deletes a folder.
	 * @param {string} id The ID of the folder to delete.
	 * @returns {void}
	 * @throws {Error} If the folder is not found.
	 * @throws {Error} If the folder is not a folder.
	 */
	deleteFolder(id) {
		const folder = /** @type {Folder} */ (this.#objects.get(id));

		if (!folder) {
			throw new TypeError("Folder not found.");
		}

		if (folder.type !== "folder") {
			throw new TypeError("Not a folder.");
		}

		for (const entry of folder.entries()) {
			if (entry.type === "folder") {
				this.deleteFolder(entry.id);
			} else {
				this.deleteFile(entry.id);
			}
		}

		this.#unregister(folder);
	}
}
