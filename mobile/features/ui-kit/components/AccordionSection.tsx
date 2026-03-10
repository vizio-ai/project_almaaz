import React, { useState, type ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { spacing, radii, typography } from '../theme';

export interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** Controlled collapsed state. If undefined, component manages its own state. */
  collapsed?: boolean;
  onToggle?: () => void;
  /** Extra content rendered to the left of the chevron in the header row. */
  headerRight?: ReactNode;
}

export function AccordionSection({
  title,
  subtitle,
  children,
  collapsed,
  onToggle,
  headerRight,
}: AccordionSectionProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const borderMuted = useThemeColor('borderMuted');
  const background = useThemeColor('background');

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isControlled = collapsed !== undefined;
  const isCollapsed = isControlled ? collapsed : internalCollapsed;

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalCollapsed((prev) => !prev);
      onToggle?.();
    }
  };

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.header} onPress={handleToggle} activeOpacity={0.7}>
        <View style={styles.headerTextRow}>
          <AppText style={[styles.title, { color: textColor }]}>{title}</AppText>
          {subtitle ? (
            <AppText style={[styles.subtitle, { color: secondary }]}>{subtitle}</AppText>
          ) : null}
        </View>
        {headerRight}
        <Ionicons
          name={isCollapsed ? 'chevron-down' : 'chevron-up'}
          size={16}
          color={secondary}
        />
      </TouchableOpacity>

      {!isCollapsed && (
        <View
          style={[
            styles.body,
            {
              backgroundColor: background,
              borderTopColor: borderMuted,
            },
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e7',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  headerTextRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
  },
  subtitle: {
    ...typography.sm,
    flex: 1,
  },
  body: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
});

