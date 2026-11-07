// src/types/index.ts

/** A first + last name as shown in the list. */
export interface Name {
  first: string;
  last: string;
  gender: string;
}

// First name details from the API. When nothing matches, the API returns
// only `{ name: <the typed prefix> }`, with no id.
export interface FirstNameDetails {
  id?: number;
  name: string;
  gender: string;
  count: number;
  rank: number;
  year: number;
}

// Last name details from the API, including race data (as strings).
export interface LastNameDetails {
  id?: number;
  name: string;
  rank: number;
  count: number;
  prop100k: string;
  cum_prop100k: string;
  pctwhite: string;
  pctblack: string;
  pctasian: string;
  pctnative: string;
  pct2prace: string;
  pcthispanic: string;
}

export type NamePair = [FirstNameDetails | null, LastNameDetails | null];

export interface NameHistory {
  name: string;
  gender: string;
  year: number;
  rank: number;
  count: number;
}
