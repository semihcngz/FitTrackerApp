import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

const API_URL = 'http://localhost:3000';
const DAYS_IN_WEEK = 7;
const WEEK_COUNT = 4;

type ExerciseDay = {
  day: string;
  total_calories: number;
  total_minutes: number;
  workout_count: number;
};

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const normalizeDateKey = (value: string) => value.slice(0, 10);

const parseDateKey = (value: string) => {
  const [year, month, day] = normalizeDateKey(value).split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

const getMonday = (date: Date) => {
  const monday = new Date(date);
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  return monday;
};

const addDays = (date: Date, amount: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const formatDayNumber = (dateKey: string) =>
  String(parseDateKey(dateKey).getDate()).padStart(2, '0');

const formatWeekday = (dateKey: string) =>
  parseDateKey(dateKey).toLocaleDateString('en-US', { weekday: 'short' });

const formatShortDate = (dateKey: string) =>
  parseDateKey(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function ExerciseWeeklyScreen() {
  const router = useRouter();
  const [days, setDays] = useState<ExerciseDay[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(WEEK_COUNT - 1);

  const fetchExerciseHistory = useCallback(async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;

    try {
      const phoneDate = getLocalDateKey();
      const response = await fetch(`${API_URL}/exercise/weekly/${userId}?date=${phoneDate}`);
      const data = await response.json();
      setDays(data.days ?? []);
    } catch (err) {
      console.error('Fetch exercise history error:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchExerciseHistory();
    }, [fetchExerciseHistory])
  );

  const weeks = useMemo(() => {
    const byDate = new Map(days.map((day) => [normalizeDateKey(day.day), day]));
    const today = parseDateKey(getLocalDateKey());
    const currentMonday = getMonday(today);

    return Array.from({ length: WEEK_COUNT }, (_, weekIndex) => {
      const weekStart = addDays(currentMonday, (weekIndex - (WEEK_COUNT - 1)) * DAYS_IN_WEEK);

      return Array.from({ length: DAYS_IN_WEEK }, (_, dayIndex) => {
        const dateKey = getLocalDateKey(addDays(weekStart, dayIndex));
        return (
          byDate.get(dateKey) ?? {
            day: dateKey,
            total_calories: 0,
            total_minutes: 0,
            workout_count: 0,
          }
        );
      });
    });
  }, [days]);

  useEffect(() => {
    setSelectedWeekIndex(WEEK_COUNT - 1);
  }, [days]);

  const selectedWeek = weeks[selectedWeekIndex] ?? [];
  const selectedWeekMaxCalories = Math.max(
    ...selectedWeek.map((day) => day.total_calories),
    1
  );
  const totals = selectedWeek.reduce(
    (acc, day) => ({
      calories: acc.calories + day.total_calories,
      minutes: acc.minutes + day.total_minutes,
      workouts: acc.workouts + day.workout_count,
      activeDays: acc.activeDays + (day.workout_count > 0 ? 1 : 0),
    }),
    { calories: 0, minutes: 0, workouts: 0, activeDays: 0 }
  );

  const weekStart = selectedWeek[0]?.day;
  const weekEnd = selectedWeek[selectedWeek.length - 1]?.day;
  const summaryLabel =
    selectedWeekIndex === WEEK_COUNT - 1
      ? 'Current Week'
      : weekStart && weekEnd
        ? `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`
        : 'Selected Week';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Last 4 Weeks</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroLabel}>{summaryLabel}</Text>
            <Text style={styles.heroValue}>{totals.calories}</Text>
            <Text style={styles.heroSubValue}>{totals.minutes} active minutes</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="bar-chart-outline" size={26} color="#7B7FE8" />
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{totals.workouts}</Text>
            <Text style={styles.summaryLabel}>workouts</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{totals.activeDays}</Text>
            <Text style={styles.summaryLabel}>active days</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.chartHeader}>
          <Text style={styles.cardTitle}>Calories Burned</Text>
          <View style={styles.weekSwitcher}>
            <TouchableOpacity
              style={[
                styles.weekSwitchButton,
                selectedWeekIndex === 0 && styles.weekSwitchButtonDisabled,
              ]}
              onPress={() => setSelectedWeekIndex((current) => Math.max(current - 1, 0))}
              disabled={selectedWeekIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={selectedWeekIndex === 0 ? '#555' : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.weekSwitchButton,
                selectedWeekIndex === WEEK_COUNT - 1 && styles.weekSwitchButtonDisabled,
              ]}
              onPress={() =>
                setSelectedWeekIndex((current) => Math.min(current + 1, WEEK_COUNT - 1))
              }
              disabled={selectedWeekIndex === WEEK_COUNT - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={selectedWeekIndex === WEEK_COUNT - 1 ? '#555' : '#fff'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.weekRangeLabel}>
          {weekStart && weekEnd
            ? `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`
            : 'Loading'}
        </Text>

        <View style={styles.chartRow}>
          {selectedWeek.map((day) => {
            const barHeight =
              day.total_calories === 0
                ? 10
                : Math.max((day.total_calories / selectedWeekMaxCalories) * 160, 18);

            return (
              <View key={day.day} style={styles.chartColumn}>
                <Text style={styles.chartValue}>
                  {day.total_calories > 0 ? day.total_calories : ''}
                </Text>
                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: barHeight,
                        opacity: day.total_calories === 0 ? 0.35 : 1,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{formatDayNumber(day.day)}</Text>
                <Text style={styles.chartSubLabel}>{formatWeekday(day.day)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  card: { backgroundColor: '#1e1e1e', borderRadius: 20, padding: 20, gap: 16 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: '#888', fontSize: 14 },
  heroValue: { color: '#fff', fontSize: 42, fontWeight: '700', marginTop: 4 },
  heroSubValue: { color: '#888', fontSize: 15 },
  heroBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#23233a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryGrid: { flexDirection: 'row', gap: 10 },
  summaryBox: {
    flex: 1,
    backgroundColor: '#151515',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: { color: '#fff', fontSize: 20, fontWeight: '700' },
  summaryLabel: { color: '#777', fontSize: 11, textAlign: 'center' },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  weekSwitcher: { flexDirection: 'row', gap: 8 },
  weekSwitchButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekSwitchButtonDisabled: { backgroundColor: '#121212' },
  weekRangeLabel: { color: '#888', fontSize: 12, marginTop: -8 },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 8,
  },
  chartColumn: { flex: 1, alignItems: 'center', gap: 6 },
  chartValue: { color: '#aaa', fontSize: 10, minHeight: 14 },
  chartTrack: {
    width: '100%',
    height: 170,
    borderRadius: 14,
    backgroundColor: '#151515',
    justifyContent: 'flex-end',
    padding: 6,
  },
  chartBar: { width: '100%', borderRadius: 10, backgroundColor: '#7B7FE8' },
  chartLabel: { color: '#888', fontSize: 12 },
  chartSubLabel: { color: '#666', fontSize: 10 },
});
