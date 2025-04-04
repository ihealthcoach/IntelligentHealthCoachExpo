# Intelligent Health Coach

A comprehensive React Native fitness tracking app built with Expo and Supabase.

## Features

- User authentication (email/password)
- Profile management
- Workout tracking
- Exercise library with search and filtering
- Progress monitoring
- Custom workout templates

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Supabase account

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd intelligent-health-coach
```

2. Install dependencies:
```bash
npm install
```

3. Create a Supabase project and get your project URL and anon key.

4. Set up environment variables:
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Update the `.env` file with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:
```bash
npm start
```

6. Run on your preferred platform:
- iOS: `npm run ios`
- Android: `npm run android`
- Web: `npm run web`

## Database Schema

The app uses the following Supabase tables:

- users (managed by Supabase Auth)
- profiles
- exercises
- workouts
- workout_exercise_details
- workout_sets
- workout_templates

## Environment Variables

The following environment variables are required:

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

These variables are used for Supabase authentication and database operations. Make sure to keep your `.env` file secure and never commit it to version control.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 