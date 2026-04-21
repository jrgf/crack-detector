import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ClassificationResult } from '../types';
import { classifyImage } from '../services/classifier';

interface Props {
  onCancel: () => void;
  onResult: (result: ClassificationResult) => void;
}

export function CameraScreen({ onCancel, onResult }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleCapture() {
    if (!cameraRef.current || !cameraReady || busy) return;

    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      const result = await classifyImage(photo.uri);
      onResult(result);
    } catch (err: any) {
      Alert.alert('Capture Error', err.message ?? 'Could not capture and classify photo.');
      setBusy(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera permission required</Text>
        <Text style={styles.permissionText}>
          Camera access is needed to photograph structural cracks.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash="off"
        mode="picture"
        onCameraReady={() => setCameraReady(true)}
      />

      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.guideBox}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.guideText}>Include at least 1 meter around the crack</Text>
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topButton} onPress={onCancel} disabled={busy}>
          <Text style={styles.topButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        {busy && (
          <View style={styles.busyIndicator}>
            <ActivityIndicator color="#ffffff" />
            <Text style={styles.busyText}>Classifying...</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.shutterButton, (!cameraReady || busy) && styles.shutterDisabled]}
          onPress={handleCapture}
          disabled={!cameraReady || busy}
          accessibilityLabel="Take photo"
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cornerBase = {
  position: 'absolute' as const,
  width: 42,
  height: 42,
  borderColor: '#ffffff',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    color: '#a1a1aa',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelText: {
    color: '#a1a1aa',
    fontSize: 15,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  guideBox: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 380,
    maxWidth: 380,
  },
  corner: {
    ...cornerBase,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  guideText: {
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 18,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: 'center',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 58,
  },
  topButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  controls: {
    alignItems: 'center',
    bottom: 42,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  busyIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  busyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  shutterButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderColor: '#ffffff',
    borderRadius: 38,
    borderWidth: 4,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    height: 52,
    width: 52,
  },
});
