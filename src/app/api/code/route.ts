import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI, InputContent } from "@google/generative-ai";
import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

const genAI = new GoogleGenerativeAI(process.env["GOOGLE_API_KEY"] as string);

const instructionMessage: InputContent[] = [
  {
    role: "user",
    parts: "You are a code generator, You must answer only in markdown code snippets. Use code comments for explanations."
  },
  {
    role: "model",
    parts: "ok"
  }
]

export async function POST(req: Request) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});

    const { userId } = auth();
    const body = await req.json();
    const { messages, userMessage } = body;

    if (!userId) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    if (!genAI.apiKey) {
      return new NextResponse("OpenAI API Key not configured", { status: 500 });
    }

    if (!messages) {
      return new NextResponse("Messages are required", { status: 400 });
    }

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro) {
      return new NextResponse("Free trial has expired", {
        status: 403,
      });
    }
    
    const chat = model.startChat({
        history: [...instructionMessage,...messages]
    });

    const result = await chat.sendMessage(userMessage.parts);
    const response = await result.response;
    const text = response.text();

    if(!isPro){
      await increaseApiLimit();
    }
    
    return NextResponse.json({role:'model',parts: text});

  } catch (error) {
    console.log("[CODE_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
