import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { DEMO_CHAT } from '../lib/data';
import { useApp } from '../lib/store';
import { ScreenHeader } from '../components/Header';
import { Row, Txt } from '../components/ui';

export default function ChatScreen({ navigation }: any) {
  const { c } = useTheme();
  const { t, lang, isRTL } = useI18n();
  const { chat, sendChat } = useApp();
  const [text, setText] = useState('');
  const list = useRef<FlatList>(null);

  const messages = useMemo(
    () => [
      { id: 'intro', from: 'support' as const, text: DEMO_CHAT[0].text[lang], time: DEMO_CHAT[0].time },
      ...chat,
    ],
    [chat, lang]
  );

  useEffect(() => {
    const id = setTimeout(() => list.current?.scrollToEnd({ animated: true }), 150);
    return () => clearTimeout(id);
  }, [messages.length]);

  const send = () => {
    const v = text.trim();
    if (!v) return;
    sendChat(v, lang);
    setText('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('chatTitle')} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => {
            const mine = item.from === 'user';
            return (
              <View style={{ alignItems: mine ? (isRTL ? 'flex-start' : 'flex-end') : isRTL ? 'flex-end' : 'flex-start' }}>
                {!mine ? (
                  <Row style={{ gap: 6, marginBottom: 4 }}>
                    <Ionicons name="headset" size={13} color={c.sub} />
                    <Txt size={11} color={c.sub}>
                      {t('supportName')}
                    </Txt>
                  </Row>
                ) : null}
                <View
                  style={{
                    maxWidth: '82%',
                    backgroundColor: mine ? c.gold : c.card,
                    borderRadius: 18,
                    borderBottomRightRadius: mine ? 6 : 18,
                    borderBottomLeftRadius: mine ? 18 : 6,
                    padding: 12,
                    borderWidth: mine ? 0 : 1,
                    borderColor: c.border,
                  }}
                >
                  <Txt size={13.5} color={mine ? '#fff' : c.text} style={{ lineHeight: 20 }}>
                    {item.text}
                  </Txt>
                  <Txt size={10} color={mine ? 'rgba(255,255,255,0.8)' : c.sub} style={{ marginTop: 4 }}>
                    {item.time}
                  </Txt>
                </View>
              </View>
            );
          }}
        />

        <View style={{ padding: 12, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border }}>
          <Row style={{ gap: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: c.chip,
                borderRadius: 24,
                paddingHorizontal: 16,
                height: 48,
                justifyContent: 'center',
              }}
            >
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t('chatPlaceholder')}
                placeholderTextColor={c.sub}
                onSubmitEditing={send}
                returnKeyType="send"
                style={{
                  color: c.text,
                  fontSize: 14,
                  textAlign: isRTL ? 'right' : 'left',
                  ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
                }}
              />
            </View>
            <Pressable
              onPress={send}
              style={({ pressed }) => [
                {
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: c.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name={isRTL ? 'send' : 'send'} size={20} color="#fff" />
            </Pressable>
          </Row>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
