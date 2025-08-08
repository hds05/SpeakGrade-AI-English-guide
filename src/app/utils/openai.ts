// utils/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function getVocabularyQuestion() {
  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a vocabulary quiz generator. Provide a word and 4 options. Mark the correct one.'
      },
      {
        role: 'user',
        content: 'Give me a multiple choice vocab question.'
      }
    ]
  });

  return res.choices[0].message.content;
}
