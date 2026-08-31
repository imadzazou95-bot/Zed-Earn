import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { formatDZD, useI18n } from '../lib/i18n';
import { Difficulty } from '../lib/data';
import { useApp } from '../lib/store';
import { POLICY, campaignCost } from '../lib/policy';
import { RateLimiter, V, formatRetry } from '../lib/security';
import { ScreenHeader } from '../components/Header';
import { Badge, Btn, Card, EmptyState, FadeIn, Field, Row, SectionTitle, Sheet, Txt, useToast } from '../components/ui';

export default function MerchantScreen({ navigation }: any) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const toast = useToast();
  const { campaigns, createCampaign, isMerchant, enableMerchant, kyc, user, taskStates } = useApp();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [reward, setReward] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [reqs, setReqs] = useState('');
  const [steps, setSteps] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const approved = campaigns.filter((x) => x.status === 'approved');
  const pending = campaigns.filter((x) => x.status === 'pending');
  const sales = approved.reduce(
    (s, cm) => s + (taskStates[cm.id]?.status === 'completed' ? 1 : 0),
    0
  );
  const revenue = approved.reduce((s, cm) => s + cm.reward + cm.fee, 0);
  const cost = campaignCost(Number(reward) || 0);

  const submit = () => {
    const e: Record<string, string | null> = {
      title: V.text(title, 4, 60) ? t(V.text(title, 4, 60)!) : null,
      desc: V.text(desc, 10, 160) ? t(V.text(desc, 10, 160)!) : null,
      reward: V.amount(reward, POLICY.merchantMinReward, POLICY.merchantMaxReward)
        ? t(V.amount(reward, POLICY.merchantMinReward, POLICY.merchantMaxReward)!)
        : null,
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return toast.show(t('fixErrors'), 'error');

    const rl = RateLimiter.hit('campaign_create');
    if (!rl.ok) return toast.show(t('rateLimited', { time: formatRetry(rl.retryInMs) }), 'error');

    createCampaign({
      title,
      desc,
      reward: Number(reward),
      difficulty,
      requirements: reqs.split('\n').map((s) => s.trim()).filter(Boolean),
      steps: steps.split('\n').map((s) => s.trim()).filter(Boolean),
    });
    setTitle('');
    setDesc('');
    setReward('');
    setReqs('');
    setSteps('');
    setOpen(false);
    toast.show(t('campaignSubmitted'), 'success');
  };

  const stats = [
    { icon: 'cube' as const, v: String(campaigns.length), l: t('mProducts'), color: c.purple },
    { icon: 'flash' as const, v: String(approved.length), l: t('mActive'), color: c.primary },
    { icon: 'bag-check' as const, v: String(sales), l: t('mSales'), color: c.green },
    { icon: 'trending-up' as const, v: String(revenue), l: t('mRevenue'), color: c.gold },
  ];

  if (!isMerchant) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader title={t('merchantTitle')} onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <FadeIn>
            <Card style={{ gap: 14, alignItems: 'center', paddingVertical: 28 }}>
              <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: c.purple + '1F', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="storefront" size={32} color={c.purple} />
              </View>
              <Txt size={17} weight="800" center>
                {t('becomeMerchant')}
              </Txt>
              <Txt size={13} color={c.sub} center style={{ lineHeight: 21 }}>
                {t('merchantRequires')}
              </Txt>
              <Badge
                label={`${t('kyc')}: ${t(kyc.status === 'approved' ? 'kycApproved' : kyc.status === 'pending' ? 'kycPending' : kyc.status === 'rejected' ? 'kycRejectedS' : 'kycNone')}`}
                color={kyc.status === 'approved' ? c.green : c.gold}
                icon="shield-checkmark"
              />
              {kyc.status === 'approved' ? (
                <Btn
                  label={t('becomeMerchant')}
                  icon="storefront"
                  style={{ alignSelf: 'stretch' }}
                  onPress={() => {
                    if (enableMerchant()) toast.show(t('merchantEnabled'), 'success');
                  }}
                />
              ) : (
                <Btn label={t('kycTitle')} icon="shield-half" style={{ alignSelf: 'stretch' }} onPress={() => navigation.navigate('Kyc')} />
              )}
            </Card>
          </FadeIn>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('merchantTitle')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 34, gap: 16 }}>
        <FadeIn>
          <Row style={{ gap: 10, flexWrap: 'wrap' }}>
            {stats.map((s) => (
              <Card key={s.l} style={{ width: '47.5%', gap: 8, padding: 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: s.color + '1F', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Txt size={19} weight="800">
                  {s.v}
                </Txt>
                <Txt size={11.5} color={c.sub}>
                  {s.l}
                </Txt>
              </Card>
            ))}
          </Row>
        </FadeIn>

        <Card style={{ gap: 8, padding: 14 }}>
          <Row style={{ gap: 8 }}>
            <Ionicons name="person-circle" size={18} color={c.purple} />
            <Txt size={13.5} weight="700">
              {t('roleMerchant')} · {user.name || user.phone}
            </Txt>
          </Row>
          <Txt size={12} color={c.sub}>
            {t('platformFee')}: {POLICY.merchantFeePct * 100}% · {t('campaignReward')}: {POLICY.merchantMinReward}–
            {POLICY.merchantMaxReward.toLocaleString()} DZD
          </Txt>
        </Card>

        <Btn label={t('newCampaign')} icon="add-circle" onPress={() => setOpen(true)} />

        <View>
          <SectionTitle title={t('myCampaigns')} action={pending.length ? `${pending.length} ${t('pending')}` : undefined} />
          {campaigns.length === 0 ? (
            <Card>
              <EmptyState icon="megaphone-outline" title={t('noCampaigns')} sub={t('newCampaign')} />
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {campaigns.map((cm) => (
                <Card key={cm.id} style={{ padding: 14, gap: 8 }}>
                  <Row style={{ gap: 12 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: c.purple + '1F', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="megaphone" size={20} color={c.purple} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt size={14} weight="700" numberOfLines={1}>
                        {cm.title}
                      </Txt>
                      <Txt size={12} color={c.sub} numberOfLines={2}>
                        {cm.desc}
                      </Txt>
                    </View>
                    <Txt size={14} weight="800" color={c.primary}>
                      {formatDZD(cm.reward, lang)}
                    </Txt>
                  </Row>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Badge
                      label={t(cm.status === 'pending' ? 'campaignPending' : cm.status === 'approved' ? 'campaignApproved' : 'campaignRejected')}
                      color={cm.status === 'pending' ? c.gold : cm.status === 'approved' ? c.green : c.red}
                      icon={cm.status === 'pending' ? 'time' : cm.status === 'approved' ? 'checkmark-circle' : 'close-circle'}
                    />
                    <Txt size={11.5} color={c.sub}>
                      {t('campaignCost')}: {formatDZD(cm.reward + cm.fee, lang)}
                    </Txt>
                  </Row>
                  {cm.reason ? (
                    <Txt size={11.5} color={c.red}>
                      {t('rejectReason')}: {cm.reason}
                    </Txt>
                  ) : null}
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Sheet visible={open} onClose={() => setOpen(false)} title={t('newCampaign')}>
        <ScrollView style={{ maxHeight: 430 }} contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled">
          <Field label={t('campaignTitle')} icon="pricetag-outline" value={title} error={errors.title} onChangeText={setTitle} placeholder="—" />
          <Field label={t('campaignDesc')} icon="text-outline" value={desc} error={errors.desc} onChangeText={setDesc} placeholder="—" multiline />
          <Field
            label={t('campaignReward')}
            icon="cash-outline"
            value={reward}
            error={errors.reward}
            onChangeText={(v) => setReward(v.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            placeholder="500"
          />
          <View style={{ gap: 6 }}>
            <Txt size={13} weight="600" color={c.sub}>
              {t('campaignDifficulty')}
            </Txt>
            <Row style={{ gap: 8 }}>
              {(['easy', 'medium', 'hard', 'vip'] as Difficulty[]).map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDifficulty(d)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: difficulty === d ? c.primary : c.chip, alignItems: 'center' }}
                >
                  <Txt size={11.5} weight="700" color={difficulty === d ? '#fff' : c.sub}>
                    {t(d)}
                  </Txt>
                </Pressable>
              ))}
            </Row>
          </View>
          <Field label={t('campaignRequirements')} icon="list-outline" value={reqs} onChangeText={setReqs} placeholder="—" multiline />
          <Field label={t('campaignSteps')} icon="footsteps-outline" value={steps} onChangeText={setSteps} placeholder="—" multiline />

          {Number(reward) > 0 ? (
            <View style={{ backgroundColor: c.chip, borderRadius: 14, padding: 12, gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={12.5} color={c.sub}>
                  {t('campaignReward')}
                </Txt>
                <Txt size={12.5} weight="700">
                  {formatDZD(cost.reward, lang)}
                </Txt>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={12.5} color={c.sub}>
                  {t('platformFee')} ({POLICY.merchantFeePct * 100}%)
                </Txt>
                <Txt size={12.5} weight="700">
                  {formatDZD(cost.fee, lang)}
                </Txt>
              </Row>
              <View style={{ height: 1, backgroundColor: c.border }} />
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={13} weight="800">
                  {t('campaignCost')}
                </Txt>
                <Txt size={14} weight="800" color={c.primary}>
                  {formatDZD(cost.total, lang)}
                </Txt>
              </Row>
            </View>
          ) : null}

          <Btn label={t('submitCampaign')} icon="send" onPress={submit} />
        </ScrollView>
      </Sheet>
    </View>
  );
}
