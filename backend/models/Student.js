import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    className: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    year: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    address: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    parent: {
      name: {
        type: String,
        trim: true,
      },
      // WhatsApp number in international format e.g. 919876543210
      whatsappNumber: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            // Allow empty or valid international format (10-15 digits, no + prefix)
            return !v || /^\d{10,15}$/.test(v);
          },
          message: 'WhatsApp number must be 10-15 digits in international format (e.g. 919876543210)',
        },
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      relation: {
        type: String,
        trim: true,
        default: 'Parent',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
studentSchema.index({ className: 1 });
studentSchema.index({ name: 'text' });

const Student = mongoose.model('Student', studentSchema);
export default Student;
