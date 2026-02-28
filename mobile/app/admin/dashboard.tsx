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
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Text as SvgText } from 'react-native-svg';
import { useSession } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { useAdminDashboard, formatRangeLabel } from '@shared/admin';
import { AppHeader, AppText, AppTabBar, colors, spacing, typography, radii } from '@shared/ui-kit';
import type { TabKey } from '@shared/ui-kit';
import type { DailyCount, AdminUser, DateRange } from '@shared/admin';
import { Calendar } from 'react-native-calendars';

// ── Line chart ────────────────────────────────────────────────────────────────

const Y_LABEL_W = 40;
const PLOT_LEFT = 12;
const PLOT_TOP = 10;
const PLOT_H = 130;
const CHART_H = PLOT_TOP + PLOT_H + 44;

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

interface WeeklyCount {
  label: string;
  count: number;
}

function groupByWeek(dailyCounts: DailyCount[]): WeeklyCount[] {
  if (dailyCounts.length === 0) return [];
  const weeks: WeeklyCount[] = [];
  let i = 0;
  while (i < dailyCounts.length) {
    const chunk = dailyCounts.slice(i, i + 7);
    const totalCount = chunk.reduce((sum, d) => sum + d.count, 0);
    const startDate = new Date(chunk[0].date);
    const day = startDate.getDate();
    const month = startDate.toLocaleString('en-US', { month: 'short' });
    weeks.push({ label: `${day} ${month}`, count: totalCount });
    i += 7;
  }
  return weeks;
}

interface UserLineChartProps {
  width: number;
  dailyCounts: DailyCount[];
}

function UserLineChart({ width, dailyCounts }: UserLineChartProps) {
  const plotW = width - Y_LABEL_W - 4 - PLOT_LEFT;

  const weeklyData = groupByWeek(dailyCounts);
  const counts = weeklyData.map(w => w.count);
  const labels = weeklyData.map(w => w.label);

  const yMax = niceMax(Math.max(...counts, 1));
  const ySteps = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0].map(Math.round);

  const getX = (i: number) => PLOT_LEFT + (i / Math.max(counts.length - 1, 1)) * plotW;
  const getY = (val: number) => PLOT_TOP + (1 - val / yMax) * PLOT_H;

  const points = counts
    .map((v, i) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`)
    .join(' ');

  return (
    <Svg width={width} height={CHART_H}>
      {ySteps.map((step, i) => {
        const y = getY(step);
        return (
          <React.Fragment key={i}>
            <SvgText
              x={PLOT_LEFT + plotW + 16}
              y={y + 4}
              textAnchor="start"
              fontSize={12}
              fontWeight="500"
              fill="#737373"
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

      {labels.map((label, i) => (
        <SvgText
          key={`${label}-${i}`}
          x={getX(i)}
          y={PLOT_TOP + PLOT_H + 24}
          textAnchor="middle"
          fontSize={10}
          fill={colors.light.subText}
        >
          {label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
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

const TAB_ROUTES: Record<TabKey, string> = {
  index:      '/(tabs)/',
  'my-trips': '/(tabs)/my-trips',
  create:     '/(tabs)/create',
  discover:   '/(tabs)/discover',
  profile:    '/(tabs)/profile',
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const { session } = useSession();
  const { profile, isLoading } = useProfile(session?.user.id);
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!session) { router.replace('/(tabs)/profile'); return; }
    if (isLoading || profile === null) return;
    if (!isAdmin) router.replace('/(tabs)/profile');
  }, [session, profile, isAdmin, isLoading, router]);

  if (!session || isLoading || profile === null) return null;

  return <AdminDashboardContent screenWidth={screenWidth} />;
}

// Split out so useAdminDashboard is only called after the guard passes
function AdminDashboardContent({
  screenWidth,
}: {
  screenWidth: number;
}) {
  const router = useRouter();
  const {
    stats,
    users,
    pageCount,
    currentPage,
    isLoadingStats,
    isLoadingUsers,
    dateRange,
    setDateRange,
    goToPage,
    toggleUserActive,
  } = useAdminDashboard();

  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [draftEnd, setDraftEnd] = useState<string | null>(null);

  const cardInnerW = screenWidth - spacing['2xl'] * 2 - spacing.lg * 2;

  const weeklyGainPercent =
    stats && stats.totalUsers > stats.weeklyGain && stats.totalUsers > 0
      ? ((stats.weeklyGain / (stats.totalUsers - stats.weeklyGain)) * 100).toFixed(1)
      : null;

  const visiblePages = Array.from({ length: Math.min(pageCount, 2) }, (_, i) => i + 1);

  // Build markedDates for react-native-calendars period marking
  const markedDates: Record<string, any> = React.useMemo(() => {
    const start = draftStart ?? dateRange.startDate;
    const end = draftEnd ?? (draftStart ? null : dateRange.endDate);
    if (!start) return {};
    const marks: Record<string, any> = {};
    marks[start] = { startingDay: true, color: colors.light.mainText, textColor: colors.light.background };
    if (end && end >= start) {
      // Fill days in between
      const cur = new Date(start);
      const last = new Date(end);
      cur.setDate(cur.getDate() + 1);
      while (cur < last) {
        const key = cur.toISOString().slice(0, 10);
        marks[key] = { color: colors.light.borderMuted, textColor: colors.light.mainText };
        cur.setDate(cur.getDate() + 1);
      }
      marks[end] = { endingDay: true, color: colors.light.mainText, textColor: colors.light.background };
    }
    return marks;
  }, [draftStart, draftEnd, dateRange]);

  function handleDayPress(day: { dateString: string }) {
    const picked = day.dateString;
    if (!draftStart || (draftStart && draftEnd)) {
      // Start fresh selection
      setDraftStart(picked);
      setDraftEnd(null);
    } else {
      // Have start, picking end
      if (picked >= draftStart) {
        setDraftEnd(picked);
      } else {
        // Picked date is before start → reset with new start
        setDraftStart(picked);
        setDraftEnd(null);
      }
    }
  }

  function openPicker() {
    setDraftStart(dateRange.startDate);
    setDraftEnd(dateRange.endDate);
    setShowRangePicker(true);
  }

  function applyRange() {
    if (draftStart && draftEnd) {
      const start = new Date(draftStart);
      const end = new Date(draftEnd);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

      let effectiveEnd = draftEnd;
      if (diffDays < 6) {
        const minEnd = new Date(start);
        minEnd.setDate(minEnd.getDate() + 6);
        effectiveEnd = minEnd.toISOString().slice(0, 10);
      }

      setDateRange({ startDate: draftStart, endDate: effectiveEnd });
    }
    setShowRangePicker(false);
  }

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
          { paddingBottom: spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <AppText style={styles.pageTitle}>Dashboard</AppText>
          <TouchableOpacity
            style={styles.filterPill}
            activeOpacity={0.7}
            onPress={openPicker}
          >
            <AppText style={styles.filterPillText}>{formatRangeLabel(dateRange)}</AppText>
            <Ionicons name="chevron-down" size={14} color={colors.light.subText} />
          </TouchableOpacity>
        </View>

        {/* Calendar date range picker modal */}
        <Modal
          transparent
          animationType="slide"
          visible={showRangePicker}
          onRequestClose={() => setShowRangePicker(false)}
        >
          <Pressable style={calendarStyles.overlay} onPress={() => setShowRangePicker(false)}>
            <Pressable style={calendarStyles.sheet} onPress={() => {}}>
              <View style={calendarStyles.handle} />

              {/* Header */}
              <View style={calendarStyles.header}>
                <AppText style={calendarStyles.title}>Select Date Range</AppText>
                <TouchableOpacity onPress={() => setShowRangePicker(false)} activeOpacity={0.7}>
                  <Ionicons name="close" size={22} color={colors.light.mainText} />
                </TouchableOpacity>
              </View>

              {/* Selected range preview */}
              <View style={calendarStyles.preview}>
                <View style={calendarStyles.previewItem}>
                  <AppText style={calendarStyles.previewLabel}>Start</AppText>
                  <AppText style={calendarStyles.previewDate}>
                    {draftStart ? formatDisplayDate(draftStart) : '—'}
                  </AppText>
                </View>
                <View style={calendarStyles.previewDash}>
                  <Ionicons name="arrow-forward" size={16} color={colors.light.subText} />
                </View>
                <View style={calendarStyles.previewItem}>
                  <AppText style={calendarStyles.previewLabel}>End</AppText>
                  <AppText style={calendarStyles.previewDate}>
                    {draftEnd ? formatDisplayDate(draftEnd) : '—'}
                  </AppText>
                </View>
              </View>

              {/* Hint */}
              <AppText style={calendarStyles.hint}>
                {!draftStart || draftEnd ? 'Tap a start date' : 'Tap an end date'}
              </AppText>

              {/* Calendar */}
              <Calendar
                markingType="period"
                markedDates={markedDates}
                onDayPress={handleDayPress}
                maxDate={new Date().toISOString().slice(0, 10)}
                theme={{
                  todayTextColor: colors.light.mainText,
                  selectedDayBackgroundColor: colors.light.mainText,
                  arrowColor: colors.light.mainText,
                  textDayFontSize: 14,
                  textMonthFontSize: 14,
                  textDayHeaderFontSize: 12,
                  calendarBackground: colors.light.background,
                  dayTextColor: colors.light.mainText,
                  textDisabledColor: colors.light.borderMuted,
                  monthTextColor: colors.light.mainText,
                }}
              />

              {/* Apply button */}
              <TouchableOpacity
                style={[calendarStyles.applyBtn, !(draftStart && draftEnd) && calendarStyles.applyBtnDisabled]}
                activeOpacity={0.8}
                onPress={applyRange}
                disabled={!draftStart || !draftEnd}
              >
                <AppText style={calendarStyles.applyBtnText}>Apply</AppText>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

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
                      style={{ backgroundColor: colors.light.background }}
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

      <AppTabBar
        activeKey="profile"
        onPress={(key) => router.replace(TAB_ROUTES[key] as any)}
      />

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
    ...typography['2xl'],
    fontWeight: typography.weights.semibold,
    color: colors.light.mainText,
  },

  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.light.borderMuted,
  },
  filterPillText: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
    color: colors.light.subLabelText,
  },

  card: {
    backgroundColor: colors.light.background,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.light.borderMutedLight,
    padding: spacing.lg,
    shadowColor: colors.light.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLabel: {
    ...typography.sm,
    color: colors.light.subLabelText,
    fontWeight: typography.weights.medium,
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
    ...typography['3xl'],
    fontWeight: typography.weights.medium,
    color: colors.light.statText,
  },

  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  chartValue: {
    ...typography['2xl'],
    fontWeight: typography.weights.medium,
    color: colors.light.headerBg,
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
    fontWeight: typography.weights.medium,
    color: colors.light.statText,
  },
  userJoined: {
    ...typography.xs,
    color: colors.light.userJoinedText,
    fontWeight: typography.weights.regular,
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

const calendarStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.light.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing['3xl'],
    paddingHorizontal: spacing['2xl'],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.light.borderMuted,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.lg,
    fontWeight: typography.weights.semibold,
    color: colors.light.mainText,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  previewItem: { alignItems: 'center' },
  previewLabel: {
    ...typography.xs,
    color: colors.light.subText,
    marginBottom: 2,
  },
  previewDate: {
    ...typography.base,
    fontWeight: typography.weights.semibold,
    color: colors.light.mainText,
  },
  previewDash: { paddingTop: spacing.sm },
  hint: {
    ...typography.xs,
    color: colors.light.subText,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  applyBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.light.mainText,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.4,
  },
  applyBtnText: {
    ...typography.sm,
    fontWeight: typography.weights.semibold,
    color: colors.light.background,
  },
});
