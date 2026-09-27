import Student from '../models/Student.js';

// ─── Get all students ──────────────────────────────────────────────────────
const getStudents = async (req, res) => {
  try {
    const { className, year, search, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };

    if (className) filter.className = className;
    if (year) filter.year = Number(year);
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [students, total] = await Promise.all([
      Student.find(filter)
        .select('-parent.whatsappNumber') // Mask from list response
        .sort({ className: 1, name: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Student.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      students,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
};

// ─── Get single student ────────────────────────────────────────────────────
const getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId.toUpperCase() });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.status(200).json({ success: true, student });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch student', error: error.message });
  }
};

// ─── Create student ────────────────────────────────────────────────────────
const createStudent = async (req, res) => {
  try {
    if (!req.body.studentId) {
      const count = await Student.countDocuments();
      req.body.studentId = `STU${String(count + 1).padStart(3, '0')}`;
    }
    const student = await Student.create(req.body);
    return res.status(201).json({ success: true, message: 'Student created successfully', student });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Student ID already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create student', error: error.message });
  }
};

// ─── Update student ────────────────────────────────────────────────────────
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { studentId: req.params.studentId.toUpperCase() },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.status(200).json({ success: true, message: 'Student updated', student });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update student', error: error.message });
  }
};

// ─── Delete student ────────────────────────────────────────────────────────
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { studentId: req.params.studentId.toUpperCase() },
      { isActive: false },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.status(200).json({ success: true, message: 'Student deactivated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete student', error: error.message });
  }
};

// ─── Bulk create students (seed) ───────────────────────────────────────────
const bulkCreateStudents = async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'students array is required' });
    }
    const result = await Student.insertMany(students, { ordered: false });
    return res.status(201).json({ success: true, message: `${result.length} students created`, count: result.length });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Some student IDs already exist', error: error.message });
    }
    return res.status(500).json({ success: false, message: 'Bulk create failed', error: error.message });
  }
};

export { getStudents, getStudent, createStudent, updateStudent, deleteStudent, bulkCreateStudents };
