import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DEFAULT_GLOBAL_CONFIG,
  subscribeGlobalConfig,
  type GlobalConfig,
} from "@/lib/globalConfig";

const GlobalConfigContext = createContext<GlobalConfig>(DEFAULT_GLOBAL_CONFIG);

/** Jeden nasłuch `config/global` na całą aplikację (1 odczyt na wczytanie) */
export function GlobalConfigProvider({ children }: { children: ReactNode }) {
  const { syncUser } = useAuth();
  const signedIn = Boolean(syncUser);
  const [config, setConfig] = useState<GlobalConfig>(DEFAULT_GLOBAL_CONFIG);

  useEffect(() => {
    if (!signedIn) return;
    const unsubscribe = subscribeGlobalConfig(setConfig);
    return () => unsubscribe?.();
  }, [signedIn]);

  return (
    <GlobalConfigContext.Provider value={config}>
      {children}
    </GlobalConfigContext.Provider>
  );
}

export function useGlobalConfig(): GlobalConfig {
  return useContext(GlobalConfigContext);
}
