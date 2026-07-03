import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoalsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Metas</Text>
      </View>
      <View style={styles.empty}>
        <MaterialCommunityIcons name="target" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>Em breve: defina orçamentos por categoria.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40 },
  emptyText: { color: '#6b7280', fontSize: 15, textAlign: 'center' },
});
