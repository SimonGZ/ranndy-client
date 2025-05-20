// src/types/index.ts
export interface Name {
  first: string;
  last: string;
  gender: string;
  isFavorite?: boolean;
  isLocked?: boolean;
}

export interface DrawerProps {
  namePair: NamePair | null; // Accept the full name pair
  isOpen: boolean;
  onClose: () => void;
  onFavorite: (name: Name) => void;
  onLockFirst: (name: Name) => void;
  onLockLast: (name: Name) => void;
  isFavorite: boolean;
  isFirstNameLocked: boolean;
  isLastNameLocked: boolean;
  activeChartType: "none" | "history" | "race"; // Prop for active chart type
  setActiveChartType: (type: "none" | "history" | "race") => void; // Prop to set active chart type
}

// Interface for the first name details from the API
export interface FirstNameDetails {
  id: number;
  name: string;
  gender: string;
  count: number;
  rank: number;
  year: number;
}

// Interface for the last name details from the API, including race data
export interface LastNameDetails {
  id: number;
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

// Type for the pair of names returned by the API
export type NamePair = [FirstNameDetails | null, LastNameDetails | null];

// Interface for the surname race data, parsed into numbers
export interface SurnameRaceData {
  pctWhite: number;
  pctBlack: number;
  pctAsian: number;
  pctNative: number;
  pctTwoOrMoreRaces: number;
  pctHispanic: number;
}

export interface NameHistory {
  name: string;
  gender: string;
  year: number;
  rank: number;
  count: number;
}
