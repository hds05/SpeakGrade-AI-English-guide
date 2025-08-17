// ✅ src/app/api/level5/respond/route.ts
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
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${await res.text()}`);
  }

  const payload = await res.json();
  return payload.choices?.[0]?.message?.content ?? "";
}

// ✅ Scoring function for police encounter
async function scoreUserResponse(userMessage: string, questionContext: string) {
  if (!userMessage || userMessage.trim().length < 3) {
    return { points: 0, maxPoints: 1, feedback: "Response too short or empty" };
  }

  const scoringPrompt = {
    role: "system",
    content: `You are evaluating a driver's response to a police officer about a parking ticket.

    THE ACTUAL FACTS (reference truth):
    - Parked at 9:15 AM in no-parking zone in front of Green Leaf Café
    - Delivery van for bakery business
    - Had to deliver a three-tier wedding cake to café manager
    - Cake couldn't be left unattended (special delivery)
    - All other parking spots were taken
    - Had hazard lights on
    - Was inside for less than one minute
    - Has delivery schedule and signed receipt as proof

    SCORING CRITERIA:
    - 1 point: Response includes accurate, specific details from the facts
    - 0 points: Response is vague, incorrect, or contradicts the facts

    EXAMPLES:
    Question: "How long were you parked here?"
    - Good (1 point): "Less than one minute" or "About 30 seconds"
    - Bad (0 points): "A few minutes" or "I don't know"

    Question: "What were you delivering?"
    - Good (1 point): "A three-tier wedding cake to the café manager"
    - Bad (0 points): "Some food" or "Wedding decorations"

    Question: "Why didn't you find legal parking?"
    - Good (1 point): "All other parking spots were taken" or "Everywhere else was full"
    - Bad (0 points): "I was in a hurry" or "I didn't look"

    Respond with JSON: {"points": 0 or 1, "maxPoints": 1, "feedback": "brief explanation"}`
  };

  const userPrompt = {
    role: "user",
    content: `Previous question/context: "${questionContext}"
    Driver's response: "${userMessage}"
    
    Score this response based on accuracy and specificity compared to the actual facts.`
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
    
    // Simple keyword-based scoring for key facts
    if (lowerResponse.includes("less than") && lowerResponse.includes("minute")) {
      return { points: 1, maxPoints: 1, feedback: "Correct timing details" };
    } else if (lowerResponse.includes("wedding cake") && lowerResponse.includes("three")) {
      return { points: 1, maxPoints: 1, feedback: "Correct delivery details" };
    } else if (lowerResponse.includes("green leaf") || lowerResponse.includes("café")) {
      return { points: 1, maxPoints: 1, feedback: "Correct location details" };
    } else if (lowerResponse.includes("hazard") && lowerResponse.includes("lights")) {
      return { points: 1, maxPoints: 1, feedback: "Mentioned safety precautions" };
    } else if (lowerResponse.includes("delivery") && (lowerResponse.includes("schedule") || lowerResponse.includes("receipt"))) {
      return { points: 1, maxPoints: 1, feedback: "Provided evidence" };
    } else if (lowerResponse.includes("all") && lowerResponse.includes("taken")) {
      return { points: 1, maxPoints: 1, feedback: "Explained parking situation" };
    } else if (lowerResponse.includes("9:15") || lowerResponse.includes("morning")) {
      return { points: 1, maxPoints: 1, feedback: "Correct time details" };
    }
    
    return { points: 0, maxPoints: 1, feedback: "Response needs more specific details" };
  }
}

// ✅ Determine ticket outcome based on conversation
function determineTicketOutcome(conversationHistory: any[], questionCount: number, totalScore: number, maxScore: number): string {
  const accuracy = maxScore > 0 ? (totalScore / maxScore) : 0;
  
  // If they've been very accurate and answered many questions, they might get ticket cancelled
  if (questionCount >= 6 && accuracy >= 0.8) {
    return "cancelled";
  }
  
  // If they've given many wrong answers or been vague
  if (questionCount >= 5 && accuracy < 0.4) {
    return "valid";
  }
  
  // Check if conversation shows good explanation
  const userResponses = conversationHistory.filter((msg: any) => msg.role === "user");
  const hasGoodExplanation = userResponses.some((msg: any) => {
    const content = msg.content.toLowerCase();
    return content.includes("wedding cake") && content.includes("minute") && content.includes("delivery");
  });
  
  if (questionCount >= 7 && hasGoodExplanation && accuracy >= 0.6) {
    return "cancelled";
  }
  
  return "pending";
}

// ✅ Your POST handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("✅ Received body in Level 5 /respond:", body);

    const { userMessage, conversationHistory = [], questionCount = 0 } = body;

    // Facts context that the AI officer should reference
    const factsContext = `
    FACTS ABOUT THE PARKING SITUATION (for officer reference only):
    - Driver parked at 9:15 AM in no-parking zone in front of Green Leaf Café
    - Was delivering a three-tier wedding cake from bakery to café manager
    - All other parking spots nearby were taken
    - Had hazard lights on during delivery
    - Was inside for less than one minute
    - Has delivery schedule and signed receipt as proof
    - This was a legitimate business delivery that couldn't be postponed
    `;

    // Score user's response if they provided one
    let scoreData = { points: 0, maxPoints: 1, feedback: "" };
    let currentScore = 0;
    let currentMaxScore = 0;
    
    if (userMessage && userMessage.trim()) {
      const lastOfficerQuestion = conversationHistory
        .filter((msg: any) => msg.role === "assistant")
        .pop()?.content || "initial question";
      
      scoreData = await scoreUserResponse(userMessage, lastOfficerQuestion);
      console.log("📊 User score:", scoreData);
      
      // Calculate running totals for ticket decision
      currentScore = conversationHistory
        .filter((msg: any) => msg.role === "user")
        .length * scoreData.points; // Simplified calculation
      currentMaxScore = (conversationHistory.filter((msg: any) => msg.role === "user").length + 1);
    }

    const ticketOutcome = determineTicketOutcome(conversationHistory, questionCount, currentScore, currentMaxScore);

    const systemMsg = {
      role: "system",
      content: `You are Officer Davis, a realistic city police officer who just wrote a parking ticket.

      ${factsContext}

      INSTRUCTIONS:
      - Keep language short, realistic, and like an actual street cop
      - If their answers don't match facts, remain polite but firm about the ticket being valid
      - If their answers match facts and are clear, ask follow-up questions to verify
      - If story stays consistent through multiple questions, gradually become more sympathetic
      - Eventually cancel ticket if they provide convincing, accurate explanation
      - Current question count: ${questionCount}
      - Current ticket status: ${ticketOutcome}

      CONVERSATION STYLE:
      - Use short, direct sentences like real police officer
      - Be professional but not overly formal
      - Show some personality - you're human too
      - If they're telling truth consistently, show you're considering their situation

      TOPICS TO VERIFY:
      1. How long they were parked
      2. What they were delivering
      3. Why they couldn't find legal parking
      4. Safety precautions taken (hazard lights)
      5. Proof of legitimate delivery
      6. Time-sensitive nature of delivery

      Respond with a JSON object: {"speaker":"Officer Davis","text":"your response"}`,
    };
    
    const userPrompt = {
      role: "user",
      content: userMessage
        ? `Driver said: "${userMessage}". ${ticketOutcome === "cancelled" ? "Consider cancelling the ticket if their story checks out." : ticketOutcome === "valid" ? "The ticket should remain valid." : "Continue questioning to verify their story."}`
        : `Start by asking about how long they've been parked here.`,
    };
    
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

    // Fallback responses based on question count and ticket status
    if (!json) {
      console.warn("⚠️ GPT response not JSON. Using fallback.");
      const fallbackQuestions = [
        "How long have you been parked here?",
        "What were you doing in the café?",
        "Did you see the no-parking signs?",
        "Why didn't you find legal parking?",
        "What exactly were you delivering?",
        "Do you have any proof of this delivery?",
        "How long does a delivery like this usually take?",
        ticketOutcome === "cancelled" ? "Alright, I'm going to cancel this ticket. Your story checks out." : "The ticket stands. You still parked illegally.",
      ];
      
      const questionIndex = Math.min(questionCount, fallbackQuestions.length - 1);
      json = { 
        speaker: "Officer Davis", 
        text: fallbackQuestions[questionIndex]
      };
    }

    console.log("📤 Level 5 /respond sending:", JSON.stringify(json, null, 2));
    console.log("📊 Score data:", scoreData);
    console.log("🎫 Ticket outcome:", ticketOutcome);

    return NextResponse.json({ 
      conversation: json,
      score: scoreData,
      ticketOutcome: ticketOutcome
    });
  } catch (err: any) {
    console.error("❌ Level 5 respond error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 