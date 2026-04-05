import { View, Text, StyleSheet } from 'react-native';

export default function WaterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Water</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 24, fontWeight: '700' },
});
