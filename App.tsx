/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Trophy, 
  Sparkles, 
  Languages, 
  RotateCcw, 
  Volume2, 
  CheckCircle2, 
  AlertCircle, 
  Bookmark, 
  ArrowRight, 
  User, 
  HelpCircle, 
  GraduationCap, 
  ArrowUpDown, 
  History, 
  Coins, 
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ==========================================
// INTERACTIVE AUDIO & SYNTH ENGINE
// ==========================================
const playSound = (type: 'click' | 'success' | 'fail' | 'reveal') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'reveal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(650, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(130, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // Safe fallback if audio is blocked or unsupported
  }
};

const speakSpanish = (text: string) => {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.85; // Natural learning pace
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Ignored speech synth error
    }
  }
  playSound('click');
};

// ==========================================
// STATIC STUDY CONTENT & DIALOGUES DATA
// ==========================================
interface VerbDetail {
  spanish: string;
  armenian: string;
}

interface GrammarTenseGroup {
  dialogueId: number;
  tenseEs: string;
  tenseHy: string;
  verbs: VerbDetail[];
}

const GRAMMAR_DATA: GrammarTenseGroup[] = [
  {
    dialogueId: 1,
    tenseEs: "Presente de Indicativo",
    tenseHy: "Ներկա ժամանակ",
    verbs: [
      { spanish: "estoy", armenian: "եմ / գտնվում եմ (estar - լինել, գտնվել)" },
      { spanish: "trabajo", armenian: "աշխատում եմ (trabajar - աշխատել)" },
      { spanish: "hablo", armenian: "խոսում եմ (hablar - խոսել)" }
    ]
  },
  {
    dialogueId: 2,
    tenseEs: "Pretérito Perfecto",
    tenseHy: "Անցյալ կատարյալ",
    verbs: [
      { spanish: "he visto", armenian: "տեսել եմ (ver - տեսնել)" },
      { spanish: "ha gustado", armenian: "դուր է եկել (gustar - դուր գալ)" },
      { spanish: "he leído", armenian: "կարդացել եմ (leer - կարդալ)" }
    ]
  },
  {
    dialogueId: 3,
    tenseEs: "Pretérito Indefinido",
    tenseHy: "Պարզ անցյալ (սահմանափակված անցյալ)",
    verbs: [
      { spanish: "hice", armenian: "արեցի (hacer - անել)" },
      { spanish: "fui", armenian: "գնացի (ir - գնալ)" },
      { spanish: "comí", armenian: "կերա (comer - ուտել)" },
      { spanish: "vi", armenian: "դիտեցի / տեսա (ver - տեսնել / դիտել)" }
    ]
  },
  {
    dialogueId: 4,
    tenseEs: "Futuro Simple",
    tenseHy: "Ապառնի ժամանակ",
    verbs: [
      { spanish: "harás", armenian: "կանես (hacer - անել)" },
      { spanish: "viajaré", armenian: "կճանապարհորդեմ (viajar - ճանապարհորդել)" },
      { spanish: "nos alojaremos", armenian: "կմնանք / կտեղավորվենք (alojarse - բնակվել)" },
      { spanish: "nadaré", armenian: "կլողամ (nadar - լողալ)" }
    ]
  },
  {
    dialogueId: 5,
    tenseEs: "Pretérito Imperfecto",
    tenseHy: "Անկատար անցյալ ժամանակ (անցյալի սովորություն)",
    verbs: [
      { spanish: "era", armenian: "էի / էր (ser - լինել)" },
      { spanish: "leía", armenian: "կարդում էի (leer - կարդալ)" },
      { spanish: "vivías", armenian: "ապրում էիր (vivir - ապրել)" },
      { spanish: "vivía", armenian: "ապրում էի (vivir - ապրել)" },
      { spanish: "hacías", armenian: "անում էիր (hacer - անել)" },
      { spanish: "iba", armenian: "գնում էի (ir - գնալ)" },
      { spanish: "jugaba", armenian: "խաղում էի (jugar - խաղալ)" },
      { spanish: "ayudaba", armenian: "օգնում էի (ayudar - օգնել)" },
      { spanish: "gustaba", armenian: "դուր էր գալիս (gustar - դուր գալ)" }
    ]
  }
];

interface Sentence {
  sender: 'Lucía' | 'Carlos';
  spanish: string;
  armenian: string;
  highlightedWord?: string;
  highlightedExplanation?: string;
}

interface Dialogue {
  id: number;
  titleEs: string;
  titleHy: string;
  contextEs: string;
  contextHy: string;
  tenseEs: string;
  tenseHy: string;
  sentences: Sentence[];
}

const DIALOGUES: Dialogue[] = [
  {
    id: 1,
    titleEs: "Diálogo 1 — Presente de Indicativo",
    titleHy: "Դիալոգ 1 — Ներկա ժամանակ",
    contextEs: "En una cafetería",
    contextHy: "Սրճարանում",
    tenseEs: "Presente de Indicativo",
    tenseHy: "Ներկա ժամանակ",
    sentences: [
      {
        sender: "Lucía",
        spanish: "Hola, Carlos. ¿Cómo estás?",
        armenian: "Բարև, Կառլոս։ Ինչպե՞ս ես։",
        highlightedWord: "estás",
        highlightedExplanation: "estar (լինել, գտնվել) բայի 2-րդ դեմքն է (tú estás - դու ես/գտնվում ես)"
      },
      {
        sender: "Carlos",
        spanish: "Muy bien, gracias. ¿Y tú?",
        armenian: "Շատ լավ, շնորհակալություն։ Իսկ դու՞։"
      },
      {
        sender: "Lucía",
        spanish: "También estoy bien. ¿Trabajas cerca de aquí?",
        armenian: "Ես էլ եմ լավ։ Դու այստեղի՞ց մոտ ես աշխատում։",
        highlightedWord: "trabajas",
        highlightedExplanation: "trabajar (աշխատել) բայի ներկա ժամանակի 2-րդ դեմքն է (tú trabajas)"
      },
      {
        sender: "Carlos",
        spanish: "Sí, trabajo en una oficina en el centro.",
        armenian: "Այո, ես աշխատում եմ կենտրոնում գտնվող գրասենյակում։",
        highlightedWord: "trabajo",
        highlightedExplanation: "trabajar (աշխատել) բայի ներկա ժամանակի 1-ին դեմքն է (yo trabajo)"
      },
      {
        sender: "Lucía",
        spanish: "¿Hablas inglés en el trabajo?",
        armenian: "Աշխատանքում անգլերե՞ն ես խոսում։",
        highlightedWord: "hablas",
        highlightedExplanation: "hablar (խոսել) բայի ներկա ժամանակի 2-րդ դեմքն է (tú hablas)"
      },
      {
        sender: "Carlos",
        spanish: "Sí, hablo inglés y español todos los días.",
        armenian: "Այո, ամեն օր խոսում եմ անգլերեն և իսպաներեն։",
        highlightedWord: "hablo",
        highlightedExplanation: "hablar (խոսել) բայի ներկա ժամանակի 1-ին դեմքն է (yo hablo)"
      },
      {
        sender: "Lucía",
        spanish: "¡Qué interesante!",
        armenian: "Ի՜նչ հետաքրքիր է։"
      }
    ]
  },
  {
    id: 2,
    titleEs: "Diálogo 2 — Pretérito Perfecto",
    titleHy: "Դիալոգ 2 — Անցյալ կատարյալ",
    contextEs: "Esta semana",
    contextHy: "Այս շաբաթ",
    tenseEs: "Pretérito Perfecto (Անցյալ կատարյալ)",
    tenseHy: "Օգտագործվում է ներկայի հետ կապված ավարտված գործողությունների համար (օր.՝ այս շաբաթ)",
    sentences: [
      {
        sender: "Lucía",
        spanish: "¿Has visto la nueva película?",
        armenian: "Դու տեսե՞լ ես նոր ֆիլմը։",
        highlightedWord: "Has visto",
        highlightedExplanation: "haber + visto (ver բայի հարակատար ձևը) 2-րդ դեմք - 'տեսել ես'"
      },
      {
        sender: "Carlos",
        spanish: "Sí, la he visto esta semana.",
        armenian: "Այո, տեսել եմ այս շաբաթ։",
        highlightedWord: "he visto",
        highlightedExplanation: "haber (հանդես է գալիս որպես օժանդակ) + visto (տեսնել) 1-ին դեմք - 'տեսել եմ'"
      },
      {
        sender: "Lucía",
        spanish: "¿Te ha gustado?",
        armenian: "Դուր եկե՞լ է քեզ։",
        highlightedWord: "ha gustado",
        highlightedExplanation: "gustar բայի Pret. Perfecto ձևը՝ 'դուր է եկել'"
      },
      {
        sender: "Carlos",
        spanish: "Mucho. También he leído el libro.",
        armenian: "Շատ։ Նաև գիրքն եմ կարդացել։",
        highlightedWord: "he leído",
        highlightedExplanation: "leer (կարդալ) բայի Pret. Perfecto 1-ին դեմք՝ 'կարդացել եմ'"
      },
      {
        sender: "Lucía",
        spanish: "Yo todavía no lo he leído.",
        armenian: "Ես դեռ չեմ կարդացել այն։",
        highlightedWord: "he leído",
        highlightedExplanation: "ներկա ժամանակի հետ կապ ունեցող ժխտական անցյալ՝ 'չեմ կարդացել'"
      },
      {
        sender: "Carlos",
        spanish: "Entonces tienes que leerlo.",
        armenian: "Այդ դեպքում պետք է կարդաս այն։"
      }
    ]
  },
  {
    id: 3,
    titleEs: "Diálogo 3 — Pretérito Indefinido",
    titleHy: "Դիալոգ 3 — Պարզ անցյալ (սահմանափակված)",
    contextEs: "Ayer",
    contextHy: "Երեկ",
    tenseEs: "Pretérito Indefinido",
    tenseHy: "Օգտագործվում է անցյալում կոնկրետ ավարտված պահին տեղի ունեցած գործողությունների համար",
    sentences: [
      {
        sender: "Lucía",
        spanish: "¿Qué hiciste ayer?",
        armenian: "Ի՞նչ արեցիր երեկ։",
        highlightedWord: "hiciste",
        highlightedExplanation: "hacer (անել) բայի Pret. Indefinido 2-րդ դեմք՝ 'արեցիր'"
      },
      {
        sender: "Carlos",
        spanish: "Me levanté temprano, desayuné y fui al trabajo.",
        armenian: "Շուտ արթնացա, նախաճաշեցի և գնացի աշխատանքի։",
        highlightedWord: "fui",
        highlightedExplanation: "ir (գնալ) բայի Pret. Indefinido 1-ին դեմք՝ 'գնացի'"
      },
      {
        sender: "Lucía",
        spanish: "¿Comiste en casa?",
        armenian: "Տանը կերա՞ր։",
        highlightedWord: "comiste",
        highlightedExplanation: "comer (ուտել) բայի Pret. Indefinido 2-րդ դեմք՝ 'կերար'"
      },
      {
        sender: "Carlos",
        spanish: "No, comí en un restaurante.",
        armenian: "Ոչ, ռեստորանում կերա։",
        highlightedWord: "comí",
        highlightedExplanation: "comer (ուտել) բայի Pret. Indefinido 1-ին դեմք՝ 'կերա'"
      },
      {
        sender: "Lucía",
        spanish: "¿Y después?",
        armenian: "Իսկ հետո՞։"
      },
      {
        sender: "Carlos",
        spanish: "Volví a casa y vi una película.",
        armenian: "Վերադարձա տուն և ֆիլմ դիտեցի։",
        highlightedWord: "vi",
        highlightedExplanation: "ver (տեսնել/դիտել) բայի Pret. Indefinido 1-ին դեմք՝ 'դիտեցի/տեսա'"
      }
    ]
  },
  {
    id: 4,
    titleEs: "Diálogo 4 — Futuro Simple",
    titleHy: "Դիալոգ 4 — Ապառնի ժամանակ",
    contextEs: "Planes para el fin de semana",
    contextHy: "Շաբաթավերջի ծրագրեր",
    tenseEs: "Futuro Simple",
    tenseHy: "Ապառնի ժամանակ՝ ապագայում կատարվելիք գործողությունների համար",
    sentences: [
      {
        sender: "Lucía",
        spanish: "¿Qué harás este fin de semana?",
        armenian: "Ի՞նչ կանես այս շաբաթավերջին։",
        highlightedWord: "harás",
        highlightedExplanation: "hacer (անել) բայի ապառնի ժամանակի 2-րդ դեմք՝ 'կանես'"
      },
      {
        sender: "Carlos",
        spanish: "Viajaré a Valencia con mis amigos.",
        armenian: "Կճանապարհորդեմ Վալենսիա ընկերներիս հետ։",
        highlightedWord: "viajaré",
        highlightedExplanation: "viajar (ճանապարհորդել) բայի ապառնի ժամանակի 1-ին դեմք՝ 'կճանապարհորդեմ'"
      },
      {
        sender: "Lucía",
        spanish: "¿Dónde os alojaréis?",
        armenian: "Որտե՞ղ կմնաք։",
        highlightedWord: "os alojaréis",
        highlightedExplanation: "alojarse (բնակվել/հանգրվանել) բայի դերանվանական ապառնի 2-րդ դեմք հոգնակի՝ 'կմնաք / կտեղավորվեք'"
      },
      {
        sender: "Carlos",
        spanish: "Nos alojaremos en un hotel cerca de la playa.",
        armenian: "Կմնանք լողափի մոտ գտնվող հյուրանոցում։",
        highlightedWord: "nos alojaremos",
        highlightedExplanation: "alojarse բայի դերանվանական ապառնի 1-ին դեմք հոգնակի՝ 'կմնաք'"
      },
      {
        sender: "Lucía",
        spanish: "¿Nadarás en el mar?",
        armenian: "Կլողա՞ս ծովում։",
        highlightedWord: "nadarás",
        highlightedExplanation: "nadar (լողալ) բայի ապառնի ժամանակի 2-րդ դեմք՝ 'կլողաս'"
      },
      {
        sender: "Carlos",
        spanish: "Sí, nadaré todos los días.",
        armenian: "Այո, ամեն օր կլողամ։",
        highlightedWord: "nadaré",
        highlightedExplanation: "nadar (լողալ) բայի ապառնի 1-ին դեմք՝ 'կլողամ'"
      }
    ]
  },
  {
    id: 5,
    titleEs: "Diálogo 5 — Pretérito Imperfecto",
    titleHy: "Դիալոգ 5 — Անկատար անցյալ ժամանակ",
    contextEs: "Cuando era pequeña",
    contextHy: "Երբ փոքր էի (անցյալի կրկնվող իրավիճակ կամ նկարագրություն)",
    tenseEs: "Pretérito Imperfecto",
    tenseHy: "Օգտագործվում է անցյալի նկարագրությունների և սովորական կրկնվող գործողությունների համար",
    sentences: [
      {
        sender: "Lucía",
        spanish: "Carlos, ¿cómo eras cuando eras pequeño?",
        armenian: "Կառլոս, ինչպիսի՞ն էիր, երբ փոքր էիր։",
        highlightedWord: "eras",
        highlightedExplanation: "ser (լինել) բայի Pret. Imperfecto 2-րդ դեմք՝ 'էիր'"
      },
      {
        sender: "Carlos",
        spanish: "Era muy tranquilo y leía muchos libros.",
        armenian: "Շատ հանգիստ էի և շատ գրքեր էի կարդում։",
        highlightedWord: "leía",
        highlightedExplanation: "leer (կարդալ) բայի Pret. Imperfecto 1-ին դեմք՝ 'կարդում էի' (շարունակական սովորություն)"
      },
      {
        sender: "Lucía",
        spanish: "¿Vivías en Madrid?",
        armenian: "Ապրո՞ւմ էիր Մադրիդում։",
        highlightedWord: "vivías",
        highlightedExplanation: "vivir (ապրել) բայի Pret. Imperfecto 2-րդ դեմք՝ 'ապրում էիր'"
      },
      {
        sender: "Carlos",
        spanish: "No, vivía en un pueblo pequeño cerca del mar.",
        armenian: "Ոչ, ապրում էի ծովի մոտ գտնվող փոքրիկ գյուղում։",
        highlightedWord: "vivía",
        highlightedExplanation: "vivir (ապրել) բայի Pret. Imperfecto 1-ին դեմք՝ 'ապրում էի'"
      },
      {
        sender: "Lucía",
        spanish: "¿Qué hacías todos los días?",
        armenian: "Ամեն օր ի՞նչ էիր անում։",
        highlightedWord: "hacías",
        highlightedExplanation: "hacer (անել) բայի Pret. Imperfecto 2-րդ դեմք՝ 'անում էիր' (կանոնավոր կերպով)"
      },
      {
        sender: "Carlos",
        spanish: "Iba al colegio, jugaba con mis amigos y ayudaba a mi madre en casa.",
        armenian: "Գնում էի դպրոց, խաղում էի ընկերներիս հետ և օգնում էի մայրիկիս տանը։",
        highlightedWord: "jugaba",
        highlightedExplanation: "jugar (խաղալ) բայի Pret. Imperfecto 1-ին դեմք՝ 'խաղում էի'"
      },
      {
        sender: "Lucía",
        spanish: "¿Te gustaba vivir allí?",
        armenian: "Քեզ դո՞ւր էր գալիս այնտեղ ապրելը։",
        highlightedWord: "gustaba",
        highlightedExplanation: "gustar (դուր գալ) բայի Pret. Imperfecto համապատասխան ձևը՝ 'դուր էր գալիս'"
      },
      {
        sender: "Carlos",
        spanish: "Sí, me gustaba mucho. El pueblo era bonito y la gente era amable.",
        armenian: "Այո, շատ էր դուր գալիս։ Գյուղը գեղեցիկ էր, իսկ մարդիկ՝ բարի։",
        highlightedWord: "era",
        highlightedExplanation: "ser (լինել) բայի Pret. Imperfecto՝ նկարագրում է գյուղը և մարդկանց անցյալում ('էր' / 'էին')"
      }
    ]
  }
];

// ==========================================
// TWO-PLAYER GAME QUESTIONS DEFINITIONS
// ==========================================
interface GameQuestion {
  spanish: string;
  sourceDialogue: string;
  questionPromptHy: string;
  correctAnswer: string;
  options: string[];
}

const GAME1_QUESTIONS: GameQuestion[] = [
  {
    spanish: "¿Trabajas cerca de aquí?",
    sourceDialogue: "Dialog 1 - Presente",
    questionPromptHy: "Ինչպե՞ս է թարգմանվում «¿Trabajas cerca de aquí?» նախադասությունը․",
    correctAnswer: "Դու այստեղի՞ց մոտ ես աշխատում։",
    options: ["Դու այստեղի՞ց մոտ ես աշխատում։", "Դու այստեղ աշխատո՞ւմ ես։", "Այո, ես աշխատում եմ այստեղ։", "Ամեն օր աշխատո՞ւմ ես։"]
  },
  {
    spanish: "¿Hablas inglés en el trabajo?",
    sourceDialogue: "Dialog 1 - Presente",
    questionPromptHy: "Ընտրեք «¿Hablas inglés en el trabajo?» նախադասության ճիշտ թարգմանությունը․",
    correctAnswer: "Աշխատանքում անգլերե՞ն ես խոսում։",
    options: ["Աշխատանքում անգլերե՞ն ես խոսում։", "Իսպաներեն խոսո՞ւմ ես աշխատավայրում։", "Դու անգլերեն գիտե՞ս։", "Ինչպե՞ս է քո անգլերենը։"]
  },
  {
    spanish: "¿Has visto la nueva película?",
    sourceDialogue: "Dialog 2 - Pretérito Perfecto",
    questionPromptHy: "Ո՞րն է «¿Has visto la nueva película?» հարցի թարգմանությունը․",
    correctAnswer: "Դու տեսե՞լ ես նոր ֆիլմը։",
    options: ["Դու տեսե՞լ ես նոր ֆիլմը։", "Ես տեսել եմ նոր ֆիլմը։", "Դու սիրո՞ւմ ես ֆիլմեր։", "Ի՞նչ ֆիլմ ես դիտում սովորաբար։"]
  },
  {
    spanish: "También he leído el libro.",
    sourceDialogue: "Dialog 2 - Pretérito Perfecto",
    questionPromptHy: "Ինչպե՞ս է թարգմանվում «También he leído el libro.» միտքը․",
    correctAnswer: "Նաև գիրքն եմ կարդացել։",
    options: ["Նաև գիրքն եմ կարդացել։", "Ես դեռ չեմ կարդացել գիրքը։", "Այս շաբաթ գիրք կարդա։", "Գիրքը շատ հետաքրքիր էր։"]
  },
  {
    spanish: "¿Qué hiciste ayer?",
    sourceDialogue: "Dialog 3 - Pretérito Indefinido",
    questionPromptHy: "Ի՞նչ է հարցնում Լուսիան՝ ասելով «¿Qué hiciste ayer?».",
    correctAnswer: "Ի՞նչ արեցիր երեկ։",
    options: ["Ի՞նչ արեցիր երեկ։", "Ի՞նչ ես անելու վաղը։", "Ի՞նչ ես անում այսօր։", "Դու երեկ տա՞նն էիր։"]
  },
  {
    spanish: "Volví a casa y vi una película.",
    sourceDialogue: "Dialog 3 - Pretérito Indefinido",
    questionPromptHy: "«Volví a casa y vi una película»-ի հայերեն համարժեքը․",
    correctAnswer: "Վերադարձա տուն և ֆիլմ դիտեցի։",
    options: ["Վերադարձա տուն և ֆիլմ դիտեցի։", "Գնացի աշխատանքի և ֆիլմ դիտեցի։", "Վերադարձա տուն և գիրք կարդացի։", "Ես տանն եմ և ֆիլմ եմ դիտում։"]
  },
  {
    spanish: "¿Qué harás este fin de semana?",
    sourceDialogue: "Dialog 4 - Futuro Simple",
    questionPromptHy: "Ի՞նչ է նշանակում «¿Qué harás este fin de semana?» արտահայտությունը․",
    correctAnswer: "Ի՞նչ կանես այս շաբաթավերջին։",
    options: ["Ի՞նչ կանես այս շաբաթավերջին։", "Ի՞նչ կանես երեկոյան։", "Որտե՞ղ ես անցկացնելու շաբաթավերջը։", "Ինչո՞ւ ես գնում այս շաբաթավերջին։"]
  },
  {
    spanish: "Nos alojaremos en un hotel cerca de la playa.",
    sourceDialogue: "Dialog 4 - Futuro Simple",
    questionPromptHy: "Թարգմանեք հետևյալ միտքը․ «Nos alojaremos en un hotel cerca de la playa.»",
    correctAnswer: "Կմնանք լողափի մոտ գտնվող հյուրանոցում։",
    options: ["Կմնանք լողափի մոտ գտնվող հյուրանոցում։", "Մենք կապրենք լողափին մոտ գտնվող տանը։", "Կմնանք գեղեցիկ հյուրանոցում։", "Մենք կճանապարհորդենք դեպի լողափ։"]
  },
  {
    spanish: "Carlos, ¿cómo eras cuando eras pequeño?",
    sourceDialogue: "Dialog 5 - Pretérito Imperfecto",
    questionPromptHy: "Ի՞նչ է հարցնում Լուսիան՝ «Carlos, ¿cómo eras cuando eras pequeño?»",
    correctAnswer: "Կառլոս, ինչպիսի՞ն էիր, երբ փոքր էիր։",
    options: ["Կառլոս, ինչպիսի՞ն էիր, երբ փոքր էիր։", "Կառլոս, որտե՞ղ էիր ապրում, երբ փոքր էիր։", "Կառլոս, դու սիրո՞ւմ ես փոքր երեխաներին։", "Կառլոս, ի՞նչ էիր անում, երբ փոքր էիր։"]
  },
  {
    spanish: "Era muy tranquilo y leía muchos libros.",
    sourceDialogue: "Dialog 5 - Pretérito Imperfecto",
    questionPromptHy: "Ինչպիսի՞ն էր Կառլոսը փոքր տարիքում ըստ «Era muy tranquilo y leía muchos libros.»-ի․",
    correctAnswer: "Շատ հանգիստ էի և շատ գրքեր էի կարդում։",
    options: ["Շատ հանգիստ էի և շատ գրքեր էի կարդում։", "Շատ ուրախ էի և գիրք էի կարդում։", "Սովորում էի դպրոցում և գրքեր էի սիրում։", "Ես հանգիստ էի և դասեր էի անում։"]
  }
];

const GAME2_QUESTIONS: GameQuestion[] = [
  {
    spanish: "he leído",
    sourceDialogue: "Dialog 2",
    questionPromptHy: "Ի՞նչ ժամանակաձևով է խոնարհված «he leído» բայաձևը, և ինչպե՞ս է թարգմանվում․",
    correctAnswer: "Pretérito Perfecto (կարդացել եմ)",
    options: [
      "Pretérito Perfecto (կարդացել եմ)",
      "Presente (կարդում եմ)",
      "Pretérito Imperfecto (կարդում էի)",
      "Futuro Simple (կկարդամ)"
    ]
  },
  {
    spanish: "viajaré",
    sourceDialogue: "Dialog 4",
    questionPromptHy: "Ո՞րն է «viajaré» բայաձևի ճիշտ բնութագիրը․",
    correctAnswer: "Futuro Simple (կճանապարհորդեմ)",
    options: [
      "Futuro Simple (կճանապարհորդեմ)",
      "Presente (ճանապարհորդում եմ)",
      "Pretérito Indefinido (ճանապարհորդեցի)",
      "Pretérito Imperfecto (ճանապարհորդում էի)"
    ]
  },
  {
    spanish: "era",
    sourceDialogue: "Dialog 5",
    questionPromptHy: "«era» բայաձևը «ser» (լինել) բայի ո՞ր ժամանակաձևն է և թարգմանությունը․",
    correctAnswer: "Pretérito Imperfecto (էի / էր)",
    options: [
      "Pretérito Imperfecto (էի / էր)",
      "Pretérito Indefinido (եղա / եղավ)",
      "Presente (եմ / է)",
      "Futuro Simple (կլինեմ)"
    ]
  },
  {
    spanish: "comí",
    sourceDialogue: "Dialog 3",
    questionPromptHy: "Ինչպե՞ս է թարգմանվում և ո՞ր ժամանակաձևն է «comí» բայը․",
    correctAnswer: "Pretérito Indefinido (կերա)",
    options: [
      "Pretérito Indefinido (կերա)",
      "Pretérito Perfecto (կերել եմ)",
      "Presente (ուտում եմ)",
      "Pretérito Imperfecto (ուտում էի)"
    ]
  },
  {
    spanish: "hablo",
    sourceDialogue: "Dialog 1",
    questionPromptHy: "«hablo» բայի ճիշտ բնութագիրը․",
    correctAnswer: "Presente (խոսում եմ)",
    options: [
      "Presente (խոսում եմ)",
      "Pretérito Imperfecto (խոսում էի)",
      "Pretérito Indefinido (խոսեցի)",
      "Futuro Simple (կխոսեմ)"
    ]
  },
  {
    spanish: "nos alojaremos",
    sourceDialogue: "Dialog 4",
    questionPromptHy: "Ընտրեք «nos alojaremos» բայաձևի ճիշտ նշանակությունը․",
    correctAnswer: "Futuro Simple (կմնանք / կտեղավորվենք)",
    options: [
      "Futuro Simple (կմնանք / կտեղավորվենք)",
      "Pretérito Imperfecto (մնում էինք)",
      "Pretérito Perfecto (մնացել ենք)",
      "Presente (մնում ենք)"
    ]
  },
  {
    spanish: "jugaba",
    sourceDialogue: "Dialog 5",
    questionPromptHy: "Ի՞նչ նշանակություն և ժամանակաձև ունի «jugaba»-ն․",
    correctAnswer: "Pretérito Imperfecto (խաղում էի)",
    options: [
      "Pretérito Imperfecto (խաղում էի)",
      "Pretérito Indefinido (խաղացի)",
      "Presente (խաղում եմ)",
      "Futuro Simple (կխաղամ)"
    ]
  },
  {
    spanish: "fui",
    sourceDialogue: "Dialog 3",
    questionPromptHy: "«fui» բառի ճիշտ բացատրությունը (իրավիճակային)․",
    correctAnswer: "Pretérito Indefinido (գնացի)",
    options: [
      "Pretérito Indefinido (գնացի)",
      "Presente (գնում եմ)",
      "Pretérito Imperfecto (գնում էի)",
      "Futuro Simple (կգնամ)"
    ]
  },
  {
    spanish: "he visto",
    sourceDialogue: "Dialog 2",
    questionPromptHy: "Ո՞րն է «he visto» բայի բացատրությունը․",
    correctAnswer: "Pretérito Perfecto (տեսել եմ)",
    options: [
      "Pretérito Perfecto (տեսել եմ)",
      "Pretérito Indefinido (տեսա)",
      "Presente (տեսնում եմ)",
      "Pretérito Imperfecto (տեսնում էի)"
    ]
  },
  {
    spanish: "ayudaba",
    sourceDialogue: "Dialog 5",
    questionPromptHy: "«ayudaba» (ayudar - օգնել) բայի ճիշտ թարգմանությունն ու ժամանակաձևը․",
    correctAnswer: "Pretérito Imperfecto (օգնում էի)",
    options: [
      "Pretérito Imperfecto (օգնում էի)",
      "Pretérito Indefinido (օգնեցի)",
      "Futuro Simple (կօգնեմ)",
      "Presente (օգնում եմ)"
    ]
  }
];

// Confetti Particle Generator Component
interface ConfettiProps {
  active: boolean;
}

function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = ['#f1bf00', '#da121a', '#0033a0', '#d92323', '#f2a800', '#3b82f6', '#10b981'];
    const particles: any[] = [];

    // Create initial particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 5,
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 5 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}

// Main App Component
export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'reading' | 'grammar' | 'quiz'>('reading');

  // Interactive Reading State
  const [activeDialogueId, setActiveDialogueId] = useState<number>(1);
  const [revealedSentences, setRevealedSentences] = useState<Record<string, boolean>>({});
  const [activeExplainWord, setActiveExplainWord] = useState<{ word: string, desc: string } | null>(null);

  // 2-Player Game Config States
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [activeGameMode, setActiveGameMode] = useState<1 | 2>(1); // 1 = Translation, 2 = Tense recognition

  // Player configurations
  const [p1Name, setP1Name] = useState<string>("Լուիսիա (Lucía)");
  const [p2Name, setP2Name] = useState<string>("Կառլոս (Carlos)");
  const [p1Avatar, setP1Avatar] = useState<string>("🦁");
  const [p2Avatar, setP2Avatar] = useState<string>("🦅");

  // Game Play States
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [scores, setScores] = useState<{ p1: number; p2: number }>({ p1: 0, p2: 0 });
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1); // alternates
  const [gameQuestionsList, setGameQuestionsList] = useState<GameQuestion[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [gameFinished, setGameFinished] = useState<boolean>(false);

  // Audio Context enablement trigger (interaction barrier)
  const [audioAllowed, setAudioAllowed] = useState<boolean>(false);

  // Statistics & History logs for games
  const [gameLog, setGameLog] = useState<{ player: string; question: string; isCorrect: boolean }[]>([]);

  const AVATARS = ["🦁", "🦅", "🐉", "🦊", "🐆", "🐻", "🦄", "🐼"];

  // Initialize and shuffle questions for the Game
  const initGame = (mode: 1 | 2) => {
    const rawQuestions = mode === 1 ? [...GAME1_QUESTIONS] : [...GAME2_QUESTIONS];
    // Shuffle helper
    const shuffled = rawQuestions.map(v => ({ v, sort: Math.random() }))
                                 .sort((a, b) => a.sort - b.sort)
                                 .map(({ v }) => v);
    setGameQuestionsList(shuffled);
    setCurrentRound(0);
    setScores({ p1: 0, p2: 0 });
    setActivePlayer(1);
    setSelectedOption(null);
    setAnswerState('idle');
    setGameFinished(false);
    setGameLog([]);
    setActiveGameMode(mode);
    setGameStarted(true);
    playSound('click');
  };

  // Turn logic handler
  const handleOptionSelect = (option: string) => {
    if (selectedOption !== null) return; // Prevent double clicks
    
    setSelectedOption(option);
    const correctAns = gameQuestionsList[currentRound].correctAnswer;
    const isCorrect = option === correctAns;

    const currentPlayerName = activePlayer === 1 ? p1Name : p2Name;
    const currentQText = gameQuestionsList[currentRound].spanish;

    if (isCorrect) {
      setAnswerState('correct');
      playSound('success');
      setScores(prev => ({
        ...prev,
        [activePlayer === 1 ? 'p1' : 'p2']: prev[activePlayer === 1 ? 'p1' : 'p2'] + 10
      }));
    } else {
      setAnswerState('incorrect');
      playSound('fail');
    }

    setGameLog(prev => [
      ...prev,
      { player: currentPlayerName, question: currentQText, isCorrect }
    ]);
  };

  const proceedNextTurn = () => {
    setSelectedOption(null);
    setAnswerState('idle');

    const nextRound = currentRound + 1;
    if (nextRound >= gameQuestionsList.length) {
      setGameFinished(true);
      playSound('success');
    } else {
      setCurrentRound(nextRound);
      // alternate players
      setActivePlayer(activePlayer === 1 ? 2 : 1);
      playSound('click');
    }
  };

  const getWinnerInfo = () => {
    if (scores.p1 > scores.p2) {
      return { name: p1Name, score: scores.p1, avatar: p1Avatar, msg: "Կեցցե՜ս, դու հաղթեցիր։ 🎉" };
    } else if (scores.p2 > scores.p1) {
      return { name: p2Name, score: scores.p2, avatar: p2Avatar, msg: "Կեցցե՜ս, դու հաղթեցիր։ 🎉" };
    } else {
      return { name: "Ոչ-ոքի", score: scores.p1, avatar: "🤝", msg: "Հավասար պայքար էր։ Դուք երկուսդ էլ փայլուն եք։ 😊" };
    }
  };

  // Sentence open toggle helper
  const toggleSentenceReveal = (dialogueId: number, sentenceIndex: number) => {
    setAudioAllowed(true);
    const key = `${dialogueId}-${sentenceIndex}`;
    const wasRevealed = !!revealedSentences[key];
    setRevealedSentences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    if (!wasRevealed) {
      playSound('reveal');
    } else {
      playSound('click');
    }
  };

  const revealAllDialogue = (dialogueId: number) => {
    const fresh: Record<string, boolean> = { ...revealedSentences };
    const dialogue = DIALOGUES.find(d => d.id === dialogueId);
    if (!dialogue) return;
    
    dialogue.sentences.forEach((_, idx) => {
      fresh[`${dialogueId}-${idx}`] = true;
    });
    setRevealedSentences(fresh);
    playSound('success');
  };

  const hideAllDialogue = (dialogueId: number) => {
    const fresh: Record<string, boolean> = { ...revealedSentences };
    const dialogue = DIALOGUES.find(d => d.id === dialogueId);
    if (!dialogue) return;
    
    dialogue.sentences.forEach((_, idx) => {
      fresh[`${dialogueId}-${idx}`] = false;
    });
    setRevealedSentences(fresh);
    playSound('click');
  };

  // Quick total dialogues progress
  const totalSentencesCount = DIALOGUES.reduce((acc, d) => acc + d.sentences.length, 0);
  const totalRevealedCount = Object.values(revealedSentences).filter(Boolean).length;
  const totalProgressPercent = Math.round((totalRevealedCount / totalSentencesCount) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-3 md:p-6 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-start">
      
      {/* Dynamic Confetti for game winners */}
      <Confetti active={gameFinished} />

      {/* Main Container */}
      <div className="max-w-[1024px] w-full mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Compact elegant Header matching High Density theme */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-white border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl font-display">A</div>
            <div>
              <h1 className="text-md font-bold leading-tight uppercase tracking-tight text-slate-900">
                Aprende Español <span className="text-indigo-600">/ Հայերեն</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest leading-none mt-0.5">
                Interactive Reading & Grammar Practice
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Scores displayed like theme's player scores box inside header */}
            {gameStarted && activeTab === 'quiz' && (
              <div id="player-scores" className="flex gap-2 items-center">
                <div className="px-3 py-1 bg-red-100 rounded border border-red-200 text-red-700 font-mono text-xs font-semibold">
                  {p1Name.split(' ')[0]}: <span id="p1-score">{scores.p1}</span>
                </div>
                <div className="px-3 py-1 bg-blue-100 rounded border border-blue-200 text-blue-700 font-mono text-xs font-semibold">
                  {p2Name.split(' ')[0]}: <span id="p2-score">{scores.p2}</span>
                </div>
              </div>
            )}
            
            {/* Custom Mode switches resembling Read Mode / Play Game buttons */}
            <div className="flex gap-1.5">
              <button
                id="tab-reading"
                onClick={() => { playSound('click'); setActiveTab('reading'); }}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                  activeTab === 'reading' 
                    ? 'bg-indigo-600 text-white' 
                    : 'border border-slate-300 text-slate-600 bg-white hover:bg-slate-50'
                }`}
              >
                Read Mode
              </button>
              <button
                id="tab-grammar"
                onClick={() => { playSound('click'); setActiveTab('grammar'); }}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                  activeTab === 'grammar' 
                    ? 'bg-indigo-600 text-white' 
                    : 'border border-slate-300 text-slate-600 bg-white hover:bg-slate-50'
                }`}
              >
                Grammar Tenses
              </button>
              <button
                id="tab-quiz"
                onClick={() => { playSound('click'); setActiveTab('quiz'); }}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                  activeTab === 'quiz' 
                    ? 'bg-indigo-600 text-white' 
                    : 'border border-slate-300 text-slate-600 bg-white hover:bg-slate-50'
                }`}
              >
                Play Game
              </button>
            </div>
          </div>
        </header>

        {/* Dense progress strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <GraduationCap size={15} className="text-indigo-600 shrink-0" />
            <span>Ընթերցման առաջընթաց / Progress:</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(5, totalProgressPercent))}%` }}
              />
            </div>
            <span className="font-mono font-bold text-slate-700">{totalProgressPercent}%</span>
          </div>
        </div>

        {/* Dynamic Workspace */}
        <div className="p-6 md:p-8">
          
          {/* ==========================================
              TAB 1: INTERACTIVE READING VIEW
              ========================================== */}
          {/* ==========================================
              TAB 1: INTERACTIVE READING VIEW
              ========================================== */}
          {activeTab === 'reading' && (
            <div className="animate-slide-up flex flex-col md:flex-row gap-5">
              
              {/* Sidebar dialogue selection - High Density pattern */}
              <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                    <span>Select Dialogue</span>
                    <span className="text-[10px] lowercase text-slate-300 font-normal">({DIALOGUES.length})</span>
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {DIALOGUES.map((dlg) => {
                      const isActive = activeDialogueId === dlg.id;
                      return (
                        <button
                          key={dlg.id}
                          onClick={() => { playSound('click'); setActiveDialogueId(dlg.id); }}
                          className={`w-full text-left p-2.5 rounded border text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                              : 'bg-white border-transparent hover:bg-slate-50 text-slate-600 font-semibold'
                          }`}
                        >
                          <div className="truncate">{dlg.id}. {dlg.contextEs}</div>
                          <div className="text-[9.5px] text-slate-400 font-normal truncate mt-0.5">{dlg.tenseEs.split(' ')[0]}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sidebar Grammar Tip box */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                  <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1.5">
                    Grammar Tip
                  </h4>
                  <p className="text-[11px] text-slate-600 italic leading-relaxed font-semibold">
                    {activeDialogueId === 1 && "Presente-ն օգտագործվում է սովորական գործողությունների համար։"}
                    {activeDialogueId === 2 && "Pretérito Perfecto-ն արտահայտում է անցյալի գործողություններ, որոնք կապված են ներկայի հետ։"}
                    {activeDialogueId === 3 && "Pretérito Indefinido-ն վերաբերում է անցյալում լիովին ավարտված գործողություններին։"}
                    {activeDialogueId === 4 && "Futuro Simple-ն արտահայտում է հետագա ծրագրեր և կանխատեսումներ։"}
                    {activeDialogueId === 5 && "Pretérito Imperfecto-ն ցույց է տալիս երկարատև անցյալի սովորությունները («անում էի»)։"}
                  </p>
                </div>
              </aside>

              {/* Main Dialogue Content Column */}
              <div className="flex-1 space-y-4">
                {DIALOGUES.map((dialogue) => {
                  if (dialogue.id !== activeDialogueId) return null;
                  return (
                    <div key={dialogue.id} className="space-y-4">
                      
                      {/* Active Tense Banner card */}
                      <div className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 rounded uppercase font-mono tracking-wider">
                              {dialogue.tenseEs}
                            </span>
                            <span className="text-xs text-slate-500 font-bold">{dialogue.tenseHy}</span>
                          </div>
                          <h2 className="text-md font-black text-slate-800 tracking-tight mt-1">
                            {dialogue.contextEs} <span className="text-slate-350">/</span> <span className="text-indigo-600">{dialogue.contextHy}</span>
                          </h2>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Click any Spanish dialogue card below to reveal or hide the Armenian translation.
                          </p>
                        </div>

                        {/* Bulk controls */}
                        <div className="flex gap-1.5 w-full sm:w-auto shrink-0">
                          <button
                            onClick={() => revealAllDialogue(dialogue.id)}
                            className="flex-1 sm:flex-none text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded cursor-pointer shadow-xs"
                          >
                            Բացել բոլորը
                          </button>
                          <button
                            onClick={() => hideAllDialogue(dialogue.id)}
                            className="flex-1 sm:flex-none text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-500 rounded cursor-pointer"
                          >
                            Թաքցնել
                          </button>
                        </div>
                      </div>

                      {/* Dialogue Content translation rows */}
                      <div className="space-y-2.5">
                        {dialogue.sentences.map((line, idx) => {
                          const key = `${dialogue.id}-${idx}`;
                          const isRevealed = !!revealedSentences[key];

                          return (
                            <div 
                              key={idx}
                              onClick={() => toggleSentenceReveal(dialogue.id, idx)}
                              className={`p-3.5 bg-white border rounded-lg transition-all duration-200 relative group cursor-pointer hover:border-indigo-400 hover:translate-x-0.5 ${
                                isRevealed ? 'bg-[#F1F5F9] border-slate-300 shadow-xs' : 'border-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  {/* Sender tag */}
                                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider shrink-0 ${
                                    line.sender === 'Lucía'
                                      ? 'bg-red-50 border border-red-100 text-red-700'
                                      : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                                  }`}>
                                    {line.sender}
                                  </span>

                                  {/* Spanish Phrase with interactive click highlights */}
                                  <div className="text-slate-800 font-semibold text-[13.5px] leading-snug">
                                    {line.spanish.split(' ').map((word, wordIdx) => {
                                      const cleanWord = word.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/g, "");
                                      const isHighlightWord = line.highlightedWord && cleanWord.toLowerCase() === line.highlightedWord.toLowerCase();

                                      return (
                                        <span key={wordIdx} className="inline-block mr-1">
                                          {isHighlightWord ? (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveExplainWord({
                                                  word: line.highlightedWord || '',
                                                  desc: line.highlightedExplanation || ''
                                                });
                                                playSound('click');
                                              }}
                                              className="font-bold underline text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-1 py-0.5 rounded cursor-pointer transition-all"
                                            >
                                              {word}
                                            </button>
                                          ) : (
                                            <span>{word}</span>
                                          )}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      speakSpanish(line.spanish);
                                    }}
                                    title="Listen pronunciation"
                                    className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                                  >
                                    <Volume2 size={13} />
                                  </button>
                                  <div className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200/50 px-1.5 py-0.5 rounded uppercase">
                                    {isRevealed ? 'Revealed' : 'Reveal'}
                                  </div>
                                </div>
                              </div>

                              {/* Translation box */}
                              <AnimatePresence>
                                {isRevealed && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-slate-200/50 pt-2.5 mt-2.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="text-indigo-950 font-bold text-xs leading-relaxed">
                                      {line.armenian}
                                    </div>
                                    {line.highlightedWord && (
                                      <div className="mt-2 text-[10px] bg-white border border-slate-200 p-2 rounded-lg flex items-start gap-1.5 text-slate-700 leading-normal">
                                        <Info size={11} className="text-indigo-600 shrink-0 mt-0.5" />
                                        <span>
                                          <strong>{line.highlightedWord}</strong> — {line.highlightedExplanation}
                                        </span>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ==========================================
              TAB 2: GRAMMAR & STUDY SHEET LIST
              ========================================== */}
          {activeTab === 'grammar' && (
            <div className="animate-slide-up space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Ո՞ր ժամանակներն են օգտագործվել / Grammar Overview
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Յուրաքանչյուր երկխոսության մեջ կենտրոնացված է իսպաներենի որևէ ժամանակաձև։
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GRAMMAR_DATA.map((group) => (
                  <div 
                    key={group.dialogueId}
                    className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Title & Badge */}
                      <div className="flex justify-between items-center gap-2 mb-2 pb-1.5 border-b border-slate-100">
                        <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 font-mono rounded">
                          Դիալոգ {group.dialogueId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          {group.tenseEs.split(' ')[0]}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900">
                        {group.tenseEs}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                        {group.tenseHy}
                      </p>

                      {/* Verbs showcase list */}
                      <div className="mt-3 space-y-1.5">
                        {group.verbs.map((v, vIdx) => (
                          <div 
                            key={vIdx} 
                            onClick={() => speakSpanish(v.spanish)}
                            className="p-1.5 hover:bg-slate-50 rounded transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-slate-150"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-indigo-700 font-mono font-bold text-xs bg-indigo-50/50 px-1.5 py-0.5 rounded">
                                {v.spanish}
                              </span>
                              <span className="text-slate-400 font-light text-[10px]">→</span>
                              <span className="text-slate-700 text-xs font-semibold">
                                {v.armenian}
                              </span>
                            </div>
                            <Volume2 size={12} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => {
                          setActiveDialogueId(group.dialogueId);
                          setActiveTab('reading');
                          playSound('click');
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                      >
                        Բացել երկխոսությունը <ChevronRight size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary rule container */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="text-slate-800 font-black text-xs uppercase tracking-wider mb-2">
                  Կարևոր համեմատություն / Key Comparisons
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <strong className="text-indigo-900 text-xs block mb-1 uppercase tracking-wider">Pretérito Perfecto vs Indefinido</strong>
                    <div className="space-y-1 text-slate-600 leading-snug">
                      <p><strong>Pretérito Perfecto</strong> (օր.՝ <em>he visto</em>) - օգտագործվում է, երբ ժամանակային միջակայքը դեռ չի ավարտվել (օր.՝ այսօր, այս շաբաթ)։</p>
                      <p><strong>Pretérito Indefinido</strong> (օր.՝ <em>fui</em>) - օգտագործվում է, երբ ժամանակաշրջանն արդեն լրիվ ավարտված է (օր.՝ երեկ, անցյալ տարի)։</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <strong className="text-indigo-900 text-xs block mb-1 uppercase tracking-wider">Pretérito Imperfecto իմաստը</strong>
                    <p className="leading-snug">
                      <strong>Pretérito Imperfecto</strong> (օր.՝ <em>vivía / jugaba</em>) - անցյալ անկատար ժամանակաձև։ Այն բացատրում է անցյալում սովորաբար կամ շարունակաբար կրկնվող գործողությունները («անում էի», «ապրում էի», «գնում էի»)։
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: 2-PLAYER PRACTICE GAMES (ARENA)
              ========================================== */}
          {activeTab === 'quiz' && (
            <div className="animate-slide-up space-y-6">
              
              {!gameStarted ? (
                /* CONFIGURATION & SETUP SCREEN */
                <div className="max-w-2xl mx-auto p-5 bg-white border border-slate-200 rounded-lg">
                  
                  <div className="text-center mb-6 border-b border-slate-100 pb-4">
                    <div className="mx-auto w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center mb-2 font-bold text-lg">
                      ⚔️
                    </div>
                    <h2 className="text-md font-black uppercase tracking-tight text-slate-900">
                      2-Խաղացողների Պրակտիկ Ասպարեզ / 2-Player Arena
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider max-w-sm mx-auto font-semibold">
                      Մրցեք ձեր ընկերոջ հետ՝ տեսնելու, թե ով ավելի շատ իսպաներեն գիտի։
                    </p>
                  </div>

                  {/* Player Configuration Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    
                    {/* Player 1 Box */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col gap-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Խաղացող 1</span>
                        <span className="text-xl">{p1Avatar}</span>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Անուն</label>
                        <input
                          type="text"
                          value={p1Name}
                          onChange={(e) => setP1Name(e.target.value)}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ավատար</span>
                        <div className="flex gap-1 flex-wrap">
                          {AVATARS.map(av => (
                            <button
                              key={av}
                              onClick={() => { playSound('click'); setP1Avatar(av); }}
                              className={`text-md p-1 hover:bg-slate-200 rounded transition-all cursor-pointer ${p1Avatar === av ? 'bg-indigo-100 ring-1 ring-indigo-500 scale-105' : ''}`}
                            >
                              {av}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Player 2 Box */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col gap-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Խաղացող 2</span>
                        <span className="text-xl">{p2Avatar}</span>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Անուն</label>
                        <input
                          type="text"
                          value={p2Name}
                          onChange={(e) => setP2Name(e.target.value)}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ավատար</span>
                        <div className="flex gap-1 flex-wrap">
                          {AVATARS.map(av => (
                            <button
                              key={av}
                              onClick={() => { playSound('click'); setP2Avatar(av); }}
                              className={`text-md p-1 hover:bg-slate-200 rounded transition-all cursor-pointer ${p2Avatar === av ? 'bg-indigo-100 ring-1 ring-indigo-500 scale-105' : ''}`}
                            >
                              {av}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mode Choose buttons (2 Games!) */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center">Ընտրեք Խաղի Ռեժիմը / Select Match Mode</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Game Mode 1 */}
                      <button
                        onClick={() => initGame(1)}
                        className="p-4 text-left bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 rounded transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] font-black font-mono mb-2 border border-indigo-150">
                            ԽԱՂ 1 — ԴՈՒԵԼ
                          </div>
                          <h4 className="font-bold text-sm text-slate-950">
                            Նախադասությունների Մրցում
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Իսպաներեն արտահայտությունների թարգմանական մարտահրավեր։ Շահիր միավորներ՝ ճիշտ թարգմանելով։
                          </p>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                          Սկսել խաղալ <ArrowRight size={14} className="ml-1" />
                        </div>
                      </button>

                      {/* Game Mode 2 */}
                      <button
                        onClick={() => initGame(2)}
                        className="p-4 text-left bg-white border border-slate-200 hover:border-indigo-500 hover:bg-slate-50 rounded transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[9px] font-black font-mono mb-2 border border-emerald-150">
                            ԽԱՂ 2 — ԲԼԻՑ
                          </div>
                          <h4 className="font-bold text-sm text-slate-950">
                            Ժամանակների Վարպետ
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Բայերի խորհրդավոր ձևեր և ժամանակաձևեր։ Իդեալական է քերականության ստուգման համար։
                          </p>
                        </div>
                        <div className="mt-4 flex items-center text-xs text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                          Սկսել խաղալ <ArrowRight size={14} className="ml-1" />
                        </div>
                      </button>

                    </div>
                  </div>

                </div>
              ) : (
                /* GAME PLAY SCREEN */
                <div className="max-w-3xl mx-auto space-y-4">
                  
                  {/* Game top control panel */}
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded p-2.5">
                    <button
                      onClick={() => { playSound('click'); setGameStarted(false); }}
                      className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50/50 text-slate-700 rounded cursor-pointer flex items-center gap-1.5"
                    >
                      ← Վերադառնալ
                    </button>
                    <div className="text-[10px] text-slate-505 font-bold uppercase tracking-wider">
                      Ռեժիմ՝ {activeGameMode === 1 ? 'Նախադասությունների Դուել' : 'Ժամանակների Վարպետ'}
                    </div>
                  </div>

                  {!gameFinished ? (
                    <div className="space-y-4">
                      
                      {/* Active Player Live Score banner */}
                      <div className="grid grid-cols-2 gap-3">
                        
                        {/* Player 1 Score box */}
                        <div className={`p-3 rounded border transition-all ${
                          activePlayer === 1 
                            ? 'bg-indigo-50 border-indigo-300 bg-linear-to-b from-indigo-50/50 to-indigo-100/20' 
                            : 'bg-white border-slate-200 opacity-60'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-lg">{p1Avatar}</span>
                            <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">Խաղացող 1</span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">{p1Name}</div>
                          <div className="text-lg font-mono font-black text-indigo-700 mt-0.5">
                            {scores.p1} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                          </div>
                          {activePlayer === 1 && (
                            <div className="mt-1.5 text-[8.5px] font-black tracking-widest uppercase bg-indigo-100 text-indigo-800 rounded py-0.5 px-2 inline-block animate-pulse">
                              ՁԵՐ ՀԵՐԹՆ Է
                            </div>
                          )}
                        </div>

                        {/* Player 2 Score box */}
                        <div className={`p-3 rounded border transition-all ${
                          activePlayer === 2 
                            ? 'bg-blue-50 border-blue-300 bg-linear-to-b from-blue-50/50 to-blue-100/20' 
                            : 'bg-white border-slate-200 opacity-60'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-lg">{p2Avatar}</span>
                            <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Խաղացող 2</span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">{p2Name}</div>
                          <div className="text-lg font-mono font-black text-blue-700 mt-0.5">
                            {scores.p2} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                          </div>
                          {activePlayer === 2 && (
                            <div className="mt-1.5 text-[8.5px] font-black tracking-widest uppercase bg-blue-100 text-blue-800 rounded py-0.5 px-2 inline-block animate-pulse">
                              ՁԵՐ ՀԵՐԹՆ Է
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Question Container Card */}
                      {gameQuestionsList[currentRound] && (
                        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-xs relative overflow-hidden">
                          
                          {/* Round tracker slider */}
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                            <span>ՓՈՒԼ {currentRound + 1} / {gameQuestionsList.length}</span>
                            <span>{activePlayer === 1 ? p1Name : p2Name}-ի հերթը</span>
                          </div>

                          {/* Beautiful big word display */}
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center relative group">
                            <span className="text-xs font-mono font-bold text-slate-400 block mb-1">SPANISH</span>
                            <h3 className="text-2xl md:text-3xl font-display font-bold text-amber-900 tracking-tight">
                              {gameQuestionsList[currentRound].spanish}
                            </h3>
                            
                            {/* Pronounce in question container */}
                            <button
                              onClick={(e) => { e.stopPropagation(); speakSpanish(gameQuestionsList[currentRound].spanish); }}
                              className="mt-3 mx-auto px-4 py-1 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-800 transition-colors bg-white hover:bg-slate-100 rounded-full border border-slate-200/50 cursor-pointer shadow-sm"
                            >
                              <Volume2 size={13} />
                              Լսել արտասանությունը
                            </button>
                          </div>

                          {/* Armenian Prompt question */}
                          <p className="mt-6 text-sm font-semibold text-slate-800">
                            {gameQuestionsList[currentRound].questionPromptHy}
                          </p>

                          {/* Options grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            {gameQuestionsList[currentRound].options.map((option, idx) => {
                              const isSelected = selectedOption === option;
                              const isCorrectAnswer = option === gameQuestionsList[currentRound].correctAnswer;
                              
                              let buttonStyle = "bg-white border-slate-200 hover:border-slate-900 text-slate-700";
                              if (selectedOption !== null) {
                                if (isCorrectAnswer) {
                                  buttonStyle = "bg-emerald-500 border-emerald-600 text-white ring-2 ring-emerald-500/20";
                                } else if (isSelected) {
                                  buttonStyle = "bg-red-500 border-red-600 text-white ring-2 ring-red-500/20";
                                } else {
                                  buttonStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                                }
                              }

                              return (
                                <button
                                  key={idx}
                                  disabled={selectedOption !== null}
                                  onClick={() => handleOptionSelect(option)}
                                  className={`w-full p-4 text-left text-sm font-semibold border-2 rounded-2xl transition-all ${buttonStyle} truncate cursor-pointer`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>

                          {/* Screen feedback area */}
                          {selectedOption !== null && (
                            <div className="mt-6 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                              <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-600">
                                {answerState === 'correct' ? (
                                  <>
                                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                    <span className="text-emerald-700 font-bold">Ճիշտ է։ (+10 միավոր)</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                                    <span className="text-red-600 font-bold">Սխալ է։ Ճիշտ պատասխանն է՝ «{gameQuestionsList[currentRound].correctAnswer}»</span>
                                  </>
                                )}
                              </span>

                              <button
                                onClick={proceedNextTurn}
                                className="w-full sm:w-auto text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
                              >
                                Հաջորդ փուլ <ChevronRight size={14} />
                              </button>
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  ) : (
                    /* MATCH COMPLETED / PODIUM */
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-3xl border border-amber-100 p-8 text-center space-y-6">
                      <div className="max-w-md mx-auto">
                        <Trophy size={64} className="mx-auto text-yellow-500 animate-bounce" />
                        
                        {/* Winner presentation */}
                        <div className="mt-4">
                          <span className="text-3xl block">{getWinnerInfo().avatar}</span>
                          <h3 className="text-2xl font-bold font-display text-slate-900 mt-2">
                            {getWinnerInfo().name}
                          </h3>
                          <p className="text-sm font-bold text-amber-800 mt-1">
                            {getWinnerInfo().msg}
                          </p>
                        </div>

                        {/* Final Result comparison */}
                        <div className="grid grid-cols-2 gap-4 mt-6 bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
                          <div>
                            <span className="text-xs text-slate-400 font-bold uppercase">{p1Name}</span>
                            <div className="text-2xl font-extrabold text-blue-700 mt-0.5">{scores.p1} pts</div>
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 font-bold uppercase">{p2Name}</span>
                            <div className="text-2xl font-extrabold text-emerald-700 mt-0.5">{scores.p2} pts</div>
                          </div>
                        </div>

                        {/* Game log review */}
                        <div className="mt-6 text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Խաղի Պատմություն</span>
                          <div className="max-h-40 overflow-y-auto space-y-2 border border-slate-200/50 p-2.5 rounded-xl bg-white text-xs">
                            {gameLog.map((log, idx) => (
                              <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-1.5 last:border-0">
                                <span className="truncate max-w-[120px] font-semibold text-slate-600">{log.player}</span>
                                <span className="font-mono text-slate-500 italic max-w-[160px] truncate">{log.question}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${log.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                  {log.isCorrect ? 'Ճիշտ' : 'Սխալ'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Repeat buttons */}
                        <div className="flex gap-2 mt-6">
                          <button
                            onClick={() => initGame(activeGameMode)}
                            className="flex-1 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                          >
                            Կրկին խաղալ
                          </button>
                          <button
                            onClick={() => setGameStarted(false)}
                            className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 py-2.5 rounded-xl text-xs cursor-pointer"
                          >
                            Փոխել Խաղը
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

        {/* Highlight details modal/sheet if active */}
        {activeExplainWord && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl animate-pop-in">
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 text-xs font-bold uppercase rounded bg-amber-100 text-amber-800 font-mono">
                  Բառի նշանակություն
                </span>
                <button
                  onClick={() => { playSound('click'); setActiveExplainWord(null); }}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded transition-all cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4">
                <h4 className="text-xl font-bold font-mono text-amber-900">
                  {activeExplainWord.word}
                </h4>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {activeExplainWord.desc}
                </p>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => speakSpanish(activeExplainWord.word)}
                  className="flex-1 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer flex items-center justify-center gap-2"
                >
                  <Volume2 size={14} />
                  Արտասանել
                </button>
                <button
                  onClick={() => { playSound('click'); setActiveExplainWord(null); }}
                  className="flex-1 px-4 py-2 text-xs font-bold bg-slate-950 text-white rounded-xl cursor-pointer"
                >
                  Լավ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Footer credits */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-2 items-center">
          <div className="flex items-center gap-1.5 select-none">
            <Languages size={14} className="text-amber-500" />
            <span>Aprender Español con Diálogos — Իսպաներեն ինքնուսույց</span>
          </div>
          <div>
            <span>Նախատեսված է արագ և ինտերակտիվ պրակտիկայի համար 🇪🇸 🤝 🇦🇲</span>
          </div>
        </div>

      </div>
    </div>
  );
}
