import React, { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ThemeProvider, useTheme } from './lib/theme';
import { I18nProvider, useI18n } from './lib/i18n';
import { AppProvider, useApp } from './lib/store';
import { navigationRef } from './lib/nav';
import { applyUpdate, ensureManifestLink, registerServiceWorker, useOnline } from './lib/pwa';
import { Row, ToastProvider, Txt } from './components/ui';
import { DrawerProvider } from './components/Drawer';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AuthFlow from './screens/AuthFlow';
import GuideScreen from './screens/GuideScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import HomeScreen from './screens/HomeScreen';
import TasksScreen from './screens/TasksScreen';
import TaskDetailScreen from './screens/TaskDetailScreen';
import WithdrawScreen from './screens/WithdrawScreen';
import ProfileScreen from './screens/ProfileScreen';
import KycScreen from './screens/KycScreen';
import ReferralScreen from './screens/ReferralScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ChatScreen from './screens/ChatScreen';
import MerchantScreen from './screens/MerchantScreen';
import WalletScreen from './screens/WalletScreen';
import AdminScreen from './screens/AdminScreen';
import LegalScreen from './screens/LegalScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  const { c } = useTheme();
  const { t } = useI18n();
  const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
    Home: ['home', 'home-outline'],
    Tasks: ['list', 'list-outline'],
    Withdraw: ['cash', 'cash-outline'],
    Profile: ['person', 'person-outline'],
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.sub,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 26 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name={icons[route.name][focused ? 0 : 1]} size={size ?? 22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ title: t('tasks') }} />
      <Tab.Screen name="Withdraw" component={WithdrawScreen} options={{ title: t('withdrawals') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('account') }} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { c } = useTheme();
  const { touch } = useApp();
  const navTheme = {
    ...(c.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(c.dark ? DarkTheme : DefaultTheme).colors,
      background: c.bg,
      card: c.surface,
      text: c.text,
      border: c.border,
      primary: c.primary,
    },
  };
  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} onStateChange={touch}>
      <DrawerProvider>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
          <Stack.Screen name="Kyc" component={KycScreen} />
          <Stack.Screen name="Referral" component={ReferralScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Merchant" component={MerchantScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="Legal" component={LegalScreen} />
        </Stack.Navigator>
      </DrawerProvider>
    </NavigationContainer>
  );
}

/** Standalone legal reader used before authentication. */
function LegalGate({ doc, onClose }: { doc: 'terms' | 'privacy' | 'fraud'; onClose: () => void }) {
  const nav = { goBack: onClose, navigate: onClose };
  return <LegalScreen route={{ params: { doc } }} navigation={nav} />;
}

function UpdateBanner({ onReload }: { onReload: () => void }) {
  const { c } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ position: 'absolute', bottom: 18, left: 14, right: 14, zIndex: 900 }}>
      <Pressable onPress={onReload}>
        <Row
          style={{
            backgroundColor: c.primary,
            borderRadius: 16,
            padding: 14,
            gap: 10,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Ionicons name="cloud-download" size={19} color="#fff" />
          <Txt size={13} weight="700" color="#fff" style={{ flex: 1 }}>
            {t('updateAvailable')}
          </Txt>
          <Txt size={12.5} weight="800" color="#fff">
            {t('reload')}
          </Txt>
        </Row>
      </Pressable>
    </View>
  );
}

function OfflinePill() {
  const { c } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center', zIndex: 900 }}>
      <Row style={{ backgroundColor: c.gold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, gap: 6 }}>
        <Ionicons name="cloud-offline" size={13} color="#fff" />
        <Txt size={11} weight="700" color="#fff">
          {t('offlineMode')}
        </Txt>
      </Row>
    </View>
  );
}

function Shell() {
  const { c, ready: themeReady } = useTheme();
  const { ready: i18nReady } = useI18n();
  const { ready, onboarded, authed, guided, user, finishOnboarding, finishGuide } = useApp();
  const [splashDone, setSplashDone] = useState(false);
  const [profileSkipped, setProfileSkipped] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | 'fraud' | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const online = useOnline();

  useEffect(() => {
    ensureManifestLink();
    registerServiceWorker(() => setHasUpdate(true));
  }, []);

  const booted = ready && themeReady && i18nReady;

  let content: React.ReactNode;
  if (!booted || !splashDone) {
    content = <SplashScreen onDone={() => setSplashDone(true)} />;
  } else if (!onboarded) {
    content = <OnboardingScreen onDone={finishOnboarding} />;
  } else if (!authed) {
    content = legalDoc ? (
      <LegalGate doc={legalDoc} onClose={() => setLegalDoc(null)} />
    ) : (
      <AuthFlow onOpenLegal={(d) => setLegalDoc(d)} />
    );
  } else if (!guided) {
    content = <GuideScreen onDone={finishGuide} />;
  } else if (!user.name && !profileSkipped) {
    content = <ProfileSetupScreen onDone={() => setProfileSkipped(true)} />;
  } else {
    content = <MainNavigator />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.dark ? '#05080F' : '#E7EBF5', alignItems: 'center' }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 480,
          backgroundColor: c.bg,
          overflow: 'hidden',
          ...(Platform.OS === 'web' ? { boxShadow: '0 0 40px rgba(15,23,42,0.18)' as any } : {}),
        }}
      >
        <ToastProvider>
          {content}
          {!online ? <OfflinePill /> : null}
          {hasUpdate ? <UpdateBanner onReload={applyUpdate} /> : null}
        </ToastProvider>
      </View>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <AppProvider>
              <Shell />
            </AppProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
