import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';
import { categoryImage } from './categoryImages';

interface Props {
  iconKey: string | undefined;
  color?: string;
  size?: number; // diâmetro do círculo
}

/** Ícone de categoria: imagem do bundle sobre um círculo com a cor da categoria. */
export function CategoryIcon({ iconKey, color = '#9ca3af', size = 42 }: Props) {
  const source = categoryImage(iconKey);
  const inner = Math.round(size * 0.64);
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}22` },
      ]}
    >
      {source ? (
        <Image source={source} style={{ width: inner, height: inner }} resizeMode="contain" />
      ) : (
        <MaterialCommunityIcons name={'help-circle' as never} size={inner} color={color} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
