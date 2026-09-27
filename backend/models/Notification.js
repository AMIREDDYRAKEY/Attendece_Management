import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    studentName: {
      type: String,
      trim: true,
    },
    className: {
      type: String,
      trim: true,
    },
    parentName: {
      type: String,
      trim: true,
    },
    parentPhone: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['ABSENCE', 'LATE', 'EARLY_DEPARTURE', 'GENERAL'],
      default: 'ABSENCE',
    },
    channel: {
      type: String,
      enum: ['WHATSAPP', 'SMS', 'EMAIL'],
      default: 'WHATSAPP',
    },
    templateName: {
      type: String,
      trim: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'],
      default: 'PENDING',
    },
    providerMessageId: {
      type: String,
      trim: true,
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    error: {
      type: String,
      trim: true,
    },
    errorCode: {
      type: String,
      trim: true,
    },
    sentAt: {
      type: Date,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastRetryAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent duplicate notifications: one notification per student per date per type per channel
notificationSchema.index(
  { studentId: 1, date: 1, type: 1, channel: 1 },
  { unique: true }
);
notificationSchema.index({ date: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ studentId: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
