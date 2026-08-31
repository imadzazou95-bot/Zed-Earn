import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { formatDZD, useI18n } from '../lib/i18n';
import { useApp } from '../lib/store';
import { ScreenHeader } from '../components/Header';
import { Badge, Btn, Card, EmptyState, FadeIn, Row, Txt, useToast } from '../components/ui';

export default function WalletScreen({ navigation }: any) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const toast = useToast();
  const { txs, allTasks, ledgerBalance, lockedBalance, availableBalance, totalIn, totalOut, ledgerCheck } = useApp();
  const [checked, setChecked] = useState(false);

  const label = (ref: string, type: string) => {
    if (type === 'task') {
      const task = allTasks.find((x) => x.id === ref);
      return task ? task.title[lang] : t('tasks');
    }
    return t(ref);
  };

  const icon = (type: string) =>
    type === 'task' ? 'checkmark-done' : type === 'withdraw' ? 'arrow-up' : type === 'referral' ? 'gift' : 'arrow-down';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('walletTitle')} onBack={() => navigation.goBack()} />
      <FlatList
        data={txs}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 34, gap: 10, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 6 }}>
            <FadeIn>
              <Card style={{ gap: 12 }}>
                <Txt size={13} color={c.sub}>
                  {t('availableBalance')}
                </Txt>
                <Txt size={27} weight="800">
                  {formatDZD(ledgerBalance, lang)}
                </Txt>
                <Row style={{ gap: 10 }}>
                  <View style={{ flex: 1, backgroundColor: c.green + '15', borderRadius: 14, padding: 12 }}>
                    <Row style={{ gap: 6 }}>
                      <Ionicons name="arrow-down-circle" size={16} color={c.green} />
                      <Txt size={11.5} color={c.sub}>
                        {t('totalIn')}
                      </Txt>
                    </Row>
                    <Txt size={15} weight="800" color={c.green} style={{ marginTop: 4 }}>
                      {formatDZD(totalIn, lang)}
                    </Txt>
                  </View>
                  <View style={{ flex: 1, backgroundColor: c.red + '15', borderRadius: 14, padding: 12 }}>
                    <Row style={{ gap: 6 }}>
                      <Ionicons name="arrow-up-circle" size={16} color={c.red} />
                      <Txt size={11.5} color={c.sub}>
                        {t('totalOut')}
                      </Txt>
                    </Row>
                    <Txt size={15} weight="800" color={c.red} style={{ marginTop: 4 }}>
                      {formatDZD(totalOut, lang)}
                    </Txt>
                  </View>
                </Row>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt size={12} color={c.sub}>
                    {t('lockedBalance')}: {formatDZD(lockedBalance, lang)}
                  </Txt>
                  <Txt size={12} weight="700" color={c.gold}>
                    {t('availableForWithdraw')}: {formatDZD(availableBalance, lang)}
                  </Txt>
                </Row>
              </Card>
            </FadeIn>

            <FadeIn delay={70}>
              <Card style={{ gap: 10, borderColor: ledgerCheck.valid ? c.green + '55' : c.red, borderWidth: 1.2 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row style={{ gap: 8 }}>
                    <Ionicons name={ledgerCheck.valid ? 'lock-closed' : 'warning'} size={17} color={ledgerCheck.valid ? c.green : c.red} />
                    <Txt size={14} weight="800">
                      {t('integrity')}
                    </Txt>
                  </Row>
                  <Badge
                    label={ledgerCheck.valid ? 'SHA-256' : t('ledgerBroken', { n: ledgerCheck.brokenAt ?? 0 })}
                    color={ledgerCheck.valid ? c.green : c.red}
                  />
                </Row>
                <Txt size={12} color={c.sub} numberOfLines={1}>
                  HEAD · {ledgerCheck.head.slice(0, 28)}…
                </Txt>
                <Btn
                  small
                  variant="outline"
                  label={t('verifyLedger')}
                  icon="shield-checkmark"
                  onPress={() => {
                    setChecked(true);
                    toast.show(
                      ledgerCheck.valid ? t('ledgerValid', { n: ledgerCheck.length }) : t('ledgerBroken', { n: ledgerCheck.brokenAt ?? 0 }),
                      ledgerCheck.valid ? 'success' : 'error'
                    );
                  }}
                />
                {checked ? (
                  <Txt size={11.5} color={ledgerCheck.valid ? c.green : c.red}>
                    {ledgerCheck.valid ? t('ledgerValid', { n: ledgerCheck.length }) : t('ledgerBroken', { n: ledgerCheck.brokenAt ?? 0 })}
                  </Txt>
                ) : null}
              </Card>
            </FadeIn>

            <Txt size={16} weight="800">
              {t('transactions')}
            </Txt>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="swap-vertical-outline" title={t('txEmpty')} />}
        renderItem={({ item, index }) => (
          <FadeIn delay={Math.min(index, 8) * 45}>
            <Card style={{ padding: 14, gap: 8 }}>
              <Row style={{ gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 13,
                    backgroundColor: (item.kind === 'in' ? c.green : c.red) + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={icon(item.type) as any} size={19} color={item.kind === 'in' ? c.green : c.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={13.5} weight="700" numberOfLines={1}>
                    {label(item.ref, item.type)}
                  </Txt>
                  <Txt size={11} color={c.sub}>
                    {new Date(item.date).toLocaleString()}
                  </Txt>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Txt size={14} weight="800" color={item.kind === 'in' ? c.green : c.red}>
                    {item.kind === 'in' ? '+' : '-'}
                    {formatDZD(item.amount, lang)}
                  </Txt>
                  <Badge label={`${t('entrySeq')} #${item.seq}`} color={c.sub} />
                </View>
              </Row>
              <Row style={{ gap: 6 }}>
                <Ionicons name="finger-print" size={12} color={c.sub} />
                <Txt size={10} color={c.sub} numberOfLines={1} style={{ flex: 1 }}>
                  {t('hashLabel')} {item.hash.slice(0, 24)}…
                </Txt>
              </Row>
            </Card>
          </FadeIn>
        )}
      />
    </View>
  );
}
