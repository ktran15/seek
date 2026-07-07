import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export function AppProviders({ children }: { children: ReactNode }) {
  // QueryClient in state so a re-render never recreates the cache.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 2,
          },
        },
      }),
  );

  return (
    // GestureDetector (double-tap like, M6.1) requires the RNGH root view.
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
