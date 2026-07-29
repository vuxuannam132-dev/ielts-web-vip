import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/auth";

const openai = new OpenAI();

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        // Allow access only to ADMIN or TEACHER. (auth session usually contains role, but let's just make sure they are logged in for now, or check role if available).
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { text } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const systemPrompt = `You are an intelligent IELTS Practice Set parser. 
Your task is to take a raw, unstructured text or malformed JSON provided by a teacher and convert it into a strictly formatted JSON object that fits our system's schema.

Determine the skill (READING, LISTENING, WRITING, SPEAKING) from the text context if not explicitly clear.

Return ONLY a JSON object with the following structure based on the detected skill:

For READING:
{
  "skill": "reading",
  "title": "Extracted or inferred title",
  "difficulty": "Medium",
  "content": {
    "passages": [
      {
        "title": "Passage 1 Title",
        "text": "The full text of the passage...",
        "questions": [
          { "text": "Question text", "type": "mcq|fill|tf|matching", "options": ["A", "B", "C", "D"], "answer": "A" }
        ]
      }
    ]
  }
}

For LISTENING:
{
  "skill": "listening",
  "title": "Extracted or inferred title",
  "difficulty": "Medium",
  "content": {
    "audioUrl": "", // leave empty string if not found
    "parts": [
      {
        "title": "Part 1",
        "text": "Transcript or notes...",
        "questions": [
           { "text": "Question text", "type": "fill", "options": [], "answer": "expected answer" }
        ]
      }
    ]
  }
}

For WRITING:
{
  "skill": "writing",
  "title": "Extracted or inferred title",
  "difficulty": "Medium",
  "content": {
    "writing": {
      "task1Prompt": "Task 1 prompt...",
      "task1Image": "",
      "task2Prompt": "Task 2 prompt..."
    }
  }
}

For SPEAKING:
{
  "skill": "speaking",
  "title": "Extracted or inferred title",
  "difficulty": "Medium",
  "content": {
    "speaking": {
      "part1": "Questions for part 1...",
      "part2": "Cue card...",
      "part3": "Questions for part 3..."
    }
  }
}

Make sure the output is VALID JSON. Correct any typos or formatting issues in the questions.
`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const resultText = response.choices[0].message.content || '{}';
        const parsedData = JSON.parse(resultText);

        return NextResponse.json({ success: true, data: parsedData });
    } catch (error: any) {
        console.error("[Parse Practice Error]:", error);
        return NextResponse.json({ error: error.message || "Failed to parse text" }, { status: 500 });
    }
}
