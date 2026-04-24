import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000';

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(8);
  const steps = 0;
  const stepsGoal = 10000;
  const kcalBurned = 0;

  useEffect(() => {
    const loadUser = async () => {
      const name = await AsyncStorage.getItem('userName');
      const id = await AsyncStorage.getItem('userId');
      if (name) setUserName(name);
      if (id) setUserId(id);
    };
    loadUser();
  }, []);

  // Refresh data every time home tab is focused
  useFocusEffect(
    useCallback(() => {
      const fetchWater = async () => {
        const id = await AsyncStorage.getItem('userId');
        if (!id) return;
        try {
          const response = await fetch(`${API_URL}/water/${id}`);
          const data = await response.json();
          setWaterIntake(data.glasses);
          setWaterGoal(data.goal);
        } catch (err) {
          console.error('Fetch water error:', err);
        }
      };
      fetchWater();
    }, [])
  );

  const overallProgress = Math.round((waterIntake / waterGoal) * 100);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/(auth)/sign-in');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Ionicons name="person-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.cardsRow}>

        {/* Water Intake */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Water{'\n'}Intake</Text>
          <Text style={styles.cardEmoji}>💧</Text>
          <Text style={styles.cardValue}>{waterIntake}</Text>
          <Text style={styles.cardSubtitle}>/ {waterGoal} glasses</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(waterIntake / waterGoal) * 100}%` }]} />
          </View>
        </View>

        {/* Steps */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Steps🏅</Text>
          <Text style={styles.cardValue}>{steps}</Text>
          <Text style={styles.cardSubtitle}>/ {stepsGoal}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(steps / stepsGoal) * 100}%` }]} />
          </View>
        </View>

        {/* Exercise */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Exercise{'\n'}🥇</Text>
          <Text style={styles.cardValue}>{kcalBurned}</Text>
          <Text style={styles.cardSubtitle}>/ kcal{'\n'}burned</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '0%' }]} />
          </View>
        </View>

      </View>

      {/* Today's Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Summary</Text>
        <Text style={styles.summarySubtitle}>Your progress at a glance</Text>
        <View style={styles.summaryRow}>
          <Ionicons name="radio-button-on" size={18} color="#7B7FE8" />
          <Text style={styles.summaryLabel}>Overall Progress</Text>
          <Text style={styles.summaryPercent}>{overallProgress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  welcomeText: {
    color: '#aaa',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  dateText: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 4,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardEmoji: {
    fontSize: 18,
  },
  cardValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#888',
    fontSize: 11,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#7B7FE8',
    borderRadius: 4,
  },
  summaryCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  summarySubtitle: {
    color: '#666',
    fontSize: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  summaryPercent: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
