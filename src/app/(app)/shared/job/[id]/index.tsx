import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { parseApiError } from '@/api/errors';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { useJobDetail, useUpdateJobStatus } from '@/hooks/useJobs';
import { useAuthStore } from '@/store/useAuthStore';
import type { JobStatus } from '@/types/domain';
import { formatDateTime } from '@/utils/formatters';

const JOB_STATUS_OPTIONS: { status: JobStatus; label: string }[] = [
  { status: 'RECEIVED', label: 'Received' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'TESTING', label: 'Testing' },
  { status: 'READY_FOR_DELIVERY', label: 'Ready for Delivery' },
  { status: 'DELIVERED', label: 'Delivered' },
  { status: 'CANCELLED', label: 'Cancelled' },
];

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isOwner = useAuthStore((s) => s.activeActorRole === 'OWNER');
  const { data, isLoading, error, refetch, isRefetching } = useJobDetail(id!);
  const updateStatusMutation = useUpdateJobStatus(id!);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.light.textSecondary} size="small" />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !data) {
    return (
      <ScreenWrapper>
        <ErrorBanner message={parseApiError(error).message} onRetry={() => refetch()} />
      </ScreenWrapper>
    );
  }

  const handleStatusSelect = async (newStatus: JobStatus) => {
    setIsDropdownOpen(false);
    if (newStatus === data.status) return;

    try {
      await updateStatusMutation.mutateAsync({
        status: newStatus,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = parseApiError(e).message;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Status update failed', msg);
      }
    }
  };

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={() => refetch()}>
      <View style={styles.contentWrapper}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroMain}>
              <Text style={styles.num}>{data.jobNumber}</Text>
              <Text style={styles.created}>Created {formatDateTime(data.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.statusSection}>
            <Text style={styles.statusSectionLabel}>Status</Text>
            <Pressable
              style={({ pressed }) => [
                styles.dropdownTrigger,
                isDropdownOpen && styles.dropdownTriggerActive,
                pressed && styles.dropdownTriggerPressed,
              ]}
              disabled={updateStatusMutation.isPending || !isOwner}
              onPress={() => {
                if (isOwner) setIsDropdownOpen((prev) => !prev);
              }}>
              <View style={styles.dropdownLeft}>
                <StatusBadge status={data.status} />
              </View>
              <View style={styles.dropdownRight}>
                {updateStatusMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                ) : isOwner ? (
                  <View style={styles.dropdownActionHint}>
                    <Text style={styles.dropdownHintText}>Change</Text>
                    <Ionicons
                      name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={Colors.light.textSecondary}
                    />
                  </View>
                ) : null}
              </View>
            </Pressable>

            {isDropdownOpen ? (
              <View style={styles.dropdownMenu}>
                {JOB_STATUS_OPTIONS.map((item, idx) => {
                  const isSelected = item.status === data.status;
                  return (
                    <Pressable
                      key={item.status}
                      disabled={updateStatusMutation.isPending}
                      style={({ pressed }) => [
                        styles.dropdownOption,
                        idx > 0 && styles.dropdownOptionBorder,
                        isSelected && styles.dropdownOptionSelected,
                        pressed && styles.dropdownOptionPressed,
                      ]}
                      onPress={() => handleStatusSelect(item.status)}>
                      <View style={styles.dropdownOptionLeft}>
                        <StatusBadge status={item.status} />
                      </View>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={Colors.light.primary}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>

        {data.motor ? (
          <Pressable
            style={({ pressed }) => [styles.motorCard, pressed && styles.cardPressed]}
            onPress={() => router.push(`/(app)/shared/motor/${data.motorId}`)}>
            <View style={styles.motorTop}>
              <Text style={styles.sectionLabel}>Target Motor</Text>
              <Text style={styles.linkText}>View Motor →</Text>
            </View>
            <Text style={styles.motorNumber}>{data.motor.motorNumber}</Text>
            <Text style={styles.customer}>{data.motor.customerName}</Text>
          </Pressable>
        ) : null}

        {data.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.sectionLabel}>Instructions & Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Tasks ({data.tasks?.length ?? 0})
          </Text>
          {isOwner ? (
            <Button
              title="Add Task"
              variant="secondary"
              onPress={() => router.push(`/(app)/shared/job/${id}/add-task`)}
            />
          ) : null}
        </View>

        {(data.tasks?.length ?? 0) === 0 ? (
          <EmptyState
            icon="construct-outline"
            title="No tasks created"
            description="Add tasks to assign work steps to floor technicians."
            actionTitle={isOwner ? 'Add First Task' : undefined}
            onAction={
              isOwner
                ? () => router.push(`/(app)/shared/job/${id}/add-task`)
                : undefined
            }
          />
        ) : (
          <View style={styles.cardGroup}>
            {data.tasks?.map((task, idx) => (
              <Pressable
                key={task.id}
                style={({ pressed }) => [
                  styles.taskRow,
                  idx > 0 && styles.rowBorder,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => router.push(`/(app)/shared/task/${task.id}`)}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.assignedEmployee ? (
                    <Text style={styles.assignee}>
                      Assigned: {task.assignedEmployee.name}
                    </Text>
                  ) : (
                    <Text style={styles.unassigned}>Unassigned</Text>
                  )}
                </View>
                <StatusBadge status={task.status} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.footerActions}>
          <Button
            title="View Job Audit History"
            variant="ghost"
            onPress={() => router.push(`/(app)/shared/job/${id}/history`)}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  centerBox: {
    paddingVertical: Spacing.xxxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroMain: {
    flex: 1,
    marginRight: Spacing.md,
  },
  num: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  created: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  statusSectionLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.backgroundSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 46,
  },
  dropdownTriggerActive: {
    borderColor: Colors.light.primary,
  },
  dropdownTriggerPressed: {
    opacity: 0.8,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownActionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dropdownHintText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  dropdownMenu: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  dropdownOptionBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  dropdownOptionSelected: {
    backgroundColor: Colors.light.backgroundSubtle,
  },
  dropdownOptionPressed: {
    backgroundColor: Colors.light.secondary,
  },
  dropdownOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  motorCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    gap: 3,
  },
  cardPressed: {
    opacity: 0.85,
  },
  motorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  linkText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  motorNumber: {
    ...Typography.headline,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  customer: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  notesBox: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  notesText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.headline,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardGroup: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  rowPressed: {
    backgroundColor: Colors.light.secondary,
  },
  taskInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  taskTitle: {
    ...Typography.headline,
    fontSize: 15,
    color: Colors.light.text,
  },
  assignee: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  unassigned: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  footerActions: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
});
