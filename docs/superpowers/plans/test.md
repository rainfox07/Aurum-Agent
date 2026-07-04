下面这份可以直接交给 AI 编程工具使用，让它在现有项目里实现“预设书籍 -> 自动选 3 本 -> 分别引用回答”的功能。

```text
你现在要在 Aurum Agent 项目里实现一个“预设书籍自动选源回答”功能。

目标：
用户输入问题后，系统不再让用户手动选择信息来源，而是自动从预设书籍库里选择最相关的 3 本书，并要求 LLM 基于这 3 本书分别回答。每一部分回答都必须引用对应书籍的 source 信息。

技术栈：
- Next.js 15
- TypeScript
- 当前项目已有 `/chat` 页面、`/api/chat`、`/api/ask`、`/api/answer`、`src/lib/mock-data.ts`、`src/lib/answers/*`
- 优先基于现有结构改，不要大重构
- 暂时可以使用内置预设书籍和 mock excerpts，不要求真实向量数据库
- 代码结构要方便以后替换为真实 RAG、向量库和数据库

核心产品逻辑：
1. 系统内置一批预设书籍。
2. 用户提问。
3. 系统根据问题自动从预设书籍中选出最相关的 3 本。
4. LLM 必须基于这 3 本书回答。
5. 回答格式必须分成 3 个部分，每个部分对应一本书。
6. 每个部分必须包含：
   - 书名
   - 作者
   - 基于这本书的回答
   - 至少 1 条引用 citation
7. 如果预设书籍无法支持回答，则可以不引用书籍，或者间接引用。
8. 每个回答段落都必须有 citation marker，但不必像essay一样的类型，可以轻松些。

预设书籍列表：
请在代码中内置以下书籍作为 v1 书籍库。

```ts
export const presetBooks = [
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
```

预处理要求：
请不要每次直接把完整书籍库无结构地塞进 prompt。需要做一个轻量预处理层。

请实现：

1. `src/lib/books/preset-books.ts`
   - 存放 `presetBooks`
   - 定义类型 `PresetBook`

2. `src/lib/books/book-selector.ts`
   - 实现 `selectTopPresetBooks(question: string, limit = 3)`
   - 根据问题和书籍的 title、author、categories、description、sampleExcerpts 做相关性评分
   - v1 可以用关键词匹配，不需要 embedding
   - 必须稳定返回 3 本
   - 如果匹配度都很低，也返回 3 本，但标记 `lowConfidence: true`

3. `src/lib/books/book-evidence.ts`
   - 实现 `buildPresetBookEvidence(selectedBooks)`
   - 把选中的 3 本书转换成 LLM evidence block
   - 每本书生成一个 evidence id：
     - 第一本文献 `book_1`
     - 第二本文献 `book_2`
     - 第三本文献 `book_3`
   - 每个 evidence item 包含：
     - evidenceId
     - sourceId
     - title
     - author
     - sourceRef
     - quotedText
     - relevanceReason

4. 修改或新增 API：
   - 推荐新增 `POST /api/preset-book-answer`
   - 或者修改现有 `/api/chat`，但必须保留旧逻辑不被完全破坏
   - 推荐让 `/chat` 调用新的 `/api/preset-book-answer`

请求格式：

```ts
{
  "question": "用户问题",
  "conversationMessages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "llmConfig": {
    "baseUrl": "https://api.deepseek.com",
    "model": "deepseek-chat",
    "apiKey": "sk-..."
  }
}
```

响应格式：

```ts
{
  "messageId": "asst-xxx",
  "markdown": "回答正文",
  "selectedBooks": [
    {
      "id": "principles",
      "title": "Principles",
      "author": "Ray Dalio",
      "relevanceReason": "..."
    }
  ],
  "citations": [
    {
      "id": "cite-1",
      "evidenceId": "book_1",
      "sourceId": "principles",
      "title": "Principles",
      "authorOrDomain": "Ray Dalio",
      "sourceRef": "Part II, Life Principles",
      "quotedText": "..."
    }
  ],
  "lowConfidence": false,
  "model": "deepseek-chat",
  "aiMode": "live" | "mock",
  "warning": "optional warning"
}
```

每次调用 LLM 时必须 follow 的系统提示词：
请在代码中创建一个 prompt builder，例如：

- `src/lib/books/preset-book-prompt.ts`
- `buildPresetBookAnswerMessages(input)`

LLM 系统提示词必须包含下面这段规则，不能省略：

```text
You are Aurum Agent, a source-centric book-grounded assistant.

Your task:
1. Read the user's question.
2. Use ONLY the three selected preset books provided in the evidence block.
3. Answer separately from each selected book's perspective.
4. Each book section must cite its own evidence marker.
5. Every non-empty paragraph must include at least one citation marker.
6. Do not use books that are not listed in the evidence block.
7. Do not invent page numbers, chapters, quotes, or source references.
8. If the evidence is insufficient, say clearly: "I don't have enough source evidence to answer this fully."
9. You may explain what each book would emphasize, but you must stay grounded in the provided title, author, description, sourceRef, and quotedText.
10. Use citation markers exactly as provided: [^book_1], [^book_2], [^book_3].
11. Do not output uncited claims.
12. Do not merge the three books into one generic answer. The answer must have three separate book sections.
```

LLM user prompt 格式必须类似：

```text
User question:
{question}

Selected preset books:
1. Evidence ID: book_1
   Source ID: {sourceId}
   Title: {title}
   Author: {author}
   Source Ref: {sourceRef}
   Relevance Reason: {relevanceReason}
   Quoted Text:
   - {quote1}
   - {quote2}

2. Evidence ID: book_2
   ...

3. Evidence ID: book_3
   ...

Required output format:

## 1. {Book Title} — {Author}

**Why this source was selected:** ...
**Answer from this book:** ...
**Citation:** [^book_1]

## 2. {Book Title} — {Author}

**Why this source was selected:** ...
**Answer from this book:** ...
**Citation:** [^book_2]

## 3. {Book Title} — {Author}

**Why this source was selected:** ...
**Answer from this book:** ...
**Citation:** [^book_3]

## Short synthesis

Briefly compare the three answers. This synthesis must cite all three sources: [^book_1] [^book_2] [^book_3]
```

注意：
- synthesis 也必须带引用
- 每个书籍 section 至少有一个 citation marker

校验要求：
请实现 citation 校验：
- 检查每个非空段落是否至少包含一个 citation marker
- 如果 LLM 输出没有引用：
  - 不要直接展示无引用回答
  - 可以重试一次，或者回退到本地 mock answer
- mock answer 也必须符合 citation 格式

本地 mock fallback 要求：
如果没有配置 API key，仍然要能回答。
请生成一个本地 fallback answer：

```md
## 1. Principles — Ray Dalio

**Why this source was selected:** This book is relevant because it focuses on explicit principles, feedback loops, and decision quality. [^book_1]

**Answer from this book:** From this source, the question should be approached by turning unclear judgment into explicit rules that can be tested against reality. [^book_1]

## 2. Thinking, Fast and Slow — Daniel Kahneman

**Why this source was selected:** This book is relevant because it explains how intuitive judgment can be biased and why slower reasoning is sometimes necessary. [^book_2]

**Answer from this book:** From this source, the key is to notice when fast intuition may be unreliable and deliberately slow down before making a conclusion. [^book_2]

## 3. Poor Charlie's Almanack — Charlie Munger

**Why this source was selected:** This book is relevant because it emphasizes multidisciplinary mental models and avoiding narrow thinking. [^book_3]

**Answer from this book:** From this source, the user should examine the problem through several mental models instead of relying on one explanation. [^book_3]

## Short synthesis

Together, these books suggest a process: make your principles explicit, check your intuitive judgment, and examine the problem through multiple models. [^book_1] [^book_2] [^book_3]
```

但 fallback 里的书名和内容必须根据实际选中的 3 本动态生成，不要永远固定这三本。

前端要求：
修改 `/chat` 页面：
1. 用户输入问题后，自动调用新的自动选书回答接口。
2. 页面需要显示：
   - 用户问题
   - AI 回答
   - 本次自动选择的 3 本书
   - 每本书的 citation card
3. 右侧 citation panel 要显示：
   - selected books
   - title
   - author
   - sourceRef
   - quotedText
   - relevanceReason
4. 不需要用户手动勾选书籍。
5. 回答区要保留 citation marker。
6. 如果 `lowConfidence: true`，在回答上方显示一个轻量提示：
   “The selected books may only partially match this question.”

UI 文案可以中英混合，但优先保持当前项目风格。

测试要求：
至少增加或更新以下测试：

1. `tests/unit/book-selector.test.ts`
   - 输入和 startup/product 相关的问题，应选择 `Zero to One` 或 `The Lean Startup`
   - 输入和 bias/decision 相关的问题，应选择 `Thinking, Fast and Slow`
   - 永远返回 3 本

2. `tests/unit/preset-book-answer.test.ts`
   - mock 无 API key 时返回 fallback answer
   - answer 包含 `[^book_1]`、`[^book_2]`、`[^book_3]`
   - citations 长度为 3
   - 每个 citation 都有 title、authorOrDomain、sourceRef、quotedText

3. 如果已有 citation validator，可以扩展它支持 `book_1` 格式；如果不好扩展，则新增一个专用 validator。

验证命令：
完成后运行：

```bash
npm run typecheck
npm test
npm run build
```

如果失败，请修复到全部通过。

重要约束：
- 不要把 API key 写死到代码里
- 不要删除现有 `/settings/api`
- 不要删除现有 `createChatCompletion`
- 不要引入数据库或向量库，本次只做内置书籍 + 轻量 selector
- 不要做手动 source picker，这次目标是自动选 3 本
- 不要生成没有 citation 的回答
- 不要让 LLM 使用预设书籍以外的来源

交付时请说明：
1. 新增了哪些文件
2. 修改了哪些文件
3. 用户提问到回答的流程是什么
4. 预设书籍在哪里维护
5. 后续如果要升级为真实 RAG，应该替换哪一层
```