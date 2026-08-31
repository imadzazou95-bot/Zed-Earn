import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { Difficulty } from '../lib/data';
import { useApp } from '../lib/store';
import { TabHeader } from '../components/Header';
import TaskCard from '../components/TaskCard';
import { EmptyState, FadeIn, Row, Txt, useToast } from '../components/ui';

type Filter = 'all' | Difficulty;

export default function TasksScreen({ navigation }: any) {
  const { c } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const { taskStates, vipUnlocked, allTasks } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filters: { key: Filter; label: string; color: string }[] = [
    { key: 'all', label: t('tasks'), color: c.text },
    { key: 'easy', label: t('easy'), color: c.primary },
    { key: 'medium', label: t('medium'), color: c.gold },
    { key: 'hard', label: t('hard'), color: c.purple },
    { key: 'vip', label: t('vip'), color: c.gold2 },
  ];

  const data = useMemo(
    () => (filter === 'all' ? allTasks : allTasks.filter((x) => x.difficulty === filter)),
    [filter, allTasks]
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TabHeader title={t('tasks')} icon="list" />
      <View style={{ backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 8 }}>
          {filters.map((f) => {
            const on = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: on ? f.color : c.chip,
                }}
              >
                <Txt size={12} weight="700" color={on ? '#fff' : c.sub}>
                  {f.label}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 30, gap: 12, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={c.primary}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 900);
            }}
          />
        }
        ListEmptyComponent={<EmptyState icon="file-tray" title={t('noTasks')} />}
        renderItem={({ item, index }) => {
          const locked = item.difficulty === 'vip' && !vipUnlocked;
          return (
            <FadeIn delay={Math.min(index, 6) * 55}>
              <TaskCard
                task={item}
                locked={locked}
                status={taskStates[item.id]?.status}
                onPress={() => {
                  if (locked) return toast.show(t('vipLockedMsg'), 'warning');
                  navigation.navigate('TaskDetail', { id: item.id });
                }}
              />
            </FadeIn>
          );
        }}
      />
    </View>
  );
}
