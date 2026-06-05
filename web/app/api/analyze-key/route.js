import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const KEY_ANALYSIS_PROMPT = `You are an expert locksmith and key identification specialist. Analyze this key image and provide a detailed identification report.

Identify and return a JSON object with these fields:
- keyType: The type of key (e.g., "House Key", "Car Key", "Padlock Key", "Cabinet Key", "Skeleton Key", "Mortise Key", "Tubular Key", "Transponder Key", etc.)
- keyway: The keyway/profile name if identifiable (e.g., "SC1 (Schlage C)", "KW1 (Kwikset)", "M1 (Master Lock)", "AR1 (Arrow)", "WR3 (Weiser)", or describe the profile shape if unknown)
- bitting: The bitting code as a dash-separated sequence of cut depths from bow to tip (e.g., "3-2-4-1-3-2"). Use numbers 1-9 where 1=shallowest cut and 9=deepest cut. If you cannot determine precise bitting from the image, provide your best estimate and note it. Return null if completely indeterminate.
- manufacturer: Brand or manufacturer if visible (e.g., "Schlage", "Kwikset", "Master Lock", "Yale", or "Unknown")
- suggestedName: A suggested short name for this key (e.g., "Front Door", "Master Padlock", "Car Key")
- confidence: Your confidence level in this analysis: "high", "medium", or "low"
- notes: Any additional observations — markings, wear patterns, special features, caveats about the analysis accuracy, or recommendations for better photos

Important guidelines:
- For bitting analysis, the key must be photographed from the side profile for accuracy
- If the image angle is not ideal for bitting analysis, note this and lower confidence
- Keyway identification requires seeing the tip of the key or the profile cross-section
- Return ONLY valid JSON, no markdown, no explanation text outside the JSON

Return format example:
{
  "keyType": "House Key",
  "keyway": "SC1 (Schlage C)",
  "bitting": "3-2-4-1-3-2",
  "manufacturer": "Schlage",
  "suggestedName": "House Key",
  "confidence": "medium",
  "notes": "Typical 6-pin Schlage key. Bitting estimate based on visible cuts — verify with original documentation for duplication."
}`;

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image || typeof image !== 'string') {
      return Response.json({ error: 'Image data is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: 'API key not configured on server' }, { status: 500 });
    }

    const mediaType = image.startsWith('/9j/') ? 'image/jpeg' :
                      image.startsWith('iVBORw') ? 'image/png' :
                      image.startsWith('R0lGOD') ? 'image/gif' : 'image/jpeg';

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: image,
              },
            },
            {
              type: 'text',
              text: KEY_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    const rawText = message.content[0].text.trim();

    let analysis;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      return Response.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 });
    }

    return Response.json(analysis);
  } catch (error) {
    console.error('Key analysis error:', error);
    if (error.status === 401) {
      return Response.json({ error: 'Invalid API key configured' }, { status: 500 });
    }
    if (error.status === 429) {
      return Response.json({ error: 'Rate limit reached. Please try again in a moment.' }, { status: 429 });
    }
    return Response.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
