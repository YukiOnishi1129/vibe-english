/**
 * One component per file.
 *
 * A file that defines several components hides them from the folder
 * structure: you cannot tell what exists without opening it, and the
 * "Container / Presenter in its own directory" convention stops being
 * checkable. Helper components get their own directory too.
 */

const isComponentName = (name) => /^[A-Z]/.test(name);

export default {
  meta: {
    type: "problem",
    docs: { description: "Each file declares at most one React component" },
    schema: [],
    messages: {
      extra:
        "1ファイル1コンポーネントにしてください。{{name}} は別ディレクトリに切り出してください（Container/Presenter になるなら components/{{name}}/ を作る）。",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!/\.tsx$/.test(filename)) return {};

    const found = [];

    /** A component returns JSX; this approximates that by name plus usage. */
    const record = (node, name) => {
      if (!name || !isComponentName(name)) return;
      found.push({ node, name });
    };

    return {
      FunctionDeclaration(node) {
        record(node.id, node.id?.name);
      },
      VariableDeclarator(node) {
        if (
          node.init?.type === "ArrowFunctionExpression" ||
          node.init?.type === "FunctionExpression"
        ) {
          record(node.id, node.id?.name);
        }
      },
      "Program:exit"() {
        for (const entry of found.slice(1)) {
          context.report({
            node: entry.node,
            messageId: "extra",
            data: { name: entry.name },
          });
        }
      },
    };
  },
};
