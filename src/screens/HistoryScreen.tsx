import React, { useCallback, useEffect, useState } from 'react';
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
import { ClassTemplate, CrackClass, SavedClassification } from '../types';
import { CLASS_TO_TEMPLATE_KEY } from '../constants';
import { deleteClassification, getClassifications } from '../services/storage';
import { exportClassificationsZip } from '../services/exportClassifications';
import { getDisplayClass } from '../utils/classification';
import templatesData from '../../assets/data/crack_templates.json';

interface Props {
  onBack: () => void;
  onSelect: (result: SavedClassification) => void;
}

export function HistoryScreen({ onBack, onSelect }: Props) {
  const [items, setItems] = useState<SavedClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getClassifications();
      setItems(results);
    } catch {
      Alert.alert('History Error', 'Could not load saved classifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleDelete(id: string) {
    try {
      await deleteClassification(id);
      setItems(current => current.filter(item => item.id !== id));
    } catch {
      Alert.alert('Delete Error', 'Could not delete this classification.');
    }
  }

  async function handleExport() {
    if (items.length === 0 || exporting) return;

    setExporting(true);
    try {
      const result = await exportClassificationsZip(items);
      const skippedText = result.skippedCount
        ? ` ${result.skippedCount} missing images were skipped.`
        : '';
      Alert.alert(
        'Export Complete',
        `Exported ${result.exportedCount} images to ${result.fileUri}.${skippedText}`
      );
    } catch (err: any) {
      Alert.alert('Export Error', err.message ?? 'Could not export classifications.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.exportButton,
          (items.length === 0 || loading || exporting) && styles.exportButtonDisabled,
        ]}
        onPress={handleExport}
        disabled={items.length === 0 || loading || exporting}
      >
        {exporting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.exportButtonText}>Export ZIP</Text>
        )}
      </TouchableOpacity>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#3b82f6" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No classifications yet</Text>
          <Text style={styles.emptyText}>Captured and imported photos will appear here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.row}
              onPress={() => onSelect(item)}
              activeOpacity={0.82}
            >
              <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
              <View style={styles.rowBody}>
                <Text style={styles.classLabel}>{getClassLabel(getDisplayClass(item))}</Text>
                {item.correctedClass && (
                  <Text style={styles.correctedText}>Corrected from {getClassLabel(item.class)}</Text>
                )}
                <Text style={styles.metaText}>
                  {Math.round(item.confidence * 100)}% confidence
                </Text>
                <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function getClassLabel(className: CrackClass): string {
  const templateKey = CLASS_TO_TEMPLATE_KEY[className];
  const template = (templatesData.classes as any)[templateKey] as ClassTemplate | undefined;
  return template?.label ?? className;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingTop: 58,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  exportButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 14,
  },
  exportButtonDisabled: {
    opacity: 0.45,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 16,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: '#a1a1aa',
    fontSize: 14,
    textAlign: 'center',
  },
  list: {
    gap: 12,
    padding: 20,
    paddingBottom: 36,
  },
  row: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 12,
  },
  thumbnail: {
    backgroundColor: '#3f3f46',
    borderRadius: 6,
    height: 72,
    width: 72,
  },
  rowBody: {
    flex: 1,
    marginHorizontal: 12,
  },
  classLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  correctedText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
  },
  metaText: {
    color: '#a1a1aa',
    fontSize: 12,
    marginBottom: 3,
  },
  dateText: {
    color: '#71717a',
    fontSize: 12,
  },
  deleteButton: {
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  deleteText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
  },
});
