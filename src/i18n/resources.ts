
type LocaleResources = Record<
  string,
  Record<string, Record<string, unknown>>
>;

const modules = import.meta.glob<{
  default: Record<string, unknown>;
}>("./locales/**/*.ts", {
  eager: true,
});

export const resources = Object.entries(modules).reduce<LocaleResources>(
  (acc, [key, module]) => {
    const match = key.match(/^\.\/locales\/([^/]+)\/(.+)\.ts$/);

    if (!match) return acc;

    const [, language, namespacePath] = match;
    const namespace = namespacePath.replace(/\//g, ".");

    acc[language] ??= {};
    acc[language][namespace] = module.default;

    return acc;
  },
  {}
);

export const defaultNS = "common";
