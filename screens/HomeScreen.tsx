import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { formatDZD, useI18n } from '../lib/i18n';
import { useApp } from '../lib/store';
import { useOnline } from '../lib/pwa';
import { RateLimiter, formatRetry } from '../lib/security';
import { MainHeader } from '../components/Header';
import TaskCard from '../components/TaskCard';
import { Btn, Card, FadeIn, Row, SectionTitle, Txt, useToast } from '../components/ui';

function Stat({ icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  const { c } = useTheme();
  return (
    <Card style={{ flex: 1, padding: 12, gap: 6, alignItems: 'center' }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: color + '1F',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Txt size={16} weight="800" center>
        {value}
      </Txt>
      <Txt size={11} color={c.sub} center numberOfLines={1}>
        {label}
      </Txt>
    </Card>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const toast = useToast();
  const {
    user,
    availableBalance,
    ledgerBalance,
    lockedBalance,
    completedCount,
    activeCount,
    taskStates,
    vipUnlocked,
    addDeposit,
    allTasks,
    txs,
    pendingReviewCount,
    isAdmin,
  } = useApp();
  const online = useOnline();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const preview = allTasks.filter((tk) => !taskStates[tk.id] && (tk.difficulty !== 'vip' || vipUnlocked)).slice(0, 3);
  const totalEarned = txs.filter((x) => x.type === 'task').reduce((s, x) => s + x.amount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <MainHeader greeting={`${t('hello')} 👋`} name={user.name || user.phone || 'Zed Earn'} />
      <FlatList
        data={preview}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 30, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 4 }}>
            {!online ? (
              <Card style={{ padding: 12, borderColor: c.gold, borderWidth: 1.5 }}>
                <Row style={{ gap: 8 }}>
                  <Ionicons name="cloud-offline" size={17} color={c.gold} />
                  <Txt size={12.5} color={c.gold} style={{ flex: 1 }}>
                    {t('offlineMode')}
                  </Txt>
                </Row>
              </Card>
            ) : null}
            {isAdmin && pendingReviewCount > 0 ? (
              <Card onPress={() => navigation.navigate('Admin')} style={{ padding: 12, borderColor: c.purple, borderWidth: 1.5 }}>
                <Row style={{ gap: 10 }}>
                  <Ionicons name="shield" size={18} color={c.purple} />
                  <Txt size={13} weight="700" style={{ flex: 1 }}>
                    {t('adminPanel')} · {pendingReviewCount} {t('pendingItems')}
                  </Txt>
                  <Ionicons name="chevron-forward" size={16} color={c.sub} />
                </Row>
              </Card>
            ) : null}
            <FadeIn>
              <LinearGradient
                colors={[c.primary, c.primary2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 22, padding: 20, gap: 16 }}
              >
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt size={13} color="rgba(255,255,255,0.85)">
                    {t('availableBalance')}
                  </Txt>
                  <Ionicons name="wallet" size={20} color="rgba(255,255,255,0.9)" />
                </Row>
                <Txt size={30} weight="800" color="#fff">
                  {formatDZD(ledgerBalance, lang)}
                </Txt>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt size={11.5} color="rgba(255,255,255,0.85)">
                    {t('availableForWithdraw')}: {formatDZD(availableBalance, lang)}
                  </Txt>
                  {lockedBalance > 0 ? (
                    <Txt size={11.5} color="rgba(255,255,255,0.85)">
                      {t('lockedBalance')}: {formatDZD(lockedBalance, lang)}
                    </Txt>
                  ) : null}
                </Row>
                <Row style={{ gap: 10 }}>
                  <Btn
                    small
                    style={{ flex: 1 }}
                    variant="glass"
                    label={t('withdraw')}
                    icon="arrow-up-circle"
                    onPress={() => navigation.navigate('Withdraw')}
                  />
                  <Btn
                    small
                    style={{ flex: 1 }}
                    variant="glass"
                    label={t('deposit')}
                    icon="arrow-down-circle"
                    onPress={() => {
                      const rl = RateLimiter.hit('deposit_demo');
                      if (!rl.ok) return toast.show(t('rateLimited', { time: formatRetry(rl.retryInMs) }), 'error');
                      addDeposit(2000);
                      toast.show(t('depositDone'), 'success');
                    }}
                  />
                </Row>
              </LinearGradient>
            </FadeIn>

            <FadeIn delay={90}>
              <Row style={{ gap: 10 }}>
                <Stat icon="list" value={String(activeCount)} label={t('statTasks')} color={c.primary} />
                <Stat icon="checkmark-done" value={String(completedCount)} label={t('statDone')} color={c.green} />
                <Stat icon="cash" value={`${totalEarned}`} label={t('statEarn')} color={c.gold} />
              </Row>
            </FadeIn>

            <FadeIn delay={140}>
              <Card onPress={() => navigation.navigate('Referral')} style={{ padding: 14 }}>
                <Row style={{ gap: 12 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      backgroundColor: c.gold + '22',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="gift" size={21} color={c.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt size={14} weight="700">
                      {t('referral')}
                    </Txt>
                    <Txt size={12} color={c.sub} numberOfLines={2}>
                      {t('refDesc')}
                    </Txt>
                  </View>
                </Row>
              </Card>
            </FadeIn>

            <View style={{ marginTop: 6 }}>
              <SectionTitle
                title={t('availableTasks')}
                action={t('seeAll')}
                onAction={() => navigation.navigate('Tasks')}
              />
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeIn delay={index * 70}>
            <TaskCard task={item} onPress={() => navigation.navigate('TaskDetail', { id: item.id })} />
          </FadeIn>
        )}
      />
    </View>
  );
}
