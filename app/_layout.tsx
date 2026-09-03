import { ReanimatedTrueSheetProvider } from '@lodev09/react-native-true-sheet/reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Turn off strict mode to suppress value access warnings
});

import "../global.css";

import { useColorScheme } from '@/hooks/use-color-scheme';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (

    <SafeAreaListener
      onChange={({ insets }) => {
        Uniwind.updateInsets(insets);
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GluestackUIProvider mode="dark">
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              {/* Real UITabBar — on iOS 26 it picks up Liquid Glass natively, so no
                  background/blur props are set here (they're ignored on 26+ anyway). */}
              <ReanimatedTrueSheetProvider>
            <NativeTabs>
                <NativeTabs.Trigger name="index">
                  <Icon sf={{ default: 'house', selected: 'house.fill' }} />
                  <Label>Home</Label>
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="feed">
                  <Icon sf={{ default: 'newspaper', selected: 'newspaper.fill' }} />
                  <Label>Feed</Label>
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="profile">
                  <Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
                  <Label>Profile</Label>
                </NativeTabs.Trigger>
              </NativeTabs>
            </ReanimatedTrueSheetProvider>
            <StatusBar style="light" />
          </ThemeProvider>
        </GluestackUIProvider>
      </GestureHandlerRootView>
    </SafeAreaListener>

  );
}
