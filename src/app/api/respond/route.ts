// src/app/api/respond/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { user } = await req.json();
    if (!user) return NextResponse.json({ error: 'missing user text' }, { status: 400 });

    if (process.env.OPENAI_API_KEY) {
      // Updated prompt — more natural, no speaker labels in the text
      const prompt = `
You are creating a fun, natural back-and-forth conversation between two people: Alice and Bob.
User says: "${user}"
Write a short, casual reply for Alice, then a short, casual reply for Bob.
Each reply should be 1–2 sentences, friendly, and without adding "Alice:" or "Bob:" in the text.
Separate the two replies with "||".
      `;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 150,
          temperature: 0.9,
        }),
      });

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content ?? '';

      // Split the replies
      const parts = text.split('||').map((s: string) => s.trim());
      const alice = parts[0] ?? `Oh, that’s interesting.`;
      const bob = parts[1] ?? `Yeah, tell me more about it.`;

      return NextResponse.json({ alice, bob });
    } else {
      // Fallback responses if no OpenAI key
      const alice = `That sounds interesting — what happened next?`;
      const bob = `Haha, I’d love to hear more about that.`;
      return NextResponse.json({ alice, bob });
    }
  } catch (err: any) {
    console.error('respond error', err);
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 });
  }
}
