// ✅ src/app/api/level3/tts/route.ts
import { NextResponse } from "next/server";

const VOICES: Record<string, string> = {
  Alice: "BZgkqPqms7Kj9ulSkVzn",
  Bob: "NMbn4FNN0acONjKLsueJ",
  Charlie: "WF4i4ZlVIKR1m1lLbJji",
};

export async function POST(req: Request) {
  try {
    let body = await req.json();
    let speaker = body.speaker ?? body.conversation?.speaker ?? "Alice";
    let text = body.text ?? body.conversation?.text ?? "";

    console.log("📥 /tts received:", { speaker, text });

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const voiceId = VOICES[speaker] ?? VOICES.Alice;
    console.log(`🎙️ Using voice for: ${speaker} → ${voiceId}`);

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          voice_settings: { stability: 0.4, similarity_boost: 0.7 },
        }),
      }
    );

    if (!elevenRes.ok) {
      const t = await elevenRes.text();
      console.error("❌ ElevenLabs error:", t);
      return NextResponse.json({ error: "ElevenLabs failed" }, { status: 502 });
    }

    console.log("✅ /tts audio generated successfully");

    return new Response(elevenRes.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*", // ✅ allow browser fetch
      },
    });
  } catch (err: any) {
    console.error("tts error", err);
    return NextResponse.json({ error: err.message ?? err }, { status: 500 });
  }
}
