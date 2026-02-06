import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplitScreen } from '../screens/SplitScreen';
import { CombineScreen } from '../screens/CombineScreen';

type TabsParamList = {
  Split: undefined;
  Combine: undefined;
};

const Tabs = createBottomTabNavigator<TabsParamList>();

export function AppRoot() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tabs.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen name="Split" component={SplitScreen} />
          <Tabs.Screen name="Combine" component={CombineScreen} />
        </Tabs.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
