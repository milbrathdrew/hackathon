import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question, context } = body as { question?: string; context?: string };

  if (!question?.trim()) {
    return NextResponse.json({ error: "No question provided" }, { status: 400 });
  }
  if (!context?.trim()) {
    return NextResponse.json({ error: "No policy context provided" }, { status: 400 });
  }

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 512,
    system: `You are a helpful insurance policy assistant. The user has uploaded their insurance policy and you have a detailed summary of it below. Answer their questions clearly and specifically, in plain English. If the answer isn't covered by the policy summary, say so honestly. Keep answers concise — 2–4 sentences unless a list is genuinely more helpful.

POLICY SUMMARY:
${context}`,
    messages: [
      {
        role: "user",
        content: question.trim(),
      },
    ],
  });

  const answer = response.content.find((b) => b.type === "text")?.text ?? "";

  return NextResponse.json({ answer });
}
