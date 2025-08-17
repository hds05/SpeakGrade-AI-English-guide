// ✅ src/app/api/level7/tts/route.ts
import { NextResponse } from "next/server";

// Bob's voice ID for the friendly fast-food cashier character
const BOB_VOICE_ID = "NMbn4FNN0acONjKLsueJ";

export async function POST(req: Request) {
  try {
    let body = await req.json();
    let speaker = body.speaker ?? "Mike";
    let text = body.text ?? body.conversation?.text ?? "";

    console.log("📥 Level 7 /tts received:", { speaker, text });

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    // Use Bob's voice for the friendly fast-food cashier
    const voiceId = BOB_VOICE_ID;
    console.log(`🎙️ Using Bob's voice for cashier Mike: ${voiceId}`);

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
          voice_settings: { 
            stability: 0.5,      // Stable but energetic for fast-food service
            similarity_boost: 0.7, // Good similarity
            style: 0.3,         // Friendly, upbeat service style
            use_speaker_boost: true
          },
        }),
      }
    );

    if (!elevenRes.ok) {
      const errorText = await elevenRes.text();
      console.error("❌ ElevenLabs error:", errorText);
      return NextResponse.json({ error: "ElevenLabs failed" }, { status: 502 });
    }

    console.log("✅ Level 7 /tts audio generated successfully");

    return new Response(elevenRes.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*", // ✅ allow browser fetch
      },
    });
  } catch (err: any) {
    console.error("Level 7 tts error", err);
    return NextResponse.json({ error: err.message ?? err }, { status: 500 });
  }
} 