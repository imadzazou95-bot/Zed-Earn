import React from 'react';
import { FlatList, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { formatDZD, useI18n } from '../lib/i18n';
import { LEADERBOARD } from '../lib/data';
import { ScreenHeader } from '../components/Header';
import { Card, FadeIn, Row, Txt } from '../components/ui';

export default function LeaderboardScreen({ navigation }: any) {
  const { c } = useTheme();
  const { t, lang } = useI18n();

  const rankColor = (i: number) => (i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#B45309' : c.sub);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('lbTitle')} onBack={() => navigation.goBack()} />
      <FlatList
        data={LEADERBOARD}
        keyExtractor={(i) => i.name}
        contentContainerStyle={{ padding: 16, paddingBottom: 34, gap: 10 }}
        ListHeaderComponent={
          <Txt size={13} color={c.sub} style={{ marginBottom: 8 }}>
            {t('lbSub')}
          </Txt>
        }
        renderItem={({ item, index }) => (
          <FadeIn delay={Math.min(index, 8) * 45}>
            <Card
              style={{
                padding: 14,
                borderWidth: index < 3 ? 1.5 : 1,
                borderColor: index < 3 ? rankColor(index) : c.border,
              }}
            >
              <Row style={{ gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: rankColor(index) + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {index < 3 ? (
                    <Ionicons name="trophy" size={19} color={rankColor(index)} />
                  ) : (
                    <Txt size={14} weight="800" color={c.sub}>
                      {index + 1}
                    </Txt>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={14.5} weight="700">
                    {item.name}
                  </Txt>
                  <Txt size={12} color={c.sub}>
                    {item.tasks} {t('tasksCount')}
                  </Txt>
                </View>
                <Txt size={14} weight="800" color={c.green}>
                  {formatDZD(item.earnings, lang)}
                </Txt>
              </Row>
            </Card>
          </FadeIn>
        )}
      />
    </View>
  );
}
