"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";

import { hydrateSession } from "@/lib/state/platform-actions";
import { makeStore, type AppStore, useAppDispatch, useAppSelector } from "@/lib/state/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <SessionBootstrap />
      {children}
    </Provider>
  );
}

function SessionBootstrap() {
  const dispatch = useAppDispatch();
  const bootstrapped = useAppSelector((state) => state.session.bootstrapped);

  useEffect(() => {
    if (bootstrapped) {
      return;
    }
    void dispatch(hydrateSession());
  }, [bootstrapped, dispatch]);

  return null;
}
