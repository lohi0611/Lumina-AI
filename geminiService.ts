
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LearningPath, Difficulty, Quiz } from "./types";

// Always use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLearningPath = async (
  goal: string,
  topics: string,
  difficulty: Difficulty,
  time: string,
  duration: number,
  language: string
): Promise<LearningPath> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Generate a comprehensive, day-by-day learning path for:
      Goal: ${goal}
      Key Topics: ${topics}
      Difficulty Level: ${difficulty}
      Daily Time Commitment: ${time}
      Total Course Duration: ${duration} days
      Preferred Language: ${language}
      
      SPECIAL REFERENCE FOR JAVA/DSA: If the goal relates to Java or Data Structures & Algorithms, ensure a logical progression:
      1. Basics & Complexity Analysis
      2. Arrays, Strings & Bit Manipulation
      3. Recursion & Backtracking
      4. Sorting & Searching
      5. Linked Lists, Stacks & Queues
      6. Trees & Graphs
      7. Dynamic Programming & Greedy Algorithms
      
      CRITICAL INSTRUCTION: You MUST generate exactly ${duration} days of content. Each day must have a clear objective and detailed topics. 
      IMPORTANT: All text in the JSON response (titles, explanations, concepts, examples) MUST be written in ${language}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          goal: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                objective: { type: Type.STRING },
                topics: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                      examples: { type: Type.ARRAY, items: { type: Type.STRING } },
                      practiceFocus: { type: Type.STRING },
                    },
                    required: ["title", "explanation", "keyConcepts", "examples", "practiceFocus"]
                  }
                }
              },
              required: ["day", "objective", "topics"]
            }
          }
        },
        required: ["goal", "difficulty", "days"]
      }
    }
  });

  const path = JSON.parse(response.text || "{}");
  return {
    ...path,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString()
  };
};

export const generateQuiz = async (
  path: LearningPath,
  dayIndex: number,
  language: string
): Promise<Quiz> => {
  const dayData = path.days[dayIndex];
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a mastery quiz for Day ${dayData.day} of the course: ${path.goal}.
      Topics covered: ${dayData.topics.map(t => t.title).join(", ")}.
      Language: ${language}.
      Include 5 questions: 2 MCQ, 2 True/False, and 1 Short Answer.
      CRITICAL: All questions and answers must be in ${language}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          day: { type: Type.NUMBER },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["MCQ", "TF", "SHORT"] },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["id", "type", "question", "correctAnswer", "explanation"]
            }
          }
        }
      }
    }
  });

  const quizData = JSON.parse(response.text || "{}");

  // Ensure ID exists and links to path for progress tracking
  return {
    ...quizData,
    id: `${path.id}-day-${dayData.day}`,
    day: dayData.day
  };
};

export const chatWithAI = async (
  message: string,
  context: string,
  useThinking: boolean = false,
  language: string = "English"
): Promise<string> => {
  // Use gemini-3-pro-preview for deep thinking, and gemini-2.5-flash-lite for instant, low-latency responses
  const model = useThinking ? "gemini-3-pro-preview" : "gemini-2.5-flash-lite";
  
  const config: any = {
    systemInstruction: `You are Lumina, an expert and empathetic personal tutor.
      Current context: ${context}.
      Language: Respond ONLY in ${language}.
      Response Rules:
      1. Use a warm, professional, and encouraging tone.
      2. Keep explanations clear and concise.
      3. Use markdown for better readability.
      4. Always provide an illustrative example when explaining complex concepts.`
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const response = await ai.models.generateContent({
    model,
    contents: message,
    config
  });

  return response.text || "I'm sorry, I couldn't process that.";
};

export const quickAnalyze = async (text: string, action: 'summarize' | 'simplify', language: string): Promise<string> => {
  const model = "gemini-2.5-flash-lite";
  const prompt = action === 'summarize' 
      ? `Provide a high-level, 1-sentence summary of this concept.` 
      : `Rewrite this explanation to be simpler and easier to understand for a beginner.`;
  
  const response = await ai.models.generateContent({
      model,
      contents: `Context: ${text}\nTask: ${prompt}\nOutput Language: ${language}`,
  });
  return response.text || "";
};

export const simulateCodeExecution = async (code: string, language: string, context: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Simulate the execution of the following code snippet. 
    Language: ${language}
    Context: ${context}
    Code:
    ${code}
    
    Return ONLY the exact console/terminal output. If there is an error in the code, return the error message as it would appear in a real compiler or runtime. Do not add any conversational text or explanations.`,
  });

  return response.text?.trim() || "No output generated.";
};

export const fetchTopicResources = async (topic: string, goal: string, language: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find 3-5 high-quality, verified web resources (official docs, academic articles, or expert tutorials) for learning about "${topic}" within the context of "${goal}". 
    Briefly describe each resource. 
    Respond in ${language}.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  const links = groundingChunks
    .map((chunk: any) => ({
      title: chunk.web?.title || "Learning Resource",
      uri: chunk.web?.uri || ""
    }))
    .filter((link: any) => link.uri !== "");

  return { text, links };
};

export const generateSpeech = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || "";
};

// Audio Utilities
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
