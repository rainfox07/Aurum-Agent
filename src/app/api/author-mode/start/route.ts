import { NextResponse } from "next/server";
import { z } from "zod";
import { bookSources } from "@/lib/mock-data";

const sourceSchema = z.object({
  sourceId: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  sourceRef: z.string().optional(),
  quotedText: z.string().optional()
});

const schema = z.object({
  sourceId: z.string().min(1),
  source: sourceSchema.optional()
});

type BookMirrorSourceInput = z.infer<typeof sourceSchema>;

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "sourceId is required." }, { status: 400 });
  }

  const source: BookMirrorSourceInput | null =
    parsed.data.source ??
    (() => {
      const book = bookSources.find((item) => item.id === parsed.data.sourceId);
      return book
        ? {
            sourceId: book.id,
            title: book.title,
            author: book.author,
            sourceRef: undefined,
            quotedText: undefined
          }
        : null;
    })();

  if (!source) {
    return NextResponse.json({ error: "Author mode requires a book source." }, { status: 400 });
  }

  return NextResponse.json({
    conversationId: `book-mirror-${source.sourceId}`,
    branchId: `book-mirror-${source.sourceId}-main`,
    sourceId: source.sourceId,
    author: source.author,
    title: source.title,
    sourceRef: source.sourceRef,
    quotedText: source.quotedText,
    introMarkdown: `我是从《${source.title}》进入的 ${source.author} 模拟。你可以把现实问题直接抛给我，我会尽量以这个作者的思考方式、语气和判断习惯来回应；必要时才引用相关文本。`
  });
}
