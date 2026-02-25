// Theme
export { colors, typography, radii, spacing } from './theme';
export type { ColorScheme, ColorToken } from './theme';

// Hooks
export { useThemeColor } from './hooks/useThemeColor';

// Components — Base
export { AppText } from './components/AppText';
export { ThemedText } from './components/ThemedText';
export type { ThemedTextVariant } from './components/ThemedText';
export { ThemedView } from './components/ThemedView';

// Components — Shared UI
export { AppLogo } from './components/AppLogo';
export { AppHeader } from './components/AppHeader';
export { ScreenTitle } from './components/ScreenTitle';
export { ScreenSubtitle } from './components/ScreenSubtitle';
export { LabelText } from './components/LabelText';
export { PrimaryButton } from './components/PrimaryButton';
export { AppInput } from './components/AppInput';
export { ErrorBanner } from './components/ErrorBanner';
export { WarningBanner } from './components/WarningBanner';
export { AuthErrorSection } from './components/AuthErrorSection';
export { ProgressBar } from './components/ProgressBar';
export { ErrorBoundary } from './components/ErrorBoundary';
export { OTPInput } from './components/OTPInput';
export { OtpCodeInput } from './components/OtpCodeInput';
export type { OtpCodeInputRef } from './components/OtpCodeInput';
export { ResendCodeBlock } from './components/ResendCodeBlock';
export { PersonaOption } from './components/PersonaOption';
