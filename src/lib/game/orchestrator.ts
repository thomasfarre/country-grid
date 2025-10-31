import { generateBoard, type GeneratedBoard } from "./rules";
import { generatePool, type GeneratedPool } from "./pool";
import type { BoardSlot, ClientMsg, GameState, Phase, Player, Rule } from "./types";
import { applyScore, type PlacementResult } from "./scoring";
import type { Country } from "./types";

const parseDuration = (envKey: string, fallback: number): number => {
  const value = process.env[envKey];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const PHASE_DURATIONS: Partial<Record<Phase, number>> = {
  countdown: parseDuration("NEXT_PUBLIC_COUNTDOWN_SECONDS", 3),
  playing: parseDuration("NEXT_PUBLIC_PLAYING_SECONDS", 90),
  reveal: parseDuration("NEXT_PUBLIC_REVEAL_SECONDS", 10)
};

type ResultsPayload = Array<{ id: string; nickname: string; score: number }>;

export type OrchestratorUpdate = {
  state?: GameState;
  error?: { code: string; message?: string };
  results?: ResultsPayload;
};

type PlayerRegistryEntry = Player & { history: PlacementResult[] };

type OrchestratorConfig = {
  roomId: string;
  seed: string;
  countries: Country[];
  board?: GeneratedBoard;
  pool?: GeneratedPool;
  initialState?: GameState;
};

export class RoomOrchestrator {
  private state: GameState;
  private readonly rules: Rule[];
  private readonly ruleMap: Map<string, Rule>;
  private readonly generatedBoard: GeneratedBoard;
  private readonly generatedPool: GeneratedPool;
  private readonly drawQueue: Country[];
  private phaseTimeRemaining = 0;
  private players = new Map<string, PlayerRegistryEntry>();
  private playerOrder: string[] = [];
  private resultsDispatched = false;
  private hostId: string | null = null;

  constructor(config: OrchestratorConfig) {
    const generatedBoard = config.board ?? generateBoard(config.seed, config.countries);
    const generatedPool = config.pool ?? generatePool(config.seed, config.countries, generatedBoard);

    this.generatedBoard = generatedBoard;
    this.generatedPool = generatedPool;
    this.rules = generatedBoard.rules;
    this.ruleMap = new Map(generatedBoard.rules.map((rule) => [rule.id, rule]));
    const initialState = config.initialState;

    if (initialState) {
      this.state = {
        ...initialState,
        board: initialState.board.map((slot) => ({ ...slot })),
        players: initialState.players.map((player) => ({ ...player }))
      };
      this.phaseTimeRemaining = initialState.timeLeft;
      this.drawQueue = this.rebuildQueueFromState(initialState);
      this.loadPlayersFromState(initialState.players);
      this.ensureHost();
    } else {
      this.drawQueue = [...generatedPool.pool];
      this.state = {
        roomId: config.roomId,
        seed: config.seed,
        phase: "lobby",
        timeLeft: 0,
        board: generatedBoard.board.map((slot) => ({ ...slot })),
        currentCountry: null,
        poolLeft: this.drawQueue.length,
        players: []
      };
    }
  }

  getState(): GameState {
    return this.state;
  }

  getRules(): Rule[] {
    return this.rules;
  }

  getValidCountries(): Country[] {
    return this.generatedPool.validCountries;
  }

  getHostId(): string | null {
    return this.hostId;
  }

  private updateState(partial: Partial<GameState>) {
    this.state = { ...this.state, ...partial };
  }

  private commitPlayers() {
    const players = this.playerOrder
      .map((id) => this.players.get(id))
      .filter((entry): entry is PlayerRegistryEntry => Boolean(entry))
      .map((entry) => ({
        id: entry.id,
        nickname: entry.nickname,
        score: entry.score,
        connected: entry.connected
      }));

    this.updateState({ players });
  }

  private ensurePlayer(playerId: string, nickname: string) {
    const trimmedNickname = nickname.trim() || "Invité";
    const sanitized = trimmedNickname.slice(0, 24);
    const existing = this.players.get(playerId);

    if (existing) {
      existing.nickname = sanitized;
      existing.connected = true;
      this.players.set(playerId, { ...existing, nickname: sanitized, connected: true });
      this.ensureHost();
      return;
    }

    const newEntry: PlayerRegistryEntry = {
      id: playerId,
      nickname: sanitized,
      score: 0,
      connected: true,
      history: []
    };
    this.players.set(playerId, newEntry);
    this.playerOrder.push(playerId);
    this.ensureHost();
  }

  private connectedPlayersCount(): number {
    let count = 0;
    this.players.forEach((entry) => {
      if (entry.connected) {
        count += 1;
      }
    });
    return count;
  }

  private ensureHost() {
    if (this.hostId && this.players.get(this.hostId)?.connected) {
      return;
    }
    const nextHost = this.playerOrder.find((id) => this.players.get(id)?.connected) ?? null;
    this.hostId = nextHost;
  }

  private loadPlayersFromState(players: Player[]) {
    this.players.clear();
    this.playerOrder = [];
    players.forEach((player) => {
      this.players.set(player.id, { ...player, history: [] });
      this.playerOrder.push(player.id);
    });
  }

  private rebuildQueueFromState(state: GameState): Country[] {
    const total = this.generatedPool.pool.length;
    const startIndex = Math.max(0, total - state.poolLeft);
    return this.generatedPool.pool.slice(startIndex);
  }

  private drawNextCountry() {
    const next = this.drawQueue.shift() ?? null;
    this.updateState({
      currentCountry: next,
      poolLeft: this.drawQueue.length
    });
  }

  private isBoardComplete(): boolean {
    return this.state.board.every((slot) => slot.solvedBy);
  }

  private setBoardSlot(slotIndex: number, solvedBy?: string, countryCode?: string) {
    const board: BoardSlot[] = this.state.board.map((slot, index) =>
      index === slotIndex ? { ...slot, solvedBy, countryCode, correct: undefined } : slot
    );
    this.updateState({ board });
  }

  private annotateBoardResults() {
    const board: BoardSlot[] = this.state.board.map((slot) => {
      if (!slot.solvedBy || !slot.countryCode) {
        return slot;
      }
      const rule = this.ruleMap.get(slot.ruleId);
      if (!rule) {
        return slot;
      }
      const country = this.generatedPool.pool.find((c) => c.code === slot.countryCode);
      if (!country) {
        return slot;
      }
      return { ...slot, correct: rule.validate(country) };
    });
    this.updateState({ board });
  }

  private setPhase(phase: Phase) {
    this.updateState({ phase });
    if (phase === "lobby" || phase === "ended") {
      this.phaseTimeRemaining = 0;
      this.updateState({ timeLeft: 0 });
      return;
    }

    const duration = PHASE_DURATIONS[phase];
    if (!duration) {
      this.phaseTimeRemaining = 0;
      this.updateState({ timeLeft: 0 });
      return;
    }

    this.phaseTimeRemaining = duration;
    this.updateState({ timeLeft: Math.ceil(duration) });
  }

  private computeResults(): ResultsPayload {
    return this.state.players
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((player) => ({ id: player.id, nickname: player.nickname, score: player.score }));
  }

  private enterCountdown(): OrchestratorUpdate {
    this.setPhase("countdown");
    return { state: this.state };
  }

  private enterPlaying(): OrchestratorUpdate {
    this.setPhase("playing");
    if (!this.state.currentCountry) {
      this.drawNextCountry();
    }
    return { state: this.state };
  }

  private enterReveal(): OrchestratorUpdate {
    if (this.state.phase === "reveal" || this.resultsDispatched) {
      return {};
    }
    this.setPhase("reveal");
    this.updateState({ currentCountry: null });
    this.annotateBoardResults();
    this.resultsDispatched = false;
    const results = this.computeResults();
    return { state: this.state, results };
  }

  private enterEnded(): OrchestratorUpdate {
    this.setPhase("ended");
    this.updateState({ currentCountry: null, timeLeft: 0 });
    this.drawQueue.splice(0, this.drawQueue.length);
    this.annotateBoardResults();
    return { state: this.state };
  }

  private maybeStartCountdown(): OrchestratorUpdate {
    if (this.state.phase !== "lobby") {
      return {};
    }
    if (this.connectedPlayersCount() < 1) {
      return {};
    }
    return this.enterCountdown();
  }

  applyMessage(message: ClientMsg, playerId: string): OrchestratorUpdate {
    switch (message.t) {
      case "JOIN": {
        this.ensurePlayer(playerId, message.nickname);
        this.commitPlayers();
        const startUpdate = this.maybeStartCountdown();
        return { state: this.state, ...startUpdate };
      }
      case "PLACE": {
        return this.handlePlace(playerId, message.country, message.slot);
      }
      case "PASS": {
        return this.handlePass(playerId);
      }
      default:
        return { error: { code: "UNSUPPORTED", message: "Unsupported message type" } };
    }
  }

  private assertPlayer(playerId: string): PlayerRegistryEntry | null {
    const entry = this.players.get(playerId);
    if (!entry) {
      return null;
    }
    if (!entry.connected) {
      entry.connected = true;
      this.players.set(playerId, { ...entry, connected: true });
      this.commitPlayers();
      this.ensureHost();
    }
    return entry;
  }

  private handlePlace(playerId: string, countryCode: string, slotIndex: number): OrchestratorUpdate {
    if (this.state.phase !== "playing") {
      return { error: { code: "NOT_PLAYING", message: "La partie n'est pas en cours" } };
    }

    const player = this.assertPlayer(playerId);
    if (!player) {
      return { error: { code: "UNKNOWN_PLAYER", message: "Joueur inconnu" } };
    }

    const slot = this.state.board[slotIndex];
    if (!slot) {
      return { error: { code: "INVALID_SLOT", message: "Case invalide" } };
    }
    if (slot.solvedBy) {
      return { error: { code: "ALREADY_SOLVED", message: "Case déjà résolue" } };
    }

    const current = this.state.currentCountry;
    if (!current) {
      return { error: { code: "NO_COUNTRY", message: "Aucun pays à placer" } };
    }

    if (current.code !== countryCode) {
      return { error: { code: "STALE_COUNTRY", message: "Le pays actif a changé" } };
    }

    const rule = this.ruleMap.get(slot.ruleId);
    if (!rule) {
      return { error: { code: "UNKNOWN_RULE", message: "Règle introuvable" } };
    }

    const isValid = rule.validate(current);
    const result: PlacementResult = isValid ? "correct" : "incorrect";
    const updatedEntry: PlayerRegistryEntry = {
      ...player,
      score: applyScore(player.score, result),
      history: [...player.history, result]
    };
    this.players.set(playerId, updatedEntry);
    this.commitPlayers();

    this.setBoardSlot(slotIndex, playerId, current.code);

    this.drawNextCountry();

    if (this.isBoardComplete() || (!this.state.currentCountry && this.drawQueue.length === 0)) {
      const update = this.enterReveal();
      return { state: this.state, ...update };
    }

    return { state: this.state };
  }

  private handlePass(playerId: string): OrchestratorUpdate {
    if (this.state.phase !== "playing") {
      return { error: { code: "NOT_PLAYING", message: "La partie n'est pas en cours" } };
    }

    const player = this.assertPlayer(playerId);
    if (!player) {
      return { error: { code: "UNKNOWN_PLAYER", message: "Joueur inconnu" } };
    }

    const updatedEntry: PlayerRegistryEntry = {
      ...player,
      history: [...player.history, "pass"]
    };
    this.players.set(playerId, updatedEntry);
    this.commitPlayers();

    this.drawNextCountry();
    if (!this.state.currentCountry && this.drawQueue.length === 0) {
      const update = this.enterReveal();
      return { state: this.state, ...update };
    }

    return { state: this.state };
  }

  tick(deltaSeconds: number): OrchestratorUpdate {
    if (!["countdown", "playing", "reveal"].includes(this.state.phase)) {
      return {};
    }

    this.phaseTimeRemaining = Math.max(0, this.phaseTimeRemaining - deltaSeconds);
    this.updateState({ timeLeft: Math.max(0, Math.ceil(this.phaseTimeRemaining)) });

    if (this.state.phase === "countdown" && this.phaseTimeRemaining <= 0) {
      return this.enterPlaying();
    }

    if (this.state.phase === "playing" && this.phaseTimeRemaining <= 0) {
      return this.enterReveal();
    }

    if (this.state.phase === "reveal" && this.phaseTimeRemaining <= 0) {
      this.resultsDispatched = true;
      return this.enterEnded();
    }

    return { state: this.state };
  }

  markDisconnected(playerId: string) {
    const entry = this.players.get(playerId);
    if (!entry) {
      return;
    }
    this.players.set(playerId, { ...entry, connected: false });
    this.commitPlayers();
    this.ensureHost();
  }
}

export const createOrchestrator = (config: OrchestratorConfig): RoomOrchestrator =>
  new RoomOrchestrator(config);
