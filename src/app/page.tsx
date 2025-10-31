import { Matchmaking } from "../components/Matchmaking";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 text-center">
      <section className="flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Country Grid</h1>
        <p className="text-lg text-slate-300">
          Défie tes amis dans un sprint géographique multijoueur : place chaque pays sur la règle
          qui correspond, passe en équipe ou tente le tout pour le tout avant la fin du chrono.
        </p>
      </section>
      <Matchmaking />
      <section className="grid gap-4 text-left text-slate-300 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-1 text-sm font-semibold uppercase text-accent">Matchmaking éclair</h2>
          <p className="text-sm">Un clic, et tu rejoins la salle rapide partagée par tous les joueurs en ligne.</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-1 text-sm font-semibold uppercase text-accent">Grille unique</h2>
          <p className="text-sm">10 règles générées par seed garantissent des placements précis et rejouables.</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="mb-1 text-sm font-semibold uppercase text-accent">Realtime</h2>
          <p className="text-sm">Supabase Realtime synchronise les salles sans serveur dédié.</p>
        </div>
      </section>
    </div>
  );
}
