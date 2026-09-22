import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
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
import { useEmployeeStatusDashboard } from '@/hooks/useEmployees';
import { useGlobalHistory } from '@/hooks/useHistory';
import { useJobs } from '@/hooks/useJobs';
import { useAuthStore } from '@/store/useAuthStore';
import type { Job, Task } from '@/types/domain';
import { formatDateTime } from '@/utils/formatters';

export default function DashboardScreen() {
  const activeActorName = useAuthStore((s) => s.activeActorName);
  const activeActorRole = useAuthStore((s) => s.activeActorRole);

  const jobsQuery = useJobs({ limit: 50 });
  const statusQuery = useEmployeeStatusDashboard();
  const historyQuery = useGlobalHistory({ limit: 4 });

  const isLoading = jobsQuery.isLoading || statusQuery.isLoading;
  const isRefetching =
    jobsQuery.isRefetching || statusQuery.isRefetching || historyQuery.isRefetching;
  const error = jobsQuery.error || statusQuery.error;

  const handleRefresh = () => {
    jobsQuery.refetch();
    statusQuery.refetch();
    historyQuery.refetch();
  };

  const allJobs: Job[] = jobsQuery.data?.items ?? [];
  const team = statusQuery.data ?? [];

  // 1. Calculate operational counts
  const incomingCount = allJobs.filter((j) => j.status === 'RECEIVED').length;
  const activeCount = allJobs.filter(
    (j) => j.status === 'IN_PROGRESS' || j.status === 'TESTING',
  ).length;
  const readyCount = allJobs.filter(
    (j) => j.status === 'READY_FOR_DELIVERY',
  ).length;

  // Active jobs for the main feed
  const activeJobs = allJobs.filter(
    (j) => j.status !== 'DELIVERED' && j.status !== 'CANCELLED',
  );
  const displayedJobs = activeJobs.slice(0, 5);

  // 2. Gather tasks needing attention
  const allTeamTasks: (Task & { assigneeName?: string })[] = [];
  team.forEach((emp) => {
    (emp.activeTasks ?? []).forEach((t) => {
      allTeamTasks.push({ ...t, assigneeName: emp.name });
    });
  });

  const attentionTasks = allTeamTasks.filter(
    (t) => t.status === 'PENDING' || !t.assignedEmployeeId,
  );

  // 3. Recent activity: use history endpoint if available, otherwise derive from real jobs & tasks
  const rawHistory = historyQuery.data?.history ?? [];
  let recentActivities: {
    id: string;
    action: string;
    description?: string | null;
    actor: string;
    createdAt: string;
  }[] = [];

  if (rawHistory.length > 0) {
    recentActivities = rawHistory.map((h) => ({
      id: h.id,
      action: h.action
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      description: h.description,
      actor: h.actorEmployee?.name ?? 'System',
      createdAt: h.createdAt,
    }));
  } else {
    // Derive real events from jobs and their tasks
    const jobEvents: typeof recentActivities = [];
    allJobs.forEach((job) => {
      const customer = job.motor?.customerName ? ` (${job.motor.customerName})` : '';
      if (job.updatedAt && job.updatedAt !== job.createdAt) {
        jobEvents.push({
          id: `${job.id}-status`,
          action: `Job ${job.status.replace(/_/g, ' ')}`,
          description: `Job #${job.jobNumber}${customer} status updated`,
          actor: 'Workshop',
          createdAt: job.updatedAt,
        });
      }
      jobEvents.push({
        id: `${job.id}-created`,
        action: 'Job Received',
        description: `Job #${job.jobNumber}${customer} registered`,
        actor: 'Workshop',
        createdAt: job.createdAt,
      });
      (job.tasks ?? []).forEach((t) => {
        if (t.completedAt) {
          jobEvents.push({
            id: `${t.id}-completed`,
            action: 'Task Completed',
            description: `${t.title} • Job #${job.jobNumber}`,
            actor: 'Technician',
            createdAt: t.completedAt,
          });
        } else if (t.startedAt) {
          jobEvents.push({
            id: `${t.id}-started`,
            action: 'Task In Progress',
            description: `${t.title} • Job #${job.jobNumber}`,
            actor: 'Technician',
            createdAt: t.startedAt,
          });
        }
      });
    });

    jobEvents.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    recentActivities = jobEvents.slice(0, 4);
  }

  const ownerDisplayName = activeActorName?.trim() || 'Workshop Owner';

  return (
    <ScreenWrapper refreshing={isRefetching} onRefresh={handleRefresh}>
      <View style={styles.contentWrapper}>
        {/* 1. HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.headerTextGroup}>
            <View style={styles.brandRow}>
              <Ionicons name="flash" size={14} color={Colors.light.warning} />
              <Text style={styles.brandName}>HINDUSTAN ELECTRICALS</Text>
            </View>
            <Text style={styles.ownerGreeting}>{ownerDisplayName}</Text>
            <Text style={styles.subtitle}>Business Overview</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{activeActorRole}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.light.textSecondary} size="small" />
          </View>
        ) : error ? (
          <ErrorBanner
            message={parseApiError(error).message}
            onRetry={handleRefresh}
          />
        ) : (
          <>
            {/* 2. OPERATIONAL SUMMARY (TODAY) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>TODAY'S WORKSHOP SUMMARY</Text>
            </View>
            <View style={styles.summaryCard}>
              <Pressable
                style={styles.summaryStatItem}
                onPress={() => router.push('/(app)/owner/jobs')}>
                <Text style={styles.summaryStatLabel}>Incoming</Text>
                <Text style={styles.summaryStatVal}>{incomingCount}</Text>
              </Pressable>

              <View style={styles.summaryDivider} />

              <Pressable
                style={styles.summaryStatItem}
                onPress={() => router.push('/(app)/owner/jobs')}>
                <Text style={styles.summaryStatLabel}>Active</Text>
                <Text style={[styles.summaryStatVal, styles.activeText]}>
                  {activeCount}
                </Text>
              </Pressable>

              <View style={styles.summaryDivider} />

              <Pressable
                style={styles.summaryStatItem}
                onPress={() => router.push('/(app)/owner/jobs')}>
                <Text style={styles.summaryStatLabel}>Ready</Text>
                <Text style={[styles.summaryStatVal, styles.readyText]}>
                  {readyCount}
                </Text>
              </Pressable>
            </View>

            {/* 3. PRIMARY ACTION */}
            <View style={styles.primaryActionSection}>
              <Button
                title="+ Register Incoming Motor"
                onPress={() => router.push('/(app)/shared/motors/register')}
              />
            </View>

            {/* 4. ACTIVE WORKSHOP JOBS */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithCount}>
                <Text style={styles.sectionHeaderTitle}>ACTIVE WORKSHOP JOBS</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{activeJobs.length}</Text>
                </View>
              </View>
              {activeJobs.length > 0 ? (
<Pressable
                    hitSlop={8}
                    onPress={() => router.push('/(app)/owner/jobs')}>
                    <Text style={styles.viewAllText}>View all ›</Text>
                  </Pressable>
              ) : null}
            </View>

            {activeJobs.length === 0 ? (
              <EmptyState
                title="No active jobs"
                description="Incoming motor repairs will appear here when registered."
              />
            ) : (
              <View style={styles.group}>
                {displayedJobs.map((job, index) => {
                  const motorName = job.motor?.customerName
                    ? `${job.motor.customerName} • ${job.motor.brand || 'Motor'}`
                    : 'Customer Motor';
                  const jobIdentifier = job.motor?.motorNumber
                    ? `#${job.motor.motorNumber}`
                    : `#${job.jobNumber}`;
                  const taskTitle =
                    job.tasks?.[0]?.title || job.notes || 'Inspection & Overhaul';

                  // Find assigned staff if available
                  const assignedTask = job.tasks?.find(
                    (t) => Boolean(t.assignedEmployeeId),
                  );
                  const assignedEmployee = assignedTask?.assignedEmployeeId
                    ? team.find((e) => e.id === assignedTask.assignedEmployeeId)
                    : null;
                  const assignedLabel = assignedEmployee
                    ? `Assigned to: ${assignedEmployee.name}`
                    : 'Staff not assigned';

                  return (
                    <Pressable
                      key={job.id}
                      style={({ pressed }) => [
                        styles.jobRow,
                        index > 0 && styles.rowBorder,
                        pressed && styles.rowPressed,
                      ]}
                      onPress={() => router.push(`/(app)/shared/job/${job.id}`)}>
                      <View style={styles.jobMainInfo}>
                        <View style={styles.jobIdentifierRow}>
                          <Text style={styles.jobIdentifierText}>
                            {jobIdentifier}
                          </Text>
                          <Text style={styles.jobCustomerText} numberOfLines={1}>
                            {motorName}
                          </Text>
                        </View>
                        <Text style={styles.jobTaskText} numberOfLines={1}>
                          {taskTitle}
                        </Text>
                        <Text style={styles.jobAssigneeText} numberOfLines={1}>
                          {assignedLabel}
                        </Text>
                      </View>

                      <View style={styles.jobRightCol}>
                        <StatusBadge status={job.status} />
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={Colors.light.textMuted}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* 5. TASKS NEEDING ATTENTION (CONDITIONAL) */}
            {attentionTasks.length > 0 ? (
              <View style={styles.attentionSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleWithCount}>
                    <Text style={styles.sectionHeaderAttention}>
                      TASKS NEEDING ATTENTION
                    </Text>
                    <View style={styles.attentionCountPill}>
                      <Text style={styles.attentionCountPillText}>
                        {attentionTasks.length}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.group}>
                  {attentionTasks.slice(0, 3).map((task, index) => (
                    <Pressable
                      key={task.id}
                      style={({ pressed }) => [
                        styles.attentionRow,
                        index > 0 && styles.rowBorder,
                        pressed && styles.rowPressed,
                      ]}
                      onPress={() => router.push(`/(app)/shared/task/${task.id}`)}>
                      <View style={styles.attentionInfo}>
                        <Text style={styles.attentionTaskTitle}>
                          {task.title}
                        </Text>
                        <Text style={styles.attentionReason}>
                          {!task.assignedEmployeeId
                            ? 'Requires technician assignment'
                            : 'Pending start'}
                        </Text>
                      </View>
                      <View style={styles.attentionActionCol}>
                        <View style={styles.unassignedBadge}>
                          <Text style={styles.unassignedBadgeText}>
                            {!task.assignedEmployeeId ? 'Unassigned' : 'Pending'}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={Colors.light.textMuted}
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* 6. TEAM OVERVIEW */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithCount}>
                <Text style={styles.sectionHeaderTitle}>TEAM</Text>
                <Text style={styles.sectionSubCount}>
                  {team.length} member{team.length === 1 ? '' : 's'}
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => router.push('/(app)/owner/employees')}>
                <Text style={styles.viewAllText}>View all ›</Text>
              </Pressable>
            </View>

            {team.length === 0 ? (
              <EmptyState
                title="No staff members registered"
                description="Add team members to assign tasks."
              />
            ) : (
              <View style={styles.group}>
                {team.slice(0, 5).map((member, index) => {
                  const activeTasks = member.activeTaskCount ?? 0;
                  const isAvailable = activeTasks === 0;

                  return (
                    <Pressable
                      key={member.id}
                      style={({ pressed }) => [
                        styles.teamRow,
                        index > 0 && styles.rowBorder,
                        pressed && styles.rowPressed,
                      ]}
                      onPress={() => router.push(`/(app)/owner/employees/${member.id}`)}>
                      <View style={styles.teamAvatar}>
                        <Text style={styles.teamAvatarText}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.teamInfo}>
                        <Text style={styles.teamName}>{member.name}</Text>
                        <View style={styles.teamStatusRow}>
                          <View
                            style={[
                              styles.statusDot,
                              isAvailable ? styles.dotAvailable : styles.dotBusy,
                            ]}
                          />
                          <Text style={styles.teamTaskMeta}>
                            {isAvailable
                              ? 'Available'
                              : `${activeTasks} active task${activeTasks === 1 ? '' : 's'}`}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.teamRightCol}>
                        <StatusBadge status={member.role} />
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={Colors.light.textMuted}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* 7. RECENT ACTIVITY */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>RECENT ACTIVITY</Text>
              {recentActivities.length > 0 ? (
                <Pressable
                  hitSlop={8}
                  onPress={() => router.push('/(app)/owner/history')}>
                  <Text style={styles.viewAllText}>View all ›</Text>
                </Pressable>
              ) : null}
            </View>

            {recentActivities.length === 0 ? (
              <EmptyState
                title="No recent activity"
                description="Workshop events and updates will be logged here."
              />
            ) : (
              <View style={styles.group}>
                {recentActivities.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.activityRow,
                      index > 0 && styles.rowBorder,
                    ]}>
                    <View style={styles.activityIndicatorCol}>
                      <View style={styles.activityDot} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityActionText}>
                        {item.action}
                      </Text>
                      {item.description ? (
                        <Text
                          style={styles.activityDescText}
                          numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}
                      <Text style={styles.activityMetaText}>
                        {item.actor} • {formatDateTime(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingBottom: Spacing.xxl,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  headerTextGroup: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  brandName: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
  },
  ownerGreeting: {
    ...Typography.largeTitle,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  roleBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: 0.5,
  },
  loadingBox: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionHeaderTitle: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 0.6,
  },
  sectionHeaderAttention: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.warning,
    letterSpacing: 0.6,
  },
  sectionSubCount: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  countPill: {
    backgroundColor: Colors.light.surfaceSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  countPillText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  attentionCountPill: {
    backgroundColor: Colors.light.warningSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  attentionCountPillText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.warning,
  },
  viewAllText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.light.borderSubtle,
  },
  summaryStatLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryStatVal: {
    ...Typography.title,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  activeText: {
    color: Colors.light.primary,
  },
  warningText: {
    color: Colors.light.warning,
  },
  readyText: {
    color: Colors.light.success,
  },
  primaryActionSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  group: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  rowPressed: {
    backgroundColor: Colors.light.surfaceSubtle,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  jobMainInfo: {
    flex: 1,
  },
  jobIdentifierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  jobIdentifierText: {
    ...Typography.headline,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  jobCustomerText: {
    ...Typography.subhead,
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  jobTaskText: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  jobAssigneeText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  jobRightCol: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  attentionSection: {
    marginTop: Spacing.xs,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  attentionInfo: {
    flex: 1,
  },
  attentionTaskTitle: {
    ...Typography.headline,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  attentionReason: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.warning,
    fontWeight: '500',
  },
  attentionActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  unassignedBadge: {
    backgroundColor: Colors.light.warningSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  unassignedBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.warning,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  teamAvatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamAvatarText: {
    ...Typography.headline,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...Typography.headline,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  teamStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotAvailable: {
    backgroundColor: Colors.light.success,
  },
  dotBusy: {
    backgroundColor: Colors.light.textSecondary,
  },
  teamTaskMeta: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  teamRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  activityRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  activityIndicatorCol: {
    paddingTop: 5,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  activityContent: {
    flex: 1,
  },
  activityActionText: {
    ...Typography.headline,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  activityDescText: {
    ...Typography.body,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  activityMetaText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
});
