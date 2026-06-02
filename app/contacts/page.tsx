export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Users, Mail, ExternalLink, Briefcase } from "lucide-react";

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    include: { application: { select: { company: true, role: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <h1 className="font-semibold text-slate-900 dark:text-white text-sm">Contacts</h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {contacts.length}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Users className="w-7 h-7 text-slate-400 dark:text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">No contacts yet</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Add contacts from within an application&apos;s detail drawer.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="card p-4 space-y-2.5 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-900/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase">
                      {c.name.slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{c.name}</p>
                    {c.role && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.role}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  {c.application && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Briefcase className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{c.application.company} · {c.application.role}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <a href={`mailto:${c.email}`} className="truncate hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                        {c.email}
                      </a>
                    </div>
                  )}
                  {c.linkedIn && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <a href={c.linkedIn} target="_blank" rel="noopener noreferrer" className="truncate hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                        LinkedIn profile
                      </a>
                    </div>
                  )}
                </div>

                {c.notes && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                    {c.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
