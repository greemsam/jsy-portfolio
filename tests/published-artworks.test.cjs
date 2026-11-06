const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function loadService(docs = []) {
    const reads = [];
    const query = (filters = []) => ({
        where: (...filter) => query([...filters, filter]),
        select: () => query(filters),
        orderBy: () => query(filters),
        get: async () => {
            reads.push(filters);
            return { docs };
        },
    });
    const context = {
        exports: {},
        require: (name) =>
            name.endsWith("firebase-admin")
                ? { adminDb: { collection: () => query() } }
                : {},
    };
    vm.runInNewContext(
        ts.transpileModule(
            fs.readFileSync("src/__server/services/post.service.ts", "utf8"),
            {
                compilerOptions: {
                    module: ts.ModuleKind.CommonJS,
                    target: ts.ScriptTarget.ES2020,
                },
            },
        ).outputText,
        context,
    );
    return { ...context.exports, reads };
}
test("year query filters published and selected year in Firestore", async () => {
    const service = loadService();
    await service.getPublishedPosts("2026");
    assert.deepEqual(service.reads, [
        [
            ["published", "==", true],
            ["year", "==", "2026"],
        ],
    ]);
});
test("before 2012 queries legacy label and earlier numeric years", async () => {
    const service = loadService();
    await service.getPublishedPosts("before 2012");
    assert.deepEqual(service.reads, [
        [
            ["published", "==", true],
            ["year", "==", "before 2012"],
        ],
        [
            ["published", "==", true],
            ["year", ">=", "0000"],
            ["year", "<", "2012"],
        ],
    ]);
});
test("missing or invalid year is rejected before querying", async () => {
    const service = loadService();
    for (const year of [undefined, "", "invalid", "2026/01"]) {
        await assert.rejects(() => service.getPublishedPosts(year));
    }
    assert.equal(service.reads.length, 0);
});

test("admin and public reads omit displayUrl while preserving stored image data", async () => {
    const image = {
        driveFileId: "one",
        thumbnailUrl: "thumb",
        displayUrl: "large",
        description: "detail",
    };
    const service = loadService([
        { id: "one", data: () => ({ published: true, images: [image] }) },
    ]);
    for (const result of [
        await service.getPosts(),
        await service.getPublishedPosts("2026"),
    ]) {
        assert.equal(result[0].images[0].thumbnailUrl, "thumb");
        assert.equal(result[0].images[0].description, "detail");
        assert.equal("displayUrl" in result[0].images[0], false);
    }
    assert.equal(image.displayUrl, "large");
});
