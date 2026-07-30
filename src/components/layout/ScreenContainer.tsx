import React, { type ReactElement, type ReactNode } from 'react';
import {
  type RefreshControlProps,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_TAB_BASE_HEIGHT } from '../../constants/layout';
import { colors, spacing } from '../../theme';

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
  includeBottomTabSpace?: boolean;
}

export function ScreenContainer({
  children,
  scrollable = false,
  refreshControl,
  contentStyle,
  includeBottomTabSpace = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const bottomSpace =
    insets.bottom +
    (includeBottomTabSpace ? BOTTOM_TAB_BASE_HEIGHT : spacing.lg);

  const baseStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      paddingTop: insets.top + spacing.md,
      paddingBottom: bottomSpace,
      paddingHorizontal: spacing.lg,
    },
    contentStyle,
  ];

  if (scrollable) {
    return (
      <ScrollView contentContainerStyle={baseStyle} refreshControl={refreshControl}>
        {children}
      </ScrollView>
    );
  }

  return <View style={baseStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },
});
