// ─── Auth Presentation String Constants ───────────────────────────────────────
// All screen strings are managed here centrally.
// If i18n is added later, this file serves as the primary source.

export const AuthStrings = {
  phoneEntry: {
    title: 'Access Account with Number',
    subtitle: 'Enter your phone number below to login to your account.',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '(555) 000-0000',
    submitButton: 'Get OTP',
    countryPickerTitle: 'Select Country',
    countryPickerClose: 'Done',
    countrySearchPlaceholder: 'Search country or code...',
  },

  otpVerification: {
    title: 'OTP Verification',
    subtitle: (phone: string) => `We have sent a 6-digit verification code to your mobile phone number ${phone}.`,
    submitButton: 'Submit Code',
    resendLabel: "Didn't you get the code?",
    resendAction: 'Send again (120 sec)',
  },
} as const;
