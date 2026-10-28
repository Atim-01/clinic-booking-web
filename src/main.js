// Configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || '';

let allSlots = [];
let allProviders = [];
let allDates = [];
let selectedProvider = '';
let selectedDate = '';
let selectedSlotId = '';
let currentUserEmail = '';
let countdownTimer = null;
let currentPage = 1;
const SLOTS_PER_PAGE = 12; // Show 12 slots per page

// DOM elements
const form = document.getElementById('form');
const slotsGrid = document.getElementById('slotsGrid');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('emptyState');
const errorDiv = document.getElementById('error');
const confirmationDiv = document.getElementById('confirmation');
const slotSelect = document.getElementById('slot');
const providerFilter = document.getElementById('providerFilter');
const dateFilter = document.getElementById('dateFilter');
const submitBtn = document.getElementById('submitBtn');
const myBookingsList = document.getElementById('myBookingsList');
const myBookingsEmail = document.getElementById('myBookingsEmail');
const viewBookingsBtn = document.getElementById('viewBookingsBtn');
const paginationControls = document.getElementById('paginationControls');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');

// Fetch slots from API
async function fetchSlots() {
  try {
    loading.style.display = 'block';
    slotsGrid.innerHTML = '';
    emptyState.style.display = 'none';

    const url = new URL(`${API_BASE_URL}/slots`);

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
      // Extract all unique providers and dates
      allProviders = [...new Set(allSlots.map(s => s.provider))];
      
      // Extract unique dates
      const dateSet = new Set();
      allSlots.forEach(slot => {
        const date = new Date(slot.start);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        dateSet.add(dateKey);
      });
      allDates = Array.from(dateSet).sort();
      
      populateProviderFilter(allProviders);
      populateDateFilter(allDates);
      applyFiltersAndRender();
    }
  } catch (err) {
    loading.style.display = 'none';
    showError(`Error loading slots: ${err.message}`);
  }
}

// Apply current filters and render
function applyFiltersAndRender(resetPage = true) {
  let filteredSlots = allSlots;

  // Filter by date
  if (selectedDate) {
    filteredSlots = filteredSlots.filter(slot => {
      const slotDate = new Date(slot.start).toISOString().split('T')[0];
      return slotDate === selectedDate;
    });
  }

  // Filter by provider
  if (selectedProvider) {
    filteredSlots = filteredSlots.filter(slot => slot.provider === selectedProvider);
  }

  if (resetPage) {
    currentPage = 1;
  }

  if (filteredSlots.length === 0) {
    slotsGrid.innerHTML = '<div class="empty-state">No slots available for the selected filters. Try different options.</div>';
    paginationControls.style.display = 'none';
  } else {
    renderSlotsWithPagination(filteredSlots);
    populateSlotSelect(filteredSlots);
  }
}

// Render slots with pagination
function renderSlotsWithPagination(slots) {
  const totalPages = Math.ceil(slots.length / SLOTS_PER_PAGE);
  const startIndex = (currentPage - 1) * SLOTS_PER_PAGE;
  const endIndex = startIndex + SLOTS_PER_PAGE;
  const paginatedSlots = slots.slice(startIndex, endIndex);

  // Render the current page of slots
  renderSlots(paginatedSlots);

  // Update pagination controls
  if (totalPages > 1) {
    paginationControls.style.display = 'flex';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
  } else {
    paginationControls.style.display = 'none';
  }
}

// Render slots as cards, grouped by date
function renderSlots(slots) {
  slotsGrid.innerHTML = '';

  // If a specific date is selected, don't group by date (already filtered to one date)
  if (selectedDate) {
    const dateGrid = document.createElement('div');
    dateGrid.className = 'date-grid';
    
    slots.forEach(slot => {
      const card = createSlotCard(slot);
      dateGrid.appendChild(card);
    });
    
    slotsGrid.appendChild(dateGrid);
  } else {
    // Group slots by date when showing all dates
    const slotsByDate = {};
    slots.forEach(slot => {
      const date = new Date(slot.start);
      const dateKey = date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      
      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = [];
      }
      slotsByDate[dateKey].push(slot);
    });

    // Render each date group
    Object.keys(slotsByDate).forEach(dateKey => {
      const dateSection = document.createElement('div');
      dateSection.className = 'date-section';
      
      const dateHeader = document.createElement('h3');
      dateHeader.className = 'date-header';
      dateHeader.textContent = dateKey;
      dateSection.appendChild(dateHeader);
      
      const dateGrid = document.createElement('div');
      dateGrid.className = 'date-grid';
      
      slotsByDate[dateKey].forEach(slot => {
        const card = createSlotCard(slot);
        dateGrid.appendChild(card);
      });
      
      dateSection.appendChild(dateGrid);
      slotsGrid.appendChild(dateSection);
    });
  }
}

// Create a slot card element
function createSlotCard(slot) {
  const card = document.createElement('div');
  card.className = `slot-card ${!slot.available ? 'unavailable' : ''} ${selectedSlotId === slot.id ? 'selected' : ''}`;
  card.dataset.slotId = slot.id;

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

  card.innerHTML = `
    <div class="slot-time">${timeStr} - ${endTimeStr}</div>
    <div class="slot-provider">${slot.provider}</div>
    <span class="slot-status ${slot.available ? 'available' : 'unavailable'}">
      ${slot.available ? '✓ Available' : '✗ Booked'}
    </span>
  `;

  // Make available slots clickable
  if (slot.available) {
    card.addEventListener('click', () => selectSlot(slot.id));
  }

  return card;
}

// Handle slot selection
function selectSlot(slotId) {
  selectedSlotId = slotId;
  
  // Update slot select dropdown
  slotSelect.value = slotId;
  
  // Update visual state of all cards
  document.querySelectorAll('.slot-card').forEach(card => {
    if (card.dataset.slotId === slotId) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
  
  // Focus on name input if empty
  const nameInput = document.getElementById('name');
  if (!nameInput.value.trim()) {
    nameInput.focus();
  }
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
    if (slot.id === selectedSlotId) {
      option.selected = true;
    }
    slotSelect.appendChild(option);
  });
}

// Handle manual dropdown selection
slotSelect.addEventListener('change', (e) => {
  selectedSlotId = e.target.value;
  
  // Update visual state of cards
  document.querySelectorAll('.slot-card').forEach(card => {
    if (card.dataset.slotId === selectedSlotId) {
      card.classList.add('selected');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      card.classList.remove('selected');
    }
  });
});

// Populate provider filter dropdown
function populateProviderFilter(providers) {
  providerFilter.innerHTML = '<option value="">All Providers</option>';
  
  providers.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider;
    option.textContent = provider;
    if (provider === selectedProvider) {
      option.selected = true;
    }
    providerFilter.appendChild(option);
  });
}

// Populate date filter dropdown
function populateDateFilter(dates) {
  dateFilter.innerHTML = '<option value="">All Dates</option>';
  
  dates.forEach(dateStr => {
    const option = document.createElement('option');
    option.value = dateStr;
    
    const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    option.textContent = formattedDate;
    if (dateStr === selectedDate) {
      option.selected = true;
    }
    dateFilter.appendChild(option);
  });
}

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const slot_id = slotSelect.value;

  // Validation with specific error messages
  if (!name) {
    showError('Please enter your name');
    return;
  }

  if (!email) {
    showError('Please enter your email address');
    return;
  }

  // Validate email format more explicitly
  if (!email.includes('@')) {
    showError('Email must contain @ symbol (e.g., name@example.com)');
    return;
  }

  const emailParts = email.split('@');
  if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1]) {
    showError('Please enter a valid email address (e.g., name@example.com)');
    return;
  }

  if (!emailParts[1].includes('.')) {
    showError('Email domain must include a dot (e.g., name@example.com)');
    return;
  }

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
      // More specific error messages
      if (response.status === 409) {
        throw new Error('This slot has already been booked. Please choose another time slot.');
      } else if (response.status === 404) {
        throw new Error('The selected slot was not found. Please refresh and try again.');
      } else if (response.status === 400) {
        if (data.error === 'slot already started') {
          throw new Error('This slot has already started. Please choose a future time slot.');
        } else if (data.error === 'invalid booking') {
          throw new Error('Please check your booking details and try again.');
        } else {
          throw new Error(data.error || 'Invalid booking details');
        }
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const seconds = parseInt(retryAfter) || 60;
        startCountdown(seconds);
        throw new Error(`Too many booking attempts for this email. Please wait.`);
      } else {
        throw new Error(data.error || `Booking failed: ${response.statusText}`);
      }
    }

    // Success - show confirmation
    currentUserEmail = email; // Store for "my bookings"
    showConfirmation(data);

    // Reset form and selection
    form.reset();
    selectedSlotId = '';

    // Refresh slots to show updated availability
    await fetchSlots();
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
  applyFiltersAndRender();
});

// Date filter change handler
dateFilter.addEventListener('change', (e) => {
  selectedDate = e.target.value;
  applyFiltersAndRender();
});

// Pagination button handlers
prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    applyFiltersAndRender(false);
    slotsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

nextPageBtn.addEventListener('click', () => {
  if (!nextPageBtn.disabled) {
    currentPage++;
    applyFiltersAndRender(false);
    slotsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Show error message
function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Hide error message
function hideError() {
  errorDiv.style.display = 'none';
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

// Start countdown timer for rate limit
function startCountdown(seconds) {
  let remaining = seconds;
  
  const updateButton = () => {
    if (remaining > 0) {
      submitBtn.disabled = true;
      submitBtn.textContent = `Wait ${remaining} second${remaining !== 1 ? 's' : ''}...`;
      remaining--;
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Book Appointment';
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }
  };
  
  // Update immediately
  updateButton();
  
  // Then update every second
  countdownTimer = setInterval(updateButton, 1000);
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
      Your appointment is confirmed
    </p>
  `;
  confirmationDiv.style.display = 'block';
}

// Hide confirmation
function hideConfirmation() {
  confirmationDiv.style.display = 'none';
}

// View bookings for a user
viewBookingsBtn.addEventListener('click', async () => {
  const email = myBookingsEmail.value.trim();
  
  if (!email) {
    showError('Please enter your email address to view bookings');
    return;
  }

  if (!email.includes('@') || !email.includes('.')) {
    showError('Please enter a valid email address');
    return;
  }

  try {
    viewBookingsBtn.disabled = true;
    viewBookingsBtn.textContent = 'Loading...';
    myBookingsList.innerHTML = '<div class="loading">Loading your bookings...</div>';
    hideError();

    const response = await fetch(`${API_BASE_URL}/bookings?email=${encodeURIComponent(email)}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.statusText}`);
    }

    const data = await response.json();
    const bookings = data.bookings || [];

    if (bookings.length === 0) {
      myBookingsList.innerHTML = '<div class="no-bookings">No bookings found for this email address.</div>';
    } else {
      renderBookings(bookings);
    }

    currentUserEmail = email; // Store for future use
  } catch (err) {
    myBookingsList.innerHTML = '';
    showError(`Error loading bookings: ${err.message}`);
  } finally {
    viewBookingsBtn.disabled = false;
    viewBookingsBtn.textContent = 'View My Bookings';
  }
});

// Render bookings list
function renderBookings(bookings) {
  myBookingsList.innerHTML = '';

  bookings.forEach(booking => {
    const bookingDiv = document.createElement('div');
    bookingDiv.className = 'booking-item';

    // Find the slot details
    const slot = allSlots.find(s => s.id === booking.slot_id);
    let slotTimeStr = 'Time not available';
    let providerStr = 'Provider not available';

    if (slot) {
      const startDate = new Date(slot.start);
      const endDate = new Date(slot.end);
      slotTimeStr = `${startDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })} at ${startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })} - ${endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`;
      providerStr = slot.provider;
    }

    const statusClass = booking.status === 'confirmed' ? 'confirmed' : 'cancelled';

    bookingDiv.innerHTML = `
      <div class="booking-header">
        <span class="booking-id">Booking #${booking.id}</span>
        <span class="booking-status-badge ${statusClass}">${booking.status}</span>
      </div>
      <div class="booking-detail"><strong>Name:</strong> ${booking.name}</div>
      <div class="booking-detail"><strong>Provider:</strong> ${providerStr}</div>
      <div class="booking-detail"><strong>Time:</strong> ${slotTimeStr}</div>
      ${booking.status === 'confirmed' ? `
        <button class="cancel-btn" data-booking-id="${booking.id}" data-slot-id="${booking.slot_id}">
          Cancel Booking
        </button>
      ` : ''}
    `;

    myBookingsList.appendChild(bookingDiv);
  });

  // Add event listeners for cancel buttons
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', handleCancelBooking);
  });
}

// Handle cancel booking
async function handleCancelBooking(e) {
  const bookingId = e.target.dataset.bookingId;
  const slotId = e.target.dataset.slotId;

  if (!confirm('Are you sure you want to cancel this booking?')) {
    return;
  }

  try {
    e.target.disabled = true;
    e.target.textContent = 'Cancelling...';
    hideError();

    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Booking not found');
      } else if (response.status === 409) {
        throw new Error('This booking has already been cancelled');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel booking');
      }
    }

    const data = await response.json();

    // Show success message
    showError('✓ Booking cancelled successfully');
    errorDiv.className = 'success'; // Change to success styling
    setTimeout(() => {
      errorDiv.className = 'error';
    }, 3000);

    // Refresh the bookings list
    if (currentUserEmail) {
      myBookingsEmail.value = currentUserEmail;
      viewBookingsBtn.click();
    }

    // Refresh slots to show updated availability
    await fetchSlots();
  } catch (err) {
    showError(`Error cancelling booking: ${err.message}`);
    e.target.disabled = false;
    e.target.textContent = 'Cancel Booking';
  }
}

// Initialize app
fetchSlots();
