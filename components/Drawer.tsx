import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, ScrollView, Switch, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { LANGS } from '../lib/data';
import { useApp } from '../lib/store';
import { Row, Txt } from './ui';
import { navigate } from '../lib/nav';

const DrawerCtx = createContext<{ open: () => void; close: () => void; visible: boolean }>({
  open: () => {},
  close: () => {},
  visible: false,
});
export const useDrawer = () => useContext(DrawerCtx);

const BASE_LINKS: { key: string; icon: keyof typeof Ionicons.glyphMap; route: string; params?: any }[] = [
  { key: 'home', icon: 'home', route: 'Tabs', params: { screen: 'Home' } },
  { key: 'tasks', icon: 'list', route: 'Tabs', params: { screen: 'Tasks' } },
  { key: 'withdrawals', icon: 'cash', route: 'Tabs', params: { screen: 'Withdraw' } },
  { key: 'wallet', icon: 'wallet', route: 'Wallet' },
  { key: 'kyc', icon: 'shield-checkmark', route: 'Kyc' },
  { key: 'referral', icon: 'gift', route: 'Referral' },
  { key: 'leaderboard', icon: 'trophy', route: 'Leaderboard' },
  { key: 'notifications', icon: 'notifications', route: 'Notifications' },
  { key: 'support', icon: 'chatbubbles', route: 'Chat' },
  { key: 'merchant', icon: 'storefront', route: 'Merchant' },
  { key: 'legal', icon: 'document-text', route: 'Legal' },
];

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const { c, isDark, toggle } = useTheme();
  const { t, lang, setLang, isRTL } = useI18n();
  const { user, level, role, isAdmin, pendingReviewCount, signOut } = useApp();
  const anim = useRef(new Animated.Value(0)).current;
  const W = Math.min(Dimensions.get('window').width, 480);

  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 1 : 0, duration: 240, useNativeDriver: true }).start();
  }, [visible, anim]);

  const go = (route: string, params?: any) => {
    setVisible(false);
    setTimeout(() => navigate(route, params), 180);
  };

  const panelW = Math.min(300, W * 0.82);

  return (
    <DrawerCtx.Provider value={{ open: () => setVisible(true), close: () => setVisible(false), visible }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ flex: 1, maxWidth: 480, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <Animated.View
              style={{
                width: panelW,
                backgroundColor: c.surface,
                opacity: anim,
                transform: [
                  {
                    translateX: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [isRTL ? panelW : -panelW, 0],
                    }),
                  },
                ],
              }}
            >
              <LinearGradient colors={[c.primary, c.primary2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={{ paddingTop: 54, paddingBottom: 22, paddingHorizontal: 18, gap: 10 }}>
                  <Row style={{ gap: 12 }}>
                    {user.avatar ? (
                      <Image source={{ uri: user.avatar }} style={{ width: 52, height: 52, borderRadius: 26 }} />
                    ) : (
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 26,
                          backgroundColor: 'rgba(255,255,255,0.25)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="person" size={26} color="#fff" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Txt color="#fff" weight="800" size={16} numberOfLines={1}>
                        {user.name || user.phone || 'Zed Earn'}
                      </Txt>
                      <Row style={{ gap: 6 }}>
                        <Txt color="rgba(255,255,255,0.85)" size={12}>
                          {t(level)}
                        </Txt>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 }}>
                          <Txt color="#fff" size={10} weight="700">
                            {role === 'admin' ? t('roleAdmin') : role === 'merchant' ? t('roleMerchant') : t('roleUser')}
                          </Txt>
                        </View>
                      </Row>
                    </View>
                  </Row>
                </View>
              </LinearGradient>

              <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
                {isAdmin ? (
                  <Pressable
                    onPress={() => go('Admin')}
                    style={({ pressed }) => [{ borderRadius: 12, backgroundColor: pressed ? c.chip : c.purple + '14' }]}
                  >
                    <Row style={{ padding: 12, gap: 12 }}>
                      <Ionicons name="shield" size={19} color={c.purple} />
                      <Txt size={14} weight="700" style={{ flex: 1 }}>
                        {t('adminPanel')}
                      </Txt>
                      {pendingReviewCount > 0 ? (
                        <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: c.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                          <Txt size={11} weight="800" color="#fff">
                            {pendingReviewCount}
                          </Txt>
                        </View>
                      ) : null}
                    </Row>
                  </Pressable>
                ) : null}
                {BASE_LINKS.map((l) => (
                  <Pressable
                    key={l.key}
                    onPress={() => go(l.route, l.params)}
                    style={({ pressed }) => [
                      { borderRadius: 12, backgroundColor: pressed ? c.chip : 'transparent' },
                    ]}
                  >
                    <Row style={{ padding: 12, gap: 12 }}>
                      <Ionicons name={l.icon} size={19} color={c.primary} />
                      <Txt size={14} weight="600">
                        {t(l.key)}
                      </Txt>
                    </Row>
                  </Pressable>
                ))}

                <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />

                <Row style={{ padding: 12, gap: 12, justifyContent: 'space-between' }}>
                  <Row style={{ gap: 12 }}>
                    <Ionicons name={isDark ? 'moon' : 'sunny'} size={19} color={c.gold} />
                    <Txt size={14} weight="600">
                      {t('darkMode')}
                    </Txt>
                  </Row>
                  <Switch value={isDark} onValueChange={toggle} trackColor={{ true: c.primary }} />
                </Row>

                <Row style={{ padding: 12, gap: 12 }}>
                  <Ionicons name="language" size={19} color={c.blue} />
                  <Txt size={14} weight="600">
                    {t('language')}
                  </Txt>
                </Row>
                <Row style={{ gap: 8, paddingHorizontal: 12, flexWrap: 'wrap' }}>
                  {LANGS.map((l) => (
                    <Pressable
                      key={l.code}
                      onPress={() => setLang(l.code)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: lang === l.code ? c.primary : c.chip,
                      }}
                    >
                      <Txt size={12} weight="700" color={lang === l.code ? '#fff' : c.text}>
                        {l.flag} {l.label}
                      </Txt>
                    </Pressable>
                  ))}
                </Row>

                <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />

                <Pressable
                  onPress={() => {
                    setVisible(false);
                    setTimeout(() => signOut(), 200);
                  }}
                  style={({ pressed }) => [{ borderRadius: 12, backgroundColor: pressed ? c.chip : 'transparent' }]}
                >
                  <Row style={{ padding: 12, gap: 12 }}>
                    <Ionicons name="log-out" size={19} color={c.red} />
                    <Txt size={14} weight="600" color={c.red}>
                      {t('logout')}
                    </Txt>
                  </Row>
                </Pressable>
              </ScrollView>
            </Animated.View>

            <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={() => setVisible(false)} />
          </View>
        </View>
      </Modal>
    </DrawerCtx.Provider>
  );
}
