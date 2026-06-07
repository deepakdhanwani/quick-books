import { ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';

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
  return (
    <ScrollView
      {...props}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
