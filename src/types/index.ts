// src/types/index.ts
export interface Name {
  first: string;
  last: string;
  gender: string;
  isFavorite?: boolean;
  isLocked?: boolean;
}

export interface DrawerProps {
  name: Name | null;
  isOpen: boolean;
  onClose: () => void;
  onFavorite: (name: Name) => void;
  onLockFirst: (name: Name) => void;
  onLockLast: (name: Name) => void;
  isFavorite: boolean;
  isFirstNameLocked: boolean;
  isLastNameLocked: boolean;
}
