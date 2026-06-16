import type { GetToken } from "@clerk/types";
import { createApiClient } from "./api";

export async function getClerkToken(getToken: GetToken): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error("Not signed in — please sign in again.");
  }

  return token;
}

export async function createAuthenticatedClient(getToken: GetToken) {
  const token = await getClerkToken(getToken);
  return createApiClient(token);
}
