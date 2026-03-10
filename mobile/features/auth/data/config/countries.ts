import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';
import { getName } from 'country-list';

export interface Country {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

function getCountryName(isoCode: string): string {
  return getName(isoCode) ?? isoCode;
}

function isoToFlag(isoCode: string): string {
  return isoCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const PRIORITY: CountryCode[] = ['US', 'GB', 'CA', 'DE', 'FR', 'AE', 'SA', 'TR'];

function buildCountryList(): Country[] {
  const all = getCountries().map((code) => ({
    code,
    name: getCountryName(code),
    dialCode: `+${getCountryCallingCode(code)}`,
    flag: isoToFlag(code),
  }));

  const priority = PRIORITY
    .map((code) => all.find((c) => c.code === code))
    .filter(Boolean) as Country[];

  const rest = all
    .filter((c) => !PRIORITY.includes(c.code))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...priority, ...rest];
}

export const COUNTRIES: Country[] = buildCountryList();
