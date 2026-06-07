import { ReactNode } from 'react';
import { useAppTheme } from '../theme/AppThemeContext';
import type { AppTheme } from '../theme/types';
import { useThemedStyles } from '../theme/useThemedStyles';
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
} from 'react-native';
type RefreshableScrollViewProps = ScrollViewProps & {
  children: ReactNode;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

export function RefreshableScrollView({
  children,
  refreshing,
  onRefresh,
  contentContainerStyle,
  ...props
}: RefreshableScrollViewProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView
      {...props}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
          progressBackgroundColor={theme.colors.surface}
        />
      }
    >
      {children}
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return {
  content: {
    flexGrow: 1,
  },

  };
}
