import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { base64Data, mimeType, localImagePath, customPrompt } = body;

    let imageBase64 = '';
    let imageMime = mimeType || 'image/jpeg';

    if (base64Data) {
      if (base64Data.includes('base64,')) {
        const parts = base64Data.split('base64,');
        imageBase64 = parts[1];
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch) {
          imageMime = mimeMatch[1];
        }
      } else {
        imageBase64 = base64Data;
      }
    } else if (localImagePath) {
      // Read local image from public directory
      const cleanPath = localImagePath.startsWith('/') ? localImagePath.slice(1) : localImagePath;
      const fullPath = path.join(process.cwd(), 'public', cleanPath);
      const fileBuffer = await fs.readFile(fullPath);
      imageBase64 = fileBuffer.toString('base64');
      if (cleanPath.endsWith('.png')) imageMime = 'image/png';
      else if (cleanPath.endsWith('.webp')) imageMime = 'image/webp';
      else imageMime = 'image/jpeg';
    }

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma imagem foi fornecida para análise.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chave GEMINI_API_KEY não configurada no ambiente.',
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemPrompt = `Você é o Curador Chefe e Especialista em Reconhecimento Arquitetónico & Georreferenciação do "ATELIER CALM".
A sua missão é analisar a fotografia arquitetónica/monumento fornecida, identificar com precisão o edifício ou estrutura, o seu arquiteto(a), o ano de conclusão, o estilo arquitetónico, e as coordenadas geográficas exatas (latitude e longitude decimais precisas) para marcação num mapa cartográfico.

Diretrizes de Resposta:
1. Identifique o edifício específico com alta precisão visual (ex: Solomon R. Guggenheim Museum em Nova Iorque, Casa da Música no Porto, Torre Eiffel, Sydney Opera House, etc.).
2. Se o edifício for uma obra residencial ou menos conhecida, estime a cidade, país e coordenadas aproximadas com base no estilo vernacular, vegetação, luz ou placas.
3. Forneça coordenadas numéricas reais (latitude e longitude entre -90/90 e -180/180). NUNCA retorne 0, 0 se for um edifício identificável.
4. Redija a descrição num tom editorial elegante, culto e focado em qualidades espaciais, tectónicas e materiais ('mineral stone', betão, luz, ritmo).
5. O idioma de saída DEVE ser Português.

Responda ESTRITAMENTE em formato JSON com o seguinte formato:
{
  "title": "Nome do Edifício ou Monumento",
  "architect": "Nome do Arquiteto / Atelier / Escritório",
  "year": "Ano de construção (ex: 1959)",
  "style": "Estilo ou Movimento Arquitetónico",
  "locationName": "Endereço ou denominação local do sítio",
  "city": "Cidade",
  "country": "País",
  "latitude": 40.78298,
  "longitude": -73.95897,
  "confidenceScore": 0.98,
  "description": "Texto curatorial detalhado e poético sobre a volumetria, inserção urbana e tectónica da obra.",
  "materials": ["Material 1", "Material 2", "Material 3", "Material 4"],
  "highlights": [
    "Destaque arquitetónico 1",
    "Destaque arquitetónico 2",
    "Destaque arquitetónico 3",
    "Destaque arquitetónico 4"
  ]
}`;

    const promptText = customPrompt || 'Identifique com precisão esta obra arquitetónica, o seu arquiteto, estilo, materiais e coordenadas geográficas exatas.';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageMime,
              data: imageBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText.trim());
    } catch {
      // Clean possible markdown code fences
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    // Try to enrich with Wikipedia data
    let wikipediaData = undefined;
    if (parsedData.title) {
      try {
        const wikiRes = await fetch(
          `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(parsedData.title)}`,
          {
            headers: {
              'User-Agent': 'AtelierCalmArchitecture/1.0',
              Accept: 'application/json',
            },
          }
        );
        if (wikiRes.ok) {
          const wikiJson = await wikiRes.json();
          if (wikiJson.extract) {
            wikipediaData = {
              title: wikiJson.title,
              description: wikiJson.description || '',
              extract: wikiJson.extract,
              pageUrl:
                wikiJson.content_urls?.desktop?.page ||
                `https://pt.wikipedia.org/wiki/${encodeURIComponent(wikiJson.title)}`,
              thumbnail: wikiJson.thumbnail?.source || null,
              lang: 'pt',
            };
          }
        }
      } catch (err) {
        console.warn('Could not auto-fetch Wikipedia summary:', err);
      }
    }

    const uniqueId = `ai-arch-${Date.now()}`;
    const building = {
      id: uniqueId,
      title: parsedData.title || 'Edifício Arquitetónico Identificado',
      architect: parsedData.architect || 'Arquiteto Não Especificado',
      year: parsedData.year || 'Século XX / XXI',
      style: parsedData.style || 'Arquitetura Contemporânea',
      locationName: parsedData.locationName || `${parsedData.city || ''}, ${parsedData.country || ''}`,
      city: parsedData.city || 'Desconhecida',
      country: parsedData.country || 'Global',
      coordinates: {
        lat: typeof parsedData.latitude === 'number' ? parsedData.latitude : 40.78298,
        lng: typeof parsedData.longitude === 'number' ? parsedData.longitude : -73.95897,
      },
      imageUrl: base64Data ? base64Data : (localImagePath || '/assets/aistudio/fgghfhg_c0ef2bf2.jpg'),
      description: parsedData.description || 'Obra singular caracterizada por notável diálogo volumétrico e expressividade material.',
      materials: Array.isArray(parsedData.materials) && parsedData.materials.length > 0
        ? parsedData.materials
        : ['Betão', 'Vidro', 'Aço', 'Pedra Natural'],
      highlights: Array.isArray(parsedData.highlights) && parsedData.highlights.length > 0
        ? parsedData.highlights
        : ['Composição volumétrica equilibrada', 'Integração paisagística contextual'],
      isUserUpload: true,
      aiIdentified: true,
      confidenceScore: typeof parsedData.confidenceScore === 'number' ? parsedData.confidenceScore : 0.95,
      wikipedia: wikipediaData,
    };

    return NextResponse.json({
      success: true,
      building,
    });
  } catch (error: unknown) {
    console.error('Error analyzing architecture image with Gemini:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao processar análise da imagem.';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
