import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { DataTable } from '../components/DataTable';
import { Input } from '../components/Input';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import {
  api,
  RequestLogEntry,
  RequestLogSummary,
  SystemHealth,
} from '../services/api';
import { colors } from '../theme/colors';

type MonitorTab = 'OVERVIEW' | 'REQUEST_LOGS';

type SystemMonitorScreenProps = {
  token: string;
};

function formatUptime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

function durationVariant(ms: number): 'success' | 'warning' | 'error' {
  if (ms >= 2000) return 'error';
  if (ms >= 500) return 'warning';
  return 'success';
}

function statusVariant(code: number): 'success' | 'warning' | 'error' | 'neutral' {
  if (code >= 500) return 'error';
  if (code >= 400) return 'warning';
  if (code >= 200) return 'success';
  return 'neutral';
}

export function SystemMonitorScreen({ token }: SystemMonitorScreenProps) {
  const [tab, setTab] = useState<MonitorTab>('OVERVIEW');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [summary, setSummary] = useState<RequestLogSummary | null>(null);
  const [logs, setLogs] = useState<RequestLogEntry[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pathFilter, setPathFilter] = useState('');
  const [subscriberIdFilter, setSubscriberIdFilter] = useState('');
  const [companyIdFilter, setCompanyIdFilter] = useState('');
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [slowOnly, setSlowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadOverview = useCallback(async () => {
    const [healthData, summaryData] = await Promise.all([
      api.getSystemHealth(token),
      api.getRequestLogSummary(token, 60),
    ]);
    setHealth(healthData);
    setSummary(summaryData);
  }, [token]);

  const loadLogs = useCallback(async () => {
    const subscriberId = subscriberIdFilter.trim() ? Number(subscriberIdFilter) : undefined;
    const companyId = companyIdFilter.trim() ? Number(companyIdFilter) : undefined;
    const response = await api.getRequestLogs(token, {
      page,
      size: pageSize,
      subscriberId: Number.isFinite(subscriberId) ? subscriberId : undefined,
      companyId: Number.isFinite(companyId) ? companyId : undefined,
      path: pathFilter.trim() || undefined,
      errorsOnly,
      slowOnly,
    });
    setLogs(response.content);
    setTotalPages(response.totalPages);
    setTotalElements(response.totalElements);
  }, [token, page, pageSize, pathFilter, subscriberIdFilter, companyIdFilter, errorsOnly, slowOnly]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'OVERVIEW') {
        await loadOverview();
      } else {
        await loadLogs();
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitor data');
    } finally {
      setLoading(false);
    }
  }, [tab, loadOverview, loadLogs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }
    const timer = setInterval(() => {
      refresh();
    }, 10000);
    return () => clearInterval(timer);
  }, [autoRefresh, refresh]);

  const overviewStats = health
    ? [
        {
          label: 'API Status',
          value: health.status,
          hint: health.service,
          variant: health.status === 'UP' ? 'success' : 'error',
        },
        {
          label: 'Database',
          value: health.database.status,
          hint: `${health.database.responseTimeMs} ms ping`,
          variant: health.database.status === 'UP' ? 'success' : 'error',
        },
        {
          label: 'Heap Memory',
          value: `${health.jvm.heapUsedMb} / ${health.jvm.heapMaxMb} MB`,
          hint: `Uptime ${formatUptime(health.jvm.uptimeSeconds)}`,
          variant: 'primary' as const,
        },
        {
          label: 'Requests (60m)',
          value: String(summary?.totalRequests ?? health.recentTraffic.totalRequests),
          hint: `${summary?.errorCount ?? health.recentTraffic.errorCount} errors`,
          variant: 'neutral' as const,
        },
        {
          label: 'Avg Response',
          value: `${summary?.avgDurationMs ?? health.recentTraffic.avgDurationMs} ms`,
          hint: `Max ${summary?.maxDurationMs ?? health.recentTraffic.maxDurationMs} ms`,
          variant: 'neutral' as const,
        },
        {
          label: 'Stored Logs',
          value: String(health.monitoring.storedLogs),
          hint: `${health.monitoring.retentionDays}-day retention`,
          variant: 'neutral' as const,
        },
      ]
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PageHeader
        title="System Monitor"
        subtitle="API request timing, subscriber/company context, and application health"
        action={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setAutoRefresh((value) => !value)}
              style={[styles.toggle, autoRefresh ? styles.toggleOn : null]}
            >
              <Text style={styles.toggleText}>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</Text>
            </Pressable>
            <Button title="Refresh" variant="secondary" onPress={refresh} />
          </View>
        }
      />

      {lastUpdated ? (
        <Text style={styles.updatedAt}>Last updated {lastUpdated.toLocaleTimeString()}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.tabs}>
        {(['OVERVIEW', 'REQUEST_LOGS'] as MonitorTab[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              setTab(item);
              setPage(0);
            }}
            style={[styles.tab, tab === item ? styles.tabActive : null]}
          >
            <Text style={[styles.tabText, tab === item ? styles.tabTextActive : null]}>
              {item === 'OVERVIEW' ? 'Health' : 'Request Logs'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && !health && logs.length === 0 ? (
        <ActivityIndicator color={colors.primary} />
      ) : null}

      {tab === 'OVERVIEW' ? (
        <View style={styles.section}>
          <View style={styles.grid}>
            {overviewStats.map((stat) => (
              <View key={stat.label} style={styles.gridItem}>
                <Card>
                  <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <Badge label={stat.value} variant={stat.variant} />
                  </View>
                  <Text style={styles.statHint}>{stat.hint}</Text>
                </Card>
              </View>
            ))}
          </View>

          {summary && summary.slowestEndpoints.length > 0 ? (
            <Card>
              <Text style={styles.sectionTitle}>Slowest endpoints (last 60 min)</Text>
              <DataTable
                columns={[
                  { key: 'method', label: 'Method', minWidth: 70 },
                  { key: 'path', label: 'Path', flex: 2 },
                  { key: 'requestCount', label: 'Count', minWidth: 70 },
                  {
                    key: 'avgDurationMs',
                    label: 'Avg ms',
                    minWidth: 90,
                    render: (row) => (
                      <Badge label={`${row.avgDurationMs} ms`} variant={durationVariant(row.avgDurationMs)} />
                    ),
                  },
                  { key: 'maxDurationMs', label: 'Max ms', minWidth: 90 },
                ]}
                rows={summary.slowestEndpoints}
                keyExtractor={(row) => `${row.method}-${row.path}`}
                emptyText="No traffic recorded yet"
              />
            </Card>
          ) : null}
        </View>
      ) : (
        <View style={styles.section}>
          <Card>
            <View style={styles.filters}>
              <View style={styles.filterItem}>
                <Input
                  label="Path contains"
                  value={pathFilter}
                  onChangeText={setPathFilter}
                  placeholder="/api/subscriber"
                />
              </View>
              <View style={styles.filterItem}>
                <Input
                  label="Subscriber ID"
                  value={subscriberIdFilter}
                  onChangeText={setSubscriberIdFilter}
                  placeholder="e.g. 12"
                />
              </View>
              <View style={styles.filterItem}>
                <Input
                  label="Company ID"
                  value={companyIdFilter}
                  onChangeText={setCompanyIdFilter}
                  placeholder="e.g. 3"
                />
              </View>
            </View>

            <View style={styles.filterToggles}>
              <Pressable
                onPress={() => {
                  setErrorsOnly((value) => !value);
                  setPage(0);
                }}
                style={[styles.chip, errorsOnly ? styles.chipActive : null]}
              >
                <Text style={styles.chipText}>Errors only</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSlowOnly((value) => !value);
                  setPage(0);
                }}
                style={[styles.chip, slowOnly ? styles.chipActive : null]}
              >
                <Text style={styles.chipText}>Slow only (&gt;2s)</Text>
              </Pressable>
              <Button
                title="Apply filters"
                variant="secondary"
                onPress={() => {
                  setPage(0);
                  refresh();
                }}
              />
            </View>
          </Card>

          <Card>
            <DataTable
              columns={[
                {
                  key: 'createdAt',
                  label: 'Time',
                  minWidth: 150,
                  render: (row) => <Text style={styles.cellText}>{formatTime(row.createdAt)}</Text>,
                },
                { key: 'method', label: 'Method', minWidth: 70 },
                {
                  key: 'path',
                  label: 'Path',
                  flex: 2,
                  render: (row) => (
                    <Text style={styles.cellText} numberOfLines={2}>
                      {row.path}
                      {row.queryString ? `?${row.queryString}` : ''}
                    </Text>
                  ),
                },
                {
                  key: 'statusCode',
                  label: 'Status',
                  minWidth: 80,
                  render: (row) => <Badge label={String(row.statusCode)} variant={statusVariant(row.statusCode)} />,
                },
                {
                  key: 'durationMs',
                  label: 'ms',
                  minWidth: 90,
                  render: (row) => (
                    <Badge label={`${row.durationMs}`} variant={durationVariant(row.durationMs)} />
                  ),
                },
                {
                  key: 'userRole',
                  label: 'Role',
                  minWidth: 90,
                  render: (row) => <Text style={styles.cellText}>{row.userRole ?? '—'}</Text>,
                },
                {
                  key: 'subscriberName',
                  label: 'Subscriber',
                  minWidth: 140,
                  render: (row) => (
                    <Text style={styles.cellText} numberOfLines={2}>
                      {row.subscriberName ?? '—'}
                      {row.subscriberId ? `\n#${row.subscriberId}` : ''}
                    </Text>
                  ),
                },
                {
                  key: 'companyName',
                  label: 'Company',
                  minWidth: 120,
                  render: (row) => (
                    <Text style={styles.cellText} numberOfLines={2}>
                      {row.companyName ?? '—'}
                      {row.companyId ? `\n#${row.companyId}` : ''}
                    </Text>
                  ),
                },
                {
                  key: 'actorName',
                  label: 'Actor',
                  minWidth: 120,
                  render: (row) => (
                    <Text style={styles.cellText} numberOfLines={2}>
                      {row.actorName ?? '—'}
                      {row.actorType ? `\n${row.actorType}` : ''}
                    </Text>
                  ),
                },
              ]}
              rows={logs}
              keyExtractor={(row) => String(row.id)}
              emptyText="No request logs yet. Use the mobile app, then refresh."
            />

            <Pagination
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  toggleText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  updatedAt: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 16,
  },
  error: {
    color: colors.error,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  section: {
    gap: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '31%',
    minWidth: 220,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  statHint: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  filterItem: {
    flex: 1,
    minWidth: 180,
  },
  filterToggles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  cellText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
});
