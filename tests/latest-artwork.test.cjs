const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const context = {
    exports: {},
    require: (name) =>
        name.includes("cssModules")
            ? { default: new Proxy({}, { get: (_, key) => key }) }
            : require(name),
};
vm.runInNewContext(
    ts.transpileModule(
        fs.readFileSync("src/__components/service/latestArtwork.tsx", "utf8"),
        {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                jsx: ts.JsxEmit.ReactJSX,
                target: ts.ScriptTarget.ES2020,
            },
        },
    ).outputText,
    context,
);
for (const count of [1, 2, 3, 4])
    test(`latest artwork renders ${count} thumbnails with matching layout and caption visibility`, () => {
        const candidates = Array.from({ length: count }, (_, index) => ({
            id: String(index),
            src: `/thumb-${index}.webp`,
            title: "Series",
            year: "2026",
            medium: "Oil",
            width: 10,
            height: 20,
            sizeUnit: "cm",
        }));
        const html = renderToStaticMarkup(
            React.createElement(context.exports.default, { candidates }),
        );
        assert.equal((html.match(/<img /g) || []).length, count);
        assert.equal(html.includes('class="artworkInfo"'), true);
        assert.equal(html.includes("Series (2026)"), true);
        assert.equal(html.includes("Oil, 10 X 20cm"), count === 1);
        assert.equal(html.includes("threeImages"), count === 3);
        assert.equal(html.includes("multiple"), count > 1);
    });
