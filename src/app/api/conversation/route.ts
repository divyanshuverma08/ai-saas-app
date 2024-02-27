import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env["GOOGLE_API_KEY"] as string);

export async function POST(req: Request) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro"});

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

    const chat = model.startChat({
        history: messages,
    });

    const result = await chat.sendMessage(userMessage.parts);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({role:'model',parts: text});

  } catch (error) {
    console.log("[CONVERSATIONAL_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
