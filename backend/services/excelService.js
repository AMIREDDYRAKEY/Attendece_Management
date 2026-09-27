/**
 * Excel Service
 *
 * Parses .xlsx / .xls attendance files and returns structured row data.
 *
 * Expected Excel columns (case-insensitive):
 *   Student ID | Student Name | Class | Date | Status
 */

import XLSX from 'xlsx';

// ─── Column name aliases (case-insensitive matching) ───────────────────────
const COLUMN_ALIASES = {
  studentId: ['student id', 'studentid', 'student_id', 'id', 'roll no', 'rollno'],
  studentName: ['student name', 'studentname', 'student_name', 'name'],
  className: ['class', 'classname', 'class name', 'class_name', 'section'],
  date: ['date', 'attendance date', 'attendancedate'],
  status: ['status', 'attendance', 'attendance status', 'attendancestatus', 'present/absent'],
};

// ─── Normalize a column header ─────────────────────────────────────────────
const normalizeHeader = (header) => String(header || '').trim().toLowerCase();

// ─── Map raw headers to standardized field names ───────────────────────────
const mapHeaders = (rawHeaders) => {
  const mapping = {};

  rawHeaders.forEach((raw, idx) => {
    const normalized = normalizeHeader(raw);
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(normalized)) {
        mapping[field] = idx; // store column index
        break;
      }
    }
  });

  return mapping;
};

// ─── Validate that all required columns are present ───────────────────────
const validateColumns = (mapping) => {
  const required = ['studentId', 'date', 'status'];
  const missing = required.filter((col) => mapping[col] === undefined);
  return missing;
};

// ─── Normalize attendance status ───────────────────────────────────────────
const normalizeStatus = (raw) => {
  const lower = String(raw || '').trim().toLowerCase();
  if (['absent', 'a', '0', 'no', 'false'].includes(lower)) return 'Absent';
  if (['present', 'p', '1', 'yes', 'true'].includes(lower)) return 'Present';
  return null; // invalid
};

// ─── Parse date from Excel cell ────────────────────────────────────────────
const parseDate = (raw) => {
  if (!raw) return null;

  // Excel serial number (e.g. 45678)
  if (typeof raw === 'number') {
    const date = XLSX.SSF.parse_date_code(raw);
    if (date) {
      const y = date.y;
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(raw).trim();

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // YYYY-MM-DD
  const ymd = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return null;
};

// ─── Main parse function ───────────────────────────────────────────────────
/**
 * parseExcelAttendance
 *
 * @param {Buffer} fileBuffer - The uploaded .xlsx/.xls file buffer
 * @returns {{ rows: Array, errors: Array }}
 *   rows: Array of { studentId, studentName, className, date, status, rowIndex }
 *   errors: Array of { rowIndex, message }
 */
const parseExcelAttendance = (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Excel file has no sheets.');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawData || rawData.length < 2) {
    throw new Error('Excel file is empty or has no data rows.');
  }

  // First row is headers
  const rawHeaders = rawData[0].map(String);
  const mapping = mapHeaders(rawHeaders);

  const missingCols = validateColumns(mapping);
  if (missingCols.length > 0) {
    throw new Error(
      `Missing required Excel columns: ${missingCols.join(', ')}. ` +
      `Expected columns: Student ID, Student Name, Class, Date, Status`
    );
  }

  const rows = [];
  const errors = [];

  // Process data rows (skip header row at index 0)
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    const rowIndex = i + 1; // 1-based for human display

    // Skip completely empty rows
    const isEmpty = row.every((cell) => String(cell).trim() === '');
    if (isEmpty) continue;

    const studentId = String(row[mapping.studentId] || '').trim().toUpperCase();
    const studentName =
      mapping.studentName !== undefined
        ? String(row[mapping.studentName] || '').trim()
        : '';
    const className =
      mapping.className !== undefined
        ? String(row[mapping.className] || '').trim()
        : '';
    const rawDate = row[mapping.date];
    const rawStatus = row[mapping.status];

    // Validate student ID
    if (!studentId) {
      errors.push({ rowIndex, message: 'Student ID is missing' });
      continue;
    }

    // Validate and parse date
    const date = parseDate(rawDate);
    if (!date) {
      errors.push({
        rowIndex,
        message: `Invalid date format: '${rawDate}'. Use DD-MM-YYYY or YYYY-MM-DD`,
      });
      continue;
    }

    // Validate status
    const status = normalizeStatus(rawStatus);
    if (!status) {
      errors.push({
        rowIndex,
        message: `Invalid status: '${rawStatus}'. Use Present or Absent`,
      });
      continue;
    }

    rows.push({ studentId, studentName, className, date, status, rowIndex });
  }

  return { rows, errors };
};

export { parseExcelAttendance };
