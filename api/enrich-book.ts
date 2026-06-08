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

  const { title, author } = req.body;

  // 3. Validate request body
  if (!title || !author) {
    return res.status(400).json({ error: 'Title and Author are required.' });
  }

    try {
    // 4. Call Gemini for a summary and ISBN-13
    const model = aiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `Provide a concise, spoiler-free summary (2-3 sentences) of the book "${title}" by "${author}". 
Also, if you are highly confident, provide its 13-digit ISBN. 
Respond strictly in JSON format with the keys "summary" (string) and "isbn" (string or null). Do not include any markdown formatting or backticks in your response.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);
    
    const summary = parsedData.summary || '';
    const isbn = parsedData.isbn || undefined;

    // 5. Resolve Cover Image URL via Open Library
    let coverUrl: string | null = null;

    if (isbn) {
      // If Gemini returned an ISBN, use the Open Library ISBN Cover API
      coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    } else {
      // Fallback: Search Open Library by title and author to find a cover ID
      try {
        const query = encodeURIComponent(`title:${title} author:${author}`);
        const searchRes = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=1`);
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const doc = searchData.docs?.[0];
          if (doc && doc.cover_i) {
            coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
          }
        }
      } catch (coverError) {
        console.error('Failed to fetch cover from Open Library:', coverError);
      }
    }

    // 6. Return the enriched data
    return res.status(200).json({
      summary,
      coverUrl,
      isbn,
    });

  } catch (error: any) {
    console.error('Enrichment API Error:', error);
    return res.status(500).json({
      error: 'Failed to enrich book details.',
      details: error.message || error,
    });
  }
}