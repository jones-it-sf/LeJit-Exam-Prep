/** Join `import.meta.env.BASE_URL` + relative asset path safely */
export function assetPath(relativeFromPublicRoot: string): string {
  const raw = import.meta.env.BASE_URL;
  const base = raw.endsWith("/") ? raw : `${raw}/`;
  return `${base}${relativeFromPublicRoot.replace(/^\//, "")}`;
}
