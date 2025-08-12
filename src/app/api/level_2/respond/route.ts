// // src/app/api/respond/route.ts
// import { NextResponse } from 'next/server';

// export async function POST(req: Request) {
//   try {
//     const { user } = await req.json();
//     if (!user) return NextResponse.json({ error: 'missing user text' }, { status: 400 });

//     if (process.env.OPENAI_API_KEY) {
//       // Updated prompt — more natural, no speaker labels in the text
//       const prompt = `
// You are creating a fun, natural back-and-forth conversation between two people: Alice and Bob.
// User says: "${user}"
// Write a short, casual reply for Alice, then a short, casual reply for Bob.
// Each reply should be 1–2 sentences, friendly, and without adding "Alice:" or "Bob:" in the text.
// Separate the two replies with "||".
//       `;

//       const res = await fetch('https://api.openai.com/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//         },
//         body: JSON.stringify({
//           model: 'gpt-4o-mini',
//           messages: [{ role: 'system', content: prompt }],
//           max_tokens: 150,
//           temperature: 0.9,
//         }),
//       });

//       const data = await res.json();
//       const text = data?.choices?.[0]?.message?.content ?? '';

//       // Split the replies
//       const parts = text.split('||').map((s: string) => s.trim());
//       const alice = parts[0] ?? `Oh, that’s interesting.`;
//       const bob = parts[1] ?? `Yeah, tell me more about it.`;

//       return NextResponse.json({ alice, bob });
//     } else {
//       // Fallback responses if no OpenAI key
//       const alice = `That sounds interesting — what happened next?`;
//       const bob = `Haha, I’d love to hear more about that.`;
//       return NextResponse.json({ alice, bob });
//     }
//   } catch (err: any) {
//     console.error('respond error', err);
//     return NextResponse.json({ error: err.message || 'server error' }, { status: 500 });
//   }
// }

// src/app/api/respond/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { user, firstInteraction } = await req.json();

    if (process.env.OPENAI_API_KEY) {
      let prompt = '';

      if (firstInteraction) {
        // 🎯 Special opener for the bar scene
        prompt = `
You are simulating a fun, natural conversation between a friendly bartender and Bob (a regular customer and friend), sitting in a lively bar.
This is the very first message — the user has not spoken yet.
Write two short replies (1–2 sentences each) where the bartender and Bob talk to each other first in a casual, playful, or slightly teasing way, 
making it sound like a bar conversation.
Do NOT include names like "Bartender:" or "Bob:" in the text.
Separate the two replies with "||".
        `;
      } else {
        // 🎯 Ongoing conversation logic
        prompt = `
You are simulating a fun, realistic conversation in a bar between a friendly bartender, Bob (a regular customer and friend), and the user.
User says: "${user}"

Rules:
- Sometimes the bartender talks to the user, sometimes Bob talks to the user, sometimes they talk to each other.
- Occasionally, one may ask the user's opinion, then the other reacts to what the user said.
- If the user says nothing or seems unsure, one should encourage them to speak, then change the topic with: "Okay forget it, tell me about..." followed by a new topic.
- Keep it natural, playful, and short (1–2 sentences per reply).
- Do NOT include "Bartender:" or "Bob:" in the output.
Separate the two replies with "||".
        `;
      }

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

      // Split into Alice/Bob parts
      const parts = text.split('||').map((s: string) => s.trim());
      const alice = parts[0] || '';
      const bob = parts[1] || '';

      return NextResponse.json({ alice, bob });
    } else {
      // No API key — fallback
      const alice = `That sounds interesting — what happened next?`;
      const bob = `Haha, I’d love to hear more about that.`;
      return NextResponse.json({ alice, bob });
    }
  } catch (err: any) {
    console.error('respond error', err);
    return NextResponse.json(
      { error: err.message || 'server error' },
      { status: 500 }
    );
  }
}
