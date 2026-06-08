import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazily initialize the Gemini client to ensure process.env is fully loaded
let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
    }
  }
  return genAI;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Validate the API Key is configured
  const aiClient = getGenAI();
  if (!aiClient) {
    return res.status(500).json({
      error: 'Gemini API key is not configured on the server. Please set GEMINI_API_KEY.',
    });
  }

  const { books } = req.body;


  // 3. Validate request body
  if (books && books.length === 0) {
    return res.status(400).json({ error: 'Title and Author are required.' });
  }

    try {
    // 4. Call Gemini for a summary and ISBN-13 (using supported models)
    let result;
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = aiClient.getGenerativeModel({ model: modelName });
        
        const prompt = `Provide a list of recommended books based on the user's reading history: ${books.map(book => `${book.title} by ${book.author}`).join(', ')}". 
Also, if you are highly confident, provide its 13-digit ISBN. 
Respond strictly in JSON format with the keys "recommendations" (array of objects with the keys "title" (string), "author" (string), "isbn" (string or null), "pageCount" (number or null), "summary" (string)). Do not include any markdown formatting or backticks in your response.`;

        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });
        
        // If we succeeded, break out of the fallback loop!
        break;
      } catch (err: any) {
        console.warn(`Model ${modelName} failed, trying fallback...`, err.message || err);
        lastError = err;
      }
    }

    if (!result) {
      throw lastError || new Error('All Gemini models failed to respond.');
    }

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

      // 6. Return the enriched data
      return res.status(200).json({
        recommendations: parsedData.recommendations || []
      });

  } catch (error: any) {
    console.error('Enrichment API Error:', error);
    return res.status(500).json({
      error: 'Failed to get recommended book details.',
      details: error.message || error,
    });
  }
}