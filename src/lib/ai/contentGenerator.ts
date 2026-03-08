import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

export enum Skill {
    LISTENING = 'LISTENING',
    READING = 'READING',
    WRITING = 'WRITING',
    SPEAKING = 'SPEAKING'
}

const openai = new OpenAI();

export const generateDailyPractice = async () => {
    // Generate writing task 2
    await generateWritingTask2();
    // We can similarly add generateReadingPassage(), etc.
};

async function generateWritingTask2() {
    const systemPrompt = `You are an expert IELTS curriculum developer. 
Create a new IELTS Writing Task 2 prompt on a trending topic (e.g., technology, environment, society).
Return a JSON object with:
- title: A short descriptive title (string)
- prompt: The actual essay prompt (string)
- description: Brief description of the skills tested (string)`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: "system", content: systemPrompt }],
        response_format: { type: "json_object" },
    });

    const contentStr = response.choices[0].message.content || '{}';
    const data = JSON.parse(contentStr);

    // Set to active tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Use a transaction or single create
    await prisma.practiceSet.create({
        data: {
            title: data.title || `Writing Task 2 - ${tomorrow.toDateString()}`,
            description: data.description || "Daily Writing Task 2 Practice",
            skill: Skill.WRITING,
            isDaily: true,
            activeDate: tomorrow,
            content: JSON.stringify({ prompt: data.prompt }),
        }
    });
}
