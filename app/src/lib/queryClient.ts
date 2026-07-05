import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      // mantém o cache vivo por dias — é o que sobrevive no AsyncStorage entre
      // aberturas do app (ver lib/persister.ts). Sem isso o React Query descarta
      // a entrada da memória antes mesmo de persistir.
      gcTime: 1000 * 60 * 60 * 24 * 7,
      retry: 1,
    },
  },
});
