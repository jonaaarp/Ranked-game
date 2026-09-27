/**
 * Configuration and default SVG emblems for all 22 Rank Divisions:
 * Bronce 1, 2, 3
 * Plata 1, 2, 3
 * Oro 1, 2, 3
 * Diamante 1, 2, 3
 * Mítico 1, 2, 3
 * Legendario 1, 2, 3
 * Maestro 1, 2, 3
 * Pro
 */

export interface DivisionItem {
  key: string;
  name: string; // e.g. "Bronce 1"
  romanName: string; // e.g. "Bronce I"
  tierName: string;
  tierId: string;
  divisionNum: number; // 1, 2, 3 (or 0 for Pro)
  color: string;
  secondaryColor: string;
}

export const ALL_DIVISIONS: DivisionItem[] = [
  { key: 'bronce_1', name: 'Bronce 1', romanName: 'Bronce I', tierName: 'Bronce', tierId: 'bronze', divisionNum: 1, color: '#92400e', secondaryColor: '#d97706' },
  { key: 'bronce_2', name: 'Bronce 2', romanName: 'Bronce II', tierName: 'Bronce', tierId: 'bronze', divisionNum: 2, color: '#92400e', secondaryColor: '#d97706' },
  { key: 'bronce_3', name: 'Bronce 3', romanName: 'Bronce III', tierName: 'Bronce', tierId: 'bronze', divisionNum: 3, color: '#92400e', secondaryColor: '#d97706' },

  { key: 'plata_1', name: 'Plata 1', romanName: 'Plata I', tierName: 'Plata', tierId: 'silver', divisionNum: 1, color: '#94a3b8', secondaryColor: '#e2e8f0' },
  { key: 'plata_2', name: 'Plata 2', romanName: 'Plata II', tierName: 'Plata', tierId: 'silver', divisionNum: 2, color: '#94a3b8', secondaryColor: '#e2e8f0' },
  { key: 'plata_3', name: 'Plata 3', romanName: 'Plata III', tierName: 'Plata', tierId: 'silver', divisionNum: 3, color: '#94a3b8', secondaryColor: '#e2e8f0' },

  { key: 'oro_1', name: 'Oro 1', romanName: 'Oro I', tierName: 'Oro', tierId: 'gold', divisionNum: 1, color: '#eab308', secondaryColor: '#fef08a' },
  { key: 'oro_2', name: 'Oro 2', romanName: 'Oro II', tierName: 'Oro', tierId: 'gold', divisionNum: 2, color: '#eab308', secondaryColor: '#fef08a' },
  { key: 'oro_3', name: 'Oro 3', romanName: 'Oro III', tierName: 'Oro', tierId: 'gold', divisionNum: 3, color: '#eab308', secondaryColor: '#fef08a' },

  { key: 'diamante_1', name: 'Diamante 1', romanName: 'Diamante I', tierName: 'Diamante', tierId: 'diamond', divisionNum: 1, color: '#38bdf8', secondaryColor: '#bae6fd' },
  { key: 'diamante_2', name: 'Diamante 2', romanName: 'Diamante II', tierName: 'Diamante', tierId: 'diamond', divisionNum: 2, color: '#38bdf8', secondaryColor: '#bae6fd' },
  { key: 'diamante_3', name: 'Diamante 3', romanName: 'Diamante III', tierName: 'Diamante', tierId: 'diamond', divisionNum: 3, color: '#38bdf8', secondaryColor: '#bae6fd' },

  { key: 'mitico_1', name: 'Mítico 1', romanName: 'Mítico I', tierName: 'Mítico', tierId: 'mythic', divisionNum: 1, color: '#7e22ce', secondaryColor: '#d8b4fe' },
  { key: 'mitico_2', name: 'Mítico 2', romanName: 'Mítico II', tierName: 'Mítico', tierId: 'mythic', divisionNum: 2, color: '#7e22ce', secondaryColor: '#d8b4fe' },
  { key: 'mitico_3', name: 'Mítico 3', romanName: 'Mítico III', tierName: 'Mítico', tierId: 'mythic', divisionNum: 3, color: '#7e22ce', secondaryColor: '#d8b4fe' },

  { key: 'legendario_1', name: 'Legendario 1', romanName: 'Legendario I', tierName: 'Legendario', tierId: 'legendary', divisionNum: 1, color: '#b91c1c', secondaryColor: '#fca5a5' },
  { key: 'legendario_2', name: 'Legendario 2', romanName: 'Legendario II', tierName: 'Legendario', tierId: 'legendary', divisionNum: 2, color: '#b91c1c', secondaryColor: '#fca5a5' },
  { key: 'legendario_3', name: 'Legendario 3', romanName: 'Legendario III', tierName: 'Legendario', tierId: 'legendary', divisionNum: 3, color: '#b91c1c', secondaryColor: '#fca5a5' },

  { key: 'maestro_1', name: 'Maestro 1', romanName: 'Maestro I', tierName: 'Maestro', tierId: 'master', divisionNum: 1, color: '#fbbf24', secondaryColor: '#fef3c7' },
  { key: 'maestro_2', name: 'Maestro 2', romanName: 'Maestro II', tierName: 'Maestro', tierId: 'master', divisionNum: 2, color: '#fbbf24', secondaryColor: '#fef3c7' },
  { key: 'maestro_3', name: 'Maestro 3', romanName: 'Maestro III', tierName: 'Maestro', tierId: 'master', divisionNum: 3, color: '#fbbf24', secondaryColor: '#fef3c7' },

  { key: 'pro', name: 'Pro', romanName: 'Pro', tierName: 'Pro', tierId: 'pro', divisionNum: 0, color: '#059669', secondaryColor: '#6ee7b7' },
];

/**
 * Generates an SVG Data URI emblem badge for a given division
 */
export function generateDefaultBadgeSvg(item: DivisionItem): string {
  const isPro = item.key === 'pro';
  const stars = isPro ? '★ PRO ★' : '★'.repeat(item.divisionNum);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad_${item.key}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${item.secondaryColor}"/>
        <stop offset="60%" stop-color="${item.color}"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <filter id="glow_${item.key}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <!-- Outer Shield Crest -->
    <path d="M 50 6 L 86 22 L 76 68 L 50 94 L 24 68 L 14 22 Z" 
          fill="url(#grad_${item.key})" 
          stroke="${item.secondaryColor}" 
          stroke-width="2.5" 
          filter="url(#glow_${item.key})" />
    
    <!-- Inner Dark Core -->
    <path d="M 50 14 L 80 27 L 71 64 L 50 86 L 29 64 L 20 27 Z" 
          fill="#090d16" 
          stroke="${item.color}" 
          stroke-width="1.8" />
    
    <!-- Tier Initial or Crown -->
    ${
      isPro
        ? `<polygon points="50,26 56,40 70,40 59,48 63,62 50,53 37,62 41,48 30,40 44,40" fill="${item.secondaryColor}" stroke="#fff" stroke-width="0.8" />`
        : `<text x="50" y="52" fill="${item.secondaryColor}" font-family="system-ui, sans-serif" font-weight="900" font-size="28" text-anchor="middle" dominant-baseline="central">${item.tierName.charAt(0)}</text>`
    }

    <!-- Stars or Roman numeral indicator -->
    <text x="50" y="74" fill="${item.secondaryColor}" font-family="system-ui, sans-serif" font-weight="800" font-size="${isPro ? '10' : '13'}" letter-spacing="1" text-anchor="middle">${stars}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getDefaultDivisionImages(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const div of ALL_DIVISIONS) {
    map[div.key] = generateDefaultBadgeSvg(div);
  }
  return map;
}

/**
 * Normalizes any rank string ("Bronce 1", "Bronce I", "Bronce", etc.) to division key
 */
export function getDivisionKey(rankName: string): string {
  if (!rankName) return 'bronce_1';
  const lower = rankName.toLowerCase().trim();

  // Direct key check
  if (ALL_DIVISIONS.some((d) => d.key === lower)) {
    return lower;
  }

  // Check Pro
  if (lower.includes('pro')) return 'pro';

  // Normalize Roman to Arabic
  const normalized = lower
    .replace(/\s+iii\b/i, ' 3')
    .replace(/\s+ii\b/i, ' 2')
    .replace(/\s+i\b/i, ' 1');

  for (const div of ALL_DIVISIONS) {
    const divNameLower = div.name.toLowerCase();
    const divRomanLower = div.romanName.toLowerCase();
    if (
      normalized === divNameLower ||
      lower === divRomanLower ||
      lower.startsWith(divNameLower) ||
      lower.startsWith(divRomanLower)
    ) {
      return div.key;
    }
  }

  // Fallback by tier name
  if (lower.includes('bronce')) return 'bronce_1';
  if (lower.includes('plata')) return 'plata_1';
  if (lower.includes('oro')) return 'oro_1';
  if (lower.includes('diamante')) return 'diamante_1';
  if (lower.includes('mitico') || lower.includes('mítico')) return 'mitico_1';
  if (lower.includes('legendario')) return 'legendario_1';
  if (lower.includes('maestro')) return 'maestro_1';

  return 'bronce_1';
}

/**
 * Returns the effective image URL for any division name or key.
 * If user configured a custom URL in Admin Panel, that URL is used.
 * Otherwise, falls back to default high-res SVG badge.
 */
export function getDivisionImageUrl(
  divisionNameOrKey: string,
  customImages: Record<string, string> = {}
): string {
  const key = getDivisionKey(divisionNameOrKey);
  const custom = customImages[key];
  if (custom && custom.trim() !== '') {
    return custom.trim();
  }
  const item = ALL_DIVISIONS.find((d) => d.key === key) || ALL_DIVISIONS[0];
  return generateDefaultBadgeSvg(item);
}
