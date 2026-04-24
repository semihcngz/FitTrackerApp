import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://localhost:3000';

export default function WaterScreen() {
  const [glasses, setGlasses] = useState(0);
  const [goal, setGoal] = useState(8);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
      if (id) fetchWater(id);
    };
    loadData();
  }, []);

  const fetchWater = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/water/${id}`);
      const data = await response.json();
      setGlasses(data.glasses);
      setGoal(data.goal);
    } catch (err) {
      console.error('Fetch water error:', err);
    }
  };

  const updateWater = async (newGlasses: number, newGoal: number) => {
    try {
      await fetch(`${API_URL}/water/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, glasses: newGlasses, goal: newGoal }),
      });
    } catch (err) {
      console.error('Update water error:', err);
    }
  };

  const handleAdd = async () => {
    if (glasses + 1 == goal) {
      Alert.alert('', 'You have reached your daily goal!');
    }
    const newGlasses = glasses + 1;
    setGlasses(newGlasses);
    await updateWater(newGlasses, goal);
  };

  const handleRemove = async () => {
    if (glasses <= 0) return;
    const newGlasses = glasses - 1;
    setGlasses(newGlasses);
    await updateWater(newGlasses, goal);
  };

  const handleGoalChange = async (change: number) => {
    
    const newGoal = goal + change;
    if(newGoal == 25)
    {
        Alert.alert("That's too much water, dont you think :)")
        return;
    }
    if (newGoal < 1) return;
    setGoal(newGoal);
    await updateWater(glasses, newGoal);
  };

  const progress = Math.min((glasses / goal) * 100, 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <Text style={styles.title}>Water Intake 💧</Text>
      <Text style={styles.subtitle}>Track your daily hydration</Text>

      {/* Progress Circle Area */}
      <View style={styles.progressCard}>
        <Text style={styles.glassesCount}>{glasses}</Text>
        <Text style={styles.glassesLabel}>/ {goal} glasses</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}% of daily goal</Text>
      </View>

      {/* Add / Remove Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
          <Ionicons name="remove" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.glassIconContainer}>
          <Ionicons name="water" size={48} color="#7B7FE8" />
          <Text style={styles.addLabel}>Add / Remove</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Goal Settings */}
      <View style={styles.goalCard}>
        <Text style={styles.goalTitle}>Daily Goal</Text>
        <View style={styles.goalRow}>
          <TouchableOpacity style={styles.goalButton} onPress={() => handleGoalChange(-1)}>
            <Ionicons name="remove" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.goalValue}>{goal} glasses</Text>
          <TouchableOpacity style={styles.goalButton} onPress={() => handleGoalChange(1)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Glass indicators */}
      <View style={styles.glassGrid}>
        {Array.from({ length: goal }).map((_, i) => (
          <Ionicons
            key={i}
            name={i < glasses ? 'water' : 'water-outline'}
            size={28}
            color={i < glasses ? '#7B7FE8' : '#444'}
            style={styles.glassIcon}
          />
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
    alignItems: 'center',
    gap: 8,
  },
  glassesCount: {
    color: '#fff',
    fontSize: 64,
    fontWeight: '700',
  },
  glassesLabel: {
    color: '#888',
    fontSize: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#7B7FE8',
    borderRadius: 8,
  },
  progressText: {
    color: '#888',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 24,
  },
  removeButton: {
    backgroundColor: '#333',
    borderRadius: 50,
    padding: 14,
  },
  addButton: {
    backgroundColor: '#7B7FE8',
    borderRadius: 50,
    padding: 14,
  },
  glassIconContainer: {
    alignItems: 'center',
    gap: 8,
  },
  addLabel: {
    color: '#666',
    fontSize: 12,
  },
  goalCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  goalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  glassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  glassIcon: {
    margin: 4,
  },
});
