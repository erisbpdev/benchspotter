import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const pushNotificationService = {
  /**
   * Register for push notifications and get Expo push token
   */
  async registerForPushNotifications() {
    let token;

    // Must be a physical device
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get Expo push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.error('EAS project ID not found in app config');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo Push Token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
        sound: 'default',
      });
    }

    return token;
  },

  /**
   * Save push token to database
   */
  async savePushToken(userId, token) {
    if (!token) return;

    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving push token:', error);
    }
  },

  /**
   * Remove push token on logout
   */
  async removePushToken(userId) {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing push token:', error);
    }
  },

  /**
   * Get push token for a user
   */
  async getPushToken(userId) {
    const { data, error } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data?.token;
  },

  /**
   * Send push notification via Expo Push API
   */
  async sendPushNotification(expoPushToken, { title, body, data = {} }) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return await response.json();
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  },

  /**
   * Notify a user by their user ID
   */
  async notifyUser(userId, { title, body, data = {} }) {
    const token = await this.getPushToken(userId);
    if (!token) {
      console.log('No push token for user:', userId);
      return;
    }
    return this.sendPushNotification(token, { title, body, data });
  },

  /**
   * Set up notification listeners - call in App.js
   */
  setupNotificationListeners(navigation) {
    // Foreground notification received
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Notification tapped
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      this.handleNotificationNavigation(navigation, data);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  },

  /**
   * Navigate based on notification data
   */
  handleNotificationNavigation(navigation, data) {
    if (!data || !navigation) return;

    switch (data.type) {
      case 'follow':
        if (data.actorId) {
          navigation.navigate('UserProfile', { userId: data.actorId });
        }
        break;
      case 'comment':
      case 'reply':
      case 'mention':
      case 'comment_like':
      case 'favorite':
      case 'rating':
        if (data.benchId) {
          navigation.navigate('BenchDetail', { benchId: data.benchId });
        }
        break;
      default:
        navigation.navigate('Notifications');
    }
  },
};

export default pushNotificationService;

/*
SQL for push_tokens table:

CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  token text NOT NULL,
  platform text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT push_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX push_tokens_user_id_idx ON public.push_tokens(user_id);
*/
