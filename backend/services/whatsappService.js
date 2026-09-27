/**
 * WhatsApp Business Cloud API Service
 *
 * Architecture: This service is the ONLY place that communicates with
 * the WhatsApp API. The frontend NEVER touches this. All credentials
 * live in server-side environment variables.
 *
 * Designed to be easily swappable with another provider by changing
 * only this file.
 */

import axios from 'axios';

// ─── Build the API URL ──────────────────────────────────────────────────────
const getApiUrl = () => {
  const version = process.env.WHATSAPP_API_VERSION || 'v20.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
};

// ─── Validate WhatsApp number format ────────────────────────────────────────
const isValidWhatsAppNumber = (number) => {
  if (!number) return false;
  const cleaned = String(number).replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

// ─── Core send function ─────────────────────────────────────────────────────
const sendWhatsAppMessage = async (payload) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const apiUrl = getApiUrl();

  if (!accessToken || accessToken === 'your_whatsapp_access_token_here') {
    console.warn('⚠️  WhatsApp API token not configured. Simulating send for development.');
    // Return a simulated success in dev mode when token is not set
    return {
      success: true,
      simulated: true,
      messageId: `SIM_${Date.now()}`,
      message: 'WhatsApp not configured — simulated success for development',
    };
  }

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15 second timeout
    });

    const messageId =
      response.data?.messages?.[0]?.id || null;

    return {
      success: true,
      simulated: false,
      messageId,
      response: response.data,
    };
  } catch (error) {
    const errData = error.response?.data;
    const errCode = errData?.error?.code;
    const errMessage =
      errData?.error?.message || error.message || 'Unknown WhatsApp API error';

    console.error('❌ WhatsApp API Error:', {
      code: errCode,
      message: errMessage,
      status: error.response?.status,
    });

    return {
      success: false,
      simulated: false,
      error: errMessage,
      errorCode: String(errCode),
      response: errData,
    };
  }
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * sendAbsenceWhatsApp
 *
 * Sends a school absence notification to a parent's WhatsApp number.
 * Uses the approved WhatsApp Business template.
 *
 * @param {object} params
 * @param {string} params.phoneNumber  - International format, no +, e.g. "919876543210"
 * @param {string} params.studentName  - Student's full name
 * @param {string} params.date         - Human-readable date e.g. "27 September 2026"
 * @param {string} params.schoolName   - School name for the template footer
 */
const sendAbsenceWhatsApp = async ({
  phoneNumber,
  studentName,
  date,
  schoolName,
}) => {
  if (!isValidWhatsAppNumber(phoneNumber)) {
    return {
      success: false,
      error: `Invalid phone number format: ${phoneNumber}`,
      errorCode: 'INVALID_NUMBER',
    };
  }

  const templateName =
    process.env.WHATSAPP_ABSENCE_TEMPLATE || 'school_absence_notification';
  const languageCode =
    process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';
  const school = schoolName || process.env.SCHOOL_NAME || 'EduNova School';

  // Construct WhatsApp template message payload
  // Template parameters match the approved template:
  // "Dear Parent, Your child {{1}} was marked absent on {{2}}. ... {{3}}"
  const payload = {
    messaging_product: 'whatsapp',
    to: String(phoneNumber).replace(/\D/g, ''), // Ensure only digits
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: studentName },
            { type: 'text', text: date },
            { type: 'text', text: school },
          ],
        },
      ],
    },
  };

  console.log(`📱 Sending WhatsApp absence notification to ${phoneNumber} for student: ${studentName}`);
  const result = await sendWhatsAppMessage(payload);

  if (result.success) {
    console.log(`✅ WhatsApp sent successfully. Message ID: ${result.messageId}`);
  } else {
    console.error(`❌ WhatsApp failed for ${studentName}: ${result.error}`);
  }

  return result;
};

/**
 * retryNotification
 *
 * Re-sends a failed WhatsApp message using the same logic.
 * Idempotency is handled by the Notification model before calling this.
 */
const retryNotification = async ({ phoneNumber, studentName, date, schoolName }) => {
  return await sendAbsenceWhatsApp({ phoneNumber, studentName, date, schoolName });
};

export { sendAbsenceWhatsApp, retryNotification, isValidWhatsAppNumber };
