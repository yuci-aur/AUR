export interface University {
  id: string;
  name: string;
  location: string;
  overall: number;
  citations: number;
  employability: number;
  intlStudents: number;
  teaching: number;
  research: number;
  academicReputation?: number;
  employerReputation?: number;
  facultyStudentRatio?: number;
  subjects: string[];
  languages: string[];
  tuition: string;
  description: string;
  /** Rank calculated from the AUR overall-score ordering. */
  history: number[];
  /** Source dataset world rank, kept separate from the AUR rank. */
  worldRank?: number | null;
  rankChange?: number | null;
  programs: string[];
  campusPhoto: string;
  logo?: string;
  website?: string;
  hasMedicine: boolean;
  qsSubjectRankings?: {
    subject: string;
    worldRank: string;
    score: number;
  }[];
  isPublic?: boolean;
  hasScholarship?: boolean;
  founded?: number;
  studentCount?: number;
  facultyCount?: number;
  acceptanceRate?: number;
  applicationDeadline?: string;
  scholarshipDetails?: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  source: string;
  date: string;
  contentSummary: string;
  image: string;
  readTime?: string;
  content?: string;
  category?: string;
  tags?: string[];
}
