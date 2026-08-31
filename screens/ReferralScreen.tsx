import React from 'react';
import { Platform, ScrollView, Share, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { formatDZD, useI18n } from '../lib/i18n';
import { useApp } from '../lib/store';
import { ScreenHeader } from '../components/Header';
import { Btn, Card, FadeIn, Row, Txt, useToast } from '../components/ui';

export default function ReferralScreen({ navigation }: any) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const toast = useToast();
  const { referralCode, referralCount, referralEarnings } = useApp();
  const code = referralCode || 'ZED-USER-0000';
  const msg = t('shareMsg', { code });

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    toast.show(t('copied'), 'success');
  };

  const share = async () => {
    try {
      if (Platform.OS === 'web') {
        const nav: any = typeof navigator !== 'undefined' ? navigator : null;
        if (nav?.share) {
          await nav.share({ title: 'Zed Earn', text: msg });
          return;
        }
        await Clipboard.setStringAsync(msg);
        toast.show(t('copied'), 'success');
        return;
      }
      await Share.share({ message: msg });
    } catch {
      await Clipboard.setStringAsync(msg);
      toast.show(t('copied'), 'info');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('refTitle')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 34, gap: 16 }}>
        <FadeIn>
          <LinearGradient
            colors={[c.gold, c.gold2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 22, gap: 14, alignItems: 'center' }}
          >
            <Ionicons name="gift" size={34} color="#fff" />
            <Txt size={13} color="rgba(255,255,255,0.9)" center>
              {t('yourCode')}
            </Txt>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 }}>
              <Txt size={21} weight="800" color="#fff" center>
                {code}
              </Txt>
            </View>
            <Txt size={12.5} color="rgba(255,255,255,0.92)" center style={{ lineHeight: 20 }}>
              {t('refDesc')}
            </Txt>
            <Row style={{ gap: 10, width: '100%' }}>
              <Btn small style={{ flex: 1 }} variant="glass" label={t('copy')} icon="copy" onPress={copy} />
              <Btn small style={{ flex: 1 }} variant="glass" label={t('share')} icon="share-social" onPress={share} />
            </Row>
          </LinearGradient>
        </FadeIn>

        <FadeIn delay={80}>
          <Row style={{ gap: 10 }}>
            {[
              { icon: 'people' as const, v: String(referralCount), l: t('refCount'), color: c.primary },
              { icon: 'cash' as const, v: `${referralEarnings}`, l: t('refEarn'), color: c.green },
              { icon: 'trending-up' as const, v: `${referralEarnings}`, l: t('refTotal'), color: c.gold },
            ].map((s, i) => (
              <Card key={i} style={{ flex: 1, alignItems: 'center', gap: 6, padding: 14 }}>
                <Ionicons name={s.icon} size={20} color={s.color} />
                <Txt size={16} weight="800">
                  {s.v}
                </Txt>
                <Txt size={11} color={c.sub} center numberOfLines={1}>
                  {s.l}
                </Txt>
              </Card>
            ))}
          </Row>
        </FadeIn>

        <FadeIn delay={140}>
          <Card style={{ gap: 12 }}>
            <Txt size={15} weight="800">
              {t('refTotal')}
            </Txt>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={13} color={c.sub}>
                {t('refEarn')}
              </Txt>
              <Txt size={15} weight="800" color={c.green}>
                {formatDZD(referralEarnings, lang)}
              </Txt>
            </Row>
            <View style={{ height: 1, backgroundColor: c.border }} />
            {Array.from({ length: referralCount }).map((_, i) => (
              <Row key={i} style={{ gap: 10 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: c.primary + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="person" size={16} color={c.primary} />
                </View>
                <Txt size={13} weight="600" style={{ flex: 1 }}>
                  {`+213 06** ** ${10 + i * 7}`}
                </Txt>
                <Txt size={13} weight="700" color={c.green}>
                  +{formatDZD(500, lang)}
                </Txt>
              </Row>
            ))}
          </Card>
        </FadeIn>
      </ScrollView>
    </View>
  );
}
