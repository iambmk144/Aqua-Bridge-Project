// services/apiService.ts

// Primary API base URL (supports both VITE_API_BASE_URL and legacy VITE_API_BASE)
const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (import.meta.env.VITE_API_BASE as string) ||
  'http://localhost:4000';

import { MOCK_SHRIMP_PRICES } from '../constants';
import { HarvestRequest, ShrimpGrade, HarvestStatus, ShrimpPrice } from '../types';

// Local-storage keys
const DB_KEY = 'aqua_bridge_harvest_requests';
const PRICES_DB_KEY = 'aqua_bridge_market_prices';
const MARKET_STATUS_DB_KEY = 'aqua_bridge_market_status';

// ------- Local storage helpers -------

const getDb = (): HarvestRequest[] => {
  const dbString = localStorage.getItem(DB_KEY);
  return dbString ? JSON.parse(dbString) : [];
};

const saveDb = (db: HarvestRequest[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const getPricesDb = (): ShrimpPrice[] => {
  const dbString = localStorage.getItem(PRICES_DB_KEY);
  if (dbString) return JSON.parse(dbString);
  const initialPrices: ShrimpPrice[] = MOCK_SHRIMP_PRICES.map(p => ({ ...p }));
  localStorage.setItem(PRICES_DB_KEY, JSON.stringify(initialPrices));
  return initialPrices;
};

const savePricesDb = (db: ShrimpPrice[]) => {
  localStorage.setItem(PRICES_DB_KEY, JSON.stringify(db));
};

// Simulate API latency for fallback localStorage responses
const withLatency = <T>(data: T, ms = 400): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), ms));

// ------- Network helper with fallback -------

/**
 * tryFetch - attempts a network request, falls back to fallback() if provided or throws.
 * - path: endpoint path (will be joined with API_BASE)
 * - options: fetch options
 * - fallback: a function returning fallback data (sync or Promise)
 */
async function tryFetch<T>(
  path: string,
  options?: RequestInit,
  fallback?: () => Promise<T> | T
): Promise<T> {
  // If no API base configured, directly use fallback if provided
  if (!API_BASE) {
    if (fallback) return Promise.resolve(fallback());
    return Promise.reject(new Error('No API base configured and no fallback provided.'));
  }

  // Build URL: if path already absolute, use it; otherwise join with API_BASE
  const url = path.startsWith('http') ? path : `${API_BASE.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      // If backend returned error, try fallback if available
      if (fallback) return Promise.resolve(fallback());
      const text = await res.text().catch(() => '');
      throw new Error(`Request failed: ${res.status} ${res.statusText} ${text}`);
    }

    // Attempt to parse JSON; if not JSON and fallback available, use fallback
    const data = await res.json().catch(() => null);
    if (data === null && fallback) return Promise.resolve(fallback());
    return data as T;
  } catch (err) {
    // Network error — use fallback if present
    if (fallback) {
      try {
        const fb = fallback();
        return fb instanceof Promise ? await fb : fb;
      } catch (e) {
        // fallback threw — rethrow original network error
        throw err;
      }
    }
    throw err;
  }
}

// ------- Market status & prices -------

/**
 * getMarketStatus
 * Frontend expects boolean. Backend may return boolean or { success, status }.
 * Fallback uses localStorage.
 */
export const getMarketStatus = async (): Promise<boolean> => {
  return tryFetch<boolean | { success: boolean; status?: boolean }>(
    '/market-status',
    undefined,
    () => {
      const status = localStorage.getItem(MARKET_STATUS_DB_KEY);
      return withLatency(status !== null ? JSON.parse(status) : true);
    }
  ).then((r: any) => {
    if (typeof r === 'boolean') return r;
    if (r && typeof r.status === 'boolean') return r.status;
    if (r && typeof r.success === 'boolean' && 'status' in r) return Boolean(r.status);
    return Boolean(r);
  });
};

export const updateMarketStatus = async (isOpen: boolean): Promise<boolean> => {
  return tryFetch<boolean | { success: boolean; status?: boolean }>(
    '/market-status',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen }),
    },
    () => {
      localStorage.setItem(MARKET_STATUS_DB_KEY, JSON.stringify(isOpen));
      return withLatency(isOpen);
    }
  ).then((r: any) => {
    if (r && typeof r.status === 'boolean') return r.status;
    if (r && typeof r.success === 'boolean' && r.success) return isOpen;
    return Boolean(r);
  });
};

/**
 * getMarketPrices / updateMarketPrice
 * Backend shape may be an array or { success, prices }.
 * Fallback uses localStorage.
 */
export const getMarketPrices = async (): Promise<ShrimpPrice[]> => {
  return tryFetch<ShrimpPrice[] | { success: boolean; prices?: ShrimpPrice[] }>(
    '/market-prices',
    undefined,
    () => {
      return withLatency(getPricesDb());
    }
  ).then((r: any) => {
    if (Array.isArray(r)) return r;
    if (r && Array.isArray(r.prices)) return r.prices;
    return getPricesDb();
  });
};

export const updateMarketPrice = async (grade: ShrimpGrade, newPrice: number): Promise<ShrimpPrice> => {
  return tryFetch<ShrimpPrice | { success: boolean; price?: ShrimpPrice }>(
    '/market-prices',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grade, price: newPrice }),
    },
    () => {
      const db = getPricesDb();
      const idx = db.findIndex(p => p.grade === grade);
      if (idx === -1) throw new Error('Price for grade not found');
      const old = db[idx].price;
      const updated: ShrimpPrice = { ...db[idx], price: newPrice, previousPrice: old };
      db[idx] = updated;
      savePricesDb(db);
      return withLatency(updated);
    }
  ).then((r: any) => {
    if (r && r.price) return r.price;
    return r as ShrimpPrice;
  });
};

// ------- Harvest requests (user/admin) -------

export const submitHarvestRequest = async (
  requestData: Omit<HarvestRequest, 'id' | 'status' | 'timestamp'>
): Promise<HarvestRequest> => {
  return tryFetch<HarvestRequest | { success: boolean; request?: HarvestRequest }>(
    '/harvest-requests',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    },
    () => {
      const db = getDb();
      const newRequest: HarvestRequest = {
        ...requestData,
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'Pending Approval',
        timestamp: Date.now(),
      };
      db.push(newRequest);
      saveDb(db);
      return withLatency(newRequest);
    }
  ).then((r: any) => {
    if (r && r.request) return r.request;
    return r as HarvestRequest;
  });
};

export const getHarvestRequestsForUser = async (farmerId: string): Promise<HarvestRequest[]> => {
  return tryFetch<HarvestRequest[] | { success: boolean; requests?: HarvestRequest[] }>(
    `/harvest-requests?farmerId=${encodeURIComponent(farmerId)}`,
    undefined,
    () => {
      const db = getDb();
      return withLatency(db.filter(req => req.farmerId === farmerId).sort((a, b) => b.timestamp - a.timestamp));
    }
  ).then((r: any) => {
    if (Array.isArray(r)) return r;
    if (r && Array.isArray(r.requests)) return r.requests;
    return getDb().filter(req => req.farmerId === farmerId);
  });
};

export const getAllHarvestRequests = async (): Promise<HarvestRequest[]> => {
  return tryFetch<HarvestRequest[] | { success: boolean; requests?: HarvestRequest[] }>(
    '/harvest-requests',
    undefined,
    () => {
      const db = getDb();
      return withLatency(db.sort((a, b) => b.timestamp - a.timestamp));
    }
  ).then((r: any) => {
    if (Array.isArray(r)) return r;
    if (r && Array.isArray(r.requests)) return r.requests;
    return getDb().sort((a, b) => b.timestamp - a.timestamp);
  });
};

export const updateHarvestRequestStatus = async (
  requestId: string,
  newStatus: HarvestStatus
): Promise<HarvestRequest> => {
  return tryFetch<HarvestRequest | { success: boolean; request?: HarvestRequest }>(
    `/harvest-requests/${encodeURIComponent(requestId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    },
    () => {
      const db = getDb();
      const idx = db.findIndex(r => r.id === requestId);
      if (idx === -1) throw new Error('Request not found');
      const updated = { ...db[idx], status: newStatus };
      db[idx] = updated;
      saveDb(db);
      return withLatency(updated);
    }
  ).then((r: any) => {
    if (r && r.request) return r.request;
    return r as HarvestRequest;
  });
};
