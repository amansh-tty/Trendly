import { NextRequest, NextResponse } from 'next/server';
import { openai, FASHION_ANALYST_PROMPT } from '@/lib/openai';
import { uploadImage } from '@/lib/cloudinary';
import type { AiSections } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, uploadContext } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }
    console.log('uploading image...')
    const imageUrl = await uploadImage(imageBase64);

    const userText = uploadContext
      ? `Analyse this outfit. Context: ${uploadContext}.`
      : 'Analyse this outfit.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: FASHION_ANALYST_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            { type: 'text', text: userText },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }
    const aiSections: AiSections = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ aiSections, imageUrl });
  } catch (err) {
    console.error('[analyze-outfit]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
