"use client";

import { useMemo, useState } from "react";
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

export default function PlayPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room") ?? "quick";
  const queryNickname = searchParams.get("nickname");
  const [nickname] = useState(() => computeNickname(queryNickname));
  const effectiveNickname = nickname.trim() || "Invité";

  const { state, results, error, place, pass, hostId, isHost, clientId } = useRoom(
    roomId,
    effectiveNickname
  );

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

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900/60 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Salle {roomId}</h1>
          <p className="text-sm text-slate-400">
            Host actuel : {hostId ? (hostId === clientId ? "toi" : hostId.slice(0, 6)) : "—"}
            {isHost ? " (autorité)" : ""}
          </p>
        </div>
        <Timer phase={state?.phase ?? "lobby"} timeLeft={countdown} />
      </header>

      {error ? (
        <div className="rounded-lg border border-red-500 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-4">
          <CurrentCountry
            country={state?.currentCountry ?? null}
            onPass={pass}
            disabled={!canInteract}
          />
          {state ? (
            <GameBoard
              board={state.board}
              rules={rules}
              players={state.players}
              disabled={!canInteract}
              showReveal={revealScores}
              onSelect={(slot) => {
                if (canInteract) {
                  void place(slot);
                }
              }}
            />
          ) : (
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-6 text-center text-slate-400">
              Connexion à la salle…
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <PlayerList players={state?.players ?? []} selfId={clientId} showScores={revealScores} />
          {state?.phase === "lobby" ? (
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
              En attente de joueurs… La partie démarre automatiquement quand tout le monde est prêt.
            </div>
          ) : null}
          {!revealScores && state?.phase === "playing" ? (
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
              Place chaque pays dans la bonne case. Ton score final sera dévoilé quand la grille est
              complète ou lorsque le temps est écoulé.
            </div>
          ) : null}
          {state?.phase === "reveal" || state?.phase === "ended" ? (
            results ? <ScoreReveal results={results} /> : null
          ) : null}
        </div>
      </div>
    </div>
  );
}
