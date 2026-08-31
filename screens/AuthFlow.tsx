import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { LANGS } from '../lib/data';
import { useApp } from '../lib/store';
import { RateLimiter, V, formatRetry } from '../lib/security';
import { Badge, Btn, Card, FadeIn, Field, Row, Txt, useToast } from '../components/ui';

export default function AuthFlow({ onOpenLegal }: { onOpenLegal: (doc: 'terms' | 'privacy' | 'fraud') => void }) {
  const { c } = useTheme();
  const { t, lang, setLang, isRTL } = useI18n();
  const { signIn, sessionNotice, clearSessionNotice } = useApp();
  const toast = useToast();

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string | null; email?: string | null }>({});
  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [code, setCode] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [otpLeft, setOtpLeft] = useState(5);
  const [lockMsg, setLockMsg] = useState<string | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (sessionNotice) {
      toast.show(t(sessionNotice), 'warning');
      clearSessionNotice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionNotice]);

  const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

  const submitForm = () => {
    const clean = phone.replace(/\s/g, '');
    const phoneErr = V.phone(clean);
    const emailErr = V.emailOptional(email);
    setErrors({ phone: phoneErr ? t(phoneErr) : null, email: emailErr ? t(emailErr) : null });
    if (phoneErr || emailErr) return toast.show(t('fixErrors'), 'error');
    if (mode === 'signup' && !agree) return toast.show(t('mustAgree'), 'warning');

    const submit = RateLimiter.hit('auth_submit');
    if (!submit.ok) {
      setLockMsg(t('tooManyAttempts', { time: formatRetry(submit.retryInMs) }));
      return toast.show(t('tooManyAttempts', { time: formatRetry(submit.retryInMs) }), 'error');
    }
    const send = RateLimiter.hit(`otp_send`);
    if (!send.ok) {
      setLockMsg(t('rateLimited', { time: formatRetry(send.retryInMs) }));
      return toast.show(t('rateLimited', { time: formatRetry(send.retryInMs) }), 'error');
    }

    setLockMsg(null);
    setCode(genCode());
    setDigits(['', '', '', '', '', '']);
    setOtpLeft(RateLimiter.peek('otp_verify').remaining || 5);
    setStage('otp');
  };

  const onDigit = (i: number, v: string) => {
    const val = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (!val && i > 0) inputs.current[i - 1]?.focus();
  };

  const verify = () => {
    const attempt = RateLimiter.hit('otp_verify');
    if (!attempt.ok) {
      setLockMsg(t('tooManyAttempts', { time: formatRetry(attempt.retryInMs) }));
      return toast.show(t('tooManyAttempts', { time: formatRetry(attempt.retryInMs) }), 'error');
    }
    setOtpLeft(attempt.remaining);
    const entered = digits.join('');
    if (entered !== code) {
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      return toast.show(`${t('otpInvalid')} · ${t('attemptsLeft', { n: attempt.remaining })}`, 'error');
    }
    RateLimiter.reset('otp_verify');
    RateLimiter.reset('auth_submit');
    signIn(phone.replace(/\s/g, ''), email.trim());
  };

  const resend = () => {
    const send = RateLimiter.hit('otp_send');
    if (!send.ok) return toast.show(t('rateLimited', { time: formatRetry(send.retryInMs) }), 'error');
    setCode(genCode());
    setDigits(['', '', '', '', '', '']);
    toast.show(`${t('otpResent')} · ${t('attemptsLeft', { n: send.remaining })}`, 'info');
  };

  const filled = useMemo(() => digits.every((d) => d.length === 1), [digits]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ gap: 10 }}>
              <LinearGradient
                colors={[c.primary, c.primary2]}
                style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
              >
                <Txt size={22} weight="800" color="#fff">
                  Z
                </Txt>
              </LinearGradient>
              <Txt size={20} weight="800">
                Zed Earn
              </Txt>
            </Row>
            <Row style={{ gap: 6 }}>
              {LANGS.map((l) => (
                <Pressable
                  key={l.code}
                  onPress={() => setLang(l.code)}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 5,
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
          </Row>

          {lockMsg ? (
            <Card style={{ borderColor: c.red, borderWidth: 1.5, padding: 12 }}>
              <Row style={{ gap: 8 }}>
                <Ionicons name="lock-closed" size={16} color={c.red} />
                <Txt size={12.5} color={c.red} style={{ flex: 1 }}>
                  {lockMsg}
                </Txt>
              </Row>
            </Card>
          ) : null}

          {stage === 'form' ? (
            <FadeIn style={{ gap: 18 }}>
              <View>
                <Txt size={24} weight="800">
                  {mode === 'signup' ? t('signup') : t('login')}
                </Txt>
                <Txt size={14} color={c.sub} style={{ marginTop: 6 }}>
                  {mode === 'signup' ? t('authSubSignup') : t('authSubLogin')}
                </Txt>
              </View>

              <Card style={{ gap: 16 }}>
                <View style={{ gap: 6 }}>
                  <Txt size={13} weight="600" color={c.sub}>
                    {t('phone')}
                  </Txt>
                  <Row
                    style={{
                      borderWidth: 1.5,
                      borderColor: errors.phone ? c.red : c.border,
                      borderRadius: 14,
                      backgroundColor: c.card,
                      height: 54,
                      paddingHorizontal: 12,
                      gap: 8,
                    }}
                  >
                    <Row style={{ gap: 4, backgroundColor: c.chip, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
                      <Txt size={14}>🇩🇿</Txt>
                      <Txt size={14} weight="700">
                        +213
                      </Txt>
                    </Row>
                    <TextInput
                      value={phone}
                      onChangeText={(v) => {
                        setPhone(v.replace(/[^\d]/g, '').slice(0, 10));
                        if (errors.phone) setErrors((e) => ({ ...e, phone: null }));
                      }}
                      placeholder="0X XX XX XX XX"
                      placeholderTextColor={c.sub}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      style={{
                        flex: 1,
                        color: c.text,
                        fontSize: 16,
                        fontWeight: '600',
                        height: '100%',
                        textAlign: isRTL ? 'right' : 'left',
                        ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
                      }}
                    />
                  </Row>
                  {errors.phone ? (
                    <Row style={{ gap: 4 }}>
                      <Ionicons name="alert-circle" size={12} color={c.red} />
                      <Txt size={11} color={c.red}>
                        {errors.phone}
                      </Txt>
                    </Row>
                  ) : (
                    <Txt size={11} color={c.sub}>
                      {t('phoneHint')}
                    </Txt>
                  )}
                </View>

                <Field
                  label={t('emailOpt')}
                  icon="mail-outline"
                  value={email}
                  error={errors.email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (errors.email) setErrors((e) => ({ ...e, email: null }));
                  }}
                  placeholder="name@mail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {mode === 'signup' ? (
                  <View style={{ gap: 10 }}>
                    <Pressable onPress={() => setAgree((a) => !a)}>
                      <Row style={{ gap: 10, alignItems: 'flex-start' }}>
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 7,
                            borderWidth: 2,
                            borderColor: agree ? c.primary : c.border,
                            backgroundColor: agree ? c.primary : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: 1,
                          }}
                        >
                          {agree ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                        </View>
                        <Txt size={12} color={c.sub} style={{ flex: 1, lineHeight: 18 }}>
                          {t('agreeTermsLink')}
                        </Txt>
                      </Row>
                    </Pressable>
                    <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                      {(['terms', 'privacy', 'fraud'] as const).map((d) => (
                        <Pressable
                          key={d}
                          onPress={() => onOpenLegal(d)}
                          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: c.chip }}
                        >
                          <Txt size={11} weight="700" color={c.primary}>
                            {t(d)}
                          </Txt>
                        </Pressable>
                      ))}
                    </Row>
                  </View>
                ) : null}

                <Btn label={mode === 'signup' ? t('signup') : t('login')} icon="arrow-forward" onPress={submitForm} />
              </Card>

              <Pressable onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')} hitSlop={8}>
                <Txt size={13} weight="700" color={c.primary} center>
                  {mode === 'signup' ? t('haveAccount') : t('noAccount')}
                </Txt>
              </Pressable>

              <Row style={{ gap: 6, justifyContent: 'center' }}>
                <Ionicons name="lock-closed" size={12} color={c.sub} />
                <Txt size={11} color={c.sub}>
                  {t('secured')} · rate-limit · OTP · session guard
                </Txt>
              </Row>
            </FadeIn>
          ) : (
            <FadeIn style={{ gap: 18 }}>
              <Pressable onPress={() => setStage('form')} hitSlop={8}>
                <Row style={{ gap: 6 }}>
                  <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={18} color={c.sub} />
                  <Txt size={13} color={c.sub}>
                    {t('back')}
                  </Txt>
                </Row>
              </Pressable>

              <View>
                <Txt size={24} weight="800">
                  {t('otpTitle')}
                </Txt>
                <Txt size={14} color={c.sub} style={{ marginTop: 6 }}>
                  {t('otpSubtitle')} +213 {phone.replace(/^0/, '')}
                </Txt>
              </View>

              <Card style={{ gap: 18 }}>
                <Row style={{ gap: 8, justifyContent: 'center' }}>
                  {digits.map((d, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => {
                        inputs.current[i] = r;
                      }}
                      value={d}
                      onChangeText={(v) => onDigit(i, v)}
                      keyboardType="number-pad"
                      maxLength={1}
                      style={{
                        width: 46,
                        height: 56,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: d ? c.primary : c.border,
                        backgroundColor: d ? c.primary + '11' : c.chip,
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: '800',
                        color: c.text,
                        ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
                      }}
                    />
                  ))}
                </Row>

                <Row style={{ justifyContent: 'center', gap: 8 }}>
                  <Badge label={`${t('otpDemo')}: ${code}`} color={c.gold} icon="key" />
                  <Badge label={t('attemptsLeft', { n: otpLeft })} color={c.sub} icon="shield-half" />
                </Row>

                <Btn label={t('otpVerify')} icon="checkmark-circle" onPress={verify} disabled={!filled} />
                <Pressable onPress={resend} hitSlop={8}>
                  <Txt size={13} weight="700" color={c.primary} center>
                    {t('otpResend')}
                  </Txt>
                </Pressable>
              </Card>
            </FadeIn>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
