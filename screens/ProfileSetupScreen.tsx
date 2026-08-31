import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { WILAYAS } from '../lib/data';
import { useApp } from '../lib/store';
import { pickImage } from '../lib/pick';
import { V } from '../lib/security';
import { Btn, Card, Field, Row, Txt, useToast } from '../components/ui';

export function WilayaPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const { c } = useTheme();
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const list = WILAYAS[lang];
  return (
    <View style={{ gap: 6 }}>
      <Txt size={13} weight="600" color={c.sub}>
        {label}
      </Txt>
      <Pressable onPress={() => setOpen(true)}>
        <Row
          style={{
            borderWidth: 1.5,
            borderColor: c.border,
            borderRadius: 14,
            backgroundColor: c.card,
            height: 52,
            paddingHorizontal: 14,
            justifyContent: 'space-between',
          }}
        >
          <Row style={{ gap: 8 }}>
            <Ionicons name="location-outline" size={18} color={c.sub} />
            <Txt size={15} color={value ? c.text : c.sub}>
              {value || '—'}
            </Txt>
          </Row>
          <Ionicons name="chevron-down" size={18} color={c.sub} />
        </Row>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end', alignItems: 'center' }}>
          <View style={{ width: '100%', maxWidth: 480, backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' }}>
            <Row style={{ justifyContent: 'space-between', padding: 18 }}>
              <Txt size={17} weight="800">
                {label}
              </Txt>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={c.sub} />
              </Pressable>
            </Row>
            <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
              {list.map((w) => (
                <Pressable
                  key={w}
                  onPress={() => {
                    onChange(w);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [{ backgroundColor: pressed ? c.chip : 'transparent' }]}
                >
                  <Row style={{ padding: 16, justifyContent: 'space-between' }}>
                    <Txt size={15}>{w}</Txt>
                    {value === w ? <Ionicons name="checkmark-circle" size={20} color={c.primary} /> : null}
                  </Row>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function ProfileSetupScreen({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const { t } = useI18n();
  const { user, saveProfile } = useApp();
  const toast = useToast();

  const [avatar, setAvatar] = useState<string | null>(user.avatar);
  const [name, setName] = useState(user.name);
  const [birth, setBirth] = useState(user.birthdate);
  const [wilaya, setWilaya] = useState(user.wilaya);
  const [ccp, setCcp] = useState(user.ccp);
  const [errors, setErrors] = useState<{ name?: string | null; birth?: string | null; ccp?: string | null }>({});

  const formatDate = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8);
    const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean);
    return parts.join('/');
  };

  const save = () => {
    const nameErr = V.name(name);
    const birthErr = V.birthdate(birth);
    const ccpErr = V.ccp(ccp);
    setErrors({
      name: nameErr ? t(nameErr) : null,
      birth: birthErr ? t(birthErr) : null,
      ccp: ccpErr ? t(ccpErr) : null,
    });
    if (nameErr || birthErr || ccpErr) return toast.show(t('fixErrors'), 'error');
    saveProfile({ avatar, name: name.trim(), birthdate: birth, wilaya, ccp });
    toast.show(t('profileSaved'), 'success');
    onDone();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }} keyboardShouldPersistTaps="handled">
          <View>
            <Txt size={23} weight="800">
              {t('profileSetup')}
            </Txt>
            <Txt size={13.5} color={c.sub} style={{ marginTop: 6 }}>
              {t('profileSetupSub')}
            </Txt>
          </View>

          <View style={{ alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={async () => {
                const uri = await pickImage();
                if (uri) setAvatar(uri);
              }}
            >
              <View
                style={{
                  width: 108,
                  height: 108,
                  borderRadius: 54,
                  backgroundColor: c.chip,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: c.primary + '55',
                  overflow: 'hidden',
                }}
              >
                {avatar ? (
                  <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <Ionicons name="camera" size={34} color={c.sub} />
                )}
              </View>
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: c.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: c.bg,
                }}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </View>
            </Pressable>
            <Txt size={12} color={c.sub}>
              {t('uploadAvatar')}
            </Txt>
          </View>

          <Card style={{ gap: 16 }}>
            <Field
              label={t('fullName')}
              icon="person-outline"
              value={name}
              error={errors.name}
              onChangeText={(v) => {
                setName(v);
                if (errors.name) setErrors((e) => ({ ...e, name: null }));
              }}
              placeholder="—"
            />
            <Field
              label={t('birthdate')}
              icon="calendar-outline"
              value={birth}
              error={errors.birth}
              onChangeText={(v) => {
                setBirth(formatDate(v));
                if (errors.birth) setErrors((e) => ({ ...e, birth: null }));
              }}
              placeholder="JJ/MM/AAAA"
              keyboardType="number-pad"
            />
            <WilayaPicker label={t('wilaya')} value={wilaya} onChange={setWilaya} />
            <Field
              label={t('ccp')}
              hint={t('ccpHint')}
              icon="card-outline"
              value={ccp}
              error={errors.ccp}
              onChangeText={(v) => {
                setCcp(v.replace(/[^\d]/g, '').slice(0, 12));
                if (errors.ccp) setErrors((e) => ({ ...e, ccp: null }));
              }}
              placeholder="0012345678 25"
              keyboardType="number-pad"
            />
          </Card>

          <Btn label={t('save')} icon="save" onPress={save} />
          <Pressable onPress={onDone} hitSlop={8}>
            <Txt size={13} weight="700" color={c.sub} center>
              {t('skip')}
            </Txt>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
