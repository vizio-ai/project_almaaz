import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor } from '@shared/ui-kit';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

export type LegalModalType = 'terms' | 'privacy';

interface LegalModalProps {
  visible: boolean;
  type: LegalModalType;
  onClose: () => void;
}

const TERMS_CONTENT = {
  title: 'Terms of Service',
  sections: [
    {
      heading: '1. Acceptance of Terms',
      body: 'By accessing or using our application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.',
    },
    {
      heading: '2. Use of the Service',
      body: 'You agree to use the application only for lawful purposes and in a manner that does not infringe the rights of others. You must not misuse, disrupt, or attempt to gain unauthorized access to any part of our service.',
    },
    {
      heading: '3. Account Responsibility',
      body: 'You are responsible for maintaining the confidentiality of your account credentials, including the OTP codes sent to your phone. You agree to notify us immediately of any unauthorized use of your account.',
    },
    {
      heading: '4. Prohibited Activities',
      body: 'You may not engage in activities including, but not limited to: sharing or selling account access, using automated tools to interact with the service, transmitting harmful or unlawful content, or attempting to reverse-engineer any part of the application.',
    },
    {
      heading: '5. Modifications to Terms',
      body: 'We reserve the right to update these Terms of Service at any time. Continued use of the application after changes have been posted constitutes your acceptance of the revised terms.',
    },
    {
      heading: '6. Termination',
      body: 'We may suspend or terminate your access to the service at any time for conduct that violates these terms or is otherwise harmful to other users, us, or third parties.',
    },
    {
      heading: '7. Limitation of Liability',
      body: 'To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.',
    },
    {
      heading: '8. Contact',
      body: 'If you have any questions about these Terms, please contact us through the support section within the application.',
    },
  ],
};

const PRIVACY_CONTENT = {
  title: 'Privacy Policy',
  sections: [
    {
      heading: '1. Information We Collect',
      body: 'We collect your phone number when you register or log in. We may also collect usage data such as session activity, device information, and app interactions to improve your experience.',
    },
    {
      heading: '2. How We Use Your Information',
      body: 'Your phone number is used solely to authenticate your identity via OTP verification. We do not sell or share your personal information with third parties for marketing purposes.',
    },
    {
      heading: '3. Data Retention',
      body: 'We retain your personal data only for as long as necessary to provide the service and comply with legal obligations. You may request deletion of your account and associated data at any time.',
    },
    {
      heading: '4. Data Security',
      body: 'We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.',
    },
    {
      heading: '5. Third-Party Services',
      body: 'We may use third-party services for authentication, analytics, or infrastructure. These providers have their own privacy policies, and we encourage you to review them.',
    },
    {
      heading: '6. Your Rights',
      body: 'Depending on your jurisdiction, you may have the right to access, correct, or delete the personal data we hold about you. To exercise these rights, contact us through the application.',
    },
    {
      heading: '7. Children\'s Privacy',
      body: 'Our service is not directed at children under the age of 13. We do not knowingly collect personal information from children.',
    },
    {
      heading: '8. Changes to This Policy',
      body: 'We may update this Privacy Policy periodically. We will notify you of significant changes through the application. Your continued use of the service after changes take effect constitutes acceptance of the updated policy.',
    },
    {
      heading: '9. Contact Us',
      body: 'If you have questions or concerns about this Privacy Policy, please reach out through the support section in the application.',
    },
  ],
};

export function LegalModal({ visible, type, onClose }: LegalModalProps) {
  const insets = useSafeAreaInsets();
  const bgColor = useThemeColor('background');
  const textColor = useThemeColor('text');
  const borderColor = useThemeColor('borderLight');
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }).start();
    } else {
      slideAnim.setValue(SHEET_HEIGHT);
    }
  }, [visible, slideAnim]);

  const content = type === 'terms' ? TERMS_CONTENT : PRIVACY_CONTENT;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.scrim} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: bgColor, paddingBottom: insets.bottom + 16 },
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <AppText style={[styles.title, { color: textColor }]}>{content.title}</AppText>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={8}>
            <Ionicons name="close" size={22} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <AppText style={[styles.sectionHeading, { color: textColor }]}>
                {section.heading}
              </AppText>
              <AppText style={[styles.sectionBody, { color: '#71717A' }]}>
                {section.body}
              </AppText>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
});
