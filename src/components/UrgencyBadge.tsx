import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UrgencyLevel } from '../types';

const URGENCY_CONFIG: Record<UrgencyLevel, { color: string; label: string }> = {
  low:      { color: '#4ade80', label: 'Low' },
  medium:   { color: '#facc15', label: 'Medium' },
  high:     { color: '#fb923c', label: 'High' },
  critical: { color: '#ef4444', label: 'Critical' },
};

interface Props {
  level: UrgencyLevel;
}

export function UrgencyBadge({ level }: Props) {
  const config = URGENCY_CONFIG[level];
  return (
    <View style={[styles.badge, { backgroundColor: config.color + '20', borderColor: config.color }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
