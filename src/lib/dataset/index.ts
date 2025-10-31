import countriesRaw from "./countries.json";
import type { Country } from "../game/types";

export const COUNTRIES: Country[] = countriesRaw;

export const getCountryByCode = (code: string): Country | undefined =>
  COUNTRIES.find((country) => country.code === code);

export const getCountriesByContinent = (continent: string): Country[] =>
  COUNTRIES.filter((country) => country.continent === continent);

export const getCountriesByPredicate = (predicate: (country: Country) => boolean): Country[] =>
  COUNTRIES.filter(predicate);
