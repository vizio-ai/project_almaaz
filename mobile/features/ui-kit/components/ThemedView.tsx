import { View, ViewProps } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { ColorToken } from '../theme';

interface ThemedViewProps extends ViewProps {
  colorToken?: ColorToken;
  lightColor?: string;
  darkColor?: string;
}

export function ThemedView({
  colorToken = 'background',
  style,
  lightColor,
  darkColor,
  ...rest
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(colorToken, {
    light: lightColor,
    dark: darkColor,
  });

  return <View style={[{ backgroundColor }, style]} {...rest} />;
}
