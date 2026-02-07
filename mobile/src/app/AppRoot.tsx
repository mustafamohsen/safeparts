import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { I18nProvider, useI18n } from "../i18n/i18n";
import { CombineScreen } from "../screens/CombineScreen";
import { SplitScreen } from "../screens/SplitScreen";

type TabsParamList = {
  Split: undefined;
  Combine: undefined;
};

const Tabs = createBottomTabNavigator<TabsParamList>();

export function AppRoot() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AppRootInner />
      </I18nProvider>
    </SafeAreaProvider>
  );
}

function AppRootInner() {
  const { t } = useI18n();

  return (
    <NavigationContainer>
      <Tabs.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="Split" component={SplitScreen} options={{ title: t("tabs.split") }} />
        <Tabs.Screen
          name="Combine"
          component={CombineScreen}
          options={{ title: t("tabs.combine") }}
        />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}
