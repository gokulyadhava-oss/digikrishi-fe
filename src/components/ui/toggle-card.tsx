import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  primary:      '#3D7A4F',
  primaryLight: '#5FA870',
  bg:           '#F9FBF7',
  surface:      '#FFFFFF',
  text:         '#1B2A1E',
  textMuted:    '#607060',
  border:       '#E4EDE6',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type ToggleCardProps = {
  value: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
  ariaLabel: string;
};

// ─── Component ────────────────────────────────────────────────────────────────
export function ToggleCard({
  value,
  onToggle,
  onLabel,
  offLabel,
  ariaLabel,
}: ToggleCardProps) {
  // Thumb slides: 2 (off) → 22 (on)
  const translateX = useRef(new Animated.Value(value ? 22 : 2)).current;
  // Track color: 0 (off/border) → 1 (on/primary)
  const trackAnim  = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: value ? 22 : 2,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
      Animated.timing(trackAnim, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: false, // color interpolation needs false
      }),
    ]).start();
  }, [value]);

  const animatedBg = trackAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [T.border, T.primary],
  });

  const animatedBorder = trackAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [T.border, T.primary],
  });

  return (
    <View style={styles.card}>
      {/* Label — mirrors web's conditional text-foreground / text-muted-foreground */}
      <Text style={[styles.label, value ? styles.labelOn : styles.labelOff]}>
        {value ? onLabel : offLabel}
      </Text>

      {/* Track — mirrors web's bg-primary / bg-muted toggle */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onToggle}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={ariaLabel}
      >
        <Animated.View
          style={[
            styles.track,
            { backgroundColor: animatedBg, borderColor: animatedBorder },
          ]}
        >
          {/* Thumb — mirrors web's translate-x-5 / translate-x-1 bg-background */}
          <Animated.View
            style={[styles.thumb, { transform: [{ translateX }] }]}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.bg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelOn: {
    color: T.text,
  },
  labelOff: {
    color: T.textMuted,
  },

  // h-6 w-11 rounded-full border → 24h 44w borderRadius 12
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },

  // h-5 w-5 rounded-full shadow → 20x20 borderRadius 10
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: T.surface,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});