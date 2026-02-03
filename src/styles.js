import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Design tokens (non-color)
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 60,
  giant: 80,
};

const FONT_SIZES = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 16,
  xxl: 18,
  xxxl: 20,
  huge: 24,
  massive: 32,
};

const FONT_WEIGHTS = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
};

const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 18,
  xxl: 20,
  full: 28,
};

// Safe area helpers
const SAFE_AREA_TOP = Platform.select({
  ios: height > 800 ? 60 : 44,
  android: 48,
  default: 48,
});

const SAFE_AREA_BOTTOM = Platform.select({
  ios: 25,
  android: 10,
  default: 10,
});

/**
 * Generate themed styles
 * @param {Object} colors - Theme colors from ThemeContext
 * @returns {Object} StyleSheet styles
 */
export const getStyles = (colors) => {
  // Common style patterns using theme colors
  const textBase = {
    color: colors.text.primary,
    fontWeight: FONT_WEIGHTS.light,
  };

  const borderBase = {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  const buttonBase = {
    height: 48,
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return StyleSheet.create({
    // Core
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      marginTop: 10,
      flex: 1,
    },
    contentCentered: {
      flex: 1,
      justifyContent: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      fontSize: FONT_SIZES.lg,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
    },
    errorText: {
      fontSize: FONT_SIZES.lg,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
      marginTop: SPACING.md,
    },

    // Header / top bars
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.xxxl,
      paddingTop: SAFE_AREA_TOP,
      paddingBottom: SPACING.xl,
      backgroundColor: colors.background,
      ...borderBase,
    },
    headerTitle: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: FONT_WEIGHTS.light,
      color: colors.text.primary,
      letterSpacing: 2,
    },

    // Logo / auth
    backButton: {
      position: 'absolute',
      top: SAFE_AREA_TOP,
      left: SPACING.xxxl,
      zIndex: 10,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 64,
      paddingHorizontal: SPACING.xxxl,
    },
    logoMark: {
      width: 48,
      height: 48,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.logo.mark,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    logoInner: {
      width: 16,
      height: 16,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.logo.inner,
    },
    title: {
      fontSize: FONT_SIZES.huge,
      fontWeight: FONT_WEIGHTS.light,
      color: colors.text.primary,
      letterSpacing: 2,
    },

    // Forms
    formContainer: {
      gap: SPACING.lg,
      paddingHorizontal: SPACING.xxxl,
    },
    form: {
      padding: SPACING.xxxl,
      gap: SPACING.xxl,
    },
    inputWrapper: {
      position: 'relative',
    },
    input: {
      fontSize: FONT_SIZES.lg,
      color: colors.input.text,
      fontWeight: FONT_WEIGHTS.light,
      borderBottomWidth: 1,
      borderBottomColor: colors.input.border,
      paddingVertical: SPACING.md,
      backgroundColor: colors.input.background,
    },
    eyeIcon: {
      position: 'absolute',
      right: 0,
      bottom: SPACING.md,
      padding: SPACING.sm,
    },
    button: {
      ...buttonBase,
      backgroundColor: colors.button.primary,
      marginTop: SPACING.xxl,
    },
    buttonText: {
      color: colors.button.primaryText,
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.regular,
      letterSpacing: 0.5,
    },
    linkButton: {
      alignItems: 'center',
      marginTop: SPACING.lg,
      padding: SPACING.md,
    },
    linkText: {
      color: colors.text.secondary,
      fontSize: FONT_SIZES.base,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
    },

    refreshButton: {
      backgroundColor: colors.mapOverlay,
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },

    scrollContent: {
      paddingVertical: SPACING.xl,
    },

    label: {
      fontSize: FONT_SIZES.sm,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: SPACING.md,
      marginTop: SPACING.lg,
    },

    // Search
    headerTitleLarge: {
      fontSize: FONT_SIZES.huge,
      fontWeight: FONT_WEIGHTS.light,
      color: colors.text.primary,
      letterSpacing: 2,
    },
    searchSection: {
      padding: SPACING.xxxl,
      paddingBottom: SPACING.lg,
      backgroundColor: colors.background,
      ...borderBase,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      paddingVertical: SPACING.md,
      ...borderBase,
    },
    searchInput: {
      flex: 1,
      fontSize: FONT_SIZES.lg,
      color: colors.text.primary,
      fontWeight: FONT_WEIGHTS.light,
    },
    filtersPanel: {
      maxHeight: 300,
      backgroundColor: colors.background,
      ...borderBase,
    },
    filterSection: {
      padding: SPACING.xxxl,
      paddingBottom: SPACING.lg,
    },
    filterLabel: {
      fontSize: FONT_SIZES.sm,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: SPACING.md,
    },
    filterOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    filterChip: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.lg,
      minHeight: 36,
    },
    filterChipActive: {
      backgroundColor: colors.button.primary,
      borderColor: colors.button.primary,
    },
    filterChipText: {
      fontSize: FONT_SIZES.md,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
    },
    filterChipTextActive: {
      color: colors.button.primaryText,
      fontWeight: FONT_WEIGHTS.regular,
    },
    clearButton: {
      marginHorizontal: SPACING.xxxl,
      marginBottom: SPACING.xxl,
      paddingVertical: SPACING.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.xxl,
      minHeight: 44,
    },
    clearButtonText: {
      color: colors.text.tertiary,
      fontSize: FONT_SIZES.base,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
    },

    // Results / lists
    results: {
      flex: 1,
    },
    loadingContainerCentered: {
      paddingVertical: SPACING.massive,
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: SPACING.giant,
      paddingHorizontal: SPACING.huge,
    },
    emptyStateTitle: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: FONT_WEIGHTS.light,
      color: colors.text.primary,
      letterSpacing: 1,
      marginTop: SPACING.xl,
      marginBottom: SPACING.sm,
    },
    emptyStateText: {
      fontSize: FONT_SIZES.base,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      textAlign: 'center',
    },
    resultsList: {
      padding: SPACING.xxxl,
      gap: SPACING.lg,
    },
    resultsCount: {
      fontSize: FONT_SIZES.sm,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: SPACING.sm,
    },

    // Bench card
    benchCard: {
      flexDirection: 'row',
      gap: SPACING.lg,
      paddingBottom: SPACING.lg,
      ...borderBase,
    },
    benchImage: {
      width: 100,
      height: 100,
      backgroundColor: colors.border,
      borderRadius: BORDER_RADIUS.sm,
    },
    benchImagePlaceholder: {
      width: 100,
      height: 100,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: BORDER_RADIUS.sm,
    },
    benchInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    benchViewType: {
      fontSize: FONT_SIZES.xs,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: SPACING.xs,
    },
    benchTitle: {
      fontSize: FONT_SIZES.xl,
      fontWeight: FONT_WEIGHTS.regular,
      color: colors.text.primary,
      letterSpacing: 0.5,
      marginBottom: SPACING.sm,
    },
    benchDescription: {
      fontSize: FONT_SIZES.md,
      color: colors.text.secondary,
      fontWeight: FONT_WEIGHTS.light,
      lineHeight: 18,
      marginBottom: SPACING.sm,
    },
    benchMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    ratingText: {
      fontSize: FONT_SIZES.sm,
      color: colors.text.primary,
      fontWeight: FONT_WEIGHTS.light,
    },
    distanceText: {
      fontSize: FONT_SIZES.xs,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
    },

    // Profile
    section: {
      padding: SPACING.xxxl,
      ...borderBase,
    },
    avatar: {
      width: SPACING.giant,
      height: SPACING.giant,
      borderRadius: SPACING.huge,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: SPACING.xl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    username: {
      fontSize: FONT_SIZES.xxxl,
      fontWeight: FONT_WEIGHTS.regular,
      color: colors.text.primary,
      letterSpacing: 0.5,
      textAlign: 'center',
      marginBottom: SPACING.xs,
    },
    fullName: {
      fontSize: FONT_SIZES.lg,
      color: colors.text.secondary,
      fontWeight: FONT_WEIGHTS.light,
      textAlign: 'center',
      marginBottom: SPACING.sm,
    },
    bio: {
      fontSize: FONT_SIZES.base,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: SPACING.sm,
      marginBottom: SPACING.xl,
    },
    editButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.xxl,
      paddingVertical: 10,
      alignItems: 'center',
      minHeight: 44,
    },
    editButtonText: {
      color: colors.text.primary,
      fontSize: FONT_SIZES.base,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
    },
    sectionLabel: {
      fontSize: FONT_SIZES.sm,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: SPACING.lg,
    },
    statsGrid: {
      flexDirection: 'row',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    statValue: {
      fontSize: FONT_SIZES.huge,
      fontWeight: FONT_WEIGHTS.light,
      color: colors.text.primary,
      marginBottom: SPACING.xs,
    },
    statLabel: {
      fontSize: FONT_SIZES.xs,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: SPACING.huge,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.xxxl,
      ...borderBase,
    },
    modalTitle: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: FONT_WEIGHTS.light,
      color: colors.text.primary,
      letterSpacing: 2,
    },
    modalBody: {
      padding: SPACING.xxxl,
    },

    starRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: SPACING.md,
      marginTop: SPACING.md,
    },

    inputLabel: {
      fontSize: FONT_SIZES.sm,
      fontWeight: FONT_WEIGHTS.light,
      color: colors.text.tertiary,
      letterSpacing: 1,
      marginBottom: SPACING.sm,
      marginTop: SPACING.lg,
      textTransform: 'uppercase',
    },
    textArea: {
      minHeight: SPACING.giant,
      textAlignVertical: 'top',
    },
    disabledInput: {
      paddingVertical: SPACING.md,
      ...borderBase,
    },
    disabledInputText: {
      fontSize: FONT_SIZES.lg,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
    },
    helperText: {
      fontSize: FONT_SIZES.xs,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      marginTop: SPACING.xs,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: SPACING.md,
      paddingHorizontal: SPACING.xxxl,
    },
    cancelButton: {
      flex: 1,
      height: 48,
      borderRadius: BORDER_RADIUS.xxl,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      color: colors.text.tertiary,
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
    },
    saveButton: {
      flex: 1,
      height: 48,
      borderRadius: BORDER_RADIUS.xxl,
      backgroundColor: colors.button.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      color: colors.button.primaryText,
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.regular,
      letterSpacing: 0.5,
    },

    // BenchDetail specifics
    photosSection: {
      height: 300,
    },
    photo: {
      width: width,
      height: 300,
      backgroundColor: colors.border,
    },
    photoScrollView: {
      flex: 1,
    },
    photoContainer: {
      width: width,
      height: 300,
    },
    indicatorContainer: {
      position: 'absolute',
      bottom: SPACING.lg,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      marginHorizontal: SPACING.xs,
    },
    indicatorActive: {
      backgroundColor: colors.icon.primary,
      width: 24,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: '#000',
      alignItems: 'center',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
    },
    modalCloseButton: {
      padding: SPACING.sm,
    },
    modalIndicator: {
      flex: 1,
      alignItems: 'center',
    },
    modalCounter: {
      color: '#fff',
      fontSize: FONT_SIZES.base,
      fontWeight: FONT_WEIGHTS.medium,
    },
    modalScrollView: {
      flex: 1,
    },
    modalPhotoContainer: {
      width: width,
      height: height,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalPhoto: {
      width: width,
      height: height,
      backgroundColor: colors.border,
    },
    viewType: {
      fontSize: FONT_SIZES.sm,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: SPACING.sm,
    },
    creator: {
      fontSize: FONT_SIZES.base,
      color: colors.text.secondary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
      marginBottom: SPACING.lg,
    },
    description: {
      fontSize: FONT_SIZES.lg,
      lineHeight: 24,
      color: colors.text.secondary,
      fontWeight: FONT_WEIGHTS.light,
      marginBottom: SPACING.lg,
    },
    accessibility: {
      fontSize: FONT_SIZES.base,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      fontStyle: 'italic',
    },
    ratingsRow: {
      flexDirection: 'row',
      marginBottom: SPACING.lg,
    },
    ratingItem: {
      flex: 1,
      alignItems: 'center',
    },
    ratingValue: {
      fontSize: FONT_SIZES.massive,
      fontWeight: FONT_WEIGHTS.light,
      color: colors.text.primary,
      marginBottom: SPACING.xs,
    },
    ratingLabel: {
      fontSize: FONT_SIZES.sm,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
    },
    ratingDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginHorizontal: SPACING.xxxl,
    },
    ratingCount: {
      fontSize: FONT_SIZES.md,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      textAlign: 'center',
      marginBottom: SPACING.lg,
    },
    yourRating: {
      fontSize: FONT_SIZES.md,
      color: colors.text.secondary,
      fontWeight: FONT_WEIGHTS.light,
      textAlign: 'center',
      marginTop: SPACING.md,
    },
    coordinates: {
      fontSize: FONT_SIZES.base,
      color: colors.text.secondary,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
      fontWeight: FONT_WEIGHTS.light,
      marginBottom: SPACING.lg,
    },
    actionButton: {
      ...buttonBase,
      backgroundColor: colors.button.primary,
    },
    actionButtonText: {
      color: colors.button.primaryText,
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.regular,
      letterSpacing: 0.5,
    },
    commentInputWrapper: {
      marginBottom: SPACING.xxl,
    },
    commentInput: {
      fontSize: FONT_SIZES.lg,
      color: colors.text.primary,
      fontWeight: FONT_WEIGHTS.light,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: SPACING.md,
      marginBottom: SPACING.md,
      minHeight: SPACING.massive,
      textAlignVertical: 'top',
    },
    commentButton: {
      backgroundColor: colors.button.primary,
      height: 44,
      borderRadius: BORDER_RADIUS.xl,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-end',
      paddingHorizontal: SPACING.xxl,
    },
    commentButtonText: {
      color: colors.button.primaryText,
      fontSize: FONT_SIZES.base,
      fontWeight: FONT_WEIGHTS.regular,
      letterSpacing: 0.5,
    },
    comment: {
      marginBottom: SPACING.xl,
      paddingBottom: SPACING.xl,
      ...borderBase,
    },
    commentUser: {
      fontSize: FONT_SIZES.base,
      color: colors.text.primary,
      fontWeight: FONT_WEIGHTS.regular,
      marginBottom: SPACING.sm,
      textAlignVertical: 'center',
    },
    commentText: {
      fontSize: FONT_SIZES.lg,
      color: colors.text.secondary,
      fontWeight: FONT_WEIGHTS.light,
      lineHeight: 22,
      marginBottom: SPACING.sm,
    },
    commentDate: {
      fontSize: FONT_SIZES.sm,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
    },

    // Map
    map: {
      flex: 1,
    },
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: SPACING.xxxl,
      paddingTop: SAFE_AREA_TOP,
      paddingBottom: SPACING.xl,
      zIndex: 1000,
    },
    counterContainer: {
      backgroundColor: colors.mapOverlay,
      paddingHorizontal: SPACING.lg,
      paddingVertical: 10,
      borderRadius: BORDER_RADIUS.xxl,
      borderWidth: 1,
      borderColor: colors.border,
      alignSelf: 'flex-start',
    },
    counterText: {
      fontSize: FONT_SIZES.md,
      fontWeight: FONT_WEIGHTS.light,
      color: colors.text.primary,
      letterSpacing: 0.5,
    },
    addButton: {
      position: 'absolute',
      bottom: 30,
      right: SPACING.xxxl,
      width: 56,
      height: 56,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.button.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
      zIndex: 1000,
    },

    // AddBench
    photoPlaceholder: {
      marginHorizontal: SPACING.xxxl,
      marginTop: SPACING.xl,
      padding: SPACING.huge,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.surface,
    },
    photoPlaceholderText: {
      color: colors.text.tertiary,
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
      marginTop: SPACING.md,
      marginBottom: SPACING.xl,
    },
    photoButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    photoButton: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      minHeight: 44,
    },
    photoButtonText: {
      color: colors.text.secondary,
      fontSize: FONT_SIZES.base,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
    },
    photoDivider: {
      color: colors.text.tertiary,
      fontSize: FONT_SIZES.base,
      fontWeight: FONT_WEIGHTS.light,
    },
    photoContainer: {
      marginHorizontal: SPACING.xxxl,
      marginTop: SPACING.xl,
      position: 'relative',
      borderRadius: BORDER_RADIUS.sm,
      overflow: 'hidden',
    },
    photoPreview: {
      width: '100%',
      height: 240,
      backgroundColor: colors.border,
    },
    removePhotoButton: {
      position: 'absolute',
      top: SPACING.md,
      right: SPACING.md,
      padding: SPACING.sm,
    },
    photoSection: {
      marginBottom: SPACING.lg,
    },
    selectedPhotosContainer: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      gap: SPACING.md,
    },
    selectedPhotoContainer: {
      position: 'relative',
    },
    selectedPhoto: {
      width: 120,
      height: 120,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.border,
    },
    addMoreButton: {
      width: 120,
      height: 120,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    addMoreText: {
      fontSize: FONT_SIZES.sm,
      color: colors.text.tertiary,
      marginTop: SPACING.xs,
    },
    photoActions: {
      paddingHorizontal: SPACING.lg,
      marginTop: SPACING.sm,
    },
    photoActionButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      backgroundColor: colors.button.secondary,
      borderRadius: BORDER_RADIUS.md,
    },
    photoActionText: {
      fontSize: FONT_SIZES.sm,
      color: colors.button.secondaryText,
      fontWeight: FONT_WEIGHTS.medium,
    },
    formGap24: {
      gap: SPACING.xxl,
    },

    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.md,
    },
    locationText: {
      flex: 1,
      fontSize: FONT_SIZES.md,
      color: colors.text.secondary,
      fontWeight: FONT_WEIGHTS.light,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    },
    viewTypesContainer: {
      gap: SPACING.sm,
      paddingRight: SPACING.xxxl,
    },
    viewTypeButton: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.lg,
      minHeight: 36,
    },
    viewTypeButtonActive: {
      backgroundColor: colors.button.primary,
      borderColor: colors.button.primary,
    },
    viewTypeText: {
      fontSize: FONT_SIZES.md,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
    },
    viewTypeTextActive: {
      color: colors.button.primaryText,
      fontWeight: FONT_WEIGHTS.regular,
    },
    submitButton: {
      ...buttonBase,
      backgroundColor: colors.button.primary,
      marginTop: SPACING.xxl,
    },
    submitButtonText: {
      color: colors.button.primaryText,
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.regular,
      letterSpacing: 0.5,
    },

    // Favorites
    count: {
      fontSize: FONT_SIZES.xxl,
      fontWeight: FONT_WEIGHTS.light,
      color: colors.text.tertiary,
      letterSpacing: 1,
    },
    exploreButton: {
      ...buttonBase,
      backgroundColor: colors.button.primary,
      paddingHorizontal: SPACING.xxxl,
    },
    exploreButtonText: {
      color: colors.button.primaryText,
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.regular,
      letterSpacing: 0.5,
    },
    favoritesList: {
      padding: SPACING.xxxl,
      gap: SPACING.lg,
    },
    favoriteCard: {
      flexDirection: 'row',
      ...borderBase,
      paddingBottom: SPACING.lg,
    },
    benchContent: {
      flex: 1,
      flexDirection: 'row',
      gap: SPACING.lg,
    },
    savedDate: {
      fontSize: FONT_SIZES.xs,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
    },
    removeButton: {
      width: SPACING.huge,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 44,
    },

    // Profile specific
    benchesList: {
      gap: SPACING.lg,
    },
    benchDate: {
      fontSize: FONT_SIZES.xs,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      marginTop: SPACING.xs,
    },
    emptyText: {
      fontSize: FONT_SIZES.base,
      color: colors.text.tertiary,
      fontWeight: FONT_WEIGHTS.light,
      textAlign: 'center',
      marginBottom: SPACING.xl,
    },
    logoutButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.xxl,
      paddingVertical: SPACING.md,
      alignItems: 'center',
      minHeight: 48,
    },
    logoutText: {
      color: colors.destructive,
      fontSize: FONT_SIZES.lg,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
    },

    // Tabs
    tabBar: {
      backgroundColor: colors.tabBar.background,
      borderTopWidth: 1,
      borderTopColor: colors.tabBar.border,
      height: 85,
      paddingBottom: SAFE_AREA_BOTTOM,
      paddingTop: 10,
    },
    tabBarLabel: {
      fontSize: FONT_SIZES.xs,
      fontWeight: FONT_WEIGHTS.light,
      letterSpacing: 0.5,
      marginTop: SPACING.xs,
    },

    // Theme toggle
    themeToggle: {
      padding: SPACING.sm,
    },
  });
};

// Export design tokens for use in components
export { SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SAFE_AREA_TOP, SAFE_AREA_BOTTOM };