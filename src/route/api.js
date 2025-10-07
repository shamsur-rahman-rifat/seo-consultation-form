import { Router } from 'express'
import { sendContactEmail, sendVerificationCode, verifyCode, sendPartialFormData } from '../controller/mailController.js'
import { getEventTypes, getAvailableTimes, createCalcomBooking } from '../controller/bookingController.js'

const router=Router()

// Mail Routes

router.post('/sendContactEmail', sendContactEmail);
router.post('/sendPartialFormData', sendPartialFormData);
router.post('/sendVerificationCode', sendVerificationCode);
router.post('/verifyCode', verifyCode);

// Booking Routes

router.get('/getEventTypes', getEventTypes);
router.get('/getAvailableTimes', getAvailableTimes);
router.post('/createCalcomBooking', createCalcomBooking);



export default router;