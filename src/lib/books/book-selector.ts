import { presetBooks, type PresetBook } from "@/lib/books/preset-books";

export type SelectedPresetBook = PresetBook & {
  score: number;
  relevanceReason: string;
};

export type PresetBookSelection = {
  selectedBooks: SelectedPresetBook[];
  lowConfidence: boolean;
};

const queryAliases: Record<string, string[]> = {
  startup: ["startup", "founder", "创业", "创始", "公司", "商业化"],
  product: ["product", "mvp", "用户", "产品", "需求", "实验", "验证"],
  innovation: ["innovation", "disrupt", "technology", "创新", "技术", "颠覆"],
  business: ["business", "strategy", "market", "商业", "战略", "市场", "竞争"],
  monopoly: ["monopoly", "competition", "垄断", "竞争"],
  "decision-making": ["decision", "decide", "judgment", "choice", "决策", "判断", "选择"],
  "cognitive-bias": ["bias", "heuristic", "intuition", "confidence", "偏见", "启发式", "直觉", "自信"],
  psychology: ["psychology", "system 1", "system 2", "心理", "快思慢想", "系统1", "系统2"],
  "mental-models": ["mental model", "model", "多元思维", "模型", "思维模型"],
  management: ["management", "manager", "executive", "管理", "领导", "团队"],
  productivity: ["productivity", "time", "效率", "时间", "执行"],
  habits: ["habit", "behavior", "routine", "习惯", "行为"],
  investing: ["invest", "incentive", "投资", "激励"],
  "systems-thinking": ["system", "feedback", "loop", "系统", "反馈", "复盘"]
};

const categoryLabels: Record<string, string> = {
  startup: "创业",
  product: "产品验证",
  innovation: "创新",
  business: "商业策略",
  monopoly: "竞争",
  "decision-making": "决策",
  "cognitive-bias": "认知偏差",
  psychology: "心理学",
  "mental-models": "思维模型",
  management: "管理",
  productivity: "效率",
  habits: "习惯",
  investing: "投资和激励",
  "systems-thinking": "系统思考"
};

const defaultBookOrder = [
  "principles",
  "thinking-fast-and-slow",
  "poor-charlies-almanack",
  "the-lean-startup",
  "zero-to-one",
  "the-innovators-dilemma",
  "the-effective-executive",
  "atomic-habits"
];

export function selectTopPresetBooks(question: string, limit = 3): PresetBookSelection {
  const normalizedQuestion = normalize(question);
  const queryTokens = tokenize(normalizedQuestion);

  const scored = presetBooks.map((book, index) => {
    const searchableText = normalize(
      [book.title, book.author, book.categories.join(" "), book.description, book.sampleExcerpts.join(" ")].join(" ")
    );
    const searchableTokens = new Set(tokenize(searchableText));
    const categoryScore = scoreCategories(normalizedQuestion, book.categories);
    const tokenScore = queryTokens.reduce((total, token) => {
      if (token.length < 2) {
        return total;
      }
      return total + (searchableTokens.has(token) ? 1 : searchableText.includes(token) ? 0.5 : 0);
    }, 0);
    const titleAuthorScore =
      normalizedQuestion.includes(normalize(book.title)) || normalizedQuestion.includes(normalize(book.author)) ? 4 : 0;
    const defaultTieBreaker = (defaultBookOrder.length - defaultBookOrder.indexOf(book.id)) / 100;

    return {
      book,
      score: categoryScore + tokenScore + titleAuthorScore + defaultTieBreaker,
      index
    };
  });

  const selectedBooks = scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(1, limit))
    .map(({ book, score }) => ({
      ...book,
      score,
      relevanceReason: buildRelevanceReason(book, normalizedQuestion, score)
    }));

  return {
    selectedBooks,
    lowConfidence: selectedBooks.every((book) => book.score < 2)
  };
}

function scoreCategories(normalizedQuestion: string, categories: string[]) {
  return categories.reduce((total, category) => {
    const aliases = queryAliases[category] ?? [category];
    const aliasScore = aliases.some((alias) => normalizedQuestion.includes(normalize(alias))) ? 4 : 0;
    const categoryTokenScore = category
      .split("-")
      .filter((token) => token.length > 2)
      .some((token) => normalizedQuestion.includes(token))
      ? 2
      : 0;
    return total + aliasScore + categoryTokenScore;
  }, 0);
}

function buildRelevanceReason(book: PresetBook, normalizedQuestion: string, score: number) {
  const matchedCategories = book.categories.filter((category) =>
    (queryAliases[category] ?? [category]).some((alias) => normalizedQuestion.includes(normalize(alias)))
  );

  if (matchedCategories.length > 0) {
    return `这本书和问题里的${matchedCategories
      .slice(0, 2)
      .map((category) => categoryLabels[category] ?? category)
      .join("、")}相关。`;
  }

  if (score >= 2) {
    return "这本书的介绍或摘录里有能用来参考的相关内容。";
  }

  return "这本书和问题的匹配度一般，但可以提供一个补充视角。";
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return normalize(value)
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}
