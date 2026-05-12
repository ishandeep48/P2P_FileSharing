import { createContext } from "react";

// The actual context object lives in this non-JSX file so the Provider file
// can be a pure-components module (keeps Vite Fast-Refresh happy and avoids
// react-refresh/only-export-components warnings).
export const P2PContext = createContext(null);
