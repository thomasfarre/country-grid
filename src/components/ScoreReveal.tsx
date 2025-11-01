"use client";

export type ScoreRevealProps = {
  results: Array<{ id: string; nickname: string; score: number }>;
};

export const ScoreReveal = ({ results }: ScoreRevealProps) => {
  const sorted = [...results].sort((a, b) => b.score - a.score);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-bold text-slate-900">Scores finaux</h2>
      <ol className="flex flex-col gap-2">
        {sorted.map((entry, index) => (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <span className="text-sm text-slate-700">
              #{index + 1} {entry.nickname}
            </span>
            <span className="text-base font-semibold text-blue-600">{entry.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};
