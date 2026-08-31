import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { formatDZD, useI18n } from '../lib/i18n';
import { TASKS } from '../lib/data';
import { useApp } from '../lib/store';
import { POLICY, computeCommission } from '../lib/policy';
import { ScreenHeader } from '../components/Header';
import { Badge, Btn, Card, EmptyState, FadeIn, Field, Row, Sheet, Segmented, Txt, useToast } from '../components/ui';

type Tab = 'overview' | 'proofs' | 'kyc' | 'withdrawals' | 'campaigns' | 'tasks' | 'audit';
type PendingAction = { kind: 'proof' | 'kyc' | 'withdraw' | 'campaign'; id: string } | null;

export default function AdminScreen({ navigation }: any) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const toast = useToast();
  const {
    taskStates,
    kyc,
    withdrawals,
    campaigns,
    audit,
    disabledTasks,
    allTasks,
    level,
    txs,
    ledgerCheck,
    completedCount,
    reviewProof,
    reviewKyc,
    reviewWithdraw,
    reviewCampaign,
    toggleTaskEnabled,
    revokeAdmin,
  } = useApp();

  const [tab, setTab] = useState<Tab>('overview');
  const [rejecting, setRejecting] = useState<PendingAction>(null);
  const [reason, setReason] = useState('');

  const proofQueue = useMemo(
    () =>
      Object.entries(taskStates)
        .filter(([, s]) => s.status === 'review')
        .map(([id, s]) => ({ id, state: s, task: allTasks.find((x) => x.id === id) ?? TASKS.find((x) => x.id === id) }))
        .filter((x) => !!x.task),
    [taskStates, allTasks]
  );
  const wdQueue = withdrawals.filter((w) => w.status === 'pending');
  const cmpQueue = campaigns.filter((cm) => cm.status === 'pending');
  const kycPending = kyc.status === 'pending';

  const openReject = (kind: NonNullable<PendingAction>['kind'], id: string) => {
    setReason('');
    setRejecting({ kind, id });
  };

  const confirmReject = () => {
    if (!rejecting) return;
    if (reason.trim().length < 3) return toast.show(t('reasonRequired'), 'warning');
    const why = reason.trim();
    if (rejecting.kind === 'proof') reviewProof(rejecting.id, 'reject', why, 'admin');
    if (rejecting.kind === 'kyc') reviewKyc('reject', why, 'admin');
    if (rejecting.kind === 'withdraw') reviewWithdraw(rejecting.id, 'reject', why, 'admin');
    if (rejecting.kind === 'campaign') reviewCampaign(rejecting.id, 'reject', why);
    setRejecting(null);
    toast.show(t('rejected'), 'info');
  };

  const tabs: { key: Tab; label: string; icon: any; badge?: number }[] = [
    { key: 'overview', label: t('adminOverview'), icon: 'speedometer' },
    { key: 'proofs', label: t('queueProofs'), icon: 'documents', badge: proofQueue.length },
    { key: 'kyc', label: t('queueKyc'), icon: 'shield-checkmark', badge: kycPending ? 1 : 0 },
    { key: 'withdrawals', label: t('queueWithdrawals'), icon: 'cash', badge: wdQueue.length },
    { key: 'campaigns', label: t('queueCampaigns'), icon: 'megaphone', badge: cmpQueue.length },
    { key: 'tasks', label: t('taskManager'), icon: 'construct' },
    { key: 'audit', label: t('auditLog'), icon: 'time' },
  ];

  const stat = (icon: any, value: string, label: string, color: string) => (
    <Card style={{ width: '47.5%', gap: 8, padding: 14 }}>
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: color + '1F', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Txt size={18} weight="800">
        {value}
      </Txt>
      <Txt size={11.5} color={c.sub} numberOfLines={1}>
        {label}
      </Txt>
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('adminPanel')} onBack={() => navigation.goBack()} />
      <View style={{ paddingVertical: 12, paddingHorizontal: 14, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Segmented value={tab} onChange={setTab} items={tabs} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36, gap: 14 }}>
        {tab === 'overview' ? (
          <FadeIn style={{ gap: 14 }}>
            <LinearGradient colors={[c.purple, c.primary2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, padding: 20, gap: 10 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={13} color="rgba(255,255,255,0.9)">
                  {t('pendingItems')}
                </Txt>
                <Ionicons name="shield" size={20} color="#fff" />
              </Row>
              <Txt size={30} weight="800" color="#fff">
                {proofQueue.length + wdQueue.length + cmpQueue.length + (kycPending ? 1 : 0)}
              </Txt>
              <Txt size={12} color="rgba(255,255,255,0.85)">
                {t('roleAdmin')} · {t('permissions')}: review · payout · moderation
              </Txt>
            </LinearGradient>

            <Row style={{ gap: 10, flexWrap: 'wrap' }}>
              {stat('documents', String(proofQueue.length), t('queueProofs'), c.primary)}
              {stat('shield-checkmark', kycPending ? '1' : '0', t('queueKyc'), c.green)}
              {stat('cash', String(wdQueue.length), t('queueWithdrawals'), c.gold)}
              {stat('megaphone', String(cmpQueue.length), t('queueCampaigns'), c.purple)}
              {stat('checkmark-done', String(completedCount), t('statDone'), c.blue)}
              {stat('receipt', String(txs.length), t('ledger'), c.red)}
            </Row>

            <Card style={{ gap: 10 }}>
              <Row style={{ gap: 8 }}>
                <Ionicons name={ledgerCheck.valid ? 'lock-closed' : 'warning'} size={18} color={ledgerCheck.valid ? c.green : c.red} />
                <Txt size={14} weight="800">
                  {t('integrity')}
                </Txt>
              </Row>
              <Txt size={12.5} color={ledgerCheck.valid ? c.green : c.red}>
                {ledgerCheck.valid ? t('ledgerValid', { n: ledgerCheck.length }) : t('ledgerBroken', { n: ledgerCheck.brokenAt ?? 0 })}
              </Txt>
              <Txt size={11} color={c.sub} numberOfLines={1}>
                HEAD · {ledgerCheck.head.slice(0, 32)}…
              </Txt>
            </Card>

            <Card style={{ gap: 10 }}>
              <Txt size={14} weight="800">
                {t('commissions')}
              </Txt>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={12.5} color={c.sub}>
                  {t('levelBonus')} ({t(level)})
                </Txt>
                <Txt size={12.5} weight="700">
                  +{Math.round((POLICY.levelBonus[level] ?? 0) * 100)}%
                </Txt>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={12.5} color={c.sub}>
                  {t('platformFee')}
                </Txt>
                <Txt size={12.5} weight="700">
                  {POLICY.merchantFeePct * 100}%
                </Txt>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={12.5} color={c.sub}>
                  {t('minWithdraw')}
                </Txt>
                <Txt size={12.5} weight="700">
                  {formatDZD(POLICY.minWithdraw, lang)}
                </Txt>
              </Row>
            </Card>

            <Btn label={t('exitAdmin')} variant="outline" icon="log-out-outline" onPress={() => { revokeAdmin(); toast.show(t('adminRevoked'), 'info'); navigation.goBack(); }} />
          </FadeIn>
        ) : null}

        {tab === 'proofs' ? (
          proofQueue.length === 0 ? (
            <Card>
              <EmptyState icon="documents-outline" title={t('noPending')} />
            </Card>
          ) : (
            proofQueue.map((p, i) => {
              const breakdown = computeCommission(p.task!.reward, level);
              return (
                <FadeIn key={p.id} delay={i * 60}>
                  <Card style={{ gap: 12 }}>
                    <Row style={{ gap: 10 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: p.task!.color + '1F', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={p.task!.icon as any} size={19} color={p.task!.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Txt size={14} weight="700" numberOfLines={1}>
                          {p.task!.title[lang]}
                        </Txt>
                        <Txt size={11.5} color={c.sub}>
                          {t('attemptsUsed', { n: p.state.attempts, max: POLICY.proofMaxResubmits })} · {new Date(p.state.ts).toLocaleTimeString()}
                        </Txt>
                      </View>
                      <Txt size={13.5} weight="800" color={c.green}>
                        {formatDZD(breakdown.total, lang)}
                      </Txt>
                    </Row>
                    {p.state.proof ? (
                      <Image source={{ uri: p.state.proof }} style={{ width: '100%', height: 160, borderRadius: 14 }} contentFit="cover" />
                    ) : null}
                    <Row style={{ gap: 10 }}>
                      <Btn small style={{ flex: 1 }} label={t('approve')} icon="checkmark" onPress={() => { reviewProof(p.id, 'approve', undefined, 'admin'); toast.show(t('proofApproved'), 'success'); }} />
                      <Btn small style={{ flex: 1 }} variant="outline" label={t('reject')} icon="close" onPress={() => openReject('proof', p.id)} />
                    </Row>
                  </Card>
                </FadeIn>
              );
            })
          )
        ) : null}

        {tab === 'kyc' ? (
          !kycPending ? (
            <Card>
              <EmptyState icon="shield-outline" title={t('noPending')} sub={`${t('kyc')}: ${t(kyc.status === 'approved' ? 'kycApproved' : kyc.status === 'rejected' ? 'kycRejectedS' : 'kycNone')}`} />
            </Card>
          ) : (
            <FadeIn>
              <Card style={{ gap: 12 }}>
                <Txt size={15} weight="800">
                  {t('kycTitle')}
                </Txt>
                <Txt size={12} color={c.sub}>
                  {kyc.submittedAt ? new Date(kyc.submittedAt).toLocaleString() : ''}
                </Txt>
                <Row style={{ gap: 8 }}>
                  {(['front', 'back', 'selfie'] as const).map((slot) =>
                    kyc[slot] ? (
                      <Image key={slot} source={{ uri: kyc[slot]! }} style={{ flex: 1, height: 96, borderRadius: 12 }} contentFit="cover" />
                    ) : (
                      <View key={slot} style={{ flex: 1, height: 96, borderRadius: 12, backgroundColor: c.chip, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="image-outline" size={20} color={c.sub} />
                      </View>
                    )
                  )}
                </Row>
                <Row style={{ gap: 10 }}>
                  <Btn small style={{ flex: 1 }} label={t('approve')} icon="checkmark" onPress={() => { reviewKyc('approve', undefined, 'admin'); toast.show(t('approved'), 'success'); }} />
                  <Btn small style={{ flex: 1 }} variant="outline" label={t('reject')} icon="close" onPress={() => openReject('kyc', 'kyc')} />
                </Row>
              </Card>
            </FadeIn>
          )
        ) : null}

        {tab === 'withdrawals' ? (
          wdQueue.length === 0 ? (
            <Card>
              <EmptyState icon="cash-outline" title={t('noPending')} />
            </Card>
          ) : (
            wdQueue.map((w, i) => (
              <FadeIn key={w.id} delay={i * 60}>
                <Card style={{ gap: 12 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <View>
                      <Txt size={15} weight="800">
                        {formatDZD(w.amount, lang)}
                      </Txt>
                      <Txt size={11.5} color={c.sub}>
                        {t(w.method)} · {new Date(w.createdAt).toLocaleString()}
                      </Txt>
                    </View>
                    <Badge label={t('wdStatusPending')} color={c.gold} icon="time" />
                  </Row>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Txt size={12.5} color={c.sub}>
                      {t('feeLabel')}: {formatDZD(w.fee, lang)}
                    </Txt>
                    <Txt size={12.5} weight="700" color={c.green}>
                      {t('netAmount')}: {formatDZD(w.net, lang)}
                    </Txt>
                  </Row>
                  <Row style={{ gap: 10 }}>
                    <Btn small style={{ flex: 1 }} variant="gold" label={t('approve')} icon="checkmark" onPress={() => { reviewWithdraw(w.id, 'approve', undefined, 'admin'); toast.show(t('approved'), 'success'); }} />
                    <Btn small style={{ flex: 1 }} variant="outline" label={t('reject')} icon="close" onPress={() => openReject('withdraw', w.id)} />
                  </Row>
                </Card>
              </FadeIn>
            ))
          )
        ) : null}

        {tab === 'campaigns' ? (
          campaigns.length === 0 ? (
            <Card>
              <EmptyState icon="megaphone-outline" title={t('noCampaigns')} />
            </Card>
          ) : (
            campaigns.map((cm, i) => (
              <FadeIn key={cm.id} delay={i * 55}>
                <Card style={{ gap: 10 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Txt size={14.5} weight="800" numberOfLines={1}>
                        {cm.title}
                      </Txt>
                      <Txt size={12} color={c.sub} numberOfLines={2}>
                        {cm.desc}
                      </Txt>
                    </View>
                    <Badge
                      label={t(cm.status === 'pending' ? 'campaignPending' : cm.status === 'approved' ? 'campaignApproved' : 'campaignRejected')}
                      color={cm.status === 'pending' ? c.gold : cm.status === 'approved' ? c.green : c.red}
                    />
                  </Row>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Txt size={12} color={c.sub}>
                      {t('roleMerchant')}: {cm.owner}
                    </Txt>
                    <Txt size={13} weight="800" color={c.primary}>
                      {formatDZD(cm.reward, lang)} (+{formatDZD(cm.fee, lang)})
                    </Txt>
                  </Row>
                  {cm.status === 'pending' ? (
                    <Row style={{ gap: 10 }}>
                      <Btn small style={{ flex: 1 }} label={t('approve')} icon="checkmark" onPress={() => { reviewCampaign(cm.id, 'approve'); toast.show(t('approved'), 'success'); }} />
                      <Btn small style={{ flex: 1 }} variant="outline" label={t('reject')} icon="close" onPress={() => openReject('campaign', cm.id)} />
                    </Row>
                  ) : cm.reason ? (
                    <Txt size={12} color={c.red}>
                      {t('rejectReason')}: {cm.reason}
                    </Txt>
                  ) : null}
                </Card>
              </FadeIn>
            ))
          )
        ) : null}

        {tab === 'tasks' ? (
          <View style={{ gap: 10 }}>
            {allTasks.map((task, i) => {
              const off = disabledTasks.includes(task.id);
              return (
                <FadeIn key={task.id} delay={Math.min(i, 8) * 40}>
                  <Card style={{ padding: 14, gap: 10, opacity: off ? 0.6 : 1 }}>
                    <Row style={{ gap: 10 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: task.color + '1F', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={task.icon as any} size={18} color={task.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Txt size={13.5} weight="700" numberOfLines={1}>
                          {task.title[lang]}
                        </Txt>
                        <Txt size={11.5} color={c.sub}>
                          {t(task.difficulty)} · {formatDZD(task.reward, lang)}
                        </Txt>
                      </View>
                      <Btn
                        small
                        variant={off ? 'primary' : 'outline'}
                        label={off ? t('enableTask') : t('disableTask')}
                        onPress={() => {
                          const enabled = toggleTaskEnabled(task.id);
                          toast.show(enabled ? t('taskEnabled') : t('taskDisabled'), 'info');
                        }}
                      />
                    </Row>
                  </Card>
                </FadeIn>
              );
            })}
          </View>
        ) : null}

        {tab === 'audit' ? (
          audit.length === 0 ? (
            <Card>
              <EmptyState icon="time-outline" title={t('noPending')} />
            </Card>
          ) : (
            audit.map((a, i) => (
              <FadeIn key={a.id} delay={Math.min(i, 10) * 35}>
                <Card style={{ padding: 12 }}>
                  <Row style={{ gap: 10 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: (a.actor === 'admin' ? c.purple : a.actor === 'auto' ? c.blue : a.actor === 'system' ? c.sub : c.primary) + '1F',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name={a.actor === 'admin' ? 'shield' : a.actor === 'auto' ? 'hardware-chip' : a.actor === 'system' ? 'cog' : 'person'}
                        size={15}
                        color={a.actor === 'admin' ? c.purple : a.actor === 'auto' ? c.blue : a.actor === 'system' ? c.sub : c.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt size={12.5} weight="700">
                        {a.action}
                      </Txt>
                      <Txt size={11} color={c.sub} numberOfLines={1}>
                        {a.target}
                        {a.meta ? ` · ${a.meta}` : ''}
                      </Txt>
                    </View>
                    <Txt size={10.5} color={c.sub}>
                      {new Date(a.ts).toLocaleTimeString()}
                    </Txt>
                  </Row>
                </Card>
              </FadeIn>
            ))
          )
        ) : null}
      </ScrollView>

      <Sheet visible={!!rejecting} onClose={() => setRejecting(null)} title={t('rejectReason')}>
        <Field
          label={t('rejectReason')}
          icon="create-outline"
          value={reason}
          onChangeText={setReason}
          placeholder="—"
          multiline
        />
        <Btn label={t('reject')} variant="danger" icon="close-circle" onPress={confirmReject} />
      </Sheet>
    </View>
  );
}
