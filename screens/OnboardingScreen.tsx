import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { LANGS } from '../lib/data';
import { Btn, FadeIn, Row, Txt } from '../components/ui';

const STEPS = [
  { icon: 'phone-portrait' as const, title: 'onb1Title', desc: 'onb1Desc', color: '#2563EB' },
  { icon: 'cash' as const, title: 'onb2Title', desc: 'onb2Desc', color: '#F59E0B' },
  { icon: 'rocket' as const, title: 'onb3Title', desc: 'onb3Desc', color: '#10B981' },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1, padding: 22, gap: 18 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ gap: 6 }}>
            {LANGS.map((l) => (
              <Pressable
                key={l.code}
                onPress={() => setLang(l.code)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: lang === l.code ? c.primary : c.chip,
                }}
              >
                <Txt size={11} weight="700" color={lang === l.code ? '#fff' : c.sub}>
                  {l.code.toUpperCase()}
                </Txt>
              </Pressable>
            ))}
          </Row>
          <Pressable onPress={onDone} hitSlop={10}>
            <Txt size={13} weight="600" color={c.sub}>
              {t('skip')}
            </Txt>
          </Pressable>
        </Row>

        {/* Stepper */}
        <Row style={{ justifyContent: 'center', paddingVertical: 8 }}>
          {STEPS.map((_, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <Row key={i}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: done ? c.green : active ? c.primary : c.chip,
                    borderWidth: active ? 3 : 0,
                    borderColor: c.primary + '44',
                  }}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : (
                    <Txt size={14} weight="800" color={active ? '#fff' : c.sub}>
                      {i + 1}
                    </Txt>
                  )}
                </View>
                {i < STEPS.length - 1 ? (
                  <View
                    style={{
                      width: 46,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: i < step ? c.green : c.chip,
                    }}
                  />
                ) : null}
              </Row>
            );
          })}
        </Row>

        <FadeIn key={step} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18 }}>
          <LinearGradient
            colors={[s.color, s.color + '99']}
            style={{ width: 150, height: 150, borderRadius: 48, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={s.icon} size={68} color="#fff" />
          </LinearGradient>
          <Txt size={24} weight="800" center>
            {t(s.title)}
          </Txt>
          <Txt size={15} color={c.sub} center style={{ lineHeight: 24, paddingHorizontal: 8 }}>
            {t(s.desc)}
          </Txt>
        </FadeIn>

        <Btn
          label={step === STEPS.length - 1 ? t('startNow') : t('next')}
          icon={step === STEPS.length - 1 ? 'rocket' : undefined}
          onPress={() => (step === STEPS.length - 1 ? onDone() : setStep(step + 1))}
        />
      </View>
    </SafeAreaView>
  );
}
