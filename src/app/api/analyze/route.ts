import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  let response;
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            {
              type: "text",
              text: `Analyze this insurance policy and return a JSON object with exactly these five keys:
- "covered": plain-English bullet list of what is covered (array of strings, max 6 items)
- "excluded": plain-English bullet list of key exclusions (array of strings, max 6 items)
- "limits": key deductibles, limits, and dollar amounts (array of strings, max 6 items)
- "claims": step-by-step how to file a claim (array of strings, max 5 steps)
- "context": a plain-English summary of the full policy (200–300 words) covering the key coverage details, exclusions, limits, and procedures — written so someone could ask follow-up questions and you could answer them accurately from this text alone

Return only valid JSON, no markdown, no explanation.`,
            },
          ],
        },
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Anthropic API error";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (response.stop_reason === "max_tokens") {
    return NextResponse.json({ error: "Response exceeded token limit — try a shorter document" }, { status: 500 });
  }

  const raw = response.content.find((b) => b.type === "text")?.text ?? "{}";
  // Extract the JSON object — handles code fences and leading/trailing prose
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const text = jsonMatch ? jsonMatch[0].trim() : raw.trim();

  let summary;
  try {
    summary = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Failed to parse policy summary" }, { status: 500 });
  }

  return NextResponse.json(summary);
}
