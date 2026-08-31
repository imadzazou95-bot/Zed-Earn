import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { useApp } from '../lib/store';
import { pickImage } from '../lib/pick';
import { RateLimiter, formatRetry } from '../lib/security';
import { ScreenHeader } from '../components/Header';
import { Badge, Btn, Card, FadeIn, Row, Txt, useToast } from '../components/ui';

const SLOTS: { key: 'front' | 'back' | 'selfie'; labelKey: string; icon: any }[] = [
  { key: 'front', labelKey: 'idFront', icon: 'card-outline' },
  { key: 'back', labelKey: 'idBack', icon: 'card' },
  { key: 'selfie', labelKey: 'selfie', icon: 'person-circle-outline' },
];

export default function KycScreen({ navigation }: any) {
  const { c } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { kyc, setKycImage, submitKyc, isAdmin, reviewKyc } = useApp();

  const meta =
    kyc.status === 'approved'
      ? { color: c.green, label: t('kycApproved'), icon: 'shield-checkmark' as const }
      : kyc.status === 'pending'
      ? { color: c.gold, label: t('kycPending'), icon: 'time' as const }
      : kyc.status === 'rejected'
      ? { color: c.red, label: t('kycRejectedS'), icon: 'close-circle' as const }
      : { color: c.sub, label: t('kycNone'), icon: 'alert-circle' as const };

  const locked = kyc.status === 'approved' || kyc.status === 'pending';

  const submit = () => {
    if (!kyc.front || !kyc.back || !kyc.selfie) return toast.show(t('kycMissing'), 'warning');
    const rl = RateLimiter.hit('kyc_submit');
    if (!rl.ok) return toast.show(t('rateLimited', { time: formatRetry(rl.retryInMs) }), 'error');
    submitKyc();
    toast.show(t('kycSent'), 'success');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('kycTitle')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 34, gap: 14 }}>
        <FadeIn>
          <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 22 }}>
            <View
              style={{
                width: 66,
                height: 66,
                borderRadius: 33,
                backgroundColor: meta.color + '1F',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={meta.icon} size={32} color={meta.color} />
            </View>
            <Badge label={meta.label} color={meta.color} icon={meta.icon} />
            {kyc.status === 'rejected' && kyc.reason ? (
              <View style={{ backgroundColor: c.red + '14', borderRadius: 12, padding: 12, width: '100%' }}>
                <Txt size={12.5} color={c.red} center>
                  {t('kycReason')}: {kyc.reason}
                </Txt>
              </View>
            ) : null}
            <Txt size={12.5} color={c.sub} center style={{ lineHeight: 20, paddingHorizontal: 10 }}>
              {kyc.status === 'pending' ? t('kycAutoNote') : t('kycNote')}
            </Txt>
            {kyc.reviewedAt ? (
              <Txt size={11} color={c.sub}>
                {t('reviewedBy')}: {kyc.reviewedBy === 'auto' ? t('autoReviewer') : t('admin')} ·{' '}
                {new Date(kyc.reviewedAt).toLocaleString()}
              </Txt>
            ) : null}
          </Card>
        </FadeIn>

        {SLOTS.map((s, i) => (
          <FadeIn key={s.key} delay={i * 70}>
            <Card style={{ gap: 10 }}>
              <Row style={{ gap: 8, justifyContent: 'space-between' }}>
                <Row style={{ gap: 8 }}>
                  <Ionicons name={s.icon} size={18} color={c.primary} />
                  <Txt size={14} weight="700">
                    {t(s.labelKey)}
                  </Txt>
                </Row>
                {kyc[s.key] ? <Ionicons name="checkmark-circle" size={18} color={c.green} /> : null}
              </Row>
              <Pressable
                disabled={locked}
                onPress={async () => {
                  const uri = await pickImage();
                  if (uri) setKycImage(s.key, uri);
                }}
              >
                <View
                  style={{
                    height: kyc[s.key] ? 170 : 110,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: kyc[s.key] ? c.green : c.border,
                    backgroundColor: c.chip,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    opacity: locked ? 0.75 : 1,
                  }}
                >
                  {kyc[s.key] ? (
                    <Image source={{ uri: kyc[s.key]! }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={28} color={c.sub} />
                      <Txt size={12} color={c.sub} style={{ marginTop: 6 }}>
                        {t('tapToUpload')}
                      </Txt>
                    </>
                  )}
                </View>
              </Pressable>
            </Card>
          </FadeIn>
        ))}

        {kyc.status === 'none' ? <Btn label={t('kycSubmit')} icon="shield-checkmark" onPress={submit} /> : null}
        {kyc.status === 'rejected' ? <Btn label={t('resubmit')} icon="refresh" onPress={submit} /> : null}
        {kyc.status === 'pending' ? (
          <Card style={{ gap: 8, alignItems: 'center', paddingVertical: 18 }}>
            <Ionicons name="hourglass" size={26} color={c.gold} />
            <Txt size={13} color={c.sub} center>
              {t('kycPending')} — {t('reviewMsg')}
            </Txt>
            {isAdmin ? (
              <Row style={{ gap: 10, width: '100%', marginTop: 6 }}>
                <Btn small style={{ flex: 1 }} label={t('approve')} onPress={() => reviewKyc('approve', undefined, 'admin')} />
                <Btn
                  small
                  style={{ flex: 1 }}
                  variant="outline"
                  label={t('reject')}
                  onPress={() => reviewKyc('reject', 'Documents illisibles', 'admin')}
                />
              </Row>
            ) : null}
          </Card>
        ) : null}

        <Pressable onPress={() => navigation.navigate('Legal', { doc: 'privacy' })}>
          <Row style={{ gap: 6, justifyContent: 'center' }}>
            <Ionicons name="lock-closed" size={13} color={c.sub} />
            <Txt size={11.5} color={c.primary} weight="700">
              {t('privacy')}
            </Txt>
          </Row>
        </Pressable>
      </ScrollView>
    </View>
  );
}
