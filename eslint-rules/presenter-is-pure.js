/**
 * Presenters render; they do not fetch.
 *
 * A presenter that reaches for the API or a query hook stops being testable
 * with plain props, and the container/presenter split quietly stops meaning
 * anything. Local UI state (useState for a reveal toggle) is still fine.
 */

const FORBIDDEN_HOOKS = new Set([
  "useQuery",
  "useMutation",
  "useQueryClient",
  "useInfiniteQuery",
  "useSuspenseQuery",
]);

const FORBIDDEN_IMPORT = /@vibe-english\/api-client|[\\/]queries[\\/]|@\/shared\/api$/;

export default {
  meta: {
    type: "problem",
    docs: { description: "Presenters must stay free of data fetching" },
    schema: [],
    messages: {
      noFetchHook:
        "Presenter では {{name}} を使えません。Container か hooks に移してください。",
      noApiImport:
        "Presenter から API/queries を import できません。props で受け取ってください。",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!/Presenter\.[jt]sx?$/.test(filename)) return {};

    return {
      ImportDeclaration(node) {
        if (FORBIDDEN_IMPORT.test(node.source.value)) {
          context.report({ node, messageId: "noApiImport" });
        }
      },
      CallExpression(node) {
        const name = node.callee?.name;
        if (name && FORBIDDEN_HOOKS.has(name)) {
          context.report({ node, messageId: "noFetchHook", data: { name } });
        }
      },
    };
  },
};
