import { useEffect, useState, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

const API_URL = 'http://localhost:3000';

const EXERCISE_OPTIONS = [
  { type: 'Cardio', activity: 'Running', icon: 'walk', color: '#FF8A65' },
  { type: 'Cardio', activity: 'Cycling', icon: 'bicycle', color: '#4FC3F7' },
  { type: 'Cardio', activity: 'Swimming', icon: 'body', color: '#4DD0E1' },
  { type: 'Cardio', activity: 'Jump Rope', icon: 'fitness', color: '#FFD54F' },
  { type: 'Cardio', activity: 'Rowing', icon: 'boat', color: '#A1887F' },
  { type: 'Strength', activity: 'Weight Lifting', icon: 'barbell', color: '#BA68C8' },
  { type: 'Strength', activity: 'Push-ups', icon: 'fitness', color: '#F06292' },
  { type: 'Strength', activity: 'Pull-ups', icon: 'body', color: '#9575CD' },
  { type: 'Strength', activity: 'Squats', icon: 'body', color: '#7986CB' },
  { type: 'Strength', activity: 'Deadlift', icon: 'barbell', color: '#AB47BC' },
  { type: 'Flexibility', activity: 'Yoga', icon: 'flower', color: '#81C784' },
  { type: 'Flexibility', activity: 'Stretching', icon: 'accessibility', color: '#4DB6AC' },
  { type: 'Flexibility', activity: 'Pilates', icon: 'body', color: '#AED581' },
  { type: 'Sports', activity: 'Basketball', icon: 'basketball', color: '#FFB74D' },
  { type: 'Sports', activity: 'Football', icon: 'football', color: '#66BB6A' },
  { type: 'Sports', activity: 'Tennis', icon: 'tennisball', color: '#DCE775' },
  { type: 'Sports', activity: 'Volleyball', icon: 'basketball-outline', color: '#FFCC80' },
  { type: 'Other', activity: 'Walking', icon: 'walk', color: '#64B5F6' },
  { type: 'Other', activity: 'Dancing', icon: 'musical-notes', color: '#F48FB1' },
  { type: 'Other', activity: 'Hiking', icon: 'leaf', color: '#81C784' },
  { type: 'Other', activity: 'Martial Arts', icon: 'flash', color: '#E57373' },
] as const;

type ExerciseOption = (typeof EXERCISE_OPTIONS)[number];

const getExerciseOption = (activity: string, type?: string): ExerciseOption | {
  type: string;
  activity: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
} =>
  EXERCISE_OPTIONS.find((option) => option.activity === activity && (!type || option.type === type)) ??
  EXERCISE_OPTIONS.find((option) => option.activity === activity) ??
  { type: type ?? 'Other', activity, icon: 'barbell', color: '#7B7FE8' };

interface Exercise {
  id: number;
  exercise_type: string;
  activity: string;
  duration_minutes: number;
  calories_burned: number;
  created_at: string;
}

export default function ExerciseScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption>(EXERCISE_OPTIONS[0]);
  const [isExerciseListOpen, setIsExerciseListOpen] = useState(false);
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    const load = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
      if (id) fetchExercises(id);
    };
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) fetchExercises(userId);
    }, [userId])
  );

  const fetchExercises = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/exercise/${id}`);
      const data = await res.json();
      setExercises(data.exercises ?? []);
      setTotalCalories(data.total_calories ?? 0);
      setTotalMinutes(data.total_minutes ?? 0);
    } catch (err) {
      console.error('Fetch exercises error:', err);
    }
  };

  const handleAdd = async () => {
    if (!duration || !calories) {
      Alert.alert('Missing fields', 'Please enter duration and calories burned.');
      return;
    }

    const parsedDuration = parseInt(duration);
    const parsedCalories = parseInt(calories);

    if (isNaN(parsedDuration) || isNaN(parsedCalories) || parsedDuration <= 0 || parsedCalories <= 0) {
      Alert.alert('Invalid input', 'Please enter valid numbers.');
      return;
    }

    try {
      await fetch(`${API_URL}/exercise/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          exercise_type: selectedExercise.type,
          activity: selectedExercise.activity,
          duration_minutes: parsedDuration,
          calories_burned: parsedCalories,
        }),
      });
      setDuration('');
      setCalories('');
      setIsExerciseListOpen(false);
      if (userId) fetchExercises(userId);
    } catch (err) {
      console.error('Add exercise error:', err);
      Alert.alert('Error', 'Could not add exercise.');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Exercise', 'Are you sure you want to delete this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/exercise/${id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId }),
            });
            if (userId) fetchExercises(userId);
          } catch (err) {
            console.error('Delete exercise error:', err);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.title}>Exercise Tracker 🏋️</Text>
      <Text style={styles.subtitle}>Log your workouts and track progress</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={22} color="#7B7FE8" />
          <Text style={styles.statValue}>{totalMinutes}</Text>
          <Text style={styles.statLabel}>minutes today</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame-outline" size={22} color="#7B7FE8" />
          <Text style={styles.statValue}>{totalCalories}</Text>
          <Text style={styles.statLabel}>kcal today</Text>
        </View>
      </View>

      {/* Add Exercise Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Exercise</Text>

        <Text style={styles.label}>Exercise</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setIsExerciseListOpen((prev) => !prev)}
        >
          <View style={styles.selectButtonLeft}>
            <View
              style={[
                styles.selectIconBadge,
                { backgroundColor: `${selectedExercise.color}22` },
              ]}
            >
              <Ionicons
                name={selectedExercise.icon}
                size={18}
                color={selectedExercise.color}
              />
            </View>
            <View>
              <Text style={styles.selectValue}>{selectedExercise.activity}</Text>
              <Text style={styles.selectMeta}>{selectedExercise.type}</Text>
            </View>
          </View>
          <Ionicons
            name={isExerciseListOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#888"
          />
        </TouchableOpacity>

        {isExerciseListOpen ? (
          <View style={styles.optionList}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {EXERCISE_OPTIONS.map((option) => {
                const isSelected =
                  selectedExercise.activity === option.activity &&
                  selectedExercise.type === option.type;

                return (
                  <TouchableOpacity
                    key={`${option.type}-${option.activity}`}
                    style={[styles.optionItem, isSelected && styles.optionItemActive]}
                    onPress={() => {
                      setSelectedExercise(option);
                      setIsExerciseListOpen(false);
                    }}
                  >
                    <View style={styles.optionItemLeft}>
                      <View
                        style={[
                          styles.optionIconBadge,
                          { backgroundColor: `${option.color}22` },
                        ]}
                      >
                        <Ionicons name={option.icon} size={18} color={option.color} />
                      </View>
                      <View>
                        <Text style={[styles.optionTitle, isSelected && styles.optionTitleActive]}>
                          {option.activity}
                        </Text>
                        <Text style={styles.optionSubtitle}>{option.type}</Text>
                      </View>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color="#7B7FE8" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Duration & Calories */}
        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.label}>Duration (min)</Text>
            <TextInput
              style={styles.input}
              placeholder="30"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
            />
          </View>
          <View style={styles.inputHalf}>
            <Text style={styles.label}>Calories Burned</Text>
            <TextInput
              style={styles.input}
              placeholder="200"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Exercises */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today&apos;s Exercises</Text>

        {exercises.length === 0 ? (
          <Text style={styles.emptyText}>No exercises logged today. Get moving! 💪</Text>
        ) : (
          exercises.map((ex) => {
            const exerciseConfig = getExerciseOption(ex.activity, ex.exercise_type);

            return (
              <View key={ex.id} style={styles.exerciseItem}>
                <View
                  style={[
                    styles.exerciseIconBadge,
                    { backgroundColor: `${exerciseConfig.color}22` },
                  ]}
                >
                  <Ionicons
                    name={exerciseConfig.icon}
                    size={20}
                    color={exerciseConfig.color}
                  />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.activity}</Text>
                  <Text style={styles.exerciseMeta}>{ex.exercise_type}</Text>
                </View>
                <View style={styles.exerciseRight}>
                  <Text style={styles.exerciseDuration}>{ex.duration_minutes} min</Text>
                  <Text style={styles.exerciseCalories}>{ex.calories_burned} kcal</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(ex.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 20 }} />
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  selectButton: {
    backgroundColor: '#151515',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  selectMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  optionList: {
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: 260,
  },
  optionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  optionItemActive: {
    backgroundColor: '#1b1b26',
  },
  optionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTitleActive: {
    fontWeight: '700',
  },
  optionSubtitle: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
    gap: 6,
  },
  input: {
    backgroundColor: '#151515',
    color: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  addButton: {
    backgroundColor: '#7B7FE8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    gap: 12,
  },
  exerciseIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  exerciseMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  exerciseRight: {
    alignItems: 'flex-end',
  },
  exerciseDuration: {
    color: '#7B7FE8',
    fontSize: 13,
    fontWeight: '600',
  },
  exerciseCalories: {
    color: '#888',
    fontSize: 12,
  },
  deleteBtn: {
    padding: 4,
  },
  emptyText: {
    color: '#555',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
});
