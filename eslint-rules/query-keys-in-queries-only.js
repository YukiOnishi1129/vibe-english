/**
 * queryKey must come from a key factory in a `queries/` module.
 *
 * Inline keys are how invalidation silently misses a cache entry: one place
 * writes ["chunks","today"], another writes ["chunk","today"], and neither
 * fails loudly. Defining keys in one module makes the set enumerable.
 */

const isQueriesFile = (filename) =>
  /[\\/]queries[\\/]/.test(filename) || /[\\/]queries\.[tj]sx?$/.test(filename);

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Only queries/ modules may define query keys; elsewhere use the key factory",
    },
    schema: [],
    messages: {
      inlineKey:
        "queryKey はここに直接書けません。queries/ のキーファクトリ（例: chunkKeys.today()）を使ってください。",
      inlineInvalidate:
        "invalidateQueries のキーも queries/ のファクトリ経由にしてください。",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isQueriesFile(filename)) return {};

    /** Flags array literals — a factory call is fine, a literal is not. */
    const checkKeyValue = (node, messageId) => {
      if (!node) return;
      if (node.type === "ArrayExpression") {
        context.report({ node, messageId });
      }
    };

    return {
      Property(node) {
        const key = node.key;
        const name = key?.name ?? key?.value;
        if (name !== "queryKey") return;

        const parent = node.parent?.parent;
        const callee = parent?.callee;
        const calleeName =
          callee?.name ?? callee?.property?.name ?? "";

        checkKeyValue(
          node.value,
          /invalidate|removeQueries|cancelQueries|refetchQueries/i.test(
            calleeName,
          )
            ? "inlineInvalidate"
            : "inlineKey",
        );
      },
    };
  },
};
