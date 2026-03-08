import OpenAI from 'openai';
import { checkAIBudget, recordAIUsage } from '@/services/budgetGuard';

const openai = new OpenAI();

export interface ReadingQuestion {
    id: number;
    text: string;
    answerKey: string | string[]; // Can be single answer or multiple accepted answers
    type: string;
}

export interface ReadingSubmission {
    questions: ReadingQuestion[];
    userAnswers: Record<number, string>;
}

export interface ReadingEvaluation {
    totalCorrect: number;
    totalIncorrect: number;
    rawScore: number;
    bandScore: number;
    wrongAnswers: {
        questionId: number;
        userAnswer: string;
        correctAnswer: string;
        reason: string;
    }[];
    feedback: string;
}

export const evaluateReading = async (
    userId: string,
    submission: ReadingSubmission,
    useAdvancedModel: boolean = false
): Promise<ReadingEvaluation> => {

    await checkAIBudget(userId);
    const model = useAdvancedModel ? 'gpt-4o' : 'gpt-4o-mini';

    const systemPrompt = `You are an extremely strict IELTS Reading examiner.

Your task is to score the candidate’s Reading test harshly based only on:
1. The answer key
2. The candidate’s answers

Strict marking rules:
- Mark answers wrong unless they clearly match the accepted answer.
- Do not reward approximate meaning.
- Do not reward partially correct responses.
- Penalize spelling mistakes unless explicitly told not to.
- Penalize grammar form errors when they affect the required answer.
- Penalize word limit violations immediately.
- Penalize wrong True/False/Not Given or Yes/No/Not Given choices with no leniency.
- If the answer contains extra words that make it non-standard or ambiguous, mark it wrong.
- If a required phrase is incomplete, mark it wrong.
- If the candidate gives multiple answers where only one is allowed, mark it wrong unless rules explicitly allow it.
- When uncertain, choose the lower and stricter judgment.

Band conversion policy:
- Count the exact number of correct answers first.
- Convert raw score to IELTS band using the standard Academic Reading conversion table (e.g. 39-40 = 9.0; 37-38 = 8.5; 35-36 = 8.0; 33-34 = 7.5; 30-32 = 7.0; 27-29 = 6.5; 23-26 = 6.0; 19-22 = 5.5; 15-18 = 5.0; 13-14 = 4.5; 10-12 = 4.0; 8-9 = 3.5; 6-7 = 3.0).
- If no table is supplied, state raw score and provide a cautious estimated band.

CRITICAL SCORE CEILINGS (ZERO-TOLERANCE POLICY):
- If the majority of answers are simple spelling mistakes, cap the score at 5.0.
- If the candidate completely fails a section, cap the score drastically.

Output policy:
- Show total correct answers.
- Show total incorrect answers.
- Show raw score.
- Show estimated or exact band.
- Show each wrong answer with a precise reason in Vietnamese to help the user understand exactly why they failed.
- Do not soften criticism. Be strictly critical.

FORMATTING REQUIREMENTS:
- Your feedback and reasons MUST be formatted using highly professional styling with raw HTML.
- Highlight wrong answers or mistakes using: <span class="text-red-600 bg-red-100 font-bold px-1.5 py-0.5 rounded shadow-sm">wrong</span>
- Highlight correct concepts or answers using: <span class="text-emerald-600 bg-emerald-100 font-bold px-1.5 py-0.5 rounded shadow-sm">correct</span>
- Highlight important structural feedback using: <span class="text-amber-600 bg-amber-100 font-bold px-1.5 py-0.5 rounded shadow-sm">important note</span>
- Use <strong> for subheadings.
- Use 'class' instead of 'className' since this is raw HTML.

Return a JSON object with EXACTLY this structure:
{
  "totalCorrect": number,
  "totalIncorrect": number,
  "rawScore": number,
  "bandScore": number,
  "wrongAnswers": [
    {
       "questionId": number,
       "userAnswer": "The candidate's wrong input",
       "correctAnswer": "The accepted answer according to the key",
       "reason": "Harsh explanation in VIETNAMESE (HTML-encoded styling) of why it is wrong"
    }
  ],
  "feedback": "Strict summary feedback in VIETNAMESE (HTML-encoded styling) about their reading performance. Make it look professional."
}`;

    const userContent = JSON.stringify({
        questions: submission.questions,
        userAnswers: submission.userAnswers
    });

    const response = await openai.chat.completions.create({
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Evaluate the following candidates Reading test:\n\n${userContent}` }
        ],
        response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;

    let evaluation: ReadingEvaluation;
    try {
        evaluation = JSON.parse(content || "{}") as ReadingEvaluation;
    } catch (e: unknown) {
        throw new Error("Failed to parse AI reading evaluation");
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    await recordAIUsage(userId, tokensUsed);

    return evaluation;
};
