import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/common/Button';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap | ReactNode;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
};

export function EmptyState({ icon = 'clipboard-outline', title, description, actionTitle, onAction }: Props) {
  const renderIcon = () => {
    if (typeof icon === 'string' && icon in Ionicons.glyphMap) {
      return (
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={24}
          color={Colors.light.textSecondary}
        />
      );
    }
    if (typeof icon === 'string') {
      return <Text style={styles.icon}>{icon}</Text>;
    }
    return icon;
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>{renderIcon()}</View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionTitle && onAction ? (
        <View style={styles.actionWrap}>
          <Button title={actionTitle} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    ...Typography.headline,
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  description: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  actionWrap: {
    marginTop: Spacing.md,
  },
});
