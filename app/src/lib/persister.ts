import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/**
 * Persiste o cache do React Query no AsyncStorage: ao abrir o app, as telas
 * já nascem com os últimos dados conhecidos (sem tela em branco esperando
 * rede) e o React Query atualiza sozinho por trás assim que reconectar.
 */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'd20-query-cache',
  throttleTime: 1000,
});
