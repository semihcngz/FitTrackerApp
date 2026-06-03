import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';

const API_URL = 'http://localhost:3000';

type Meal = {
  id: string;
  name: string;
  description: string;
  imageUri?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'low' | 'medium' | 'high';
  notes: string[];
  source: string;
  createdAt: string;
};

type FoodAnalysis = Omit<Meal, 'id' | 'imageUri' | 'createdAt'>;

const getLocalDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const buildStorageKey = (userId: string | null) => `foodMeals:${userId ?? 'guest'}:${getLocalDateStr()}`;

const emptyTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

export default function FoodScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const totals = useMemo(
    () =>
      meals.reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.calories,
          protein: acc.protein + meal.protein,
          carbs: acc.carbs + meal.carbs,
          fat: acc.fat + meal.fat,
        }),
        emptyTotals
      ),
    [meals]
  );

  const loadMeals = useCallback(async () => {
    const userId = await AsyncStorage.getItem('userId');
    const storedMeals = await AsyncStorage.getItem(buildStorageKey(userId));
    setMeals(storedMeals ? JSON.parse(storedMeals) : []);
  }, []);

  const saveMeals = async (nextMeals: Meal[]) => {
    const userId = await AsyncStorage.getItem('userId');
    await AsyncStorage.setItem(buildStorageKey(userId), JSON.stringify(nextMeals));
    setMeals(nextMeals);
  };

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [loadMeals])
  );

  const analyzeImage = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.base64) {
      Alert.alert('Photo error', 'The selected photo could not be read.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const response = await fetch(`${API_URL}/food/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: `data:${mimeType};base64,${asset.base64}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Food analysis failed');
      }

      const analysis = data as FoodAnalysis;
      const nextMeal: Meal = {
        ...analysis,
        id: `${Date.now()}`,
        imageUri: asset.uri,
        createdAt: new Date().toISOString(),
      };

      await saveMeals([nextMeal, ...meals]);
    } catch (err) {
      console.error('Analyze food error:', err);
      Alert.alert('Analysis failed', 'Please try another photo or check the backend server.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pickFoodPhoto = async (source: 'camera' | 'library') => {
    if (isAnalyzing) return;

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to estimate calories.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            base64: true,
            quality: 0.35,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            base64: true,
            quality: 0.35,
          });

    if (!result.canceled) {
      await analyzeImage(result.assets[0]);
    }
  };

  const deleteMeal = async (mealId: string) => {
    await saveMeals(meals.filter((meal) => meal.id !== mealId));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Food Tracker</Text>
          <Text style={styles.subtitle}>AI supported calorie estimate</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="sparkles" size={18} color="#A7A5FF" />
          <Text style={styles.headerBadgeText}>Week 9</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="flame"
          iconColor="#FF9D3D"
          label="Total Calories"
          value={`${Math.round(totals.calories)}`}
          unit="kcal"
        />
        <StatCard icon="nutrition" iconColor="#FF6B6B" label="Protein" value={totals.protein.toFixed(1)} unit="g" />
        <StatCard icon="grid" iconColor="#4EA5FF" label="Carbs" value={totals.carbs.toFixed(1)} unit="g" />
        <StatCard icon="water" iconColor="#FFD166" label="Fat" value={totals.fat.toFixed(1)} unit="g" />
      </View>

      <View style={styles.actionPanel}>
        <View style={styles.actionCopy}>
          <Text style={styles.actionTitle}>Add food from a photo</Text>
          <Text style={styles.actionText}>Choose or take a meal photo. The backend asks ChatGPT for calories and macros.</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => pickFoodPhoto('library')} disabled={isAnalyzing}>
            <Ionicons name="images-outline" size={21} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={() => pickFoodPhoto('camera')} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <ActivityIndicator color="#111" size="small" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={21} color="#111" />
                <Text style={styles.primaryButtonText}>Add Food</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#8B8B95" />
        <Text style={styles.sectionTitle}>{"Today's Meals"}</Text>
      </View>

      {meals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={34} color="#777" />
          <Text style={styles.emptyTitle}>No meals yet</Text>
          <Text style={styles.emptyText}>Add a photo to calculate calories, protein, carbs, and fat.</Text>
        </View>
      ) : (
        meals.map((meal) => (
          <View key={meal.id} style={styles.mealCard}>
            {meal.imageUri ? <Image source={{ uri: meal.imageUri }} style={styles.mealImage} /> : null}
            <View style={styles.mealInfo}>
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleWrap}>
                  <Text style={styles.mealTitle}>{meal.name}</Text>
                  <Text style={styles.mealDescription}>{meal.description}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteMeal(meal.id)}>
                  <Ionicons name="trash-outline" size={17} color="#BFC0C8" />
                </TouchableOpacity>
              </View>

              <View style={styles.macroRow}>
                <MacroPill color="#FF9D3D" label={`${Math.round(meal.calories)} kcal`} />
                <MacroPill color="#FF6B6B" label={`${meal.protein.toFixed(1)} protein`} />
                <MacroPill color="#4EA5FF" label={`${meal.carbs.toFixed(1)} carbs`} />
                <MacroPill color="#FFD166" label={`${meal.fat.toFixed(1)} fat`} />
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
  unit,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statLabelRow}>
        <Ionicons name={icon} size={15} color={iconColor} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

function MacroPill({ color, label }: { color: string; label: string }) {
  return (
    <View style={[styles.macroPill, { borderColor: `${color}55`, backgroundColor: `${color}18` }]}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F14',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 58,
    paddingBottom: 110,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#F8F8FA',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8D909B',
    fontSize: 13,
    marginTop: 4,
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: '#1A1B24',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerBadgeText: {
    color: '#DEDEFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    backgroundColor: '#171922',
    borderColor: '#242633',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 96,
    padding: 14,
    width: '48.5%',
  },
  statLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statLabel: {
    color: '#BFC0C8',
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 14,
  },
  statUnit: {
    color: '#777B86',
    fontSize: 11,
    marginTop: 3,
  },
  actionPanel: {
    backgroundColor: '#171922',
    borderColor: '#282B38',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  actionCopy: {
    gap: 5,
  },
  actionTitle: {
    color: '#F8F8FA',
    fontSize: 16,
    fontWeight: '800',
  },
  actionText: {
    color: '#989BA6',
    fontSize: 13,
    lineHeight: 19,
  },
  actionButtons: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#242633',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#A7A5FF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    justifyContent: 'center',
    minWidth: 128,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: '#111',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#BFC0C8',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#171922',
    borderColor: '#242633',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    color: '#91949F',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
  mealCard: {
    backgroundColor: '#171922',
    borderColor: '#242633',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  mealImage: {
    backgroundColor: '#242633',
    borderRadius: 8,
    height: 70,
    width: 70,
  },
  mealInfo: {
    flex: 1,
    gap: 10,
  },
  mealHeader: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  mealTitleWrap: {
    flex: 1,
  },
  mealTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  mealDescription: {
    color: '#9295A1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  deleteButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  macroPill: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 24,
    paddingHorizontal: 8,
  },
  macroDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  macroText: {
    color: '#D8DAE5',
    fontSize: 11,
    fontWeight: '700',
  },
});
