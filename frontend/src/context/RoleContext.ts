import { createContext, type Dispatch, type SetStateAction } from "react";

type RoleContextType = {
  currentRole: string | null;
  setCurrentRole: Dispatch<SetStateAction<string | null>>;
} | null;

export const RoleContext = createContext<RoleContextType>(null);
