"use client";

import { createJazzReactApp, DemoAuthBasicUI, useDemoAuth } from "jazz-react";

import { JazzAccount } from "./schema";

const Jazz = createJazzReactApp({
  AccountSchema: JazzAccount,
});

export const { useAccount, useCoState } = Jazz;

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, authState] = useDemoAuth();

  return (
    <>
      <Jazz.Provider
        auth={auth}
        peer="wss://cloud.jazz.tools/?key=me@rayhanadev.com"
      >
        {children}
      </Jazz.Provider>
      {authState.state !== "signedIn" && (
        <DemoAuthBasicUI appName="Spyfall" state={authState} />
      )}
    </>
  );
}
