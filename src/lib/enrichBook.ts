interface EnrichmentData {
    summary: string;
    coverUrl: string | null;
    isbn?: string;
}

export async function enrichBook(title: string, author: string): Promise<EnrichmentData>{
    const res = await fetch('/api/enrich-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author }),
    });

    if (!res.ok) {
        throw new Error(`Enrichment failed with status: ${res.status}`)
    }
    return res.json();
  }