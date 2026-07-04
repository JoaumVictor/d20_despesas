import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, StyleSheet, View } from "react-native";
import { categoryImage } from "./categoryImages";

// As imagens têm ~20px de borda transparente; damos zoom e cortamos o excesso.
export const CATEGORY_ICON_ZOOM = 1.4;

interface Props {
  iconKey: string | undefined;
  color?: string;
  size?: number; // diâmetro do círculo
}

/** Ícone de categoria: imagem do bundle (com zoom) sobre um círculo com a cor da categoria. */
export function CategoryIcon({ iconKey, color = "#9ca3af", size = 42 }: Props) {
  const source = categoryImage(iconKey);
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          // borderRadius: size / 2,
          backgroundColor: `${color}22`,
        },
      ]}
    >
      {source ? (
        <Image
          source={source}
          style={{
            width: size,
            height: size,
            transform: [{ scale: CATEGORY_ICON_ZOOM }],
          }}
          resizeMode="contain"
        />
      ) : (
        <MaterialCommunityIcons
          name={"help-circle" as never}
          size={size * 0.64}
          color={color}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
});
