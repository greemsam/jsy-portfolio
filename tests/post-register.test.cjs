const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function setup() {
    const states = [];
    let cursor = 0;
    let request;
    const Metadata = () => null;
    const context = {
        exports: {},
        fetch: async (url, options) => {
            request = JSON.parse(options.body);
            return { ok: true, json: async () => ({ success: true }) };
        },
        require(name) {
            if (name === "@/__types/artwork") return { MAX_POST_IMAGES: 4 };
            if (name === "react")
                return {
                    useState(initial) {
                        const i = cursor++;
                        if (!(i in states))
                            states[i] =
                                typeof initial === "function"
                                    ? initial()
                                    : initial;
                        return [
                            states[i],
                            (value) => {
                                states[i] =
                                    typeof value === "function"
                                        ? value(states[i])
                                        : value;
                            },
                        ];
                    },
                    useRef(initial) {
                        const i = cursor++;
                        return (states[i] ??= { current: initial });
                    },
                    useCallback: (fn) => fn,
                    useEffect() {},
                };
            if (name === "react/jsx-runtime") return require(name);
            if (name.includes("cssModules"))
                return { default: new Proxy({}, { get: (_, key) => key }) };
            if (name.includes("imageMetadataFields"))
                return { default: Metadata };
            return { default: () => null };
        },
    };
    vm.runInNewContext(
        ts.transpileModule(
            fs.readFileSync("src/__components/admin/postRegister.tsx", "utf8"),
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
    const files = ["a", "b", "c", "d", "e"].map((id) => ({
        id,
        name: id,
        mimeType: "image/png",
    }));
    const render = () => {
        cursor = 0;
        return context.exports.default({
            driveFiles: [{ year: "2026", files }],
            onClose() {},
        });
    };
    const all = (node, predicate) => {
        if (!node || typeof node !== "object") return [];
        if (Array.isArray(node))
            return node.flatMap((child) => all(child, predicate));
        return [
            ...(predicate(node) ? [node] : []),
            ...all(node.props?.children, predicate),
        ];
    };
    const find = (predicate) => all(render(), predicate)[0];
    const button = (label) =>
        find(
            (node) =>
                node.type === "button" &&
                (node.props["aria-label"] === label ||
                    node.props.children === label),
        );
    const settle = () => {
        for (const node of all(
            render(),
            (node) => typeof node.type === "function" && node.props.file,
        ))
            node.props.onSettled(node.props.file.id);
    };
    return {
        render,
        all,
        find,
        button,
        settle,
        Metadata,
        request: () => request,
    };
}

test("add, select, reselect and remove keep independent image metadata", () => {
    const ui = setup();
    ui.button("이미지 추가").props.onClick();
    assert.ok(
        ui.find(
            (n) => n.type === "select" && n.props["aria-label"] === "제작년도",
        ),
    );
    ui.button("a").props.onClick();
    assert.equal(
        ui.find((n) => n.type === "select"),
        undefined,
    );
    ui.find((n) => n.type === ui.Metadata).props.onChange({
        description: "detail",
        medium: "Oil",
        width: 10,
        height: 20,
        sizeUnit: "cm",
    });
    ui.button("다시 선택").props.onClick();
    ui.button("b").props.onClick();
    assert.equal(
        ui.find((n) => n.type === ui.Metadata).props.value.description,
        "detail",
    );
    ui.button("이미지 추가").props.onClick();
    assert.equal(ui.button("b").props.disabled, true);
    ui.button("a").props.onClick();
    assert.equal(ui.all(ui.render(), (n) => n.type === ui.Metadata).length, 2);
    ui.button("이미지 1 삭제").props.onClick();
    assert.equal(ui.all(ui.render(), (n) => n.type === ui.Metadata).length, 1);
    assert.equal(
        ui.find((n) => n.type === ui.Metadata).props.value.description,
        "",
    );
});

test("registration waits for selection and preview then submits chosen image metadata", async () => {
    const ui = setup();
    assert.equal(ui.button("등록").props.disabled, true);
    ui.button("이미지 추가").props.onClick();
    assert.equal(ui.button("등록").props.disabled, true);
    ui.button("a").props.onClick();
    ui.settle();
    assert.equal(ui.button("등록").props.disabled, false);
    await ui.button("등록").props.onClick();
    assert.equal(ui.request().images[0].id, "a");
    assert.equal(ui.request().year, "2026");
    assert.equal(ui.request().images[0].sizeUnit, "mm");
});

test("four images disable adding and removing one allows adding again", () => {
    const ui = setup();
    for (const name of ["a", "b", "c", "d"]) {
        ui.button("이미지 추가").props.onClick();
        ui.button(name).props.onClick();
    }
    assert.equal(ui.button("이미지 추가").props.disabled, true);
    ui.button("이미지 추가").props.onClick();
    assert.equal(ui.all(ui.render(), (n) => n.type === ui.Metadata).length, 4);
    assert.equal(
        ui.find((n) => n.type === "select"),
        undefined,
    );
    ui.button("이미지 1 삭제").props.onClick();
    assert.equal(ui.button("이미지 추가").props.disabled, false);
});
test("server rejects five images before image processing or database access", async () => {
    const context = {
        exports: {},
        Response,
        require: (name) =>
            name === "@/__types/artwork"
                ? { MAX_POST_IMAGES: 4 }
                : new Proxy(
                      {},
                      {
                          get: () => () => {
                              throw new Error("Unexpected external access");
                          },
                      },
                  ),
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
    const response = await context.exports.postArtworks({
        json: async () => ({
            images: Array.from({ length: 5 }, (_, i) => ({ id: String(i) })),
        }),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).success, false);
});
