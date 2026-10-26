import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
} from "@apollo/client";

/**
 * Apollo Client Setup for Next.js (App Router & Static Export)
 * 
 * FIX FOR ERROR: "Please initialize an instance of HttpLink with uri instead"
 * 
 * In Apollo Client, network connection options such as `uri`, `credentials`,
 * and default `headers` must be passed to the `HttpLink` constructor rather
 * than directly to the `ApolloClient` constructor.
 */

// Resolves the GraphQL API endpoint depending on environment (Client/SSR/Local/Prod)
const getGraphqlUri = (): string => {
  if (process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT && process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT.trim()) {
    return process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT.trim();
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.includes("192.168.")) {
      return "http://localhost:5000/graphql";
    }
    return "https://api.glowgoodly.com/graphql";
  }
  return "https://api.glowgoodly.com/graphql";
};

// 1. Initialize dedicated HttpLink instance with uri, credentials, and headers
export const httpLink = new HttpLink({
  uri: getGraphqlUri(),
  credentials: "same-origin", // 'same-origin' | 'include' | 'omit'
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// 2. Authentication & request context link for dynamic token injection
export const authLink = new ApolloLink((operation, forward) => {
  let token = "";
  if (typeof window !== "undefined") {
    try {
      token = localStorage.getItem("gg_token") || localStorage.getItem("token") || "";
    } catch {
      // Safe fallback if browser storage is restricted
    }
  }

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }));

  return forward(operation);
});

// 3. Initialize ApolloClient with link chain (authLink -> httpLink) and InMemoryCache
export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default apolloClient;
