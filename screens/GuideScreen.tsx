import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { GUIDE } from '../lib/data';
import { Btn, Card, Row, Txt } from '../components/ui';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  intro: 'book',
  tasks: 'list',
  commissions: 'cash',
  withdraw: 'card',
  rules: 'shield-checkmark',
};

export default function GuideScreen({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const scroller = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const [active, setActive] = useState(GUIDE[0].id);

  const onScroll = (y: number) => {
    let current = GUIDE[0].id;
    GUIDE.forEach((s) => {
      const off = offsets.current[s.id] ?? 0;
      if (y + 90 >= off) current = s.id;
    });
    if (current !== active) setActive(current);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10 }}>
        <Txt size={22} weight="800">
          {t('guideTitle')}
        </Txt>
      </View>

      {/* Sticky scrollspy nav */}
      <View style={{ backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 8 }}>
          {GUIDE.map((s) => {
            const on = active === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => scroller.current?.scrollTo({ y: (offsets.current[s.id] ?? 0) - 8, animated: true })}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 999,
                  backgroundColor: on ? c.primary : c.chip,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name={ICONS[s.id]} size={14} color={on ? '#fff' : c.sub} />
                <Txt size={12} weight="700" color={on ? '#fff' : c.sub}>
                  {t(s.titleKey)}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={scroller}
        scrollEventThrottle={16}
        onScroll={(e) => onScroll(e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ padding: 18, paddingBottom: 30, gap: 14 }}
      >
        {GUIDE.map((s, idx) => (
          <View
            key={s.id}
            onLayout={(e) => {
              offsets.current[s.id] = e.nativeEvent.layout.y;
            }}
          >
            <Card style={{ gap: 12 }}>
              <Row style={{ gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: c.primary + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={ICONS[s.id]} size={19} color={c.primary} />
                </View>
                <Txt size={17} weight="800">
                  {idx + 1}. {t(s.titleKey)}
                </Txt>
              </Row>
              {s.body[lang].map((p, i) => (
                <Row key={i} style={{ gap: 8, alignItems: 'flex-start' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.gold, marginTop: 8 }} />
                  <Txt size={13.5} color={c.sub} style={{ flex: 1, lineHeight: 22 }}>
                    {p}
                  </Txt>
                </Row>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>

      <View style={{ padding: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface }}>
        <Btn label={t('guideRead')} icon="checkmark-done" onPress={onDone} />
      </View>
    </SafeAreaView>
  );
}
