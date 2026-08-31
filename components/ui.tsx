import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';

/* ── Layout helpers ────────────────────────────────── */
export function Row({
  children,
  style,
  reverse,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  reverse?: boolean;
}) {
  const { isRTL } = useI18n();
  const dir = isRTL !== !!reverse ? 'row-reverse' : 'row';
  return <View style={[{ flexDirection: dir as any, alignItems: 'center' }, style]}>{children}</View>;
}

export function Txt({
  children,
  style,
  weight = '400',
  size = 14,
  color,
  numberOfLines,
  center,
}: {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[] | any;
  weight?: '400' | '500' | '600' | '700' | '800';
  size?: number;
  color?: string;
  numberOfLines?: number;
  center?: boolean;
}) {
  const { c } = useTheme();
  const { isRTL } = useI18n();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color: color ?? c.text,
          fontSize: size,
          fontWeight: weight,
          textAlign: center ? 'center' : isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[] | any;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  const base = {
    backgroundColor: c.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    shadowColor: '#0F172A',
    shadowOpacity: c.dark ? 0.35 : 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

/* ── Buttons ───────────────────────────────────────── */
export function Btn({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  style,
  small,
}: {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'gold' | 'ghost' | 'outline' | 'danger' | 'glass';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | any;
  small?: boolean;
}) {
  const { c } = useTheme();
  const h = small ? 42 : 54;
  const content = (
    <Row style={{ justifyContent: 'center', gap: 8 }}>
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? c.primary : variant === 'outline' ? c.text : '#fff'} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={small ? 16 : 19}
              color={variant === 'ghost' ? c.primary : variant === 'outline' ? c.text : '#fff'}
            />
          ) : null}
          <Text
            style={{
              color: variant === 'ghost' ? c.primary : variant === 'outline' ? c.text : '#fff',
              fontWeight: '700',
              fontSize: small ? 13 : 16,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Row>
  );

  const wrapperStyle: ViewStyle = {
    height: h,
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 18,
    opacity: disabled ? 0.5 : 1,
  };

  if (variant === 'primary' || variant === 'gold' || variant === 'danger') {
    const colors: [string, string] =
      variant === 'primary'
        ? [c.primary, c.primary2]
        : variant === 'gold'
        ? [c.gold, c.gold2]
        : [c.red, '#B91C1C'];
    return (
      <Pressable onPress={disabled || loading ? undefined : onPress} style={[wrapperStyle, style]}>
        {({ pressed }) => (
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
              { borderRadius: 16, justifyContent: 'center', opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {content}
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        wrapperStyle,
        variant === 'outline' && { borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card },
        variant === 'glass' && { backgroundColor: 'rgba(255,255,255,0.22)' },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function IconBtn({
  name,
  onPress,
  color,
  size = 22,
  badge,
  style,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  size?: number;
  badge?: boolean;
  style?: ViewStyle;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.chip,
        },
        pressed && { opacity: 0.6 },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color ?? c.text} />
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: 7,
            right: 7,
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: '#EF4444',
            borderWidth: 1.5,
            borderColor: c.card,
          }}
        />
      ) : null}
    </Pressable>
  );
}

/* ── Badge / chips ─────────────────────────────────── */
export function Badge({ label, color, icon }: { label: string; color: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Row
      style={{
        backgroundColor: color + '22',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 4,
        alignSelf: 'flex-start',
      }}
    >
      {icon ? <Ionicons name={icon} size={12} color={color} /> : null}
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </Row>
  );
}

export function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  const { c } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: Math.max(0, Math.min(1, pct)), duration: 600, useNativeDriver: false }).start();
  }, [pct, anim]);
  return (
    <View style={{ height: 8, borderRadius: 999, backgroundColor: c.chip, overflow: 'hidden' }}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: 999,
          backgroundColor: color ?? c.primary,
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 46, gap: 10 }}>
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 38,
          backgroundColor: c.chip,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={34} color={c.sub} />
      </View>
      <Txt weight="700" size={15} center>
        {title}
      </Txt>
      {sub ? (
        <Txt color={c.sub} size={13} center style={{ maxWidth: 260 }}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

/* ── Inputs ────────────────────────────────────────── */
export function Field({
  label,
  hint,
  icon,
  error,
  style,
  ...props
}: TextInputProps & { label?: string; hint?: string; error?: string | null; icon?: keyof typeof Ionicons.glyphMap }) {
  const { c } = useTheme();
  const { isRTL } = useI18n();
  const [focus, setFocus] = useState(false);
  const borderColor = error ? c.red : focus ? c.primary : c.border;
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Txt size={13} weight="600" color={c.sub}>
          {label}
        </Txt>
      ) : null}
      <Row
        style={{
          borderWidth: 1.5,
          borderColor,
          backgroundColor: c.card,
          borderRadius: 14,
          paddingHorizontal: 14,
          height: props.multiline ? 96 : 52,
          gap: 8,
          alignItems: props.multiline ? 'flex-start' : 'center',
          paddingVertical: props.multiline ? 12 : 0,
        }}
      >
        {icon ? <Ionicons name={icon} size={18} color={error ? c.red : focus ? c.primary : c.sub} /> : null}
        <TextInput
          placeholderTextColor={c.sub}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={[
            {
              flex: 1,
              color: c.text,
              fontSize: 15,
              height: '100%',
              textAlign: isRTL ? 'right' : 'left',
              textAlignVertical: props.multiline ? 'top' : 'center',
              ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
            },
            style as any,
          ]}
          {...props}
        />
      </Row>
      {error ? (
        <Row style={{ gap: 4 }}>
          <Ionicons name="alert-circle" size={12} color={c.red} />
          <Txt size={11} color={c.red}>
            {error}
          </Txt>
        </Row>
      ) : hint ? (
        <Txt size={11} color={c.sub}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

/* ── Segmented control ─────────────────────────── */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: T; label: string; icon?: keyof typeof Ionicons.glyphMap; badge?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { c } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 9,
              borderRadius: 999,
              backgroundColor: on ? c.primary : c.chip,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {it.icon ? <Ionicons name={it.icon} size={14} color={on ? '#fff' : c.sub} /> : null}
            <Text style={{ fontSize: 12, fontWeight: '700', color: on ? '#fff' : c.sub }}>{it.label}</Text>
            {it.badge ? (
              <View style={{ minWidth: 18, height: 18, borderRadius: 9, backgroundColor: on ? 'rgba(255,255,255,0.3)' : c.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{it.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ── Bottom sheet ────────────────────────────── */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end', alignItems: 'center' }}>
        <Pressable style={{ flex: 1, width: '100%' }} onPress={onClose} />
        <View
          style={{
            width: '100%',
            maxWidth: 480,
            backgroundColor: c.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            gap: 14,
            paddingBottom: 30,
          }}
        >
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt size={17} weight="800">
              {title}
            </Txt>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={c.sub} />
            </Pressable>
          </Row>
          {children}
        </View>
      </View>
    </Modal>
  );
}

/* ── Section header ────────────────────────────────── */
export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { c } = useTheme();
  return (
    <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
      <Txt weight="800" size={16}>
        {title}
      </Txt>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Txt size={13} weight="600" color={c.primary}>
            {action}
          </Txt>
        </Pressable>
      ) : null}
    </Row>
  );
}

/* ── Toast system ──────────────────────────────────── */
type ToastType = 'success' | 'error' | 'warning' | 'info';
const ToastCtx = createContext<{ show: (msg: string, type?: ToastType) => void }>({ show: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<any>(null);

  const show = useCallback(
    (msg: string, type: ToastType = 'success') => {
      setToast({ msg, type });
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
      }, 2600);
    },
    [anim]
  );

  const colors: Record<ToastType, string> = {
    success: c.green,
    error: c.red,
    warning: c.gold,
    info: c.primary,
  };
  const icons: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
    success: 'checkmark-circle',
    error: 'close-circle',
    warning: 'alert-circle',
    info: 'information-circle',
  };

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 54,
            left: 16,
            right: 16,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
            opacity: anim,
            zIndex: 999,
          }}
        >
          <Row
            style={{
              backgroundColor: c.card,
              borderRadius: 14,
              padding: 14,
              gap: 10,
              borderLeftWidth: 4,
              borderLeftColor: colors[toast.type],
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            <Ionicons name={icons[toast.type]} size={20} color={colors[toast.type]} />
            <Txt style={{ flex: 1 }} size={13} weight="600">
              {toast.msg}
            </Txt>
          </Row>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  );
}

/* ── Fade-in wrapper ───────────────────────────────── */
export function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle | any;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 420, delay, useNativeDriver: true }).start();
  }, [anim, delay]);
  return (
    <Animated.View
      style={[
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
