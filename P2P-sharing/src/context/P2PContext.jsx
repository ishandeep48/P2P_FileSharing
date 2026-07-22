import React, { createContext, useContext } from "react";

const P2PContext = createContext(null);

export function P2PProvider({ value, children }) {
  return (
    <P2PContext.Provider value={value}>
      {children}
    </P2PContext.Provider>
  );
}

export function useP2P() {
  const context = useContext(P2PContext);
  if (!context) {
    throw new Error("useP2P must be used within a P2PProvider");
  }
  return context;
}
