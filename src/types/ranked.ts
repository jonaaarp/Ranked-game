export type BotPersonality = 'sociable' | 'elite' | 'rechazador' | 'solitario';

export type PlayerStatus = 'disponible' | 'en_equipo' | 'no_disponible';

export interface RankTier {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
  textColor: string;
  minElo: number;
  maxElo: number;
  winElo: number;
  lossElo: number;
  description: string;
  hasDivisions?: boolean; // True for Bronce...Maestro (I, II, III). False for Pro.
}

export interface RankDivisionInfo {
  tierId: string;
  tierName: string;
  division: 'I' | 'II' | 'III' | '';
  fullName: string; // e.g. "Bronce II", "Pro"
  color: string;
  minElo: number;
  maxElo: number;
  winElo: number;
  lossElo: number;
  divisionGlobalIndex: number; // 0 for Bronce I, 1 for Bronce II, ... up to 21 for Pro
  divisionKey?: string;
  imageUrl?: string;
}

export interface BonusCategory {
  id: string;
  name: string;
  bonusPercent: number; // e.g. 15 for +15%
  description: string;
  color: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isUser: boolean;
  elo: number;
  recordElo: number;
  recordRank: string;
  currentRank: string;
  teamRecordRank: string;
  wins: number;
  losses: number;
  streak: number;
  personality: BotPersonality;
  categoryId?: string;
  categoryIds?: string[];
  status: PlayerStatus;
  currentTeamMembers?: string[];
  restUntil?: number;
  heartsWithUser: number; // 0 to 5
  friendIds: string[];
}

export interface MatchmakingParams {
  mode: 'solo' | 'equipo';
  userTeam: Player[];
  rivalTeam: Player[];
}

export interface MatchResult {
  winner: 'user' | 'rival';
  userTeam: Player[];
  rivalTeam: Player[];
  userEloChange: number;
  alliesEloChange: number;
  rivalsEloChange: number;
  rounds: {
    roundNumber: number;
    userScore: number;
    rivalScore: number;
    highlight: string;
  }[];
  heartsChanges: {
    playerId: string;
    playerName: string;
    change: number;
    newTotal: number;
    reason: string;
  }[];
}

export interface TournamentMatch {
  id: string;
  round: number;
  matchIndex: number;
  teamA: {
    id: string;
    name: string;
    players: Player[];
    totalPower: number;
    score?: number;
  };
  teamB: {
    id: string;
    name: string;
    players: Player[];
    totalPower: number;
    score?: number;
  };
  winnerTeamId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  size: 8 | 16;
  currentRound: number;
  totalRounds: number;
  matches: TournamentMatch[];
  isCompleted: boolean;
  championTeam?: {
    id: string;
    name: string;
    players: Player[];
  };
}
