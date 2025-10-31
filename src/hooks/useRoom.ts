"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES } from "../lib/dataset";
import {
  joinRoom,
  type ClientEnvelope,
  type PresenceMeta,
  type RoomConnection
} from "../lib/realtime/client";
import { createOrchestrator, type OrchestratorUpdate, type RoomOrchestrator } from "../lib/game/orchestrator";
import type { ClientMsg, GameState, ServerMsg } from "../lib/game/types";

const CLIENT_ID_STORAGE_KEY = "country-grid:clientId";

const generateClientId = () => {
  if (typeof window === "undefined") {
    return "server";
  }
  return crypto.randomUUID();
};

const getPersistentClientId = (): string => {
  if (typeof window === "undefined") {
    return "server";
  }
  const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const id = generateClientId();
  window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, id);
  return id;
};

const computeHostId = (presence: Record<string, PresenceMeta[]>): string | null => {
  const entries = Object.values(presence).flat();
  if (entries.length === 0) {
    return null;
  }
  const sorted = entries.sort((a, b) => {
    if (a.joinedAt === b.joinedAt) {
      return a.clientId.localeCompare(b.clientId);
    }
    return a.joinedAt - b.joinedAt;
  });
  return sorted[0]?.clientId ?? null;
};

const createSeed = (roomId: string) => `${roomId}-${Date.now()}`;

export type RoomHookState = {
  state: GameState | null;
  results: Array<{ id: string; nickname: string; score: number }> | null;
  error: string | null;
  isHost: boolean;
  hostId: string | null;
  place: (slotIndex: number) => Promise<void>;
  pass: () => Promise<void>;
  clientId: string;
};

export const useRoom = (roomId: string, nickname: string): RoomHookState => {
  const clientId = useMemo(() => getPersistentClientId(), []);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [results, setResults] = useState<Array<{ id: string; nickname: string; score: number }> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [presenceState, setPresenceState] = useState<Record<string, PresenceMeta[]>>({});
  const connectionRef = useRef<RoomConnection | null>(null);
  const orchestratorRef = useRef<RoomOrchestrator | null>(null);
  const pendingMessagesRef = useRef<ClientEnvelope[]>([]);
  const seedRef = useRef<string | null>(null);
  const isHostRef = useRef(false);

  const hostId = useMemo(() => computeHostId(presenceState), [presenceState]);
  const isHost = hostId !== null && hostId === clientId;
  isHostRef.current = isHost;

  const ensureOrchestrator = useCallback(() => {
    if (!isHostRef.current) {
      return null;
    }
    if (!orchestratorRef.current) {
      const seed = seedRef.current ?? gameState?.seed ?? createSeed(roomId);
      seedRef.current = seed;
      orchestratorRef.current = createOrchestrator({
        roomId,
        seed,
        countries: COUNTRIES,
        initialState: gameState ?? undefined
      });
    }
    return orchestratorRef.current;
  }, [gameState, roomId]);

  const sendServerMessage = useCallback(
    async (message: ServerMsg) => {
      const connection = connectionRef.current;
      if (!connection) return;
      await connection.sendServerMessage(message);
    },
    []
  );

  const processUpdate = useCallback(
    async (update: OrchestratorUpdate | undefined) => {
      if (!update) return;
      if (update.error) {
        await sendServerMessage({ t: "ERROR", code: update.error.code, m: update.error.message });
      }
      if (update.state) {
        setGameState(update.state);
        seedRef.current = update.state.seed;
        await sendServerMessage({ t: "STATE", s: update.state });
      }
      if (update.results) {
        setResults(update.results);
        await sendServerMessage({ t: "RESULTS", scores: update.results });
      }
    },
    [sendServerMessage]
  );

  const handleServerMessage = useCallback((message: ServerMsg) => {
    switch (message.t) {
      case "STATE":
        setGameState(message.s);
        seedRef.current = message.s.seed;
        if (message.s.phase === "lobby") {
          setResults(null);
        }
        break;
      case "RESULTS":
        setResults(message.scores);
        break;
      case "ERROR":
        setError(message.m ?? message.code);
        break;
      default:
        break;
    }
  }, []);

  const handleClientMessage = useCallback(
    (envelope: ClientEnvelope) => {
      if (!isHostRef.current) {
        pendingMessagesRef.current.push(envelope);
        return;
      }
      if (envelope.clientId === clientId) {
        return;
      }
      const orchestrator = ensureOrchestrator();
      if (!orchestrator) {
        pendingMessagesRef.current.push(envelope);
        return;
      }
      const update = orchestrator.applyMessage(envelope.message, envelope.clientId);
      void processUpdate(update);
    },
    [clientId, ensureOrchestrator, processUpdate]
  );

  const handlePresenceChange = useCallback((state: Record<string, PresenceMeta[]>) => {
    setPresenceState(state);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let activeConnection: RoomConnection | null = null;

    const connect = async () => {
      try {
        const connection = await joinRoom({
          roomId,
          clientId,
          nickname,
          onServerMessage: handleServerMessage,
          onClientMessage: handleClientMessage,
          onPresenceChange: handlePresenceChange
        });
        if (cancelled) {
          await connection.leave();
          return;
        }
        connectionRef.current = connection;
        activeConnection = connection;
        await connection.sendClientMessage({ t: "JOIN", nickname });
      } catch (err) {
        console.error("Failed to join room", err);
        setError("Impossible de rejoindre la salle");
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (activeConnection) {
        connectionRef.current = null;
        void activeConnection.leave();
      }
      orchestratorRef.current?.markDisconnected?.(clientId);
      orchestratorRef.current = null;
    };
  }, [clientId, handleClientMessage, handlePresenceChange, handleServerMessage, nickname, roomId]);

  useEffect(() => {
    if (!isHost) {
      return;
    }
    const orchestrator = ensureOrchestrator();
    if (!orchestrator) {
      return;
    }
    const interval = setInterval(() => {
      const update = orchestrator.tick(1);
      void processUpdate(update);
    }, 1000);
    return () => clearInterval(interval);
  }, [ensureOrchestrator, isHost, processUpdate]);

  const hasBootstrappedHostRef = useRef(false);

  useEffect(() => {
    if (!isHost) {
      hasBootstrappedHostRef.current = false;
      orchestratorRef.current = null;
      return;
    }
    const orchestrator = ensureOrchestrator();
    if (!orchestrator) {
      return;
    }
    if (!hasBootstrappedHostRef.current) {
      hasBootstrappedHostRef.current = true;
      void processUpdate({ state: orchestrator.getState() });
    }
    if (pendingMessagesRef.current.length > 0) {
      const queued = pendingMessagesRef.current;
      pendingMessagesRef.current = [];
      queued.forEach((envelope) => {
        const update = orchestrator.applyMessage(envelope.message, envelope.clientId);
        void processUpdate(update);
      });
    }
  }, [ensureOrchestrator, isHost, processUpdate]);

  const sendClientMessage = useCallback(
    async (message: ClientMsg) => {
      const connection = connectionRef.current;
      if (!connection) {
        return;
      }
      await connection.sendClientMessage(message);
    },
    []
  );

  const place = useCallback(
    async (slotIndex: number) => {
      const country = gameState?.currentCountry;
      if (!country) {
        return;
      }
      if (isHostRef.current) {
        const orchestrator = ensureOrchestrator();
        if (!orchestrator) {
          return;
        }
        const update = orchestrator.applyMessage({ t: "PLACE", country: country.code, slot: slotIndex }, clientId);
        await processUpdate(update);
        return;
      }
      await sendClientMessage({ t: "PLACE", country: country.code, slot: slotIndex });
    },
    [clientId, ensureOrchestrator, gameState?.currentCountry, processUpdate, sendClientMessage]
  );

  const pass = useCallback(async () => {
    if (isHostRef.current) {
      const orchestrator = ensureOrchestrator();
      if (!orchestrator) {
        return;
      }
      const update = orchestrator.applyMessage({ t: "PASS" }, clientId);
      await processUpdate(update);
      return;
    }
    await sendClientMessage({ t: "PASS" });
  }, [clientId, ensureOrchestrator, processUpdate, sendClientMessage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NEXT_PUBLIC_E2E !== "true") return;
    (window as unknown as Record<string, unknown>).__countryGrid__ = {
      state: gameState,
      results
    };
  }, [gameState, results]);

  return {
    state: gameState,
    results,
    error,
    isHost,
    hostId,
    place,
    pass,
    clientId
  };
};
