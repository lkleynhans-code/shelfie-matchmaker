import OpenAI from 'openai';

export interface VisionConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface IdentifiedBook {
  title: string;
  author: string;
}

/**
 * Sends an image to the OpenAI vision API and returns ALL identified books.
 * Handles single covers, book spines on shelves, and multi-book photos.
 */
export async function identifyBooksFromImage(
  imageFile: File,
  config: VisionConfig,
): Promise<IdentifiedBook[]> {
  const base64DataUrl = await fileToBase64(imageFile);

  const clientOptions: ConstructorParameters<typeof OpenAI>[0] = {
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true,
  };

  if (config.baseUrl) {
    clientOptions.baseURL = config.baseUrl;
    clientOptions.defaultHeaders = { apikey: config.apiKey };
  }

  const client = new OpenAI(clientOptions);

  const response = await client.chat.completions.create({
    model: config.model ?? 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: base64DataUrl, detail: 'high' },
          },
          {
            type: 'text',
            text: `Look at this image and identify every book or audiobook visible. This may be a single cover, a bookshelf with spines, or a photo with multiple books. Return ONLY valid JSON in this exact format: {"books": [{"title": "...", "author": "..."}, ...]}. Include all books you can identify. If you cannot identify any books, return: {"books": []}`,
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 500,
    temperature: 0,
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as { books?: IdentifiedBook[] };
  return (parsed.books ?? []).filter((b) => b.title?.trim());
}
