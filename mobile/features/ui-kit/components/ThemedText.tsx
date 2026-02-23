import { TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { AppText } from './AppText';

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
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    textDecorationLine: 'underline',
  },
});
