export interface Book {
  key: string;
  title: string;
  author: string;
  coverUrl?: string;
  firstPublished?: number;
  subjects?: string[];
}

export interface RatingCategory {
  score: number | null;  // 1–5 or null if not rated
  note: string;
}

export interface BookRatings {
  characters: RatingCategory;
  plot: RatingCategory;
  writingQuality: RatingCategory;
  enjoyability: RatingCategory;
  narrator: RatingCategory;
  generalNotes: string;
}

export const DEFAULT_RATINGS: BookRatings = {
  characters: { score: null, note: '' },
  plot: { score: null, note: '' },
  writingQuality: { score: null, note: '' },
  enjoyability: { score: null, note: '' },
  narrator: { score: null, note: '' },
  generalNotes: '',
};

export interface ProfileEntry {
  id: string;
  book: Book;
  ratings: BookRatings;
  addedAt: string;
}

export interface MatchResult {
  percentage: number;
  explanation: string;
  book: Book;
}

export interface MatchHistoryEntry {
  id: string;
  book: Book;
  percentage: number;
  explanation: string;
  createdAt: string;
}

export interface MatchFeedback {
  id: string;
  bookKey: string;
  bookTitle: string;
  bookAuthor: string;
  aiPercentage: number;
  /** true = user agrees, false = user disagrees, null = no vote */
  agrees: boolean | null;
  note: string;
  createdAt: string;
}

export interface TbrEntry {
  id: string;
  book: Book;
  addedAt: string;
}

export type AppView = 'profile' | 'tbr' | 'matchmaker' | 'reader';

export type ReadingFormat = 'audiobooks' | 'physical' | 'ebooks' | 'multiple';

export const READING_FORMATS: { value: ReadingFormat; label: string }[] = [
  { value: 'audiobooks', label: 'Audiobooks' },
  { value: 'physical', label: 'Physical Books' },
  { value: 'ebooks', label: 'E-books' },
  { value: 'multiple', label: 'Multiple Formats' },
];

export const BOOK_GENRES = [
  'Fantasy', 'Science Fiction', 'Mystery', 'Thriller', 'Romance',
  'Horror', 'Historical Fiction', 'Literary Fiction', 'Contemporary Fiction',
  'Dystopian', 'Paranormal', 'Adventure', 'Crime', 'Young Adult',
  'Non-Fiction', 'Biography & Memoir', 'True Crime', 'Self-Help',
  'Psychology', 'Philosophy', 'Science & Nature', 'History',
  'Business & Finance', 'Travel', 'Humour', 'Classic Literature',
] as const;

export interface ReaderProfile {
  booksPerYear: number;
  booksPerYearNotes: string;
  preferredFormat: ReadingFormat | '';
  preferredFormatNotes: string;
  preferredGenres: string[];
  preferredGenresNotes: string;
  typicallyEnjoy: string;
  typicallyDislike: string;
}

export const DEFAULT_READER_PROFILE: ReaderProfile = {
  booksPerYear: 12,
  booksPerYearNotes: '',
  preferredFormat: '',
  preferredFormatNotes: '',
  preferredGenres: [],
  preferredGenresNotes: '',
  typicallyEnjoy: '',
  typicallyDislike: '',
};

export const RATING_CATEGORIES: Array<{
  key: keyof Omit<BookRatings, 'generalNotes'>;
  label: string;
  description: string;
}> = [
  {
    key: 'characters',
    label: 'Characters',
    description: "Rate how much you enjoyed elements such as the protagonist or secondary characters' personalities, their development, and their overall likability",
  },
  {
    key: 'plot',
    label: 'Plot',
    description: 'Rate how much you enjoyed elements such as the plot structure, pacing, clarity, flow, familiarity, or creativity',
  },
  {
    key: 'writingQuality',
    label: 'Writing Quality',
    description: 'Rate how much you enjoyed elements such as the prose quality, the story format, the tonal consistency, or the character dialogue',
  },
  {
    key: 'enjoyability',
    label: 'Enjoyability',
    description: 'Rate how much you enjoyed the overall book based on elements such as excitement to continue reading, satisfaction with the ending, or how much you wanted to recommend this book to others',
  },
  {
    key: 'narrator',
    label: 'Audiobook Narrator',
    description: "Rate how much you enjoyed the narrator(s) performance",
  },
];
