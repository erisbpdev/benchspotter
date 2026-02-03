# BenchSpotter

A mobile application for discovering, sharing, and rating benches in your area. Connect with the community, explore new benches, and leave your mark on the city's resting spots.

## About the Project

BenchSpotter is a social platform dedicated to bench enthusiasts. Users can discover benches in their locality, add new ones with photos and details, rate and review them, and connect with other bench explorers. The app combines location-based mapping with social networking features to create a vibrant community around urban seating.

## Tech Stack

- **React Native** with Expo for cross-platform mobile development
- **React Navigation** for app navigation and routing
- **Supabase** for backend services, authentication, and database
- **React Native Maps** & Leaflet for interactive mapping
- **Expo Image Picker** for camera and photo library access
- **Expo Location** for geolocation services
- **Expo Notifications** for push notifications
- **AsyncStorage** for local persistent storage
- **TypeScript** for type safety
- **Expo Device** for device information

## Core Features

### User Authentication
- Secure signup and login system via Supabase
- Persistent authentication state management
- User profile creation and customization

### Bench Discovery & Exploration
- Interactive map view with all bench locations
- Real-time location tracking to find nearby benches
- Bench detail pages with full information
- Search functionality with filters
- Photo carousel for bench gallery

### Content Creation
- Add new benches with name, description, location, and photos
- Edit existing bench details
- Upload multiple photos per bench
- Location selection directly on map

### Social Features
- User profiles with bio and avatar customization
- Follow/unfollow other users
- Follow feed showing recent benches from followed users
- User discovery through follow lists
- Comment sections on benches
- Rating system with individual ratings

### Engagement Features
- Rate benches with a rating system
- Leave comments and reviews
- Mark benches as favorites
- Track favorite count on benches
- Real-time statistics on user profiles

### User Profiles
- View profile statistics (benches added, ratings given, comments, followers)
- Customize bio and avatar
- Browse user's contributed benches
- See follower/following lists
- User discovery features

### Notifications
- Push notification support for app events
- Notification management and history
- Real-time notification delivery via Expo Notifications

### Customization
- Dark mode support
- Theme switching
- Light and dark color schemes
- Adaptive UI based on theme preference

## Project Structure

```
src/
├── screens/
│   ├── LoginScreen.js              - User login interface
│   ├── SignupScreen.js             - New user registration
│   ├── FeedScreen.js               - Social feed from followed users
│   ├── MapScreen.js                - Interactive map of benches
│   ├── MapScreen.native.js         - Native map implementation
│   ├── SearchScreen.js             - Search and filter benches
│   ├── AddBenchScreen.js           - Create new bench entries
│   ├── BenchDetailScreen.js        - View bench details
│   ├── EditBenchScreen.js          - Modify bench information
│   ├── ProfileScreen.js            - User profile and settings
│   ├── UserProfileScreen.js        - Other user profiles
│   ├── FavoritesScreen.js          - Bookmarked benches
│   ├── NotificationsScreen.js      - Notification history
│   └── FollowListScreen.js         - Follower/following lists
│
├── components/
│   ├── SearchInput.js              - Search input field
│   ├── SearchFilters.js            - Advanced filtering options
│   ├── SearchResultCard.js         - Search result display
│   ├── BenchInfo.js                - Bench information component
│   ├── RatingDisplay.js            - Bench rating visualization
│   ├── RatingModal.js              - Rating submission modal
│   ├── PhotoCarousel.js            - Image carousel viewer
│   ├── PhotoPicker.js              - Image selection interface
│   ├── CommentSection.js           - Comment display and submission
│   ├── LocationDisplay.js          - Location information display
│   ├── KeyboardAwareModal.js       - Modal with keyboard handling
│   ├── KeyboardAwareView.js        - View with keyboard management
│   ├── ThemeSelector.js            - Theme switching component
│   └── ViewTypeSelector.js         - View mode toggle
│
├── navigation/
│   └── MainTabs.js                 - Bottom tab navigation setup
│
├── services/
│   ├── api.js                      - API service layer
│   ├── supabase.js                 - Supabase client configuration
│   └── pushNotificationService.js  - Push notification handling
│
├── contexts/
│   ├── AuthContext.js              - Authentication state management
│   └── ThemeContext.js             - Theme state management
│
├── utils/                          - Helper functions
├── constants/                      - App constants
├── styles.js                       - Global styling
└── types/
    └── database.types.ts           - TypeScript type definitions

android/                           - Android native configuration
├── app/
│   └── src/main/java/             - Kotlin/Java Android code
└── gradle/                         - Gradle build configuration

assets/                            - Static assets
├── icons/                         - App icons
└── images/                        - Sample images
```

## Key Components

### SearchInput & SearchFilters
Powerful search and filtering system allowing users to find benches by various criteria.

### PhotoCarousel
Multi-image viewer for browsing bench photos with swipe navigation.

### RatingModal & RatingDisplay
Interactive rating system for users to rate benches and view community ratings.

### CommentSection
Discussion area on bench detail pages for user feedback and reviews.

### KeyboardAware Components
Special components handling soft keyboard appearance to prevent input field obstruction.

### ThemeSelector
Dynamic theme switching between light and dark modes across the entire app.

## Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Expo CLI (optional but recommended)
- Android SDK or iOS development environment (for native builds)

### Setup Steps

1. Clone the repository and navigate to the project directory:
   ```bash
   cd benchspotter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install EAS CLI for building and deploying:
   ```bash
   npm install -g eas-cli
   ```

4. Configure environment variables:
   - Create a `.env` file in the root directory (if required by your setup)
   - Add any necessary API keys and Supabase configuration

5. Configure Supabase (if not pre-configured):
   - Set up a Supabase project
   - Configure authentication providers
   - Initialize database tables from the schema

## Running the App

### Development

- **Start the development server:**
  ```bash
  npm start
  ```
  This opens the Expo dev server. You can then:
  - Press `a` to open on Android emulator
  - Press `i` to open on iOS simulator
  - Press `w` to open in web browser
  - Scan the QR code with Expo Go app on your device

- **Run directly on Android device/emulator:**
  ```bash
  npm run android
  ```

- **Run directly on iOS device/simulator:**
  ```bash
  npm run ios
  ```

- **Run web version:**
  ```bash
  npm run web
  ```

### Building for Production

- **Build for Android:**
  ```bash
  eas build --platform android
  ```

- **Build for iOS:**
  ```bash
  eas build --platform ios
  ```

- **Build for both platforms:**
  ```bash
  eas build
  ```

## Development

### Architecture

**State Management:**
- React Context API for global state (Authentication, Theme)
- Local component state for UI interactions
- AsyncStorage for persistent local data

**Services Layer:**
- Centralized API service layer (`api.js`) for all backend requests
- Supabase client wrapper for database and authentication
- Separate push notification service

**Navigation:**
- React Navigation with native stack and bottom tab navigators
- Authenticated and non-authenticated navigation flows
- Deep linking support

**Styling:**
- Dynamic theme system with light/dark modes
- Responsive component styling
- Platform-specific styles where needed

### Code Quality
- TypeScript for type safety on database types
- Consistent error handling patterns
- Keyboard-aware components for better UX
- Loading and error states throughout the app

### Features in Development
- Built with Expo for rapid development and testing
- Hot reload support for instant feedback
- Dev client for custom native modules
- Android native build configuration
- Google Play Services integration for Android

### Key Dependencies
- **expo**: Core framework for building cross-platform apps
- **@react-navigation**: Navigation library
- **@supabase/supabase-js**: Supabase JavaScript client
- **react-native-maps**: Native mapping
- **expo-image-picker**: Photo/image selection
- **expo-location**: Geolocation services
- **expo-notifications**: Push notification delivery

## API & Backend

BenchSpotter uses Supabase for:
- User authentication (email/password)
- Real-time database for benches, ratings, comments
- File storage for user avatars and bench photos
- User profiles and follow relationships
- Notification management

The API service layer (`src/services/api.js`) provides a consistent interface for all database operations.

## Testing

Currently the app focuses on manual testing during development. Test coverage can be expanded with:
- Jest for unit testing
- React Native Testing Library for component tests
- Integration tests for API interactions

## Troubleshooting

### Common Issues

**Location permissions denied:**
- Ensure location permissions are granted in app settings
- On Android, check both app and OS-level permissions

**Map not loading:**
- Verify internet connectivity
- Check Expo location services are enabled
- Restart the development server

**Images not uploading:**
- Check file permissions in device settings
- Verify storage space available
- Ensure internet connectivity for upload

**Dark mode not applying:**
- Clear app cache and reload
- Verify theme context is properly initialized

## Future Enhancements

- Advanced bench discovery with recommendations
- Bench amenities filtering (back support, weather protection, etc.)
- Benchmark achievements and badges
- Community moderation tools
- More detailed bench conditions tracking
- Integration with location-based services
- Offline mode support

## Contributing

When contributing to this project:
1. Follow the existing code style and structure
2. Use TypeScript where appropriate
3. Test changes on multiple devices/screen sizes
4. Update documentation for new features
5. Ensure components are keyboard-aware where applicable

## License

Private project
