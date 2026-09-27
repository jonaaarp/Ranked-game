import { RankTier, BonusCategory, Player, BotPersonality, RankDivisionInfo } from '../types/ranked';

/**
 * Official Ranks configuration based on user rules:
 * Bronce (color marrón) 0-399 de Elo → Bronce I, Bronce II y Bronce III
 * Plata (color plata) 400-799 de Elo → Plata I, Plata II y Plata III
 * Oro (color oro) 800-1999 de Elo → Oro I, Oro II y Oro III
 * Diamante (color diamante) 2000-3999 de Elo → Diamante I, Diamante II y Diamante III
 * Mítico (color morado oscuro) 4000-7999 de Elo → Mítico I, Mítico II y Mítico III
 * Legendario (color rojo oscuro brillante) 8000-13999 de Elo → Legendario I, Legendario II y Legendario III
 * Maestro (color dorado brillante) 14000-20000 de Elo → Maestro I, Maestro II y Maestro III
 * Pro (color verde oscuro brillante) 20000+ de Elo → Pro, sin I, II ni III.
 */
export const DEFAULT_RANKS: RankTier[] = [
  {
    id: 'bronze',
    name: 'Bronce',
    color: '#92400e', // marrón
    badgeBg: 'from-amber-950 via-amber-900 to-amber-800',
    textColor: 'text-amber-600',
    minElo: 0,
    maxElo: 399,
    winElo: 60,
    lossElo: 25,
    description: '0 - 399 Elo → Bronce I, Bronce II y Bronce III.',
    hasDivisions: true,
  },
  {
    id: 'silver',
    name: 'Plata',
    color: '#cbd5e1', // color plata
    badgeBg: 'from-slate-700 via-slate-500 to-slate-300',
    textColor: 'text-slate-300',
    minElo: 400,
    maxElo: 799,
    winElo: 60,
    lossElo: 30,
    description: '400 - 799 Elo → Plata I, Plata II y Plata III.',
    hasDivisions: true,
  },
  {
    id: 'gold',
    name: 'Oro',
    color: '#eab308', // color oro
    badgeBg: 'from-yellow-700 via-amber-500 to-yellow-400',
    textColor: 'text-yellow-400',
    minElo: 800,
    maxElo: 1999,
    winElo: 55,
    lossElo: 35,
    description: '800 - 1999 Elo → Oro I, Oro II y Oro III.',
    hasDivisions: true,
  },
  {
    id: 'diamond',
    name: 'Diamante',
    color: '#38bdf8', // color diamante
    badgeBg: 'from-cyan-900 via-cyan-600 to-sky-400',
    textColor: 'text-cyan-400',
    minElo: 2000,
    maxElo: 3999,
    winElo: 50,
    lossElo: 40,
    description: '2000 - 3999 Elo → Diamante I, Diamante II y Diamante III.',
    hasDivisions: true,
  },
  {
    id: 'mythic',
    name: 'Mítico',
    color: '#7e22ce', // morado oscuro
    badgeBg: 'from-purple-950 via-purple-900 to-indigo-800',
    textColor: 'text-purple-400',
    minElo: 4000,
    maxElo: 7999,
    winElo: 40,
    lossElo: 40,
    description: '4000 - 7999 Elo → Mítico I, Mítico II y Mítico III.',
    hasDivisions: true,
  },
  {
    id: 'legendary',
    name: 'Legendario',
    color: '#b91c1c', // rojo oscuro brillante
    badgeBg: 'from-red-950 via-rose-950 to-red-800',
    textColor: 'text-red-500',
    minElo: 8000,
    maxElo: 13999,
    winElo: 35,
    lossElo: 45,
    description: '8000 - 13999 Elo → Legendario I, Legendario II y Legendario III.',
    hasDivisions: true,
  },
  {
    id: 'master',
    name: 'Maestro',
    color: '#fbbf24', // dorado brillante
    badgeBg: 'from-amber-600 via-yellow-400 to-amber-200',
    textColor: 'text-yellow-300',
    minElo: 14000,
    maxElo: 20000,
    winElo: 30,
    lossElo: 50,
    description: '14000 - 20000 Elo → Maestro I, Maestro II y Maestro III.',
    hasDivisions: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    color: '#059669', // verde oscuro brillante
    badgeBg: 'from-emerald-950 via-emerald-800 to-emerald-500',
    textColor: 'text-emerald-400',
    minElo: 20001,
    maxElo: 999999,
    winElo: 25,
    lossElo: 55,
    description: '20000+ Elo → Pro, sin I, II ni III.',
    hasDivisions: false,
  },
];

export const DEFAULT_CATEGORIES: BonusCategory[] = [
  {
    id: 'capitan',
    name: 'Capitán Táctico',
    bonusPercent: 15,
    description: 'Aumenta un +15% el cálculo de elo en equipo.',
    color: '#f59e0b',
  },
  {
    id: 'duelista',
    name: 'Duelista Agresivo',
    bonusPercent: 10,
    description: 'Aumenta un +10% el elo efectivo en enfrentamientos de equipo.',
    color: '#ef4444',
  },
  {
    id: 'estratega',
    name: 'Estratega Clutch',
    bonusPercent: 12,
    description: 'Otorga un +12% de bonus en momentos decisivos del 3v3.',
    color: '#8b5cf6',
  },
  {
    id: 'defensa',
    name: 'Defensa Blindada',
    bonusPercent: 8,
    description: 'Soporte con +8% de bonus de resistencia de equipo.',
    color: '#06b6d4',
  },
];

const BOT_NAMES = [
  'Viper', 'ShadowX', 'Kaelen', 'Valkyrie', 'IronClad', 'Phoenix', 'Blaze', 'Nova',
  'Ghost', 'Ronin', 'Cypher', 'Specter', 'Titan', 'Apex', 'Storm', 'Zenith',
  'Ragnar', 'Kraken', 'Echo', 'Frost', 'Reaper', 'Aero', 'Blade', 'Pulse',
  'Matrix', 'Strike', 'Drift', 'Hydra', 'Zero', 'Nemesis', 'Glitch', 'Blitz',
  'Rogue', 'Venom', 'Nexus', 'Volt', 'Onyx', 'Chaos', 'Raptor', 'Havoc',
  'Chronos', 'Slayer', 'Phantom', 'Dusk', 'Eclipse', 'Siren', 'Bullet', 'Cobra',
  'Spartan', 'Vortex', 'Surge', 'Rift', 'Fury', 'Grizzly', 'Talon', 'Comet',
  'Jaguar', 'Falcon', 'Laser', 'Omega', 'Alpha', 'Scorpion', 'Vector', 'Pixel',
  'Cosmo', 'Quake', 'Static', 'Blizzard', 'Fang', 'Abyss', 'Sol', 'Lunar',
  'Thunder', 'Breeze', 'Ignite', 'Ranger', 'Striker', 'Wraith', 'Inferno', 'Nebula',
  'Cyber', 'Tornado', 'Zen', 'Karma', 'Dynamo', 'Pyro', 'Atomic', 'ApexPred',
  'Vandal', 'Tempest', 'Horizon', 'Shade', 'Warlock', 'Overlord', 'CyberPunk', 'Shinobi',
  'Rune', 'Mirage', 'ApexTwin', 'Recon'
];

const PERSONALITIES: BotPersonality[] = ['sociable', 'elite', 'rechazador', 'solitario'];

/**
 * Builds the complete list of divisions from Bronce I up to Pro.
 * Each rank with hasDivisions=true gets divided into 3 equal parts:
 * Part 1: I, Part 2: II, Part 3: III.
 */
export function getAllDivisions(ranks: RankTier[] = DEFAULT_RANKS): RankDivisionInfo[] {
  const sortedTiers = [...ranks].sort((a, b) => a.minElo - b.minElo);
  const result: RankDivisionInfo[] = [];
  let globalIndex = 0;

  for (const tier of sortedTiers) {
    if (tier.hasDivisions === false || tier.id === 'pro') {
      result.push({
        tierId: tier.id,
        tierName: tier.name,
        division: '',
        fullName: tier.name,
        color: tier.color,
        minElo: tier.minElo,
        maxElo: tier.maxElo,
        winElo: tier.winElo,
        lossElo: tier.lossElo,
        divisionGlobalIndex: globalIndex++,
        divisionKey: 'pro',
      });
    } else {
      const totalSpan = tier.maxElo - tier.minElo + 1;
      const part1 = Math.floor(totalSpan / 3);
      const part2 = Math.floor(totalSpan / 3);
      
      const div1Min = tier.minElo;
      const div1Max = tier.minElo + part1 - 1;

      const div2Min = div1Max + 1;
      const div2Max = div2Min + part2 - 1;

      const div3Min = div2Max + 1;
      const div3Max = tier.maxElo;

      const keyPrefix = tier.id === 'mythic' ? 'mitico' : tier.id === 'legendary' ? 'legendario' : tier.id === 'master' ? 'maestro' : tier.id === 'bronze' ? 'bronce' : tier.id === 'silver' ? 'plata' : tier.id === 'gold' ? 'oro' : tier.id === 'diamond' ? 'diamante' : tier.id.toLowerCase();

      result.push({
        tierId: tier.id,
        tierName: tier.name,
        division: 'I',
        fullName: `${tier.name} I`,
        color: tier.color,
        minElo: div1Min,
        maxElo: div1Max,
        winElo: tier.winElo,
        lossElo: tier.lossElo,
        divisionGlobalIndex: globalIndex++,
        divisionKey: `${keyPrefix}_1`,
      });

      result.push({
        tierId: tier.id,
        tierName: tier.name,
        division: 'II',
        fullName: `${tier.name} II`,
        color: tier.color,
        minElo: div2Min,
        maxElo: div2Max,
        winElo: tier.winElo,
        lossElo: tier.lossElo,
        divisionGlobalIndex: globalIndex++,
        divisionKey: `${keyPrefix}_2`,
      });

      result.push({
        tierId: tier.id,
        tierName: tier.name,
        division: 'III',
        fullName: `${tier.name} III`,
        color: tier.color,
        minElo: div3Min,
        maxElo: div3Max,
        winElo: tier.winElo,
        lossElo: tier.lossElo,
        divisionGlobalIndex: globalIndex++,
        divisionKey: `${keyPrefix}_3`,
      });
    }
  }

  return result;
}

/**
 * Returns the global division index of any division name (e.g. "Bronce I", "Bronce 1", "Oro II")
 */
export function getDivisionGlobalIndex(rankName: string, ranks: RankTier[] = DEFAULT_RANKS): number {
  if (!rankName) return 0;
  const allDivs = getAllDivisions(ranks);
  const target = rankName.toLowerCase().trim();
  const targetNormalized = target
    .replace(/\s+iii\b/i, ' 3')
    .replace(/\s+ii\b/i, ' 2')
    .replace(/\s+i\b/i, ' 1');

  const found = allDivs.find((d) => {
    const fn = d.fullName.toLowerCase();
    const fnArabic = d.fullName.replace(' III', ' 3').replace(' II', ' 2').replace(' I', ' 1').toLowerCase();
    return fn === target || fnArabic === target || fnArabic === targetNormalized || fn === targetNormalized;
  });
  return found ? found.divisionGlobalIndex : 0;
}

/**
 * Synchronizes a player's record rank and record Elo:
 * "El rango record debe de acompañar al rango actual si es que el rango actual es mayor que el rango record."
 */
export function syncPlayerRecordRank(player: Player, ranks: RankTier[] = DEFAULT_RANKS): Player {
  const currentDiv = getDivisionForElo(player.elo, ranks);
  const currentDivIndex = currentDiv.divisionGlobalIndex;
  const recordDivIndex = getDivisionGlobalIndex(player.recordRank, ranks);

  // If current division is higher than record rank, OR current Elo is higher than record Elo:
  // The record rank MUST accompany the current rank!
  if (currentDivIndex > recordDivIndex || player.elo > player.recordElo) {
    return {
      ...player,
      currentRank: currentDiv.fullName,
      recordRank: currentDiv.fullName,
      recordElo: Math.max(player.recordElo, player.elo),
      teamRecordRank: currentDivIndex > getDivisionGlobalIndex(player.teamRecordRank, ranks) ? currentDiv.fullName : player.teamRecordRank,
    };
  }

  return {
    ...player,
    currentRank: currentDiv.fullName,
  };
}

/**
 * Returns the exact division info for a given Elo.
 */
export function getDivisionForElo(elo: number, ranks: RankTier[] = DEFAULT_RANKS): RankDivisionInfo {
  const divisions = getAllDivisions(ranks);
  let current = divisions[0];

  for (const div of divisions) {
    if (elo >= div.minElo) {
      current = div;
    }
  }

  return current;
}

/**
 * Returns parent tier of given Elo.
 */
export function getRankForElo(elo: number, ranks: RankTier[] = DEFAULT_RANKS): RankTier {
  const sorted = [...ranks].sort((a, b) => a.minElo - b.minElo);
  let currentRank = sorted[0];
  for (const rank of sorted) {
    if (elo >= rank.minElo) {
      currentRank = rank;
    }
  }
  return currentRank;
}

/**
 * Returns next division or rank progress
 */
export function getNextDivision(currentElo: number, ranks: RankTier[] = DEFAULT_RANKS): { nextDiv: RankDivisionInfo | null; progress: number } {
  const divisions = getAllDivisions(ranks);
  const current = getDivisionForElo(currentElo, ranks);
  const currentIndex = divisions.findIndex(d => d.divisionGlobalIndex === current.divisionGlobalIndex);

  if (currentIndex === divisions.length - 1) {
    return { nextDiv: null, progress: 100 };
  }

  const next = divisions[currentIndex + 1];
  const range = next.minElo - current.minElo;
  const progress = range > 0
    ? Math.min(100, Math.max(0, Math.round(((currentElo - current.minElo) / range) * 100)))
    : 100;

  return { nextDiv: next, progress };
}

/**
 * Resets a player down by 2 full ranks (6 divisions).
 * Example: Legendario II -> Diamante II (6 divisions down).
 * If drops below index 0, clamp to Bronce I (Elo 0).
 * Sets the new Elo to the middle/start of the target division according to admin rules.
 */
export function calculateResetRank(player: Player, ranks: RankTier[] = DEFAULT_RANKS): { newElo: number; newDivision: RankDivisionInfo } {
  const divisions = getAllDivisions(ranks);
  const currentDiv = getDivisionForElo(player.elo, ranks);
  const currentIdx = currentDiv.divisionGlobalIndex;

  // Drops 2 full ranks = 6 divisions
  const targetIdx = Math.max(0, currentIdx - 6);
  const targetDiv = divisions[targetIdx] || divisions[0];

  // Set new Elo to the start of the target division (or proportional position)
  const newElo = targetDiv.minElo;

  return {
    newElo,
    newDivision: targetDiv,
  };
}

export function generate100Bots(): Player[] {
  const bots: Player[] = [];
  const initialRank = 'Bronce I';

  for (let i = 0; i < 100; i++) {
    const name = BOT_NAMES[i] || `Bot_${i + 1}`;
    const personality = PERSONALITIES[i % PERSONALITIES.length];

    const categoryIds: string[] = [];
    if (i % 5 === 0) {
      categoryIds.push(DEFAULT_CATEGORIES[i % DEFAULT_CATEGORIES.length].id);
    }
    if (i % 15 === 0) {
      categoryIds.push(DEFAULT_CATEGORIES[(i + 2) % DEFAULT_CATEGORIES.length].id);
    }

    bots.push({
      id: `bot_${i + 1}`,
      name,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=0f172a`,
      isUser: false,
      elo: 0,
      recordElo: 0,
      recordRank: initialRank,
      currentRank: initialRank,
      teamRecordRank: initialRank,
      wins: 0,
      losses: 0,
      streak: 0,
      personality,
      categoryId: categoryIds[0] || undefined,
      categoryIds,
      status: 'disponible',
      heartsWithUser: 0,
      friendIds: [],
    });
  }

  // Pre-generate a few mutual friendships between bots
  for (let i = 0; i < 30; i++) {
    const b1 = bots[i];
    const b2 = bots[(i + 5) % 100];
    if (b1 && b2 && b1.id !== b2.id && b1.personality !== 'solitario' && b2.personality !== 'solitario') {
      b1.friendIds.push(b2.id);
      b2.friendIds.push(b1.id);
    }
  }

  return bots;
}

export function getPlayerCategoryIds(player: Player): string[] {
  if (player.categoryIds && Array.isArray(player.categoryIds) && player.categoryIds.length > 0) {
    return player.categoryIds;
  }
  if (player.categoryId) {
    return [player.categoryId];
  }
  return [];
}

export function calculateEffectivePower(player: Player, categories: BonusCategory[] = DEFAULT_CATEGORIES): number {
  let bonusMultiplier = 1;
  const activeCatIds = getPlayerCategoryIds(player);
  for (const catId of activeCatIds) {
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      bonusMultiplier += cat.bonusPercent / 100;
    }
  }
  const base = 100 + player.elo;
  return Math.round(base * bonusMultiplier);
}

export function calculateTeamPower(team: Player[], categories: BonusCategory[] = DEFAULT_CATEGORIES): number {
  return team.reduce((acc, player) => acc + calculateEffectivePower(player, categories), 0);
}

export function getRankTierIndex(rankName: string, ranks: RankTier[] = DEFAULT_RANKS): number {
  // Can match tier name or division prefix e.g. "Bronce II" -> "Bronce"
  const clean = rankName.split(' ')[0].toLowerCase();
  const idx = ranks.findIndex(r => r.name.toLowerCase() === clean);
  return idx !== -1 ? idx : 0;
}

export function canBotAcceptInvite(
  bot: Player,
  user: Player,
  userTopRankPosition: number,
  ranks: RankTier[] = DEFAULT_RANKS
): { accepted: boolean; reason: string } {
  if (bot.heartsWithUser >= 4) {
    return { accepted: true, reason: 'Tiene gran amistad y respeto contigo (4+ de afinidad) y acepta siempre.' };
  }

  switch (bot.personality) {
    case 'sociable':
      return { accepted: true, reason: 'Es muy sociable y siempre le gusta jugar con todos.' };

    case 'solitario':
      if (bot.heartsWithUser >= 5) {
        return { accepted: true, reason: 'A pesar de ser solitario, tu amistad máxima te convenció.' };
      }
      return { accepted: false, reason: 'Es solitario y prefiere jugar siempre por su cuenta.' };

    case 'elite': {
      const userRankIndex = getRankTierIndex(user.currentRank, ranks);
      const isTopTier = userTopRankPosition <= 20 || userRankIndex >= 3;
      if (isTopTier || bot.heartsWithUser >= 3) {
        return { accepted: true, reason: 'Acepta porque eres un jugador élite del top o tienes 3+ de amistad.' };
      }
      return { accepted: false, reason: 'El jugador de élite solo acepta gente alta en el top o con récord destacado.' };
    }

    case 'rechazador': {
      if (bot.heartsWithUser >= 3) {
        return { accepted: true, reason: 'Superaste su desconfianza gracias a tener 3+ de afinidad.' };
      }
      const randomAccept = Math.random() < 0.2;
      return {
        accepted: randomAccept,
        reason: randomAccept ? 'Hoy tiene buen humor y decidió aceptar.' : 'El rechazador no juega con todos.'
      };
    }

    default:
      return { accepted: true, reason: 'Aceptó la solicitud.' };
  }
}
