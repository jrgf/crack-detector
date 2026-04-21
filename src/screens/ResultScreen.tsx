import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { ClassificationResult, ClassTemplate, CrackClass, SavedClassification } from '../types';
import { CLASS_NAMES, CLASS_TO_TEMPLATE_KEY } from '../constants';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { saveClassification, updateClassification } from '../services/storage';
import { getCorrectionOptions, getDisplayClass } from '../utils/classification';
import templatesData from '../../assets/data/crack_templates.json';

interface Props {
  result: ClassificationResult;
  shouldAutoSave: boolean;
  onResultChange: (result: ClassificationResult) => void;
  onBack: () => void;
  onNewAnalysis: () => void;
}

export function ResultScreen({
  result,
  shouldAutoSave,
  onResultChange,
  onBack,
  onNewAnalysis,
}: Props) {
  const [savedId, setSavedId] = useState<string | null>(
    'id' in result ? (result as SavedClassification).id : null
  );
  const [showCorrectionOptions, setShowCorrectionOptions] = useState(false);
  const savePromiseRef = useRef<Promise<SavedClassification> | null>(null);
  const didAutoSaveRef = useRef(false);

  const displayClass = getDisplayClass(result);
  const templateKey = CLASS_TO_TEMPLATE_KEY[displayClass];
  const template = (templatesData.classes as any)[templateKey] as ClassTemplate | undefined;

  useEffect(() => {
    if (!shouldAutoSave || savedId || didAutoSaveRef.current) return;

    didAutoSaveRef.current = true;
    const savePromise = saveClassification(result);
    savePromiseRef.current = savePromise;
    savePromise
      .then(saved => setSavedId(saved.id))
      .catch(() => Alert.alert('Save Error', 'Could not save result to device.'));
  }, [result, savedId, shouldAutoSave]);

  function handleCorrectClassification() {
    setShowCorrectionOptions(current => !current);
  }

  async function applyCorrection(correctedClass: CrackClass) {
    const updated: ClassificationResult = {
      ...result,
      correctedClass,
      correctedAt: Date.now(),
    };

    onResultChange(updated);
    setShowCorrectionOptions(false);

    try {
      const id = savedId ?? (await savePromiseRef.current)?.id;

      if (id) {
        await updateClassification(id, {
          correctedClass,
          correctedAt: updated.correctedAt,
        });
        setSavedId(id);
      } else {
        const saved = await saveClassification(updated);
        setSavedId(saved.id);
      }
    } catch {
      Alert.alert('Save Error', 'Could not save the corrected classification.');
    }
  }

  const confidencePercent = Math.round(result.confidence * 100);
  const isLowConfidence = result.confidence < 0.7;
  const wasCorrected = Boolean(result.correctedClass);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Image source={{ uri: result.imageUri }} style={styles.image} />

      <View style={styles.resultCard}>
        <Text style={styles.classLabel}>{template?.label ?? result.class}</Text>
        {wasCorrected && (
          <Text style={styles.correctedText}>
            Corrected from {getClassLabel(result.class)}
          </Text>
        )}
        <Text style={styles.confidence}>
          {confidencePercent}% confidence
        </Text>
        {template && <UrgencyBadge level={template.urgency_level} />}
      </View>

      <TouchableOpacity style={styles.correctButton} onPress={handleCorrectClassification}>
        <Text style={styles.correctButtonText}>
          {wasCorrected ? 'Change Correction' : 'Classification Wrong? Correct It'}
        </Text>
      </TouchableOpacity>

      {showCorrectionOptions && (
        <View style={styles.correctionPanel}>
          {getCorrectionOptions(displayClass)
            .map(className => (
              <TouchableOpacity
                key={className}
                style={styles.classOption}
                onPress={() => applyCorrection(className)}
              >
                <Text style={styles.classOptionText}>{getClassLabel(className)}</Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      {isLowConfidence && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Low confidence — consider retaking photo with better lighting and framing.
          </Text>
          <Text style={styles.warningSubtext}>
            Runner-up: {getRunnerUp(result)}
          </Text>
        </View>
      )}

      {template && (
        <View style={styles.templateSection}>
          <Text style={styles.description}>{template.short_description}</Text>

          <Section title="Common Causes" items={template.common_causes} />
          <Section title="Visual Indicators" items={template.visual_indicators} />
          <Section title="Recommended Actions" items={template.recommended_actions} />

          <View style={styles.severityCard}>
            <Text style={styles.sectionTitle}>Severity Thresholds</Text>
            <SeverityRow label="Minor" value={template.severity_thresholds.minor} />
            <SeverityRow label="Moderate" value={template.severity_thresholds.moderate} />
            <SeverityRow label="Severe" value={template.severity_thresholds.severe} />
          </View>

          <Text style={styles.reference}>{template.aci_reference}</Text>
        </View>
      )}

      <Text style={styles.disclaimer}>{templatesData.disclaimer}</Text>

      {savedId && <Text style={styles.savedIndicator}>Saved to history</Text>}

      <TouchableOpacity style={styles.newButton} onPress={onNewAnalysis}>
        <Text style={styles.newButtonText}>New Analysis</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getClassLabel(className: CrackClass): string {
  const templateKey = CLASS_TO_TEMPLATE_KEY[className];
  const template = (templatesData.classes as any)[templateKey] as ClassTemplate | undefined;
  return template?.label ?? className;
}

function getRunnerUp(result: ClassificationResult): string {
  const entries = Object.entries(result.allProbabilities) as [string, number][];
  entries.sort((a, b) => b[1] - a[1]);
  if (entries.length < 2) return 'N/A';
  return `${entries[1][0]} (${Math.round(entries[1][1] * 100)}%)`;
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, i) => (
        <Text key={i} style={styles.listItem}>• {item}</Text>
      ))}
    </View>
  );
}

function SeverityRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.severityRow}>
      <Text style={styles.severityLabel}>{label}</Text>
      <Text style={styles.severityValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#27272a',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#27272a',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  classLabel: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  confidence: {
    color: '#a1a1aa',
    fontSize: 16,
  },
  correctedText: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '600',
  },
  correctButton: {
    backgroundColor: '#1f2937',
    borderColor: '#3b82f6',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  correctButtonText: {
    color: '#bfdbfe',
    fontSize: 14,
    fontWeight: '700',
  },
  correctionPanel: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
    padding: 12,
  },
  classOption: {
    backgroundColor: '#18181b',
    borderColor: '#3f3f46',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  classOptionText: {
    color: '#d4d4d8',
    fontSize: 14,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: '#422006',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#92400e',
  },
  warningText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '500',
  },
  warningSubtext: {
    color: '#d97706',
    fontSize: 13,
    marginTop: 4,
  },
  templateSection: {
    gap: 16,
    marginTop: 8,
  },
  description: {
    color: '#d4d4d8',
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItem: {
    color: '#a1a1aa',
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 4,
  },
  severityCard: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityLabel: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '600',
    width: 70,
  },
  severityValue: {
    color: '#a1a1aa',
    fontSize: 13,
    flex: 1,
  },
  reference: {
    color: '#52525b',
    fontSize: 12,
    fontStyle: 'italic',
  },
  disclaimer: {
    color: '#52525b',
    fontSize: 11,
    marginTop: 24,
    lineHeight: 16,
  },
  savedIndicator: {
    color: '#4ade80',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  newButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  newButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
