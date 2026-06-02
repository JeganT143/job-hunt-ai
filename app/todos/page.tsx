export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { TodosClient } from "./TodosClient";
import type { Todo } from "./types";

export default async function TodosPage() {
  const raw = await prisma.todo.findMany({ orderBy: { createdAt: "desc" } });

  const todos: Todo[] = raw.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  }));

  return <TodosClient initialTodos={todos} />;
}
