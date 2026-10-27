// Configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || '';

let allSlots = [];
let selectedProvider = '';

// DOM elements
const form = document.getElementById('form');
const slotsGrid = document.getElementById('slotsGrid');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('emptyState');
const errorDiv = document.getElementById('error');
const confirmationDiv = document.getElementById('confirmation');
const slotSelect = document.getElementById('slot');
const providerFilter = document.getElementById('providerFilter');
const submitBtn = document.getElementById('submitBtn');

// Fetch slots from API
async function fetchSlots(provider = '') {
  try {
    loading.style.display = 'block';
    slotsGrid.innerHTML = '';
    emptyState.style.display = 'none';

    const url = new URL(`${API_BASE_URL}/slots`);
    if (provider) {
      url.searchParams.append('provider', provider);
    }

    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch slots: ${response.statusText}`);
    }

    const data = await response.json();
    allSlots = data.slots || [];

    // Filter out past slots (client-side filtering in case API returns past slots)
    const now = new Date();
    allSlots = allSlots.filter(slot => new Date(slot.start) > now);

    loading.style.display = 'none';

    if (allSlots.length === 0) {
      emptyState.style.display = 'block';
    } else {
      renderSlots(allSlots);
      populateSlotSelect(allSlots);
      populateProviderFilter(allSlots);
    }
  } catch (err) {
    loading.style.display = 'none';
    showError(`Error loading slots: ${err.message}`);
  }
}

// Render slots as cards
function renderSlots(slots) {
  slotsGrid.innerHTML = '';

  slots.forEach(slot => {
    const card = document.createElement('div');
    card.className = `slot-card ${!slot.available ? 'unavailable' : ''}`;

    const date = new Date(slot.start);
    const endDate = new Date(slot.end);
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const endTimeStr = endDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });

    card.innerHTML = `
      <div class="slot-time">${timeStr} - ${endTimeStr}</div>
      <div class="slot-provider">${slot.provider}</div>
      <div>${dateStr}</div>
      <span class="slot-status ${slot.available ? 'available' : 'unavailable'}">
        ${slot.available ? 'Available' : 'Booked'}
      </span>
    `;

    slotsGrid.appendChild(card);
  });
}

// Populate slot select dropdown with available slots
function populateSlotSelect(slots) {
  slotSelect.innerHTML = '<option value="">-- Select a time slot --</option>';

  const availableSlots = slots.filter(s => s.available);

  availableSlots.forEach(slot => {
    const option = document.createElement('option');
    option.value = slot.id;

    const date = new Date(slot.start);
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });

    option.textContent = `${dateStr} at ${timeStr} - ${slot.provider}`;
    slotSelect.appendChild(option);
  });
}

// Populate provider filter dropdown
function populateProviderFilter(slots) {
  const providers = [...new Set(slots.map(s => s.provider))];
  
  providerFilter.innerHTML = '<option value="">All Providers</option>';
  
  providers.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider;
    option.textContent = provider;
    providerFilter.appendChild(option);
  });
}

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const slot_id = slotSelect.value;

  if (!slot_id) {
    showError('Please select a time slot');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Booking...';
    hideError();
    hideConfirmation();

    // Generate idempotency key for this booking attempt
    const idempotencyKey = crypto.randomUUID();

    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ slot_id, name, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Booking failed: ${response.statusText}`);
    }

    // Success - show confirmation
    showConfirmation(data);

    // Reset form
    form.reset();

    // Refresh slots to show updated availability
    await fetchSlots(selectedProvider);
  } catch (err) {
    showError(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Book Appointment';
  }
});

// Provider filter change handler
providerFilter.addEventListener('change', (e) => {
  selectedProvider = e.target.value;
  fetchSlots(selectedProvider);
});

// Show error message
function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Hide error message
function hideError() {
  errorDiv.style.display = 'none';
}

// Show confirmation
function showConfirmation(booking) {
  const slot = allSlots.find(s => s.id === booking.slot_id);
  const startDate = new Date(slot?.start || booking.created_at);
  
  confirmationDiv.innerHTML = `
    <h2>✓ Booking Confirmed!</h2>
    <div class="confirmation-detail"><strong>Booking ID:</strong> ${booking.id}</div>
    <div class="confirmation-detail"><strong>Name:</strong> ${booking.name}</div>
    <div class="confirmation-detail"><strong>Email:</strong> ${booking.email}</div>
    ${slot ? `
      <div class="confirmation-detail"><strong>Provider:</strong> ${slot.provider}</div>
      <div class="confirmation-detail"><strong>Date & Time:</strong> ${startDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}</div>
    ` : ''}
    <div class="confirmation-detail"><strong>Status:</strong> ${booking.status}</div>
    <p style="margin-top: 15px; color: #0c4a6e;">
      A confirmation email will be sent to ${booking.email}
    </p>
  `;
  confirmationDiv.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Hide confirmation
function hideConfirmation() {
  confirmationDiv.style.display = 'none';
}

// Initialize app
fetchSlots();
