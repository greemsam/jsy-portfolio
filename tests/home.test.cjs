const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadHome(docs, error, pages = []) {
    const calls = [];
    let reads = 0;
    const query = {
        get: async () => {
            reads += 1;
            if (reads === 1 && error) throw error;
            return { docs: error ? (pages.shift() ?? []) : docs };
        },
    };
    for (const method of [
        "collection",
        "where",
        "orderBy",
        "limit",
        "startAfter",
    ]) {
        query[method] = (...args) => {
            calls.push([method, ...args]);
            return query;
        };
    }
    const context = {
        exports: {},
        console: { warn: () => {} },
        require: () => ({ adminDb: query }),
    };
    vm.runInNewContext(
        ts.transpileModule(
            fs.readFileSync("src/__server/services/home.service.ts", "utf8"),
            { compilerOptions: { module: ts.ModuleKind.CommonJS } },
        ).outputText,
        context,
    );
    return { getHomeData: context.exports.getHomeData, calls };
}

test("home queries only the newest published artwork", async () => {
    const { getHomeData, calls } = loadHome([
        { id: "first", data: () => ({ title: "Artwork" }) },
    ]);
    const result = await getHomeData();
    assert.deepEqual(calls, [
        ["collection", "posts"],
        ["where", "published", "==", true],
        ["orderBy", "createdAt", "desc"],
        ["limit", 1],
    ]);
    assert.equal(result.artwork.postId, "first");
    assert.equal(result.artwork.title, "Artwork");
});

test("home returns null when no published artwork exists", async () => {
    const { getHomeData } = loadHome([]);
    assert.equal((await getHomeData()).artwork, null);
});

test("missing index falls back to paginated newest-first lookup and skips drafts", async () => {
    const drafts = Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        data: () => ({ published: false }),
    }));
    const published = {
        id: "public",
        data: () => ({ published: true, title: "Public" }),
    };
    const { getHomeData, calls } = loadHome(
        [],
        { code: 9, message: "The query requires an index." },
        [drafts, [published]],
    );
    assert.equal((await getHomeData()).artwork.postId, "public");
    assert.ok(
        calls.some(
            ([method, doc]) => method === "startAfter" && doc === drafts[19],
        ),
    );
});

test("authentication and other database errors are not hidden by fallback", async () => {
    const error = { code: 16, message: "Unauthenticated" };
    const { getHomeData } = loadHome([], error);
    await assert.rejects(getHomeData, (actual) => actual === error);
});

test("home returns thumbnail metadata without exposing displayUrl or mutating stored data", async () => {
    const image = {
        driveFileId: "one",
        thumbnailUrl: "thumb",
        displayUrl: "large",
    };
    const { getHomeData } = loadHome([
        { id: "one", data: () => ({ images: [image] }) },
    ]);
    const result = await getHomeData();
    assert.equal(result.artwork.images[0].thumbnailUrl, "thumb");
    assert.equal("displayUrl" in result.artwork.images[0], false);
    assert.equal(image.displayUrl, "large");
});
