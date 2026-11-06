const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadRoute(denied = false, images = []) {
    const writes = [];
    let committed = false;
    const db = {
        runTransaction: async (callback) =>
            callback({
                get: async () => ({ exists: true, data: () => ({ images }) }),
                update: (ref, data) => writes.push({ id: ref.id, data }),
            }),
        collection: () => ({
            doc: (id) => ({
                id,
                update: async (data) => writes.push({ id, data }),
            }),
        }),
        batch: () => ({
            update: (ref, data) => writes.push({ id: ref.id, data }),
            commit: async () => {
                committed = true;
            },
        }),
    };
    const context = {
        exports: {},
        Response,
        require: (name) => {
            if (name.endsWith("admin-access"))
                return {
                    guardAdmin: async () =>
                        denied
                            ? Response.json({ success: false }, { status: 401 })
                            : null,
                };
            if (name.endsWith("firebase-admin")) return { adminDb: db };
            if (name === "firebase-admin/firestore")
                return { FieldValue: { serverTimestamp: () => "server-time" } };
            if (name.endsWith("post.service")) return {};
            throw new Error(name);
        },
    };
    const source = fs.readFileSync("src/app/api/posts/route.ts", "utf8");
    vm.runInNewContext(
        ts.transpileModule(source, {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2020,
            },
        }).outputText,
        context,
    );
    return {
        patch: (body) => context.exports.PATCH({ json: async () => body }),
        post: () => context.exports.POST({}),
        delete: () => context.exports.DELETE({}),
        writes,
        committed: () => committed,
    };
}

test("all mutations reject unauthenticated requests before accessing data", async () => {
    const route = loadRoute(true);
    assert.equal(
        (await route.patch({ postId: "one", published: true })).status,
        401,
    );
    assert.equal((await route.post()).status, 401);
    assert.equal((await route.delete()).status, 401);
    assert.equal(route.writes.length, 0);
});

test("single visibility change writes only published", async () => {
    const route = loadRoute();
    assert.equal(
        (await route.patch({ postId: "one", published: false })).status,
        200,
    );
    assert.equal(
        JSON.stringify(route.writes),
        JSON.stringify([{ id: "one", data: { published: false } }]),
    );
});

test("bulk visibility change ignores unrelated fields and deduplicates ids", async () => {
    const route = loadRoute();
    assert.equal(
        (
            await route.patch({
                postIds: ["one", "two", "one"],
                published: true,
                title: "unexpected",
            })
        ).status,
        200,
    );
    assert.equal(route.writes.length, 2);
    assert.ok(route.committed());
    for (const write of route.writes)
        assert.equal(JSON.stringify(write.data), '{"published":true}');
});

test("edit can save content and visibility together", async () => {
    const route = loadRoute();
    assert.equal(
        (
            await route.patch({
                postId: "one",
                title: "Updated",
                published: true,
            })
        ).status,
        200,
    );
    assert.equal(
        JSON.stringify(route.writes[0].data),
        JSON.stringify({
            title: "Updated",
            published: true,
            updatedAt: "server-time",
        }),
    );
});

test("invalid visibility or bulk ids do not write", async () => {
    for (const body of [
        { postId: "one", published: "false" },
        { postIds: [], published: true },
        { postIds: ["bad/id"], published: true },
        { postIds: Array(101).fill("one"), published: true },
        { postIds: ["one"] },
    ]) {
        const route = loadRoute();
        assert.equal((await route.patch(body)).status, 400);
        assert.equal(route.writes.length, 0);
    }
});

test("image metadata update preserves server image locations and other images", async () => {
    const route = loadRoute(false, [
        { driveFileId: "a", displayPath: "safe/a" },
        { driveFileId: "b", displayPath: "safe/b" },
    ]);
    const response = await route.patch({
        postId: "one",
        additionalDescription: "Review",
        images: [
            {
                driveFileId: "a",
                description: "Angle A",
                caption: "Front",
                displayPath: "injected",
            },
            { driveFileId: "b", description: "Angle B", caption: "Back" },
        ],
    });
    assert.equal(response.status, 200);
    assert.equal(route.writes[0].data.images[0].displayPath, "safe/a");
    assert.equal(route.writes[0].data.images[1].caption, "Back");
    assert.equal(route.writes[0].data.additionalDescription, "Review");
});
test("unknown, duplicate and invalid image metadata cannot overwrite images", async () => {
    for (const images of [
        [{ driveFileId: "unknown", description: "", caption: "" }],
        [{ driveFileId: "a", description: 1, caption: "" }],
        [
            { driveFileId: "a", description: "", caption: "" },
            { driveFileId: "a", description: "", caption: "" },
        ],
    ]) {
        const route = loadRoute(false, [
            { driveFileId: "a", displayPath: "safe" },
        ]);
        const response = await route.patch({ postId: "one", images });
        assert.ok([400, 409].includes(response.status));
        assert.equal(route.writes.length, 0);
    }
});

test("image materials and dimensions save without a free text caption", async () => {
    const route = loadRoute(false, [{ driveFileId: "a", displayPath: "safe" }]);
    const response = await route.patch({
        postId: "one",
        images: [
            {
                driveFileId: "a",
                description: "Detail",
                medium: "Oil",
                width: 30,
                height: 40,
                sizeUnit: "cm",
            },
        ],
    });
    assert.equal(response.status, 200);
    assert.equal(route.writes[0].data.images[0].medium, "Oil");
    assert.equal(route.writes[0].data.images[0].width, 30);
    assert.equal(route.writes[0].data.images[0].displayPath, "safe");
});
