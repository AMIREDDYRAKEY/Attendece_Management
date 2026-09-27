import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { parseExcelAttendance } from '../services/excelService.js';
import { processAbsenceNotification } from '../services/notificationService.js';

// ─── Helper: mask phone number for display ────────────────────────────────
const maskPhone = (phone) => {
  if (!phone) return 'N/A';
  const str = String(phone);
  if (str.length < 4) return '****';
  return str.slice(0, -4).replace(/./g, '*') + str.slice(-4);
};

// ─── POST /api/attendance — Mark single student attendance ────────────────
const markAttendance = async (req, res) => {
  try {
    const { studentId, date, status, remarks } = req.body;

    // ── Validation ──────────────────────────────────────────────────────
    if (!studentId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'studentId, date, and status are required',
      });
    }

    if (!['Present', 'Absent'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status must be Present or Absent',
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'date must be in YYYY-MM-DD format',
      });
    }

    // ── Find student ─────────────────────────────────────────────────────
    const student = await Student.findOne({ studentId: studentId.toUpperCase(), isActive: true });
    if (!student) {
      return res.status(404).json({ success: false, message: `Student not found: ${studentId}` });
    }

    // ── Save/update attendance ───────────────────────────────────────────
    let attendance;
    let previousStatus = null;

    const existing = await Attendance.findOne({
      studentId: studentId.toUpperCase(),
      date,
    });

    if (existing) {
      previousStatus = existing.status;
      existing.status = status;
      existing.markedBy = req.user._id;
      existing.markedByName = req.user.name;
      existing.remarks = remarks || existing.remarks;
      await existing.save();
      attendance = existing;
    } else {
      attendance = await Attendance.create({
        studentId: studentId.toUpperCase(),
        date,
        status,
        className: student.className,
        markedBy: req.user._id,
        markedByName: req.user.name,
        remarks,
      });
    }

    // ── Trigger WhatsApp notification (automatic, no manual step) ────────
    let notificationResult = null;

    if (status === 'Absent') {
      // Only send if this is a new absence or status changed from Present → Absent
      // The notificationService handles duplicate protection internally
      notificationResult = await processAbsenceNotification({
        studentId: studentId.toUpperCase(),
        date,
        status,
        studentDoc: student,
      });
    }
    // If status changed from Absent → Present: do NOT send any notification

    return res.status(200).json({
      success: true,
      message: 'Attendance saved successfully',
      attendance: {
        id: attendance._id,
        studentId: attendance.studentId,
        studentName: student.name,
        className: student.className,
        date: attendance.date,
        status: attendance.status,
        markedBy: attendance.markedByName,
      },
      notification: notificationResult
        ? {
            status: notificationResult.status,
            message: notificationResult.message || notificationResult.error,
            simulated: notificationResult.simulated,
          }
        : null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message,
    });
  }
};

// ─── POST /api/attendance/upload — Excel upload ───────────────────────────
const uploadAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowedTypes.includes(req.file.mimetype) && !req.file.originalname.match(/\.(xlsx|xls)$/i)) {
      return res.status(400).json({ success: false, message: 'Only .xlsx and .xls files are allowed' });
    }

    // ── Parse Excel ──────────────────────────────────────────────────────
    let parsedData;
    try {
      parsedData = parseExcelAttendance(req.file.buffer);
    } catch (parseError) {
      return res.status(400).json({ success: false, message: parseError.message });
    }

    const { rows, errors: parseErrors } = parsedData;

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid rows found in Excel file',
        parseErrors,
      });
    }

    // ── Process each row ─────────────────────────────────────────────────
    const results = [];
    let presentCount = 0;
    let absentCount = 0;
    let whatsappSent = 0;
    let whatsappFailed = 0;
    let whatsappSkipped = 0;

    for (const row of rows) {
      const { studentId, date, status, studentName: excelName, className: excelClass, rowIndex } = row;

      const rowResult = {
        rowIndex,
        studentId,
        studentName: excelName || studentId,
        className: excelClass || 'N/A',
        date,
        attendance: status,
        whatsapp: 'N/A',
        parentPhone: 'N/A',
        message: '',
      };

      // Find student in DB
      const student = await Student.findOne({ studentId, isActive: true });

      if (!student) {
        rowResult.message = `Student not found: ${studentId}`;
        rowResult.whatsapp = 'FAILED';
        whatsappFailed++;
        results.push(rowResult);
        continue;
      }

      rowResult.studentName = student.name;
      rowResult.className = student.className;
      rowResult.parentPhone = maskPhone(student.parent?.whatsappNumber);

      // Save/update attendance
      try {
        await Attendance.findOneAndUpdate(
          { studentId, date },
          {
            studentId,
            date,
            status,
            className: student.className,
            markedBy: req.user._id,
            markedByName: req.user.name,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (dbErr) {
        rowResult.message = `DB error saving attendance: ${dbErr.message}`;
        rowResult.whatsapp = 'FAILED';
        results.push(rowResult);
        continue;
      }

      // Update counters
      if (status === 'Present') {
        presentCount++;
        rowResult.whatsapp = 'NOT_REQUIRED';
        rowResult.message = 'Student present — no notification';
      } else {
        absentCount++;

        // Trigger automatic WhatsApp notification
        const notif = await processAbsenceNotification({
          studentId,
          date,
          status,
          studentDoc: student,
        });

        rowResult.whatsapp = notif.status;
        rowResult.message = notif.message || notif.error || '';

        if (notif.status === 'SENT') whatsappSent++;
        else if (notif.status === 'FAILED') whatsappFailed++;
        else if (notif.status === 'SKIPPED') whatsappSkipped++;
      }

      results.push(rowResult);
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance processed successfully',
      totalStudents: rows.length,
      present: presentCount,
      absent: absentCount,
      whatsappSent,
      whatsappFailed,
      whatsappSkipped,
      parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process Excel file',
      error: error.message,
    });
  }
};

// ─── GET /api/attendance — Get attendance records ─────────────────────────
const getAttendance = async (req, res) => {
  try {
    const { date, className, studentId, startDate, endDate, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (date) filter.date = date;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
    if (className) filter.className = className;
    if (studentId) filter.studentId = studentId.toUpperCase();

    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1, className: 1 }).skip(skip).limit(Number(limit)),
      Attendance.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, total, page: Number(page), records });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: error.message });
  }
};

// ─── GET /api/attendance/summary — Daily summary stats ────────────────────
const getAttendanceSummary = async (req, res) => {
  try {
    const { date = new Date().toISOString().slice(0, 10), className } = req.query;
    const filter = { date };
    if (className) filter.className = className;

    const records = await Attendance.find(filter);
    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const absent = records.filter((r) => r.status === 'Absent').length;

    return res.status(200).json({ success: true, date, className: className || 'All', total, present, absent });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get summary', error: error.message });
  }
};

export { markAttendance, uploadAttendance, getAttendance, getAttendanceSummary };
