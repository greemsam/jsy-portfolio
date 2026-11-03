const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadRoute(denied = false) {
    const writes = [];
    let committed = false;
    const db = {
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
