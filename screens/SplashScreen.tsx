import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { Txt } from '../components/ui';

function Dot({ delay, color }: { delay: number; color: string }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: 1, duration: 320, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(a, { toValue: 0, duration: 320, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
        Animated.delay(360 - delay),
      ])
    ).start();
  }, [a, delay]);
  return (
    <Animated.View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }],
      }}
    />
  );
}

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const { t } = useI18n();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    const id = setTimeout(onDone, 2500);
    return () => clearTimeout(id);
  }, [pulse, onDone]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <LinearGradient colors={[c.primary, c.primary2]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: 132,
          height: 132,
          borderRadius: 40,
          backgroundColor: 'rgba(255,255,255,0.16)',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 30,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt size={48} weight="800" color={c.primary} center>
            Z
          </Txt>
        </View>
      </Animated.View>
      <View style={{ height: 28 }} />
      <Txt size={30} weight="800" color="#fff" center>
        Zed Earn
      </Txt>
      <Txt size={14} color="rgba(255,255,255,0.85)" center style={{ marginTop: 6, paddingHorizontal: 30 }}>
        {t('tagline')}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 44 }}>
        <Dot delay={0} color="#fff" />
        <Dot delay={120} color="#fff" />
        <Dot delay={240} color="#fff" />
      </View>
      <Txt size={12} color="rgba(255,255,255,0.7)" style={{ position: 'absolute', bottom: 40 }}>
        🇩🇿 DZD · Affiliate Marketing
      </Txt>
    </LinearGradient>
  );
}
