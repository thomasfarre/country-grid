import { Matchmaking } from "../components/Matchmaking";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 text-center text-slate-900">
      <section className="flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Country Grid</h1>
        <p className="text-lg text-slate-600">
          Défie tes amis dans un sprint géographique multijoueur : place chaque pays sur la
          caractéristique qui le décrit, passe en équipe ou tente le tout pour le tout avant la fin
          du chrono.
        </p>
      </section>
      <Matchmaking />
    </div>
  );
}
