import { Section } from './types';

export const STUDY_MODES = [
  { id: 'flashcards', name: 'Flashcards' },
  { id: 'quiz', name: 'Quiz' },
];

// FIX: Updated topics to be objects with a 'name' property to align with the new hierarchical Topic type.
// UPDATE: The default syllabus has been expanded to be more comprehensive and align with a generalized CBSE Sanskrit curriculum.
export const DEFAULT_SECTIONS: Section[] = [
  {
    id: 'A',
    sanskritTitle: 'अपठित-अवबोधनम्',
    title: 'Unseen Passage',
    description: 'Practice with unseen passages to improve comprehension skills.',
    topics: [{ name: 'General Unseen Passage' }],
  },
  {
    id: 'B',
    sanskritTitle: 'रचनात्मकं-कार्यम्',
    title: 'Creative Writing',
    description: 'Master formal letters, picture-based descriptions, and paragraph writing.',
    topics: [
        { name: 'पत्रलेखनम् (Letter Writing)' }, 
        { name: 'चित्र-वर्णनम् (Picture Description)' }, 
        { name: 'अनुच्छेद-लेखनम् (Paragraph Writing)' }
    ],
  },
  {
    id: 'C',
    sanskritTitle: 'अनुप्रयुक्त-व्याकरणम्',
    title: 'Applied Grammar',
    description: 'Targeted practice for all grammar topics as per the CBSE syllabus, with detailed sub-topics.',
    topics: [
      { 
        name: 'सन्धिः (Sandhi)',
        subTopics: [
            'स्वर-सन्धिः (Vowel Sandhi)',
            'व्यञ्जन-सन्धिः (Consonant Sandhi)',
            'विसर्ग-सन्धिः (Visarga Sandhi)'
        ]
      },
      { 
        name: 'समासः (Samas)',
        subTopics: [
            'अव्ययीभावः (Avyayibhava)',
            'तत्पुरुषः (Tatpurusha)',
            'कर्मधारयः (Karmadharaya)',
            'द्विगुः (Dvigu)',
            'द्वन्द्वः (Dvandva)',
            'बहुव्रीहिः (Bahuvrihi)'
        ]
      },
      {
        name: 'प्रत्ययाः (Pratyaya - Suffixes)',
        subTopics: [
            'कृत्-प्रत्ययाः (Krit Pratyaya)',
            'तद्धित-प्रत्ययाः (Taddhita Pratyaya)',
            'स्त्री-प्रत्ययाः (Stri Pratyaya)'
        ]
      },
      { name: 'वाच्य-परिवर्तनम् (Voice Change)' },
      { name: 'समयः (Time)' },
      { name: 'अव्ययपदानि (Indeclinables)' },
      { name: 'अशुद्धि-संशोधनम् (Error Correction)' },
    ],
  },
  {
    id: 'D',
    sanskritTitle: 'पठित-अवबोधनम्',
    title: 'Seen Comprehension',
    description: 'Practice questions from the Shemushi textbook lessons.',
    topics: [
        { name: 'प्रथमः पाठः (Lesson 1)' },
        { name: 'द्वितीयः पाठः (Lesson 2)' },
        { name: 'तृतीयः पाठः (Lesson 3)' },
        { name: 'चतुर्थः पाठः (Lesson 4)' },
        { name: 'पञ्चमः पाठः (Lesson 5)' },
        { name: 'षष्ठः पाठः (Lesson 6)' },
        { name: 'सप्तमः पाठः (Lesson 7)' },
        { name: 'अष्टमः पाठः (Lesson 8)' },
        { name: 'नवमः पाठः (Lesson 9)' },
        { name: 'दशमः पाठः (Lesson 10)' },
        { name: 'एकादशः पाठः (Lesson 11)' },
    ],
  },
];