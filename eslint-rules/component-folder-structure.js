/**
 * Every component lives in its own folder as
 * `components/Foo/{index.ts, FooContainer.tsx, FooPresenter.tsx}`.
 *
 * The rule checks the two things a reader relies on: the file sits in a folder
 * that matches its own name, and the exported component matches the filename.
 * Missing siblings are reported on the files that do exist, since ESLint only
 * visits files that are linted.
 */

import path from "node:path";
import fs from "node:fs";

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "components/<Name>/ must contain index.ts, <Name>Container.tsx and <Name>Presenter.tsx",
    },
    schema: [],
    messages: {
      wrongFolder:
        "{{file}} は components/{{expected}}/ に置いてください（現在: {{actual}}）。",
      missingSibling:
        "components/{{dir}}/ に {{missing}} がありません。index.ts / Container / Presenter を揃えてください。",
      wrongExport:
        "{{file}} は {{expected}} を export してください（現在の export: {{actual}}）。",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const match = /[\\/]components[\\/]([^\\/]+)[\\/]([^\\/]+)$/.exec(filename);
    if (!match) return {};

    const [, dir, base] = match;
    const kind = /(Container|Presenter)\.[jt]sx?$/.exec(base)?.[1];
    if (!kind) return {}; // index.ts and tests are not checked here.

    const componentName = base.replace(/(Container|Presenter)\.[jt]sx?$/, "");

    return {
      Program(node) {
        if (componentName !== dir) {
          context.report({
            node,
            messageId: "wrongFolder",
            data: { file: base, expected: componentName, actual: dir },
          });
          return;
        }

        const folder = path.dirname(filename);
        const required = [
          "index.ts",
          `${dir}Container.tsx`,
          `${dir}Presenter.tsx`,
        ];
        for (const name of required) {
          if (!fs.existsSync(path.join(folder, name))) {
            context.report({
              node,
              messageId: "missingSibling",
              data: { dir, missing: name },
            });
          }
        }
      },

      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (decl?.type !== "FunctionDeclaration" || !decl.id) return;

        const expected = `${componentName}${kind}`;
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
