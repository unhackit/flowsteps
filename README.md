# Frontend Documentation

## Overview

The frontend of WinLog is built with React, TypeScript, and Tailwind CSS. It provides a modern, responsive user interface for tracking professional achievements and managing projects.

## Key Components

### Dashboard Layout

The dashboard layout provides the main structure for the authenticated user experience:

- **Sidebar Navigation**: Access to Dashboard, Achievements, Projects, Profile, and Settings
- **Responsive Design**: Collapsible sidebar for desktop, mobile-friendly drawer navigation
- **User Profile Menu**: Quick access to profile, settings, and logout

### Dashboard

The main dashboard displays:

- Recent achievements
- Project summaries
- Achievement statistics
- Quick actions for logging new achievements

### Achievements

The Achievements module allows users to:

- View all logged achievements
- Filter achievements by category, impact level, and date
- Search for specific achievements
- View achievement details

### Projects

The Projects module enables users to:

- View all projects
- Create new projects
- View project details including associated achievements
- Track project progress

### Profile

The Profile component displays and allows editing of:

- Personal information (name, email, title)
- Professional details (department, location)
- Bio/professional summary

### Settings

The Settings module provides:

- **Notification Preferences**: Control email and push notifications
- **Integrations**: Connect with external tools like Slack, Microsoft Teams, and Google Workspace

### LogAchievement

The LogAchievement component provides multiple ways to log achievements:

- **Manual Entry**: Traditional form-based input
- **AI-Assisted**: Generate achievement content from a brief description
- **Voice Recording**: Record and transcribe achievements

## UI Components

The application uses a combination of custom UI components and shadcn/ui components:

- **Button**: Primary actions, secondary actions, and outline variants
- **Input**: Text input fields with validation
- **Textarea**: Multi-line text input
- **Card**: Content containers with consistent styling
- **Sheet**: Slide-in panels for forms and details
- **Tabs**: Organize content into tabbed interfaces
- **Switch**: Toggle controls for settings
- **Label**: Form field labels with consistent styling

## Routing Structure

/dashboard                  # Main dashboard

/dashboard/achievements     # Achievements list and management

/dashboard/projects         # Projects list and management

/dashboard/profile          # User profile

/dashboard/settings         # Application settings

## State Management

- **Local Component State**: Used for UI state and form handling
- **URL Parameters**: Used for filtering and navigation state

## Styling

- **Tailwind CSS**: Utility-first CSS framework for consistent styling
- **Custom Theme**: Primary color scheme and consistent UI elements
- **Responsive Design**: Mobile-first approach with desktop enhancements

## Future Enhancements

- **Dark Mode**: Theme toggle between light and dark modes
- **Data Persistence**: Connect to backend API for data storage
- **Authentication**: Implement proper user authentication flow
- **Advanced Filtering**: More robust filtering and sorting options
- **Notifications**: Real-time notification system
- **Team Collaboration**: Features for team-based achievement tracking
