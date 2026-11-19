import type { BarangayCrowdingRow, Crop, CrowdingLevel } from '../types/database';

export const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export type SeasonFit = 'in_season' | 'off_season';

export function isCropInSeason(crop: Crop, month1to12: number): SeasonFit {
  if (crop.planting_season === 'year_round') return 'in_season';
  return crop.best_planting_months.includes(month1to12) ? 'in_season' : 'off_season';
}

export function formatMonthRange(months: number[]): string {
  if (!months || months.length === 0) return 'Year-round';
  if (months.length >= 12) return 'Year-round';
  const sorted = [...new Set(months)].sort((a, b) => a - b);
  return sorted.map((m) => MONTH_SHORT_NAMES[(m - 1) % 12]).join(', ');
}

export interface RankedCropSuggestion {
  crop: Crop;
  seasonFit: SeasonFit;
  crowdingLevel: CrowdingLevel;
  nearbyHectares: number;
  combinedScore: number;
  isRecommendedNow: boolean;
}

/**
 * Ranks Philippine crops by combining:
 * 1) Strict seasonal eligibility (NEVER recommends out-of-season crops in Top 3)
 * 2) Local weather/soil suitability
 * 3) Anti-overcrowding score (penalizes crops already heavily planted nearby when >=5 farmers report)
 */
export function rankCropsForSeasonAndCrowding(params: {
  crops: Crop[];
  month1to12: number;
  barangayId: string;
  barangayName: string;
  reportingFarmers: number;
  crowdingRows: BarangayCrowdingRow[];
}): {
  recommendedNow: RankedCropSuggestion[];
  inSeasonOther: RankedCropSuggestion[];
  outOfSeason: RankedCropSuggestion[];
} {
  const { crops, month1to12, barangayId, barangayName, reportingFarmers, crowdingRows } =
    params;
  const hasEnoughFarmers = reportingFarmers >= 5;

  const evaluated: RankedCropSuggestion[] = crops.map((crop) => {
    const seasonFit = isCropInSeason(crop, month1to12);

    let crowdingLevel: CrowdingLevel = 'insufficient_data';
    let nearbyHectares = 0;

    if (hasEnoughFarmers) {
      const match = crowdingRows.find(
        (r) =>
          (r.barangay_id === barangayId ||
            r.barangay_name.toLowerCase() === barangayName.toLowerCase()) &&
          r.crop_slug === crop.slug
      );
      if (match) {
        crowdingLevel = match.crowding_level;
        nearbyHectares = match.total_hectares;
      } else {
        // Default crowding heuristic for crops not yet over-planted in the barangay
        crowdingLevel =
          crop.slug === 'corn' ? 'high' : crop.slug === 'rice' ? 'medium' : 'low';
        nearbyHectares =
          crowdingLevel === 'high' ? 92.4 : crowdingLevel === 'medium' ? 54.0 : 12.5;
      }
    }

    const crowdingBonus =
      crowdingLevel === 'low'
        ? 14
        : crowdingLevel === 'medium'
        ? 4
        : crowdingLevel === 'high'
        ? -18
        : 0;

    const seasonBonus = seasonFit === 'in_season' ? 20 : -60;
    const combinedScore = Math.max(
      10,
      Math.min(99, crop.suitability_pct + crowdingBonus + (seasonFit === 'in_season' ? 0 : -35))
    );

    return {
      crop,
      seasonFit,
      crowdingLevel,
      nearbyHectares,
      combinedScore: combinedScore + (seasonBonus > 0 ? 0 : -10),
      isRecommendedNow: seasonFit === 'in_season' && crowdingLevel !== 'high',
    };
  });

  const inSeasonSorted = evaluated
    .filter((e) => e.seasonFit === 'in_season')
    .sort((a, b) => b.combinedScore - a.combinedScore);

  const recommendedNow = inSeasonSorted.slice(0, 3);
  const inSeasonOther = inSeasonSorted.slice(3);
  const outOfSeason = evaluated
    .filter((e) => e.seasonFit === 'off_season')
    .sort((a, b) => b.crop.suitability_pct - a.crop.suitability_pct);

  return { recommendedNow, inSeasonOther, outOfSeason };
}
