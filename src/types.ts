export type TownId = 'pine' | 'ginger' | 'factory' | 'forest' | 'summit';
export type LevelMaterial = 'base' | 'alt';
export type EnemyKind =
  | 'penguin'
  | 'snowball'
  | 'gingerbread'
  | 'gumdrop'
  | 'robot'
  | 'soldier'
  | 'wolf'
  | 'owl'
  | 'golem';

export type HazardKind =
  | 'icicle'
  | 'gear'
  | 'steam'
  | 'wind'
  | 'spikes'
  | 'sticky'
  | 'ice'
  | 'spawner'
  | 'boulder'
  | 'train'
  | 'spring'
  | 'geyser';

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
  material?: LevelMaterial;
  oneWay?: boolean;
  conveyor?: { dir: -1 | 1; speed: number };
}

export interface MovingPlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
  material?: LevelMaterial;
  axis: 'x' | 'y';
  range: number;
  speed: number;
  phase?: number;
}

export interface TimedPlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
  material?: LevelMaterial;
  period: number;
  phase?: number;
  onRatio?: number;
}

export interface CrumblingPlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
  material?: LevelMaterial;
  respawn?: number;
  delay?: number;
}

export interface HouseDef {
  x: number;
  y: number;
  variant: number;
  hasChild: boolean;
}

export interface EnemyDef {
  kind: EnemyKind;
  x: number;
  y: number;
  patrol: [number, number];
  speed?: number;
  flying?: boolean;
}

export interface PresentDef {
  x: number;
  y: number;
  secret?: string;
}

export interface CheckpointDef {
  x: number;
  y: number;
  area: number;
}

export interface HazardDef {
  kind: HazardKind;
  x: number;
  y: number;
  w?: number;
  h?: number;
  speed?: number;
  interval?: number;
  dir?: -1 | 1;
  force?: number;
  radius?: number;
  period?: number;
  phase?: number;
  minX?: number;
  maxX?: number;
}

export interface SecretDef {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DecoDef {
  key: string;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  depth?: number;
}

export interface AreaDef {
  index: number;
  name: string;
  startX: number;
}

export interface TipDef {
  x: number;
  y: number;
  key: string;
}

export interface BossDef {
  x: number;
  triggerX: number;
  gateX: number;
  arenaStart: number;
  arenaEnd: number;
}

export interface GoalDef {
  x: number;
  y: number;
}

export interface LevelData {
  id: string;
  town: TownId;
  index: number;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  groundY: number;
  timeLimit: number;
  parTime: number;
  music: string;
  spawn: { x: number; y: number };
  platforms: PlatformDef[];
  movingPlatforms: MovingPlatformDef[];
  timedPlatforms: TimedPlatformDef[];
  crumblingPlatforms: CrumblingPlatformDef[];
  houses: HouseDef[];
  enemies: EnemyDef[];
  presents: PresentDef[];
  checkpoints: CheckpointDef[];
  hazards: HazardDef[];
  secrets: SecretDef[];
  decorations: DecoDef[];
  areas: AreaDef[];
  tips: TipDef[];
  boss?: BossDef;
  goal: GoalDef;
}

export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestScore: number;
  bestTime: number;
  giftsDelivered: number;
  giftsTotal: number;
  secretsFound: number;
  secretsTotal: number;
  deaths: number;
  damageTaken: number;
}

export interface ProfileStats {
  presentsCollected: number;
  enemiesStomped: number;
  giftsDelivered: number;
  secretsFound: number;
  deaths: number;
  damageTaken: number;
  levelsCompleted: number;
  starsEarned: number;
}

export interface Profile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  progress: Record<string, LevelProgress>;
  achievements: string[];
  stats: ProfileStats;
}

export type Language = 'en' | 'es' | 'de' | 'bg';

export interface Settings {
  music: number;
  sfx: number;
  vibration: boolean;
  controlScale: number;
  controlOpacity: number;
  colorblind: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  language: Language;
  filmGrain: boolean;
}

export interface SaveData {
  version: number;
  settings: Settings;
  activeProfileId: string;
  profiles: Profile[];
}

export interface LevelResult {
  levelId: string;
  score: number;
  time: number;
  stars: number;
  presents: number;
  giftsDelivered: number;
  giftsTotal: number;
  secretsFound: number;
  secretsTotal: number;
  deaths: number;
  damageTaken: number;
  enemiesStomped: number;
  presentsCollected: number;
  underPar: boolean;
  bossDefeated: boolean;
}

export interface HudState {
  hearts: number;
  presents: number;
  spirit: number;
  spiritActive: boolean;
  giftsDelivered: number;
  giftsTotal: number;
  secretsFound: number;
  secretsTotal: number;
  time: number;
  bossActive: boolean;
  bossHealth: number;
}
