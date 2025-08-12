// src/app/api/level3/tts/route.ts
import { NextResponse } from "next/server";

const VOICES: Record<string, string> = {
  int1: "VOICE_ID_1", // replace with your actual voice ID
  int2: "VOICE_ID_2",
  int3: "VOICE_ID_3",
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const speaker = url.searchParams.get("speaker") ?? "int1";
    const text = url.searchParams.get("text") ?? "";

    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const voiceId = VOICES[speaker] ?? VOICES["int1"];

    // Proxy request to ElevenLabs TTS (server-side)
    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      // body shape depends on ElevenLabs specs (this works with their standard TTS endpoint)
      body: JSON.stringify({
        text,
        // optional voice settings — tweak if needed
        voice_settings: { stability: 0.4, similarity_boost: 0.7 },
      }),
    });

    if (!elevenRes.ok) {
      const t = await elevenRes.text();
      console.error("elevenlabs error", t);
      return NextResponse.json({ error: "ElevenLabs failed" }, { status: 502 });
    }

    // Stream the audio back to the browser preserving content-type
    const headers = new Headers();
    const contentType = elevenRes.headers.get("content-type") || "audio/mpeg";
    headers.set("Content-Type", contentType);
    // Prevent caching
    headers.set("Cache-Control", "no-store");

    return new Response(elevenRes.body, { status: 200, headers });
  } catch (err: any) {
    console.error("tts error", err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
