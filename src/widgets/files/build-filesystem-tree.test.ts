import { describe, expect, test } from "vitest";

import { buildFilesystemTree } from "./build-filesystem-tree.js";
import type { FilesystemEntryRow } from "@/queries";

const baseEntries: FilesystemEntryRow[] = [
	{
		id: "dir_docs",
		parent_id: null,
		path: "/docs/",
		display_name: "docs",
		kind: "directory",
	},
	{
		id: "dir_guides",
		parent_id: "dir_docs",
		path: "/docs/guides/",
		display_name: "guides",
		kind: "directory",
	},
	{
		id: "file_root",
		parent_id: null,
		path: "/README.md",
		display_name: "README.md",
		kind: "file",
	},
	{
		id: "file_nested",
		parent_id: "dir_guides",
		path: "/docs/guides/intro.md",
		display_name: "intro.md",
		kind: "file",
	},
];

describe("buildFilesystemTree", () => {
	test("nests directories and files with stable ordering", () => {
		const tree = buildFilesystemTree(baseEntries);
		expect(tree).toHaveLength(2);

		const [docs, rootFile] = tree;
		expect(docs.type).toBe("directory");
		if (docs.type === "directory") {
			expect(docs.path).toBe("/docs/");
			expect(docs).not.toHaveProperty("hidden");
			expect(docs.children).toHaveLength(1);
			const [guides] = docs.children;
			expect(guides.type).toBe("directory");
			if (guides.type === "directory") {
				expect(guides.children).toHaveLength(1);
				const [nestedFile] = guides.children;
				expect(nestedFile.type).toBe("file");
				expect(nestedFile.path).toBe("/docs/guides/intro.md");
				expect(nestedFile).not.toHaveProperty("hidden");
			}
		}

		expect(rootFile.type).toBe("file");
		if (rootFile.type === "file") {
			expect(rootFile.path).toBe("/README.md");
			expect(rootFile).not.toHaveProperty("hidden");
		}
	});

	test("keeps dot-prefixed paths as regular nodes", () => {
		const tree = buildFilesystemTree([
			{
				id: "dir_dot",
				parent_id: null,
				path: "/.lix/",
				display_name: ".lix",
				kind: "directory",
			},
			{
				id: "file_dot",
				parent_id: "dir_dot",
				path: "/.lix/config.json",
				display_name: "config.json",
				kind: "file",
			},
		]);

		const dotDir = tree.find(
			(node) => node.type === "directory" && node.path === "/.lix/",
		);
		expect(dotDir).toBeDefined();
		expect(dotDir).not.toHaveProperty("hidden");
		if (dotDir?.type === "directory") {
			expect(dotDir.children[0]?.path).toBe("/.lix/config.json");
			expect(dotDir.children[0]).not.toHaveProperty("hidden");
		}
	});
});
