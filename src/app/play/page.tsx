"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRoom } from "../../hooks/useRoom";
import { useCountdown } from "../../hooks/useCountdown";
import { Timer } from "../../components/Timer";
import { CurrentCountry } from "../../components/CurrentCountry";
import { GameBoard } from "../../components/GameBoard";
import { PlayerList } from "../../components/PlayerList";
import { ScoreReveal } from "../../components/ScoreReveal";
import { COUNTRIES } from "../../lib/dataset";
import { generateBoard } from "../../lib/game/rules";

const NICKNAME_STORAGE_KEY = "country-grid:nickname";

const getStoredNickname = () => {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(NICKNAME_STORAGE_KEY) ?? "";
};

const computeNickname = (queryNickname: string | null): string => {
  if (queryNickname) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NICKNAME_STORAGE_KEY, queryNickname);
    }
    return queryNickname;
  }
  return getStoredNickname();
};

const isActivePhase = (phase: string | undefined) =>
  phase === "countdown" || phase === "playing" || phase === "reveal";

function PlayPageInner() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room") ?? "quick";
  const queryNickname = searchParams.get("nickname");
  const [nickname] = useState(() => computeNickname(queryNickname));
  const effectiveNickname = nickname.trim() || "Invité";

  const { state, results, error, place, pass, clientId } = useRoom(roomId, effectiveNickname);

  const countdown = useCountdown(state?.timeLeft ?? 0, isActivePhase(state?.phase));

  const rules = useMemo(() => {
    if (!state?.seed) {
      return [];
    }
    try {
      const generated = generateBoard(state.seed, COUNTRIES);
      return generated.rules;
    } catch (err) {
      console.error("Failed to regenerate rules", err);
      return [];
    }
  }, [state?.seed]);

  const canInteract = state?.phase === "playing" && Boolean(state.currentCountry);
  const revealScores = state?.phase === "reveal" || state?.phase === "ended";
  const TOTAL_POOL_SIZE = 30;
  const poolLeft = state?.poolLeft ?? TOTAL_POOL_SIZE;
  const poolProgress = Math.max(0, Math.min(TOTAL_POOL_SIZE, TOTAL_POOL_SIZE - poolLeft));

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col gap-6">
      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr,200px] md:items-start">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Comment jouer</h2>
          <p className="mt-1 text-sm text-slate-600">
            Un pays apparaît à chaque tour. Clique sur la caractéristique qui lui correspond ou
            passe si aucune case ne convient. Les drapeaux sur certaines caractéristiques te servent
            d&apos;indices. Les résultats se dévoilent quand ta grille est remplie ou quand le temps
            est écoulé.
          </p>
        </div>
        <div className="flex justify-end md:justify-center">
          <div className="w-full max-w-[200px]">
            <Timer phase={state?.phase ?? "lobby"} timeLeft={countdown} />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[3fr,1fr]">
        <div className="flex flex-col gap-4">
          <CurrentCountry
            country={state?.currentCountry ?? null}
            currentIndex={poolProgress}
            total={TOTAL_POOL_SIZE}
            onPass={pass}
            disabled={!canInteract}
          />
          {state ? (
            <GameBoard
              board={state.board}
              rules={rules}
              disabled={!canInteract}
              showReveal={revealScores}
              onSelect={(slot) => {
                if (canInteract) {
                  void place(slot);
                }
              }}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-100 p-6 text-center text-slate-500">
              Connexion à la salle…
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <PlayerList players={state?.players ?? []} selfId={clientId} showScores={revealScores} />
          {state?.phase === "lobby" ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
              En attente de joueurs… La partie démarre automatiquement dès qu&apos;un joueur est
              prêt.
            </div>
          ) : null}
          {!revealScores && state?.phase === "playing" ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
              Place chaque pays dans la bonne case. Tes points restent cachés jusqu&apos;à la
              révélation finale.
            </div>
          ) : null}
          {state?.phase === "reveal" || state?.phase === "ended" ? (
            results ? (
              <ScoreReveal results={results} />
            ) : null
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="text-slate-500">Chargement…</div>}>
      <PlayPageInner />
    </Suspense>
  );
}
