# MRB DeFi Platform

A comprehensive DeFi platform built on the TON blockchain, offering cryptocurrency trading, remittance services, and community features.

## Overview

MRB DeFi Platform is a full-featured decentralized finance application that combines traditional financial services with modern blockchain technology. The platform provides users with seamless access to cryptocurrency trading, international remittance services, and community-driven features like referrals and daily rewards.

### Key Features
- **Cryptocurrency Trading**: Swap tokens using StonFi protocol
- **Remittance Services**: International money transfers with Kontigo API integration
- **Wallet Management**: Support for both TON and fiat wallets
- **Community Features**: Referral system, daily tasks, and leaderboards
- **Premium Features**: Enhanced functionality for premium users
- **Multi-language Support**: Available in English, Chinese, and Spanish

## Features

### Core Functionality
- Remittance System
- Cryptocurrency swap
- Referral system with rewards
- Daily task completion rewards
- Premium user features
- Language translation using i18n

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- Radix UI for accessible components

### State Management
- Redux Toolkit for global state
- React Query for server state(Stonfi)
- Local storage for caching

### Blockchain Integration
- TON Connect for TON blockchain
- StonFi SDK for DeFi operations

### Backend Services
- Firebase Firestore for database
- Firebase Authentication
- Telegram Bot API integration

### Development Tools
- ESLint for code linting
- TypeScript for type safety
- PostCSS for CSS processing

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── wallet/         # Wallet-related components
│   ├── stonfi/         # StonFi UI components
│   └── home/           # Home page components
├── screens/            # Main application screens
├── store/              # Redux store and slices
├── libs/               # Utility libraries and configs
├── interface/          # TypeScript interfaces
├── hooks/              # Custom React hooks
├── config/             # Configuration files
├── assets/             # Static assets
└── styles/             # Global styles
```

## Key Components

### Wallet Management
- **FiatWalletTab(Remittance)**: Handles fiat currency operations
- **TonWalletTab**: To intract With Telegram Wallet 


### Fiat Deposit Processing for Remittance
- **FiatDeposit**: Country-based deposit selection and processeing
- **UploadReceipt**: Receipt verification system (for deposits)
- **Remittance**: International money transfer using Kontigo API

### DeFi Features
- **Swap**: Cryptocurrency exchange

## Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd v1
   ```

2. **Install dependencies**
   ```bash
   npm install
 
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory and add the following environment variables:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id


   # API Endpoints
   VITE_API_BASE_URL1=your_api_base_url
   VITE_API_BASE_URL2=your_api_base_url
   VITE_STONFI_API_URL=your_stonfi_api_url
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173` to view the application.

### Building for Production

1. **Build the application**
   ```bash
   npm run build

   ```

2. **Preview the production build**
   ```bash
   npm run preview

   ```

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

```



