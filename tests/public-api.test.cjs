const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

test("public posts route exposes only GET and returns public service data", async () => {
    const posts = [{ postId: "published" }];
    const context = {
        exports: {},
        Response,
        require: (name) => {
            if (!name.endsWith("post.service")) throw new Error(name);
            return { getPosts: async () => posts };
        },
    };
    vm.runInNewContext(
        ts.transpileModule(
            fs.readFileSync("src/app/api/posts/route.ts", "utf8"),
            {
                compilerOptions: { module: ts.ModuleKind.CommonJS },
            },
        ).outputText,
        context,
    );
    assert.deepEqual(Object.keys(context.exports), ["GET"]);
    const response = await context.exports.GET();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), posts);
});
