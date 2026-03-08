import OpenAI from 'openai';
import { checkAIBudget, recordAIUsage } from '@/services/budgetGuard';

const openai = new OpenAI();

export interface ListeningQuestion {
    id: number;
    text: string;
    answerKey: string | string[];
    type: string;
}

export interface ListeningSubmission {
    questions: ListeningQuestion[];
    userAnswers: Record<number, string>;
}

export interface ListeningEvaluation {
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

export const evaluateListening = async (
    userId: string,
    submission: ListeningSubmission,
    useAdvancedModel: boolean = false
): Promise<ListeningEvaluation> => {

    await checkAIBudget(userId);
    const model = useAdvancedModel ? 'gpt-4o' : 'gpt-4o-mini';

    const systemPrompt = `You are an extremely strict IELTS Listening examiner.

Your task is to score the candidate’s Listening test harshly based only on:
1. The answer key
2. The candidate’s answers

Strict marking rules:
- Mark answers wrong unless they clearly match the accepted answer.
- Do not infer intended meaning.
- Do not reward “almost correct” answers.
- Penalize spelling mistakes unless explicitly told not to.
- Penalize plural/singular mistakes when they change correctness.
- Penalize word limit violations immediately.
- Penalize incorrect capitalization if the task or answer format requires it.
- If an answer is incomplete, mark it wrong.
- If multiple answers are given where only one is required, mark it wrong unless the marking rules explicitly allow alternatives.
- If the candidate uses a synonym not listed in the accepted answers, mark it wrong unless it is unquestionably equivalent and clearly acceptable.
- When uncertain, choose the stricter interpretation.

Band conversion policy:
- Count the number of correct answers first.
- Convert raw score to IELTS band using the standard Listening conversion table (e.g. 39-40 = 9.0; 37-38 = 8.5; 35-36 = 8.0; 32-34 = 7.5; 30-31 = 7.0; 26-29 = 6.5; 23-25 = 6.0; 18-22 = 5.5; 16-17 = 5.0; 13-15 = 4.5; 10-12 = 4.0).
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
  "feedback": "Strict summary feedback in VIETNAMESE (HTML-encoded styling) about their listening performance. Make it look professional."
}`;

    const userContent = JSON.stringify({
        questions: submission.questions,
        userAnswers: submission.userAnswers
    });

    const response = await openai.chat.completions.create({
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Evaluate the following candidates Listening test:\n\n${userContent}` }
        ],
        response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;

    let evaluation: ListeningEvaluation;
    try {
        evaluation = JSON.parse(content || "{}") as ListeningEvaluation;
    } catch (e: unknown) {
        throw new Error("Failed to parse AI listening evaluation");
    }

    const tokensUsed = response.usage?.total_tokens || 0;
    await recordAIUsage(userId, tokensUsed);

    return evaluation;
};
