import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "minimax/minimax-m3";

function buildSystemPrompt(data: {
  applications: unknown[];
  interviews: unknown[];
  prepTopics: unknown[];
  todos: unknown[];
}): string {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `You are an AI career coach embedded inside the user's Job Hunt AI app. Today is ${today}.

You have full context of their job search data. Use it to give specific, actionable advice.

## Current Job Search Data

### Applications (${data.applications.length} total)
${JSON.stringify(data.applications, null, 2)}

### Interviews (${data.interviews.length} total)
${JSON.stringify(data.interviews, null, 2)}

### Prep Topics (${data.prepTopics.length} total)
${JSON.stringify(data.prepTopics, null, 2)}

### Todos (${data.todos.length} total)
${JSON.stringify(data.todos, null, 2)}

## Slash Commands
When the user sends a slash command, follow these instructions:

- **/status** — Give a concise summary of where they stand: active applications by stage, upcoming interviews, pending todos, prep progress. Use bullet points.
- **/prep-plan** — Generate a personalized study plan based on their active applications. Reference specific companies/roles and tailor topics accordingly.
- **/draft-email [company]** — Draft a professional, warm follow-up email for the specified company. Pull the role and application date from the data.
- **/interview-prep [company]** — Generate 8–12 likely interview questions for the specified company and role. Mix behavioral, technical, and culture-fit questions. Add brief guidance on how to approach each.
- **/weekly-review** — Review this week's activity: what was applied to, interviews scheduled, todos completed. Identify patterns and suggest 3 concrete next actions.
- **/todo-suggest** — Suggest 5–7 specific, time-bound todos based on their current pipeline. Prioritize by urgency and impact.

## Guidelines
- Be specific — reference actual companies, roles, and dates from the data
- Be concise but thorough — use markdown formatting, bullet points, and headers
- Be encouraging but honest
- If data is sparse, acknowledge it and still give useful general advice tailored to their situation`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [rawApps, interviews, prepTopics, todos] = await Promise.all([
      prisma.application.findMany({
        include: { interviews: true, contacts: true },
        orderBy: { appliedDate: "desc" },
      }),
      prisma.interview.findMany({
        include: { application: { select: { company: true, role: true } } },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.prepTopic.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.todo.findMany({
        orderBy: [{ done: "asc" }, { dueDate: "asc" }],
      }),
    ]);

    const applications = rawApps.map((a) => ({
      ...a,
      appliedDate: a.appliedDate.toISOString(),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      interviews: a.interviews.map((i) => ({
        ...i,
        scheduledAt: i.scheduledAt.toISOString(),
      })),
    }));
    const serializedInterviews = interviews.map((i) => ({
      ...i,
      scheduledAt: i.scheduledAt.toISOString(),
    }));
    const serializedTodos = todos.map((t) => ({
      ...t,
      dueDate: t.dueDate?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    }));

    const systemPrompt = buildSystemPrompt({
      applications,
      interviews: serializedInterviews,
      prepTopics,
      todos: serializedTodos,
    });

    const upstream = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://job-hunt-ai.local",
        "X-Title": "Job Hunt AI",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text();
      console.error("[AI chat] OpenRouter error", upstream.status, text);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse OpenAI-compatible SSE and re-stream plain text to the client
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const text: string =
                  parsed?.choices?.[0]?.delta?.content ?? "";
                if (text) controller.enqueue(encoder.encode(text));
              } catch {
                // skip malformed SSE lines
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[AI chat]", err);
    return new Response(JSON.stringify({ error: "AI request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
