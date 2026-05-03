import { useQuery, type UseQueryResult } from "@tanstack/react-query";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  createdAt: string;
};

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchAuthUser(): Promise<AuthUser | null> {
  const resp = await fetch(`${basePath}/api/users/me`, {
    credentials: "include",
  });

  if (resp.status === 401) return null;
  if (!resp.ok) {
    throw new Error("Failed to load user");
  }

  return (await resp.json()) as AuthUser;
}

export function useAuthUser(): UseQueryResult<AuthUser | null> {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchAuthUser,
    staleTime: 5 * 60 * 1000,
  });
}

export async function signOut(): Promise<void> {
  await fetch(`${basePath}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
