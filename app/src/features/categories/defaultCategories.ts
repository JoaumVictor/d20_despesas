/**
 * Categorias padrão. `icon` = chave da imagem (ver categoryImages.ts).
 * O `idSort` é estável e usado para reconciliar as categorias já semeadas.
 * São criadas para cada usuário no primeiro login.
 */
export interface DefaultCategory {
  idSort: number;
  name: string;
  icon: string; // chave da imagem em CATEGORY_IMAGES
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { idSort: 0, name: 'Entretenimento', icon: 'entretenimento', color: '#a855f7' },
  { idSort: 1, name: 'Comida & iFood', icon: 'ifood', color: '#ef4444' },
  { idSort: 2, name: 'Lazer & Social', icon: 'social', color: '#3b82f6' },
  { idSort: 3, name: 'Contas de casa', icon: 'casa', color: '#f59e0b' },
  { idSort: 4, name: 'Saúde', icon: 'saude', color: '#ec4899' },
  { idSort: 5, name: 'Transporte', icon: 'carro', color: '#f97316' },
  { idSort: 6, name: 'Diversos', icon: 'livro', color: '#8b5cf6' },
  { idSort: 7, name: 'Mercado', icon: 'mercado', color: '#22c55e' },
  { idSort: 8, name: 'Impostos', icon: 'impostos', color: '#64748b' },
  { idSort: 9, name: 'Eletrônicos', icon: 'eletronicos', color: '#0ea5e9' },
  { idSort: 10, name: 'Assinaturas', icon: 'assinaturas', color: '#06b6d4' },
  { idSort: 11, name: 'Investimentos', icon: 'investimentos', color: '#10b981' },
  { idSort: 12, name: 'Cartões', icon: 'cartao', color: '#7c3aed' },
  { idSort: 13, name: 'Faculdade', icon: 'faculdade', color: '#2563eb' },
];
