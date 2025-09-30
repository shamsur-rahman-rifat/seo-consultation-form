import React, { useState, useEffect, useRef } from 'react';
import { sendVerificationCode, verifyCode, sendContactEmail, sendPartialFormData } from "../api.js";
import { ChevronLeft, ChevronRight, CheckCircle, Lock, Phone, Mail, Globe, Target, BarChart, Calendar, FileText } from 'lucide-react';

const SEOConsultationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    fullName: '',
    email: '',
    // Step 2
    phone: '',
    confirmEmail: '',
    communicationConsent: false,
    // Step 3
    companyName: '',
    websiteUrl: '',
    noWebsite: false,
    businessIdea: '',
    // Step 4
    services: [],
    // Step 5
    googleRanking: '',
    gbpVerified: '',
    monthlyBudget: '',
    // Step 6
    selectedDate: '',
    selectedTime: '',
    timezone: 'Asia/Dhaka',
    platform: 'Google Meet',
    calendlyScheduled: false,
    // Step 7
    additionalNotes: '',
    consultationConsent: false,
    privacyConsent: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const calendlyRef = useRef(null);

  const totalSteps = 7;
  const BASE_URL = "http://localhost:4040/api"

useEffect(() => {
  if (currentStep === 6 && calendlyRef.current) {
    // Load Calendly script if not already loaded
    if (!document.getElementById('calendly-script')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.id = 'calendly-script';
      script.async = true;
      script.onload = () => {
        if (window.Calendly) {
          window.Calendly.initInlineWidget({
            url: `https://calendly.com/khanit-srrifat/30min?hide_gdpr_banner=1&name=${encodeURIComponent(formData.fullName)}&email=${encodeURIComponent(formData.email)}`,
            parentElement: calendlyRef.current,
            prefill: {},
            utm: {}
          });
        }
      };
      document.body.appendChild(script);
    } else if (window.Calendly) {
      window.Calendly.initInlineWidget({
        url: `https://calendly.com/khanit-srrifat/30min?hide_gdpr_banner=1&name=${encodeURIComponent(formData.fullName)}&email=${encodeURIComponent(formData.email)}`,
        parentElement: calendlyRef.current
      });
    }
  }
}, [currentStep, formData.fullName, formData.email]);

// Auto-save partial data every 60 seconds
useEffect(() => {
  // Don't auto-save if form is completed or no data entered yet
  if (currentStep === totalSteps || (!formData.fullName && !formData.email)) return;
  
  const intervalId = setInterval(async () => {
    try {
      await sendPartialFormData({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        companyName: formData.companyName,
        websiteUrl: formData.websiteUrl,
        noWebsite: formData.noWebsite,
        businessIdea: formData.businessIdea,
        services: formData.services.join(', '),
        googleRanking: formData.googleRanking,
        gbpVerified: formData.gbpVerified,
        monthlyBudget: formData.monthlyBudget,
        calendlyScheduled: formData.calendlyScheduled,
        additionalNotes: formData.additionalNotes,
        currentStep: currentStep,
        message: `AUTO-SAVE - User at Step ${currentStep}`
      });
      console.log('Auto-saved form data at step', currentStep);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, 60000); // Every 60 seconds

  return () => clearInterval(intervalId);
}, [formData, currentStep]);

// Send partial data when user leaves the page
useEffect(() => {
  const handleBeforeUnload = () => {
    // Only send if user has filled at least step 1 and hasn't completed the form
    if ((formData.fullName || formData.email) && currentStep < totalSteps) {
      const data = JSON.stringify({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        companyName: formData.companyName,
        websiteUrl: formData.websiteUrl,
        noWebsite: formData.noWebsite,
        businessIdea: formData.businessIdea,
        services: formData.services.join(', '),
        googleRanking: formData.googleRanking,
        gbpVerified: formData.gbpVerified,
        monthlyBudget: formData.monthlyBudget,
        calendlyScheduled: formData.calendlyScheduled,
        additionalNotes: formData.additionalNotes,
        currentStep: currentStep,
        message: `ABANDONED - User left at Step ${currentStep}`
      });
      
      // Use sendBeacon for reliable sending even when page is closing
      navigator.sendBeacon(
        `${BASE_URL}/sendPartialFormData`,
        new Blob([data], { type: 'application/json' })
      );
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [formData, currentStep]);


  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validateWebsiteUrl = (url) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email';
        break;

      case 2:
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        else if (!validatePhone(formData.phone)) newErrors.phone = 'Please enter phone with country code (+880...)';
        if (!formData.communicationConsent) newErrors.communicationConsent = 'You must agree to receive communications';
        break;

      case 3:
        if (!formData.companyName.trim()) newErrors.companyName = 'Company/Brand name is required';
        if (!formData.noWebsite && formData.websiteUrl && !validateWebsiteUrl(formData.websiteUrl)) {
          newErrors.websiteUrl = 'Please enter a valid URL with http:// or https://';
        }
        break;

      case 4:
        if (formData.services.length === 0) newErrors.services = 'Please select at least one service';
        break;

      case 5:
        if (!formData.googleRanking) newErrors.googleRanking = 'Please select your Google ranking status';
        if (!formData.gbpVerified) newErrors.gbpVerified = 'Please select your GBP verification status';
        if (!formData.monthlyBudget) newErrors.monthlyBudget = 'Please select your monthly budget';
        break;

      case 6:
        if (!formData.calendlyScheduled) {newErrors.calendlyScheduled = "You must confirm that you scheduled the meeting on Calendly"};
        break;

      case 7:
        if (!formData.consultationConsent) newErrors.consultationConsent = 'You must understand this is a professional consultation';
        if (!formData.privacyConsent) newErrors.privacyConsent = 'You must agree to the privacy policy';
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Send verification code
  const handleSendVerification = async () => {
    if (!formData.email || !formData.email.includes("@")) {
      alert("Please enter a valid email");
      return;
    }

    try {
      const data = await sendVerificationCode(formData.email);
      if (data.message === "Verification code sent") {
        setVerificationSent(true);
        alert("✅ A verification code has been sent to your email. Please check your inbox and spam/junk folder.");
      } else {
        alert(data.message || "Failed to send code");
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      alert("Something went wrong. Try again.");
    }
  };

  // Verify entered code
  const handleVerifyCode = async () => {
    try {
      const data = await verifyCode(formData.email, otpCode);
      if (data.message === "Email verified successfully") {
        setIsEmailVerified(true);
        alert("🎉 Email verified!");
      } else {
        alert(data.message || "Invalid code");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      alert("Something went wrong. Try again.");
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !isEmailVerified) {
      alert("Please verify your email before continuing.");
      return;
    }
    
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        setErrors({}); // Clear errors when moving to next step
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
    // Clear error when user selects a service
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: '' }));
    }
  };

const handleSubmit = async () => {
  if (!validateStep(7)) return;

  setIsSubmitting(true);
  try {
    const response = await sendContactEmail({
      name: formData.fullName,
      email: formData.email,
      message: `
Phone: ${formData.phone}
Company: ${formData.companyName}
Website: ${formData.websiteUrl || 'N/A'}
Services: ${formData.services.join(', ')}
Google Ranking: ${formData.googleRanking}
GBP Verified: ${formData.gbpVerified}
Budget: ${formData.monthlyBudget}
Calendly Scheduled: ${formData.calendlyScheduled ? 'Yes' : 'No'}
Additional Notes: ${formData.additionalNotes || 'None'}
      `.trim()
    });

    if (response.message && response.message.includes('successfully')) {
      alert('🎉 Thank you! Meeting scheduled successfully! Check your email for confirmation.');
    } else {
      throw new Error(response.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Submission error:', error);
    alert('There was an error scheduling your meeting. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  const getProgressPercentage = () => {
    return (currentStep / totalSteps) * 100;
  };

  const stepIcons = {
    1: Mail,
    2: Phone,
    3: Globe,
    4: Target,
    5: BarChart,
    6: Calendar,
    7: FileText
  };

  const StepIcon = stepIcons[currentStep];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <div className="text-center mb-4">
              <h2 className="h3 fw-bold text-dark mb-3">👋 Welcome! Let's Plan Your SEO Consultation</h2>
              <p className="text-muted">I'm excited to connect with you. To get started, please share your name and best email so I can confirm your meeting details.</p>
            </div>

            <div className="mb-4">
              <div className="mb-3">
                <input
                  type="text"
                  className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />
                {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
              </div>

              <div className="mb-3">
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={isEmailVerified}
                />
                {isEmailVerified && (
                  <small className="text-muted">
                    This email is verified and cannot be changed.
                  </small>
                )}                
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              {!verificationSent && (
                <button type="button" className="btn btn-brand" onClick={handleSendVerification}>
                  Send Verification Code
                </button>
              )}

              {verificationSent && !isEmailVerified && (
                <div>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Enter Verification Code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                  <button type="button" className="btn btn-success" onClick={handleVerifyCode}>
                    Verify Email
                  </button>
                </div>
              )}

              {isEmailVerified && <p className="text-success">✅ Email Verified!</p>}

            </div>

            <div className="text-center">
              <p className="small text-muted d-flex align-items-center justify-content-center">
                <Lock size={16} className="me-2" />
                Your information is 100% confidential and only used for scheduling your meeting.
              </p>
            </div>
          </div>
        );

      case 2:
        const countryOptions = [
          { code: "+880", name: "Bangladesh" },
          { code: "+91", name: "India" },
          { code: "+1", name: "United States" },
          { code: "+971", name: "United Arab Emirates" },
          { code: "+44", name: "United Kingdom" },
          { code: "+61", name: "Australia" },
          { code: "+65", name: "Singapore" },
          { code: "+60", name: "Malaysia" },
          { code: "+81", name: "Japan" },
          { code: "+82", name: "South Korea" },
          { code: "+86", name: "China" },
          { code: "+92", name: "Pakistan" },
          { code: "+974", name: "Qatar" },
          { code: "+966", name: "Saudi Arabia" },
          { code: "+964", name: "Iraq" },
          { code: "+49", name: "Germany" },
          { code: "+33", name: "France" },
          { code: "+39", name: "Italy" },
          { code: "+34", name: "Spain" },
          { code: "+351", name: "Portugal" },
          { code: "+90", name: "Turkey" },
          { code: "+234", name: "Nigeria" },
          { code: "+254", name: "Kenya" },
          { code: "+27", name: "South Africa" },
          { code: "+62", name: "Indonesia" },
          { code: "+63", name: "Philippines" },
          { code: "+66", name: "Thailand" },
          { code: "+84", name: "Vietnam" },
          { code: "+45", name: "Denmark" },
          { code: "+47", name: "Norway" },
          { code: "+46", name: "Sweden" },
          { code: "+7", name: "Russia" },
          { code: "+", name: "Others" }
          // add more as needed
        ];

        return (
          <div>
            <div className="text-center mb-4">
              <h2 className="h3 fw-bold text-dark mb-3">📞 How Can I Reach You?</h2>
              <p className="text-muted">Select your country and enter your phone number. We’ll also use your verified email for communication.</p>
            </div>

            <div className="mb-4">
              {/* Show email from Step 1 (read-only) */}
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  readOnly
                />
                <small className="text-muted">This is the email you verified in Step 1</small>
              </div>

              {/* Country selector */}
              <div className="mb-3">
                <select
                  className="form-select"
                  value={formData.phone.startsWith('+') ? formData.phone.split(' ')[0] : ''}
                  onChange={(e) => {
                    const selectedCode = e.target.value;
                    handleInputChange("phone", `${selectedCode}`);
                  }}
                >
                  <option value="">Select Country</option>
                  {countryOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone number input */}
              <div className="mb-3">
                <input
                  type="tel"
                  className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
                {errors.phone && (
                  <div className="invalid-feedback">{errors.phone}</div>
                )}
              </div>

              {/* Consent checkbox */}
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className={`form-check-input ${errors.communicationConsent ? "is-invalid" : ""}`}
                  id="communicationConsent"
                  checked={formData.communicationConsent}
                  onChange={(e) =>
                    handleInputChange("communicationConsent", e.target.checked)
                  }
                  required
                />
                <label className="form-check-label" htmlFor="communicationConsent">
                  I agree to receive communication about this meeting via email/phone.
                </label>
                {errors.communicationConsent && (
                  <div className="invalid-feedback d-block">
                    {errors.communicationConsent}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="small text-muted d-flex align-items-center justify-content-center">
                <Lock size={16} className="me-2" />
                We respect your privacy. Your details will only be used for scheduling and communication purposes.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <div className="text-center mb-4">
              <h2 className="h3 fw-bold text-dark mb-3">🏢 Tell Me About Your Business</h2>
              <p className="text-muted">I'd love to know a bit about your business so I can prepare for our meeting and give you personalized recommendations.</p>
            </div>

            <div className="mb-4">
              <div className="mb-3">
                <input
                  type="text"
                  className={`form-control ${errors.companyName ? 'is-invalid' : ''}`}
                  placeholder="Company / Brand Name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  required
                />
                {errors.companyName && <div className="invalid-feedback">{errors.companyName}</div>}
              </div>

              <div className="mb-3">
                <input
                  type="url"
                  className={`form-control ${errors.websiteUrl ? 'is-invalid' : ''} ${formData.noWebsite ? 'bg-light' : ''}`}
                  placeholder="Website URL (if available)"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  disabled={formData.noWebsite}
                />
                {errors.websiteUrl && <div className="invalid-feedback">{errors.websiteUrl}</div>}
              </div>

              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="noWebsite"
                  checked={formData.noWebsite}
                  onChange={(e) => {
                    handleInputChange('noWebsite', e.target.checked);
                    if (e.target.checked) {
                      handleInputChange('websiteUrl', '');
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="noWebsite">
                  I don't have a website yet
                </label>
              </div>

              {formData.noWebsite && (
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    placeholder="Business idea or planned website (optional)"
                    value={formData.businessIdea}
                    onChange={(e) => handleInputChange('businessIdea', e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        const serviceOptions = [
          'AI-First SEO Growth Sprint',
          'Local SEO Booster',
          'Digital PR & Brand Entity Build',
          'Generative-Engine Content Pack',
          'SEO Training / Mentorship with Md Faruk Khan',
          'Not sure yet — I\'d like your recommendation'
        ];

        return (
          <div>
            <div className="text-center mb-4">
              <h2 className="h3 fw-bold text-dark mb-3">⚡ Which SEO Service Are You Interested In?</h2>
              <p className="text-muted">Please select the service(s) you're most interested in. This helps me prepare tailored insights for our meeting.</p>
            </div>

            <div className="mb-4">
              {serviceOptions.map((service, index) => (
                <div key={service} className="form-check mb-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`service-${index}`}
                    checked={formData.services.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                  />
                  <label className="form-check-label" htmlFor={`service-${index}`}>
                    {service}
                  </label>
                </div>
              ))}
              {errors.services && <div className="text-danger small mt-2">{errors.services}</div>}

              <div className="alert alert-info mt-3">
                <small>👉 Multiple options can be selected.</small>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <div className="text-center mb-4">
              <h2 className="h3 fw-bold text-dark mb-3">📊 Tell Me About Your Current SEO Status</h2>
              <p className="text-muted">This helps me understand where you're starting from so I can give you the most relevant advice during our meeting.</p>
            </div>

            <div className="mb-4">
              <div className="mb-4">
                <label className="form-label fw-semibold">Do you currently rank on Google for your main keywords?</label>
                {['Yes', 'No', 'Not Sure'].map((option) => (
                  <div key={option} className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      id={`ranking-${option.replace(' ', '')}`}
                      name="googleRanking"
                      value={option}
                      checked={formData.googleRanking === option}
                      onChange={(e) => handleInputChange('googleRanking', e.target.value)}
                    />
                    <label className="form-check-label" htmlFor={`ranking-${option.replace(' ', '')}`}>{option}</label>
                  </div>
                ))}
                {errors.googleRanking && <div className="text-danger small mt-1">{errors.googleRanking}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Do you have a Google Business Profile (GBP) verified?</label>
                {['Yes', 'No'].map((option) => (
                  <div key={option} className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      id={`gbp-${option}`}
                      name="gbpVerified"
                      value={option}
                      checked={formData.gbpVerified === option}
                      onChange={(e) => handleInputChange('gbpVerified', e.target.value)}
                    />
                    <label className="form-check-label" htmlFor={`gbp-${option}`}>{option}</label>
                  </div>
                ))}
                {errors.gbpVerified && <div className="text-danger small mt-1">{errors.gbpVerified}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Monthly SEO / Marketing Budget</label>
                <select
                  className={`form-select ${errors.monthlyBudget ? 'is-invalid' : ''}`}
                  value={formData.monthlyBudget}
                  onChange={(e) => handleInputChange('monthlyBudget', e.target.value)}
                  required
                >
                  <option value="">Select budget range</option>
                  <option value="Less than $500">Less than $500</option>
                  <option value="$500–$1,000">$500–$1,000</option>
                  <option value="$1,000–$2,500">$1,000–$2,500</option>
                  <option value="$2,500–$5,000">$2,500–$5,000</option>
                  <option value="$5,000+">$5,000+</option>
                </select>
                {errors.monthlyBudget && <div className="invalid-feedback">{errors.monthlyBudget}</div>}
              </div>
            </div>
          </div>
        );

case 6:
  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="h3 fw-bold text-dark mb-3">🗓️ Schedule Your Consultation</h2>
        <p className="text-muted">
          Please pick a date and time that works best for you using the Calendly scheduler below.
        </p>
      </div>

      {/* Show Calendly only if not confirmed */}
      {!formData.calendlyScheduled && (
        <div className="mb-4">
          <div
            ref={calendlyRef}
            style={{ minWidth: "320px", height: "700px" }}
            key={currentStep}
          ></div>
        </div>
      )}

      {/* Confirmation Checkbox (locked once checked) */}
      <div className="form-check mb-3">
        <input
          type="checkbox"
          className={`form-check-input ${errors.calendlyScheduled ? "is-invalid" : ""}`}
          id="calendlyScheduled"
          checked={formData.calendlyScheduled}
          onChange={(e) => {
            if (!formData.calendlyScheduled) {
              handleInputChange("calendlyScheduled", e.target.checked);
            }
          }}
          disabled={formData.calendlyScheduled} // lock after confirming
          required
        />
        <label className="form-check-label" htmlFor="calendlyScheduled">
          {formData.calendlyScheduled
            ? "✅ Consultation confirmed"
            : "I confirm that I have scheduled my consultation on Calendly"}
        </label>
        {errors.calendlyScheduled && (
          <div className="invalid-feedback d-block">
            {errors.calendlyScheduled}
          </div>
        )}
      </div>

      {/* Success message if confirmed */}
      {formData.calendlyScheduled && (
        <div className="alert alert-success mt-3" role="alert">
          🎉 Thank you! Your consultation is scheduled. You can proceed to the next step.
        </div>
      )}
    </div>
  );

      case 7:
        return (
          <div>
            <div className="text-center mb-4">
              <h2 className="h3 fw-bold text-dark mb-3">✍️ Final Step Before Confirming Your Meeting</h2>
              <p className="text-muted">If there's anything specific you'd like me to review before our call, please share it here. Then, confirm your consent to proceed.</p>
            </div>

            <div className="mb-4">
              <div className="mb-3">
                <textarea
                  className="form-control"
                  placeholder="Any additional notes or specific topics you'd like to discuss? (optional)"
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="mb-3">
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className={`form-check-input ${errors.consultationConsent ? 'is-invalid' : ''}`}
                    id="consultationConsent"
                    checked={formData.consultationConsent}
                    onChange={(e) => handleInputChange('consultationConsent', e.target.checked)}
                    required
                  />
                  <label className="form-check-label" htmlFor="consultationConsent">
                    I understand this meeting is a professional consultation with Md Faruk Khan and not a free training session.
                  </label>
                  {errors.consultationConsent && <div className="invalid-feedback d-block">{errors.consultationConsent}</div>}
                </div>

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className={`form-check-input ${errors.privacyConsent ? 'is-invalid' : ''}`}
                    id="privacyConsent"
                    checked={formData.privacyConsent}
                    onChange={(e) => handleInputChange('privacyConsent', e.target.checked)}
                    required
                  />
                  <label className="form-check-label" htmlFor="privacyConsent">
                    I agree to the privacy policy and allow my data to be used for scheduling and communication.
                  </label>
                  {errors.privacyConsent && <div className="invalid-feedback d-block">{errors.privacyConsent}</div>}
                </div>
              </div>
            </div>

            {formData.consultationConsent && formData.privacyConsent && (
              <div className="alert alert-success">
                <div className="d-flex align-items-center mb-2">
                  <CheckCircle size={20} className="me-2" />
                  <span className="fw-semibold">Ready to schedule your meeting!</span>
                </div>
                <div className="small">
                  <p className="mb-0">
                    Please check your email for meeting details. 📧
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = (step) => {
    const titles = {
      1: 'Personal Information',
      2: 'Contact Details',
      3: 'Business Information',
      4: 'Service Selection',
      5: 'Current SEO Status',
      6: 'Meeting Preferences',
      7: 'Final Confirmation'
    };
    return titles[step] || 'Unknown Step';
  };

  const getButtonText = () => {
    const buttonTexts = {
      1: '➡️ Continue to Contact Details',
      2: '➡️ Next: Business Details',
      3: '➡️ Next: Service Needs',
      4: '➡️ Next: Current SEO Status',
      5: '➡️ Next: Meeting Preferences',
      6: '➡️ Next: Final Notes & Consent',
      7: '✅ Confirm & Schedule My Meeting'
    };
    return buttonTexts[currentStep] || 'Next';
  };

  return (
    <>
      <style>
        {`
          .btn-brand {
            background-color: #14b8a6;
            border-color: #14b8a6;
            color: white;
          }
          
          .btn-brand:hover {
            background-color: #0f9488;
            border-color: #0f9488;
            color: white;
          }
          
          .btn-brand:focus {
            background-color: #0f9488;
            border-color: #0f9488;
            color: white;
            box-shadow: 0 0 0 0.2rem rgba(20, 184, 166, 0.25);
          }
          
          .progress-brand .progress-bar {
            background-color: #14b8a6;
          }
          
          .form-control:focus {
            border-color: #14b8a6;
            box-shadow: 0 0 0 0.2rem rgba(20, 184, 166, 0.25);
          }
          
          .form-select:focus {
            border-color: #14b8a6;
            box-shadow: 0 0 0 0.2rem rgba(20, 184, 166, 0.25);
          }
          
          .form-check-input:checked {
            background-color: #14b8a6;
            border-color: #14b8a6;
          }
          
          .form-check-input:focus {
            border-color: #14b8a6;
            box-shadow: 0 0 0 0.2rem rgba(20, 184, 166, 0.25);
          }

          .transition-width {
            transition: width 0.3s ease;
          }
        `}
      </style>
      <div className="min-vh-100 bg-light py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-6">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-medium text-muted">
                    Step {currentStep} of {totalSteps}
                  </span>
                  <span className="small fw-medium text-muted">
                    {Math.round(getProgressPercentage())}%
                  </span>
                </div>
                <div className="progress progress-brand" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar transition-width"
                    role="progressbar"
                    style={{ width: `${getProgressPercentage()}%` }}
                    aria-valuenow={getProgressPercentage()}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`Progress: Step ${currentStep} of ${totalSteps}`}
                  ></div>
                </div>
                <div className="text-center mt-2">
                  <span className="small text-muted d-flex align-items-center justify-content-center">
                    <StepIcon size={16} className="me-2" />
                    {getStepTitle(currentStep)}
                  </span>
                </div>
              </div>

              {/* Form Card */}
              <div className="card shadow-sm">
                <div className="card-body p-4">
                  {renderStep()}

                  {/* Navigation Buttons */}
                  <div className="d-flex justify-content-between pt-4 mt-4 border-top">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className={`btn d-flex align-items-center ${
                        currentStep === 1
                          ? 'btn-outline-secondary disabled'
                          : 'btn-outline-secondary'
                      }`}
                    >
                      <ChevronLeft size={16} className="me-2" />
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className={`btn d-flex align-items-center ${
                        isSubmitting
                          ? 'btn-secondary disabled'
                          : 'btn-brand'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          {getButtonText()}
                          {currentStep < totalSteps && <ChevronRight size={16} className="ms-2" />}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SEOConsultationForm;