import { assetPath } from "@/lib/paths";
import type { CatalogFile, QuestionPack } from "@/types/exam";

const cachedCatalog: { data?: CatalogFile } = {};
const packCache = new Map<string, Promise<QuestionPack>>();

export async function fetchCatalog(): Promise<CatalogFile> {
  if (cachedCatalog.data) return cachedCatalog.data;
  const res = await fetch(assetPath("content/catalog.json"));
  if (!res.ok) throw new Error("Could not load exam catalog.");
  const data = (await res.json()) as CatalogFile;
  cachedCatalog.data = data;
  return data;
}

export function fetchQuestionPack(examSlug: string): Promise<QuestionPack> {
  let p = packCache.get(examSlug);
  if (!p) {
    const path = `content/exams/${examSlug}/questions.json`;
    p = (async () => {
      const res = await fetch(assetPath(path));
      if (!res.ok) {
        throw new Error(`Questions for “${examSlug}” could not be loaded.`);
      }
      return res.json() as Promise<QuestionPack>;
    })();
    packCache.set(examSlug, p);
  }
  return p;
}
