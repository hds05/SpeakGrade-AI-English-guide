import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    const prompt = `Generate 5 beginner-level English multiple-choice questions. 
Each question must be returned in this exact JSON format:

[
  {
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Correct option from above"
  },
  ...
]`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    const jsonText = completion.choices[0].message.content?.trim();

    const questions = JSON.parse(jsonText || '[]');

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('OpenAI Error:', error);
    return NextResponse.json({ questions: [] });
  }
}
