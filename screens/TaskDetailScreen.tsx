import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { formatDZD, useI18n } from '../lib/i18n';
import { useApp } from '../lib/store';
import { POLICY } from '../lib/policy';
import { pickImage } from '../lib/pick';
import { ScreenHeader } from '../components/Header';
import { useDifficulty } from '../components/TaskCard';
import { Badge, Btn, Card, FadeIn, Row, Txt, useToast } from '../components/ui';

export default function TaskDetailScreen({ route, navigation }: any) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const toast = useToast();
  const { allTasks, taskStates, acceptTask, cancelTask, submitProof, commissionFor, isAdmin, reviewProof, level } = useApp();
  const task = allTasks.find((x) => x.id === route.params?.id);
  const state = taskStates[task?.id ?? ''];
  const diff = useDifficulty()(task?.difficulty ?? 'easy');
  const [proof, setProof] = useState<string | null>(state?.proof ?? null);

  if (!task) return null;

  const status = state?.status ?? 'available';
  const breakdown = commissionFor(task.reward);
  const attempts = state?.attempts ?? 0;
  const canResubmit = attempts < POLICY.proofMaxResubmits;

  const statusLabel =
    status === 'available'
      ? t('statusAvailable')
      : status === 'accepted'
      ? t('statusAccepted')
      : status === 'review'
      ? t('statusReview')
      : status === 'rejected'
      ? t('rejected')
      : t('statusDone');

  const uploader = (
    <Pressable
      onPress={async () => {
        const uri = await pickImage();
        if (uri) setProof(uri);
      }}
    >
      <View
        style={{
          height: proof ? 190 : 120,
          borderRadius: 16,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: c.border,
          backgroundColor: c.chip,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {proof ? (
          <Image source={{ uri: proof }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={30} color={c.sub} />
            <Txt size={12.5} color={c.sub} style={{ marginTop: 6 }}>
              {t('tapToUpload')}
            </Txt>
          </>
        )}
      </View>
    </Pressable>
  );

  const send = () => {
    if (!proof) return toast.show(t('needProof'), 'warning');
    if (!canResubmit) return toast.show(t('noMoreAttempts'), 'error');
    submitProof(task.id, proof);
    toast.show(t('proofSent'), 'success');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={task.title[lang]} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36, gap: 14 }}>
        <FadeIn>
          <LinearGradient
            colors={[task.color, task.color + 'AA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 20, gap: 12 }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={task.icon as any} size={28} color="#fff" />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt size={12} color="rgba(255,255,255,0.85)">
                  {t('totalCredit')}
                </Txt>
                <Txt size={22} weight="800" color="#fff">
                  {formatDZD(breakdown.total, lang)}
                </Txt>
              </View>
            </Row>
            <Txt size={19} weight="800" color="#fff">
              {task.title[lang]}
            </Txt>
            <Txt size={13.5} color="rgba(255,255,255,0.9)" style={{ lineHeight: 21 }}>
              {task.desc[lang]}
            </Txt>
            <Row style={{ gap: 8 }}>
              {[diff.label, statusLabel].map((label, i) => (
                <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
                  <Txt size={11} weight="700" color="#fff">
                    {label}
                  </Txt>
                </View>
              ))}
            </Row>
          </LinearGradient>
        </FadeIn>

        <FadeIn delay={60}>
          <Card style={{ gap: 8 }}>
            <Row style={{ gap: 8 }}>
              <Ionicons name="calculator" size={17} color={c.primary} />
              <Txt size={14} weight="800">
                {t('commissions')}
              </Txt>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={12.5} color={c.sub}>
                {t('baseReward')}
              </Txt>
              <Txt size={12.5} weight="700">
                {formatDZD(breakdown.base, lang)}
              </Txt>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={12.5} color={c.sub}>
                {t('levelBonus')} ({t(level)} +{Math.round(breakdown.bonusPct * 100)}%)
              </Txt>
              <Txt size={12.5} weight="700" color={c.green}>
                +{formatDZD(breakdown.bonus, lang)}
              </Txt>
            </Row>
            <View style={{ height: 1, backgroundColor: c.border }} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={13} weight="800">
                {t('totalCredit')}
              </Txt>
              <Txt size={14} weight="800" color={c.green}>
                {formatDZD(breakdown.total, lang)}
              </Txt>
            </Row>
          </Card>
        </FadeIn>

        <FadeIn delay={90}>
          <Card style={{ gap: 12 }}>
            <Row style={{ gap: 8 }}>
              <Ionicons name="checkmark-circle" size={18} color={c.green} />
              <Txt size={15} weight="800">
                {t('requirements')}
              </Txt>
            </Row>
            {task.requirements[lang].map((r, i) => (
              <Row key={i} style={{ gap: 8, alignItems: 'flex-start' }}>
                <Ionicons name="ellipse" size={7} color={c.green} style={{ marginTop: 7 }} />
                <Txt size={13.5} color={c.sub} style={{ flex: 1, lineHeight: 21 }}>
                  {r}
                </Txt>
              </Row>
            ))}
          </Card>
        </FadeIn>

        <FadeIn delay={130}>
          <Card style={{ gap: 14 }}>
            <Row style={{ gap: 8 }}>
              <Ionicons name="footsteps" size={18} color={c.primary} />
              <Txt size={15} weight="800">
                {t('steps')}
              </Txt>
            </Row>
            {task.steps[lang].map((s, i) => (
              <Row key={i} style={{ gap: 10, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: c.primary + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt size={12} weight="800" color={c.primary}>
                    {i + 1}
                  </Txt>
                </View>
                <Txt size={13.5} style={{ flex: 1, lineHeight: 21 }}>
                  {s}
                </Txt>
              </Row>
            ))}
          </Card>
        </FadeIn>

        <FadeIn delay={170}>
          {status === 'available' ? (
            <Btn
              label={t('acceptTask')}
              icon="hand-right"
              onPress={() => {
                acceptTask(task.id);
                toast.show(t('taskAccepted'), 'success');
              }}
            />
          ) : status === 'accepted' ? (
            <Card style={{ gap: 14 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt size={15} weight="800">
                  {t('uploadProof')}
                </Txt>
                <Badge label={t('attemptsUsed', { n: attempts, max: POLICY.proofMaxResubmits })} color={c.sub} />
              </Row>
              <Txt size={12.5} color={c.sub}>
                {t('proofHint')}
              </Txt>
              {uploader}
              <Btn label={t('sendProof')} icon="send" onPress={send} />
              <Btn
                label={t('cancelTask')}
                variant="outline"
                icon="close-circle-outline"
                onPress={() => {
                  cancelTask(task.id);
                  setProof(null);
                  toast.show(t('taskCancelled'), 'info');
                }}
              />
            </Card>
          ) : status === 'review' ? (
            <Card style={{ gap: 10, alignItems: 'center', paddingVertical: 24 }}>
              <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: c.gold + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="time" size={30} color={c.gold} />
              </View>
              <Txt size={16} weight="800" center>
                {t('statusReview')}
              </Txt>
              <Txt size={13} color={c.sub} center style={{ lineHeight: 20 }}>
                {t('reviewMsg')}
              </Txt>
              {state?.proof ? (
                <Image source={{ uri: state.proof }} style={{ width: '100%', height: 150, borderRadius: 14, marginTop: 8 }} contentFit="cover" />
              ) : null}
              {isAdmin ? (
                <Row style={{ gap: 10, width: '100%', marginTop: 8 }}>
                  <Btn small style={{ flex: 1 }} label={t('approve')} onPress={() => reviewProof(task.id, 'approve', undefined, 'admin')} />
                  <Btn
                    small
                    style={{ flex: 1 }}
                    variant="outline"
                    label={t('reject')}
                    onPress={() => reviewProof(task.id, 'reject', 'Preuve illisible', 'admin')}
                  />
                </Row>
              ) : null}
            </Card>
          ) : status === 'rejected' ? (
            <Card style={{ gap: 14 }}>
              <Row style={{ gap: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.red + '1F', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close-circle" size={22} color={c.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={15} weight="800">
                    {t('rejected')}
                  </Txt>
                  <Txt size={12.5} color={c.red}>
                    {t('proofRejected', { reason: state?.reason ?? '—' })}
                  </Txt>
                </View>
              </Row>
              <Badge label={t('attemptsUsed', { n: attempts, max: POLICY.proofMaxResubmits })} color={canResubmit ? c.gold : c.red} />
              {canResubmit ? (
                <>
                  {uploader}
                  <Btn label={t('resubmitProof')} icon="refresh" onPress={send} />
                </>
              ) : (
                <Txt size={12.5} color={c.red}>
                  {t('noMoreAttempts')}
                </Txt>
              )}
              <Btn
                label={t('cancelTask')}
                variant="outline"
                icon="close-circle-outline"
                onPress={() => {
                  cancelTask(task.id);
                  setProof(null);
                  toast.show(t('taskCancelled'), 'info');
                }}
              />
            </Card>
          ) : (
            <Card style={{ gap: 10, alignItems: 'center', paddingVertical: 26 }}>
              <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: c.green + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-done" size={30} color={c.green} />
              </View>
              <Txt size={16} weight="800" center>
                {t('statusDone')}
              </Txt>
              <Txt size={13} color={c.sub} center>
                {t('doneMsg', { amount: formatDZD(breakdown.total, lang) })}
              </Txt>
              <Badge
                label={`${t('reviewedBy')}: ${state?.reviewedBy === 'auto' ? t('autoReviewer') : t('admin')}`}
                color={c.green}
                icon="trophy"
              />
            </Card>
          )}
        </FadeIn>
      </ScrollView>
    </View>
  );
}
