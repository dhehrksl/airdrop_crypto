import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import DetailScreen from './src/screens/DetailScreen';
import BrowserScreen from './src/screens/BrowserScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme/colors';
import { initSentry } from './src/utils/sentry';

export type RootStackParamList = {
  Home: undefined;
  Detail: { id: string };
  Browser: { url: string; title?: string };
  MyPage: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
};

export default function App() {
  useEffect(() => {
    initSentry();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTitleStyle: { color: colors.text },
            headerTintColor: colors.accent,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: '에어드랍 피드' }} />
          <Stack.Screen name="Detail" component={DetailScreen} options={{ title: '상세' }} />
          <Stack.Screen
            name="Browser"
            component={BrowserScreen}
            options={({ route }) => ({ title: route.params.title || '참여하기' })}
          />
          <Stack.Screen name="MyPage" component={MyPageScreen} options={{ title: '마이페이지' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '알림 설정' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
