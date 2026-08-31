import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { LEGAL_DOCS, LegalDocId } from '../lib/legal';
import { useApp } from '../lib/store';
import { ScreenHeader } from '../components/Header';
import { Badge, Card, FadeIn, Row, Segmented, Txt } from '../components/ui';

export default function LegalScreen({ route, navigation }: any) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const { legal } = useApp();
  const [doc, setDoc] = useState<LegalDocId>((route?.params?.doc as LegalDocId) ?? 'terms');
  const current = LEGAL_DOCS.find((d) => d.id === doc)!;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('legal')} onBack={() => navigation.goBack()} />
      <View style={{ paddingVertical: 12, paddingHorizontal: 14, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Segmented
          value={doc}
          onChange={(v) => setDoc(v)}
          items={LEGAL_DOCS.map((d) => ({ key: d.id, label: t(d.id), icon: d.icon as any }))}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36, gap: 14 }}>
        <FadeIn key={doc}>
          <Card style={{ gap: 12 }}>
            <Row style={{ gap: 10 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  backgroundColor: c.primary + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={current.icon as any} size={21} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={17} weight="800">
                  {current.title[lang]}
                </Txt>
                <Txt size={11.5} color={c.sub}>
                  {t('version')} {current.version} · {t('updated')} {current.updated}
                </Txt>
              </View>
            </Row>
            <Txt size={13.5} color={c.sub} style={{ lineHeight: 22 }}>
              {current.intro[lang]}
            </Txt>
            {legal ? (
              <Badge
                label={`${t('acceptedOn')} ${new Date(legal.acceptedAt).toLocaleDateString()} · v${legal.version}`}
                color={c.green}
                icon="checkmark-circle"
              />
            ) : null}
          </Card>
        </FadeIn>

        {current.sections[lang].map((s, i) => (
          <FadeIn key={`${doc}-${i}`} delay={i * 55}>
            <Card style={{ gap: 10 }}>
              <Txt size={15} weight="800">
                {s.title}
              </Txt>
              {s.paragraphs.map((p, j) => (
                <Row key={j} style={{ gap: 8, alignItems: 'flex-start' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.gold, marginTop: 8 }} />
                  <Txt size={13.5} color={c.sub} style={{ flex: 1, lineHeight: 22 }}>
                    {p}
                  </Txt>
                </Row>
              ))}
            </Card>
          </FadeIn>
        ))}

        <Row style={{ gap: 8, justifyContent: 'center', paddingTop: 4 }}>
          <Ionicons name="shield-checkmark" size={14} color={c.sub} />
          <Txt size={11} color={c.sub}>
            Zed Earn · {t('version')} {current.version}
          </Txt>
        </Row>

        <Row style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {LEGAL_DOCS.filter((d) => d.id !== doc).map((d) => (
            <Pressable
              key={d.id}
              onPress={() => setDoc(d.id)}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: c.chip }}
            >
              <Txt size={11.5} weight="700" color={c.primary}>
                {t(d.id)}
              </Txt>
            </Pressable>
          ))}
        </Row>
      </ScrollView>
    </View>
  );
}
