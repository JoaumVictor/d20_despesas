import type { ImageSourcePropType } from 'react-native';

/**
 * Mapa chave → imagem da categoria (bundle local). O banco guarda a chave em
 * `categories.icon`. `require` exige caminho estático, por isso o mapa explícito.
 */
export const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  entretenimento: require('../../../assets/categories/entretenimento.png'),
  ifood: require('../../../assets/categories/ifood.png'),
  social: require('../../../assets/categories/social.png'),
  casa: require('../../../assets/categories/casa.png'),
  saude: require('../../../assets/categories/saude.png'),
  carro: require('../../../assets/categories/carro.png'),
  livro: require('../../../assets/categories/livro.png'),
  mercado: require('../../../assets/categories/mercado.png'),
  impostos: require('../../../assets/categories/impostos.png'),
  eletronicos: require('../../../assets/categories/eletronicos.png'),
  assinaturas: require('../../../assets/categories/assinaturas.png'),
  investimentos: require('../../../assets/categories/investimentos.png'),
  cartao: require('../../../assets/categories/cartao.png'),
  faculdade: require('../../../assets/categories/faculdade.png'),
  academia: require('../../../assets/categories/academia.png'),
  vestuario: require('../../../assets/categories/vestuario.png'),
};

export function categoryImage(key: string | undefined): ImageSourcePropType | undefined {
  if (!key) return undefined;
  return CATEGORY_IMAGES[key];
}
