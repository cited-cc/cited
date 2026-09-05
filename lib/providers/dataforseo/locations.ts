import { DataForSeoError } from "@/lib/providers/dataforseo/errors";

/**
 * DataForSEO Google SERP location_code values for country-level monitoring.
 * Source: DataForSEO Google locations list (country codes).
 * City is ignored for SERP tasks until a verified city-code table ships.
 */
const COUNTRY_LOCATION_CODES: Record<string, number> = {
  US: 2840,
  GB: 2826,
  UK: 2826,
  CA: 2124,
  AU: 2036,
  DE: 2276,
  FR: 2250,
  NL: 2528,
  IE: 2372,
  IN: 2356,
  SG: 2702,
  NZ: 2554,
  ES: 2724,
  IT: 2380,
  BR: 2076,
  JP: 2392,
  KR: 2410,
  SE: 2752,
  NO: 2578,
  DK: 2208,
  FI: 2246,
  CH: 2756,
  AT: 2040,
  BE: 2056,
  PT: 2620,
  MX: 2484,
  AE: 2784,
  IL: 2376,
  ZA: 2710,
  PL: 2616,
};

export function resolveDataForSeoLocationCode(input: {
  countryCode: string;
  city?: string | null;
}): number {
  void input.city;
  const country = input.countryCode.trim().toUpperCase();
  if (!country) {
    throw new DataForSeoError({
      code: "provider_validation_error",
      message: "Country code is required for SERP monitoring.",
      retryable: false,
    });
  }

  const countryCode = COUNTRY_LOCATION_CODES[country];
  if (typeof countryCode !== "number") {
    throw new DataForSeoError({
      code: "provider_validation_error",
      message: `Unsupported monitoring location: ${country}`,
      safeMessage: "This monitoring location is not supported yet.",
      retryable: false,
    });
  }

  return countryCode;
}

export function listSupportedDataForSeoCountryCodes(): string[] {
  return Object.keys(COUNTRY_LOCATION_CODES).filter((code) => code !== "UK");
}
