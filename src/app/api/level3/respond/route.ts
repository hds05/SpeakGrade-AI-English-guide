// src/app/api/level3/respond/route.ts
import { NextResponse } from "next/server";

const INTERVIEWERS = [
  { id: "int1", name: "Interviewer 1" },
  { id: "int2", name: "Interviewer 2" },
  { id: "int3", name: "Interviewer 3" },
];

async function callOpenAI(prompt: string, history: any[] = []) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a panel interview assistant. Produce concise, natural follow-up questions or short comments from three interviewers. Output MUST be valid JSON array, each item { speaker: 'Interviewer 1', text: '...'}",
        },
        ...history,
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 220,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error: ${t}`);
  }

  const payload = await res.json();
  const content = payload.choices?.[0]?.message?.content ?? "";
  return content;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // expected: { userMessage: string, conversationHistory?: Array<{role, content}> , lastSpeaker?: 'int1'|'int2'|'int3' }
    const userMessage: string = body.userMessage ?? "";
    const convHistory = body.conversationHistory ?? [];

    // Build a prompt that includes the user's last answer and a short instruction for follow-ups
    const prompt = `The candidate answered: "${userMessage}". Based on that, generate a short sequence of 1-3 lines from the interviewers.
Output JSON array like: [{"speaker":"Interviewer 1","text":"..."}].
Make each interviewer speak once in order (Interviewers 1→2→3), but if context suggests one should ask a follow-up, let that interviewer do it.
Keep each text short (1-2 sentences). Do not include anything else outside the JSON.`;

    let content = await callOpenAI(prompt, convHistory);

    // Try to parse JSON; if the model added text around JSON attempt to extract it
    let json;
    try {
      json = JSON.parse(content);
    } catch (err) {
      // Try to find JSON substring
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          json = JSON.parse(match[0]);
        } catch (e) {
          json = null;
        }
      } else {
        json = null;
      }
    }

    // Fallback: if parsing failed, create simple deterministic response (so UI won't break)
    if (!json) {
      const fallback = [
        { speaker: "Interviewer 1", text: "Thanks — can you give 1-2 lines about your current role?" },
        { speaker: "Interviewer 2", text: "What tech stack do you use most often?" },
        { speaker: "Interviewer 3", text: "Tell us about a challenge you solved recently." },
      ];
      return NextResponse.json({ conversation: fallback });
    }

    // Normalize speakers to our ids (model may output names)
    const normalized = (json as any[]).map((item) => {
      const s = String(item.speaker || item.role || "").toLowerCase();
      let speakerId = "int1";
      if (s.includes("2") || s.includes("interviewer 2") || s.includes("bob")) speakerId = "int2";
      if (s.includes("3") || s.includes("interviewer 3") || s.includes("carol")) speakerId = "int3";
      if (s.includes("1") || s.includes("interviewer 1") || s.includes("alice")) speakerId = "int1";
      return { speaker: speakerId, text: String(item.text ?? item.content ?? "").trim() };
    });

    return NextResponse.json({ conversation: normalized });
  } catch (e: any) {
    console.error("respond error", e);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
