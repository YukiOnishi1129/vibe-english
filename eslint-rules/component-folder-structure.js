/**
 * Every component lives in its own folder under `components/`, as either
 *
 *   components/Foo/{index.ts, Foo.tsx}                        (presentational)
 *   components/Foo/{index.ts, FooContainer.tsx, FooPresenter.tsx}
 *
 * and nothing else. An earlier version only inspected files already named
 * *Container.tsx / *Presenter.tsx, so a bare `Foo.tsx` sitting loose in
 * `components/` was never checked at all — exactly the case it was meant to
 * catch. This one starts from every .tsx under components/.
 */

import path from "node:path";
import fs from "node:fs";

/** components/Foo/Bar.tsx -> {dir: "Foo", base: "Bar.tsx"}; null if not under components/. */
function locate(filename) {
  const match = /[\\/]components[\\/](.+)$/.exec(filename);
  if (!match) return null;

  const segments = match[1].split(/[\\/]/);
  if (segments.length === 1) {
    // Directly inside components/, with no folder of its own.
    return { dir: null, base: segments[0] };
  }
  return { dir: segments[segments.length - 2], base: segments[segments.length - 1] };
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "components/<Name>/ holds index.ts plus either <Name>.tsx or <Name>Container/<Name>Presenter",
    },
    schema: [],
    messages: {
      looseFile:
        "{{file}} を components/{{expected}}/ ディレクトリに入れてください（index.ts と一緒に）。",
      wrongFolder:
        "{{file}} は components/{{expected}}/ に置いてください（現在: {{actual}}）。",
      missingIndex:
        "components/{{dir}}/ に index.ts がありません。公開する入口を作ってください。",
      missingPair:
        "components/{{dir}}/ に {{missing}} がありません。Container と Presenter は対で用意してください。",
      wrongExport:
        "{{file}} は {{expected}} を export してください（現在の export: {{actual}}）。",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!/\.tsx$/.test(filename)) return {};

    const here = locate(filename);
    if (!here) return {};

    const { dir, base } = here;
    const suffix = /(Container|Presenter)\.tsx$/.exec(base)?.[1] ?? null;
    const componentName = base.replace(/(Container|Presenter)?\.tsx$/, "");

    return {
      Program(node) {
        // A .tsx sitting directly in components/ has no folder at all.
        if (dir === null) {
          context.report({
            node,
            messageId: "looseFile",
            data: { file: base, expected: componentName },
          });
          return;
        }

        if (componentName !== dir) {
          context.report({
            node,
            messageId: "wrongFolder",
            data: { file: base, expected: componentName, actual: dir },
          });
          return;
        }

        const folder = path.dirname(filename);
        if (!fs.existsSync(path.join(folder, "index.ts"))) {
          context.report({ node, messageId: "missingIndex", data: { dir } });
        }

        // Container and Presenter only make sense as a pair.
        if (suffix) {
          const counterpart =
            suffix === "Container"
              ? `${dir}Presenter.tsx`
              : `${dir}Container.tsx`;

          if (!fs.existsSync(path.join(folder, counterpart))) {
            context.report({
              node,
              messageId: "missingPair",
              data: { dir, missing: counterpart },
            });
          }
        }
      },

      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (decl?.type !== "FunctionDeclaration" || !decl.id) return;
        if (dir === null || componentName !== dir) return;

        const expected = `${componentName}${suffix ?? ""}`;
        if (decl.id.name !== expected) {
          context.report({
            node: decl.id,
            messageId: "wrongExport",
            data: { file: base, expected, actual: decl.id.name },
          });
        }
      },
    };
  },
};
