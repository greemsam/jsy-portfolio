const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function access({
    token = "session",
    uid = "owner",
    revoked = false,
    provider = "google.com",
    uids = "owner",
    origin = "https://example.com",
} = {}) {
    const context = {
        exports: {},
        Response,
        URL,
        process: {
            env: {
                NODE_ENV: "production",
                ADMIN_UIDS: uids,
                ADMIN_APP_ORIGIN: origin,
            },
        },
        require: (name) => {
            if (name === "server-only") return {};
            if (name === "next/headers")
                return {
                    cookies: async () => ({
                        get: () => (token ? { value: token } : undefined),
                    }),
                };
            if (name === "./firebase-admin")
                return {
                    adminAuth: {
                        verifySessionCookie: async (_, checkRevoked) => {
                            assert.equal(checkRevoked, true);
                            if (revoked) throw new Error("revoked");
                            return {
                                uid,
                                firebase: { sign_in_provider: provider },
                            };
                        },
                    },
                };
            throw new Error(name);
        },
    };
    vm.runInNewContext(
        ts.transpileModule(
            fs.readFileSync("src/__server/lib/admin-access.ts", "utf8"),
            {
                compilerOptions: {
                    module: ts.ModuleKind.CommonJS,
                    target: ts.ScriptTarget.ES2020,
                },
            },
        ).outputText,
        context,
    );
    return context.exports;
}

test("only an allowed Google account with valid session passes", async () => {
    assert.equal(await access().isAdmin(), true);
    for (const options of [
        { token: "" },
        { uid: "stranger" },
        { revoked: true },
        { uids: "" },
        { provider: "password" },
    ]) {
        assert.equal(await access(options).isAdmin(), false);
    }
});

test("mutation origin is required and fails closed in production", async () => {
    const request = (origin) =>
        new Request("https://example.com/api/posts", {
            headers: origin ? { origin } : {},
        });
    assert.equal(access().sameOrigin(request("https://example.com")), true);
    assert.equal(access().sameOrigin(request("https://evil.example")), false);
    assert.equal(access().sameOrigin(request()), false);
    assert.equal(
        access({ origin: "" }).sameOrigin(request("https://example.com")),
        false,
    );
    assert.equal(
        (await access().guardAdmin(request("https://evil.example"))).status,
        403,
    );
    assert.equal(
        (await access({ token: "" }).guardAdmin(request("https://example.com")))
            .status,
        401,
    );
});
