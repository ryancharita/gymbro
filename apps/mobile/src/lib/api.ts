import { GraphQLClient } from "graphql-request";

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/graphql";

export function createApiClient(token: string | null) {
  return new GraphQLClient(apiUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
