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

  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(8);
  const [steps, setSteps] = useState(0);
  const [stepsGoal, setStepsGoal] = useState(10000);
  const [kcalBurned, setKcalBurned] = useState(0);
  const [exerciseMinutes, setExerciseMinutes] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      const name = await AsyncStorage.getItem('userName');
      if (name) setUserName(name);
    };
    loadUser();
  }, []);

  // Refresh data every time home tab is focused
  useFocusEffect(
    useCallback(() => {
      const fetchDashboardData = async () => {
        const id = await AsyncStorage.getItem('userId');
        if (!id) return;
        try {
          const [waterResponse, stepsResponse, exerciseResponse] = await Promise.all([
            fetch(`${API_URL}/water/${id}`),
            fetch(`${API_URL}/steps/${id}`),
            fetch(`${API_URL}/exercise/${id}`),
          ]);

          const waterData = await waterResponse.json();
          const stepsData = await stepsResponse.json();
          const exerciseData = await exerciseResponse.json();

          setWaterIntake(waterData.glasses ?? 0);
          setWaterGoal(waterData.goal ?? 8);
          setSteps(stepsData.step_count ?? 0);
          setStepsGoal(stepsData.goal ?? 10000);
          setKcalBurned(exerciseData.total_calories ?? 0);
          setExerciseMinutes(exerciseData.total_minutes ?? 0);
        } catch (err) {
          console.error('Fetch dashboard data error:', err);
        }
      };

      fetchDashboardData();
    }, [])
  );

  const waterProgress = waterGoal > 0 ? Math.min((waterIntake / waterGoal) * 100, 100) : 0;
  const stepsProgress = stepsGoal > 0 ? Math.min((steps / stepsGoal) * 100, 100) : 0;
  const exerciseProgress =
    exerciseMinutes > 0 ? Math.min((exerciseMinutes / 60) * 100, 100) : 0;

  const waterTip =
    waterIntake === 0
      ? 'You have not logged any water yet. Drinking a glass now is a good start.'
      : waterIntake < Math.max(1, Math.ceil(waterGoal / 2))
        ? 'Your hydration is still low today. Try adding one more glass of water.'
        : waterIntake < waterGoal
          ? 'Nice progress on water. A few more glasses will help you reach your goal.'
          : 'Great job, you have already reached your water goal today.';

  const stepsTip =
    steps === 0
      ? 'No steps logged yet. A short walk can help you start building momentum.'
      : steps < 4000
        ? 'Your step count is still low today. A quick walk could boost it nicely.'
        : steps < stepsGoal
          ? 'You are making progress on steps. Keep moving and you will get there.'
          : 'Excellent work, you have already reached your step goal today.';

  const exerciseTip =
    exerciseMinutes === 0
      ? 'You have not logged any exercise today. A 15-minute walk could be a great start.'
      : exerciseMinutes < 20
        ? 'Nice start with exercise. Adding 10 more active minutes would be even better.'
        : exerciseMinutes < 60
          ? 'Your activity is going well today. Keep the momentum going if you can.'
          : 'Strong work today, your exercise time is already looking great.';

  const tips = [
    {
      key: 'water',
      title: 'Water Tip',
      message: waterTip,
      icon: 'water-outline' as const,
    },
    {
      key: 'steps',
      title: 'Steps Tip',
      message: stepsTip,
      icon: 'walk-outline' as const,
    },
    {
      key: 'exercise',
      title: 'Exercise Tip',
      message: exerciseTip,
      icon: 'fitness-outline' as const,
    },
  ];

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
            <View style={[styles.progressBarFill, { width: `${waterProgress}%` }]} />
          </View>
        </View>

        {/* Steps */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Steps🏅</Text>
          <Text style={styles.cardValue}>{steps.toLocaleString()}</Text>
          <Text style={styles.cardSubtitle}>/ {stepsGoal.toLocaleString()}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${stepsProgress}%` }]} />
          </View>
        </View>

        {/* Exercise */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Exercise{'\n'}🥇</Text>
          <Text style={styles.cardValue}>{kcalBurned}</Text>
          <Text style={styles.cardSubtitle}>{exerciseMinutes} min{'\n'}active</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${exerciseProgress}%` }]} />
          </View>
        </View>

      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.tipsSectionTitle}>Daily Tips</Text>
        <Text style={styles.tipsSectionSubtitle}>Helpful suggestions for each tracker</Text>

        {tips.map((tip) => (
          <View key={tip.key} style={styles.tipCard}>
            <View style={styles.tipIconWrap}>
              <Ionicons name={tip.icon} size={22} color="#7B7FE8" />
            </View>
            <View style={styles.tipTextWrap}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipMessage}>{tip.message}</Text>
            </View>
          </View>
        ))}
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
  tipsSection: {
    gap: 10,
  },
  tipsSectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  tipsSectionSubtitle: {
    color: '#666',
    fontSize: 12,
  },
  tipCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#23233a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextWrap: {
    flex: 1,
    gap: 4,
  },
  tipTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  tipMessage: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
});
