// Shipping calculator based on CEP region ranges
// Origin: RS (Rio Grande do Sul) - Gründemann Geradores

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

  // SP capital
  if (num >= 1000000 && num <= 9999999) return "SP_CAPITAL";
  // SP interior
  if (num >= 11000000 && num <= 19999999) return "SP_INTERIOR";
  // RJ
  if (num >= 20000000 && num <= 28999999) return "RJ";
  // ES
  if (num >= 29000000 && num <= 29999999) return "ES";
  // MG
  if (num >= 30000000 && num <= 39999999) return "MG";
  // BA
  if (num >= 40000000 && num <= 48999999) return "BA";
  // SE
  if (num >= 49000000 && num <= 49999999) return "SE";
  // PE
  if (num >= 50000000 && num <= 56999999) return "PE";
  // AL
  if (num >= 57000000 && num <= 57999999) return "AL";
  // PB
  if (num >= 58000000 && num <= 58999999) return "PB";
  // RN
  if (num >= 59000000 && num <= 59999999) return "RN";
  // CE
  if (num >= 60000000 && num <= 63999999) return "CE";
  // PI
  if (num >= 64000000 && num <= 64999999) return "PI";
  // MA
  if (num >= 65000000 && num <= 65999999) return "MA";
  // PA
  if (num >= 66000000 && num <= 68899999) return "PA";
  // AP
  if (num >= 68900000 && num <= 68999999) return "AP";
  // AM
  if (num >= 69000000 && num <= 69299999) return "AM";
  // RR
  if (num >= 69300000 && num <= 69389999) return "RR";
  // AM (continued)
  if (num >= 69400000 && num <= 69899999) return "AM";
  // AC
  if (num >= 69900000 && num <= 69999999) return "AC";
  // DF/GO
  if (num >= 70000000 && num <= 76799999) return "GO_DF";
  // TO
  if (num >= 77000000 && num <= 77999999) return "TO";
  // MT
  if (num >= 78000000 && num <= 78899999) return "MT";
  // MS
  if (num >= 79000000 && num <= 79999999) return "MS";
  // PR
  if (num >= 80000000 && num <= 87999999) return "PR";
  // SC
  if (num >= 88000000 && num <= 89999999) return "SC";
  // RS
  if (num >= 90000000 && num <= 99999999) return "RS";

  return null;
};

// Pricing table: [PAC price, PAC days, SEDEX price, SEDEX days]
// Prices are base values for packages up to 5kg from RS
const shippingTable: Record<string, [number, string, number, string]> = {
  RS:          [18.90, "3-5",   32.90, "1-2"],
  SC:          [22.90, "3-6",   38.90, "1-3"],
  PR:          [25.90, "4-7",   42.90, "2-3"],
  SP_CAPITAL:  [32.90, "5-8",   52.90, "2-4"],
  SP_INTERIOR: [34.90, "5-9",   54.90, "2-4"],
  RJ:          [35.90, "6-10",  56.90, "3-5"],
  MG:          [34.90, "5-9",   54.90, "3-5"],
  ES:          [36.90, "6-10",  58.90, "3-5"],
  MS:          [32.90, "5-8",   52.90, "2-4"],
  MT:          [38.90, "6-10",  62.90, "3-5"],
  GO_DF:       [36.90, "6-10",  58.90, "3-5"],
  TO:          [42.90, "7-12",  68.90, "4-6"],
  BA:          [42.90, "7-12",  68.90, "4-6"],
  SE:          [44.90, "8-13",  72.90, "4-7"],
  AL:          [44.90, "8-13",  72.90, "4-7"],
  PE:          [44.90, "8-13",  72.90, "4-7"],
  PB:          [46.90, "8-14",  74.90, "5-7"],
  RN:          [46.90, "8-14",  74.90, "5-7"],
  CE:          [48.90, "9-15",  78.90, "5-8"],
  PI:          [48.90, "9-15",  78.90, "5-8"],
  MA:          [52.90, "10-16", 84.90, "5-8"],
  PA:          [54.90, "10-18", 88.90, "6-9"],
  AP:          [58.90, "12-20", 94.90, "7-10"],
  AM:          [62.90, "12-22", 98.90, "7-12"],
  RR:          [64.90, "14-25", 102.90, "8-12"],
  AC:          [64.90, "14-25", 102.90, "8-12"],
};

export const calculateShipping = (cep: string): ShippingOption[] | null => {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  const region = getRegionFromCep(cleanCep);
  if (!region || !shippingTable[region]) return null;

  const [pacPrice, pacDays, sedexPrice, sedexDays] = shippingTable[region];

  return [
    {
      service: "PAC",
      label: "PAC - Encomenda Econômica",
      price: pacPrice,
      days: pacDays,
    },
    {
      service: "SEDEX",
      label: "SEDEX - Encomenda Expressa",
      price: sedexPrice,
      days: sedexDays,
    },
  ];
};

export const formatCep = (value: string): string => {
  const clean = value.replace(/\D/g, "").slice(0, 8);
  if (clean.length > 5) return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  return clean;
};
