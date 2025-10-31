export type Country = {
  code: string;
  name: string;
  capital: string;
  population: number;
  gdp_usd: number;
  continent: string;
  flagSvgPath: string;
};

export type Rule = {
  id: string;
  label: string;
  validate: (country: Country) => boolean;
};

export type BoardSlot = {
  index: number;
  ruleId: string;
  solvedBy?: string;
  correct?: boolean;
  countryCode?: string;
};

export type Phase = "lobby" | "countdown" | "playing" | "reveal" | "ended";

export type Player = {
  id: string;
  nickname: string;
  score: number;
  connected: boolean;
};

export type GameState = {
  roomId: string;
  seed: string;
  phase: Phase;
  timeLeft: number;
  board: BoardSlot[];
  currentCountry: Country | null;
  poolLeft: number;
  players: Player[];
};

export type ClientMsg =
  | { t: "JOIN"; nickname: string }
  | { t: "PLACE"; country: string; slot: number }
  | { t: "PASS" };

export type ServerMsg =
  | { t: "STATE"; s: GameState }
  | { t: "ERROR"; code: string; m?: string }
  | { t: "RESULTS"; scores: Array<{ id: string; nickname: string; score: number }> };

export type RoomEvent =
  | { type: "state"; state: GameState }
  | { type: "results"; scores: Array<{ id: string; nickname: string; score: number }> }
  | { type: "error"; code: string; message?: string };
