import OpenAI from 'openai';
import { checkAIBudget, recordAIUsage } from '@/services/budgetGuard';
import fs from 'fs';

const openai = new OpenAI();

export interface SpeakingSubmission {
    partNumber: 1 | 2 | 3;
    prompt: string;
    audioFilePath: string; // File path on the temporary disk
}

export interface SpeakingEvaluation {
    bandScore: number;
    fluencyScore: number;
    lexicalResourceScore: number;
    grammarScore: number;
    pronunciationScore: number;
    feedback: string;
    transcript: string;
    improvements: string[];
    isOffTopicOrVietnamese: boolean;
    suggestedAnswer: string;
    pronunciationErrors: {
        word: string;
        phonetic: string;
        error: string;
    }[];
}

export const evaluateSpeaking = async (
    userId: string,
    submission: SpeakingSubmission,
    useAdvancedModel: boolean = false
): Promise<SpeakingEvaluation> => {

    await checkAIBudget(userId);

    // 1. Transcribe Audio using Whisper
    const transcriptionStart = Date.now();
    const transcriptRes = await openai.audio.transcriptions.create({
        file: fs.createReadStream(submission.audioFilePath),
        model: 'whisper-1',
    });
    const transcriptDuration = Date.now() - transcriptionStart;
    const transcript = transcriptRes.text;

    const proxyAudioTokens = Math.floor(transcriptDuration / 1000) * 100;

    // 2. Evaluate Transcription text
    const model = useAdvancedModel ? 'gpt-4o' : 'gpt-4o-mini';

    const systemPrompt = `You are an extremely strict IELTS Speaking examiner.

Global grading policy:
- Be severe, conservative, and skeptical.
- Do not give the candidate the benefit of the doubt.
- If performance falls between two bands, always choose the lower band.
- Penalize every noticeable weakness.
- Do not inflate scores for effort, intention, or partially correct performance.
- Do not use encouraging or soft language.
- Do not praise unless absolutely necessary.
- Keep feedback direct, critical, specific, and evidence-based.
- If the response is incomplete, unclear, off-task, repetitive, unnatural, or inaccurate, reduce the score immediately.
- Output scores only in 0.5 band increments.
- The final score must reflect a harsh examiner standard, not a generous classroom standard.

CRITICAL RULE: First, determine if the user's transcript is primarily in Vietnamese or completely off-topic.
If it is Vietnamese or completely off-topic, set "isOffTopicOrVietnamese" to true, all scores to 0, and write a feedback asking them to speak in English based on the prompt.

Evaluate the user's IELTS Speaking Part ${submission.partNumber} transcript. 
Note: Punctuation was added by Whisper AI. To evaluate Fluency and Coherence, look for unnatural grammar structures, repeated words (stammering), and lack of cohesive devices. For Pronunciation, guess from the transcript's spelling errors (if Whisper heard a vastly different word than context implies, pronunciation was likely poor). 

Strict grading rules:
- Be harsher than a normal examiner.
- Never give the benefit of the doubt.
- If vocabulary is repetitive or inaccurate, reduce Lexical Resource.
- If grammar errors are frequent, keep Grammatical Range and Accuracy low.

CRITICAL SCORE CEILINGS (ZERO-TOLERANCE POLICY):
- If the speaker gives extremely short, one-sentence answers that do not develop the topic, the MAXIMUM OVERALL BAND SCORE is 3.5.
- If the speaker's sentences are mostly simple (S-V-O) with frequent, halting pauses and basic grammar mistakes, the Maximum Grammar Score is 3.5.
- If the speaker relies only on basic A1/A2 vocabulary, the Maximum Lexical Resource Score is 3.5.
- If pronunciation makes words frequently unintelligible (based on Whisper's severe misinterpretations), the Maximum Pronunciation Score is 3.5.
- BE MERCILESS. If it sounds like a struggling beginner (A2/B1 level), the score MUST BE between 3.0 and 4.5. DO NOT DEFAULT TO 5.0 OR 5.5. 5.5 requires the ability to keep speaking at length with some complex structures.

Output policy:
- Return only the requested format.
- Do not add extra commentary outside the required structure.
- Justify scores with precise evidence from the candidate’s work.
- YOU MUST EXPLAIN THE FEEDBACK IN VIETNAMESE (keeping technical IELTS terms in English).

Analyze these 4 criteria:
1. Fluency and Coherence (FC)
2. Lexical Resource (LR)
3. Grammatical Range and Accuracy (GRA)
4. Pronunciation (PR - estimate based on transcript context mismatch)

Return a JSON object with EXACTLY this structure:
{
  "isOffTopicOrVietnamese": boolean,
  "bandScore": number (Overall Band, calculated as average of 4 criteria rounded down/up to nearest 0.5. If any critical ceiling applies, cap it drastically),
  "fluencyScore": number,
  "lexicalResourceScore": number,
  "grammarScore": number,
  "pronunciationScore": number,
  "feedback": "Extremely detailed strict feedback in Vietnamese encoded with HTML. Analyze exactly which sentences are poorly spoken and explain why. Be thorough, you have a high token limit. Format with <span class='text-red-600 bg-red-100 font-bold px-1.5 py-0.5 rounded shadow-sm'>wrong</span> and <span class='text-emerald-600 bg-emerald-100 font-bold px-1.5 py-0.5 rounded shadow-sm'>better</span> tags.",
  "improvements": [
     "HTML-encoded rewrite of a poorly spoken section with advanced vocabulary",
     "HTML-encoded actionable tip on generating better ideas or speaking more fluently"
  ],
  "suggestedAnswer": "A high-scoring (Band 8.0+) sample answer for the given prompt.",
  "pronunciationErrors": [
    {
      "word": "The mispronounced word",
      "phonetic": "The correct IPA phonetic transcription (e.g. /riˈteɪl/)",
      "error": "Explanation of what went wrong in Vietnamese (e.g. 'Phát âm sai âm cuối...')"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Prompt: ${submission.prompt}\n\nTranscript:\n${transcript}` }
        ],
        response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;

    let evaluation: Omit<SpeakingEvaluation, 'transcript'>;
    try {
        evaluation = JSON.parse(content || "{}");
    } catch (e: unknown) {
        throw new Error("Failed to parse AI Speaking evaluation");
    }

    const tokensUsed = (response.usage?.total_tokens || 0) + proxyAudioTokens;
    await recordAIUsage(userId, tokensUsed);

    return {
        ...evaluation,
        transcript
    };
};
