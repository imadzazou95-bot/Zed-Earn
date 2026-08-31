import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { formatDZD, useI18n } from '../lib/i18n';
import { useApp } from '../lib/store';
import { POLICY, withdrawalFee, MethodKey } from '../lib/policy';
import { RateLimiter, V, formatRetry } from '../lib/security';
import { TabHeader } from '../components/Header';
import { Badge, Btn, Card, EmptyState, FadeIn, Field, Row, SectionTitle, Txt, useToast } from '../components/ui';

const METHODS: { key: MethodKey; titleKey: string; descKey: string; icon: any; color: string }[] = [
  { key: 'mCcp', titleKey: 'mCcp', descKey: 'mCcpDesc', icon: 'mail', color: '#F59E0B' },
  { key: 'mWallet', titleKey: 'mWallet', descKey: 'mWalletDesc', icon: 'phone-portrait', color: '#10B981' },
  { key: 'mCard', titleKey: 'mCard', descKey: 'mCardDesc', icon: 'card', color: '#2563EB' },
];

export default function WithdrawScreen({ navigation }: any) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const toast = useToast();
  const { availableBalance, lockedBalance, ledgerBalance, withdrawals, kyc, requestWithdraw, withdrawnToday } = useApp();
  const [method, setMethod] = useState<MethodKey>('mCcp');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => withdrawalFee(method, Number(amount) || 0), [method, amount]);

  const request = () => {
    if (POLICY.kycRequiredForWithdraw && kyc.status !== 'approved') {
      toast.show(t('kycRequired'), 'warning');
      navigation.navigate('Kyc');
      return;
    }
    const err = V.amount(amount, POLICY.minWithdraw, POLICY.maxWithdrawPerRequest);
    if (err) {
      setError(t(err));
      return toast.show(t(err), 'error');
    }
    const rl = RateLimiter.hit('withdraw_request');
    if (!rl.ok) return toast.show(t('rateLimited', { time: formatRetry(rl.retryInMs) }), 'error');

    const res = requestWithdraw(Number(amount), method);
    if (!res.ok) {
      setError(t(res.errorKey ?? 'invalidAmount'));
      return toast.show(t(res.errorKey ?? 'invalidAmount'), 'error');
    }
    setError(null);
    setAmount('');
    toast.show(t('wdRequested'), 'success');
  };

  const statusMeta = (s: string) =>
    s === 'approved'
      ? { color: c.green, label: t('wdStatusApproved'), icon: 'checkmark-circle' as const }
      : s === 'rejected'
      ? { color: c.red, label: t('wdStatusRejected'), icon: 'close-circle' as const }
      : { color: c.gold, label: t('wdStatusPending'), icon: 'time' as const };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TabHeader title={t('withdrawals')} icon="cash" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 34, gap: 16 }} keyboardShouldPersistTaps="handled">
        <FadeIn>
          <LinearGradient
            colors={[c.gold, c.gold2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 20, gap: 10 }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={13} color="rgba(255,255,255,0.9)">
                {t('availableForWithdraw')}
              </Txt>
              <Ionicons name="cash" size={20} color="#fff" />
            </Row>
            <Txt size={29} weight="800" color="#fff">
              {formatDZD(availableBalance, lang)}
            </Txt>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={11.5} color="rgba(255,255,255,0.9)">
                {t('availableBalance')}: {formatDZD(ledgerBalance, lang)}
              </Txt>
              <Txt size={11.5} color="rgba(255,255,255,0.9)">
                {t('lockedBalance')}: {formatDZD(lockedBalance, lang)}
              </Txt>
            </Row>
            <Row style={{ gap: 6 }}>
              <Ionicons name="information-circle" size={14} color="rgba(255,255,255,0.9)" />
              <Txt size={11.5} color="rgba(255,255,255,0.9)" style={{ flex: 1 }}>
                {t('minWithdraw')} · {t('wdPolicyNote')}
              </Txt>
            </Row>
          </LinearGradient>
        </FadeIn>

        {kyc.status !== 'approved' ? (
          <FadeIn delay={60}>
            <Card onPress={() => navigation.navigate('Kyc')} style={{ borderColor: c.gold, borderWidth: 1.5 }}>
              <Row style={{ gap: 12 }}>
                <Ionicons name="shield-half" size={22} color={c.gold} />
                <View style={{ flex: 1 }}>
                  <Txt size={14} weight="700">
                    {t('kycTitle')} · {t(kyc.status === 'pending' ? 'kycPending' : kyc.status === 'rejected' ? 'kycRejectedS' : 'kycNone')}
                  </Txt>
                  <Txt size={12} color={c.sub}>
                    {t('kycRequired')}
                  </Txt>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.sub} />
              </Row>
            </Card>
          </FadeIn>
        ) : null}

        <View>
          <SectionTitle title={t('wdMethods')} action={t('commissions')} onAction={() => navigation.navigate('Legal', { doc: 'commissions' })} />
          <View style={{ gap: 10 }}>
            {METHODS.map((m, i) => {
              const on = method === m.key;
              const rule = POLICY.fees[m.key];
              return (
                <FadeIn key={m.key} delay={i * 60}>
                  <Pressable onPress={() => setMethod(m.key)}>
                    <Card style={{ borderWidth: on ? 1.8 : 1, borderColor: on ? m.color : c.border, padding: 14 }}>
                      <Row style={{ gap: 12 }}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            backgroundColor: m.color + '1F',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name={m.icon} size={21} color={m.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Txt size={14} weight="700">
                            {t(m.titleKey)}
                          </Txt>
                          <Txt size={12} color={c.sub}>
                            {t(m.descKey)} · {rule.pct * 100}% ({rule.min}–{rule.max} DZD)
                          </Txt>
                        </View>
                        <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? m.color : c.sub} />
                      </Row>
                    </Card>
                  </Pressable>
                </FadeIn>
              );
            })}
          </View>
        </View>

        <Card style={{ gap: 14 }}>
          <Field
            label={t('amount')}
            icon="cash-outline"
            value={amount}
            error={error}
            onChangeText={(v) => {
              setAmount(v.replace(/[^\d]/g, ''));
              if (error) setError(null);
            }}
            placeholder={String(POLICY.minWithdraw)}
            keyboardType="number-pad"
            returnKeyType="done"
          />
          <Row style={{ gap: 8 }}>
            {[1000, 5000, 10000].map((v) => (
              <Pressable
                key={v}
                onPress={() => setAmount(String(v))}
                style={{ flex: 1, backgroundColor: c.chip, borderRadius: 12, paddingVertical: 10 }}
              >
                <Txt size={12} weight="700" center>
                  {v.toLocaleString()}
                </Txt>
              </Pressable>
            ))}
          </Row>

          {Number(amount) > 0 ? (
            <View style={{ backgroundColor: c.chip, borderRadius: 14, padding: 12, gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={12.5} color={c.sub}>
                  {t('amount')}
                </Txt>
                <Txt size={12.5} weight="700">
                  {formatDZD(preview.gross, lang)}
                </Txt>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={12.5} color={c.sub}>
                  {t('feeLabel')} ({preview.pct * 100}%)
                </Txt>
                <Txt size={12.5} weight="700" color={c.red}>
                  -{formatDZD(preview.fee, lang)}
                </Txt>
              </Row>
              <View style={{ height: 1, backgroundColor: c.border }} />
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={13} weight="700">
                  {t('netAmount')}
                </Txt>
                <Txt size={14} weight="800" color={c.green}>
                  {formatDZD(preview.net, lang)}
                </Txt>
              </Row>
            </View>
          ) : null}

          <Row style={{ gap: 6 }}>
            <Ionicons name="speedometer-outline" size={13} color={c.sub} />
            <Txt size={11} color={c.sub}>
              24h · {formatDZD(withdrawnToday, lang)} / {formatDZD(POLICY.maxWithdrawPerDay, lang)}
            </Txt>
          </Row>

          <Btn label={t('requestWithdraw')} icon="arrow-up-circle" onPress={request} />
        </Card>

        <View>
          <SectionTitle title={t('wdHistory')} action={t('seeAll')} onAction={() => navigation.navigate('Wallet')} />
          {withdrawals.length === 0 ? (
            <Card>
              <EmptyState icon="receipt-outline" title={t('wdEmpty')} />
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {withdrawals.slice(0, 6).map((h) => {
                const st = statusMeta(h.status);
                return (
                  <Card key={h.id} style={{ padding: 14, gap: 8 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Row style={{ gap: 10 }}>
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            backgroundColor: st.color + '18',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name={st.icon} size={18} color={st.color} />
                        </View>
                        <View>
                          <Txt size={13.5} weight="700">
                            {t(h.method)}
                          </Txt>
                          <Txt size={11} color={c.sub}>
                            {new Date(h.createdAt).toLocaleString()}
                          </Txt>
                        </View>
                      </Row>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Txt size={14} weight="800">
                          {formatDZD(h.amount, lang)}
                        </Txt>
                        <Badge label={st.label} color={st.color} />
                      </View>
                    </Row>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Txt size={11.5} color={c.sub}>
                        {t('feeLabel')}: {formatDZD(h.fee, lang)}
                      </Txt>
                      <Txt size={11.5} color={c.sub}>
                        {t('netAmount')}: {formatDZD(h.net, lang)}
                      </Txt>
                    </Row>
                    {h.reason ? (
                      <Txt size={11.5} color={c.red}>
                        {t('rejectReason')}: {h.reason}
                      </Txt>
                    ) : null}
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
