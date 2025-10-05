// calcomController.js (ES Module)
import axios from 'axios';

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_API_BASE = 'https://api.cal.com/v2';

const apiClient = axios.create({
  baseURL: CALCOM_API_BASE,
  headers: {
    Authorization: `Bearer ${CALCOM_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Get your event types (individual user)
 */
export async function getEventTypes(req, res) {
  try {
    const response = await apiClient.get('/event-types');
    const eventTypes = response.data || [];

    return res.status(200).json({
      message: 'Event types fetched successfully',
      eventTypes,
    });
  } catch (error) {
    console.error('Cal.com Error [getEventTypes]:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Failed to fetch event types',
      error: error.response?.data || error.message,
    });
  }
}

/**
 * Get available time slots for an event type (individual user)
 */

export async function getAvailableTimes(req, res) {
  const {
    eventTypeSlug,
    startDate,
    endDate,
    timezone = 'Asia/Dhaka',
  } = req.body;

  if (!eventTypeSlug || !startDate || !endDate) {
    return res.status(400).json({
      message: 'eventTypeSlug, startDate, and endDate are required.',
    });
  }

  try {
    const response = await axios.get(`${CALCOM_API_BASE}/slots`, {
      headers: {
        Authorization: `Bearer ${CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-09-04', // ✅ required
      },
      params: {
        eventTypeSlug,
        username: 'shamsur-rahman-rifat',
        start: startDate, // Must be in UTC
        end: endDate,     // Must be in UTC
        timeZone: timezone,
        format: 'range', // Optional: get slots with start/end
      },
    });

    const slots = response.data;

    return res.status(200).json({
      message: 'Available slots fetched successfully',
      slots,
    });
  } catch (error) {
    console.error('Error fetching slots:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Failed to fetch slots',
      error: error.response?.data || error.message,
    });
  }
}

/**
 * Create a booking (individual user)
 */

export async function createCalcomBooking(req, res) {
  const {
    name,
    email,
    timeZone = 'Asia/Dhaka', // ✅ Now included
    startTime, // Must be in UTC ISO 8601 format
    eventTypeId,
    eventTypeSlug,
    username = 'shamsur-rahman-rifat', // Default your username
  } = req.body;

  if (!name || !email || !startTime || (!eventTypeId && !eventTypeSlug)) {
    return res.status(400).json({
      message: 'Missing required fields: name, email, startTime, and eventTypeId or eventTypeSlug.',
    });
  }

  const payload = {
    start: startTime,
    attendee: {
      name,
      email,
      timeZone // ✅ Required
    }
  };

  if (eventTypeId) {
    payload.eventTypeId = eventTypeId;
  } else {
    payload.eventTypeSlug = eventTypeSlug;
    payload.username = username;
  }

  try {
    const response = await axios.post(
      `${CALCOM_API_BASE}/bookings`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${CALCOM_API_KEY}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-08-13' // ✅ REQUIRED header
        },
      }
    );

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: response.data,
    });
  } catch (error) {
    console.error('Cal.com Booking Error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Failed to create booking',
      error: error.response?.data || error.message,
    });
  }
}