// src/app/api/tts/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, voice } = await req.json();
    if (!text || !voice) {
      return NextResponse.json({ error: 'missing text or voice' }, { status: 400 });
    }
    const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVEN_KEY) {
      return NextResponse.json({ error: 'server missing ElevenLabs key' }, { status: 500 });
    }

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model: "eleven_multilingual_v1",
        voice_settings: {
          stability: 1.0,
          similarity_boost: 1,
          speaking_rate: 0.9 // make it slightly faster
        }
      }),
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      console.error('eleven tts error', errText);
      return new Response(errText, { status: elevenRes.status });
    }

    const buffer = await elevenRes.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (err: any) {
    console.error('tts error', err);
    return NextResponse.json({ error: err.message || 'tts server error' }, { status: 500 });
  }
}
