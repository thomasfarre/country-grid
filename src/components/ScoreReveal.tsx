"use client";

export type ScoreRevealProps = {
  results: Array<{ id: string; nickname: string; score: number }>;
};

export const ScoreReveal = ({ results }: ScoreRevealProps) => {
  const sorted = [...results].sort((a, b) => b.score - a.score);
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6">
      <h2 className="mb-4 text-2xl font-bold text-white">Scores finaux</h2>
      <ol className="flex flex-col gap-2">
        {sorted.map((entry, index) => (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded-md bg-slate-800/60 px-3 py-2"
          >
            <span className="text-sm text-slate-300">
              #{index + 1} {entry.nickname}
            </span>
            <span className="text-base font-semibold text-accent">{entry.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};
