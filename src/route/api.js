import { Router } from 'express'
import { sendContactEmail, sendVerificationCode, verifyCode, sendPartialFormData } from '../controller/mailController.js'
import { createCalendlyLink, getAvailableTimes } from '../controller/calendlyController.js'

const router=Router()

// Mail Routes

router.post('/sendContactEmail', sendContactEmail);
router.post('/sendPartialFormData', sendPartialFormData);
router.post('/sendVerificationCode', sendVerificationCode);
router.post('/verifyCode', verifyCode);

// Calendly Routes

router.post('/createCalendlyLink', createCalendlyLink);
router.post('/getAvailableTimes', getAvailableTimes);


export default router;