// ✅ src/app/api/level7/respond/route.ts
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
      max_tokens: 180,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${await res.text()}`);
  }

  const payload = await res.json();
  return payload.choices?.[0]?.message?.content ?? "";
}

// ✅ Scoring function for fast-food order correction
async function scoreUserResponse(userMessage: string, questionContext: string) {
  if (!userMessage || userMessage.trim().length < 3) {
    return { points: 0, maxPoints: 1, feedback: "Response too short or empty" };
  }

  const scoringPrompt = {
    role: "system",
    content: `You are evaluating a customer's response about their incorrect fast-food order.

    THE ACTUAL ORDER SITUATION (reference truth):
    ORDERED: Double cheeseburger with NO onions, medium fries, large regular Coke, free onion rings (with coupon)
    RECEIVED: Burger WITH onions, small fries, diet Coke, no onion rings
    TIME: 1:05 PM at Burger Express drive-thru
    EVIDENCE: Has receipt and paper coupon ready to show

    SCORING CRITERIA:
    - 1 point: Response includes specific, accurate details about the order mistakes
    - 0 points: Response is vague, incorrect, or doesn't mention specific issues

    EXAMPLES:
    Question: "What can I help you with today?"
    - Good (1 point): "My order has several mistakes - wrong toppings, wrong size, wrong drink"
    - Bad (0 points): "Something's wrong with my food" (too vague)

    Question: "What's wrong with the burger?"
    - Good (1 point): "It has onions but I ordered no onions" or "I asked for no onions"
    - Bad (0 points): "The toppings are wrong" (not specific enough)

    Question: "What about the fries?"
    - Good (1 point): "I got small fries but ordered medium" or "These are the wrong size"
    - Bad (0 points): "The fries are wrong" (no specifics)

    Respond with JSON: {"points": 0 or 1, "maxPoints": 1, "feedback": "brief explanation"}`
  };

  const userPrompt = {
    role: "user",
    content: `Previous question/context: "${questionContext}"
    Customer's response: "${userMessage}"
    
    Score this response based on accuracy and specificity about their order issues.`
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
    
    // Simple keyword-based scoring for order issues
    if (lowerResponse.includes("onions") && (lowerResponse.includes("no") || lowerResponse.includes("without"))) {
      return { points: 1, maxPoints: 1, feedback: "Correctly mentioned no onions issue" };
    } else if (lowerResponse.includes("small") && lowerResponse.includes("medium") && lowerResponse.includes("fries")) {
      return { points: 1, maxPoints: 1, feedback: "Specific fries size issue" };
    } else if (lowerResponse.includes("diet") && lowerResponse.includes("regular") && lowerResponse.includes("coke")) {
      return { points: 1, maxPoints: 1, feedback: "Specific drink type issue" };
    } else if (lowerResponse.includes("onion rings") && (lowerResponse.includes("missing") || lowerResponse.includes("coupon"))) {
      return { points: 1, maxPoints: 1, feedback: "Mentioned missing coupon item" };
    } else if (lowerResponse.includes("receipt") && lowerResponse.includes("coupon")) {
      return { points: 1, maxPoints: 1, feedback: "Has documentation ready" };
    } else if (lowerResponse.includes("multiple") || lowerResponse.includes("several") || lowerResponse.includes("wrong")) {
      return { points: 1, maxPoints: 1, feedback: "Acknowledged multiple issues" };
    }
    
    return { points: 0, maxPoints: 1, feedback: "Response needs more specific order details" };
  }
}

// ✅ Determine which order issues have been addressed
function updateOrderIssues(conversationHistory: any[], currentIssues: any): any {
  const userMessages = conversationHistory
    .filter((msg: any) => msg.role === "user")
    .map((msg: any) => msg.content.toLowerCase());
  
  const allText = userMessages.join(" ");
  
  return {
    burger: currentIssues.burger || (allText.includes("onions") && (allText.includes("no") || allText.includes("without"))),
    fries: currentIssues.fries || (allText.includes("small") && allText.includes("medium") && allText.includes("fries")),
    drink: currentIssues.drink || (allText.includes("diet") && allText.includes("regular")),
    coupon: currentIssues.coupon || (allText.includes("onion rings") || (allText.includes("coupon") && allText.includes("free")))
  };
}

// ✅ Your POST handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("✅ Received body in Level 7 /respond:", body);

    const { userMessage, conversationHistory = [], questionCount = 0, orderIssues = {} } = body;

    // Order context that the AI cashier should reference
    const orderContext = `
    CUSTOMER'S ACTUAL ORDER (for cashier reference only):
    ORDERED: Double cheeseburger with NO onions, medium fries, large regular Coke, free onion rings (with paper coupon)
    RECEIVED: Burger WITH onions, small fries, diet Coke, no onion rings
    TIME: 1:05 PM pickup at Burger Express drive-thru
    CUSTOMER HAS: Receipt and paper coupon ready to show
    ALL ISSUES ARE LEGITIMATE and should be corrected per store policy
    `;

    // Score user's response if they provided one
    let scoreData = { points: 0, maxPoints: 1, feedback: "" };
    
    if (userMessage && userMessage.trim()) {
      const lastCashierQuestion = conversationHistory
        .filter((msg: any) => msg.role === "assistant")
        .pop()?.content || "initial greeting";
      
      scoreData = await scoreUserResponse(userMessage, lastCashierQuestion);
      console.log("📊 User score:", scoreData);
    }

    // Update order issues based on conversation
    const updatedIssues = updateOrderIssues(conversationHistory, orderIssues);
    const addressedCount = Object.values(updatedIssues).filter(Boolean).length;

    const systemMsg = {
      role: "system",
      content: `You are Mike, a friendly and efficient cashier at Burger Express fast-food restaurant.

      ${orderContext}

      INSTRUCTIONS:
      - Keep tone friendly, concise, and like a real cashier
      - If customer's explanation matches the facts, ask follow-up questions to confirm details
      - If they show receipt and coupon, acknowledge and work to fix the order
      - If explanations don't match facts, remain polite but cite store policy
      - Be helpful but efficient (this is fast food)
      - Current question count: ${questionCount}
      - Issues addressed so far: ${addressedCount}/4

      CASHIER PERSONALITY:
      - Friendly but quick
      - Professional fast-food service
      - Asks for verification (receipt, coupon)
      - Problem-solver mindset
      - Acknowledges mistakes when legitimate

      ORDER ISSUES TO ADDRESS:
      1. Burger toppings (has onions, ordered no onions)
      2. Fries size (got small, ordered medium)
      3. Drink type (got diet, ordered regular)
      4. Missing coupon item (no onion rings)

      EXAMPLE RESPONSES:
      - "I can definitely help fix that. Can you show me your receipt?"
      - "Let me get you a new burger without onions right away."
      - "I'll upgrade those fries to medium for you."
      - "I see your coupon here - let me get those onion rings."

      Respond with a JSON object: {"speaker":"Mike","text":"your response"}`,
    };
    
    const userPrompt = {
      role: "user",
      content: userMessage
        ? `Customer said: "${userMessage}". ${addressedCount < 4 ? "Help them get their order corrected by asking for details and verification." : "Wrap up by confirming all issues are fixed."}`
        : `Greet the customer and ask how you can help them.`,
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

    // Fallback responses based on question count and issues
    if (!json) {
      console.warn("⚠️ GPT response not JSON. Using fallback.");
      const fallbackQuestions = [
        "Hi there—what can I help you with today?",
        "Could you walk me through what you ordered and what you received?",
        "Can you point out which items are wrong or missing?",
        "May I see your receipt and the coupon, please?",
        "Let me fix that burger for you - no onions, right?",
        "I'll get you medium fries to replace those small ones.",
        "Let me swap that diet for a regular Coke.",
        "Here are your onion rings from the coupon.",
        "Is there anything else I can fix for you today?",
      ];
      
      const questionIndex = Math.min(questionCount, fallbackQuestions.length - 1);
      json = { 
        speaker: "Mike", 
        text: fallbackQuestions[questionIndex]
      };
    }

    console.log("📤 Level 7 /respond sending:", JSON.stringify(json, null, 2));
    console.log("📊 Score data:", scoreData);
    console.log("🍔 Order issues:", updatedIssues);

    return NextResponse.json({ 
      conversation: json,
      score: scoreData,
      orderIssues: updatedIssues
    });
  } catch (err: any) {
    console.error("❌ Level 7 respond error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 