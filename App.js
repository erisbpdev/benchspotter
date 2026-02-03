import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ActivityIndicator, View } from 'react-native';
import { ErrorBoundary } from './src/components';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import MainTabs from './src/navigation/MainTabs';
import AddBenchScreen from './src/screens/AddBenchScreen';
import BenchDetailScreen from './src/screens/BenchDetailScreen';
import EditBenchScreen from './src/screens/EditBenchScreen';
import SearchScreen from './src/screens/SearchScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import FollowListScreen from './src/screens/FollowListScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Authenticated stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="AddBench" 
              component={AddBenchScreen}
              options={{
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="BenchDetail" 
              component={BenchDetailScreen}
            />
            <Stack.Screen 
              name="EditBench" 
              component={EditBenchScreen}
            />
            <Stack.Screen 
              name="Search" 
              component={SearchScreen}
            />
            <Stack.Screen 
              name="UserProfile" 
              component={UserProfileScreen}
            />
            <Stack.Screen 
              name="FollowList" 
              component={FollowListScreen}
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen}
            />
          </>
        ) : (
          // Auth stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppNavigator />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}