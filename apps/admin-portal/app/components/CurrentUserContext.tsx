"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UserSession } from "@repo/types";

interface CurrentUserContextValue {
    user: UserSession | null;
    isLoading: boolean;
    refresh: () => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue>({
    user: null,
    isLoading: true,
    refresh: () => {},
});

// Fetches /api/auth/me exactly once per session (shared via context) instead of
// every consumer (sidebar, header, individual pages) issuing its own request on mount.
export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(() => {
        let cancelled = false;
        setIsLoading(true);
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((data) => {
                if (cancelled) return;
                setUser(data.user ?? null);
            })
            .catch(() => {
                if (!cancelled) setUser(null);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => load(), [load]);

    const value = useMemo(() => ({ user, isLoading, refresh: load }), [user, isLoading, load]);

    return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
    return useContext(CurrentUserContext);
}
