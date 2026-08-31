import React, { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { formatDZD, useI18n } from '../lib/i18n';
import { LANGS } from '../lib/data';
import { useApp } from '../lib/store';
import { LEGAL_DOCS } from '../lib/legal';
import { POLICY } from '../lib/policy';
import { RateLimiter, formatRetry } from '../lib/security';
import { useInstallPrompt } from '../lib/pwa';
import { TabHeader } from '../components/Header';
import { Badge, Btn, Card, FadeIn, Field, ProgressBar, Row, SectionTitle, Sheet, Txt, useToast } from '../components/ui';

export default function ProfileScreen({ navigation }: any) {
  const { c, isDark, toggle } = useTheme();
  const { t, lang, setLang } = useI18n();
  const toast = useToast();
  const {
    user,
    role,
    isAdmin,
    isMerchant,
    level,
    levelProgress,
    completedCount,
    activeCount,
    txs,
    kyc,
    session,
    legal,
    pendingReviewCount,
    signOut,
    grantAdmin,
    revokeAdmin,
  } = useApp();
  const { canInstall, installed, promptInstall, isWeb } = useInstallPrompt();

  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState('');

  const earned = txs.filter((x) => x.type === 'task').reduce((s, x) => s + x.amount, 0);

  const items: { key: string; icon: any; route: string; color: string; params?: any }[] = [
    { key: 'kyc', icon: 'shield-checkmark', route: 'Kyc', color: '#10B981' },
    { key: 'referral', icon: 'gift', route: 'Referral', color: '#F59E0B' },
    { key: 'leaderboard', icon: 'trophy', route: 'Leaderboard', color: '#EAB308' },
    { key: 'wallet', icon: 'wallet', route: 'Wallet', color: '#2563EB' },
    { key: 'support', icon: 'chatbubbles', route: 'Chat', color: '#0EA5E9' },
    { key: 'merchant', icon: 'storefront', route: 'Merchant', color: '#7C3AED' },
    { key: 'legal', icon: 'document-text', route: 'Legal', color: '#64748B' },
  ];

  const roleLabel = role === 'admin' ? t('roleAdmin') : isMerchant ? t('roleMerchant') : t('roleUser');

  const submitPin = () => {
    const rl = RateLimiter.hit('admin_pin');
    if (!rl.ok) return toast.show(t('tooManyAttempts', { time: formatRetry(rl.retryInMs) }), 'error');
    if (!grantAdmin(pin.trim())) {
      setPin('');
      return toast.show(`${t('wrongPin')} · ${t('attemptsLeft', { n: rl.remaining })}`, 'error');
    }
    RateLimiter.reset('admin_pin');
    setPin('');
    setPinOpen(false);
    toast.show(t('adminGranted'), 'success');
    navigation.navigate('Admin');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TabHeader title={t('profile')} icon="person" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 34, gap: 16 }}>
        <FadeIn>
          <LinearGradient colors={[c.primary, c.primary2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, padding: 20, gap: 14 }}>
            <Row style={{ gap: 14 }}>
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <Ionicons name="person" size={32} color="#fff" />
                )}
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Txt size={18} weight="800" color="#fff" numberOfLines={1}>
                  {user.name || user.phone || 'Zed Earn'}
                </Txt>
                <Txt size={12} color="rgba(255,255,255,0.85)">
                  +213 {user.phone.replace(/^0/, '')}
                </Txt>
                <Row style={{ gap: 6, flexWrap: 'wrap' }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 }}>
                    <Txt size={11} weight="700" color="#fff">
                      ⭐ {t(level)}
                    </Txt>
                  </View>
                  <View
                    style={{
                      backgroundColor: kyc.status === 'approved' ? '#10B981' : 'rgba(255,255,255,0.25)',
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      borderRadius: 999,
                    }}
                  >
                    <Txt size={11} weight="700" color="#fff">
                      {kyc.status === 'approved' ? `✓ ${t('verified')}` : t(kyc.status === 'pending' ? 'kycPending' : kyc.status === 'rejected' ? 'kycRejectedS' : 'unverified')}
                    </Txt>
                  </View>
                  <View style={{ backgroundColor: role === 'admin' ? '#7C3AED' : 'rgba(255,255,255,0.25)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 }}>
                    <Txt size={11} weight="700" color="#fff">
                      {roleLabel}
                    </Txt>
                  </View>
                </Row>
              </View>
            </Row>

            <Row style={{ justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 12 }}>
              {[
                { v: String(activeCount), l: t('statTasks') },
                { v: String(completedCount), l: t('statDone') },
                { v: String(earned), l: 'DZD' },
              ].map((s, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <Txt size={17} weight="800" color="#fff">
                    {s.v}
                  </Txt>
                  <Txt size={11} color="rgba(255,255,255,0.85)">
                    {s.l}
                  </Txt>
                </View>
              ))}
            </Row>
          </LinearGradient>
        </FadeIn>

        <FadeIn delay={60}>
          <Card style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={14} weight="700">
                {levelProgress.next ? t('nextLevel', { level: t(levelProgress.next) }) : t('maxLevel')}
              </Txt>
              <Txt size={12} color={c.sub}>
                {levelProgress.current}/{levelProgress.target}
              </Txt>
            </Row>
            <ProgressBar pct={levelProgress.pct} color={c.gold} />
            <Row style={{ justifyContent: 'space-between' }}>
              {(['lvlBeginner', 'lvlActive', 'lvlPro', 'lvlVip'] as const).map((l) => (
                <Badge key={l} label={`${t(l)} +${Math.round((POLICY.levelBonus[l] ?? 0) * 100)}%`} color={l === level ? c.gold : c.sub} />
              ))}
            </Row>
          </Card>
        </FadeIn>

        {isWeb && !installed ? (
          <FadeIn delay={80}>
            <Card style={{ gap: 10 }}>
              <Row style={{ gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.primary + '1F', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="download" size={19} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={14} weight="700">
                    {t('installApp')}
                  </Txt>
                  <Txt size={11.5} color={c.sub}>
                    {t('installHint')}
                  </Txt>
                </View>
              </Row>
              <Btn
                small
                label={t('installApp')}
                icon="phone-portrait"
                onPress={async () => {
                  const res = await promptInstall();
                  toast.show(res === 'accepted' ? t('installDone') : res === 'unavailable' ? t('installUnavailable') : t('installHint'), res === 'accepted' ? 'success' : 'info');
                }}
                disabled={!canInstall}
              />
            </Card>
          </FadeIn>
        ) : null}

        <View>
          <SectionTitle title={t('settings')} />
          <Card style={{ padding: 6 }}>
            {items.map((it, i) => (
              <Pressable
                key={it.key}
                onPress={() => navigation.navigate(it.route, it.params)}
                style={({ pressed }) => [{ borderRadius: 14, backgroundColor: pressed ? c.chip : 'transparent' }]}
              >
                <Row style={{ padding: 12, gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: it.color + '1F', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={it.icon} size={18} color={it.color} />
                  </View>
                  <Txt size={14} weight="600" style={{ flex: 1 }}>
                    {t(it.key)}
                  </Txt>
                  {it.key === 'kyc' ? (
                    <Badge
                      label={t(kyc.status === 'approved' ? 'kycApproved' : kyc.status === 'pending' ? 'kycPending' : kyc.status === 'rejected' ? 'kycRejectedS' : 'kycNone')}
                      color={kyc.status === 'approved' ? c.green : kyc.status === 'pending' ? c.gold : kyc.status === 'rejected' ? c.red : c.sub}
                    />
                  ) : null}
                  {it.key === 'merchant' && isMerchant ? <Badge label={t('roleMerchant')} color={c.purple} /> : null}
                  <Ionicons name="chevron-forward" size={17} color={c.sub} />
                </Row>
                {i < items.length - 1 ? <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 12 }} /> : null}
              </Pressable>
            ))}
          </Card>
        </View>

        <Card style={{ gap: 12 }}>
          <Row style={{ gap: 10 }}>
            <Ionicons name="shield" size={19} color={c.purple} />
            <Txt size={14} weight="700" style={{ flex: 1 }}>
              {t('adminAccess')}
            </Txt>
            {isAdmin ? <Badge label={t('roleAdmin')} color={c.purple} icon="shield-checkmark" /> : null}
          </Row>
          {isAdmin ? (
            <Row style={{ gap: 10 }}>
              <Btn
                small
                style={{ flex: 1 }}
                label={`${t('adminPanel')}${pendingReviewCount ? ` (${pendingReviewCount})` : ''}`}
                icon="grid"
                onPress={() => navigation.navigate('Admin')}
              />
              <Btn
                small
                style={{ flex: 1 }}
                variant="outline"
                label={t('exitAdmin')}
                onPress={() => {
                  revokeAdmin();
                  toast.show(t('adminRevoked'), 'info');
                }}
              />
            </Row>
          ) : (
            <Btn small variant="outline" label={t('adminAccess')} icon="key" onPress={() => setPinOpen(true)} />
          )}
        </Card>

        <Card style={{ gap: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ gap: 10 }}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={19} color={c.gold} />
              <Txt size={14} weight="600">
                {t('darkMode')}
              </Txt>
            </Row>
            <Switch value={isDark} onValueChange={toggle} trackColor={{ true: c.primary }} />
          </Row>
          <View style={{ height: 1, backgroundColor: c.border }} />
          <Row style={{ gap: 10 }}>
            <Ionicons name="language" size={19} color={c.blue} />
            <Txt size={14} weight="600">
              {t('language')}
            </Txt>
          </Row>
          <Row style={{ gap: 8 }}>
            {LANGS.map((l) => (
              <Pressable
                key={l.code}
                onPress={() => setLang(l.code)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: lang === l.code ? c.primary : c.chip, alignItems: 'center' }}
              >
                <Txt size={12} weight="700" color={lang === l.code ? '#fff' : c.sub}>
                  {l.flag} {l.label}
                </Txt>
              </Pressable>
            ))}
          </Row>
        </Card>

        <Card style={{ gap: 8 }}>
          <Row style={{ gap: 8 }}>
            <Ionicons name="information-circle" size={17} color={c.sub} />
            <Txt size={13.5} weight="700">
              {t('appInfo')}
            </Txt>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt size={12} color={c.sub}>
              {t('sessionActive')}
            </Txt>
            <Txt size={12} weight="600">
              {session ? new Date(session.expiresAt).toLocaleString() : '—'}
            </Txt>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt size={12} color={c.sub}>
              {t('acceptedOn')}
            </Txt>
            <Txt size={12} weight="600">
              {legal ? `${new Date(legal.acceptedAt).toLocaleDateString()} · v${legal.version}` : '—'}
            </Txt>
          </Row>
          <Row style={{ gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {LEGAL_DOCS.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => navigation.navigate('Legal', { doc: d.id })}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: c.chip }}
              >
                <Txt size={11} weight="700" color={c.primary}>
                  {t(d.id)}
                </Txt>
              </Pressable>
            ))}
          </Row>
        </Card>

        <Pressable
          onPress={() => {
            signOut();
            toast.show(t('loggedOut'), 'info');
          }}
        >
          <Card style={{ padding: 14 }}>
            <Row style={{ gap: 10, justifyContent: 'center' }}>
              <Ionicons name="log-out" size={19} color={c.red} />
              <Txt size={14} weight="700" color={c.red}>
                {t('logout')}
              </Txt>
            </Row>
          </Card>
        </Pressable>

        <Txt size={11} color={c.sub} center>
          Zed Earn v1.2.0 · {formatDZD(0, lang).split(' ')[1]} · PWA 🇩🇿
        </Txt>
      </ScrollView>

      <Sheet visible={pinOpen} onClose={() => setPinOpen(false)} title={t('adminAccess')}>
        <Field
          label={t('adminPin')}
          hint={t('adminHint')}
          icon="key-outline"
          value={pin}
          onChangeText={(v) => setPin(v.replace(/[^\d]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="••••"
        />
        <Btn label={t('confirm')} icon="shield-checkmark" onPress={submitPin} />
      </Sheet>
    </View>
  );
}
