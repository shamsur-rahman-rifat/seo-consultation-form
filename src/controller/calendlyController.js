// calendlyController.js (ES Module)
import axios from 'axios';

const CALENDLY_TOKEN = process.env.CALENDLY_TOKEN;
const CALENDLY_API_BASE = 'https://api.calendly.com';

// ✅ Your Calendly user URI
const USER_URI = 'https://api.calendly.com/users/848c2638-42aa-4af1-9385-eaabce194e59';
const EVENT_TYPE_URI = 'https://api.calendly.com/event_types/dcd98c0c-a67f-45a0-bdf6-8a8d9c73896a';


/**
 * Get available time slots from user availability schedules
 */
export async function getAvailableTimes(req, res) {
  const { timezone = 'Asia/Dhaka' } = req.body;

  try {
    const response = await axios.get(
      `${CALENDLY_API_BASE}/user_availability_schedules`,
      {
        params: {
          user: USER_URI,
        },
        headers: {
          Authorization: `Bearer ${CALENDLY_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const schedules = response.data?.collection || [];

    // You can enhance this further by filtering based on timezone or schedule name
    return res.status(200).json({
      message: 'User availability schedules fetched successfully',
      timezone,
      schedules,
    });
  } catch (error) {
    console.error('Calendly Error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Failed to fetch user availability schedules',
      error: error.response?.data || error.message,
    });
  }
}

/**
 * Create a single-use Calendly scheduling link
 */
export async function createCalendlyLink(req, res) {
  const { name, email, timezone = 'Asia/Dhaka' } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      message: 'Name and email are required.',
    });
  }

  try {
    const response = await axios.post(
      `${CALENDLY_API_BASE}/scheduling_links`,
      {
        max_event_count: 1,
        owner: EVENT_TYPE_URI,
        owner_type: 'EventType',
      },
      {
        headers: {
          Authorization: `Bearer ${CALENDLY_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const baseUrl =
      response.data?.resource?.booking_url ||
      response.data?.data?.resource?.booking_url ||
      response.data?.data?.booking_url;

    const bookingUrl = `${baseUrl}?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&timezone=${encodeURIComponent(timezone)}`;

    return res.status(200).json({
      message: 'Calendly link created successfully',
      bookingUrl,
    });
  } catch (error) {
    console.error('Calendly Error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Failed to create Calendly link',
      error: error.response?.data || error.message,
    });
  }
}
