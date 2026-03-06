import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const { lang, t } = useI18n();

  return (
    <NavigationContainer>
      <Tabs.Navigator
        key={`tabs-${lang}`}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#7bffd6",
          tabBarInactiveTintColor: "#7f8aa8",
          tabBarStyle: {
            height: 72,
            paddingTop: 8,
            paddingBottom: 10,
            backgroundColor: "#0d1428",
            borderTopWidth: 1,
            borderTopColor: "rgba(140, 170, 255, 0.2)",
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: "700",
            letterSpacing: 0.2,
          },
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={route.name === "Split" ? "source-branch" : "source-merge"}
              size={focused ? 24 : 22}
              color={color}
            />
          ),
        })}
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
