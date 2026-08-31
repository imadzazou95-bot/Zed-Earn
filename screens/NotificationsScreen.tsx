import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { useApp } from '../lib/store';
import { ScreenHeader } from '../components/Header';
import { Card, EmptyState, FadeIn, Row, Txt, useToast } from '../components/ui';

export default function NotificationsScreen({ navigation }: any) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const toast = useToast();
  const { notifs, markAllRead, markRead } = useApp();

  const meta = (type: string) =>
    type === 'success'
      ? { color: c.green, icon: 'checkmark-circle' as const }
      : type === 'warning'
      ? { color: c.gold, icon: 'alert-circle' as const }
      : { color: c.primary, icon: 'information-circle' as const };

  const timeLabel = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 60000);
    if (diff < 1) return lang === 'ar' ? 'الآن' : lang === 'fr' ? 'maintenant' : 'now';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader
        title={t('notifications')}
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={() => {
              markAllRead();
              toast.show(t('allRead'), 'success');
            }}
            hitSlop={8}
          >
            <Ionicons name="checkmark-done" size={22} color={c.primary} />
          </Pressable>
        }
      />
      <FlatList
        data={notifs}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 34, gap: 10, flexGrow: 1 }}
        ListEmptyComponent={<EmptyState icon="notifications-off-outline" title={t('notifEmpty')} />}
        renderItem={({ item, index }) => {
          const m = meta(item.type);
          const title = item.title ? item.title[lang] : t(item.titleKey ?? '');
          const body = item.body ? item.body[lang] : t(item.bodyKey ?? '', item.params);
          return (
            <FadeIn delay={Math.min(index, 8) * 45}>
              <Card
                onPress={() => markRead(item.id)}
                style={{
                  padding: 14,
                  borderLeftWidth: item.read ? 1 : 4,
                  borderLeftColor: item.read ? c.border : c.gold,
                }}
              >
                <Row style={{ gap: 12, alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: m.color + '1F',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={m.icon} size={19} color={m.color} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Txt size={14} weight={item.read ? '600' : '800'} numberOfLines={1} style={{ flex: 1 }}>
                        {title}
                      </Txt>
                      <Txt size={11} color={c.sub}>
                        {item.time ? item.time[lang] : timeLabel(item.ts)}
                      </Txt>
                    </Row>
                    <Txt size={12.5} color={c.sub} style={{ lineHeight: 19 }}>
                      {body}
                    </Txt>
                    {!item.read ? (
                      <Txt size={11} weight="700" color={c.primary} style={{ marginTop: 4 }}>
                        {t('markRead')}
                      </Txt>
                    ) : null}
                  </View>
                </Row>
              </Card>
            </FadeIn>
          );
        }}
      />
    </View>
  );
}
