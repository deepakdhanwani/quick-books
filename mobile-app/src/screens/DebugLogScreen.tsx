import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Switch,
  Text,
  View,
} from 'react-native';
import { Card } from '../components/Card';
import { RefreshableScrollView } from '../components/RefreshableScrollView';
import {
  clearDebugLog,
  DebugLogEntry,
  getDebugLogEntries,
  isDebugLogEnabled,
  setDebugLogEnabled,
  subscribeDebugLog,
} from '../services/debugLog';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';

type DebugLogScreenProps = {
  onBack: () => void;
};

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

function levelColor(level: DebugLogEntry['level'], colors: AppTheme['colors']) {
  if (level === 'error') return colors.error;
  if (level === 'warn') return colors.warning;
  if (level === 'info') return colors.primary;
  return colors.textSecondary;
}

export function DebugLogScreen({ onBack }: DebugLogScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const listRef = useRef<FlatList<DebugLogEntry>>(null);
  const [entries, setEntries] = useState<DebugLogEntry[]>(() => getDebugLogEntries());
  const [loggingEnabled, setLoggingEnabled] = useState(isDebugLogEnabled());

  useEffect(() => {
    return subscribeDebugLog(() => {
      setEntries(getDebugLogEntries());
    });
  }, []);

  useEffect(() => {
    if (entries.length === 0) {
      return;
    }
    listRef.current?.scrollToEnd({ animated: true });
  }, [entries.length]);

  const emptyHint = useMemo(
    () =>
      loggingEnabled
        ? 'Switch companies or navigate around. API calls and company switches will appear here.'
        : 'Turn logging on, then reproduce the issue.',
    [loggingEnabled],
  );

  const toggleLogging = async (value: boolean) => {
    setLoggingEnabled(value);
    await setDebugLogEnabled(value);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.toolbar}>
        <View style={styles.toolbarRow}>
          <Text style={styles.toolbarLabel}>Capture logs on device</Text>
          <Switch value={loggingEnabled} onValueChange={toggleLogging} />
        </View>
        <Text style={styles.hint}>
          Use this screen when Expo/Metro logs are not visible. Recent API timing, company switches, and errors are
          stored here.
        </Text>
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={() => clearDebugLog()}>
            <Ionicons name="trash-outline" size={16} color={theme.colors.text} />
            <Text style={styles.actionText}>Clear</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={onBack}>
            <Ionicons name="close-outline" size={16} color={theme.colors.text} />
            <Text style={styles.actionText}>Close</Text>
          </Pressable>
        </View>
      </Card>

      {entries.length === 0 ? (
        <RefreshableScrollView contentContainerStyle={styles.emptyContent}>
          <Text style={styles.emptyTitle}>No debug entries yet</Text>
          <Text style={styles.emptyHint}>{emptyHint}</Text>
        </RefreshableScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={entries}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.entry}>
              <View style={styles.entryHeader}>
                <Text style={[styles.level, { color: levelColor(item.level, theme.colors) }]}>
                  {item.level.toUpperCase()}
                </Text>
                <Text style={styles.time}>{formatTime(item.at)}</Text>
                <Text style={styles.tag}>{item.tag}</Text>
              </View>
              <Text style={styles.message}>{item.message}</Text>
              {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 16,
      gap: 12,
    },
    toolbar: {
      gap: 10,
    },
    toolbarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toolbarLabel: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(15),
      fontWeight: '600',
    },
    hint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      lineHeight: theme.scaleFont(19),
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionText: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(13),
      fontWeight: '500',
    },
    listContent: {
      paddingBottom: 24,
      gap: 8,
    },
    entry: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: 10,
      gap: 4,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    level: {
      fontSize: theme.scaleFont(11),
      fontWeight: '700',
    },
    time: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontFamily: 'monospace',
    },
    tag: {
      color: theme.colors.primary,
      fontSize: theme.scaleFont(11),
      fontWeight: '600',
    },
    message: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(13),
    },
    detail: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(11),
      fontFamily: 'monospace',
    },
    emptyContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
      gap: 8,
    },
    emptyTitle: {
      color: theme.colors.text,
      fontSize: theme.scaleFont(17),
      fontWeight: '600',
      textAlign: 'center',
    },
    emptyHint: {
      color: theme.colors.textSecondary,
      fontSize: theme.scaleFont(13),
      lineHeight: theme.scaleFont(19),
      textAlign: 'center',
    },
  };
}
