import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    const { transcript, conversationHistory = [] } = await req.json();
  
    const messages = [
      {
        role: "system",
        content: `
  You are a 911 dispatcher. Ask concise questions. Get emergency type, location, condition, and confirm help is coming. Be calm.
  End with: "Please stay on the line until emergency services arrive."`,
      },
      ...conversationHistory,
    ];
  
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
    });
  
    const reply = response.choices?.[0]?.message?.content || "Can you repeat that?";
    return NextResponse.json({ reply });
  }
  
