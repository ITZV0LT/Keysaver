const KEY_ANALYSIS_PROMPT = `You are an expert locksmith who has cut thousands of keys by hand. Analyze this key image and extract every detail you can see, with special focus on the bitting (cut depths).

═══ BITTING ANALYSIS — READ THIS CAREFULLY ═══

Bitting is the sequence of cut depths along the blade, read from the BOW (handle end) to the TIP.

HOW TO MEASURE EACH CUT:
• Look at the side profile of the blade edge — the cuts form a wave pattern of valleys and peaks.
• The SHOULDER (the first step after the bow before the cuts begin) is NOT a cut — bitting starts after it.
• Each VALLEY is one cut/pin position. Count them: most house keys have 5 or 6 cuts.
• Estimate each valley's depth on a 1–9 scale relative to the full blade height:
    1 = barely a nick — valley is very close to the cut edge (almost flat)
    2 = very shallow — about 10–15% of blade thickness deep
    3 = shallow — about 20–25% of blade thickness deep
    4 = medium-shallow — about 30% of blade thickness deep
    5 = medium — valley is roughly halfway to the spine
    6 = medium-deep — about 60–65% of blade thickness deep
    7 = deep — about 70–75% of blade thickness deep
    8 = very deep — about 80–85% of blade thickness deep
    9 = maximum cut — valley nearly reaches the spine (opposite flat edge)
• COMPARE cuts to each other: a cut that is clearly deeper than its neighbor gets a higher number.
• Write the depths as a dash-separated string from bow to tip, e.g. "3-1-4-2-5-3" for 6 cuts.

RULES:
1. ALWAYS attempt a bitting reading from a side-profile photo — even if blurry or slightly angled.
2. If some cuts are unclear, estimate them and explain in notes which ones are uncertain.
3. Only return null for bitting if the key is NOT photographed from the side (e.g., face-up, no cuts visible at all).
4. Pin count = number of cuts. State it explicitly in notes (e.g., "6-pin key").

═══ BLADE REGION (for overlay drawing) ═══

Carefully estimate the blade geometry in the image for drawing a precise cut-profile trace:

- bladeRegion.xStart: X fraction (0.0–1.0) where the cuts BEGIN, just past the shoulder. Not the very start of the bow — the first actual cut.
- bladeRegion.xEnd: X fraction of the very tip of the key blade.
- bladeRegion.y: Y fraction (0.0–1.0) of the cut-edge BASELINE — the level of the LANDS (the uncut flat portions between cuts). This is the edge of the blade that has the wave pattern.
- bladeRegion.spineY: Y fraction of the SPINE — the opposite, flat edge of the blade. The spine has no cuts. This tells us which direction cuts go: if spineY < y, cuts go upward; if spineY > y, cuts go downward.

MEASUREMENT INSTRUCTIONS:
• Visualize a horizontal line along the lands (the flat areas between cuts) — that Y fraction is bladeRegion.y.
• Visualize a horizontal line along the spine (the smooth opposite edge) — that Y fraction is bladeRegion.spineY.
• These two lines define the full blade thickness. A depth-9 cut almost reaches the spine.

Example for a key running left-to-right with cuts on the BOTTOM edge:
  bladeRegion: { "xStart": 0.20, "xEnd": 0.88, "y": 0.72, "spineY": 0.38 }
  (cut edge at 72% down, spine at 38% down — cuts go upward toward spine)

Example for a key running left-to-right with cuts on the TOP edge:
  bladeRegion: { "xStart": 0.20, "xEnd": 0.88, "y": 0.30, "spineY": 0.65 }
  (cut edge at 30% down, spine at 65% down — cuts go downward toward spine)

═══ OTHER FIELDS ═══

keyType: e.g., "House Key", "Car Key", "Padlock Key", "Cabinet Key", "Tubular Key", "Transponder Key"
keyway: The PROFILE CODE of the key blank — the alphanumeric code identifying the keyway shape, e.g. "SC1", "KW1", "M1", "AR1", "WR3". You may add the common name in parentheses, e.g. "SC1 (Schlage C)" or "KW1 (Kwikset)". This is about the physical shape of the key tip/profile, NOT the brand.
manufacturer: The BRAND NAME physically stamped, engraved, or cast into the key metal (look on the bow/head of the key). Examples: "Schlage", "Kwikset", "Master Lock", "Yale", "Ilco", "Sargent". If no brand marking is visible on the key itself, return "Unknown". Do NOT infer or guess manufacturer from the keyway code — only report what is actually visible on the key.
suggestedName: Short user-friendly name — e.g., "Front Door", "Master Padlock"
confidence: "high" (clear side photo, all cuts sharp), "medium" (slightly blurry/angled), "low" (poor lighting, wrong angle)
notes: State the pin count, which cuts you are confident about vs estimated, any wear, markings, or tips for a better photo.

Return ONLY valid JSON, no markdown, no text outside the JSON object.

EXAMPLE OUTPUT:
{
  "keyType": "House Key",
  "keyway": "KW1 (Kwikset)",
  "bitting": "4-2-6-3-5-2",
  "bladeRegion": { "xStart": 0.18, "xEnd": 0.88, "y": 0.68, "spineY": 0.35 },
  "manufacturer": "Kwikset",
  "suggestedName": "House Key",
  "confidence": "medium",
  "notes": "6-pin key. Cuts 1-4 clearly visible. Cuts 5-6 near tip estimated. Cut 3 is deepest."
}`;

// Draw the bitting waveform onto the image as a red polyline using sharp + SVG composite.
// Uses spineY to determine the correct cut direction so the trace follows the actual blade edge.
async function annotateWithBitting(imageBase64, analysis) {
  const { bitting, bladeRegion } = analysis;
  if (!bitting || bitting === 'null' || bitting === null) return null;

  try {
    // Dynamic import — if sharp fails for any reason, annotation is skipped gracefully
    // and the analysis result is still returned to the client unchanged.
    const sharp = (await import('sharp')).default;

    const imgBuffer = Buffer.from(imageBase64, 'base64');
    const meta = await sharp(imgBuffer).metadata();
    const W = meta.width;
    const H = meta.height;

    const cuts = String(bitting).split('-').map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 9);
    if (cuts.length < 2) return null;

    // Cut-edge baseline (the lands) and spine positions
    const cutEdgeY = (bladeRegion?.y ?? 0.62) * H;

    // spineY: AI-supplied or fallback to 20% of image height away from cut edge
    const spineY = bladeRegion?.spineY != null
      ? bladeRegion.spineY * H
      : cutEdgeY < H * 0.5
        ? cutEdgeY + H * 0.20   // cut edge near top → spine is below
        : cutEdgeY - H * 0.20;  // cut edge near bottom → spine is above

    const bladeThickness = Math.abs(spineY - cutEdgeY);
    // dir = +1 cuts go DOWN (spineY is below), dir = -1 cuts go UP (spineY is above)
    const dir = spineY > cutEdgeY ? 1 : -1;
    // Depth scale: depth-9 cut goes 90% of the way from cut edge to spine
    const unitH = (bladeThickness * 0.90) / 8;

    // Distribute cuts evenly between xStart and xEnd
    const xS = (bladeRegion?.xStart ?? 0.08) * W;
    const xE = (bladeRegion?.xEnd ?? 0.90) * W;
    const spacing = (xE - xS) / (cuts.length + 1);
    const hw = spacing * 0.30; // half-width of each cut opening

    // Build the polyline: bow approach → shoulder → each cut valley → tip
    const pts = [];
    pts.push([xS - spacing * 0.3, cutEdgeY]); // bow-side approach along cut edge
    pts.push([xS, cutEdgeY]);                  // shoulder

    cuts.forEach((d, i) => {
      const cx = xS + spacing * (i + 1);
      const valleyY = cutEdgeY + dir * (d - 1) * unitH; // valley goes toward spine

      pts.push([cx - hw, cutEdgeY]);           // land before cut
      pts.push([cx - hw * 0.4, valleyY]);      // angled ramp into cut
      pts.push([cx + hw * 0.4, valleyY]);      // flat valley floor
      pts.push([cx + hw, cutEdgeY]);           // angled ramp out of cut
    });

    pts.push([xE, cutEdgeY]); // tip

    const polyPts = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const strokeW = Math.max(2, Math.round(W / 300));

    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <polyline
        points="${polyPts}"
        stroke="#FF2222"
        stroke-width="${strokeW}"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.95"
      />
    </svg>`;

    const annotated = await sharp(imgBuffer)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: 88 })
      .toBuffer();

    return annotated.toString('base64');
  } catch (e) {
    console.error('Annotation error:', e.message);
    return null; // annotation failed — analysis still returned without image overlay
  }
}

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image || typeof image !== 'string') {
      return Response.json({ error: 'Image data is required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        { error: 'GROQ_API_KEY not configured on server — set it in Vercel environment variables' },
        { status: 500 }
      );
    }

    const mediaType = image.startsWith('/9j/') ? 'image/jpeg' :
                      image.startsWith('iVBORw') ? 'image/png' :
                      image.startsWith('R0lGOD') ? 'image/gif' : 'image/jpeg';

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${image}` } },
            { type: 'text', text: KEY_ANALYSIS_PROMPT },
          ],
        }],
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errText);
      let detail = errText;
      try { detail = JSON.stringify(JSON.parse(errText), null, 2); } catch {}
      return Response.json(
        { error: `Groq API error ${groqResponse.status}: ${detail}` },
        { status: 502 }
      );
    }

    const data = await groqResponse.json();
    const rawText = data.choices?.[0]?.message?.content?.trim();

    if (!rawText) {
      return Response.json(
        { error: `AI returned empty response. Full Groq payload: ${JSON.stringify(data)}` },
        { status: 500 }
      );
    }

    let analysis;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch (parseErr) {
      return Response.json(
        { error: `Failed to parse AI JSON: ${parseErr.message}. Raw AI output (first 400 chars): ${rawText.slice(0, 400)}` },
        { status: 500 }
      );
    }

    // Attempt to draw the red bitting trace — failure is non-fatal
    const annotatedImage = await annotateWithBitting(image, analysis);

    // Strip internal bladeRegion from the client response
    const { bladeRegion: _, ...clientAnalysis } = analysis;

    return Response.json({ ...clientAnalysis, annotatedImage });
  } catch (error) {
    console.error('Key analysis error:', error);
    return Response.json(
      { error: `Server exception: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
