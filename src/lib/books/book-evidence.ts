import type { SelectedPresetBook } from "@/lib/books/book-selector";
import type { EvidenceItem } from "@/lib/types";

export type PresetBookEvidenceItem = EvidenceItem & {
  author: string;
  quotedTexts: string[];
  relevanceReason: string;
};

const chineseEvidenceCopy: Record<string, { sourceRef: string; excerpt: string }> = {
  principles: {
    sourceRef: "第二部分：生活原则",
    excerpt:
      "达利欧在生活原则部分强调，原则不是挂在墙上的口号，而是可以反复使用的判断工具：先把重要选择背后的标准写清楚，再拿现实结果来检验和修正。**真正相关的是这句意思：把原则当成明确的决策规则，并拿到现实里检验。**所以遇到复杂问题时，重点不是凭感觉赌一把，而是把自己的判断过程显性化。"
  },
  "thinking-fast-and-slow": {
    sourceRef: "第一部分：两个系统",
    excerpt:
      "卡尼曼在两个系统部分区分快速直觉和慢速思考：系统 1 反应快、很省力，但也容易被熟悉感、情绪和表面线索带着走；系统 2 更慢、更费力，适合检查重要判断。**强相关的位置在这里：自信只是一种感觉，不等于准确。**所以越是看起来“我很确定”的判断，越值得停下来复核。"
  },
  "poor-charlies-almanack": {
    sourceRef: "第二讲：基础普世智慧",
    excerpt:
      "芒格在基础普世智慧里反复说，判断问题不能只靠单一专业或单一经验，而要把数学、心理学、经济学、工程学等学科里的大想法组合起来用。**最相关的是这个提醒：手里只有锤子的人，看什么都像钉子。**也就是说，如果你只用一种解释框架，就很容易把真实问题看窄。"
  },
  "the-innovators-dilemma": {
    sourceRef: "第一章：优秀公司为什么会失败",
    excerpt:
      "克里斯坦森在第一章讨论了一个反直觉现象：很多公司不是因为管理差才失败，而是因为太认真服务现有大客户、太依赖现有评价标准，反而错过了早期看起来不够好的新技术。**强相关的位置是：优秀管理本身，反而可能成为失去领先地位的重要原因。**这适合用来提醒我们，别只看眼前最主流的需求。"
  },
  "zero-to-one": {
    sourceRef: "第一章：未来的挑战",
    excerpt:
      "蒂尔在第一章把进步分成两种：横向复制是从 1 到 n，把已有东西做更多；纵向创新是从 0 到 1，创造之前没有的东西。**这里最相关的是：重复已知做法，只是把世界从 1 推到 n。**所以如果问题涉及创业、产品或选择方向，就要问自己是不是只是在跟随竞争，还是找到了独特增量。"
  },
  "the-lean-startup": {
    sourceRef: "第三章：学习",
    excerpt:
      "里斯在学习这一章把创业看成一套学习机器：不要先把方案做完美，而是尽快做出能验证假设的最小版本，观察真实用户反应，再决定坚持还是转向。**强相关的位置是：最小可行产品能让创业者尽快开始学习。**这段最适合回答“怎么验证”“怎么降低不确定性”这类问题。"
  },
  "atomic-habits": {
    sourceRef: "第一章：微习惯的惊人力量",
    excerpt:
      "詹姆斯 Clear 在第一章强调，小习惯看起来不起眼，但会像复利一样慢慢改变结果；真正决定长期表现的，往往不是目标写得多漂亮，而是每天重复的系统。**最相关的是：你不会上升到目标的高度，而会下降到系统的水平。**所以想提高效率或改变状态，最好先改环境、流程和默认动作。"
  },
  "the-effective-executive": {
    sourceRef: "第二章：认识你的时间",
    excerpt:
      "德鲁克在认识你的时间这一章说，管理者首先要面对的不是技巧问题，而是时间被切碎、被别人占用、被低价值事务吞掉的问题。**强相关的位置是：卓有成效的管理者知道自己的时间花在哪里。**所以提高办事效率之前，先记录和诊断时间流向，比直接追求更多工具更重要。"
  }
};

export function buildPresetBookEvidence(selectedBooks: SelectedPresetBook[]): PresetBookEvidenceItem[] {
  return selectedBooks.map((book, index) => {
    const copy = chineseEvidenceCopy[book.id];
    const quotedTexts = copy?.excerpt
      ? [copy.excerpt]
      : [book.sampleExcerpts.slice(0, 3).join(" ")];
    return {
      evidenceId: `book_${index + 1}`,
      sourceId: book.id,
      title: book.title,
      author: book.author,
      authorOrDomain: book.author,
      sourceRef: copy?.sourceRef ?? book.sourceRef,
      quotedText: quotedTexts.join("\n\n"),
      quotedTexts,
      relevanceReason: book.relevanceReason
    };
  });
}
