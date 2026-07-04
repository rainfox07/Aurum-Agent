export type PresetBook = {
  id: string;
  title: string;
  author: string;
  categories: string[];
  language: "en";
  description: string;
  sourceRef: string;
  sampleExcerpts: string[];
};

export const presetBooks: PresetBook[] = [
  {
    id: "principles",
    title: "Principles",
    author: "Ray Dalio",
    categories: ["decision-making", "management", "systems-thinking", "life-principles"],
    language: "en",
    description:
      "A book about building explicit principles, making decisions through reality testing, and improving judgment through feedback loops.",
    sourceRef: "Part II, Life Principles",
    sampleExcerpts: [
      "Use principles as explicit decision rules that can be tested against reality.",
      "Pain plus reflection equals progress.",
      "Radical open-mindedness and radical transparency are invaluable for rapid learning."
    ]
  },
  {
    id: "thinking-fast-and-slow",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    categories: ["psychology", "cognitive-bias", "judgment", "decision-making"],
    language: "en",
    description:
      "A foundational book on System 1 and System 2 thinking, cognitive biases, heuristics, and judgment under uncertainty.",
    sourceRef: "Part I, Two Systems",
    sampleExcerpts: [
      "System 1 operates automatically and quickly, with little or no effort.",
      "System 2 allocates attention to effortful mental activities that demand it.",
      "Confidence is a feeling, not a reliable indicator of accuracy."
    ]
  },
  {
    id: "poor-charlies-almanack",
    title: "Poor Charlie's Almanack",
    author: "Charlie Munger",
    categories: ["mental-models", "investing", "judgment", "decision-making"],
    language: "en",
    description:
      "A collection of Charlie Munger's ideas on multidisciplinary thinking, mental models, incentives, and practical wisdom.",
    sourceRef: "Talk Two, A Lesson on Elementary Worldly Wisdom",
    sampleExcerpts: [
      "You must know the big ideas in the big disciplines and use them routinely.",
      "To the man with only a hammer, every problem looks like a nail.",
      "Incentives are superpowers."
    ]
  },
  {
    id: "the-innovators-dilemma",
    title: "The Innovator's Dilemma",
    author: "Clayton M. Christensen",
    categories: ["innovation", "business", "technology", "strategy"],
    language: "en",
    description:
      "A business strategy book explaining why successful companies fail when disruptive technologies change market structure.",
    sourceRef: "Chapter 1, How Can Great Firms Fail?",
    sampleExcerpts: [
      "Good management was the most powerful reason they failed to stay atop their industries.",
      "Disruptive technologies bring to a market a very different value proposition.",
      "Products that underperform today may improve fast enough to challenge incumbents tomorrow."
    ]
  },
  {
    id: "zero-to-one",
    title: "Zero to One",
    author: "Peter Thiel",
    categories: ["startup", "technology", "business", "monopoly", "innovation"],
    language: "en",
    description:
      "A startup book about creating new things, building monopolies, and avoiding competition through unique technological progress.",
    sourceRef: "Chapter 1, The Challenge of the Future",
    sampleExcerpts: [
      "Doing what we already know how to do takes the world from 1 to n.",
      "Every moment in business happens only once.",
      "Competition is for losers."
    ]
  },
  {
    id: "the-lean-startup",
    title: "The Lean Startup",
    author: "Eric Ries",
    categories: ["startup", "product", "experimentation", "business"],
    language: "en",
    description:
      "A book about validated learning, build-measure-learn loops, MVPs, and reducing uncertainty in product development.",
    sourceRef: "Chapter 3, Learn",
    sampleExcerpts: [
      "Validated learning is the process of demonstrating empirically that a team has discovered valuable truths.",
      "The fundamental activity of a startup is to turn ideas into products, measure how customers respond, and learn whether to pivot or persevere.",
      "A minimum viable product helps entrepreneurs start the learning process as quickly as possible."
    ]
  },
  {
    id: "atomic-habits",
    title: "Atomic Habits",
    author: "James Clear",
    categories: ["habits", "behavior-change", "productivity", "self-improvement"],
    language: "en",
    description:
      "A practical book about behavior change, habit formation, identity-based habits, and small compounding improvements.",
    sourceRef: "Chapter 1, The Surprising Power of Atomic Habits",
    sampleExcerpts: [
      "Habits are the compound interest of self-improvement.",
      "You do not rise to the level of your goals. You fall to the level of your systems.",
      "Every action you take is a vote for the type of person you wish to become."
    ]
  },
  {
    id: "the-effective-executive",
    title: "The Effective Executive",
    author: "Peter F. Drucker",
    categories: ["management", "productivity", "leadership", "decision-making"],
    language: "en",
    description:
      "A management classic about effectiveness, time management, contribution, strengths, and executive decision-making.",
    sourceRef: "Chapter 2, Know Thy Time",
    sampleExcerpts: [
      "Effective executives know where their time goes.",
      "What can I contribute that will significantly affect the performance and results of the institution I serve?",
      "Effective decisions are made as a systematic process."
    ]
  }
];
