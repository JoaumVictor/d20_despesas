/**
 * Categorias padrão (migradas do Despesas.db original).
 * - `icon`: nome do ícone MaterialCommunityIcons (@expo/vector-icons).
 * - `color`: cor convertida do inteiro ARGB original para hex.
 * São criadas para cada usuário no primeiro login.
 */
export interface DefaultCategory {
  idSort: number;
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { idSort: 0, name: 'Entretenimento', icon: 'movie-open', color: '#607d8b' },
  { idSort: 1, name: 'Comida e Bebida', icon: 'food-fork-drink', color: '#448aff' },
  { idSort: 2, name: 'Evento Social', icon: 'party-popper', color: '#2196f3' },
  { idSort: 3, name: 'Mensal', icon: 'calendar-refresh', color: '#7c4dff' },
  { idSort: 4, name: 'Saúde', icon: 'heart-pulse', color: '#ff4081' },
  { idSort: 5, name: 'Transporte', icon: 'car', color: '#ff5252' },
  { idSort: 6, name: 'Dia a dia', icon: 'calendar-today', color: '#00bcd4' },
  { idSort: 7, name: 'Ifood', icon: 'bike-fast', color: '#b71c1c' },
  { idSort: 8, name: 'Governo', icon: 'bank', color: '#7c4dff' },
  { idSort: 9, name: 'Eletrônicos', icon: 'laptop', color: '#ff5722' },
  { idSort: 10, name: 'Streams', icon: 'television-play', color: '#f44336' },
  { idSort: 11, name: 'Roupas', icon: 'tshirt-crew', color: '#3f51b5' },
  { idSort: 12, name: 'Cartão', icon: 'credit-card', color: '#8e24aa' },
  { idSort: 13, name: 'Faculdade', icon: 'school', color: '#42a5f5' },
];
