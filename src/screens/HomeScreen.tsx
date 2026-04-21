import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ClassificationResult } from '../types';
import { loadModel, classifyImage } from '../services/classifier';

interface Props {
  onOpenCamera: () => void;
  onOpenHistory: () => void;
  onResult: (result: ClassificationResult) => void;
}

export function HomeScreen({
  onOpenCamera,
  onOpenHistory,
  onResult,
}: Props) {
  const [modelReady, setModelReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadModel()
      .then(() => setModelReady(true))
      .catch(err => Alert.alert('Model Error', err.message));
  }, []);

  async function handleGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Photo library access needed.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: false,
      mediaTypes: ['images'],
    });

    if (!result.canceled && result.assets[0]) {
      await classify(result.assets[0].uri);
    }
  }

  async function classify(uri: string) {
    setLoading(true);
    try {
      const result = await classifyImage(uri);
      onResult(result);
    } catch (err: any) {
      Alert.alert('Classification Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crack Detector</Text>
      <Text style={styles.subtitle}>Capture or import a crack photo for on-device classification</Text>

      {!modelReady && (
        <View style={styles.loadingModel}>
          <ActivityIndicator color="#3b82f6" />
          <Text style={styles.loadingText}>Loading model...</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingModel}>
          <ActivityIndicator color="#3b82f6" />
          <Text style={styles.loadingText}>Classifying...</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onOpenCamera}
          disabled={!modelReady || loading}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleGallery}
          disabled={!modelReady || loading}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>From Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.historyButton]}
          onPress={onOpenHistory}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>History</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Include at least 1 meter around the crack</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#71717a',
    fontSize: 14,
    marginBottom: 32,
  },
  loadingModel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  actions: {
    gap: 12,
    marginTop: 'auto',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  historyButton: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#a1a1aa',
  },
  hint: {
    color: '#52525b',
    fontSize: 12,
    textAlign: 'center',
  },
});
