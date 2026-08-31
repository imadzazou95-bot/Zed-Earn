import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { useApp } from '../lib/store';
import { IconBtn, Row, Txt } from './ui';
import { useDrawer } from './Drawer';
import { goBack, navigate } from '../lib/nav';

export function MainHeader({ greeting, name }: { greeting: string; name: string }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useApp();
  const drawer = useDrawer();
  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: c.surface,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      }}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ gap: 10, flex: 1 }}>
          <IconBtn name="menu" onPress={drawer.open} />
          <View style={{ flex: 1 }}>
            <Txt size={12} color={c.sub}>
              {greeting}
            </Txt>
            <Txt size={16} weight="800" numberOfLines={1}>
              {name}
            </Txt>
          </View>
        </Row>
        <IconBtn name="notifications-outline" badge={unreadCount > 0} onPress={() => navigate('Notifications')} />
      </Row>
    </View>
  );
}

export function ScreenHeader({
  title,
  right,
  onBack,
}: {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { isRTL } = useI18n();
  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: c.surface,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      }}
    >
      <Row style={{ justifyContent: 'space-between', gap: 10 }}>
        <Row style={{ gap: 10, flex: 1 }}>
          <IconBtn name={isRTL ? 'arrow-forward' : 'arrow-back'} onPress={onBack ?? goBack} />
          <Txt size={17} weight="800" numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </Txt>
        </Row>
        {right ?? <View style={{ width: 40 }} />}
      </Row>
    </View>
  );
}

export function TabHeader({ title, icon }: { title: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const drawer = useDrawer();
  const { unreadCount } = useApp();
  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: c.surface,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      }}
    >
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ gap: 10, flex: 1 }}>
          <IconBtn name="menu" onPress={drawer.open} />
          <Row style={{ gap: 8 }}>
            {icon ? <Ionicons name={icon} size={20} color={c.primary} /> : null}
            <Txt size={17} weight="800">
              {title}
            </Txt>
          </Row>
        </Row>
        <IconBtn name="notifications-outline" badge={unreadCount > 0} onPress={() => navigate('Notifications')} />
      </Row>
    </View>
  );
}
