# Clinic Booking Web Client

Minimal Vite-based web interface for the clinic booking API.

## Features

- List available appointment slots
- Filter slots by provider
- Hide past slots automatically
- Book appointments with name and email
- Display booking confirmation
- Idempotent booking requests
- Public API key (exposed in browser bundle)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
VITE_API_BASE_URL=http://localhost:3000
VITE_API_KEY=your-api-key-here
```

**Note:** The API key is public and exposed in the browser bundle. This is by design - the API should have CORS configured to accept requests from the web client's origin.

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

Build for production:
```bash
npm run build
```

The built files will be in the `dist/` directory.

## Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

## Architecture

- **Plain JavaScript** - No framework overhead
- **Vite** - Fast dev server and optimized builds
- **Single page** - Simple, focused UI
- **Responsive design** - Works on mobile and desktop

## API Integration

The client calls these endpoints:

- `GET /slots?provider={provider}` - List available slots
- `POST /bookings` - Create a booking with idempotency

All requests include:
- `X-API-Key` header for authentication
- `Idempotency-Key` header for POST requests (using crypto.randomUUID())

## UI Behavior

- **Past slots hidden**: Client filters out slots where `start` < now
- **Empty state**: Shows friendly message when no slots available
- **Error handling**: Displays API errors to the user
- **Confirmation**: Shows booking details after successful booking
- **Provider filter**: Allows filtering by healthcare provider
- **Slot cards**: Visual display of all slots with availability status

## Deployment

Can be deployed to any static hosting service:
- Vercel
- Netlify  
- GitHub Pages
- AWS S3 + CloudFront

Set environment variables in your hosting platform's settings.

Web page for viewing available clinic slots, booking one and seeing the confirmation. Consumes the clinic-booking-api.
