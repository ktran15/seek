import { StyleSheet, Text, View } from 'react-native';

// Placeholder boot screen — themed in M0 sub-step 5 (design tokens).
export default function BootScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seek</Text>
      <Text style={styles.subtitle}>M0 foundation shell</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5ECE3',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#233837',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#3D4625',
  },
});
