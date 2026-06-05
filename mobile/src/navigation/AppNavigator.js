import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import AddKeyScreen from '../screens/AddKeyScreen';
import KeyDetailScreen from '../screens/KeyDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  accent: '#6366f1',
  text: '#f1f5f9',
  muted: '#94a3b8',
};

function TabIcon({ name, focused }) {
  const icons = {
    Keys: focused ? '🗝️' : '🔑',
    Add: '➕',
    Settings: focused ? '⚙️' : '⚙️',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
      {icons[name]}
    </Text>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        cardStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <HomeStack.Screen
        name="KeyList"
        component={HomeScreen}
        options={{ title: 'My Keys' }}
      />
      <HomeStack.Screen
        name="KeyDetail"
        component={KeyDetailScreen}
        options={{ title: 'Key Details' }}
      />
    </HomeStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: '#334155',
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.muted,
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Tab.Screen
          name="Keys"
          component={HomeStackNavigator}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon name="Keys" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Add"
          component={AddKeyScreen}
          options={{
            title: 'Scan Key',
            tabBarIcon: ({ focused }) => <TabIcon name="Add" focused={focused} />,
            tabBarLabel: 'Scan',
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="Settings" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
