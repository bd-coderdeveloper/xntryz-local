export type PackageTier = 'Free' | 'Pro' | 'Premium';
export type PackageTierUpper = 'FREE' | 'PRO' | 'PREMIUM';

export interface QuotaConfig {
  post_remover: { quota: number; threads: number; delay: number };
  deep_clone: { quota: number; delay: number; albums: boolean; videos: boolean };
  group_post: { quota: number; delay: number };
  group_cleaner: { quota: number; threads: number; delay: number };
  auto_page: { quota: number; delay: number };
}

export type AllQuotas = Record<PackageTier, QuotaConfig>;

export const DEFAULT_QUOTAS: AllQuotas = {
  Free: {
    post_remover: { quota: 50, threads: 1, delay: 10 },
    deep_clone: { quota: 3, delay: 1, albums: false, videos: false },
    group_post: { quota: 5, delay: 10 },
    group_cleaner: { quota: 50, threads: 1, delay: 10 },
    auto_page: { quota: 2, delay: 180 }
  },
  Pro: {
    post_remover: { quota: 1000, threads: 30, delay: 5 },
    deep_clone: { quota: 50, delay: 1, albums: true, videos: false },
    group_post: { quota: 50, delay: 5 },
    group_cleaner: { quota: 1000, threads: 30, delay: 5 },
    auto_page: { quota: 20, delay: 120 }
  },
  Premium: {
    post_remover: { quota: 999999, threads: 70, delay: 3 },
    deep_clone: { quota: 200, delay: 1, albums: true, videos: true },
    group_post: { quota: 9999, delay: 3 },
    group_cleaner: { quota: 999999, threads: 70, delay: 3 },
    auto_page: { quota: 200, delay: 60 }
  }
};

/**
 * Normalizes 'FREE', 'PRO', 'PREMIUM' etc. to PascalCase 'Free', 'Pro', 'Premium'
 */
export function normalizePackageName(pkg: string): PackageTier {
  if (!pkg) return 'Free';
  const lower = pkg.toLowerCase();
  if (lower === 'premium') return 'Premium';
  if (lower === 'pro') return 'Pro';
  return 'Free';
}

/**
 * Validates and merges partial fetched quotas with default quotas
 * to ensure no missing keys break the application.
 */
export function mergeWithDefaultQuotas(fetchedData: any): AllQuotas {
  if (!fetchedData || typeof fetchedData !== 'object') {
    return DEFAULT_QUOTAS;
  }
  
  const merged: any = JSON.parse(JSON.stringify(DEFAULT_QUOTAS));
  
  for (const tier of ['Free', 'Pro', 'Premium'] as PackageTier[]) {
    if (fetchedData[tier]) {
      if (fetchedData[tier].post_remover) {
        merged[tier].post_remover = { ...merged[tier].post_remover, ...fetchedData[tier].post_remover };
      }
      if (fetchedData[tier].deep_clone) {
        merged[tier].deep_clone = { ...merged[tier].deep_clone, ...fetchedData[tier].deep_clone };
      }
      if (fetchedData[tier].group_post) {
        merged[tier].group_post = { ...merged[tier].group_post, ...fetchedData[tier].group_post };
      }
      if (fetchedData[tier].group_cleaner) {
        merged[tier].group_cleaner = { ...merged[tier].group_cleaner, ...fetchedData[tier].group_cleaner };
      }
      if (fetchedData[tier].auto_page) {
        merged[tier].auto_page = { ...merged[tier].auto_page, ...fetchedData[tier].auto_page };
      }
    }
  }
  
  return merged;
}

/**
 * Fetch quotas from the system API.
 */
export async function fetchSystemQuotas(): Promise<AllQuotas> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.settings && data.settings.package_quotas) {
        let parsed;
        try {
          parsed = JSON.parse(data.settings.package_quotas);
          return mergeWithDefaultQuotas(parsed);
        } catch {
          // If JSON parse fails, return defaults
          console.error("Failed to parse package_quotas from database");
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch system quotas', err);
  }
  return DEFAULT_QUOTAS;
}
