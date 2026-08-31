import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { formatDZD, useI18n } from '../lib/i18n';
import { Difficulty, TaskDef } from '../lib/data';
import { TaskStatus } from '../lib/store';
import { Badge, Btn, Card, Row, Txt } from './ui';

export function useDifficulty() {
  const { c } = useTheme();
  const { t } = useI18n();
  return (d: Difficulty) => {
    const map: Record<Difficulty, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
      easy: { color: c.primary, label: t('easy'), icon: 'flash' },
      medium: { color: c.gold, label: t('medium'), icon: 'flame' },
      hard: { color: c.purple, label: t('hard'), icon: 'barbell' },
      vip: { color: c.gold2, label: t('vip'), icon: 'diamond' },
    };
    return map[d];
  };
}

export function statusMeta(status: TaskStatus | undefined, c: any, t: (k: string) => string) {
  switch (status) {
    case 'accepted':
      return { color: c.blue, label: t('statusAccepted'), icon: 'play-circle' as const };
    case 'review':
      return { color: c.gold, label: t('statusReview'), icon: 'time' as const };
    case 'completed':
      return { color: c.green, label: t('statusDone'), icon: 'checkmark-circle' as const };
    default:
      return { color: c.sub, label: t('statusAvailable'), icon: 'ellipse-outline' as const };
  }
}

export default function TaskCard({
  task,
  status,
  locked,
  onPress,
}: {
  task: TaskDef;
  status?: TaskStatus;
  locked?: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const { t, lang } = useI18n();
  const diff = useDifficulty()(task.difficulty);
  const st = statusMeta(status, c, t);

  return (
    <Card onPress={onPress} style={{ gap: 12, opacity: locked ? 0.65 : 1 }}>
      <Row style={{ gap: 12, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor: task.color + '1F',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={task.icon as any} size={23} color={task.color} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt size={15} weight="700" numberOfLines={1}>
            {task.title[lang]}
          </Txt>
          <Txt size={12.5} color={c.sub} numberOfLines={2} style={{ lineHeight: 18 }}>
            {task.desc[lang]}
          </Txt>
        </View>
      </Row>

      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ gap: 6 }}>
          <Badge label={diff.label} color={diff.color} icon={diff.icon} />
          {status && status !== 'available' ? <Badge label={st.label} color={st.color} icon={st.icon} /> : null}
        </Row>
        <Txt size={15} weight="800" color={c.green}>
          +{formatDZD(task.reward, lang)}
        </Txt>
      </Row>

      <Btn
        small
        label={locked ? `${t('locked')} 🔒` : status === 'completed' ? t('statusDone') : status ? t('statusAccepted') : t('acceptTask')}
        variant={locked ? 'outline' : status === 'completed' ? 'ghost' : 'primary'}
        onPress={onPress}
      />
    </Card>
  );
}
