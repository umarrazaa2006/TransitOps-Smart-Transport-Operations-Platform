"use client";

import * as React from "react";

export type CurrentUser = { name: string; email: string; role: string };

const UserContext = React.createContext<CurrentUser>({ name: "", email: "", role: "" });

export function UserProvider({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return React.useContext(UserContext);
}
