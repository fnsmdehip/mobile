/**
 * Home Screen - Templates hub with professional grid layout.
 * Template cards with category sections, entitlement gating,
 * quick actions, and upgrade prompts.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorBoundary from '../components/ErrorBoundary';
import { getAllTemplates } from '../data/templates';
import usePurchases from '../hooks/usePurchases';
import type { ConsentTemplate, TemplateCategory } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows, CardBorder, MIN_TOUCH_SIZE, FREE_TIER_LIMIT, Assets } from '../constants/theme';

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  medical: 'Medical',
  legal: 'Legal',
  business: 'Business',
  media: 'Media & Creative',
  research: 'Research',
  property: 'Property',
  personal: 'Personal',
  custom: 'Custom',
};

const CATEGORY_ORDER: TemplateCategory[] = [
  'medical', 'legal', 'business', 'media',
  'research', 'property', 'personal', 'custom',
];

const TEMPLATE_ASSET_MAP: Record<string, number> = {
  tpl_medical_consent: Assets.iconChecklist,
  tpl_photo_video_release: Assets.iconVideo,
  tpl_nda: Assets.iconCloudLock,
  tpl_gdpr_consent: Assets.iconShield,
  tpl_research_participation: Assets.iconChecklist,
  tpl_property_entry: Assets.iconSignature,
  tpl_liability_waiver: Assets.iconShield,
  tpl_mutual_release: Assets.iconSignature,
  tpl_personal_consent: Assets.iconSignature,
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { canUseTemplates, canRecord, entitlement, canCreateRecord, recordCount } = usePurchases();

  const templates = getAllTemplates();

  const sections = CATEGORY_ORDER
    .map((category) => ({
      title: CATEGORY_LABELS[category],
      data: templates.filter((t) => t.category === category),
    }))
    .filter((s) => s.data.length > 0);

  const handleTemplatePress = (template: ConsentTemplate) => {
    if (template.isPremium && !canUseTemplates) {
      navigation.navigate('Settings');
      return;
    }
    if (!canCreateRecord) {
      navigation.navigate('Settings');
      return;
    }
    navigation.navigate('TemplateForm', { templateId: template.id });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* App Header */}
      <View style={styles.appHeader}>
        <View style={styles.appHeaderTop}>
          <View>
            <Text style={styles.greeting}>Consent Templates</Text>
            <Text style={styles.appTagline}>Choose a template to get started</Text>
          </View>
          {entitlement === 'free' && (
            <Pressable
              style={styles.tierBadge}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.tierBadgeText}>
                {recordCount}/{FREE_TIER_LIMIT} FREE
              </Text>
            </Pressable>
          )}
          {entitlement === 'pro' && (
            <View style={[styles.tierBadge, styles.proBadge]}>
              <Text style={[styles.tierBadgeText, styles.proBadgeText]}>PRO</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <Pressable
            style={styles.quickActionCard}
            onPress={() => {
              if (!canRecord) {
                navigation.navigate('Settings');
                return;
              }
              navigation.navigate('Recording');
            }}
          >
            <View style={[styles.quickActionIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Image source={Assets.iconVideo} style={styles.quickActionImage} resizeMode="contain" />
            </View>
            <Text style={styles.quickActionLabel}>Record Audio</Text>
            {!canRecord && <Text style={styles.proTag}>PRO</Text>}
          </Pressable>
          <Pressable
            style={styles.quickActionCard}
            onPress={() => {
              if (!canCreateRecord) {
                navigation.navigate('Settings');
                return;
              }
              navigation.navigate('ConsentBuilder', { title: 'Consent Checklist' });
            }}
          >
            <View style={[styles.quickActionIconContainer, { backgroundColor: Colors.successLight }]}>
              <Image source={Assets.iconChecklist} style={styles.quickActionImage} resizeMode="contain" />
            </View>
            <Text style={styles.quickActionLabel}>Checklist</Text>
          </Pressable>
        </View>
      </View>

      {/* Upgrade Banner */}
      {entitlement === 'free' && (
        <Pressable
          style={styles.upgradeBanner}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={styles.upgradeBannerContent}>
            <Image source={Assets.iconShield} style={styles.upgradeBannerImage} resizeMode="contain" />
            <View style={styles.upgradeBannerText}>
              <Text style={styles.upgradeBannerTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeBannerSubtitle}>
                Unlimited records, all templates, audio recording
              </Text>
            </View>
          </View>
          <Text style={styles.upgradeBannerArrow}>{'\u203A'}</Text>
        </Pressable>
      )}

      <Text style={styles.templatesHeading}>All Templates</Text>
    </View>
  );

  const renderTemplateItem = ({ item }: { item: ConsentTemplate }) => {
    const isLocked = item.isPremium && !canUseTemplates;

    return (
      <Pressable
        style={[styles.templateCard, isLocked && styles.templateCardLocked]}
        onPress={() => handleTemplatePress(item)}
      >
        <View style={styles.templateCardContent}>
          <View style={styles.templateIconContainer}>
            <Image source={TEMPLATE_ASSET_MAP[item.id] || Assets.iconChecklist} style={styles.templateImage} resizeMode="contain" />
          </View>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.templateDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.templateMeta}>
              {item.requiresDualSignature && (
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>Dual Sig</Text>
                </View>
              )}
              {item.defaultExpiryDays != null && (
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{item.defaultExpiryDays}d</Text>
                </View>
              )}
              {item.isPremium && (
                <View style={[styles.metaBadge, styles.proMetaBadge]}>
                  <Text style={styles.proMetaText}>PRO</Text>
                </View>
              )}
            </View>
          </View>
          {isLocked && (
            <Image source={Assets.iconCloudLock} style={styles.lockImage} resizeMode="contain" />
          )}
          {!isLocked && (
            <Text style={styles.chevron}>{'\u{203A}'}</Text>
          )}
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <SectionList
          ListHeaderComponent={renderHeader}
          sections={sections}
          renderItem={renderTemplateItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  headerContainer: {},
  appHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  appHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  appTagline: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: '300',
    lineHeight: 24,
  },
  tierBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tierBadgeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  proBadge: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  proBadgeText: {
    color: Colors.primary,
  },
  quickActionsContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.section,
  },
  sectionLabel: {
    ...Typography.overline,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...CardBorder,
    ...Shadows.card,
    minHeight: MIN_TOUCH_SIZE,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionImage: {
    width: 28,
    height: 28,
  },
  quickActionLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  proTag: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  upgradeBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  upgradeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upgradeBannerIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  upgradeBannerImage: {
    width: 28,
    height: 28,
    marginRight: Spacing.md,
  },
  upgradeBannerText: {
    flex: 1,
  },
  upgradeBannerTitle: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  upgradeBannerSubtitle: {
    ...Typography.caption,
    color: Colors.primaryDark,
    marginTop: 2,
    fontWeight: '300',
    lineHeight: 24,
  },
  upgradeBannerArrow: {
    fontSize: 28,
    color: Colors.primary,
    fontWeight: '300',
  },
  templatesHeading: {
    ...Typography.h2,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionHeader: {
    ...Typography.overline,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  templateCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...CardBorder,
    ...Shadows.card,
  },
  templateCardLocked: {
    opacity: 0.65,
  },
  templateCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  templateIcon: {
    fontSize: 24,
  },
  templateImage: {
    width: 28,
    height: 28,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  templateDescription: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: '300',
    lineHeight: 24,
  },
  templateMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  metaBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  metaBadgeText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
  },
  proMetaBadge: {
    backgroundColor: Colors.primaryLight,
  },
  proMetaText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  lockIndicator: {
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
  lockImage: {
    width: 18,
    height: 18,
    marginLeft: Spacing.sm,
  },
  chevron: {
    fontSize: 28,
    color: Colors.textTertiary,
    fontWeight: '300',
    marginLeft: Spacing.sm,
  },
});

export default HomeScreen;
