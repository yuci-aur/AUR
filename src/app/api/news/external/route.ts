export const runtime = "nodejs";
// Serve from the cache but never bake a response into the build: a
// parameterless GET is otherwise prerendered, which freezes the build
// machine's articles into the deployment -- and if GNEWS_API_KEY is absent at
// build time, freezes an empty list for the whole revalidate window.
export const dynamic = "force-dynamic";
export const revalidate = 900;

const HIGHER_ED_KEYWORDS = [
  "university", "college", "higher education", "academic ranking", "campus",
  "faculty", "research institute", "graduate program", "phd", "undergraduate",
  "postgraduate", "vice chancellor", "provost", "academic", "enrollment", "admissions",
];
const ASIA_KEYWORDS = [
  "china", "chinese", "india", "indian", "japan", "japanese", "korea", "korean",
  "singapore", "hong kong", "malaysia", "thailand", "philippines", "indonesia",
  "vietnam", "taiwan", "asia", "asian", "bangladesh", "pakistan", "sri lanka",
];
const DISTRESSING_KEYWORDS = [
  "suicide", "suicidal", "self-harm", "self harm", "found dead", "assault",
  "rape", "murder", "murdered", "shooting", "stabbing", "sexual harassment",
  "abuse scandal", "terror attack", "bomb blast",
];

function contains(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export async function GET() {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return Response.json({ data: [] });

  const parameters = new URLSearchParams({
    q: 'university OR "higher education" OR college Asia OR China OR Japan OR India OR Korea OR Singapore OR Malaysia',
    lang: "en",
    max: "25",
    in: "title,description",
    apikey: apiKey,
  });

  try {
    const response = await fetch(`https://gnews.io/api/v4/search?${parameters}`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 900 },
    });
    if (!response.ok) return Response.json({ data: [] });
    const payload = (await response.json()) as { articles?: Array<Record<string, unknown>> };
    const data = (payload.articles ?? [])
      .filter((article) => {
        const text = `${article.title ?? ""} ${article.description ?? ""}`.toLowerCase();
        return contains(text, HIGHER_ED_KEYWORDS)
          && contains(text, ASIA_KEYWORDS)
          && !contains(text, DISTRESSING_KEYWORDS);
      })
      .slice(0, 10)
      .map((article) => ({
        title: String(article.title ?? ""),
        description: article.description ? String(article.description) : undefined,
        url: String(article.url ?? ""),
        source:
          typeof article.source === "object" && article.source
            ? String((article.source as Record<string, unknown>).name ?? "")
            : undefined,
        published_at: article.publishedAt ? String(article.publishedAt) : undefined,
        image: article.image ? String(article.image) : undefined,
      }));
    return Response.json({ data });
  } catch {
    return Response.json({ data: [] });
  }
}
