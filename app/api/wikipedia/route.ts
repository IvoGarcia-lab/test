import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 3600; // Cache responses for 1 hour

interface WikiSummaryResponse {
  title?: string;
  displaytitle?: string;
  description?: string;
  extract?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  coordinates?: {
    lat: number;
    lon: number;
  };
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
}

async function fetchSummaryByTitle(title: string, lang = 'pt'): Promise<WikiSummaryResponse | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AtelierCalmArchitecture/1.0 (https://atelier-calm.app; contact@atelier-calm.app)',
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Error fetching Wikipedia summary for ${title} (${lang}):`, err);
    return null;
  }
}

async function searchWikipediaTitle(query: string, lang = 'pt'): Promise<string | null> {
  try {
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&format=json&utf8=1&srlimit=1`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'AtelierCalmArchitecture/1.0 (https://atelier-calm.app; contact@atelier-calm.app)',
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const firstHit = data?.query?.search?.[0];
    return firstHit?.title || null;
  } catch (err) {
    console.error(`Error searching Wikipedia for ${query} (${lang}):`, err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || searchParams.get('title');

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro de pesquisa (query) obrigatório.' },
        { status: 400 }
      );
    }

    // 1. Try Portuguese Wikipedia direct summary
    let summary = await fetchSummaryByTitle(query, 'pt');
    let langUsed = 'pt';

    // 2. If direct title didn't match, search Portuguese Wikipedia
    if (!summary || !summary.extract) {
      const matchedTitlePt = await searchWikipediaTitle(query, 'pt');
      if (matchedTitlePt) {
        summary = await fetchSummaryByTitle(matchedTitlePt, 'pt');
      }
    }

    // 3. Fallback to English Wikipedia if Portuguese article was not found
    if (!summary || !summary.extract) {
      const matchedTitleEn = await searchWikipediaTitle(query, 'en');
      if (matchedTitleEn) {
        summary = await fetchSummaryByTitle(matchedTitleEn, 'en');
        langUsed = 'en';
      }
    }

    if (!summary || !summary.extract) {
      return NextResponse.json({
        success: false,
        error: `Nenhum artigo encontrado na Wikipédia para "${query}".`,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        title: summary.title,
        description: summary.description || '',
        extract: summary.extract,
        pageUrl:
          summary.content_urls?.desktop?.page ||
          `https://${langUsed}.wikipedia.org/wiki/${encodeURIComponent(summary.title || query)}`,
        thumbnail: summary.thumbnail?.source || null,
        coordinates: summary.coordinates
          ? {
              lat: summary.coordinates.lat,
              lng: summary.coordinates.lon,
            }
          : null,
        lang: langUsed,
      },
    });
  } catch (error: unknown) {
    console.error('Wikipedia API error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Erro ao consultar a API da Wikipédia.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
