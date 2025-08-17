import { NextResponse } from "next/server";

// Add this function before POST
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
      temperature: 0.7,
      max_tokens: 250,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${await res.text()}`);
  }

  const payload = await res.json();
  return payload.choices?.[0]?.message?.content ?? "";
}

// ✅ Scoring function
async function scoreUserResponse(userMessage: string, questionContext: string) {
  if (!userMessage || userMessage.trim().length < 3) {
    return { points: 0, maxPoints: 1, feedback: "Response too short or empty" };
  }

  const scoringPrompt = {
    role: "system",
    content: `You are evaluating an employee's response in a workplace conversation.

    EMPLOYEE'S ACTUAL WORK (reference truth):
    - Made 3 Facebook ads for new clothing campaign
    - Worked with design team to choose pictures and write short texts
    - Posted 4 Instagram photos for summer sale promotion
    - Checked last week's ad performance - one ad had 25% more clicks than usual
    - Conducted online survey about customer style preferences
    - Found that bright colors were the top customer choice
    - Prepared a 2-page report with survey results on Friday

    SCORING CRITERIA:
    - 1 point: Response is accurate and includes specific details from the work done
    - 0 points: Response is vague, incorrect, or doesn't match the actual work

    EXAMPLES:
    Question: "What did you work on with ads this week?"
    - Good (1 point): "I made three Facebook ads for our new clothing campaign" 
    - Bad (0 points): "I worked on some ads" or "I made Instagram posts" (wrong type)

    Question: "How many Instagram posts did you make?"
    - Good (1 point): "I posted four photos on Instagram for the summer sale"
    - Bad (0 points): "I posted some photos" or "I made five posts" (wrong number)

    Respond with JSON: {"points": 0 or 1, "maxPoints": 1, "feedback": "brief explanation"}`
  };

  const userPrompt = {
    role: "user",
    content: `Previous question/context: "${questionContext}"
    Employee's response: "${userMessage}"
    
    Score this response based on accuracy and specificity compared to the actual work done.`
  };

  try {
    const response = await callOpenAI([scoringPrompt, userPrompt]);
    const scoreData = JSON.parse(response);
    return {
      points: scoreData.points || 0,
      maxPoints: 1,
      feedback: scoreData.feedback || ""
    };
  } catch {
    // Fallback scoring based on keywords
    const lowerResponse = userMessage.toLowerCase();
    
    // Simple keyword-based scoring
    if (lowerResponse.includes("three") && lowerResponse.includes("facebook") && lowerResponse.includes("ads")) {
      return { points: 1, maxPoints: 1, feedback: "Correct details about Facebook ads" };
    } else if (lowerResponse.includes("four") && lowerResponse.includes("instagram") && lowerResponse.includes("photos")) {
      return { points: 1, maxPoints: 1, feedback: "Correct details about Instagram posts" };
    } else if (lowerResponse.includes("25%") || lowerResponse.includes("25 percent") && lowerResponse.includes("clicks")) {
      return { points: 1, maxPoints: 1, feedback: "Correct ad performance details" };
    } else if (lowerResponse.includes("bright colors") && lowerResponse.includes("survey")) {
      return { points: 1, maxPoints: 1, feedback: "Correct survey findings" };
    } else if (lowerResponse.includes("design team") && lowerResponse.includes("pictures")) {
      return { points: 1, maxPoints: 1, feedback: "Correct collaboration details" };
    } else if (lowerResponse.includes("two") && lowerResponse.includes("page") && lowerResponse.includes("report")) {
      return { points: 1, maxPoints: 1, feedback: "Correct report details" };
    }
    
    return { points: 0, maxPoints: 1, feedback: "Response needs more specific details" };
  }
}

// Your POST handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("✅ Received body in Level 4 /respond:", body);

    const { userMessage, conversationHistory = [], questionCount = 0 } = body;

    // Weekly update context that the AI manager should reference
    const weeklyUpdateContext = `
    EMPLOYEE'S WEEKLY UPDATE (for manager reference only - DO NOT read aloud):
    - Made 3 Facebook ads for new clothing campaign
    - Worked with design team to choose pictures and write short texts
    - Posted 4 Instagram photos for summer sale promotion
    - Checked last week's ad performance - one ad had 25% more clicks than usual
    - Conducted online survey about customer style preferences
    - Found that bright colors were the top customer choice
    - Prepared a 2-page report with survey results on Friday
    `;

    const systemMsg = {
      role: "system",
      content: `You are Charlie, a professional but friendly marketing manager conducting a weekly check-in with your employee.

      ${weeklyUpdateContext}

      INSTRUCTIONS:
      - Ask simple, realistic workplace questions about their work this week
      - If their answer doesn't match the update, politely guide them back with "Are you sure? I thought you were working on..."
      - Ask follow-up questions to get more detail
      - Keep the conversation like a real workplace check-in
      - Be professional but warm and encouraging
      - Do NOT read the update paragraph aloud
      - Focus on one topic at a time before moving to the next
      - Current question count: ${questionCount}

      TOPICS TO COVER (one at a time):
      1. Facebook ads for clothing campaign
      2. Instagram posts for summer sale
      3. Ad performance analysis
      4. Customer preference survey
      5. Design team collaboration
      6. Report preparation

      Respond with a JSON object: {"speaker":"Charlie","text":"your response"}`,
    };
    
    const userPrompt = {
      role: "user",
      content: userMessage
        ? `Employee answered: "${userMessage}". Ask your next question or provide feedback.`
        : `Start the weekly check-in by asking about their ad work this week.`,
    };
    
    // Score user's response if they provided one
    let scoreData = { points: 0, maxPoints: 1, feedback: "" };
    if (userMessage && userMessage.trim()) {
      const lastManagerQuestion = conversationHistory
        .filter((msg: any) => msg.role === "assistant")
        .pop()?.content || "initial question";
      
      scoreData = await scoreUserResponse(userMessage, lastManagerQuestion);
      console.log("📊 User score:", scoreData);
    }

    const content = await callOpenAI([systemMsg, ...conversationHistory, userPrompt]);
    console.log("🧠 GPT raw response:", content);

    let json;
    try {
      json = JSON.parse(content);
    } catch {
      // Try to extract JSON from response
      const match = content.match(/\{[\s\S]*?\}/);
      if (match) {
        try {
          json = JSON.parse(match[0]);
        } catch {
          json = null;
        }
      }
    }

    // Fallback responses based on question count
    if (!json) {
      console.warn("⚠️ GPT response not JSON. Using fallback.");
      const fallbackQuestions = [
        "What did you work on this week related to ads?",
        "How many Instagram posts did you make for the summer sale?",
        "Did you notice any changes in the clicks or views for last week's ads?",
        "You mentioned doing some research — what did you find out about customer preferences?",
        "How did working with the design team go this week?",
        "What kind of report did you prepare for me?",
        "Great work this week! Any challenges you faced that we should discuss?",
        "Thanks for the update. Keep up the excellent work!"
      ];
      
      const questionIndex = Math.min(questionCount, fallbackQuestions.length - 1);
      json = { 
        speaker: "Charlie", 
        text: fallbackQuestions[questionIndex]
      };
    }

    console.log("📤 Level 4 /respond sending:", JSON.stringify(json, null, 2));
    console.log("📊 Score data:", scoreData);

    return NextResponse.json({ 
      conversation: json,
      score: scoreData
    });
  } catch (err: any) {
    console.error("❌ Level 4 respond error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 