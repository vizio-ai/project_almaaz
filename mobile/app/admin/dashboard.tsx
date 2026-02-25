import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg';
import { useSession } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { useAdminDashboard } from '@shared/admin';
import { AppHeader, AppText, colors, spacing, typography, radii } from '@shared/ui-kit';
import type { DailyCount, AdminUser } from '@shared/admin';

// ── Line chart ────────────────────────────────────────────────────────────────

const Y_LABEL_W = 36;
const PLOT_H = 130;
const CHART_H = PLOT_H + 28;

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function niceMax(value: number): number {
  if (value === 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / magnitude) * magnitude;
}

function formatYLabel(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

interface UserLineChartProps {
  width: number;
  dailyCounts: DailyCount[];
}

function UserLineChart({ width, dailyCounts }: UserLineChartProps) {
  const plotW = width - Y_LABEL_W - 4;
  const counts = dailyCounts.map(d => d.count);
  const yMax = niceMax(Math.max(...counts, 1));
  const ySteps = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0].map(Math.round);

  const getX = (i: number) => Y_LABEL_W + (i / Math.max(counts.length - 1, 1)) * plotW;
  const getY = (val: number) => (1 - val / yMax) * PLOT_H;

  const points = counts
    .map((v, i) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`)
    .join(' ');

  const weekDays = dailyCounts.map(d => DAY_INITIALS[new Date(d.date).getDay()]);

  return (
    <Svg width={width} height={CHART_H}>
      {ySteps.map((step, i) => {
        const y = getY(step);
        return (
          <React.Fragment key={i}>
            <Line
              x1={Y_LABEL_W}
              y1={y}
              x2={width - 4}
              y2={y}
              stroke={colors.light.borderMuted}
              strokeWidth={1}
            />
            <SvgText
              x={Y_LABEL_W - 4}
              y={y + 4}
              textAnchor="end"
              fontSize={10}
              fill={colors.light.subText}
            >
              {formatYLabel(step)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {counts.length > 1 && (
        <Polyline
          points={points}
          fill="none"
          stroke={colors.light.mainText}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {weekDays.map((day, i) => (
        <SvgText
          key={`${day}-${i}`}
          x={getX(i)}
          y={PLOT_H + 20}
          textAnchor="middle"
          fontSize={12}
          fill={colors.light.subText}
        >
          {day}
        </SvgText>
      ))}
    </Svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  user: AdminUser | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ user, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!user) return null;
  const activating = !user.isActive;
  const title = activating ? 'Activate Account?' : 'Deactivate Account?';
  const message = activating
    ? 'Are you sure you want to activate this user? They will regain access to the platform immediately.'
    : 'Are you sure you want to deactivate this user? They will lose access to the platform immediately.';
  const confirmLabel = activating ? 'Activate' : 'Deactivate';

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <Pressable style={dialogStyles.overlay} onPress={onCancel}>
        <Pressable style={dialogStyles.card} onPress={() => {}}>
          <AppText style={dialogStyles.title}>{title}</AppText>
          <AppText style={dialogStyles.message}>{message}</AppText>
          <View style={dialogStyles.buttonRow}>
            <TouchableOpacity
              style={[dialogStyles.btn, dialogStyles.btnCancel]}
              activeOpacity={0.7}
              onPress={onCancel}
            >
              <AppText style={dialogStyles.btnCancelText}>Cancel</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dialogStyles.btn, dialogStyles.btnConfirm]}
              activeOpacity={0.7}
              onPress={onConfirm}
            >
              <AppText style={dialogStyles.btnConfirmText}>{confirmLabel}</AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  card: {
    width: '100%',
    backgroundColor: colors.light.background,
    borderRadius: radii.lg,
    padding: spacing['2xl'],
  },
  title: {
    ...typography.lg,
    fontWeight: typography.weights.bold,
    color: colors.light.mainText,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.sm,
    color: colors.light.subText,
    lineHeight: 20,
    marginBottom: spacing['2xl'],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: colors.light.borderMuted,
  },
  btnCancelText: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
    color: colors.light.mainText,
  },
  btnConfirm: {
    backgroundColor: colors.light.mainText,
  },
  btnConfirmText: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
    color: colors.light.background,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const { session } = useSession();
  const { profile, isLoading } = useProfile(session?.user.id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!session) { router.replace('/(tabs)/profile'); return; }
    if (isLoading || profile === null) return;
    if (!isAdmin) router.replace('/(tabs)/profile');
  }, [session, profile, isAdmin, isLoading, router]);

  if (!session || isLoading || profile === null) return null;

  return <AdminDashboardContent screenWidth={screenWidth} insets={insets} />;
}

// Split out so useAdminDashboard is only called after the guard passes
function AdminDashboardContent({
  screenWidth,
  insets,
}: {
  screenWidth: number;
  insets: { bottom: number };
}) {
  const {
    stats,
    users,
    pageCount,
    currentPage,
    isLoadingStats,
    isLoadingUsers,
    goToPage,
    toggleUserActive,
  } = useAdminDashboard();

  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null);

  const cardInnerW = screenWidth - spacing['2xl'] * 2 - spacing.lg * 2;

  const weeklyGainPercent =
    stats && stats.totalUsers > stats.weeklyGain && stats.totalUsers > 0
      ? ((stats.weeklyGain / (stats.totalUsers - stats.weeklyGain)) * 100).toFixed(1)
      : null;

  const visiblePages = Array.from({ length: Math.min(pageCount, 2) }, (_, i) => i + 1);

  return (
    <View style={styles.root}>
      <AppHeader
        variant="dark"
        showAdminLabel
        right={
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <AppText style={styles.pageTitle}>Dashboard</AppText>
          <TouchableOpacity style={styles.filterPill} activeOpacity={0.7}>
            <AppText style={styles.filterPillText}>Last 30 Days</AppText>
            <Ionicons name="chevron-down" size={14} color={colors.light.subText} />
          </TouchableOpacity>
        </View>

        {/* Number of Users */}
        <View style={styles.card}>
          <View style={styles.statHeader}>
            <AppText style={styles.cardLabel}>Number of Users</AppText>
            {weeklyGainPercent != null && (
              <View style={styles.growthBadge}>
                <AppText style={styles.growthText}>+{weeklyGainPercent}% This week</AppText>
              </View>
            )}
          </View>
          {isLoadingStats ? (
            <ActivityIndicator size="small" color={colors.light.mainText} />
          ) : (
            <AppText style={styles.statValue}>
              {formatNumber(stats?.totalUsers ?? 0)}
            </AppText>
          )}
        </View>

        {/* User Gained chart */}
        <View style={styles.card}>
          <AppText style={styles.cardLabel}>User Gained This Week</AppText>
          <View style={styles.chartHeader}>
            {isLoadingStats ? (
              <ActivityIndicator size="small" color={colors.light.mainText} />
            ) : (
              <AppText style={styles.chartValue}>
                {formatNumber(stats?.weeklyGain ?? 0)}
              </AppText>
            )}
            <TouchableOpacity style={styles.filterPill} activeOpacity={0.7}>
              <AppText style={styles.filterPillText}>Weekly</AppText>
              <Ionicons name="chevron-down" size={14} color={colors.light.subText} />
            </TouchableOpacity>
          </View>
          {!isLoadingStats && stats?.dailyCounts.length ? (
            <UserLineChart width={cardInnerW} dailyCounts={stats.dailyCounts} />
          ) : null}
        </View>

        {/* List of Users */}
        <View style={styles.card}>
          <AppText style={styles.cardLabel}>List Of Users</AppText>

          {isLoadingUsers ? (
            <ActivityIndicator
              size="small"
              color={colors.light.mainText}
              style={{ marginVertical: spacing.lg }}
            />
          ) : (
            users.map((user, index) => (
              <React.Fragment key={user.id}>
                {index > 0 && <View style={styles.separator} />}
                <View style={styles.userRow}>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <AppText style={styles.userName}>
                        {user.displayId} {user.name}
                      </AppText>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="open-outline"
                          size={13}
                          color={colors.light.subText}
                        />
                      </TouchableOpacity>
                    </View>
                    <AppText style={styles.userJoined}>Joined: {user.joined}</AppText>
                  </View>

                  <View style={styles.userToggleCol}>
                    <Switch
                      value={user.isActive}
                      onValueChange={() => setPendingUser(user)}
                      trackColor={{
                        true: colors.light.mainText,
                        false: colors.light.borderMuted,
                      }}
                      thumbColor={colors.light.background}
                      ios_backgroundColor={colors.light.borderMuted}
                    />
                    <AppText
                      style={[
                        styles.toggleLabel,
                        { color: user.isActive ? colors.light.mainText : colors.light.subText },
                      ]}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </AppText>
                  </View>
                </View>
              </React.Fragment>
            ))
          )}

          {/* Pagination */}
          <View style={styles.pagination}>
            <TouchableOpacity
              style={styles.pageBtn}
              activeOpacity={0.7}
              onPress={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <Ionicons name="chevron-back" size={14} color={colors.light.subText} />
              <AppText style={styles.pageBtnText}>Previous</AppText>
            </TouchableOpacity>

            <View style={styles.pageNums}>
              {visiblePages.map(page => (
                <TouchableOpacity
                  key={page}
                  style={[
                    styles.pageNumBtn,
                    currentPage === page && styles.pageNumBtnActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => goToPage(page)}
                >
                  <AppText
                    style={[
                      styles.pageNumText,
                      currentPage === page && styles.pageNumTextActive,
                    ]}
                  >
                    {page}
                  </AppText>
                </TouchableOpacity>
              ))}
              {pageCount > 2 && (
                <AppText style={styles.pageDots}>···</AppText>
              )}
            </View>

            <TouchableOpacity
              style={styles.pageBtn}
              activeOpacity={0.7}
              onPress={() => goToPage(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage === pageCount}
            >
              <AppText style={styles.pageBtnText}>Next</AppText>
              <Ionicons name="chevron-forward" size={14} color={colors.light.subText} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        user={pendingUser}
        onCancel={() => setPendingUser(null)}
        onConfirm={() => {
          if (pendingUser) toggleUserActive(pendingUser.id);
          setPendingUser(null);
        }}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.light.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    gap: spacing.md,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  pageTitle: {
    ...typography['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.light.mainText,
  },

  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.light.borderMuted,
  },
  filterPillText: {
    ...typography.sm,
    color: colors.light.subText,
  },

  card: {
    backgroundColor: colors.light.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.light.borderMuted,
    padding: spacing.lg,
    shadowColor: colors.light.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLabel: {
    ...typography.sm,
    color: colors.light.subText,
    marginBottom: spacing.sm,
  },

  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  growthBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  growthText: {
    ...typography.xs,
    fontWeight: typography.weights.medium,
    color: '#16A34A',
  },
  statValue: {
    ...typography['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.light.mainText,
  },

  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  chartValue: {
    ...typography['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.light.mainText,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  userInfo: { flex: 1 },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 3,
  },
  userName: {
    ...typography.sm,
    fontWeight: typography.weights.semibold,
    color: colors.light.mainText,
  },
  userJoined: {
    ...typography.xs,
    color: colors.light.subText,
  },
  userToggleCol: {
    alignItems: 'center',
    gap: 2,
  },
  toggleLabel: {
    ...typography.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.light.borderMuted,
  },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.light.borderMuted,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pageBtnText: {
    ...typography.sm,
    color: colors.light.subText,
  },
  pageNums: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pageNumBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumBtnActive: {
    backgroundColor: colors.light.mainText,
  },
  pageNumText: {
    ...typography.sm,
    color: colors.light.subText,
  },
  pageNumTextActive: {
    color: colors.light.background,
    fontWeight: typography.weights.medium,
  },
  pageDots: {
    ...typography.sm,
    color: colors.light.subText,
    letterSpacing: 1,
  },
});
