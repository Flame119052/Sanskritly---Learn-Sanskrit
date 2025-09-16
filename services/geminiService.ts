// FIX: Moved Gemini API logic to its own service file for better code organization.
import { GoogleGenAI, Type, Part, Content } from '@google/genai';
import type { Flashcard, QuizQuestion, StudyMode, GeneratedItems, LearningModule, Section, UserStats, OptimizedSchedule, LearningStyle, AIResponse, MemoryPalaceModule } from '../types';
import type { StudyFile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const flashcardSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      front: {
        type: Type.STRING,
        description: 'The front side of the flashcard, containing a question, term, or concept in Sanskrit or related to Sanskrit grammar/literature.',
      },
      back: {
        type: Type.STRING,
        description: 'The back side of the flashcard, containing the answer or definition.',
      },
    },
    required: ['front', 'back'],
  },
};

const quizSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: 'The quiz question, typically in Sanskrit or asking about a Sanskrit concept.',
      },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'An array of 4 multiple-choice options.',
      },
      correctAnswer: {
        type: Type.STRING,
        description: 'The correct answer from the options list.',
      },
      explanation: {
        type: Type.STRING,
        description: 'A brief explanation of why the answer is correct, possibly with grammar rules.',
      },
      hint: {
        type: Type.STRING,
        description: 'A short, helpful hint for the question that guides the student without giving away the answer.',
      },
    },
    required: ['question', 'options', 'correctAnswer', 'explanation'],
  },
};

const learningModuleSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            concept: {
                type: Type.STRING,
                description: "The core concept or rule being taught in this step.",
            },
            sanskritExample: {
                type: Type.STRING,
                description: "A clear, relevant example in Sanskrit (e.g., a short sentence, a Sandhi combination, a phrase).",
            },
            englishExplanation: {
                type: Type.STRING,
                description: "A simple, direct explanation of the example in English.",
            },
            mnemonic: {
                type: Type.STRING,
                description: "A clever mnemonic, memory trick, or simple analogy to help the student remember the concept.",
            },
        },
        required: ['concept', 'sanskritExample', 'englishExplanation', 'mnemonic'],
    },
};

// NEW: Added schema for the "Memory Palace" feature to structure the AI's output.
const memoryPalaceSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            stepType: {
                type: Type.STRING,
                enum: ['introduction', 'pattern', 'chunk', 'recall', 'review'],
                description: "The type of learning step.",
            },
            title: {
                type: Type.STRING,
                description: "A short, clear title for the step (e.g., 'The Dual Suffix: -bhyām', 'Prathamā Vibhakti').",
            },
            explanation: {
                type: Type.STRING,
                description: "The main teaching text for the step. Explain the pattern, concept, or what the user should focus on in the chunk.",
            },
            tableChunk: {
                type: Type.OBJECT,
                properties: {
                    headers: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Column headers for the table chunk (e.g., ['Vibhakti', 'Ekvacanam', 'Dvivacanam', 'Bahuvacanam']).",
                    },
                    rows: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                        description: "An array of rows, where each row is an array of strings corresponding to the headers.",
                    },
                },
                description: "A small, digestible part of the full table to be displayed. Optional.",
            },
            recallQuestion: {
                type: Type.OBJECT,
                properties: quizSchema.items.properties,
                description: "A single, simple multiple-choice question to reinforce the concept just taught. Optional.",
            },
        },
        required: ['stepType', 'title', 'explanation'],
    },
};


// FIX: Updated the topics schema to support hierarchical topics (name and an optional array of subTopics).
const syllabusSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "A short, unique identifier for the section (e.g., 'A', 'B', '1', '2')." },
            title: { type: Type.STRING, description: "The main title of the section in English." },
            sanskritTitle: { type: Type.STRING, description: "The title of the section in Sanskrit (or the original language). If not applicable, use the main title." },
            description: { type: Type.STRING, description: "A brief, one-sentence description of the section's content." },
            topics: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: {
                            type: Type.STRING,
                            description: "The name of the main topic.",
                        },
                        subTopics: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An optional list of sub-topics. E.g., for 'Samas', this could contain 'Tatpurush Samas'.",
                        },
                    },
                    required: ['name'],
                },
                description: "A list of topics and their sub-topics within this section.",
            },
        },
        required: ['id', 'title', 'sanskritTitle', 'description', 'topics'],
    },
};

const timeEstimationSchema = {
    type: Type.OBJECT,
    properties: {
        timeEstimate: {
            type: Type.STRING,
            description: "A concise, friendly estimation of the time required (e.g., 'approx. 8-10 hours', 'about 3-4 days of focused study')."
        },
        reasoning: {
            type: Type.STRING,
            description: "A brief, one-sentence explanation for the estimate, mentioning the user's pace or the number of topics."
        }
    },
    required: ['timeEstimate', 'reasoning']
};

const optimizedScheduleSchema = {
    type: Type.OBJECT,
    properties: {
        schedule: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING, description: "The date for the activity in YYYY-MM-DD format." },
                    startTime: { type: Type.STRING, description: "The start time for the activity in HH:MM (24-hour) format." },
                    endTime: { type: Type.STRING, description: "The end time for the activity in HH:MM (24-hour) format." },
                    activity: { type: Type.STRING, description: "The specific activity, e.g., 'Study: सन्धिः (Sandhi)' or 'Lunch Break'." }
                },
                required: ["date", "startTime", "endTime", "activity"]
            }
        },
        reasoning: {
            type: Type.STRING,
            description: "A brief, one-sentence, encouraging rationale for why this schedule is effective."
        }
    },
    required: ['schedule', 'reasoning']
};

const assistantCommandSchema = {
    type: Type.OBJECT,
    properties: {
        responseText: {
            type: Type.STRING,
            description: "A friendly, conversational response to the user's query. This is what will be displayed in the chat. DO NOT use markdown like asterisks for bolding.",
        },
        command: {
            type: Type.OBJECT,
            description: "The machine-readable command to be executed by the application based on the user's intent.",
            properties: {
                name: {
                    type: Type.STRING,
                    enum: ['navigate', 'generate', 'open_modal', 'answer_only'],
                    description: "The name of the command to execute. Use 'answer_only' if the user is just asking a question without an actionable intent.",
                },
                sectionId: {
                    type: Type.STRING,
                    description: "For the 'navigate' command, the ID of the section to navigate to (e.g., 'A', 'B', 'C').",
                },
                studyMode: {
                    type: Type.STRING,
                    enum: ['flashcards', 'quiz', 'learn', 'memory_palace'],
                    description: "For the 'generate' command, the type of study aid to create.",
                },
                topic: {
                    type: Type.STRING,
                    description: "For the 'generate' command, the specific topic to generate aids for. Must be an a exact match from the available topics.",
                },
                modal: {
                    type: Type.STRING,
                    enum: ['stats', 'syllabus'],
                    description: "For the 'open_modal' command, the name of the modal to open.",
                },
            },
            required: ['name'],
        },
    },
    required: ['responseText', 'command'],
};


export async function generateStudyAids(
  mode: StudyMode,
  topic: string,
  files: StudyFile[],
  customInstructions: string
): Promise<GeneratedItems> {
  const model = 'gemini-2.5-flash';
  
  let basePrompt = '';
  let schema;
  
  const baseContext = `You are an AI tutor named 'Lex'. Your student feels overwhelmed and avoids studying. Your goal is to make learning Sanskrit feel easy, achievable, and confidence-building. Your tone must be sharp, modern, and encouraging.`;

  switch(mode) {
    case 'flashcards':
      basePrompt = `${baseContext} Generate 5 key flashcards for the topic: "${topic}". Focus on the most important concepts to build a foundation.`;
      schema = flashcardSchema;
      break;
    case 'quiz':
      basePrompt = `${baseContext} Create a very short, 3-question multiple-choice quiz on "${topic}". Start with a very easy question to build momentum. For each question, provide a brief, helpful hint that guides them without giving away the answer.`;
      schema = quizSchema;
      break;
    case 'learn':
        basePrompt = `${baseContext} Create a 'Learn & Memorize' module with 3-5 simple steps for the topic: "${topic}". Include main points, a Sanskrit example, a simple English explanation, and a clever mnemonic or memory trick to make the concept stick.`;
        schema = learningModuleSchema;
        break;
    case 'memory_palace':
        // This mode has its own dedicated generation function
        return generateMemoryPalaceModule(topic, files, customInstructions);
  }
  
  if (customInstructions) {
    basePrompt += `\n\n**CRITICAL USER INSTRUCTIONS (HIGHEST PRIORITY):** You must strictly adhere to the following instructions provided by the user. These instructions override all other directives. \n"${customInstructions}"`;
  }
  
  const contentParts: Part[] = [];
  let promptText = basePrompt;

  // FIX: Processed files correctly to avoid token limit errors with PDFs/images.
  // Text files are added to the text prompt, while other file types are added as separate data parts.
  if (files.length > 0) {
    promptText += `\n\nBase the content on the following provided study materials, ensuring it aligns with the topic:`;
    
    const textNotes = files
      .filter(f => f.type.startsWith('text/'))
      .map(f => `--- FILE: ${f.name} ---\n${f.content}`)
      .join('\n\n');
    
    if (textNotes) {
        promptText += `\n${textNotes}`;
    }

    contentParts.push({ text: promptText });

    files
      .filter(f => f.type.startsWith('image/') || f.type === 'application/pdf' || f.type.includes('document') || f.type.includes('presentation'))
      .forEach(file => {
        const base64Data = file.content.split(',')[1];
        if (base64Data) {
          contentParts.push({
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          });
        }
      });

  } else {
    promptText += `\n\nBase the content on your expert knowledge of the Sanskrit curriculum. Ensure all grammar and examples are accurate.`;
    contentParts.push({ text: promptText });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: contentParts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonString = response.text.trim();
    if (!jsonString) {
      console.error("Received empty response from API.");
      throw new Error('Failed to generate study aids: Empty response from API.');
    }

    const parsed = JSON.parse(jsonString);

    if (mode === 'flashcards') {
      return parsed as Flashcard[];
    } else if (mode === 'quiz') {
      return parsed as QuizQuestion[];
    } else {
        return parsed as LearningModule;
    }
  } catch (error) {
    console.error('Error generating study aids:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(`Failed to generate study aids. Details: ${errorMessage}`);
  }
}

// NEW: Function to generate the Memory Palace module.
async function generateMemoryPalaceModule(topic: string, files: StudyFile[], customInstructions: string): Promise<MemoryPalaceModule> {
    const model = 'gemini-2.5-flash';
// FIX: Replaced backticks with single quotes for step types in the prompt to avoid parsing errors.
    let prompt = `You are Lex, an expert AI tutor specializing in memory techniques for Sanskrit. The user wants to memorize the table for the topic: "${topic}" (e.g., a shabdarupa or dhaturupa). Your task is to create a 'Memory Palace' learning module. This is a step-by-step, interactive tutorial.`;

    if (customInstructions) {
        prompt += `

**CRITICAL USER INSTRUCTIONS (HIGHEST PRIORITY):**
You MUST strictly adhere to the following instructions provided by the user. These instructions override all other general directives in this prompt.
"${customInstructions}"
`;
    }

    prompt += `

**Core Directives:**
1.  **Deconstruct the Table:** Break the full declension/conjugation table into small, logical chunks (e.g., by case/vibhakti or number/vacana).
2.  **Identify Key Patterns (Crucial!):** Your most important job is to find recurring suffixes, stems, or rules. This is how you make learning efficient. For example, for a noun declension, you MUST point out that the suffix '-bhyām' is used for the dual form of Vibhaktis 3, 4, and 5. This is a "freebie" the student must know.
3.  **Create a Step-by-Step Module:** Generate an array of 6-10 learning steps. The goal is progressive learning.
4.  **Use the Correct Step Types:**
    *   'introduction': Start with one of these. Briefly introduce the table (e.g., "Let's learn the Shabdarupa for 'bālak', an a-ending masculine noun.").
    *   'pattern': Use these frequently to explain a pattern you found. Frame it as a 'Eureka!' moment. Make it exciting.
    *   'chunk': Present a small part of the table (e.g., one row or one column). Use this to introduce new forms.
    *   'recall': Immediately after a 'chunk' or 'pattern', create a simple, single-question quiz to reinforce what was just shown. The question must be directly related to the chunk/pattern.
    *   'review': End with ONE of these steps, showing the complete table for final review.

**Example Flow:**
- Step 1 ('introduction'): Introduce 'bālak' shabdarupa.
- Step 2 ('pattern'): Explain the '-bhyām' trick for the dual.
- Step 3 ('chunk'): Show the Prathamā Vibhakti row.
- Step 4 ('recall'): Ask "What is the bahuvacanam form of Prathamā Vibhakti for 'bālak'?"
- ...continue building up the table...
- Final Step ('review'): Show the full 7x3 table.

Your tone must be sharp, modern, and encouraging. Make the student feel like they're unlocking secrets, not just memorizing.
`;

    const contentParts: Part[] = [{ text: prompt }];

     if (files.length > 0) {
        const textNotes = files
            .filter(f => f.type.startsWith('text/'))
            .map(f => `--- FILE: ${f.name} ---\n${f.content}`)
            .join('\n\n');
        if (textNotes) {
            contentParts.push({ text: `Base your module on the user's notes:\n${textNotes}`});
        }
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: contentParts },
            config: {
                responseMimeType: 'application/json',
                responseSchema: memoryPalaceSchema,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        const jsonString = response.text.trim();
        if (!jsonString) {
            throw new Error('Memory Palace generation returned an empty response.');
        }
        return JSON.parse(jsonString) as MemoryPalaceModule;
    } catch (error) {
        console.error('Error generating Memory Palace module:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to generate Memory Palace. Details: ${errorMessage}`);
    }
}

// FIX: Updated `analyzeSyllabus` to accept multiple files and use a more sophisticated prompt to extract hierarchical topic structures.
export async function analyzeSyllabus(files: { content: string, mimeType: string, name: string }[]): Promise<Section[]> {
    const model = 'gemini-2.5-flash';
    const prompt = `You are a curriculum analysis expert for Sanskrit. Read the following syllabus document(s) and extract the Sanskrit curriculum into a structured JSON format.
- Create logical sections (e.g., Grammar, Literature).
- For each section, identify main topics.
- Crucially, identify any sub-topics and list them under their parent topic. For example, under the topic "समासः (Samas)", you should list specific types like "तत्पुरुषः" or "बहुव्रीहिः" as sub-topics.
- Ignore general instructions, exam rules, or non-Sanskrit content.
- Provide an English title and a Sanskrit title for each section.`;

    const contentParts: Part[] = [{ text: prompt }];

    for (const file of files) {
        contentParts.push({ text: `\n\n--- START OF DOCUMENT: ${file.name} ---\n` });

        if (file.mimeType.startsWith('text/')) {
            contentParts.push({ text: file.content });
        } else {
            const base64Data = file.content.split(',')[1];
            if (!base64Data) {
                console.warn(`Skipping file ${file.name} due to invalid base64 content.`);
                continue;
            }
            contentParts.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: base64Data,
                },
            });
        }
        contentParts.push({ text: `\n--- END OF DOCUMENT: ${file.name} ---\n` });
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: contentParts },
            config: {
                responseMimeType: 'application/json',
                responseSchema: syllabusSchema,
            },
        });
        const jsonString = response.text.trim();
        if (!jsonString) {
            throw new Error('Syllabus analysis returned an empty response.');
        }
        return JSON.parse(jsonString) as Section[];
    } catch (error) {
        console.error('Error analyzing syllabus:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to analyze syllabus. Details: ${errorMessage}`);
    }
}

export async function solveDoubt(
  topic: string,
  files: StudyFile[],
  question: string
): Promise<string> {
    const model = 'gemini-2.5-flash';
    let promptText = `You are 'Lex', a sharp and friendly AI tutor for Sanskrit. A student has a question. Your goal is to answer them clearly and encouragingly. Start your response with a positive affirmation like 'Great question!' or 'Let's break that down!'. Break down the answer into small, easy-to-understand steps. Use simple language and analogies. Do not use markdown. Your tone should be consistently supportive. Here is their question: "${question}".`;
    
    const contentParts: Part[] = [];

    // FIX: Processed files correctly to avoid token limit errors with PDFs/images.
    if (files.length > 0) {
        promptText += `\n\nBase your answer on the topic and any study materials they've uploaded:`;
        
        const textNotes = files
            .filter(f => f.type.startsWith('text/'))
            .map(f => `--- FILE: ${f.name} ---\n${f.content}`)
            .join('\n\n');

        if (textNotes) {
            promptText += `\n${textNotes}`;
        }
        
        contentParts.push({ text: promptText });

        files
            .filter(f => f.type.startsWith('image/') || f.type === 'application/pdf' || f.type.includes('document') || f.type.includes('presentation'))
            .forEach(file => {
                const base64Data = file.content.split(',')[1];
                if (base64Data) {
                    contentParts.push({
                        inlineData: {
                            mimeType: file.type,
                            data: base64Data,
                        },
                    });
                }
            });
    } else {
        contentParts.push({ text: promptText });
    }
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: contentParts },
            config: {
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        return response.text;
    } catch (error) {
        console.error('Error solving doubt:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to get an answer from the AI. Details: ${errorMessage}`);
    }
}

export async function estimateCompletionTime(
    remainingTopics: string[],
    userStats: UserStats | null,
    learningStyle: LearningStyle
): Promise<{ timeEstimate: string; reasoning: string }> {
    const model = 'gemini-2.5-flash';

    let styleDescription = '';
    switch (learningStyle) {
        case 'memorization':
            styleDescription = "The student's goal is Quick Memorization. They want to quickly learn key facts, vocabulary, and rules for an upcoming test. The focus is on speed and recall, not deep understanding.";
            break;
        case 'understanding':
            styleDescription = "The student's goal is Conceptual Understanding. They want to understand the 'why' behind the grammar and concepts, not just memorize. This might take slightly longer than pure memorization.";
            break;
        case 'mastery':
            styleDescription = "The student's goal is Deep Mastery. They want to achieve a thorough understanding of the concepts and be able to recall all key information perfectly. This is the most comprehensive approach.";
            break;
    }

    let prompt = `As an expert academic coach, estimate the time required for a student to learn the following remaining Sanskrit topics: ${remainingTopics.join(', ')}.

${styleDescription}`;

    if (userStats) {
        const accuracy = userStats.totalQuestions > 0
            ? ((userStats.totalCorrect / userStats.totalQuestions) * 100).toFixed(0)
            : 'N/A';
        prompt += `\n\nConsider the student's performance:
        - Quizzes Taken: ${userStats.quizzesTaken}
        - Overall Accuracy: ${accuracy}%
        - This indicates their learning pace. A higher accuracy suggests a faster pace.`;
    } else {
        prompt += `\n\nAssume an average learning pace for a student.`
    }

    prompt += `\n\nCrucially, provide a realistic and encouraging estimate in a concise format (e.g., 'approx. 8-10 hours', 'about 2-3 focused evenings'). Assume this is a single subject among others, so avoid long estimations like '3-4 weeks'. For the 'reasoning' part, provide a short, clear, and encouraging explanation. The tone should be supportive and motivational, tailored to the student's chosen learning style.`

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: timeEstimationSchema,
            },
        });
        const jsonString = response.text.trim();
        if (!jsonString) {
            throw new Error('AI time estimation returned an empty response.');
        }
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error estimating completion time:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to estimate completion time. Details: ${errorMessage}`);
    }
}

export async function generateOptimizedSchedule(
    remainingTopics: string[],
    userStats: UserStats | null,
    startDateTime: string,
    endDateTime: string
): Promise<OptimizedSchedule> {
    const model = 'gemini-2.5-flash';

    const formatForPrompt = (dateTime: string) => {
        const date = new Date(dateTime);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    };

    let prompt = `You are an expert academic coach for a Sanskrit student. Create a detailed, hour-by-hour study schedule from ${formatForPrompt(startDateTime)} to ${formatForPrompt(endDateTime)}.
    The student needs to master the following remaining Sanskrit topics: ${remainingTopics.join(', ')}.
    The schedule should be realistic. If the time spans multiple days, automatically include a 1-hour lunch break (around 13:00) and a 45-minute dinner break (around 19:00) each day.
    If the schedule is for a single day (or just a few hours), intelligently place short breaks (e.g., 10-15 minutes) within the study sessions.
    Allocate time for each topic, breaking down larger topics into smaller, manageable study blocks. The output must be a JSON object.
    The 'reasoning' should be a short, encouraging, and motivational message explaining why this schedule is effective for them. The tone should be positive and build confidence.`;

    if (userStats && Object.keys(userStats.topicPerformance).length > 0) {
        prompt += `\n\nHere is their performance data. Prioritize topics where their accuracy is lower:`;
        for (const [topic, data] of Object.entries(userStats.topicPerformance)) {
            const accuracy = data.total > 0 ? ((data.correct / data.total) * 100).toFixed(0) : 'N/A';
            prompt += `\n- ${topic}: ${accuracy}% accuracy`;
        }
    } else {
        prompt += `\n\nSince there's no performance data, create a balanced schedule covering all topics.`;
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: optimizedScheduleSchema,
            },
        });
        const jsonString = response.text.trim();
        if (!jsonString) {
            throw new Error('AI schedule generation returned an empty response.');
        }
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error generating optimized schedule:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to generate schedule. Details: ${errorMessage}`);
    }
}

export async function customizeSchedule(
    currentSchedule: OptimizedSchedule,
    customizationRequest: string
): Promise<OptimizedSchedule> {
    const model = 'gemini-2.5-flash';
    const prompt = `You are an adaptive schedule assistant. A user wants to modify their study schedule.
**Analyze the user's request and adapt your response tone to match theirs.**
Here is the current schedule in JSON format:
${JSON.stringify(currentSchedule.schedule)}

Here is their request: "${customizationRequest}"

Please modify the JSON schedule to accommodate their request. For example, if they ask for a break, add a new schedule item with the activity "Break". If they want to move a session, adjust the times accordingly.
Return the entire updated schedule in the same JSON format as the 'schedule' property provided above. The 'reasoning' should be a confirmation of the change, written in a style that mirrors the user's request. Example: If the user says 'yo can I get a break', you could say 'For sure, I've added that break for you.' If they say 'Please add a lunch break', you'd say 'Of course, I have updated the schedule to include a lunch break.'`;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: optimizedScheduleSchema,
            },
        });
        const jsonString = response.text.trim();
        if (!jsonString) {
            throw new Error('AI schedule customization returned an empty response.');
        }
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error customizing schedule:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to customize schedule. Details: ${errorMessage}`);
    }
}


export async function chatWithAssistant(
    userInput: string,
    sections: Section[],
): Promise<AIResponse> {
    const model = 'gemini-2.5-flash';

    const syllabusSummary = sections.map(sec => ({
        id: sec.id,
        title: sec.title,
        topics: sec.topics.flatMap(t => [t.name, ...(t.subTopics || [])])
    }));

    const systemInstruction = `You are 'Lex', an encouraging and intelligent AI study buddy for Sanskrit. Your student sometimes struggles with motivation. Your personality is sharp, modern, supportive, and proactive.

    **Core Directives:**
    1.  **Be a Proactive Guide:** Don't just answer questions; suggest next steps. Your goal is to make it easy for the user to keep learning.
    2.  **Always Be Encouraging:** Start conversations with positive energy. Praise effort. Your vocabulary is modern and encouraging, like "You got this," "Let's break it down," "Nice one."
    3.  **Simplify Everything:** Break down complex topics into small, manageable pieces. Use simple language and relatable analogies.
    4.  **Focus on Confidence:** Frame tasks as achievable challenges. Celebrate progress.
    5.  **Strictly Sanskrit:** If the user asks about topics outside of Sanskrit or using this app, gently guide them back. For example: "That's a cool question! For now, let's stay focused on crushing this Sanskrit goal. We can explore other stuff later!" Use the 'answer_only' command for this redirection.
    6.  **Use App Commands:** Your main role is to guide the user through the app. Use 'generate' to suggest creating study aids, 'navigate' to point them to other sections, and 'open_modal' to show them their stats or syllabus options.
    7.  **Plain Text Only:** Your responses must be in plain text. Do not use markdown (like asterisks).

    AVAILABLE SYLLABUS CONTEXT:
    ${JSON.stringify(syllabusSummary, null, 2)}
    `;

    const prompt = `User's message: "${userInput}"`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: assistantCommandSchema,
            },
        });
        const jsonString = response.text.trim();
        if (!jsonString) {
            throw new Error('Assistant returned an empty response.');
        }
        return JSON.parse(jsonString) as AIResponse;
    } catch (error) {
        console.error('Error with assistant chat:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        throw new Error(`Failed to get response from assistant. Details: ${errorMessage}`);
    }
}