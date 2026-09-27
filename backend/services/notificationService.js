/**
 * Notification Orchestration Service
 *
 * Core business logic:
 *   IF student is ABSENT
 *   AND parent WhatsApp number exists
 *   AND no ABSENCE notification has been sent for that date already
 *   → SEND WhatsApp automatically
 *   → SAVE status
 *
 * This service is designed to be queue-ready: all logic is in a single
 * processAbsenceNotification() function that can be called from an
 * in-process call or a BullMQ worker in the future.
 */

import Notification from '../models/Notification.js';
import Student from '../models/Student.js';
import { sendAbsenceWhatsApp, isValidWhatsAppNumber } from './whatsappService.js';

// ─── Format date for WhatsApp message ─────────────────────────────────────
const formatDateForMessage = (dateStr) => {
  try {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ─── Main orchestration function ───────────────────────────────────────────
/**
 * processAbsenceNotification
 *
 * Handles the complete flow:
 * 1. Check if student is absent
 * 2. Get parent WhatsApp number
 * 3. Check duplicate
 * 4. Create notification record
 * 5. Send WhatsApp
 * 6. Update status
 *
 * @param {object} params
 * @param {string} params.studentId   - e.g. "STU002"
 * @param {string} params.date        - YYYY-MM-DD
 * @param {string} params.status      - "Absent" or "Present"
 * @param {object} [params.studentDoc]- Pre-fetched student document (optional, avoids extra DB call)
 *
 * @returns {object} result with status: SENT | FAILED | SKIPPED | NOT_REQUIRED
 */
const processAbsenceNotification = async ({
  studentId,
  date,
  status,
  studentDoc = null,
}) => {
  // Only process absences
  if (status !== 'Absent') {
    return { status: 'NOT_REQUIRED', message: 'Student is present — no notification needed' };
  }

  // ── Step 1: Get student info ──────────────────────────────────────────
  let student = studentDoc;
  if (!student) {
    student = await Student.findOne({ studentId: studentId.toUpperCase() });
  }

  if (!student) {
    return {
      status: 'FAILED',
      error: `Student not found: ${studentId}`,
      errorCode: 'STUDENT_NOT_FOUND',
    };
  }

  const parentPhone = student.parent?.whatsappNumber;

  // ── Step 2: Check duplicate notification ─────────────────────────────
  const existingNotification = await Notification.findOne({
    studentId: studentId.toUpperCase(),
    date,
    type: 'ABSENCE',
    channel: 'WHATSAPP',
  });

  if (existingNotification) {
    // Already sent or pending — do NOT send again
    const skipMsg =
      existingNotification.status === 'SENT'
        ? `Notification already sent (ID: ${existingNotification._id})`
        : `Notification already exists with status: ${existingNotification.status}`;

    console.log(`⏭️  SKIPPED: ${skipMsg}`);
    return {
      status: 'SKIPPED',
      message: skipMsg,
      notificationId: existingNotification._id,
    };
  }

  // ── Step 3: Validate parent phone ─────────────────────────────────────
  if (!parentPhone || !isValidWhatsAppNumber(parentPhone)) {
    // Create a FAILED record so admin can see it
    const failedNotification = await Notification.create({
      studentId: studentId.toUpperCase(),
      studentName: student.name,
      className: student.className,
      parentName: student.parent?.name,
      parentPhone: parentPhone || null,
      type: 'ABSENCE',
      channel: 'WHATSAPP',
      date,
      status: 'FAILED',
      error: parentPhone
        ? `Invalid phone number format: ${parentPhone}`
        : 'Parent WhatsApp number not registered',
      errorCode: 'MISSING_NUMBER',
    });

    return {
      status: 'FAILED',
      error: parentPhone
        ? `Invalid WhatsApp number: ${parentPhone}`
        : 'Parent WhatsApp number not registered',
      errorCode: 'MISSING_NUMBER',
      notificationId: failedNotification._id,
    };
  }

  // ── Step 4: Create PENDING notification record ────────────────────────
  let notification;
  try {
    notification = await Notification.create({
      studentId: studentId.toUpperCase(),
      studentName: student.name,
      className: student.className,
      parentName: student.parent?.name,
      parentPhone,
      type: 'ABSENCE',
      channel: 'WHATSAPP',
      templateName: process.env.WHATSAPP_ABSENCE_TEMPLATE || 'school_absence_notification',
      date,
      status: 'PENDING',
    });
  } catch (dbError) {
    // If unique constraint triggers, it means a concurrent request already created it
    if (dbError.code === 11000) {
      return {
        status: 'SKIPPED',
        message: 'Concurrent notification already being processed',
      };
    }
    throw dbError;
  }

  // ── Step 5: Send WhatsApp ─────────────────────────────────────────────
  const formattedDate = formatDateForMessage(date);
  const result = await sendAbsenceWhatsApp({
    phoneNumber: parentPhone,
    studentName: student.name,
    date: formattedDate,
    schoolName: process.env.SCHOOL_NAME || 'EduNova School',
  });

  // ── Step 6: Update notification status ───────────────────────────────
  if (result.success) {
    await Notification.findByIdAndUpdate(notification._id, {
      status: 'SENT',
      providerMessageId: result.messageId,
      providerResponse: result.simulated ? { simulated: true } : result.response,
      sentAt: new Date(),
      error: result.simulated ? 'Simulated (WhatsApp not configured)' : null,
    });

    return {
      status: 'SENT',
      message: result.simulated
        ? 'WhatsApp simulated (configure WHATSAPP_ACCESS_TOKEN for real sending)'
        : 'WhatsApp notification sent successfully',
      messageId: result.messageId,
      notificationId: notification._id,
      simulated: result.simulated,
    };
  } else {
    await Notification.findByIdAndUpdate(notification._id, {
      status: 'FAILED',
      error: result.error,
      errorCode: result.errorCode,
      providerResponse: result.response,
    });

    return {
      status: 'FAILED',
      error: result.error,
      errorCode: result.errorCode,
      notificationId: notification._id,
    };
  }
};

// ─── Retry a failed notification ───────────────────────────────────────────
/**
 * retryFailedNotification
 *
 * Re-sends a WhatsApp for a notification that has status FAILED.
 * Will NOT retry SENT or SKIPPED notifications.
 */
const retryFailedNotification = async (notificationId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    return { success: false, error: 'Notification not found' };
  }

  if (notification.status === 'SENT') {
    return { success: false, error: 'Notification already sent — retry not needed' };
  }

  if (notification.status === 'SKIPPED') {
    return { success: false, error: 'Notification was skipped — retry not applicable' };
  }

  // Get student for fresh data
  const student = await Student.findOne({ studentId: notification.studentId });
  if (!student) {
    return { success: false, error: 'Student not found' };
  }

  const parentPhone = student.parent?.whatsappNumber;
  if (!parentPhone || !isValidWhatsAppNumber(parentPhone)) {
    await Notification.findByIdAndUpdate(notificationId, {
      status: 'FAILED',
      error: 'Parent WhatsApp number still not available',
      retryCount: notification.retryCount + 1,
      lastRetryAt: new Date(),
    });
    return { success: false, error: 'Parent WhatsApp number not available' };
  }

  // Update retry count and set pending
  await Notification.findByIdAndUpdate(notificationId, {
    status: 'PENDING',
    retryCount: notification.retryCount + 1,
    lastRetryAt: new Date(),
    error: null,
  });

  const formattedDate = formatDateForMessage(notification.date);
  const result = await sendAbsenceWhatsApp({
    phoneNumber: parentPhone,
    studentName: student.name,
    date: formattedDate,
    schoolName: process.env.SCHOOL_NAME || 'EduNova School',
  });

  if (result.success) {
    await Notification.findByIdAndUpdate(notificationId, {
      status: 'SENT',
      providerMessageId: result.messageId,
      sentAt: new Date(),
      error: null,
    });
    return { success: true, message: 'Retry successful', messageId: result.messageId };
  } else {
    await Notification.findByIdAndUpdate(notificationId, {
      status: 'FAILED',
      error: result.error,
      errorCode: result.errorCode,
    });
    return { success: false, error: result.error };
  }
};

export { processAbsenceNotification, retryFailedNotification };
