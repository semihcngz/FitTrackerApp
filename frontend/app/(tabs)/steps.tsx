import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

const API_URL = 'http://localhost:3000';

export default function StepsScreen() {
  const [stepCount, setStepCount] = useState(0);
  const [goal, setGoal] = useState(10000);
  const [stepInput, setStepInput] = useState('0');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
      if (id) {
        await fetchSteps(id);
      }
    };

    loadData();
  }, []);

  const fetchSteps = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/steps/${id}`);
      const data = await response.json();
      const currentSteps = data.step_count ?? 0;
      const currentGoal = data.goal ?? 10000;

      setStepCount(currentSteps);
      setGoal(currentGoal);
      setStepInput(String(currentSteps));
    } catch (err) {
      console.error('Fetch steps error:', err);
    }
  };

  const saveSteps = async (newStepCount: number, newGoal: number) => {
    if (!userId) {
      return;
    }

    try {
      await fetch(`${API_URL}/steps/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, stepCount: newStepCount, goal: newGoal }),
      });
    } catch (err) {
      console.error('Update steps error:', err);
    }
  };

  const updateStepState = async (newStepCount: number, newGoal = goal) => {
    const safeSteps = Math.max(0, newStepCount);

    setStepCount(safeSteps);
    setGoal(newGoal);
    setStepInput(String(safeSteps));
    await saveSteps(safeSteps, newGoal);

    if (safeSteps >= newGoal && stepCount < newGoal) {
      Alert.alert('Great job!', 'You have reached your daily step goal.');
    }
  };

  const handleManualSave = async () => {
    const parsedValue = Number(stepInput);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      Alert.alert('Invalid value', 'Please enter a valid step count.');
      return;
    }

    await updateStepState(stepCount + Math.round(parsedValue));
  };

  const handleGoalChange = async (change: number) => {
    const newGoal = goal + change;

    if (newGoal < 1000) {
      Alert.alert('Goal too low', 'Daily step goal must be at least 1000.');
      return;
    }

    if (newGoal > 50000) {
      Alert.alert('Goal too high', 'Please choose a goal below 50000 steps.');
      return;
    }

    setGoal(newGoal);
    await saveSteps(stepCount, newGoal);
  };

  const progress = Math.min((stepCount / goal) * 100, 100);
  const remainingSteps = Math.max(goal - stepCount, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Step Tracker</Text>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressLabel}>Today&apos;s Steps</Text>
            <Text style={styles.stepCount}>{stepCount.toLocaleString()}</Text>
            <Text style={styles.goalLabel}>/ {goal.toLocaleString()} goal</Text>
          </View>
          <View style={styles.iconBadge}>
            <FontAwesome5 name="walking" size={24} color="#7B7FE8" />
          </View>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.progressMetaRow}>
          <Text style={styles.progressText}>{Math.round(progress)}% completed</Text>
          <Text style={styles.progressText}>
            {remainingSteps.toLocaleString()} steps left
          </Text>
        </View>
      </View>

      <View style={styles.manualCard}>
        <Text style={styles.cardTitle}>Add Steps</Text>


        <TextInput
          style={styles.input}
          value={stepInput}
          onChangeText={setStepInput}
          keyboardType="number-pad"
          placeholder="For example: 400"
          placeholderTextColor="#666"
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleManualSave}>
          <Text style={styles.primaryButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.goalCard}>
        <Text style={styles.cardTitle}>Daily Goal</Text>
        <View style={styles.goalRow}>
          <TouchableOpacity style={styles.goalButton} onPress={() => handleGoalChange(-1000)}>
            <Ionicons name="remove" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.goalValue}>{goal.toLocaleString()} steps</Text>
          <TouchableOpacity style={styles.goalButton} onPress={() => handleGoalChange(1000)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={styles.statValue}>{remainingSteps.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={styles.statValue}>{stepCount >= goal ? 'Goal Met' : 'Keep Going'}</Text>
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
    paddingBottom: 40,
    gap: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: -12,
  },
  progressCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: '#888',
    fontSize: 14,
  },
  stepCount: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
    marginTop: 4,
  },
  goalLabel: {
    color: '#888',
    fontSize: 16,
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#7B7FE8',
    borderRadius: 8,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressText: {
    color: '#888',
    fontSize: 13,
  },
  manualCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: '#666',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#151515',
    color: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#7B7FE8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  goalCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalButton: {
    backgroundColor: '#333',
    borderRadius: 50,
    padding: 10,
  },
  goalValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  statLabel: {
    color: '#888',
    fontSize: 13,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
