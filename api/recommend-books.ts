import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Recommendation {
  id?: string;
  bookId: string;
  date: string;
  syncedToCloud: number;
  pagesRead: number;
  title: string;
  author: string;
  isbn: string;
  totalPages: number;
  summary: string;
  coverUrl?: string;
}

let genAI: GoogleGenerativeAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

const getCoverUrl = async (isbn: string): Promise<string> => {
  const response = await fetch(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`);
  return response.url;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const aiClient = getGenAI();
  if (!aiClient) return res.status(500).json({ error: 'Gemini API key not configured.' });

  const { books, genres } = req.body;

  // Build prompt based on mode
  const isExploreMode = genres && genres.length > 0;

  const prompt = isExploreMode
    ? `Recommend 6 highly regarded books in the following genre(s): ${genres.join(', ')}. 
Include a mix of classic and modern titles. For each book provide its 13-digit ISBN if you are highly confident.
Respond strictly in JSON format with the key "recommendations" (array of objects with keys "title" (string), "author" (string), "isbn" (string or null), "totalPages" (number or null), "summary" (string, 2 sentences max)). No markdown or backticks.`
    : `Provide a list of recommended books based on the user's reading history: ${books.map((b: { title: string; author: string }) => `${b.title} by ${b.author}`).join(', ')}.
If you are highly confident, provide its 13-digit ISBN.
Respond strictly in JSON format with the key "recommendations" (array of objects with keys "title" (string), "author" (string), "isbn" (string or null), "totalPages" (number or null), "summary" (string)). No markdown or backticks.`;

  try {
    let result;
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    let lastError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        const model = aiClient.getGenerativeModel({ model: modelName });
        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });
        break;
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying fallback...`);
        lastError = err;
      }
    }

    if (!result) throw lastError || new Error('All Gemini models failed.');

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    const coverUrls = await Promise.all(
      parsedData.recommendations.map(async (rec: Recommendation) => {
        if (!rec.isbn) return null;
        return getCoverUrl(rec.isbn);
      })
    );

    parsedData.recommendations.forEach((rec: Recommendation, i: number) => {
      rec.coverUrl = coverUrls[i] ?? undefined;
    });

    return res.status(200).json({ recommendations: parsedData.recommendations || [] });

  } catch (error: unknown) {
    console.error('Recommend API Error:', error);
    return res.status(500).json({ error: 'Failed to get recommendations.' });
  }
}