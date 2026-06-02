"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, GripVertical, BookOpen, ExternalLink, Filter,
  CheckCircle2, Circle, Loader,
} from "lucide-react";
import {
  CATEGORIES, COLUMNS, CATEGORY_META, PRIORITY_META,
  parseResources, type PrepTopic,
} from "./types";
import { TopicModal } from "./TopicModal";
import { AddTopicModal } from "./AddTopicModal";

// ─── Card content (pure render, used in both board and DragOverlay) ───────────
export function CardContent({
  topic,
  overlay = false,
}: {
  topic: PrepTopic;
  overlay?: boolean;
}) {
  const catMeta = CATEGORY_META[topic.category] ?? CATEGORY_META.DSA;
  const priMeta = PRIORITY_META[topic.priority] ?? PRIORITY_META.Medium;
  const resources = parseResources(topic.resources);
  const notesPreview = topic.notes?.split("\n").filter(Boolean).slice(0, 2).join(" ") ?? "";

  return (
    <div
      className={`rounded-xl p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:border-violet-200 dark:group-hover:border-violet-800/50 transition-colors ${
        overlay ? "shadow-2xl rotate-1 scale-105 opacity-95" : "shadow-sm"
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${catMeta.badge}`}>
            {topic.category}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${priMeta.badge}`}>
            <span className={`w-1 h-1 rounded-full ${priMeta.dot}`} />
            {topic.priority}
          </span>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug mb-1.5">
        {topic.title}
      </h4>

      {notesPreview && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
          {notesPreview}
        </p>
      )}

      <div className="flex items-center gap-3 mt-1">
        {resources.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <ExternalLink size={10} />
            {resources.length} {resources.length === 1 ? "resource" : "resources"}
          </span>
        )}
        <span className="ml-auto text-[11px] text-slate-300 dark:text-slate-600">
          {new Date(topic.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}

// ─── Sortable card wrapper ────────────────────────────────────────────────────
function SortableCard({
  topic,
  onExpand,
}: {
  topic: PrepTopic;
  onExpand: (topic: PrepTopic) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-0.5 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-all touch-none"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <GripVertical size={14} />
      </button>

      {/* Click zone */}
      <div
        className="pl-5 cursor-pointer"
        onClick={() => onExpand(topic)}
      >
        <CardContent topic={topic} />
      </div>
    </div>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────
function KanbanColumn({
  column,
  topics,
  onExpand,
  onAddClick,
}: {
  column: (typeof COLUMNS)[number];
  topics: PrepTopic[];
  onExpand: (t: PrepTopic) => void;
  onAddClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col min-w-[288px] flex-1 max-w-sm">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full ${column.dotClass}`} />
        <span className={`text-sm font-semibold ${column.headerClass}`}>{column.label}</span>
        <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${column.countClass}`}>
          {topics.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl p-2 min-h-[120px] transition-colors duration-150 ${
          isOver
            ? "bg-violet-100 dark:bg-violet-900/20 ring-2 ring-violet-300 dark:ring-violet-700"
            : column.bgClass
        }`}
      >
        <SortableContext
          items={topics.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {topics.map((topic) => (
              <SortableCard key={topic.id} topic={topic} onExpand={onExpand} />
            ))}
          </div>
        </SortableContext>

        {/* Add button at bottom of empty column */}
        {topics.length === 0 && (
          <button
            onClick={onAddClick}
            className="w-full mt-1 py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-400 dark:text-slate-600 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
          >
            + Add first topic
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Category progress bar ────────────────────────────────────────────────────
function CategoryProgress({
  category,
  topics,
}: {
  category: string;
  topics: PrepTopic[];
}) {
  const cat = topics.filter((t) => t.category === category);
  const done = cat.filter((t) => t.status === "Done").length;
  const total = cat.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const meta = CATEGORY_META[category] ?? CATEGORY_META.DSA;

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3 group">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
      <span className="text-xs text-slate-600 dark:text-slate-400 w-28 truncate">{category}</span>
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden min-w-[60px]">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-8 text-right">{pct}%</span>
      <span className="text-[11px] text-slate-400 dark:text-slate-500 w-10 text-right opacity-0 group-hover:opacity-100 transition-opacity">
        {done}/{total}
      </span>
    </div>
  );
}

// ─── Main board ───────────────────────────────────────────────────────────────
export function PrepBoard({ initialTopics }: { initialTopics: PrepTopic[] }) {
  const [topics, setTopics] = useState<PrepTopic[]>(initialTopics);
  const [catFilter, setCatFilter] = useState<string>("");
  const [priFilter, setPriFilter] = useState<string>("");
  const [expandedTopic, setExpandedTopic] = useState<PrepTopic | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const originalStatus = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Filtered set (for display)
  const filtered = useMemo(() => {
    return topics.filter((t) => {
      return (!catFilter || t.category === catFilter) && (!priFilter || t.priority === priFilter);
    });
  }, [topics, catFilter, priFilter]);

  // Per-column filtered topics
  const byColumn = useMemo(() => {
    const map: Record<string, PrepTopic[]> = {
      NotStarted: [], InProgress: [], Done: [],
    };
    for (const t of filtered) {
      (map[t.status] ?? (map[t.status] = [])).push(t);
    }
    return map;
  }, [filtered]);

  // Overall stats
  const totalDone = topics.filter((t) => t.status === "Done").length;
  const totalCount = topics.length;
  const overallPct = totalCount > 0 ? Math.round((totalDone / totalCount) * 100) : 0;

  // ── DnD handlers ──
  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    const id = active.id as string;
    originalStatus.current = topics.find((t) => t.id === id)?.status ?? null;
    setActiveId(id);
  }, [topics]);

  const handleDragOver = useCallback(({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;
    const draggedId = active.id as string;
    const overId = over.id as string;
    const colIds = ["NotStarted", "InProgress", "Done"];
    const targetStatus = colIds.includes(overId)
      ? overId
      : topics.find((t) => t.id === overId)?.status;
    if (!targetStatus) return;
    setTopics((prev) => {
      const current = prev.find((t) => t.id === draggedId);
      if (!current || current.status === targetStatus) return prev;
      return prev.map((t) => (t.id === draggedId ? { ...t, status: targetStatus } : t));
    });
  }, [topics]);

  const handleDragEnd = useCallback(({ active }: DragEndEvent) => {
    const id = active.id as string;
    const currentStatus = topics.find((t) => t.id === id)?.status;
    if (currentStatus && currentStatus !== originalStatus.current) {
      fetch(`/api/prep-topics/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: currentStatus }),
      });
    }
    setActiveId(null);
    originalStatus.current = null;
  }, [topics]);

  const handleDragCancel = useCallback(() => {
    if (activeId && originalStatus.current) {
      setTopics((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: originalStatus.current! } : t))
      );
    }
    setActiveId(null);
    originalStatus.current = null;
  }, [activeId]);

  function handleAdded(topic: PrepTopic) {
    setTopics((prev) => [topic, ...prev]);
    setAddOpen(false);
  }

  function handleUpdated(topic: PrepTopic) {
    setTopics((prev) => prev.map((t) => (t.id === topic.id ? topic : t)));
    setExpandedTopic(topic);
  }

  function handleDeleted(id: string) {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    setExpandedTopic(null);
  }

  const activeTopic = activeId ? topics.find((t) => t.id === activeId) : null;

  return (
    <div className="min-h-full">
      {/* Page header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-semibold text-slate-900 dark:text-white text-sm">Preparation</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              {totalDone}/{totalCount} done
            </span>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add Topic</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">

        {/* Progress summary */}
        {totalCount > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Progress by Category</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {totalDone} of {totalCount} topics completed · {overallPct}% overall
                </p>
              </div>
              {/* Overall ring */}
              <div className="relative w-12 h-12">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                    className="text-emerald-500" strokeWidth="3"
                    strokeDasharray={`${overallPct} ${100 - overallPct}`}
                    strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {overallPct}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => (
                <CategoryProgress key={cat} category={cat} topics={topics} />
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter size={12} /> Filters
          </div>
          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCatFilter("")}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                !catFilter
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                  : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => {
              const m = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCatFilter(catFilter === cat ? "" : cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                    catFilter === cat
                      ? `${m.badge}`
                      : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${m.dot} mr-1.5 align-middle`} />
                  {cat}
                </button>
              );
            })}
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          {/* Priority filter */}
          <div className="flex gap-1.5">
            {["High", "Medium", "Low"].map((pri) => {
              const m = PRIORITY_META[pri];
              return (
                <button
                  key={pri}
                  onClick={() => setPriFilter(priFilter === pri ? "" : pri)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                    priFilter === pri
                      ? m.badge
                      : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  {pri}
                </button>
              );
            })}
          </div>
        </div>

        {/* Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 overflow-x-auto pb-6 items-start">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                topics={byColumn[col.id] ?? []}
                onExpand={setExpandedTopic}
                onAddClick={() => setAddOpen(true)}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {activeTopic ? (
              <div className="w-72">
                <CardContent topic={activeTopic} overlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Expanded topic modal */}
      {expandedTopic && (
        <TopicModal
          topic={expandedTopic}
          onClose={() => setExpandedTopic(null)}
          onUpdate={handleUpdated}
          onDelete={handleDeleted}
        />
      )}

      {/* Add topic modal */}
      {addOpen && (
        <AddTopicModal
          onClose={() => setAddOpen(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
