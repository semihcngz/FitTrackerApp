import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

type ProfileForm = {
  age: string;
  gender: string;
  height: string;
  currentWeight: string;
  targetWeight: string;
  activityLevel: string;
};

const API_URL = 'http://localhost:3000';

const EMPTY_PROFILE: ProfileForm = {
  age: '',
  gender: '',
  height: '',
  currentWeight: '',
  targetWeight: '',
  activityLevel: '',
};

const GENDERS = ['Male', 'Female'];
const ACTIVITY_LEVELS = [
  'Sedentary (little or no exercise)',
  'Lightly active',
  'Moderately active',
  'Very active',
];

const toNumber = (value: string) => {
  const normalizedValue = value.replace(',', '.');
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const formatNumber = (value: string, digits = 1) => {
  const parsedValue = toNumber(value);

  return parsedValue > 0 ? parsedValue.toFixed(digits) : '-';
};

const normalizeProfileValue = (value: unknown) =>
  value === null || value === undefined ? '' : String(value);

const mapApiProfile = (profile: Partial<Record<keyof ProfileForm, unknown>>): ProfileForm => ({
  age: normalizeProfileValue(profile.age),
  gender: normalizeProfileValue(profile.gender),
  height: normalizeProfileValue(profile.height),
  currentWeight: normalizeProfileValue(profile.currentWeight),
  targetWeight: normalizeProfileValue(profile.targetWeight),
  activityLevel: normalizeProfileValue(profile.activityLevel),
});

export default function ProfileScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [draftProfile, setDraftProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [isEditing, setIsEditing] = useState(false);

  const bmi = useMemo(() => {
    const heightInMeters = toNumber(profile.height) / 100;
    const weight = toNumber(profile.currentWeight);

    if (heightInMeters <= 0 || weight <= 0) {
      return null;
    }

    return weight / (heightInMeters * heightInMeters);
  }, [profile.currentWeight, profile.height]);

  const bmiStatus = useMemo(() => {
    if (!bmi) {
      return { label: 'Add Info', color: '#000000', backgroundColor: '#FFFFFF' };
    }

    if (bmi < 18.5) {
      return { label: 'Underweight', color: '#000000', backgroundColor: '#FFFFFF' };
    }

    if (bmi < 25) {
      return { label: 'Normal', color: '#000000', backgroundColor: '#FFFFFF' };
    }

    if (bmi < 30) {
      return { label: 'Overweight', color: '#000000', backgroundColor: '#FFFFFF' };
    }

    return { label: 'Obese', color: '#000000', backgroundColor: '#FFFFFF' };
  }, [bmi]);

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const [storedUserId, storedName] = await Promise.all([
          AsyncStorage.getItem('userId'),
          AsyncStorage.getItem('userName'),
        ]);

        setUserId(storedUserId);
        setUserName(storedName ?? 'User');

        if (!storedUserId) {
          setProfile(EMPTY_PROFILE);
          setDraftProfile(EMPTY_PROFILE);
          return;
        }

        const response = await fetch(`${API_URL}/auth/profile/${storedUserId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Profile could not be loaded.');
        }

        const nextProfile = mapApiProfile(data.profile ?? {});

        setProfile(nextProfile);
        setDraftProfile(nextProfile);
      };

      loadProfile().catch((err) => {
        console.error('Load profile error:', err);
      });
    }, [])
  );

  const updateDraft = (field: keyof ProfileForm, value: string) => {
    setDraftProfile((currentProfile) => ({ ...currentProfile, [field]: value }));
  };

  const validateDraft = () => {
    const age = toNumber(draftProfile.age);
    const height = toNumber(draftProfile.height);
    const currentWeight = toNumber(draftProfile.currentWeight);
    const targetWeight = toNumber(draftProfile.targetWeight);

    if (draftProfile.age && (age < 1 || age > 120)) {
      return 'Please enter an age between 1 and 120.';
    }

    if (draftProfile.height && (height < 50 || height > 250)) {
      return 'Please enter height in centimeters.';
    }

    if (draftProfile.currentWeight && (currentWeight < 20 || currentWeight > 350)) {
      return 'Please enter current weight in kilograms.';
    }

    if (draftProfile.targetWeight && (targetWeight < 20 || targetWeight > 350)) {
      return 'Please enter target weight in kilograms.';
    }

    return null;
  };

  const saveProfile = async () => {
    const validationError = validateDraft();

    if (validationError) {
      Alert.alert('Invalid profile', validationError);
      return;
    }

    try {
      if (!userId) {
        Alert.alert('Error', 'User information could not be found.');
        return;
      }

      const response = await fetch(`${API_URL}/auth/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftProfile),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Profile could not be saved.');
      }

      const nextProfile = mapApiProfile(data.profile ?? draftProfile);

      setProfile(nextProfile);
      setDraftProfile(nextProfile);
      setIsEditing(false);
    } catch (err) {
      console.error('Save profile error:', err instanceof Error ? err.message : err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Profile could not be saved.');
    }
  };

  const startEditing = () => {
    setDraftProfile(profile);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftProfile(profile);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconButton} onPress={cancelEditing}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, styles.editHeaderTitle]}>Edit Profile</Text>
          </View>

          <View style={styles.formCard}>
            <ProfileInput
              label="Age"
              value={draftProfile.age}
              onChangeText={(value) => updateDraft('age', value)}
              keyboardType="number-pad"
              suffix="years"
            />
            <OptionGroup
              label="Gender"
              options={GENDERS}
              value={draftProfile.gender}
              onChange={(value) => updateDraft('gender', value)}
            />
            <ProfileInput
              label="Height"
              value={draftProfile.height}
              onChangeText={(value) => updateDraft('height', value)}
              keyboardType="decimal-pad"
              suffix="cm"
            />
            <ProfileInput
              label="Current Weight"
              value={draftProfile.currentWeight}
              onChangeText={(value) => updateDraft('currentWeight', value)}
              keyboardType="decimal-pad"
              suffix="kg"
            />
            <ProfileInput
              label="Target Weight (Optional)"
              value={draftProfile.targetWeight}
              onChangeText={(value) => updateDraft('targetWeight', value)}
              keyboardType="decimal-pad"
              suffix="kg"
            />
            <OptionGroup
              label="Activity Level"
              options={ACTIVITY_LEVELS}
              value={draftProfile.activityLevel}
              onChange={(value) => updateDraft('activityLevel', value)}
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.iconButton} onPress={startEditing}>
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.identityCard}>
        <View style={styles.avatar}>
          <Ionicons name="happy-outline" size={30} color="#ffd86b" />
        </View>
        <Text style={styles.name}>{userName}</Text>
      </View>

      <View style={styles.bmiCard}>
        <Text style={styles.sectionTitle}>Body Mass Index (BMI)</Text>
        <View style={styles.bmiRow}>
          <Text style={styles.bmiValue}>{bmi ? bmi.toFixed(1) : '--'}</Text>
          <View style={[styles.bmiBadge, { backgroundColor: bmiStatus.backgroundColor }]}>
            <Text style={[styles.bmiBadgeText, { color: bmiStatus.color }]}>
              {bmiStatus.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Physical Information</Text>
        <InfoRow label="Age" value={profile.age ? `${profile.age} years` : '-'} />
        <InfoRow label="Gender" value={profile.gender || '-'} />
        <InfoRow label="Height" value={profile.height ? `${formatNumber(profile.height)} cm` : '-'} />
        <InfoRow
          label="Weight"
          value={profile.currentWeight ? `${formatNumber(profile.currentWeight)} kg` : '-'}
        />
        <InfoRow
          label="Target Weight"
          value={profile.targetWeight ? `${formatNumber(profile.targetWeight)} kg` : '-'}
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Activity Level</Text>
        <Text style={styles.activityText}>{profile.activityLevel || '-'}</Text>
      </View>
    </ScrollView>
  );
}

type ProfileInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType: 'decimal-pad' | 'number-pad';
  suffix: string;
};

function ProfileInput({ label, value, onChangeText, keyboardType, suffix }: ProfileInputProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder="0"
          placeholderTextColor="#666"
        />
        <Text style={styles.inputSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

type OptionGroupProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

function OptionGroup({ label, options, value, onChange }: OptionGroupProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option) => {
          const isSelected = value === option;

          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, isSelected && styles.optionButtonActive]}
              onPress={() => onChange(option)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#111',
  },
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  editHeaderTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  identityCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  email: {
    color: '#777',
    fontSize: 13,
  },
  bmiCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  bmiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bmiValue: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
  },
  bmiBadge: {
    minWidth: 88,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bmiBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  infoRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  infoLabel: {
    color: '#777',
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  activityText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    gap: 14,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    paddingLeft: 14,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 12,
  },
  inputSuffix: {
    color: '#aaa',
    fontSize: 12,
  },
  optionWrap: {
    gap: 8,
  },
  optionButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#151515',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  optionButtonActive: {
    borderColor: '#7B7FE8',
    backgroundColor: '#23233a',
  },
  optionText: {
    color: '#aaa',
    fontSize: 14,
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: '#7B7FE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
