# Clinic Booking Web Client

Modern, responsive web interface for the clinic booking system. Built with vanilla JavaScript and Vite.

## Features

### User Features
- ✅ **Browse Slots**: View all available appointment slots in an organized grid
- ✅ **Date Filter**: Filter slots by specific date with dropdown
- ✅ **Provider Filter**: Filter by healthcare provider (e.g., Dr. Sarah Chen)
- ✅ **Clickable Slots**: Click any slot card to instantly select it
- ✅ **Smart Booking Form**: Sticky sidebar form always visible while browsing
- ✅ **My Bookings**: View all your bookings by entering your email
- ✅ **Cancel Bookings**: Cancel confirmed bookings with one click
- ✅ **Live Countdown**: Rate limit timer counts down in real-time
- ✅ **Specific Errors**: Clear, helpful error messages for every scenario
- ✅ **Responsive Design**: Works beautifully on desktop and mobile

### Technical Features
- ✅ **Two-Column Layout**: Slots on left, actions on right (desktop)
- ✅ **Sticky Form Panel**: Booking form stays visible while scrolling
- ✅ **Horizontal Grid**: Slots displayed in clean, scannable rows
- ✅ **Visual Feedback**: Selected slot highlighted with border
- ✅ **Idempotent Requests**: Uses `crypto.randomUUID()` for idempotency keys
- ✅ **Client-Side Filtering**: Instant filter updates without API calls
- ✅ **Past Slot Filtering**: Automatically hides slots that have already started
- ✅ **Error Recovery**: Countdown timer for rate limits with auto-enable

## Quick Start

### Prerequisites
- Node.js 18+
- Running clinic-booking-api instance

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_KEY=your-api-key-here
```

**Important:** Use the SAME API key as configured in the API's `.env` file.

3. **Start development server:**
```bash
npm run dev
```

App will be available at `http://localhost:5173`

## Development

**Start dev server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

Built files will be in `dist/` directory.

**Preview production build:**
```bash
npm run preview
```

## Architecture

### Tech Stack
- **Vanilla JavaScript** - No framework overhead, fast and simple
- **Vite** - Lightning-fast dev server and optimized builds
- **CSS Grid** - Modern responsive layout
- **Native Fetch API** - Direct HTTP communication with API

### File Structure
```
src/
├── main.js           # Main application logic
└── (styles inline)   # All CSS in index.html for simplicity

dist/                 # Production build output
index.html           # Single page application entry
```

### Layout Design

**Desktop (>1024px):**
```
┌─────────────────────────────────────────┐
│           Header + Confirmation          │
├───────────────────┬─────────────────────┤
│   Slot Filters    │                     │
│   ┌─────────────┐ │  Book Appointment   │
│   │ Date: Dec 10│ │  ┌───────────────┐  │
│   │ Provider: Dr│ │  │ Name          │  │
│   └─────────────┘ │  │ Email         │  │
│                   │  │ Slot Dropdown │  │
│   Available Slots │  │ [Book Button] │  │
│   ┌───┬───┬───┐   │  └───────────────┘  │
│   │9AM│10A│11A│   │                     │
│   └───┴───┴───┘   │  My Bookings        │
│   ┌───┬───┬───┐   │  ┌───────────────┐  │
│   │1PM│2PM│3PM│   │  │ Email         │  │
│   └───┴───┴───┘   │  │ [View Button] │  │
│                   │  │ [Booking List]│  │
└───────────────────┴─────────────────────┘
    (scrollable)           (sticky)
```

**Mobile (<1024px):**
Stacks vertically: Filters → Slots → Form → Bookings

## User Flow

### Booking Flow
1. User browses available slots (with optional filters)
2. User clicks a slot card (highlights and auto-fills form)
3. User enters name and email
4. User clicks "Book Appointment"
5. Success → Shows confirmation with booking details
6. Error → Shows specific message in form panel

### View Bookings Flow
1. User scrolls to "My Bookings" section (bottom of right panel)
2. User enters email and clicks "View My Bookings"
3. All bookings for that email are displayed
4. User can cancel any confirmed booking

### Cancel Booking Flow
1. User views their bookings (see above)
2. User clicks "Cancel Booking" on a confirmed booking
3. Confirmation dialog appears
4. On confirm → Booking cancelled, list refreshes, slots update

## API Integration

### Endpoints Used

**GET /slots**
- Fetches all available slots on page load
- No provider filter sent to API (filtering done client-side)
- Response cached for instant filter updates

**POST /bookings**
- Creates new booking
- Includes `Idempotency-Key` header (UUID)
- Includes `X-API-Key` header

**GET /bookings?email={email}**
- Lists all bookings for an email
- Called when user clicks "View My Bookings"

**DELETE /bookings/{id}**
- Cancels a booking
- Returns updated booking with `status: 'cancelled'`

### Error Handling

The client provides specific messages for every error:

| Status | Message |
|--------|---------|
| 400 (invalid booking) | "Please check your booking details and try again." |
| 400 (slot started) | "This slot has already started. Please choose a future time slot." |
| 400 (missing @) | "Email must contain @ symbol (e.g., name@example.com)" |
| 400 (missing .) | "Email domain must include a dot (e.g., name@example.com)" |
| 404 | "The selected slot was not found. Please refresh and try again." |
| 409 | "This slot has already been booked. Please choose another time slot." |
| 429 | "Too many booking attempts for this email. Please wait." (with countdown) |

## UI Behavior

### Slot Selection
- **Click any slot card** → Instantly selected (blue border + highlight)
- **Dropdown updates** → Selected slot appears in form dropdown
- **Auto-focus** → Name field focuses if empty

### Rate Limiting
When 429 received:
- Button shows: "Wait 33 seconds...", "Wait 32 seconds...", etc.
- Button disabled during countdown
- Auto-enables when countdown reaches 0
- Clear message: "Too many booking attempts for this email"

### Filters
- **Date filter**: Shows specific date (e.g., "Monday, December 10, 2026")
- **Provider filter**: Shows both providers always
- **Combined**: Filters work together (AND logic)
- **Instant update**: No API calls, filters pre-loaded data

### Responsive Behavior
- **Desktop**: Two-column layout, sticky right panel
- **Tablet**: Same as desktop until 1024px breakpoint
- **Mobile**: Single column, vertical stack

## Deployment

### Hosting Options

Can be deployed to any static hosting:

- **Vercel** (recommended)
  ```bash
  npm install -g vercel
  vercel
  ```

- **Netlify**
  ```bash
  npm run build
  # Drag dist/ folder to netlify.com
  ```

- **GitHub Pages**
  ```bash
  npm run build
  # Push dist/ to gh-pages branch
  ```

- **AWS S3 + CloudFront**
  ```bash
  npm run build
  aws s3 sync dist/ s3://your-bucket/
  ```

### Environment Variables

Set these in your hosting platform:

```env
VITE_API_BASE_URL=https://your-api.com
VITE_API_KEY=your-production-api-key
```

**Important Notes:**
- ⚠️ The API key is PUBLIC (visible in browser)
- ⚠️ It's embedded in the built JavaScript bundle
- ✅ This is by design - the API uses CORS to restrict origins
- ✅ Configure API's `CORS_ORIGIN` to match your web domain

### Production Checklist

- [ ] Update `VITE_API_BASE_URL` to production API URL
- [ ] Use same API key as production API
- [ ] Ensure API's `CORS_ORIGIN` includes web domain
- [ ] Test all flows: book, view bookings, cancel
- [ ] Verify rate limiting works (shows countdown)
- [ ] Test responsive behavior on mobile
- [ ] Check error messages are clear and helpful

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Uses modern features:
- CSS Grid
- Fetch API
- crypto.randomUUID()
- Template literals

## Styling

All styles are inline in `index.html` for simplicity. Key design choices:

- **Colors**: Blue primary (#2563eb), clean grays
- **Typography**: System fonts (-apple-system, etc.)
- **Spacing**: Consistent 15-30px gaps
- **Cards**: Subtle shadows, rounded corners
- **Interactions**: Hover effects, smooth transitions
- **Status badges**: Color-coded (green=available, red=booked/cancelled)

## Security Notes

### API Key Exposure
The API key is **intentionally public**:
- It's included in the built JavaScript
- Anyone can view it in browser DevTools
- This is standard for browser-based apps

### Protection Strategy
- API uses CORS to restrict which origins can call it
- Rate limiting prevents abuse (5 attempts/60s per email)
- No sensitive operations exposed
- All bookings require valid email

### What NOT to Put in Web Client
- ❌ Database credentials
- ❌ Admin API keys
- ❌ Secret signing keys
- ❌ Private user data

## Performance

- **Bundle size**: ~11 KB JS (gzipped: 3.6 KB)
- **First load**: Fast (no framework overhead)
- **Interactivity**: Instant (client-side filtering)
- **Build time**: <1 second

## Accessibility

- ✅ Semantic HTML (form, labels, buttons)
- ✅ Keyboard navigation (tab through slots, forms)
- ✅ Focus indicators
- ✅ Clear error messages
- ✅ Responsive text sizing
- ⚠️ Screen reader testing recommended for production

## License

MIT

## Author

Built for Koya interview assessment

---

**Need help?** Check the API README for backend setup and troubleshooting.
