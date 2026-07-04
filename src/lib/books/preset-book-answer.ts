import { createChatCompletion, isLiveLlmConfigured, LlmRequestError, type LlmConfigInput } from "@/lib/ai/chat-client";
import { buildPresetBookEvidence, type PresetBookEvidenceItem } from "@/lib/books/book-evidence";
import { selectTopPresetBooks } from "@/lib/books/book-selector";
import { buildPresetBookAnswerMessages } from "@/lib/books/preset-book-prompt";
import { presetBooks } from "@/lib/books/preset-books";
import type { CitationView, SelectedBookSourceView } from "@/lib/types";

export type PresetBookAnswerInput = {
  question: string;
  conversationMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  llmConfig?: LlmConfigInput;
};

export type PresetBookAnswerResult = {
  messageId: string;
  markdown: string;
  selectedBooks: SelectedBookSourceView[];
  citations: CitationView[];
  lowConfidence: boolean;
  model: string;
  aiMode: "live" | "mock";
  warning?: string;
};

type BookFollowUpContext = {
  focusedTitle?: string;
  previousBookContext: string;
};

export async function generatePresetBookAnswer({
  question,
  conversationMessages = [],
  llmConfig
}: PresetBookAnswerInput): Promise<PresetBookAnswerResult> {
  const followUpContext = getBookFollowUpContext(question, conversationMessages);
  if (followUpContext) {
    return generateFocusedBookFollowUpReply({
      message: question,
      llmConfig,
      followUpContext
    });
  }

  if (!shouldUseBookAnswer(question, conversationMessages)) {
    return generateDirectAurumReply({ message: question, conversationMessages, llmConfig });
  }

  const selection = selectTopPresetBooks(question, 3);
  const evidence = buildPresetBookEvidence(selection.selectedBooks);
  const selectedBooks = toSelectedBooks(evidence);
  const citations = toCitations(evidence);
  const lowConfidenceWarning = selection.lowConfidence ? "这次选的书可能只和问题部分相关。" : undefined;

  if (!isLiveLlmConfigured(llmConfig)) {
    return {
      messageId: `asst-${Date.now()}`,
      markdown: buildFallbackPresetBookAnswer(question, evidence),
      selectedBooks,
      citations,
      lowConfidence: selection.lowConfidence,
      model: "local-preset-book-fallback",
      aiMode: "mock",
      warning: lowConfidenceWarning ?? "当前没有配置可用模型，已使用本地中文 fallback。"
    };
  }

  try {
    const completion = await createChatCompletion(
      {
        messages: buildPresetBookAnswerMessages({ question, evidence }),
        temperature: 0.25
      },
      llmConfig
    );
    const markdown = validatePresetBookAnswer(stripCitationMarkers(completion.content), evidence);

    return {
      messageId: `asst-${Date.now()}`,
      markdown: markdown || buildFallbackPresetBookAnswer(question, evidence),
      selectedBooks,
      citations,
      lowConfidence: selection.lowConfidence,
      model: completion.model,
      aiMode: "live",
      warning: lowConfidenceWarning
    };
  } catch (error) {
    return {
      messageId: `asst-${Date.now()}`,
      markdown: buildFallbackPresetBookAnswer(question, evidence),
      selectedBooks,
      citations,
      lowConfidence: selection.lowConfidence,
      model: "local-preset-book-fallback",
      aiMode: "mock",
      warning:
        lowConfidenceWarning ??
        (error instanceof LlmRequestError
          ? error.message
          : "模型调用失败，已使用本地中文 fallback。")
    };
  }
}

export function validatePresetBookAnswer(markdown: string, evidence: PresetBookEvidenceItem[]) {
  const normalized = stripCitationMarkers(markdown).trim();

  if (!normalized) {
    throw new Error("Preset book answer is empty.");
  }

  for (const item of evidence) {
    if (!normalized.includes(`《${item.title}》`) && !normalized.includes(item.title)) {
      throw new Error(`Preset book answer does not mention ${item.title}.`);
    }
  }

  if ((normalized.match(/^>/gm) ?? []).length < evidence.length) {
    throw new Error("Preset book answer does not include inline quotes.");
  }

  for (const item of evidence) {
    if (!normalized.includes(item.sourceRef)) {
      throw new Error(`Preset book answer does not include source ref for ${item.title}.`);
    }
  }

  if (!normalized.includes("**")) {
    throw new Error("Preset book answer does not include strong relevance markup.");
  }

  return normalized;
}

function buildFallbackPresetBookAnswer(question: string, evidence: PresetBookEvidenceItem[]) {
  const [first, second, third] = evidence;
  const lines = evidence.map((item, index) => {
    const lead = index === 0 ? "会觉得" : index === 1 ? "会补充" : "会从另一个角度提醒";
    return [
      `《${item.title}》${lead}：${buildBookSpecificAnswer(item)}`,
      `> 摘录（位置：${item.sourceRef}）：${item.quotedTexts[0]}`
    ].join("\n\n");
  });

  return [
    ...lines,
    `合起来看，${first ? `《${first.title}》` : "第一本书"}偏方法，${second ? `《${second.title}》` : "第二本书"}偏提醒，${third ? `《${third.title}》` : "第三本书"}偏补充视角；你可以先挑一个最容易执行的动作试一下。`
  ].join("\n\n");
}

function buildBookSpecificAnswer(item: PresetBookEvidenceItem) {
  const normalizedCategories = item.sourceId;

  if (normalizedCategories === "principles") {
    return "先把判断标准写清楚，别只凭感觉做决定，然后用现实反馈不断修正。";
  }

  if (normalizedCategories === "thinking-fast-and-slow") {
    return "直觉有时很快但不一定准，遇到重要选择时最好慢下来检查偏见。";
  }

  if (normalizedCategories === "poor-charlies-almanack") {
    return "不要只用一个角度看问题，多换几个思维模型，尤其要注意激励和反常识的地方。";
  }

  if (normalizedCategories === "the-innovators-dilemma") {
    return "别只看现在主流用户喜欢什么，也要看看那些暂时不起眼的新需求会不会慢慢变重要。";
  }

  if (normalizedCategories === "zero-to-one") {
    return "重点不是跟别人做得一样好，而是找到一个独特、别人没认真做的方向。";
  }

  if (normalizedCategories === "the-lean-startup") {
    return "先做一个最小版本去验证，不要在会议里空想太久，用用户反应来决定下一步。";
  }

  if (normalizedCategories === "atomic-habits") {
    return "别只盯着大目标，先把每天能重复的小动作设计好，系统比一时热情更可靠。";
  }

  return "先弄清楚时间和注意力花到哪里，再把精力放到最能产生贡献的事情上。";
}

function toSelectedBooks(evidence: PresetBookEvidenceItem[]): SelectedBookSourceView[] {
  return evidence.map((item) => ({
    id: item.sourceId,
    title: item.title,
    author: item.author,
    sourceRef: item.sourceRef,
    quotedText: item.quotedText,
    relevanceReason: item.relevanceReason
  }));
}

function toCitations(evidence: PresetBookEvidenceItem[]): CitationView[] {
  return evidence.map((item, index) => ({
    id: `cite-${index + 1}`,
    evidenceId: item.evidenceId,
    sourceId: item.sourceId,
    title: item.title,
    authorOrDomain: item.author,
    sourceRef: item.sourceRef,
    quotedText: item.quotedText,
    relevanceReason: item.relevanceReason
  }));
}

export function shouldUseBookAnswer(
  input: string,
  conversationMessages: Array<{ role: "user" | "assistant"; content: string }> = []
) {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (isAssistantMetaMessage(normalized)) {
    return false;
  }

  if (getBookFollowUpContext(input, conversationMessages)) {
    return false;
  }

  if (isConcreteSituationQuestion(normalized)) {
    return false;
  }

  return isBroadBookQuestion(normalized);
}

function getBookFollowUpContext(
  input: string,
  conversationMessages: Array<{ role: "user" | "assistant"; content: string }>
) {
  const normalized = input.trim().toLowerCase();
  const previousBookAnswer = [...conversationMessages].reverse().find(
    (message) =>
      message.role === "assistant" &&
      (message.content.includes("《") || message.content.includes("摘录（位置：") || message.content.includes("摘录"))
  );

  if (!previousBookAnswer) {
    return null;
  }

  if (!isFollowUpWording(normalized)) {
    return null;
  }

  const focusedTitle = detectFocusedBookTitle(input);
  return {
    focusedTitle,
    previousBookContext: extractFocusedBookContext(previousBookAnswer.content, focusedTitle)
  };
}

function isFollowUpWording(input: string) {
  return /(上面|刚才|继续|展开|具体|详细|追问|那|这个|这点|这句|这段|这句话|是什么意思|什么意思|什么含义|第一点|第二点|第三点|怎么做|举个例子|换句话说|哪一本|哪本|这本|那本|它|他们|这些|摘录|引用|再说|然后呢)/.test(
    input
  );
}

function detectFocusedBookTitle(input: string) {
  const normalized = input.toLowerCase();
  const matched = presetBooks.find((book) => normalized.includes(book.title.toLowerCase()));

  if (matched) {
    return matched.title;
  }

  if (/(原则|决策规则|达利欧|dalio)/i.test(input)) {
    return "Principles";
  }

  return undefined;
}

function extractFocusedBookContext(answer: string, focusedTitle?: string) {
  const normalized = answer.trim();
  if (!focusedTitle) {
    return normalized.slice(0, 1600);
  }

  const titleIndex = normalized.toLowerCase().indexOf(focusedTitle.toLowerCase());
  if (titleIndex < 0) {
    return normalized.slice(0, 1600);
  }

  const nextBookIndex = normalized.indexOf("\n《", titleIndex + focusedTitle.length);
  const section = nextBookIndex >= 0 ? normalized.slice(titleIndex, nextBookIndex) : normalized.slice(titleIndex);
  return section.trim().slice(0, 1600);
}

function isConcreteSituationQuestion(input: string) {
  const hasConcreteMarker =
    /(我现在|我目前|我们现在|我们目前|我的|我们的|公司|团队|项目|产品|用户|客户|预算|时间|今天|明天|下周|本周|面试|考试|作业|代码|页面|功能|bug|报错|具体情况|场景|案例|比如|已经|正在|遇到|卡在|只有|小时|天内|行业)/.test(
      input
    );

  const stillBroad =
    /^(我)?(如何|怎么|怎样)(提高|提升|改善|改进|做好|做出)|有什么(建议|看法|方法|原则)/.test(input) &&
    input.length <= 24;

  return hasConcreteMarker && !stillBroad;
}

function isBroadBookQuestion(input: string) {
  const broadTopic =
    /(效率|习惯|决策|判断|创业|产品|管理|创新|偏见|思维|学习|原则|执行|战略|选择|成长|自律|领导|商业|竞争|验证|mvp|startup|product|decision|habit|efficiency|management|innovation|strategy|bias|learning)/.test(
      input
    );
  const broadAsk =
    /(如何|怎么|怎样|为什么|为何|什么|是否|能不能|可不可以|应该|该不该|建议|推荐|分析|看法|原因|影响|提升|提高|改进|优化|选择|判断|how|why|what|should|advice|improve|validate)/.test(
      input
    );

  return broadTopic && broadAsk;
}

async function generateFocusedBookFollowUpReply({
  message,
  llmConfig,
  followUpContext
}: {
  message: string;
  llmConfig?: LlmConfigInput;
  followUpContext: BookFollowUpContext;
}): Promise<PresetBookAnswerResult> {
  if (isLiveLlmConfigured(llmConfig)) {
    try {
      const completion = await createChatCompletion(
        {
          messages: [
            {
              role: "system",
              content: [
                "你是 Aurum，一个中文读书参考助手。现在用户是在追问上一轮回答里的某一本书或某一句话。",
                "必须遵守：",
                "1. 只解释用户追问的这一本书、这一句话或这一点。",
                "2. 不要重新展开三本书，不要补充其他书的观点。",
                "3. 不要输出新的摘录 blockquote，不要使用“摘录（位置：...）”格式。",
                "4. 回答要像普通聊天，简短、清楚，最好用一个具体例子解释。",
                "5. 如果用户问“是什么意思”，先直接解释这句话的意思。"
              ].join("\n")
            },
            {
              role: "user",
              content: [
                `用户追问：${message}`,
                "",
                `被追问的书：${followUpContext.focusedTitle ?? "上一轮回答中的相关书籍或观点"}`,
                "",
                "只允许参考这段上下文，不要使用其他书的段落：",
                followUpContext.previousBookContext
              ].join("\n")
            }
          ],
          temperature: 0.2
        },
        llmConfig
      );
      const markdown = stripCitationMarkers(completion.content).trim();

      return {
        messageId: `asst-${Date.now()}`,
        markdown: isFocusedFollowUpAnswerValid(markdown, followUpContext)
          ? markdown
          : buildFocusedFollowUpFallback(message, followUpContext),
        selectedBooks: [],
        citations: [],
        lowConfidence: false,
        model: completion.model,
        aiMode: "live"
      };
    } catch (error) {
      return {
        messageId: `asst-${Date.now()}`,
        markdown: buildFocusedFollowUpFallback(message, followUpContext),
        selectedBooks: [],
        citations: [],
        lowConfidence: false,
        model: "local-focused-follow-up",
        aiMode: "mock",
        warning: error instanceof LlmRequestError ? error.message : "模型追问回答失败，已使用本地兜底。"
      };
    }
  }

  return {
    messageId: `asst-${Date.now()}`,
    markdown: buildFocusedFollowUpFallback(message, followUpContext),
    selectedBooks: [],
    citations: [],
    lowConfidence: false,
    model: "local-focused-follow-up",
    aiMode: "mock",
    warning: "当前没有配置可用模型，已使用本地兜底。"
  };
}

function isFocusedFollowUpAnswerValid(markdown: string, followUpContext: BookFollowUpContext) {
  if (!markdown) {
    return false;
  }

  if (markdown.includes("摘录（位置：") || markdown.includes("> 摘录")) {
    return false;
  }

  const focusedTitle = followUpContext.focusedTitle;
  if (!focusedTitle) {
    return true;
  }

  return !presetBooks.some((book) => book.title !== focusedTitle && markdown.includes(`《${book.title}》`));
}

function buildFocusedFollowUpFallback(message: string, followUpContext: BookFollowUpContext) {
  const title = followUpContext.focusedTitle ? `《${followUpContext.focusedTitle}》` : "这里";

  if (/原则|决策规则|感觉|principles/i.test(message)) {
    return `${title}这里的意思是：别每次都靠临场感觉决定怎么做，而是先把判断标准写成一条可以反复使用的规则。比如你每天安排任务时，不要只是觉得哪个顺手就做哪个，而是先定一个规则：先做最重要、最影响结果、最需要专注的事。做完之后再看这个规则有没有帮你省时间、减少返工，然后继续调整。`;
  }

  return `${title}这里主要是在解释上一轮提到的那一点：把模糊的感觉变成更清楚的判断标准，然后在实际行动里验证它是否有效。这样你不是每次重新纠结，而是逐步形成一套自己的做事规则。`;
}

async function generateDirectAurumReply({
  message,
  conversationMessages,
  llmConfig
}: {
  message: string;
  conversationMessages: Array<{ role: "user" | "assistant"; content: string }>;
  llmConfig?: LlmConfigInput;
}): Promise<PresetBookAnswerResult> {
  if (isLiveLlmConfigured(llmConfig)) {
    try {
      const recentMessages = conversationMessages
        .filter((item) => item.content.trim() !== message.trim())
        .slice(-8);
      const completion = await createChatCompletion(
        {
          messages: [
            {
              role: "system",
              content:
                "你是 Aurum，一个面向普通用户的读书参考助手。你正在和用户进行普通聊天。请用中文简短回答，语气自然，不要编造自己已经读取了书籍，也不要输出引用标记。用户问你是谁或是不是大模型时，说明你是 Aurum 的 AI 助手，当前会通过已配置的模型接口生成回复。"
            },
            ...recentMessages,
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.3
        },
        llmConfig
      );

      return {
        messageId: `asst-${Date.now()}`,
        markdown: stripCitationMarkers(completion.content).trim(),
        selectedBooks: [],
        citations: [],
        lowConfidence: false,
        model: completion.model,
        aiMode: "live"
      };
    } catch (error) {
      return {
        messageId: `asst-${Date.now()}`,
        markdown: buildBriefDirectAnswer(message),
        selectedBooks: [],
        citations: [],
        lowConfidence: false,
        model: "local-brief-reply",
        aiMode: "mock",
        warning: error instanceof LlmRequestError ? error.message : "模型普通聊天失败，已使用本地兜底。"
      };
    }
  }

  return {
    messageId: `asst-${Date.now()}`,
    markdown: buildBriefDirectAnswer(message),
    selectedBooks: [],
    citations: [],
    lowConfidence: false,
    model: "local-brief-reply",
    aiMode: "mock",
    warning: "当前没有配置可用模型，已使用本地兜底。"
  };
}

function isAssistantMetaMessage(input: string) {
  return /(你.*(是谁|叫什么|模型|大模型|ai|llm|响应|身份)|你现在是|自我介绍|介绍一下自己|aurum.*是什么)/i.test(input);
}

function buildBriefDirectAnswer(input: string) {
  const normalized = input.trim().toLowerCase();

  if (/^(hi|hello|hey|你好|哈喽|嗨)[！!。.\s]*$/.test(normalized)) {
    return "你好，我在。当前没有检测到可用模型配置，所以这条是本地兜底回复，不是大模型响应。配置 API key 之后，普通聊天会直接走模型。";
  }

  if (/谢谢|thank/.test(normalized)) {
    return "不客气。";
  }

  if (/你.*(是谁|模型|叫什么)|你的模型/.test(normalized)) {
    return "我是 Aurum。当前没有检测到可用模型配置，所以这条是本地兜底回复，不是大模型响应。配置 API key 之后，我会通过模型接口生成回复。";
  }

  return "收到。当前没有检测到可用模型配置，所以这条是本地兜底回复，不是大模型响应。";
}

function stripCitationMarkers(markdown: string) {
  return markdown
    .replace(/\s*\[\^[a-z]+_\d+\]/g, "")
    .replace(/[ \t]+>\s*/g, "\n\n> ")
    .replace(/\n>\s*/g, "\n\n> ")
    .replace(/\n{3,}/g, "\n\n");
}
