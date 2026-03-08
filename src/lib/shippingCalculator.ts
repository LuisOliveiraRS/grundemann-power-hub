// Shipping calculator based on CEP region ranges
// Origin: RS (Rio Grande do Sul) - Gründemann Geradores
import { supabase } from "@/integrations/supabase/client";

export interface ShippingOption {
  service: string;
  label: string;
  price: number;
  days: string;
}

// CEP ranges mapped to regions
const getRegionFromCep = (cep: string): string | null => {
  const num = parseInt(cep.replace(/\D/g, ""));
  if (isNaN(num) || num < 1000000 || num > 99999999) return null;

  if (num >= 1000000 && num <= 9999999) return "SP_CAPITAL";
  if (num >= 11000000 && num <= 19999999) return "SP_INTERIOR";
  if (num >= 20000000 && num <= 28999999) return "RJ";
  if (num >= 29000000 && num <= 29999999) return "ES";
  if (num >= 30000000 && num <= 39999999) return "MG";
  if (num >= 40000000 && num <= 48999999) return "BA";
  if (num >= 49000000 && num <= 49999999) return "SE";
  if (num >= 50000000 && num <= 56999999) return "PE";
  if (num >= 57000000 && num <= 57999999) return "AL";
  if (num >= 58000000 && num <= 58999999) return "PB";
  if (num >= 59000000 && num <= 59999999) return "RN";
  if (num >= 60000000 && num <= 63999999) return "CE";
  if (num >= 64000000 && num <= 64999999) return "PI";
  if (num >= 65000000 && num <= 65999999) return "MA";
  if (num >= 66000000 && num <= 68899999) return "PA";
  if (num >= 68900000 && num <= 68999999) return "AP";
  if (num >= 69000000 && num <= 69299999) return "AM";
  if (num >= 69300000 && num <= 69389999) return "RR";
  if (num >= 69400000 && num <= 69899999) return "AM";
  if (num >= 69900000 && num <= 69999999) return "AC";
  if (num >= 70000000 && num <= 76799999) return "GO_DF";
  if (num >= 77000000 && num <= 77999999) return "TO";
  if (num >= 78000000 && num <= 78899999) return "MT";
  if (num >= 79000000 && num <= 79999999) return "MS";
  if (num >= 80000000 && num <= 87999999) return "PR";
  if (num >= 88000000 && num <= 89999999) return "SC";
  if (num >= 90000000 && num <= 99999999) return "RS";

  return null;
};

// Fallback pricing table (used if DB fetch fails)
const fallbackTable: Record<string, [number, string, number, string]> = {
  RS: [18.90, "3-5", 32.90, "1-2"], SC: [22.90, "3-6", 38.90, "1-3"],
  PR: [25.90, "4-7", 42.90, "2-3"], SP_CAPITAL: [32.90, "5-8", 52.90, "2-4"],
  SP_INTERIOR: [34.90, "5-9", 54.90, "2-4"], RJ: [35.90, "6-10", 56.90, "3-5"],
  MG: [34.90, "5-9", 54.90, "3-5"], ES: [36.90, "6-10", 58.90, "3-5"],
  MS: [32.90, "5-8", 52.90, "2-4"], MT: [38.90, "6-10", 62.90, "3-5"],
  GO_DF: [36.90, "6-10", 58.90, "3-5"], TO: [42.90, "7-12", 68.90, "4-6"],
  BA: [42.90, "7-12", 68.90, "4-6"], SE: [44.90, "8-13", 72.90, "4-7"],
  AL: [44.90, "8-13", 72.90, "4-7"], PE: [44.90, "8-13", 72.90, "4-7"],
  PB: [46.90, "8-14", 74.90, "5-7"], RN: [46.90, "8-14", 74.90, "5-7"],
  CE: [48.90, "9-15", 78.90, "5-8"], PI: [48.90, "9-15", 78.90, "5-8"],
  MA: [52.90, "10-16", 84.90, "5-8"], PA: [54.90, "10-18", 88.90, "6-9"],
  AP: [58.90, "12-20", 94.90, "7-10"], AM: [62.90, "12-22", 98.90, "7-12"],
  RR: [64.90, "14-25", 102.90, "8-12"], AC: [64.90, "14-25", 102.90, "8-12"],
};

// Cache for DB rates
let cachedRates: Record<string, [number, string, number, string]> | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

const fetchRatesFromDB = async (): Promise<Record<string, [number, string, number, string]>> => {
  if (cachedRates && Date.now() - cacheTime < CACHE_TTL) return cachedRates;

  try {
    const { data } = await supabase
      .from("shipping_rates")
      .select("region_code, pac_price, pac_days, sedex_price, sedex_days, is_active")
      .eq("is_active", true);

    if (data && data.length > 0) {
      const table: Record<string, [number, string, number, string]> = {};
      for (const r of data as any[]) {
        table[r.region_code] = [Number(r.pac_price), r.pac_days, Number(r.sedex_price), r.sedex_days];
      }
      cachedRates = table;
      cacheTime = Date.now();
      return table;
    }
  } catch {
    // Fallback silently
  }
  return fallbackTable;
};

export const calculateShipping = async (cep: string): Promise<ShippingOption[] | null> => {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  const region = getRegionFromCep(cleanCep);
  if (!region) return null;

  const table = await fetchRatesFromDB();
  if (!table[region]) return null;

  const [pacPrice, pacDays, sedexPrice, sedexDays] = table[region];

  return [
    { service: "PAC", label: "PAC - Encomenda Econômica", price: pacPrice, days: pacDays },
    { service: "SEDEX", label: "SEDEX - Encomenda Expressa", price: sedexPrice, days: sedexDays },
  ];
};

// Synchronous version using cached/fallback data (for immediate use)
export const calculateShippingSync = (cep: string): ShippingOption[] | null => {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  const region = getRegionFromCep(cleanCep);
  if (!region) return null;

  const table = cachedRates || fallbackTable;
  if (!table[region]) return null;

  const [pacPrice, pacDays, sedexPrice, sedexDays] = table[region];

  return [
    { service: "PAC", label: "PAC - Encomenda Econômica", price: pacPrice, days: pacDays },
    { service: "SEDEX", label: "SEDEX - Encomenda Expressa", price: sedexPrice, days: sedexDays },
  ];
};

export const formatCep = (value: string): string => {
  const clean = value.replace(/\D/g, "").slice(0, 8);
  if (clean.length > 5) return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  return clean;
};
