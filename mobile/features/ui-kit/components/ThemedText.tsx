import { TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { AppText } from './AppText';
import { typography } from '../theme';

export type ThemedTextVariant = 'default' | 'title' | 'subtitle' | 'caption' | 'link';

interface ThemedTextProps extends TextProps {
  variant?: ThemedTextVariant;
  lightColor?: string;
  darkColor?: string;
}

export function ThemedText({
  variant = 'default',
  style,
  lightColor,
  darkColor,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor('text', { light: lightColor, dark: darkColor });

  return <AppText style={[{ color }, styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: {
    ...typography.base,
    lineHeight: 24,
  },
  title: {
    ...typography['3xl'],
    fontWeight: typography.weights.bold,
    lineHeight: 34,
  },
  subtitle: {
    ...typography.xl,
    fontWeight: typography.weights.semibold,
    lineHeight: 28,
  },
  caption: {
    ...typography.caption,
    lineHeight: 18,
  },
  link: {
    ...typography.base,
    lineHeight: 24,
    textDecorationLine: 'underline',
  },
});
