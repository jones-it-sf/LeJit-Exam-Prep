export interface CatalogEntry {
  slug: string;
  title: string;
  vendor: string;
  questionCount: number;
  domains?: string[];
}

export interface CatalogFile {
  exams: CatalogEntry[];
}

export interface Question {
  id: string;
  domain: string;
  stem: string;
  choices: string[];
  correctIndex: number;
  /** Set when the question accepts multiple correct answers (e.g. "Choose two."). */
  correctIndices?: number[];
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface QuestionPack {
  examSlug: string;
  questions: Question[];
}

export type PracticeMode = "study" | "exam";
