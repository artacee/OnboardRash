/**
 * Main JavaScript for Rash Driving Detection Dashboard
 * 
 * ARCHITECTURE NOTE:
 * This code uses a component-like structure for easy React migration.
 * Each section (Stats, Map, Alerts, Table) is a separate "component" object.
 * State is managed centrally and passed to components.
 */

// ==================== STATE MANAGEMENT ====================
// Central state - similar to React's useState
const state = {
    connected: false,
    stats: {
        totalBuses: 0,
        activeBuses: 0,
        todayEvents: 0,
        highSeverity: 0
    },
    events: [],
    alerts: [],
    busLocations: [],
    filters: {
        severity: '',
        type: ''
    }
};

// ==================== SOCKET CONNECTION ====================
let socket = null;

function initSocket() {
    socket = io({
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('Connected to server');
        state.connected = true;
        updateConnectionStatus(true);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        state.connected = false;
        updateConnectionStatus(false);
    });

    socket.on('connected', (data) => {
        console.log('Server message:', data.message);
    });

    socket.on('new_alert', (event) => {
        console.log('New alert received:', event);
        handleNewAlert(event);
    });
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('status-indicator');
    const statusText = indicator.querySelector('.status-text');

    if (connected) {
        indicator.classList.add('connected');
        indicator.classList.remove('disconnected');
        statusText.textContent = 'Live';
    } else {
        indicator.classList.remove('connected');
        indicator.classList.add('disconnected');
        statusText.textContent = 'Disconnected';
    }
}

// ==================== API CALLS ====================
async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        state.stats = {
            totalBuses: data.total_buses || 0,
            activeBuses: data.active_buses || 0,
            todayEvents: data.today_events || 0,
            highSeverity: data.high_severity || 0
        };
        renderStats();
    } catch (error) {
        console.error('Failed to fetch stats:', error);
    }
}

async function fetchEvents() {
    try {
        const params = new URLSearchParams();
        if (state.filters.severity) params.append('severity', state.filters.severity);
        if (state.filters.type) params.append('event_type', state.filters.type);
        params.append('limit', '50');

        const response = await fetch(`/api/events?${params}`);
        const data = await response.json();
        state.events = data.events || [];
        renderEventsTable();
    } catch (error) {
        console.error('Failed to fetch events:', error);
    }
}

async function fetchBusLocations() {
    try {
        const response = await fetch('/api/buses/locations');
        const data = await response.json();
        state.busLocations = data.locations || [];
        updateMapMarkers();
    } catch (error) {
        console.error('Failed to fetch bus locations:', error);
    }
}

// ==================== COMPONENTS ====================

// Stats Component
function renderStats() {
    document.getElementById('stat-total-buses').textContent = state.stats.totalBuses;
    document.getElementById('stat-active-buses').textContent = state.stats.activeBuses;
    document.getElementById('stat-today-events').textContent = state.stats.todayEvents;
    document.getElementById('stat-high-severity').textContent = state.stats.highSeverity;
}

// Map Component
let map = null;
let markers = {};

function initMap() {
    // Center on Kollam, Kerala
    map = L.map('map').setView([8.8932, 76.6141], 12);

    // Use dark theme map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
    }).addTo(map);
}

function updateMapMarkers() {
    // Clear old markers
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    markers = {};

    // Add new markers
    state.busLocations.forEach(loc => {
        const busIcon = L.divIcon({
            className: 'bus-marker',
            html: '🚌',
            iconSize: [30, 30]
        });

        const marker = L.marker([loc.latitude, loc.longitude], { icon: busIcon })
            .bindPopup(`
                <strong>${loc.bus_registration || 'Bus ' + loc.bus_id}</strong><br>
                Speed: ${loc.speed ? loc.speed.toFixed(1) + ' km/h' : 'N/A'}<br>
                Updated: ${formatTime(loc.updated_at)}
            `);

        marker.addTo(map);
        markers[loc.bus_id] = marker;
    });
}

// Alerts Component
function handleNewAlert(event) {
    // Add to alerts list
    state.alerts.unshift(event);
    if (state.alerts.length > 20) state.alerts.pop();

    // Update events list
    state.events.unshift(event);

    // Update stats
    state.stats.todayEvents++;
    if (event.severity === 'HIGH') state.stats.highSeverity++;

    // Re-render
    renderAlerts();
    renderEventsTable();
    renderStats();

    // Play sound for high severity
    if (event.severity === 'HIGH') {
        playAlertSound();
    }

    // Update map if location available
    if (event.location?.lat && event.location?.lng) {
        // Flash alert on map
        const alertIcon = L.divIcon({
            className: 'alert-marker',
            html: '⚠️',
            iconSize: [30, 30]
        });

        const alertMarker = L.marker([event.location.lat, event.location.lng], { icon: alertIcon })
            .addTo(map)
            .bindPopup(`
                <strong>${event.event_type}</strong><br>
                Bus: ${event.bus_registration}<br>
                Severity: ${event.severity}
            `)
            .openPopup();

        // Remove after 10 seconds
        setTimeout(() => map.removeLayer(alertMarker), 10000);
    }
}

function renderAlerts() {
    const container = document.getElementById('alerts-list');
    const countBadge = document.getElementById('alert-count');

    countBadge.textContent = state.alerts.length;

    if (state.alerts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No alerts yet. Waiting for events...</p></div>';
        return;
    }

    container.innerHTML = state.alerts.map(alert => `
        <div class="alert-item ${alert.severity.toLowerCase()}">
            <div class="alert-header">
                <span class="alert-type">${formatEventType(alert.event_type)}</span>
                <span class="alert-time">${formatTime(alert.timestamp)}</span>
            </div>
            <div class="alert-details">
                🚌 ${alert.bus_registration || 'Bus ' + alert.bus_id} 
                ${alert.speed ? `• ${alert.speed.toFixed(1)} km/h` : ''}
            </div>
        </div>
    `).join('');
}

// Events Table Component
function renderEventsTable() {
    const tbody = document.getElementById('events-table-body');

    if (state.events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No events found</td></tr>';
        return;
    }

    tbody.innerHTML = state.events.map(event => `
        <tr>
            <td>${formatTime(event.timestamp)}</td>
            <td>${event.bus_registration || 'Bus ' + event.bus_id}</td>
            <td>${formatEventType(event.event_type)} ${event.has_snapshot ? '<span title="Has video evidence">📹</span>' : ''}</td>
            <td><span class="severity-badge ${event.severity.toLowerCase()}">${event.severity}</span></td>
            <td>${event.speed ? event.speed.toFixed(1) + ' km/h' : '-'}</td>
            <td>${formatLocation(event.location)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewEvent(${event.id})">View</button>
                ${event.snapshot_url ? `<button class="btn btn-sm btn-primary" onclick="viewSnapshot('${event.snapshot_url}')">📷</button>` : ''}
            </td>
        </tr>
    `).join('');
}

// ==================== UTILITIES ====================

function formatEventType(type) {
    const types = {
        'HARSH_BRAKE': '🛑 Harsh Brake',
        'HARSH_ACCEL': '⚡ Harsh Acceleration',
        'AGGRESSIVE_TURN': '↩️ Aggressive Turn',
        'TAILGATING': '🚗 Tailgating',
        'SPEEDING': '💨 Speeding'
    };
    return types[type] || type;
}

function formatTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatLocation(location) {
    if (!location || (!location.lat && !location.lng)) return '-';
    if (location.address) return location.address;
    return `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`;
}

function playAlertSound() {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    setTimeout(() => oscillator.stop(), 200);
}

function viewEvent(eventId) {
    // TODO: Open event detail modal
    console.log('View event:', eventId);
    alert(`Event ID: ${eventId}\n\nDetailed view coming soon!`);
}

function viewSnapshot(snapshotUrl) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8); display: flex;
        align-items: center; justify-content: center; z-index: 1000;
        cursor: pointer;
    `;
    overlay.onclick = () => overlay.remove();

    const img = document.createElement('img');
    img.src = snapshotUrl;
    img.style.cssText = `
        max-width: 90%; max-height: 90%; border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `;

    overlay.appendChild(img);
    document.body.appendChild(overlay);
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Filters
    document.getElementById('filter-severity').addEventListener('change', (e) => {
        state.filters.severity = e.target.value;
        fetchEvents();
    });

    document.getElementById('filter-type').addEventListener('change', (e) => {
        state.filters.type = e.target.value;
        fetchEvents();
    });

    document.getElementById('refresh-events').addEventListener('click', () => {
        fetchEvents();
        fetchStats();
    });
}

// ==================== INITIALIZATION ====================

// Check authentication
function checkAuth() {
    if (sessionStorage.getItem('logged_in') !== 'true') {
        window.location.href = '/login.html';
        return false;
    }

    // Display username
    const username = sessionStorage.getItem('username') || 'Admin';
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = username.charAt(0).toUpperCase() + username.slice(1);
    }

    return true;
}

// Logout function
function logout() {
    sessionStorage.removeItem('logged_in');
    sessionStorage.removeItem('username');
    window.location.href = '/login.html';
}

// Export to CSV
function exportCSV() {
    // Build URL with current filters
    const params = new URLSearchParams();
    if (state.filters.severity) params.append('severity', state.filters.severity);
    if (state.filters.type) params.append('event_type', state.filters.type);

    // Trigger download
    window.location.href = `/api/export/events?${params}`;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚌 Rash Driving Detection Dashboard initializing...');

    // Check authentication first
    if (!checkAuth()) return;

    // Initialize components
    initSocket();
    initMap();
    setupEventListeners();

    // Initial data fetch
    fetchStats();
    fetchEvents();
    fetchBusLocations();

    // Periodic refresh
    setInterval(fetchStats, 30000);  // Every 30 seconds
    setInterval(fetchBusLocations, 10000);  // Every 10 seconds

    console.log('✅ Dashboard initialized');
});
