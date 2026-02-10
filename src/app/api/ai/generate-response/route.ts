import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewerName, rating, comment, businessName } = await request.json();

    if (!comment || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields: comment and businessName' },
        { status: 400 }
      );
    }

    // Determine sentiment-based tone for 3rd option
    const isNegative = rating <= 2;
    const thirdToneLabel = isNegative ? 'apologetic' : 'enthusiastic';
    const thirdToneDesc = isNegative
      ? 'Empathetic & apologetic — acknowledge the issue, offer to make it right'
      : 'Enthusiastic & appreciative — show genuine excitement about their experience';

    const prompt = `You are a professional customer service representative for "${businessName}".

A customer left this review:
- Reviewer: ${reviewerName || 'A customer'}
- Rating: ${rating}/5 stars
- Review: "${comment}"

Generate exactly 3 response options in different tones:

1. **Professional** — formal, polished, corporate tone
2. **Friendly** — warm, personable, conversational tone
3. **${thirdToneLabel}** — ${thirdToneDesc}

Requirements for ALL responses:
- 50-100 words each
- Address the reviewer by first name if available
- ${isNegative ? 'Acknowledge the issue and offer to resolve it (invite them to contact you directly)' : 'Thank them sincerely for the positive review'}
- Sound natural and human (not robotic or generic)
- Do NOT use placeholder brackets like [Manager Name] or [Phone Number]
- End with an invitation to return or continue the relationship

Return ONLY valid JSON with no markdown formatting, no code fences:
{
  "professional": "response text here",
  "friendly": "response text here",
  "${thirdToneLabel}": "response text here"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates professional business review responses. Always respond with valid JSON only, no markdown or code fences.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    // Parse the JSON response — strip any accidental code fences
    let responses;
    try {
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      responses = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Estimate token usage for cost tracking
    const usage = completion.usage;

    return NextResponse.json({
      responses,
      tones: ['professional', 'friendly', thirdToneLabel],
      usage: {
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      },
    });
  } catch (error: unknown) {
    console.error('AI generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate response';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
