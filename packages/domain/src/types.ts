/** Shapes shared by the Hono API and the React client. */

export type DrillType = "blank" | "translate";

export type ChunkExample = {
  id: string;
  english: string;
  japanese: string;
};

export type ChunkDrill = {
  id: string;
  type: DrillType;
  prompt: string;
  answer: string;
};

export type ChunkProgress = {
  seenCount: number;
  completedCount: number;
  lastSeenAt: string | null;
  lastCompletedAt: string | null;
};

/** What the learner reported after practising a chunk. */
export type DrillResult = "got_it" | "struggled";

export type Streak = {
  current: number;
  longest: number;
  practicedToday: boolean;
};

/** Today's queue plus the streak header. */
export type DailySession = {
  chunks: Chunk[];
  /** Completed today, out of `total`. */
  doneCount: number;
  total: number;
  streak: Streak;
};

export type ReviewGroup = {
  key: "struggled" | "hard";
  label: string;
  chunks: Chunk[];
};

export type Chunk = {
  id: string;
  phrase: string;
  meaningJa: string;
  situation: string;
  nuance: string;
  level: string | null;
  sortOrder: number;
  examples: ChunkExample[];
  drills: ChunkDrill[];
  progress: ChunkProgress | null;
  isHard: boolean;
  /** True when the latest reported result was "struggled". */
  needsReview: boolean;
};

export type Me = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};
