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
};

export type Me = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};
