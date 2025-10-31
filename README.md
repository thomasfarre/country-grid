# Country Grid

Country Grid est un MVP jouable d'un party-game géographique multijoueur. Les joueurs rejoignent une salle commune, observent un flux de pays aléatoires et doivent les placer sur la grille de règles correspondantes avant la fin du chrono.

## Règles du jeu
- 10 règles uniques par partie (égalités, comparaisons, catégories) générées à partir d'un seed partagé.
- Un pool de 30 pays provenant d'un dataset figé (snapshot 2023, valeurs approximatives). Seuls 10 pays satisfont au moins une règle.
- +10 points pour un placement correct, −5 pour un placement incorrect, 0 pour un « Pass ».
- Phases : lobby → compte à rebours (3s) → partie (90s) → révélation des scores (10s) → fin.

## Architecture & stack
- **UI** : Next.js 14 (App Router), React 18, Tailwind CSS, composants client-first.
- **Realtime** : Supabase Realtime (channels `room:{id}`) ou fallback BroadcastChannel pour le mode de test local.
- **Logique** : `RoomOrchestrator` côté client (host logique) gère état, règles, scores et transitions de phase, et diffuse des messages `ServerMsg` à tous les clients.
- **Dataset** : `src/lib/dataset/countries.json` (32 pays, 10 « solvables », flags SVG locaux dans `public/flags`).
- **Tests** : Vitest (unitaires) et Playwright (E2E, deux navigateurs synchronisés via mock realtime).
- **Qualité** : ESLint + Prettier, Husky + lint-staged, TypeScript strict.

## Schéma d'état
```
lobby --(>=1 joueur)--> countdown (3s)
countdown --(0s)--> playing (90s)
playing --(deck vide OU timer=0)--> reveal (10s)
reveal --(0s)--> ended
```

## Protocole de messages
### Client → host (`ClientMsg`)
- `JOIN { nickname }`
- `PLACE { country: code ISO, slot: index grille }`
- `PASS`

### Host → clients (`ServerMsg`)
- `STATE { s: GameState }` : état complet (seed, board, joueurs, pays courant, timer)
- `RESULTS { scores }` : classement final
- `ERROR { code, m? }`

Le host logique est le joueur avec `joinedAt` le plus ancien (recalculé via présence). En cas de départ du host, la réélection est automatique et un nouveau host réhydrate l'orchestrateur à partir du `GameState` reçu.

## Prise en main
```bash
npm install
npm run dev
```

Ouvre ensuite http://localhost:3000 et clique sur **Jouer maintenant**.

> ℹ️ Sans variables Supabase, l'app bascule automatiquement sur un backend realtime mocké (BroadcastChannel). Pour une instance Supabase réelle, configure les variables ci-dessous.

### Scripts utiles
- `npm run dev` : dev server Next.js
- `npm run build` / `npm run start`
- `npm run lint`
- `npm run test` : tests unitaires Vitest
- `npm run test:e2e` : Playwright (utilise le mock realtime + timers raccourcis)

## Configuration environnement
Copie le modèle :
```
cp .env.local.example .env.local
```
Variables attendues :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_NAME` (facultatif)

Pour les tests/E2E, des variables additionnelles sont injectées automatiquement :
- `NEXT_PUBLIC_USE_MOCK_REALTIME=true`
- `NEXT_PUBLIC_E2E=true`
- `NEXT_PUBLIC_COUNTDOWN_SECONDS`, `NEXT_PUBLIC_PLAYING_SECONDS`, `NEXT_PUBLIC_REVEAL_SECONDS`

## Déploiement
### Vercel (Next.js)
1. Crée un projet Vercel et connecte le repo.
2. Ajoute les variables d'environnement Supabase et optionnellement `NEXT_PUBLIC_APP_NAME`.
3. Déploie (`npm run build` doit passer sans warning TS/ESLint).

### Supabase
1. Crée un projet Supabase (free tier suffisant).
2. Active Realtime sur le schéma `public`.
3. Exécute `supabase/schema.sql` pour provisionner la table `match_history` (optionnel pour MVP).
4. Récupère URL & clé anonyme et renseigne-les dans Vercel et `.env.local`.

## Dataset & flags
- Les valeurs de population/PIB sont des estimations 2023 simplifiées pour garantir une unique correspondance par règle.
- Flags SVG stockés localement dans `public/flags` (`default.svg` pour les pays non illustrés).

## Limitations connues
- Orchestrateur client-only : nécessite qu'au moins un joueur reste connecté pour conserver l'état.
- Pas d'auth ni de persistance long terme (scores uniquement en mémoire, table Supabase non exploitée).
- UX minimaliste (pas encore de feedback temps réel sur erreurs d'insertion, pas de spectateur).
- Mode mock (BroadcastChannel) destiné aux tests locaux ; production doit utiliser Supabase.

## Roadmap
1. Auth & profils persistants (Supabase Auth) + sauvegarde des scores.
2. Lobby avancé (salles privées, invite codes, matchmaking multi-room).
3. Classements globaux et historiques (`match_history`).
4. Effets sonores/feedback visuel, responsive amélioré & accessibilité.
5. Cosmetics (thèmes, avatars, animations de drapeaux). 
