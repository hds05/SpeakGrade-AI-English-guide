// ✅ src/app/api/level3/respond/route.ts
import { NextResponse } from "next/server";

// ✅ Add this function before POST
async function callOpenAI(messages: any[]) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.6,
      max_tokens: 220,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${await res.text()}`);
  }

  const payload = await res.json();
  return payload.choices?.[0]?.message?.content ?? "";
}

// ✅ Your POST handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("✅ Received body in /respond:", body);

    const { userMessage, conversationHistory = [], currentSpeaker } = body;

    const systemMsg = {
      role: "system",
      content: `You are acting as ${currentSpeaker}, an interviewer in a panel interview.
    You will ask exactly ONE question or give a short comment (max 2 sentences) to the candidate.
    Do not answer for other interviewers. Only speak as "${currentSpeaker}". Output a JSON object like: {"speaker":"${currentSpeaker}","text":"..."}`,
    };
    
    const userPrompt = {
      role: "user",
      content: userMessage
        ? `The candidate just answered: "${userMessage}". Now ask your next question.`
        : `Start the interview by greeting the candidate and asking your first question.`,
    };
    
    const content = await callOpenAI([systemMsg, ...conversationHistory, userPrompt]);
    console.log("🧠 GPT raw response:", content);

    let json;
    try {
      json = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          json = JSON.parse(match[0]);
        } catch {
          json = null;
        }
      }
    }

    if (!json) {
      console.warn("⚠️ GPT response not JSON. Falling back.");
      json = [
        { speaker: "Alice", text: "Thanks — can you tell me more about your background?" },
        { speaker: "Bob", text: "What tech stack do you prefer?" },
        { speaker: "Charlie", text: "Describe a recent project you enjoyed." },
      ];
    }
    console.log("📤 /respond sending:", JSON.stringify(json, null, 2)); // ✅ log API output

    return NextResponse.json({ conversation: json });
  } catch (err: any) {
    console.error("❌ respond error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
