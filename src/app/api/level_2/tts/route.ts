// src/app/api/tts/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, voice } = await req.json();

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "No ElevenLabs API key" }, { status: 500 });
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        voice,
        model_id: "eleven_multilingual_v1",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("ElevenLabs TTS error:", errorText);
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    const arrayBuffer = await res.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (err: any) {
    console.error("TTS route error:", err);
    return NextResponse.json(
      { error: err.message || "server error" },
      { status: 500 }
    );
  }
}
