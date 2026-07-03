import { Redirect } from 'expo-router';

/**
 * Rota da aba "+". Na prática nunca é exibida: o `tabBarButton` custom abre o
 * modal `/expense/new` diretamente. Se algo navegar aqui, volta para Despesas.
 */
export default function AddTab() {
  return <Redirect href="/(app)/(tabs)" />;
}
