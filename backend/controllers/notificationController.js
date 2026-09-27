import Notification from '../models/Notification.js';
import { retryFailedNotification } from '../services/notificationService.js';

// ─── Helper: mask phone number ─────────────────────────────────────────────
const maskPhone = (phone) => {
  if (!phone) return 'N/A';
  const str = String(phone);
  if (str.length < 4) return '****';
  return str.slice(0, -4).replace(/./g, '*') + str.slice(-4);
};

// ─── GET /api/notifications — List notifications with filters ─────────────
const getNotifications = async (req, res) => {
  try {
    const { status, channel = 'WHATSAPP', type = 'ABSENCE', dateRange, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (channel) filter.channel = channel;
    if (type) filter.type = type;

    // Date range helpers
    const today = new Date().toISOString().slice(0, 10);
    if (dateRange === 'today') filter.date = today;
    else if (dateRange === 'yesterday') {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      filter.date = yesterday;
    } else if (dateRange === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      filter.date = { $gte: weekAgo, $lte: today };
    } else if (dateRange === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      filter.date = { $gte: monthAgo, $lte: today };
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Notification.countDocuments(filter),
    ]);

    // Mask phone numbers in response
    const masked = notifications.map((n) => ({
      id: n._id,
      studentId: n.studentId,
      studentName: n.studentName,
      className: n.className,
      parentName: n.parentName,
      parentPhone: maskPhone(n.parentPhone),
      type: n.type,
      channel: n.channel,
      date: n.date,
      status: n.status,
      error: n.error,
      sentAt: n.sentAt,
      retryCount: n.retryCount,
      createdAt: n.createdAt,
    }));

    return res.status(200).json({ success: true, total, page: Number(page), notifications: masked });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
};

// ─── GET /api/notifications/stats — Dashboard stats ──────────────────────
const getNotificationStats = async (req, res) => {
  try {
    const { date = new Date().toISOString().slice(0, 10) } = req.query;

    const [sent, failed, skipped, pending] = await Promise.all([
      Notification.countDocuments({ date, status: 'SENT', channel: 'WHATSAPP' }),
      Notification.countDocuments({ date, status: 'FAILED', channel: 'WHATSAPP' }),
      Notification.countDocuments({ date, status: 'SKIPPED', channel: 'WHATSAPP' }),
      Notification.countDocuments({ date, status: 'PENDING', channel: 'WHATSAPP' }),
    ]);

    return res.status(200).json({ success: true, date, stats: { sent, failed, skipped, pending, total: sent + failed + skipped + pending } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get stats', error: error.message });
  }
};

// ─── POST /api/notifications/:id/retry — Retry failed notification ─────────
const retryNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await retryFailedNotification(id);

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Retry failed', error: error.message });
  }
};

export { getNotifications, getNotificationStats, retryNotification };
