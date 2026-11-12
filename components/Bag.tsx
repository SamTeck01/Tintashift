"use client";
import { createContext, useContext, useState } from "react";
type Ctx = { count: number; add: (n?: number) => void; flash: string | null };
const BagCtx = createContext<Ctx>({ count: 0, add: () => {}, flash: null });
export function BagProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const add = (n = 1) => {
    setCount((c) => c + n);
    setFlash("Added to bag");
    setTimeout(() => setFlash(null), 1600);
  };
  return <BagCtx.Provider value={{ count, add, flash }}>{children}</BagCtx.Provider>;
}
export const useBag = () => useContext(BagCtx);
