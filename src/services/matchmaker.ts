import OpenAI from 'openai';
import type { Book, ProfileEntry, MatchResult, ReaderProfile, MatchFeedback } from '../types';

function buildProfileSummary(profile: ProfileEntry[]): string {
  return profile
    .map((entry) => {
      const { book, ratings } = entry;
      const cats = [
        `Characters ${ratings.characters.score ?? '?'}/5${ratings.characters.note ? ` (${ratings.characters.note})` : ''}`,
        `Plot ${ratings.plot.score ?? '?'}/5${ratings.plot.note ? ` (${ratings.plot.note})` : ''}`,
        `Writing Quality ${ratings.writingQuality.score ?? '?'}/5${ratings.writingQuality.note ? ` (${ratings.writingQuality.note})` : ''}`,
        `Enjoyability ${ratings.enjoyability.score ?? '?'}/5${ratings.enjoyability.note ? ` (${ratings.enjoyability.note})` : ''}`,
        `Audiobook Narrator ${ratings.narrator.score ?? '?'}/5${ratings.narrator.note ? ` (${ratings.narrator.note})` : ''}`,
      ].join('; ');
      const general = ratings.generalNotes ? ` Notes: "${ratings.generalNotes}"` : '';
      return `- "${book.title}" by ${book.author}: ${cats}.${general}`;
    })
    .join('\n');
}

function buildReaderContext(rp: ReaderProfile): string {
  const lines: string[] = [];
  if (rp.booksPerYear > 0) {
    lines.push(`Reads approximately ${rp.booksPerYear} books per year${rp.booksPerYearNotes ? ` (${rp.booksPerYearNotes})` : ''}.`);
  }
  if (rp.preferredFormat) {
    const fmt = { audiobooks: 'Audiobooks', physical: 'Physical Books', ebooks: 'E-books', multiple: 'Multiple Formats' }[rp.preferredFormat];
    lines.push(`Preferred format: ${fmt}${rp.preferredFormatNotes ? ` (${rp.preferredFormatNotes})` : ''}.`);
  }
  if (rp.preferredGenres.length > 0) {
    lines.push(`Preferred genres: ${rp.preferredGenres.join(', ')}${rp.preferredGenresNotes ? ` (${rp.preferredGenresNotes})` : ''}.`);
  }
  if (rp.typicallyEnjoy) {
    lines.push(`Things they typically enjoy: ${rp.typicallyEnjoy}`);
  }
  if (rp.typicallyDislike) {
    lines.push(`Things they typically do not enjoy: ${rp.typicallyDislike}`);
  }
  return lines.join('\n');
}

export interface MatchmakerConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

function buildFeedbackContext(feedback: MatchFeedback[]): string {
  if (!feedback.length) return '';
  const lines = feedback.slice(0, 20).map((f) => {
    const stance = f.agrees === true ? 'agreed' : f.agrees === false ? 'disagreed' : 'no vote given';
    const note = f.note ? ` — reader's note: "${f.note}"` : '';
    return `- "${f.bookTitle}" by ${f.bookAuthor}: Matchmaker predicted ${f.aiPercentage}%, reader ${stance}${note}`;
  });
  return lines.join('\n');
}

export async function getMatchPercentage(
  config: MatchmakerConfig,
  targetBook: Book,
  profile: ProfileEntry[],
  readerProfile?: ReaderProfile,
  feedback?: MatchFeedback[],
): Promise<MatchResult> {
  const { apiKey, baseUrl, model = 'gpt-4o-mini' } = config;

  const clientOptions: ConstructorParameters<typeof OpenAI>[0] = {
    apiKey,
    dangerouslyAllowBrowser: true,
  };

  if (baseUrl) {
    clientOptions.baseURL = baseUrl;
    clientOptions.defaultHeaders = { apikey: apiKey };
  }

  const client = new OpenAI(clientOptions);

  const profileSummary = buildProfileSummary(profile);
  const readerContext = readerProfile ? buildReaderContext(readerProfile) : '';
  const feedbackContext = feedback?.length ? buildFeedbackContext(feedback) : '';

  const prompt = `You are a book recommendation expert. A reader has built a detailed taste profile.

## Their rated books (Characters, Plot, Writing Quality, Enjoyability, Narrator each out of 5):
${profileSummary}
${readerContext ? `\n## Their reader profile:\n${readerContext}` : ''}
${feedbackContext ? `\n## Their past feedback on Matchmaker predictions (use this to calibrate your assessment style):\n${feedbackContext}` : ''}

## Book to evaluate:
Title: "${targetBook.title}"
Author: ${targetBook.author}
${targetBook.subjects?.length ? `Subjects/Genres: ${targetBook.subjects.join(', ')}` : ''}

Based on the reader's rating patterns, notes, stated preferences, past feedback, and your knowledge of "${targetBook.title}", provide a match assessment.

Respond with ONLY valid JSON in this exact format:
{
  "percentage": <integer 0-100>,
  "explanation": "<2-4 sentences explaining why this percentage, referencing specific things from their profile and known qualities of the target book>"
}`;

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as { percentage: number; explanation: string };

  return {
    percentage: Math.max(0, Math.min(100, Math.round(parsed.percentage))),
    explanation: parsed.explanation ?? 'No explanation provided.',
    book: targetBook,
  };
}
