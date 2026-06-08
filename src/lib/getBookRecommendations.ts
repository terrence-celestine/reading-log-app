import type { Book, Recommendation } from "../types";

export async function getBookRecommendations(books: Book[]): Promise<{recommendations: Recommendation[]}>{
    const res = await fetch('/api/recommend-books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({books: books }),
    });     

    if (!res.ok) {
        throw new Error(`Enrichment failed with status: ${res.status}`)
    }
    return res.json();
  }