/**
 * @file script.js
 * ResearchPC - Research PC Allocation & Scheduling Management System
 * University DBMS Course Project
 * Plain JavaScript, shared localStorage data layer, and EmailJS verification.
 */

var DEMO_MODE = true;
var DATA_VERSION = 2;
// Replace these functions with fetch() calls to the Flask API when the backend is ready.

/* ==========================================================================
   EMAILJS CONFIGURATION & ADMIN SETUP
   ========================================================================== */
const EMAILJS_CONFIG = { serviceId: "PASTE_SERVICE_ID", templateId: "PASTE_TEMPLATE_ID", publicKey: "PASTE_PUBLIC_KEY" };

// Keep the admin email as a variable at the top of script.js so it can be changed to a real email
const ADMIN_EMAIL = "admin@example.com";

// Early theme sync to prevent flash of unstyled theme
(function initEarlyTheme() {
  try {
    const saved = localStorage.getItem("rp_theme");
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved || (systemPrefersDark ? "dark" : "light");
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (e) {
    // Ignore storage issues
  }
})();

/* ==========================================================================
   B. SHARED DATA LAYER (localStorage persistence across all pages)
   Keys: rp_requests, rp_emergency, rp_allocations, rp_pcs, rp_slots,
         rp_students, rp_supervisors, rp_admins, rp_logs, rp_session
   ========================================================================== */

const STORAGE_KEYS = {
  REQUESTS: "rp_requests",
  EMERGENCY: "rp_emergency",
  ALLOCATIONS: "rp_allocations",
  PCS: "rp_pcs",
  SLOTS: "rp_slots",
  STUDENTS: "rp_students",
  SUPERVISORS: "rp_supervisors",
  ADMINS: "rp_admins",
  NOTIFICATIONS: "rp_notifications",
  LOGS: "rp_logs",
  SESSION: "rp_session",
  DATA_VERSION: "rp_data_version"
};

function formatLocalDateOffset(offsetDays) {
  const base = new Date();
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function relativePastDate(daysAgo) {
  return formatLocalDateOffset(-Math.abs(daysAgo || 0));
}

// Helper to generate consecutive slot dates starting from today (YYYY-MM-DD)
function generateNextDays(count = 7) {
  const dates = [];
  for (let i = 0; i < count; i++) {
    dates.push(formatLocalDateOffset(i));
  }
  return dates;
}

const slotDates = generateNextDays(7);

// Standard 3 daily time slots
const standardSlotTimes = [
  { slot_suffix: "1", start_time: "09:00", end_time: "11:00", label: "09:00 - 11:00" },
  { slot_suffix: "2", start_time: "11:00", end_time: "13:00", label: "11:00 - 13:00" },
  { slot_suffix: "3", start_time: "14:00", end_time: "16:00", label: "14:00 - 16:00" }
];

// Note: password_hash holds plain text ONLY in demo mode.
// Replace these functions with fetch() calls to the Flask API when the backend is ready.
const DEFAULT_STUDENTS = [
  { student_id: "ST01", name: "Arpita Das", email: "arpita@example.com", password_hash: "demo123", phone: "01700000001", department: "CSE", batch: "33", status: "Active" },
  { student_id: "ST02", name: "Rahim Ahmed", email: "rahim@example.com", password_hash: "demo123", phone: "01700000002", department: "CSE", batch: "33", status: "Active" },
  { student_id: "ST03", name: "Nila Das", email: "nila@example.com", password_hash: "demo123", phone: "01700000003", department: "CSE", batch: "33", status: "Active" },
  { student_id: "ST04", name: "Tanvir Hasan", email: "tanvir@example.com", password_hash: "demo123", phone: "01700000004", department: "CSE", batch: "33", status: "Active" },
  { student_id: "ST05", name: "Sadia Islam", email: "sadia@example.com", password_hash: "demo123", phone: "01700000005", department: "CSE", batch: "34", status: "Active" },
  { student_id: "ST06", name: "Mahmudul Karim", email: "mahmudul@example.com", password_hash: "demo123", phone: "01700000006", department: "CSE", batch: "33", status: "Active" },
  { student_id: "ST07", name: "Farhana Akter", email: "farhana@example.com", password_hash: "demo123", phone: "01700000007", department: "CSE", batch: "34", status: "Active" },
  { student_id: "ST08", name: "Imran Hossain", email: "imran@example.com", password_hash: "demo123", phone: "01700000008", department: "CSE", batch: "33", status: "Active" },
  { student_id: "ST09", name: "Mim Chowdhury", email: "mim@example.com", password_hash: "demo123", phone: "01700000009", department: "CSE", batch: "34", status: "Active" },
  { student_id: "ST10", name: "Sabbir Rahman", email: "sabbir@example.com", password_hash: "demo123", phone: "01700000010", department: "CSE", batch: "33", status: "Active" },
  { student_id: "ST11", name: "Jannat Ferdous", email: "jannat@example.com", password_hash: "demo123", phone: "01700000011", department: "CSE", batch: "34", status: "Active" },
  { student_id: "ST12", name: "Arif Mahmud", email: "arif@example.com", password_hash: "demo123", phone: "01700000012", department: "CSE", batch: "34", status: "Active" }
];

const DEFAULT_ADMINS = [
  { admin_id: "AD01", name: "Md. Atik Ishrak", email: ADMIN_EMAIL, password_hash: "admin123", role: "admin", status: "Active" }
];

const admins = DEFAULT_ADMINS;

const DEFAULT_SUPERVISORS = [
  { supervisor_id: 1, name: "Mr. Karim", email: "karim@example.com", password_hash: "sup123", phone: "01711000001", department: "CSE", status: "Active" },
  { supervisor_id: 2, name: "Ms. Sultana", email: "sultana@example.com", password_hash: "sup123", phone: "01711000002", department: "CSE", status: "Active" },
  { supervisor_id: 3, name: "Dr. Nasrin Akter", email: "nasrin@example.com", password_hash: "sup123", phone: "01711000003", department: "CSE", status: "Active" },
  { supervisor_id: 4, name: "Mr. Rafiq Uddin", email: "rafiq@example.com", password_hash: "sup123", phone: "01711000004", department: "CSE", status: "Active" }
];

// Default Database Table: research_pc (pc_id, pc_number, specification, status, location)
const DEFAULT_PCS = [
  { pc_id: "PC01", pc_number: "PC01", specification: "Core i5, 16GB RAM", status: "Available", location: "Research Lab" },
  { pc_id: "PC02", pc_number: "PC02", specification: "Core i7, 16GB RAM", status: "Available", location: "Research Lab" },
  { pc_id: "PC03", pc_number: "PC03", specification: "Core i5, 8GB RAM", status: "Available", location: "Research Lab" },
  { pc_id: "PC04", pc_number: "PC04", specification: "Core i7, 32GB RAM, RTX 3060", status: "Available", location: "Research Lab" },
  { pc_id: "PC05", pc_number: "PC05", specification: "Ryzen 7, 32GB RAM, RTX 4060", status: "Available", location: "Research Lab" },
  { pc_id: "PC06", pc_number: "PC06", specification: "Core i9, 64GB RAM, RTX 4070", status: "Maintenance", location: "Research Lab" }
];

// Default Database Table: time_slot (slot_id, slot_date, start_time, end_time, status)
function buildDefaultSlots() {
  const list = [];
  slotDates.forEach((dateStr, dIdx) => {
    standardSlotTimes.forEach((s) => {
      list.push({
        slot_id: `SLOT_${dIdx + 1}_${s.slot_suffix}`,
        slot_date: dateStr,
        start_time: s.start_time,
        end_time: s.end_time,
        status: "Open"
      });
    });
  });
  return list;
}

const DEFAULT_SLOTS = buildDefaultSlots();

// Default Database Table: research_request (14 requests, relative dates)
const DEFAULT_REQUESTS = [
  {
    request_id: "R01",
    student_id: "ST01",
    supervisor_id: 1,
    project_title: "Flood Prediction",
    purpose: "Train a CNN model on regional rainfall and river-gauge maps to forecast flash floods.",
    required_from: slotDates[1],
    required_to: slotDates[1],
    model_type: "CNN",
    dataset_size: "2GB",
    priority: "High",
    status: "Approved",
    created_at: relativePastDate(10)
  },
  {
    request_id: "R02",
    student_id: "ST02",
    supervisor_id: 1,
    project_title: "Plant Disease Detection",
    purpose: "Fine-tune a ResNet classifier to detect leaf blight across local crop photography.",
    required_from: slotDates[1],
    required_to: slotDates[1],
    model_type: "ResNet",
    dataset_size: "5GB",
    priority: "Medium",
    status: "Pending",
    created_at: relativePastDate(9)
  },
  {
    request_id: "R03",
    student_id: "ST03",
    supervisor_id: 2,
    project_title: "Student Performance Prediction",
    purpose: "Evaluate Random Forest models on anonymized semester records to flag early academic risk.",
    required_from: slotDates[1],
    required_to: slotDates[1],
    model_type: "Random Forest",
    dataset_size: "50MB",
    priority: "Low",
    status: "Approved",
    created_at: relativePastDate(8)
  },
  {
    request_id: "R04",
    student_id: "ST04",
    supervisor_id: 3,
    project_title: "Bangla Sentiment Analysis",
    purpose: "Train a bidirectional LSTM network to classify public sentiment in Bangla news comments.",
    required_from: slotDates[1],
    required_to: slotDates[1],
    model_type: "LSTM",
    dataset_size: "800MB",
    priority: "High",
    status: "Approved",
    created_at: relativePastDate(7)
  },
  {
    request_id: "R05",
    student_id: "ST05",
    supervisor_id: 3,
    project_title: "Traffic Sign Recognition",
    purpose: "Benchmark a CNN detector on urban road sign images captured under low-light conditions.",
    required_from: slotDates[1],
    required_to: slotDates[1],
    model_type: "CNN",
    dataset_size: "3GB",
    priority: "Medium",
    status: "Pending",
    created_at: relativePastDate(6)
  },
  {
    request_id: "R06",
    student_id: "ST06",
    supervisor_id: 2,
    project_title: "Crop Yield Prediction",
    purpose: "Fit XGBoost regression ensembles over multi-district soil and seasonal weather tables.",
    required_from: slotDates[2],
    required_to: slotDates[2],
    model_type: "XGBoost",
    dataset_size: "200MB",
    priority: "Medium",
    status: "Approved",
    created_at: relativePastDate(6)
  },
  {
    request_id: "R07",
    student_id: "ST07",
    supervisor_id: 4,
    project_title: "Fake News Detection",
    purpose: "Fine-tune a BERT transformer classifier to identify fabricated headlines in online articles.",
    required_from: slotDates[2],
    required_to: slotDates[2],
    model_type: "BERT",
    dataset_size: "1.5GB",
    priority: "High",
    status: "Pending",
    created_at: relativePastDate(5)
  },
  {
    request_id: "R08",
    student_id: "ST08",
    supervisor_id: 1,
    project_title: "Face Mask Detection",
    purpose: "Run YOLO object detection experiments on crowded campus entrance video frames.",
    required_from: slotDates[4],
    required_to: slotDates[4],
    model_type: "YOLO",
    dataset_size: "4GB",
    priority: "Low",
    status: "Rejected",
    created_at: relativePastDate(5)
  },
  {
    request_id: "R09",
    student_id: "ST09",
    supervisor_id: 2,
    project_title: "Heart Disease Prediction",
    purpose: "Compare regularized Logistic Regression baselines for clinical cardiovascular risk screening.",
    required_from: slotDates[2],
    required_to: slotDates[2],
    model_type: "Logistic Regression",
    dataset_size: "20MB",
    priority: "Low",
    status: "Approved",
    created_at: relativePastDate(4)
  },
  {
    request_id: "R10",
    student_id: "ST10",
    supervisor_id: 4,
    project_title: "Handwritten Digit Recognition",
    purpose: "Test custom CNN kernels on noisy scanned exam sheet digit crops.",
    required_from: slotDates[5],
    required_to: slotDates[5],
    model_type: "CNN",
    dataset_size: "500MB",
    priority: "Low",
    status: "Rejected",
    created_at: relativePastDate(4)
  },
  {
    request_id: "R11",
    student_id: "ST11",
    supervisor_id: 3,
    project_title: "Air Quality Forecasting",
    purpose: "Predict next-day PM2.5 concentrations with multivariate LSTM time-series sequences.",
    required_from: slotDates[4],
    required_to: slotDates[4],
    model_type: "LSTM",
    dataset_size: "300MB",
    priority: "Medium",
    status: "Pending",
    created_at: relativePastDate(3)
  },
  {
    request_id: "R12",
    student_id: "ST12",
    supervisor_id: 3,
    project_title: "Bangla OCR",
    purpose: "Train a vision-language Transformer pipeline to transcribe historical printed Bangla pages.",
    required_from: slotDates[3],
    required_to: slotDates[3],
    model_type: "Transformer",
    dataset_size: "6GB",
    priority: "High",
    status: "Approved",
    created_at: relativePastDate(2)
  },
  {
    request_id: "R13",
    student_id: "ST01",
    supervisor_id: 4,
    project_title: "Network Intrusion Detection",
    purpose: "Evaluate Random Forest ensembles on packet flow logs to detect anomalous traffic.",
    required_from: slotDates[0],
    required_to: slotDates[0],
    model_type: "Random Forest",
    dataset_size: "1GB",
    priority: "Medium",
    status: "Pending",
    created_at: relativePastDate(1)
  },
  {
    request_id: "R14",
    student_id: "ST03",
    supervisor_id: 2,
    project_title: "Rainfall Prediction",
    purpose: "Fit seasonal ARIMA models over thirty-year meteorological station precipitation records.",
    required_from: slotDates[3],
    required_to: slotDates[3],
    model_type: "ARIMA",
    dataset_size: "100MB",
    priority: "Low",
    status: "Approved",
    created_at: relativePastDate(1)
  }
];

// Default Database Table: emergency_request (4 records)
const DEFAULT_EMERGENCY = [
  {
    emergency_id: "E01",
    request_id: "R05",
    reason: "Final CNN model run required ahead of thesis mid-term evaluation.",
    required_date: slotDates[1],
    required_time: "11:00",
    status: "Pending",
    created_at: `${relativePastDate(2)} 10:15:00`
  },
  {
    emergency_id: "E02",
    request_id: "R07",
    reason: "BERT fine-tuning deadline for faculty research seminar presentation.",
    required_date: slotDates[2],
    required_time: "09:00",
    status: "Pending",
    created_at: `${relativePastDate(1)} 14:20:00`
  },
  {
    emergency_id: "E03",
    request_id: "R12",
    reason: "Urgent Bangla OCR checkpoint verification before thesis defence preparation.",
    required_date: slotDates[3],
    required_time: "09:00",
    status: "Approved",
    created_at: `${relativePastDate(2)} 09:05:00`
  },
  {
    emergency_id: "E04",
    request_id: "R01",
    reason: "Extra afternoon calibration run requested outside standard queue.",
    required_date: slotDates[0],
    required_time: "14:00",
    status: "Rejected",
    created_at: `${relativePastDate(3)} 16:40:00`
  }
];

// Default Database Table: allocation (Confirmed allocations ONLY for Approved requests)
const DEFAULT_ALLOCATIONS = [
  { allocation_id: "AL01", request_id: "R01", pc_id: "PC01", slot_id: "SLOT_2_1", allocated_by: "AD01", allocated_at: `${relativePastDate(4)} 09:10:00`, status: "Confirmed" },
  { allocation_id: "AL02", request_id: "R03", pc_id: "PC02", slot_id: "SLOT_2_2", allocated_by: "AD01", allocated_at: `${relativePastDate(4)} 09:15:00`, status: "Confirmed" },
  { allocation_id: "AL03", request_id: "R04", pc_id: "PC04", slot_id: "SLOT_2_1", allocated_by: "AD01", allocated_at: `${relativePastDate(3)} 10:00:00`, status: "Confirmed" },
  { allocation_id: "AL04", request_id: "R06", pc_id: "PC03", slot_id: "SLOT_3_3", allocated_by: "AD01", allocated_at: `${relativePastDate(3)} 10:25:00`, status: "Confirmed" },
  { allocation_id: "AL05", request_id: "R09", pc_id: "PC01", slot_id: "SLOT_3_2", allocated_by: "AD01", allocated_at: `${relativePastDate(2)} 11:05:00`, status: "Confirmed" },
  { allocation_id: "AL06", request_id: "R12", pc_id: "PC05", slot_id: "SLOT_4_1", allocated_by: "AD01", allocated_at: `${relativePastDate(1)} 13:45:00`, status: "Confirmed" },
  { allocation_id: "AL07", request_id: "R14", pc_id: "PC02", slot_id: "SLOT_4_3", allocated_by: "AD01", allocated_at: `${relativePastDate(1)} 14:00:00`, status: "Confirmed" }
];

// Pending requests mapped to requested date slots so they show as yellow Pending cells on their requested date
const DEFAULT_PENDING_TARGETS = {
  R02: { pc_id: "PC02", slot_id: "SLOT_2_3" },
  R05: { pc_id: "PC05", slot_id: "SLOT_2_2" },
  R07: { pc_id: "PC04", slot_id: "SLOT_3_1" },
  R11: { pc_id: "PC03", slot_id: "SLOT_5_2" },
  R13: { pc_id: "PC04", slot_id: "SLOT_1_2" }
};

// Default Database Table: notifications (rp_notifications) - newest first
const DEFAULT_NOTIFICATIONS = [
  {
    notification_id: "N01",
    target_role: "student",
    target_id: "ST01",
    title: "Request R13 submitted for review",
    meta: `Network Intrusion Detection · Submitted ${relativePastDate(1)} · Pending admin approval`,
    created_at: `${relativePastDate(1)} 10:30:00`,
    read: false
  },
  {
    notification_id: "N02",
    target_role: "student",
    target_id: "ST01",
    title: "Emergency request E04 was rejected",
    meta: `Flood Prediction extra slot (${slotDates[0]}, 14:00) was not approved`,
    created_at: `${relativePastDate(2)} 15:10:00`,
    read: false
  },
  {
    notification_id: "N03",
    target_role: "student",
    target_id: "ST01",
    title: "Your request R01 was approved",
    meta: `Assigned PC01 on ${slotDates[1]} (09:00 - 11:00)`,
    created_at: `${relativePastDate(4)} 09:12:00`,
    read: false
  },
  {
    notification_id: "N04",
    target_role: "student",
    target_id: "ST01",
    title: "Upcoming lab session reminder",
    meta: `PC01 · Flood Prediction scheduled for ${slotDates[1]} at 09:00 - 11:00`,
    created_at: `${relativePastDate(5)} 08:30:00`,
    read: true
  },
  {
    notification_id: "N05",
    target_role: "admin",
    target_id: "AD01",
    title: "New request R13 from ST01",
    meta: `Network Intrusion Detection (Random Forest, 1GB) requested for ${slotDates[0]}`,
    created_at: `${relativePastDate(1)} 10:30:00`,
    read: false
  },
  {
    notification_id: "N06",
    target_role: "admin",
    target_id: "AD01",
    title: "Emergency request E02 awaits review",
    meta: `Fake News Detection (R07) flagged for ${slotDates[2]} at 09:00`,
    created_at: `${relativePastDate(1)} 14:22:00`,
    read: false
  },
  {
    notification_id: "N07",
    target_role: "admin",
    target_id: "AD01",
    title: "New request R05 from ST05",
    meta: `Traffic Sign Recognition (CNN, 3GB) endorsed by Dr. Nasrin Akter`,
    created_at: `${relativePastDate(2)} 11:15:00`,
    read: false
  }
];

// Default Database Table: system activity logs (rp_logs)
const DEFAULT_LOGS = [
  {
    log_id: "LOG01",
    timestamp: `${relativePastDate(5)} 09:15:00`,
    action_type: "Request Submitted",
    category: "request",
    actor_id: "ST01",
    actor_name: "Arpita Das",
    actor_role: "student",
    target_id: "R01",
    description: 'Submitted research request R01 ("Flood Prediction", High priority).'
  },
  {
    log_id: "LOG02",
    timestamp: `${relativePastDate(4)} 09:10:00`,
    action_type: "Request Approved",
    category: "request",
    actor_id: "AD01",
    actor_name: "Md. Atik Ishrak",
    actor_role: "admin",
    target_id: "R01",
    description: `Approved request R01 and allocated PC01 for ${slotDates[1]} (09:00 - 11:00).`
  },
  {
    log_id: "LOG03",
    timestamp: `${relativePastDate(3)} 10:00:00`,
    action_type: "Request Approved",
    category: "request",
    actor_id: "AD01",
    actor_name: "Md. Atik Ishrak",
    actor_role: "admin",
    target_id: "R04",
    description: `Approved request R04 ("Bangla Sentiment Analysis") and allocated PC04 on ${slotDates[1]}.`
  },
  {
    log_id: "LOG04",
    timestamp: `${relativePastDate(2)} 11:05:00`,
    action_type: "Request Approved",
    category: "request",
    actor_id: "AD01",
    actor_name: "Md. Atik Ishrak",
    actor_role: "admin",
    target_id: "R09",
    description: `Approved request R09 ("Heart Disease Prediction") and allocated PC01 on ${slotDates[2]}.`
  },
  {
    log_id: "LOG05",
    timestamp: `${relativePastDate(1)} 13:45:00`,
    action_type: "Request Approved",
    category: "request",
    actor_id: "AD01",
    actor_name: "Md. Atik Ishrak",
    actor_role: "admin",
    target_id: "R12",
    description: `Approved request R12 ("Bangla OCR") and allocated PC05 on ${slotDates[3]}.`
  }
];

// Default mock data schemas mapped by localStorage key
const DEFAULT_DATA_SCHEMAS = {
  [STORAGE_KEYS.REQUESTS]: DEFAULT_REQUESTS,
  [STORAGE_KEYS.EMERGENCY]: DEFAULT_EMERGENCY,
  [STORAGE_KEYS.ALLOCATIONS]: DEFAULT_ALLOCATIONS,
  [STORAGE_KEYS.PCS]: DEFAULT_PCS,
  [STORAGE_KEYS.SLOTS]: DEFAULT_SLOTS,
  [STORAGE_KEYS.STUDENTS]: DEFAULT_STUDENTS,
  [STORAGE_KEYS.SUPERVISORS]: DEFAULT_SUPERVISORS,
  [STORAGE_KEYS.ADMINS]: DEFAULT_ADMINS,
  [STORAGE_KEYS.NOTIFICATIONS]: DEFAULT_NOTIFICATIONS,
  [STORAGE_KEYS.LOGS]: DEFAULT_LOGS,
  [STORAGE_KEYS.SESSION]: null
};

const MOCK_ALLOCATION_OWNERS = {};

function isAllocationConfirmed(alloc) {
  return Boolean(alloc && (alloc.status === "Confirmed" || alloc.status === "Active"));
}

/**
 * Shared storage helper: reads parsed JSON data from localStorage,
 * falling back to defaultData (or the schema default for that key).
 */
function getData(key, defaultData) {
  const fallback =
    defaultData !== undefined
      ? defaultData
      : (key in DEFAULT_DATA_SCHEMAS
          ? DEFAULT_DATA_SCHEMAS[key]
          : (key === STORAGE_KEYS.SESSION ? null : []));

  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Shared storage helper: saves JSON value into localStorage.
 */
function saveData(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch (e) {
    console.error("Storage save error:", e);
    return false;
  }
}

/**
 * Helper to check whether a localStorage table key is missing or empty ([] / "").
 */
function isStorageTableEmpty(key) {
  const raw = localStorage.getItem(key);
  if (raw === null || raw.trim() === "") return true;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length === 0;
  } catch (e) {
    return true;
  }
}

/**
 * Initializes shared localStorage tables with mock data schemas.
 * If rp_data_version is missing or does not match DATA_VERSION, runs resetDemoData() once
 * (keeping rp_session and any students created via Register).
 * Replace these functions with fetch() calls to the Flask API when the backend is ready.
 */
let _sharedDataInitialized = false;
function initSharedData() {
  if (_sharedDataInitialized) return;
  _sharedDataInitialized = true;

  if (typeof DEMO_MODE === "undefined" || !DEMO_MODE) return;

  try {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
    if (storedVersion !== String(DATA_VERSION)) {
      resetDemoData({ keepRegisteredStudents: true, silent: true });
      return;
    }

    if (isStorageTableEmpty(STORAGE_KEYS.REQUESTS)) {
      saveData(STORAGE_KEYS.REQUESTS, DEFAULT_REQUESTS);
    }
    if (isStorageTableEmpty(STORAGE_KEYS.EMERGENCY)) {
      saveData(STORAGE_KEYS.EMERGENCY, DEFAULT_EMERGENCY);
    }
    if (isStorageTableEmpty(STORAGE_KEYS.ALLOCATIONS)) {
      saveData(STORAGE_KEYS.ALLOCATIONS, DEFAULT_ALLOCATIONS);
    }
    if (isStorageTableEmpty(STORAGE_KEYS.PCS)) {
      saveData(STORAGE_KEYS.PCS, DEFAULT_PCS);
    }
    if (isStorageTableEmpty(STORAGE_KEYS.SLOTS)) {
      saveData(STORAGE_KEYS.SLOTS, DEFAULT_SLOTS);
    }
    if (isStorageTableEmpty(STORAGE_KEYS.NOTIFICATIONS)) {
      saveData(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    }
    if (isStorageTableEmpty(STORAGE_KEYS.LOGS)) {
      saveData(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
    }
    if (isStorageTableEmpty(STORAGE_KEYS.ADMINS)) {
      saveData(STORAGE_KEYS.ADMINS, DEFAULT_ADMINS);
    }
    if (isStorageTableEmpty(STORAGE_KEYS.SUPERVISORS)) {
      saveData(STORAGE_KEYS.SUPERVISORS, DEFAULT_SUPERVISORS);
    }
    if (isStorageTableEmpty(STORAGE_KEYS.STUDENTS)) {
      saveData(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    }

    // Ensure rp_session key exists (null = logged out) if not already set
    const rawSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (rawSession === null || rawSession.trim() === "") {
      localStorage.setItem(STORAGE_KEYS.SESSION, "null");
    }
  } catch (e) {
    console.error("Shared data initialization error:", e);
  }
}

/**
 * Clears all rp_ shared data keys (except rp_session) and re-seeds full sample data,
 * merging back any students created via the Register page, then saves DATA_VERSION.
 */
function resetDemoData(options) {
  const opts = options || {};
  const keepRegisteredStudents = opts.keepRegisteredStudents !== false;
  const silent = Boolean(opts.silent);

  try {
    // Preserve custom registered students (students whose ID is not in DEFAULT_STUDENTS)
    let customStudents = [];
    if (keepRegisteredStudents) {
      let existingStudents = [];
      try {
        existingStudents = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
      } catch (e) {
        existingStudents = [];
      }
      if (Array.isArray(existingStudents)) {
        const defaultIdSet = new Set(
          DEFAULT_STUDENTS.map((s) => String(s.student_id || "").trim().replace(/\s+/g, "").toUpperCase())
        );
        const seenCustom = new Set();
        customStudents = existingStudents.filter((s) => {
          if (!s || !s.student_id) return false;
          const norm = String(s.student_id).trim().replace(/\s+/g, "").toUpperCase();
          if (!norm || defaultIdSet.has(norm) || seenCustom.has(norm)) return false;
          seenCustom.add(norm);
          return true;
        });
      }
    }

    // Remove all rp_ data keys except rp_session (and UI theme rp_theme)
    const keysToRemove = new Set([
      STORAGE_KEYS.STUDENTS,
      STORAGE_KEYS.SUPERVISORS,
      STORAGE_KEYS.ADMINS,
      STORAGE_KEYS.REQUESTS,
      STORAGE_KEYS.EMERGENCY,
      STORAGE_KEYS.PCS,
      STORAGE_KEYS.SLOTS,
      STORAGE_KEYS.ALLOCATIONS,
      STORAGE_KEYS.NOTIFICATIONS,
      STORAGE_KEYS.LOGS,
      STORAGE_KEYS.DATA_VERSION,
      "rp_student_pwd_overrides",
      "rp_supervisor_pwd_overrides",
      "rp_admin_pwd_override",
      "rp_notif_read"
    ]);
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("rp_") && k !== STORAGE_KEYS.SESSION && k !== "rp_theme") {
          keysToRemove.add(k);
        }
      }
    } catch (scanErr) {
      // Fallback to explicit list above if localStorage.key() is unavailable
    }

    keysToRemove.forEach((k) => {
      localStorage.removeItem(k);
    });

    // Seed all sample tables cleanly
    saveData(STORAGE_KEYS.REQUESTS, DEFAULT_REQUESTS);
    saveData(STORAGE_KEYS.EMERGENCY, DEFAULT_EMERGENCY);
    saveData(STORAGE_KEYS.ALLOCATIONS, DEFAULT_ALLOCATIONS);
    saveData(STORAGE_KEYS.PCS, DEFAULT_PCS);
    saveData(STORAGE_KEYS.SLOTS, DEFAULT_SLOTS);
    saveData(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    saveData(STORAGE_KEYS.LOGS, DEFAULT_LOGS);
    saveData(STORAGE_KEYS.ADMINS, DEFAULT_ADMINS);
    saveData(STORAGE_KEYS.SUPERVISORS, DEFAULT_SUPERVISORS);
    saveData(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS.concat(customStudents));

    const rawSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (rawSession === null || rawSession.trim() === "") {
      localStorage.setItem(STORAGE_KEYS.SESSION, "null");
    }

    localStorage.setItem(STORAGE_KEYS.DATA_VERSION, String(DATA_VERSION));
    _sharedDataInitialized = true;

    if (!silent) {
      if (typeof refreshCurrentPortalView === "function") {
        refreshCurrentPortalView();
      }
      const adminSess = typeof getSession === "function" ? getSession() : null;
      if (adminSess && adminSess.role === "admin" && typeof initSlotAvailability === "function" && document.getElementById("slot-availability-card")) {
        initSlotAvailability("admin", adminSess.id);
      }
      if (typeof renderAdminNotifications === "function") {
        renderAdminNotifications();
      }
      if (typeof showToast === "function") {
        showToast("Sample demo data has been reset.", "success");
      }
    }
  } catch (e) {
    console.error("Reset demo data error:", e);
  }
  return false;
}
window.resetDemoData = resetDemoData;

/**
 * Generates the next sequential ID matching the project's existing ID style
 * (e.g. R15, E05, AL08, PC07, ST13, LOG06).
 */
function nextId(key, prefix, idField) {
  const defaultsMap = {
    [STORAGE_KEYS.REQUESTS]: { prefix: "R", field: "request_id" },
    [STORAGE_KEYS.EMERGENCY]: { prefix: "E", field: "emergency_id" },
    [STORAGE_KEYS.ALLOCATIONS]: { prefix: "AL", field: "allocation_id" },
    [STORAGE_KEYS.PCS]: { prefix: "PC", field: "pc_id" },
    [STORAGE_KEYS.SLOTS]: { prefix: "SLOT_", field: "slot_id" },
    [STORAGE_KEYS.STUDENTS]: { prefix: "ST", field: "student_id" },
    [STORAGE_KEYS.SUPERVISORS]: { prefix: "SUP", field: "supervisor_id" },
    [STORAGE_KEYS.NOTIFICATIONS]: { prefix: "N", field: "notification_id" },
    [STORAGE_KEYS.LOGS]: { prefix: "LOG", field: "log_id" }
  };
  const cfg = defaultsMap[key] || { prefix: "ID", field: "id" };
  const usePrefix = prefix || cfg.prefix;
  const useField = idField || cfg.field;

  const items = getData(key, []);
  let maxNum = 0;
  const escaped = usePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escaped}_?(\\d+)$`, "i");

  if (Array.isArray(items)) {
    items.forEach((item) => {
      if (!item || !item[useField]) return;
      const val = String(item[useField]).trim();
      const match = val.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
  }

  const nextNum = maxNum + 1;
  return `${usePrefix}${String(nextNum).padStart(2, "0")}`;
}

function formatNowTimestamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/**
 * Appends a system activity log entry into shared localStorage key "rp_logs".
 */
function addActivityLog(entry) {
  if (!entry) return null;
  const logs = getData(STORAGE_KEYS.LOGS, []);
  const session = typeof getSession === "function" ? getSession() : null;
  const actorId = entry.actor_id || (session && session.id) || "SYSTEM";
  let actorRole = entry.actor_role || (session && session.role) || "system";
  let actorName = entry.actor_name || "";

  if (!actorName && actorId) {
    if (actorRole === "admin" || String(actorId).toUpperCase().startsWith("AD")) {
      const adm = getAdmins().find((a) => a.admin_id === actorId);
      if (adm) {
        actorName = adm.name;
        actorRole = "admin";
      }
    } else if (actorRole === "supervisor" && typeof getAllSupervisors === "function") {
      const sup = getAllSupervisors().find((s) => String(s.supervisor_id) === String(actorId));
      if (sup) {
        actorName = sup.name;
        actorRole = "supervisor";
      }
    } else if (typeof findStudent === "function") {
      const stu = findStudent(actorId);
      if (stu) {
        actorName = stu.name;
        actorRole = "student";
      }
    }
  }

  const record = {
    log_id: nextId(STORAGE_KEYS.LOGS, "LOG", "log_id"),
    timestamp: entry.timestamp || formatNowTimestamp(),
    action_type: entry.action_type || "System Activity",
    category: entry.category || "system",
    actor_id: actorId,
    actor_name: actorName || actorId,
    actor_role: actorRole,
    target_id: entry.target_id || "-",
    description: entry.description || ""
  };

  logs.push(record);
  saveData(STORAGE_KEYS.LOGS, logs);
  if (typeof renderAdminLogsTable === "function") {
    renderAdminLogsTable();
  }
  return record;
}

// Initialize shared localStorage data immediately when script loads
initSharedData();

/**
 * Checks slot availability for a specific PC and time slot using shared localStorage data.
 * Returns: { status: 'Available'|'Booked'|'Pending'|'Maintenance', student_id, student_name, allocation, request }
 * NOTE: Replace this mock implementation with a database query (e.g. SELECT FROM allocation) when Flask is connected.
 */
function isSlotAvailable(pc_id, slot_id) {
  const pcs = getData(STORAGE_KEYS.PCS);
  const pcObj = pcs.find((p) => p && p.pc_id === pc_id);
  if (pcObj && String(pcObj.status || "").trim() === "Maintenance") {
    return {
      status: "Maintenance",
      student_id: null,
      student_name: null,
      allocation: null,
      request: null
    };
  }

  const allocations = getData(STORAGE_KEYS.ALLOCATIONS);
  const requests = getData(STORAGE_KEYS.REQUESTS);

  // 1. Check Confirmed / Active allocations
  const alloc = allocations.find(
    (a) => a.pc_id === pc_id && a.slot_id === slot_id && isAllocationConfirmed(a)
  );
  if (alloc) {
    let studentId = alloc.student_id || null;
    let studentName = alloc.student_name || null;

    if (!studentId && alloc.request_id) {
      const r = requests.find((req) => req.request_id === alloc.request_id);
      if (r) {
        studentId = r.student_id;
      } else if (MOCK_ALLOCATION_OWNERS[alloc.request_id]) {
        studentId = MOCK_ALLOCATION_OWNERS[alloc.request_id];
      }
    }

    if (studentId && !studentName) {
      const s = findStudent(studentId);
      if (s) studentName = s.name;
    }

    return {
      status: "Booked",
      student_id: studentId || "ST01",
      student_name: studentName || "Reserved",
      allocation: alloc,
      request: null
    };
  }

  // 2. Check pending requests
  const pendingReq = requests.find((r) => {
    if (r.status !== "Pending") return false;
    if (r.pc_id && r.slot_id) {
      return r.pc_id === pc_id && r.slot_id === slot_id;
    }
    const target = DEFAULT_PENDING_TARGETS[r.request_id];
    if (target) {
      return target.pc_id === pc_id && target.slot_id === slot_id;
    }
    return false;
  });

  if (pendingReq) {
    const s = findStudent(pendingReq.student_id);
    return {
      status: "Pending",
      student_id: pendingReq.student_id,
      student_name: s ? s.name : "Student",
      allocation: null,
      request: pendingReq
    };
  }

  // 3. Slot is free
  return {
    status: "Available",
    student_id: null,
    student_name: null,
    allocation: null,
    request: null
  };
}


/* ==========================================================================
   STORAGE & STUDENT LOOKUP HELPERS
   ========================================================================== */

/**
 * Normalizes Student ID: trims, removes all whitespace, and converts to uppercase.
 * Example: "  cse  033 08432 " -> "CSE03308432"
 */
function normalizeStudentId(id) {
  if (!id) return "";
  return id.toString().trim().replace(/\s+/g, "").toUpperCase();
}

/**
 * Reads students array from shared localStorage key "rp_students"
 */
function getRegisteredStudents() {
  return getData(STORAGE_KEYS.STUDENTS);
}

function getStudentPasswordOverrides() {
  try {
    const raw = localStorage.getItem("rp_student_pwd_overrides");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveStudentPasswordOverride(studentId, newPassword) {
  try {
    const overrides = getStudentPasswordOverrides();
    overrides[normalizeStudentId(studentId)] = newPassword;
    localStorage.setItem("rp_student_pwd_overrides", JSON.stringify(overrides));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

function getAdmins() {
  const list = getData(STORAGE_KEYS.ADMINS, DEFAULT_ADMINS);
  const baseList = (!Array.isArray(list) || list.length === 0) ? DEFAULT_ADMINS : list;
  let rawOverride = null;
  try {
    rawOverride = localStorage.getItem("rp_admin_pwd_override");
  } catch (e) {}
  return baseList.map((a) => {
    const def = DEFAULT_ADMINS.find((d) => String(d.admin_id) === String(a.admin_id)) || {};
    const merged = {
      ...def,
      ...a,
      role: a.role || def.role || "admin",
      status: a.status || def.status || "Active"
    };
    if (rawOverride) {
      merged.password_hash = rawOverride;
    }
    return merged;
  });
}

function saveAdminPasswordOverride(newPassword) {
  try {
    localStorage.setItem("rp_admin_pwd_override", newPassword);
    const storedAdmins = getData(STORAGE_KEYS.ADMINS, DEFAULT_ADMINS);
    if (Array.isArray(storedAdmins)) {
      const updated = storedAdmins.map((a) => ({ ...a, password_hash: newPassword }));
      saveData(STORAGE_KEYS.ADMINS, updated);
    }
  } catch (e) {
    console.error("Storage error:", e);
  }
}

/**
 * Reads all students from shared localStorage "rp_students", applying any password overrides
 */
function getAllStudents() {
  const overrides = getStudentPasswordOverrides();
  const list = getData(STORAGE_KEYS.STUDENTS);
  return list.map((s) => {
    const norm = normalizeStudentId(s.student_id);
    if (overrides[norm]) {
      return { ...s, password_hash: overrides[norm] };
    }
    return s;
  });
}

/**
 * Finds student by matching normalized ID
 */
function findStudent(id) {
  const target = normalizeStudentId(id);
  return getAllStudents().find((s) => normalizeStudentId(s.student_id) === target);
}

function getSupervisorPasswordOverrides() {
  try {
    const raw = localStorage.getItem("rp_supervisor_pwd_overrides");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveSupervisorPasswordOverride(supervisorId, newPassword) {
  try {
    const overrides = getSupervisorPasswordOverrides();
    overrides[String(supervisorId)] = newPassword;
    localStorage.setItem("rp_supervisor_pwd_overrides", JSON.stringify(overrides));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

/**
 * Reads all supervisors from shared localStorage "rp_supervisors", merging default fields and password overrides
 */
function getAllSupervisors() {
  const overrides = getSupervisorPasswordOverrides();
  const list = getData(STORAGE_KEYS.SUPERVISORS, DEFAULT_SUPERVISORS);
  const baseList = (!Array.isArray(list) || list.length === 0) ? DEFAULT_SUPERVISORS : list;
  return baseList.map((s) => {
    const def = DEFAULT_SUPERVISORS.find((d) => String(d.supervisor_id) === String(s.supervisor_id)) || {};
    const merged = {
      ...def,
      ...s,
      status: s.status || def.status || "Active"
    };
    const ov = overrides[String(merged.supervisor_id)];
    if (ov) {
      merged.password_hash = ov;
    }
    return merged;
  });
}


/* ==========================================================================
   SESSION MANAGEMENT ("rp_session")
   ========================================================================== */

/**
 * Reads active session from shared localStorage key "rp_session"
 */
function getSession() {
  const parsed = getData(STORAGE_KEYS.SESSION);
  if (
    parsed &&
    typeof parsed === "object" &&
    parsed.role &&
    parsed.id !== undefined &&
    parsed.id !== null &&
    parsed.id !== ""
  ) {
    return parsed;
  }
  return null;
}

/**
 * Saves active session into shared localStorage key "rp_session"
 */
function setSession(role, id) {
  saveData(STORAGE_KEYS.SESSION, { role: role, id: id });
}

/**
 * Clears active session from localStorage
 */
function clearSession() {
  saveData(STORAGE_KEYS.SESSION, null);
}

/**
 * Validates that a supervisor session references an existing record in rp_supervisors.
 */
function isValidSupervisorSession(session) {
  if (!session || session.role !== "supervisor") return false;
  const storedSupervisors = getData(STORAGE_KEYS.SUPERVISORS, []);
  if (!Array.isArray(storedSupervisors) || storedSupervisors.length === 0) return false;
  return storedSupervisors.some(
    (s) =>
      s &&
      s.supervisor_id !== null &&
      s.supervisor_id !== undefined &&
      s.supervisor_id !== "" &&
      String(s.supervisor_id) === String(session.id)
  );
}


/* ==========================================================================
   FORM VALIDATION & INPUT SHAKE FEEDBACK
   ========================================================================== */

const FormValidator = {
  getOrCreateErrorElement(inputElement) {
    if (!inputElement) return null;
    let errSpan = document.getElementById(`err-${inputElement.id}`);
    if (!errSpan && inputElement.parentElement) {
      errSpan = inputElement.parentElement.querySelector(".field-error");
    }
    if (!errSpan && inputElement.parentElement) {
      errSpan = document.createElement("span");
      errSpan.id = `err-${inputElement.id}`;
      errSpan.className = "field-error";
      inputElement.insertAdjacentElement("afterend", errSpan);
    }
    return errSpan;
  },

  showError(inputElement, message) {
    if (!inputElement) return;
    // Shake animation trigger
    inputElement.classList.remove("input-shake");
    void inputElement.offsetWidth; // Force reflow to re-trigger animation
    inputElement.classList.add("input-error", "input-shake");

    const errSpan = this.getOrCreateErrorElement(inputElement);
    if (errSpan) {
      errSpan.textContent = message;
      errSpan.classList.add("visible");
    }
  },

  clearError(inputElement) {
    if (!inputElement) return;
    inputElement.classList.remove("input-error", "input-shake");
    const errSpan = this.getOrCreateErrorElement(inputElement);
    if (errSpan) {
      errSpan.textContent = "";
      errSpan.classList.remove("visible");
    }
  },

  clearAll(inputElements) {
    if (!Array.isArray(inputElements)) return;
    inputElements.forEach((el) => {
      if (el) this.clearError(el);
    });
  }
};


/* ==========================================================================
/* ==========================================================================
   C. PRESET ACCOUNT FILLERS & STUDENT LOGIN
   ========================================================================== */

function fillStudentPreset(studentId, password) {
  const idInput = document.getElementById("student_id");
  const passwordInput = document.getElementById("password_hash");
  const errorAlert = document.getElementById("login-error-alert");

  if (idInput) {
    idInput.value = studentId || "";
    FormValidator.clearError(idInput);
  }
  if (passwordInput) {
    passwordInput.value = password || "";
    FormValidator.clearError(passwordInput);
  }
  if (errorAlert) {
    errorAlert.textContent = "";
    errorAlert.classList.remove("alert-visible");
  }
}

function fillAdminPreset(email, password) {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password_hash");
  const errorAlert = document.getElementById("login-error-alert");

  if (emailInput) {
    emailInput.value = email || "";
    FormValidator.clearError(emailInput);
  }
  if (passwordInput) {
    passwordInput.value = password || "";
    FormValidator.clearError(passwordInput);
  }
  if (errorAlert) {
    errorAlert.textContent = "";
    errorAlert.classList.remove("alert-visible");
  }
}

function fillSupervisorPreset(email, password) {
  fillAdminPreset(email, password);
}

function handleStudentLogin(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  const idInput = document.getElementById("student_id");
  const passwordInput = document.getElementById("password_hash");
  const errorAlert = document.getElementById("login-error-alert");

  if (errorAlert) {
    errorAlert.textContent = "";
    errorAlert.classList.remove("alert-visible");
  }

  if (!idInput || !passwordInput) return false;

  // Trim the typed Student ID; compare password as exact match
  const typedId = (idInput.value || "").trim();
  const typedPassword = passwordInput.value || "";

  FormValidator.clearError(idInput);
  FormValidator.clearError(passwordInput);

  if (!typedId || !typedPassword) {
    if (!typedId) FormValidator.showError(idInput, "Student ID is required.");
    if (!typedPassword) FormValidator.showError(passwordInput, "Password is required.");
    return false;
  }

  // Compare Student ID after removing all spaces and converting to uppercase on BOTH sides
  const normalizedTypedId = normalizeStudentId(typedId);
  const allStudents = getAllStudents();

  // Search BOTH the students array and localStorage "rp_students"
  const matchedStudent = allStudents.find((s) => {
    if (!s || !s.student_id) return false;
    const normalizedStoredId = normalizeStudentId(s.student_id);
    return normalizedStoredId === normalizedTypedId && s.password_hash === typedPassword;
  });

  if (matchedStudent) {
    const accountStatus = String(matchedStudent.status || "Active").toLowerCase();
    if (accountStatus === "inactive" || accountStatus === "deactivated") {
      if (errorAlert) {
        errorAlert.textContent = "Your account is deactivated.";
        errorAlert.classList.add("alert-visible");
      }
      [idInput, passwordInput].forEach((el) => {
        if (el) {
          el.classList.remove("input-shake");
          void el.offsetWidth;
          el.classList.add("input-error", "input-shake");
        }
      });
      return false;
    }

    // Save session: {role:"student", id: student_id} and go to student-dashboard.html
    setSession("student", matchedStudent.student_id);
    window.location.href = "student-dashboard.html";
    return false;
  } else {
    // Show "Invalid Student ID or password." in red message box. No alert(), no redirect.
    if (errorAlert) {
      errorAlert.textContent = "Invalid Student ID or password.";
      errorAlert.classList.add("alert-visible");
    }
    // Subtle shake on invalid input
    [idInput, passwordInput].forEach((el) => {
      if (el) {
        el.classList.remove("input-shake");
        void el.offsetWidth;
        el.classList.add("input-error", "input-shake");
      }
    });
    return false;
  }
}


/* ==========================================================================
   D. REGISTRATION
   ========================================================================== */

function handleStudentRegister(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  const studentIdInput = document.getElementById("student_id");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const departmentInput = document.getElementById("department");
  const batchInput = document.getElementById("batch");
  const passwordInput = document.getElementById("password_hash");
  const confirmPasswordInput = document.getElementById("confirm_password");

  const successAlert = document.getElementById("register-success-alert");
  const submitBtn = document.getElementById("register-submit-btn");

  if (!studentIdInput || !nameInput || !emailInput || !phoneInput || !departmentInput || !batchInput || !passwordInput || !confirmPasswordInput) {
    return false;
  }

  const allInputs = [
    studentIdInput,
    nameInput,
    emailInput,
    phoneInput,
    departmentInput,
    batchInput,
    passwordInput,
    confirmPasswordInput
  ];
  FormValidator.clearAll(allInputs);

  const student_id = (studentIdInput.value || "").trim();
  const name = (nameInput.value || "").trim();
  const email = (emailInput.value || "").trim();
  const phone = (phoneInput.value || "").trim();
  const department = (departmentInput.value || "").trim();
  const batch = (batchInput.value || "").trim();
  const password_hash = (passwordInput.value || "").trim();
  const confirmPassword = (confirmPasswordInput.value || "").trim();

  let isValid = true;

  if (!student_id) {
    FormValidator.showError(studentIdInput, "Student ID is required.");
    isValid = false;
  }
  if (!name) {
    FormValidator.showError(nameInput, "Full Name is required.");
    isValid = false;
  }
  if (!email) {
    FormValidator.showError(emailInput, "University Email is required.");
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    FormValidator.showError(emailInput, "Please enter a valid university email address.");
    isValid = false;
  }
  if (!phone) {
    FormValidator.showError(phoneInput, "Phone number is required.");
    isValid = false;
  }
  if (!department) {
    FormValidator.showError(departmentInput, "Department is required.");
    isValid = false;
  }
  if (!batch) {
    FormValidator.showError(batchInput, "Batch / Year is required.");
    isValid = false;
  }
  if (!password_hash) {
    FormValidator.showError(passwordInput, "Password is required.");
    isValid = false;
  }
  if (!confirmPassword) {
    FormValidator.showError(confirmPasswordInput, "Please confirm your password.");
    isValid = false;
  } else if (password_hash && confirmPassword && password_hash !== confirmPassword) {
    FormValidator.showError(confirmPasswordInput, "Passwords do not match.");
    isValid = false;
  }

  if (!isValid) return false;

  // Reject an already used Student ID (comparing normalized on both sides)
  const normalizedNewId = normalizeStudentId(student_id);
  const duplicate = getAllStudents().find(
    (s) => normalizeStudentId(s.student_id) === normalizedNewId
  );
  if (duplicate) {
    FormValidator.showError(studentIdInput, "This Student ID is already registered. Please login.");
    return false;
  }

  // Student registration passes validation: send 6-digit verification code via EmailJS
  const registerSubmitBtn = document.getElementById("register-submit-btn");
  if ((registerSubmitBtn && registerSubmitBtn.disabled) || isSendingVerificationCode) {
    return false;
  }

  const newStudent = {
    student_id: student_id,
    name: name,
    email: email.trim().toLowerCase(),
    phone: phone,
    department: department,
    batch: batch,
    password_hash: password_hash,
    status: "Active"
  };

  const registerErrorAlert = document.getElementById("register-error-alert");
  if (registerErrorAlert) {
    registerErrorAlert.innerHTML = "";
    registerErrorAlert.classList.remove("alert-visible");
  }

  const originalRegisterBtnText = registerSubmitBtn ? registerSubmitBtn.textContent : "Register";
  if (registerSubmitBtn) {
    registerSubmitBtn.disabled = true;
    registerSubmitBtn.textContent = "Sending code...";
  }

  isSendingVerificationCode = true;
  sendVerificationCode(newStudent.email, newStudent.name)
    .then((result) => {
      if (result && result.ok) {
        startStudentVerification(newStudent, result);
      } else {
        showVerificationSendError(registerErrorAlert, result);
        if (registerErrorAlert) registerErrorAlert.classList.add("alert-visible");
      }
    })
    .finally(() => {
      isSendingVerificationCode = false;
      if (registerSubmitBtn) {
        registerSubmitBtn.disabled = false;
        registerSubmitBtn.textContent = originalRegisterBtnText;
      }
    });

  return false;
}


/* ==========================================================================
   E. ADMIN LOGIN
   ========================================================================== */

function handleAdminLogin(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password_hash");
  const errorAlert = document.getElementById("login-error-alert");

  if (errorAlert) {
    errorAlert.textContent = "";
    errorAlert.classList.remove("alert-visible");
  }

  if (!emailInput || !passwordInput) return false;

  // Trim and lowercase the email; compare password as exact match
  const typedEmail = (emailInput.value || "").trim().toLowerCase();
  const typedPassword = passwordInput.value || "";

  FormValidator.clearError(emailInput);
  FormValidator.clearError(passwordInput);

  if (!typedEmail || !typedPassword) {
    if (!typedEmail) FormValidator.showError(emailInput, "Administrator email is required.");
    if (!typedPassword) FormValidator.showError(passwordInput, "Password is required.");
    return false;
  }

  // Compare email and password with admins array and active overrides
  const matchedAdmin = getAdmins().find((a) => {
    if (!a || !a.email) return false;
    const aEmail = (a.email || "").trim().toLowerCase();
    return aEmail === typedEmail && a.password_hash === typedPassword;
  });

  if (matchedAdmin) {
    const accountStatus = String(matchedAdmin.status || "Active").toLowerCase();
    if (accountStatus === "inactive" || accountStatus === "deactivated") {
      if (errorAlert) {
        errorAlert.textContent = "Your account is deactivated.";
        errorAlert.classList.add("alert-visible");
      }
      [emailInput, passwordInput].forEach((el) => {
        if (el) {
          el.classList.remove("input-shake");
          void el.offsetWidth;
          el.classList.add("input-error", "input-shake");
        }
      });
      return false;
    }

    // Admin credentials valid: send 6-digit verification code to admin email via EmailJS (or Demo mode box)
    const adminSubmitBtn = document.getElementById("admin-login-submit-btn");
    if ((adminSubmitBtn && adminSubmitBtn.disabled) || isSendingVerificationCode) {
      return false;
    }

    const originalAdminBtnText = adminSubmitBtn ? adminSubmitBtn.textContent : "Login";
    if (adminSubmitBtn) {
      adminSubmitBtn.disabled = true;
      adminSubmitBtn.textContent = "Sending code...";
    }

    isSendingVerificationCode = true;
    sendVerificationCode(matchedAdmin.email, matchedAdmin.name)
      .then((result) => {
        if (result && result.ok) {
          startAdminVerification(matchedAdmin, result);
        } else {
          showVerificationSendError(errorAlert, result);
          if (errorAlert) errorAlert.classList.add("alert-visible");
        }
      })
      .finally(() => {
        isSendingVerificationCode = false;
        if (adminSubmitBtn) {
          adminSubmitBtn.disabled = false;
          adminSubmitBtn.textContent = originalAdminBtnText;
        }
      });

    return false;
  } else {
    // Show "Invalid email or password." in red message box. No redirect.
    if (errorAlert) {
      errorAlert.textContent = "Invalid email or password.";
      errorAlert.classList.add("alert-visible");
    }
    // Subtle shake on invalid input
    [emailInput, passwordInput].forEach((el) => {
      if (el) {
        el.classList.remove("input-shake");
        void el.offsetWidth;
        el.classList.add("input-error", "input-shake");
      }
    });
    return false;
  }
}

/* ==========================================================================
   E2. SUPERVISOR LOGIN
   ========================================================================== */

function handleSupervisorLogin(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password_hash");
  const errorAlert = document.getElementById("login-error-alert");

  if (errorAlert) {
    errorAlert.textContent = "";
    errorAlert.classList.remove("alert-visible");
  }

  if (!emailInput || !passwordInput) return false;

  // Trim and lowercase the email; compare password as exact match
  const typedEmail = (emailInput.value || "").trim().toLowerCase();
  const typedPassword = passwordInput.value || "";

  FormValidator.clearError(emailInput);
  FormValidator.clearError(passwordInput);

  if (!typedEmail || !typedPassword) {
    if (!typedEmail) FormValidator.showError(emailInput, "Supervisor email is required.");
    if (!typedPassword) FormValidator.showError(passwordInput, "Password is required.");
    return false;
  }

  const matchedSupervisor = getAllSupervisors().find((s) => {
    if (!s || !s.email) return false;
    const sEmail = String(s.email).trim().toLowerCase();
    return sEmail === typedEmail && s.password_hash === typedPassword;
  });

  if (matchedSupervisor) {
    const accountStatus = String(matchedSupervisor.status || "Active").toLowerCase();
    if (accountStatus === "inactive" || accountStatus === "deactivated") {
      if (errorAlert) {
        errorAlert.textContent = "Your account is deactivated.";
        errorAlert.classList.add("alert-visible");
      }
      [emailInput, passwordInput].forEach((el) => {
        if (el) {
          el.classList.remove("input-shake");
          void el.offsetWidth;
          el.classList.add("input-error", "input-shake");
        }
      });
      return false;
    }

    const supSubmitBtn = document.getElementById("supervisor-login-submit-btn");
    if ((supSubmitBtn && supSubmitBtn.disabled) || isSendingVerificationCode) {
      return false;
    }

    const originalSupBtnText = supSubmitBtn ? supSubmitBtn.textContent : "Login";
    if (supSubmitBtn) {
      supSubmitBtn.disabled = true;
      supSubmitBtn.textContent = "Sending code...";
    }

    isSendingVerificationCode = true;
    sendVerificationCode(matchedSupervisor.email, matchedSupervisor.name)
      .then((result) => {
        if (result && result.ok) {
          startSupervisorVerification(matchedSupervisor, result);
        } else {
          showVerificationSendError(errorAlert, result);
          if (errorAlert) errorAlert.classList.add("alert-visible");
        }
      })
      .finally(() => {
        isSendingVerificationCode = false;
        if (supSubmitBtn) {
          supSubmitBtn.disabled = false;
          supSubmitBtn.textContent = originalSupBtnText;
        }
      });

    return false;
  } else {
    if (errorAlert) {
      errorAlert.textContent = "Invalid email or password.";
      errorAlert.classList.add("alert-visible");
    }
    [emailInput, passwordInput].forEach((el) => {
      if (el) {
        el.classList.remove("input-shake");
        void el.offsetWidth;
        el.classList.add("input-error", "input-shake");
      }
    });
    return false;
  }
}


/* ==========================================================================
   F. DASHBOARDS
   ========================================================================== */

/**
 * 2. student-dashboard.html: read the session.
 * If missing or role is not "student", redirect to login.html.
 * Otherwise find the student and show "Welcome, [name]".
 */
function initStudentDashboard() {
  const session = getSession();
  if (!session || session.role !== "student") {
    window.location.href = "login.html";
    return;
  }

  updateActiveSidebarItem();

  const student = findStudent(session.id);
  const studentName = student && student.name ? student.name : session.id;

  // Use textContent (not innerHTML) for user entered names
  const welcomeEl = document.getElementById("student-welcome-name");
  if (welcomeEl) {
    welcomeEl.textContent = studentName;
  }

  const topIdEl = document.getElementById("topbar-student-id");
  if (topIdEl) {
    topIdEl.textContent = student && student.name
      ? `${student.name} (${student.student_id})`
      : (student ? student.student_id : session.id);
  }

  renderStudentRequests(session.id);
  renderStudentGpuChart(session.id);
  initSlotAvailability("student", session.id);
  renderStudentNotifications(session.id);

  // Student request status notification upon login (reads shared localStorage)
  const requests = getData(STORAGE_KEYS.REQUESTS);
  const studentRequests = requests.filter(
    (req) => normalizeStudentId(req.student_id) === normalizeStudentId(session.id)
  );
  if (studentRequests.length > 0) {
    const latest = studentRequests[0];
    if (latest.status === "Approved") {
      showToast(`Notification: Request ${latest.request_id} for "${latest.project_title}" is Approved!`, "success");
    } else if (latest.status === "Pending") {
      showToast(`Notification: Request ${latest.request_id} is under administrator review.`, "info");
    }
  }

  // Auto-start interactive onboarding tour for new users on the dashboard
  if (!hasCompletedDashboardTour(session)) {
    setTimeout(() => {
      const hasOpenModal = document.querySelector(".modal-overlay.open");
      if (!hasOpenModal && document.body && document.body.classList.contains("page-student-dashboard")) {
        startDashboardTour(false);
      }
    }, 320);
  }
}

/* ==========================================================================
   STUDENT MONTHLY GPU UTILIZATION BAR CHART
   ========================================================================== */

let activeStudentGpuChartView = "week";

function parseSlotDurationHours(startTime, endTime) {
  const parseMinutes = (str) => {
    if (!str || typeof str !== "string") return null;
    const match = str.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      return null;
    }
    return h * 60 + m;
  };

  const startMins = parseMinutes(startTime);
  const endMins = parseMinutes(endTime);
  if (startMins !== null && endMins !== null && endMins > startMins) {
    return Math.round(((endMins - startMins) / 60) * 100) / 100;
  }
  return 2;
}

function extractGpuModelLabel(specification, fallbackPc) {
  const spec = String(specification || "").trim();
  if (spec) {
    const parts = spec.split(",").map((p) => p.trim()).filter(Boolean);
    const gpuPart = parts.find((p) => /nvidia|rtx|gtx|quadro|tesla|radeon|amd\s+rx|gpu/i.test(p));
    if (gpuPart) return gpuPart;
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return fallbackPc || "-";
}

function formatGpuHoursShort(hours) {
  const rounded = Math.round(Number(hours || 0) * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}h` : `${rounded.toFixed(1)}h`;
}

function formatGpuHoursLong(hours) {
  const rounded = Math.round(Number(hours || 0) * 10) / 10;
  const numStr = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${numStr} ${rounded === 1 ? "hr" : "hrs"}`;
}

function getStudentMonthlyGpuUsage(studentId, referenceDate) {
  const ref = referenceDate instanceof Date && !isNaN(referenceDate.getTime())
    ? referenceDate
    : new Date();
  const year = ref.getFullYear();
  const monthIdx = ref.getMonth();
  const monthNum = monthIdx + 1;
  const monthPrefix = `${year}-${String(monthNum).padStart(2, "0")}`;
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const todayStr = getTodayLocalDateStr();
  const todayDay = todayStr.startsWith(monthPrefix) ? Number(todayStr.slice(8, 10)) : -1;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthShortNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const monthLabel = `${monthNames[monthIdx]} ${year}`;
  const monthShort = monthShortNames[monthIdx];

  const dailyBuckets = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${monthPrefix}-${String(d).padStart(2, "0")}`;
    dailyBuckets.push({
      key: dateKey,
      day: d,
      label: String(d),
      sublabel: d === todayDay ? "Today" : "",
      rangeLabel: `${monthShort} ${d}, ${year}`,
      hours: 0,
      sessions: 0,
      pcs: {},
      projects: [],
      isCurrent: d === todayDay
    });
  }

  const weekRanges = [
    { start: 1, end: 7, label: "Wk 1" },
    { start: 8, end: 14, label: "Wk 2" },
    { start: 15, end: 21, label: "Wk 3" },
    { start: 22, end: 28, label: "Wk 4" },
    { start: 29, end: daysInMonth, label: "Wk 5" }
  ].filter((w) => w.start <= daysInMonth);

  const weeklyBuckets = weekRanges.map((w) => ({
    key: `${monthPrefix}-${w.label.replace(/\s+/g, "")}`,
    startDay: w.start,
    endDay: w.end,
    label: w.label,
    sublabel: `${monthShort} ${w.start}–${w.end}`,
    rangeLabel: `${monthShort} ${w.start}–${w.end}, ${year}`,
    hours: 0,
    sessions: 0,
    pcs: {},
    projects: [],
    isCurrent: todayDay >= w.start && todayDay <= w.end
  }));

  const confirmed = getStudentConfirmedAllocations(studentId);
  let totalHours = 0;
  let totalSessions = 0;
  const gpuUsageCounts = {};

  confirmed.forEach((item) => {
    const slotDate = String(item.slot_date || "").trim();
    if (!slotDate.startsWith(monthPrefix)) return;

    const dayNum = Number(slotDate.slice(8, 10));
    if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > daysInMonth) return;

    const hrs = parseSlotDurationHours(item.start_time, item.end_time);
    const pcLabel = item.pc_number || item.pc_id || "PC";
    const gpuLabel = extractGpuModelLabel(item.pc_specification, pcLabel);

    totalHours += hrs;
    totalSessions += 1;
    gpuUsageCounts[gpuLabel] = (gpuUsageCounts[gpuLabel] || 0) + hrs;

    const dayBucket = dailyBuckets[dayNum - 1];
    if (dayBucket) {
      dayBucket.hours = Math.round((dayBucket.hours + hrs) * 100) / 100;
      dayBucket.sessions += 1;
      dayBucket.pcs[pcLabel] = (dayBucket.pcs[pcLabel] || 0) + hrs;
      if (item.project_title && !dayBucket.projects.includes(item.project_title)) {
        dayBucket.projects.push(item.project_title);
      }
    }

    const weekBucket = weeklyBuckets.find((w) => dayNum >= w.startDay && dayNum <= w.endDay);
    if (weekBucket) {
      weekBucket.hours = Math.round((weekBucket.hours + hrs) * 100) / 100;
      weekBucket.sessions += 1;
      weekBucket.pcs[pcLabel] = (weekBucket.pcs[pcLabel] || 0) + hrs;
      if (item.project_title && !weekBucket.projects.includes(item.project_title)) {
        weekBucket.projects.push(item.project_title);
      }
    }
  });

  totalHours = Math.round(totalHours * 100) / 100;

  let topGpuLabel = "-";
  let topGpuHours = -1;
  Object.keys(gpuUsageCounts).forEach((gpu) => {
    if (gpuUsageCounts[gpu] > topGpuHours) {
      topGpuHours = gpuUsageCounts[gpu];
      topGpuLabel = gpu;
    }
  });

  return {
    monthPrefix,
    monthLabel,
    daysInMonth,
    totalHours,
    totalSessions,
    topGpuLabel,
    weeklyBuckets,
    dailyBuckets
  };
}

function setStudentGpuChartView(mode) {
  const nextMode = mode === "day" ? "day" : "week";
  activeStudentGpuChartView = nextMode;

  const weekBtn = document.getElementById("gpu-view-week-btn");
  const dayBtn = document.getElementById("gpu-view-day-btn");
  if (weekBtn) weekBtn.classList.toggle("active", nextMode === "week");
  if (dayBtn) dayBtn.classList.toggle("active", nextMode === "day");

  const session = getSession();
  if (session && session.role === "student") {
    renderStudentGpuChart(session.id);
  }
}

function renderStudentGpuChart(studentId) {
  const container = document.getElementById("student-gpu-chart-container");
  if (!container) return;

  const session = getSession();
  const resolvedStudentId = studentId || (session ? session.id : "");
  if (!resolvedStudentId) return;

  const usage = getStudentMonthlyGpuUsage(resolvedStudentId);
  const mode = activeStudentGpuChartView === "day" ? "day" : "week";
  const buckets = mode === "day" ? usage.dailyBuckets : usage.weeklyBuckets;

  const monthLabelEl = document.getElementById("student-gpu-month-label");
  if (monthLabelEl) {
    monthLabelEl.textContent = usage.monthLabel;
  }

  const noticeEl = document.getElementById("student-gpu-total-notice");
  if (noticeEl) {
    noticeEl.innerHTML = `
      <span class="badge-dot" style="background:${usage.totalHours > 0 ? "#2563eb" : "#94a3b8"}; width:6px; height:6px; border-radius:50%; display:inline-block;" aria-hidden="true"></span>
      <strong>${escapeHtml(formatGpuHoursLong(usage.totalHours))}</strong>
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <span>${usage.totalSessions} ${usage.totalSessions === 1 ? "session" : "sessions"}</span>
    `;
    noticeEl.style.display = "inline-flex";
  }

  const emptyEl = document.getElementById("student-gpu-chart-empty");
  if (emptyEl) {
    emptyEl.style.display = usage.totalHours === 0 ? "block" : "none";
  }

  const maxBucketHours = buckets.reduce((max, b) => Math.max(max, b.hours), 0);
  const yStep = maxBucketHours > 16 ? 4 : 2;
  const yMax = Math.max(4, Math.ceil(maxBucketHours / yStep) * yStep);
  const ticks = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0].map((v) =>
    Number.isInteger(v) ? `${v}h` : `${v.toFixed(1)}h`
  );

  let peakBucket = null;
  buckets.forEach((b) => {
    if (b.hours > 0 && (!peakBucket || b.hours > peakBucket.hours)) {
      peakBucket = b;
    }
  });

  const gridLinesHtml = [0, 25, 50, 75]
    .map((pct) => `<div class="gpu-chart-gridline" style="top: ${pct}%;"></div>`)
    .join("");

  const barsHtml = buckets
    .map((b) => {
      const pct = yMax > 0 && b.hours > 0 ? Math.max(4, Math.min(100, Math.round((b.hours / yMax) * 100))) : 0;
      const isZero = b.hours <= 0;
      const isPeak = Boolean(peakBucket && !isZero && b.hours === peakBucket.hours);
      const colClasses = [
        "gpu-bar-col",
        isZero ? "is-zero" : "",
        isPeak ? "is-peak" : ""
      ]
        .filter(Boolean)
        .join(" ");

      const pcSummary = Object.keys(b.pcs)
        .map((pc) => `${pc} (${formatGpuHoursShort(b.pcs[pc])})`)
        .join(", ");

      const tooltipLines = [
        `<strong>${escapeHtml(b.rangeLabel)}</strong>`,
        `${escapeHtml(formatGpuHoursLong(b.hours))} &bull; ${b.sessions} ${b.sessions === 1 ? "session" : "sessions"}`
      ];
      if (pcSummary) {
        tooltipLines.push(`Nodes: ${escapeHtml(pcSummary)}`);
      }

      const ariaLabel = `${b.rangeLabel}: ${formatGpuHoursLong(b.hours)}, ${b.sessions} sessions`;

      return `
        <div class="${colClasses}" tabindex="0" role="img" aria-label="${escapeHtml(ariaLabel)}">
          <div class="gpu-bar-tooltip">${tooltipLines.join("<br>")}</div>
          <span class="gpu-bar-value">${isZero ? "0h" : escapeHtml(formatGpuHoursShort(b.hours))}</span>
          <div class="gpu-bar-track">
            <div class="gpu-bar-fill" style="height: ${isZero ? 0 : pct}%;"></div>
          </div>
        </div>
      `;
    })
    .join("");

  const xaxisHtml = buckets
    .map((b) => {
      const cls = `gpu-bar-label${b.isCurrent ? " is-current" : ""}`;
      const sub = mode === "week" && b.sublabel
        ? `<span class="gpu-bar-sublabel">${escapeHtml(b.sublabel)}</span>`
        : "";
      return `<div class="${cls}">${escapeHtml(b.label)}${sub}</div>`;
    })
    .join("");

  const isDailyClass = mode === "day" ? " is-daily" : "";

  container.innerHTML = `
    <div class="gpu-chart-plot">
      <div class="gpu-chart-yaxis" aria-hidden="true">
        ${ticks.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}
      </div>
      <div class="gpu-chart-stage">
        <div class="gpu-chart-grid-area${isDailyClass}">
          ${gridLinesHtml}
          <div class="gpu-chart-bars${isDailyClass}">
            ${barsHtml}
          </div>
        </div>
        <div class="gpu-chart-xaxis${isDailyClass}">
          ${xaxisHtml}
        </div>
      </div>
    </div>
  `;

  const footerEl = document.getElementById("student-gpu-chart-footer");
  if (footerEl) {
    const peakText = peakBucket
      ? `${peakBucket.label} (${formatGpuHoursShort(peakBucket.hours)})`
      : "-";

    footerEl.innerHTML = `
      <div class="gpu-chart-stats">
        <span class="gpu-chart-stat">
          <span class="gpu-chart-stat-label">Total This Month:</span>
          <span class="gpu-chart-stat-val" id="student-gpu-total-hours">${escapeHtml(formatGpuHoursLong(usage.totalHours))}</span>
        </span>
        <span class="gpu-chart-stat">
          <span class="gpu-chart-stat-label">Confirmed Sessions:</span>
          <span class="gpu-chart-stat-val">${usage.totalSessions}</span>
        </span>
        <span class="gpu-chart-stat">
          <span class="gpu-chart-stat-label">Peak ${mode === "day" ? "Day" : "Week"}:</span>
          <span class="gpu-chart-stat-val">${escapeHtml(peakText)}</span>
        </span>
        <span class="gpu-chart-stat">
          <span class="gpu-chart-stat-label">Primary GPU:</span>
          <span class="gpu-chart-stat-val">${escapeHtml(usage.topGpuLabel)}</span>
        </span>
      </div>
      <div class="gpu-chart-legend">
        <span class="gpu-legend-swatch" aria-hidden="true"></span>
        <span>GPU Hours Utilized</span>
      </div>
    `;
  }
}

/* ==========================================================================
   STUDENT NOTIFICATIONS & INTERACTIVE DASHBOARD TOUR MODULE
   ========================================================================== */

const TOUR_STORAGE_KEY = "rp_tour_completed";
const NOTIF_READ_KEY = "rp_notif_read";

let activeTourState = {
  isOpen: false,
  stepIndex: 0,
  steps: [],
  sessionKey: null,
  repositionTimer: null,
  boundReposition: null
};

function getTourUserKey(session) {
  if (!session || !session.role) return "guest";
  return `${session.role}:${String(session.id || "")}`;
}

function getTourCompletionMap() {
  try {
    const raw = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function hasCompletedDashboardTour(session) {
  const key = getTourUserKey(session);
  const map = getTourCompletionMap();
  return Boolean(map[key]);
}

function markDashboardTourCompleted(session) {
  try {
    const key = getTourUserKey(session);
    const map = getTourCompletionMap();
    map[key] = true;
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    // Ignore storage issues
  }
}

function addNotificationRecord(entry) {
  if (!entry) return null;
  const list = getData(STORAGE_KEYS.NOTIFICATIONS, []);
  const record = {
    notification_id: nextId(STORAGE_KEYS.NOTIFICATIONS, "N", "notification_id"),
    target_role: entry.target_role || "student",
    target_id: entry.target_id || "",
    title: entry.title || "Notification",
    meta: entry.meta || "",
    created_at: entry.created_at || formatNowTimestamp(),
    read: Boolean(entry.read)
  };
  list.unshift(record);
  saveData(STORAGE_KEYS.NOTIFICATIONS, list);
  return record;
}

function buildStudentNotificationsList(studentId) {
  const normId = normalizeStudentId(studentId);
  const storedNotifs = getData(STORAGE_KEYS.NOTIFICATIONS, [])
    .filter(
      (n) =>
        n &&
        n.target_role === "student" &&
        normalizeStudentId(n.target_id) === normId
    )
    .slice()
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));

  const items = storedNotifs.map((n) => ({
    id: n.notification_id,
    title: n.title,
    meta: n.meta,
    created_at: n.created_at || "",
    read: Boolean(n.read)
  }));

  const requests = getData(STORAGE_KEYS.REQUESTS, []).filter(
    (r) => normalizeStudentId(r.student_id) === normId
  );
  const allocations = getData(STORAGE_KEYS.ALLOCATIONS, []);
  const pcs = getData(STORAGE_KEYS.PCS, []);
  const slots = getData(STORAGE_KEYS.SLOTS, []);

  // Supplement with any request records not yet reflected in rp_notifications
  requests.forEach((req) => {
    const mentioned = items.some(
      (it) =>
        (it.title && it.title.includes(req.request_id)) ||
        (it.meta && it.meta.includes(req.request_id))
    );
    if (mentioned) return;

    if (req.status === "Approved") {
      const alloc = allocations.find((a) => a.request_id === req.request_id && isAllocationConfirmed(a));
      const pc = alloc ? pcs.find((p) => p.pc_id === alloc.pc_id) : null;
      const slot = alloc ? slots.find((s) => s.slot_id === alloc.slot_id) : null;
      const allocInfo = alloc
        ? `Assigned ${pc ? pc.pc_number || pc.pc_id : alloc.pc_id}${slot ? ` (${slot.slot_date}, ${slot.start_time}-${slot.end_time})` : ""}`
        : "Slot assignment confirmed";
      items.push({
        id: `req-${req.request_id}-Approved`,
        title: `Approved: ${req.project_title} (${req.request_id})`,
        meta: allocInfo,
        created_at: req.created_at || "",
        read: false
      });
    } else if (req.status === "Pending") {
      items.push({
        id: `req-${req.request_id}-Pending`,
        title: `Pending Review: ${req.project_title} (${req.request_id})`,
        meta: `Submitted ${req.created_at || "recently"} · Awaiting administrator allocation`,
        created_at: req.created_at || "",
        read: false
      });
    } else if (req.status === "Rejected") {
      items.push({
        id: `req-${req.request_id}-Rejected`,
        title: `Not Approved: ${req.project_title} (${req.request_id})`,
        meta: "Please review requirements or submit an updated request.",
        created_at: req.created_at || "",
        read: false
      });
    }
  });

  items.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));

  if (items.length === 0) {
    items.push({
      id: `welcome-${normId}`,
      title: "Welcome to ResearchPC",
      meta: "Submit your first compute request to receive workstation allocation notifications here.",
      read: false
    });
  }
  return items;
}

function getReadNotificationSet(studentId) {
  try {
    const raw = localStorage.getItem(NOTIF_READ_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && parsed[studentId] ? parsed[studentId] : {};
  } catch (e) {
    return {};
  }
}

function renderStudentNotifications(studentId) {
  const listEl = document.getElementById("student-notifications-list");
  const badgeEl = document.getElementById("student-notif-badge");
  if (!listEl && !badgeEl) return;

  const session = getSession();
  const targetId = studentId || (session && session.id);
  if (!targetId) return;

  const items = buildStudentNotificationsList(targetId);
  const readMap = getReadNotificationSet(normalizeStudentId(targetId));
  const unreadCount = items.filter((item) => !item.read && !readMap[item.id]).length;

  if (badgeEl) {
    badgeEl.textContent = String(unreadCount);
    badgeEl.style.display = unreadCount > 0 ? "inline-flex" : "none";
  }

  if (listEl) {
    listEl.innerHTML = "";
    if (items.length === 0) {
      listEl.innerHTML = `<div class="notifications-empty">No notifications yet.</div>`;
    } else {
      items.forEach((item) => {
        const div = document.createElement("div");
        const isUnread = !item.read && !readMap[item.id];
        div.className = `notification-item${isUnread ? " notification-unread" : ""}`;
        div.innerHTML = `
          <div class="notification-item-title">${escapeHtml(item.title)}</div>
          <div class="notification-item-meta">${escapeHtml(item.meta)}</div>
        `;
        listEl.appendChild(div);
      });
    }
  }
}

function toggleNotificationsPanel() {
  const popover = document.getElementById("student-notifications-popover");
  const btn = document.getElementById("student-notifications-btn");
  if (!popover) return;

  const isOpen = popover.style.display === "block";
  if (isOpen) {
    popover.style.display = "none";
    if (btn) btn.setAttribute("aria-expanded", "false");
  } else {
    renderStudentNotifications();
    popover.style.display = "block";
    if (btn) btn.setAttribute("aria-expanded", "true");
  }
}

function closeNotificationsPanel() {
  const popover = document.getElementById("student-notifications-popover");
  const btn = document.getElementById("student-notifications-btn");
  if (popover) popover.style.display = "none";
  if (btn) btn.setAttribute("aria-expanded", "false");
}

function markStudentNotificationsRead() {
  const session = getSession();
  if (!session || session.role !== "student") return;
  const normId = normalizeStudentId(session.id);

  // Persist read state inside rp_notifications as well as rp_notif_read
  const stored = getData(STORAGE_KEYS.NOTIFICATIONS, []);
  let changed = false;
  const updated = stored.map((n) => {
    if (n && n.target_role === "student" && normalizeStudentId(n.target_id) === normId && !n.read) {
      changed = true;
      return { ...n, read: true };
    }
    return n;
  });
  if (changed) {
    saveData(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  const items = buildStudentNotificationsList(normId);
  try {
    const raw = localStorage.getItem(NOTIF_READ_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const map = {};
    items.forEach((it) => {
      map[it.id] = true;
    });
    all[normId] = map;
    localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(all));
  } catch (e) {
    // Ignore storage issues
  }
  renderStudentNotifications(normId);
}

function buildAdminNotificationsList(adminId) {
  const normAdmin = String(adminId || "AD01").trim().toUpperCase();
  const storedNotifs = getData(STORAGE_KEYS.NOTIFICATIONS, [])
    .filter(
      (n) =>
        n &&
        n.target_role === "admin" &&
        (!n.target_id || String(n.target_id).trim().toUpperCase() === normAdmin)
    )
    .slice()
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));

  return storedNotifs.map((n) => ({
    id: n.notification_id,
    title: n.title,
    meta: n.meta,
    created_at: n.created_at || "",
    read: Boolean(n.read)
  }));
}

function renderAdminNotifications(adminId) {
  const listEl = document.getElementById("admin-notifications-list");
  const badgeEl = document.getElementById("admin-notif-badge");
  if (!listEl && !badgeEl) return;

  const session = getSession();
  const targetId = adminId || (session && session.id) || "AD01";
  const items = buildAdminNotificationsList(targetId);
  const readMap = getReadNotificationSet(`ADMIN_${String(targetId).trim().toUpperCase()}`);
  const unreadCount = items.filter((item) => !item.read && !readMap[item.id]).length;

  if (badgeEl) {
    badgeEl.textContent = String(unreadCount);
    badgeEl.style.display = unreadCount > 0 ? "inline-flex" : "none";
  }

  if (listEl) {
    listEl.innerHTML = "";
    if (items.length === 0) {
      listEl.innerHTML = `<div class="notifications-empty">No notifications yet.</div>`;
    } else {
      items.forEach((item) => {
        const div = document.createElement("div");
        const isUnread = !item.read && !readMap[item.id];
        div.className = `notification-item${isUnread ? " notification-unread" : ""}`;
        div.innerHTML = `
          <div class="notification-item-title">${escapeHtml(item.title)}</div>
          <div class="notification-item-meta">${escapeHtml(item.meta)}</div>
        `;
        listEl.appendChild(div);
      });
    }
  }
}

function toggleAdminNotificationsPanel() {
  const popover = document.getElementById("admin-notifications-popover");
  const btn = document.getElementById("admin-notifications-btn");
  if (!popover) return;

  const isOpen = popover.style.display === "block";
  if (isOpen) {
    popover.style.display = "none";
    if (btn) btn.setAttribute("aria-expanded", "false");
  } else {
    renderAdminNotifications();
    popover.style.display = "block";
    if (btn) btn.setAttribute("aria-expanded", "true");
  }
}

function closeAdminNotificationsPanel() {
  const popover = document.getElementById("admin-notifications-popover");
  const btn = document.getElementById("admin-notifications-btn");
  if (popover) popover.style.display = "none";
  if (btn) btn.setAttribute("aria-expanded", "false");
}

function markAdminNotificationsRead() {
  const session = getSession();
  if (!session || session.role !== "admin") return;
  const normAdmin = String(session.id || "AD01").trim().toUpperCase();

  const stored = getData(STORAGE_KEYS.NOTIFICATIONS, []);
  let changed = false;
  const updated = stored.map((n) => {
    if (
      n &&
      n.target_role === "admin" &&
      (!n.target_id || String(n.target_id).trim().toUpperCase() === normAdmin) &&
      !n.read
    ) {
      changed = true;
      return { ...n, read: true };
    }
    return n;
  });
  if (changed) {
    saveData(STORAGE_KEYS.NOTIFICATIONS, updated);
  }

  const items = buildAdminNotificationsList(normAdmin);
  try {
    const raw = localStorage.getItem(NOTIF_READ_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const map = {};
    items.forEach((it) => {
      map[it.id] = true;
    });
    all[`ADMIN_${normAdmin}`] = map;
    localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(all));
  } catch (e) {
    // Ignore storage issues
  }
  renderAdminNotifications(normAdmin);
}

document.addEventListener("click", function (e) {
  const wrap = document.getElementById("student-notifications-wrap");
  const popover = document.getElementById("student-notifications-popover");
  if (wrap && popover && popover.style.display === "block" && !wrap.contains(e.target)) {
    closeNotificationsPanel();
  }

  const adminWrap = document.getElementById("admin-notifications-wrap");
  const adminPopover = document.getElementById("admin-notifications-popover");
  if (adminWrap && adminPopover && adminPopover.style.display === "block" && !adminWrap.contains(e.target)) {
    closeAdminNotificationsPanel();
  }
});

function getDashboardTourSteps() {
  return [
    {
      selector: "#tour-card-new-request",
      title: "New Request",
      description:
        "Submit a new research workstation request here. Choose your preferred dates, supervisor, model type, and compute priority.",
      tip: "Tip: You can also jump to New Request anytime from the left sidebar."
    },
    {
      selector: "#tour-card-my-schedule",
      title: "My Schedule",
      description:
        "Check your confirmed GPU workstation bookings sorted chronologically, view your next upcoming session, and download your schedule as CSV.",
      tip: "Tip: Approved requests automatically appear in My Schedule."
    },
    {
      selector: "#student-notifications-btn",
      title: "Notifications",
      description:
        "Keep track of approval decisions, pending administrator reviews, and assigned workstation slots from the Notifications bell.",
      tip: "Tip: Click Notifications anytime to inspect unread updates."
    },
    {
      selector: "#student-recent-requests-card",
      title: "Recent Requests",
      description:
        "Monitor your latest submissions at a glance and click View to inspect full request parameters and allocated slot details."
    },
    {
      selector: "#slot-availability-card",
      title: "PC Slot Availability",
      description:
        "Browse live lab PC availability by date, filter by workstation or hardware spec (e.g. RTX, RAM), and plan your booking before submitting."
    }
  ].filter((step) => Boolean(document.querySelector(step.selector)));
}

function ensureTourElements() {
  let backdrop = document.getElementById("rp-tour-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "rp-tour-backdrop";
    backdrop.className = "tour-overlay-backdrop";
    document.body.appendChild(backdrop);
  }

  let spotlight = document.getElementById("rp-tour-spotlight");
  if (!spotlight) {
    spotlight = document.createElement("div");
    spotlight.id = "rp-tour-spotlight";
    spotlight.className = "tour-spotlight";
    document.body.appendChild(spotlight);
  }

  let modal = document.getElementById("rp-tour-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "rp-tour-modal";
    modal.className = "tour-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "rp-tour-title");
    modal.innerHTML = `
      <div class="tour-progress-track">
        <div id="rp-tour-progress-fill" class="tour-progress-fill" style="width: 0%;"></div>
      </div>
      <div class="tour-modal-header">
        <div>
          <span class="kicker" id="rp-tour-kicker">STEP 1 OF 5</span>
          <h3 id="rp-tour-title">Dashboard Tour</h3>
        </div>
        <button type="button" class="toast-close tour-modal-close" onclick="closeDashboardTour(true)" aria-label="Close tour">&times;</button>
      </div>
      <div class="tour-modal-body">
        <p id="rp-tour-desc" class="tour-modal-description"></p>
        <div id="rp-tour-tip" class="tour-modal-tip" style="display: none;"></div>
        <div id="rp-tour-dots" class="tour-step-dots" aria-label="Tour step progress"></div>
      </div>
      <div class="tour-modal-footer">
        <button type="button" class="btn btn-outline btn-sm" onclick="closeDashboardTour(true)">Skip Tour</button>
        <div class="tour-footer-actions">
          <button type="button" id="rp-tour-prev-btn" class="btn btn-outline btn-sm" onclick="prevTourStep()">&larr; Back</button>
          <button type="button" id="rp-tour-next-btn" class="btn btn-blue btn-sm" onclick="nextTourStep()">Next &rarr;</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  return { backdrop, spotlight, modal };
}

function positionTourStepElements() {
  if (!activeTourState.isOpen) return;
  const step = activeTourState.steps[activeTourState.stepIndex];
  if (!step) return;

  const targetEl = document.querySelector(step.selector);
  const spotlight = document.getElementById("rp-tour-spotlight");
  const modal = document.getElementById("rp-tour-modal");
  if (!targetEl || !spotlight || !modal) return;

  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 720;
  const pad = 8;

  const rect = typeof targetEl.getBoundingClientRect === "function"
    ? targetEl.getBoundingClientRect()
    : { top: 80, left: 80, width: 260, height: 120, right: 340, bottom: 200 };

  const spotW = Math.max(rect.width + pad * 2, 40);
  const spotH = Math.max(rect.height + pad * 2, 32);
  const spotTop = Math.max(4, rect.top - pad);
  const spotLeft = Math.max(4, rect.left - pad);

  spotlight.style.top = `${spotTop}px`;
  spotlight.style.left = `${spotLeft}px`;
  spotlight.style.width = `${Math.min(spotW, vw - 8)}px`;
  spotlight.style.height = `${Math.min(spotH, vh - 8)}px`;

  const modalRect = typeof modal.getBoundingClientRect === "function"
    ? modal.getBoundingClientRect()
    : { width: 380, height: 240 };
  const modalW = modalRect.width > 0 ? modalRect.width : Math.min(390, vw - 32);
  const modalH = modalRect.height > 0 ? modalRect.height : 240;
  const margin = 16;

  let mTop;
  let mLeft = Math.min(Math.max(margin, rect.left), Math.max(margin, vw - modalW - margin));

  const spaceBelow = vh - (spotTop + spotH) - margin;
  const spaceAbove = spotTop - margin;

  if (spaceBelow >= modalH) {
    mTop = spotTop + spotH + 12;
  } else if (spaceAbove >= modalH) {
    mTop = spotTop - modalH - 12;
  } else {
    mTop = Math.max(margin, Math.round((vh - modalH) / 2));
    if (rect.right + 16 + modalW <= vw - margin) {
      mLeft = rect.right + 16;
    } else if (rect.left - 16 - modalW >= margin) {
      mLeft = rect.left - 16 - modalW;
    } else {
      mLeft = Math.max(margin, Math.round((vw - modalW) / 2));
    }
  }

  mTop = Math.min(Math.max(margin, mTop), Math.max(margin, vh - modalH - margin));
  mLeft = Math.min(Math.max(margin, mLeft), Math.max(margin, vw - modalW - margin));

  modal.style.top = `${mTop}px`;
  modal.style.left = `${mLeft}px`;
}

function renderTourStep() {
  if (!activeTourState.isOpen) return;
  const steps = activeTourState.steps;
  const idx = activeTourState.stepIndex;
  const step = steps[idx];
  if (!step) {
    closeDashboardTour(true);
    return;
  }

  document.querySelectorAll(".tour-target-active").forEach((el) => {
    el.classList.remove("tour-target-active");
  });

  const targetEl = document.querySelector(step.selector);
  if (targetEl) {
    targetEl.classList.add("tour-target-active");
    if (typeof targetEl.scrollIntoView === "function") {
      try {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      } catch (e) {
        targetEl.scrollIntoView();
      }
    }
  }

  const { backdrop, spotlight, modal } = ensureTourElements();
  backdrop.style.display = "block";
  spotlight.style.display = "block";
  modal.style.display = "block";

  const kickerEl = document.getElementById("rp-tour-kicker");
  const titleEl = document.getElementById("rp-tour-title");
  const descEl = document.getElementById("rp-tour-desc");
  const tipEl = document.getElementById("rp-tour-tip");
  const dotsEl = document.getElementById("rp-tour-dots");
  const fillEl = document.getElementById("rp-tour-progress-fill");
  const prevBtn = document.getElementById("rp-tour-prev-btn");
  const nextBtn = document.getElementById("rp-tour-next-btn");

  if (kickerEl) kickerEl.textContent = `STEP ${idx + 1} OF ${steps.length}`;
  if (titleEl) titleEl.textContent = step.title;
  if (descEl) descEl.textContent = step.description;

  if (tipEl) {
    if (step.tip) {
      tipEl.textContent = step.tip;
      tipEl.style.display = "block";
    } else {
      tipEl.textContent = "";
      tipEl.style.display = "none";
    }
  }

  if (fillEl) {
    fillEl.style.width = `${Math.round(((idx + 1) / steps.length) * 100)}%`;
  }

  if (dotsEl) {
    dotsEl.innerHTML = "";
    steps.forEach((s, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `tour-step-dot${i === idx ? " active" : ""}`;
      dot.setAttribute("aria-label", `Go to step ${i + 1}: ${s.title}`);
      dot.onclick = () => goToTourStep(i);
      dotsEl.appendChild(dot);
    });
  }

  if (prevBtn) {
    prevBtn.disabled = idx === 0;
  }
  if (nextBtn) {
    nextBtn.textContent = idx === steps.length - 1 ? "Finish Tour ✓" : "Next →";
  }

  positionTourStepElements();
  if (activeTourState.repositionTimer) clearTimeout(activeTourState.repositionTimer);
  activeTourState.repositionTimer = setTimeout(positionTourStepElements, 260);
}

function startDashboardTour(force = false) {
  const session = getSession();
  if (!session) return;
  if (!force && hasCompletedDashboardTour(session)) return;

  const steps = getDashboardTourSteps();
  if (!steps || steps.length === 0) return;

  closeNotificationsPanel();

  activeTourState.isOpen = true;
  activeTourState.stepIndex = 0;
  activeTourState.steps = steps;
  activeTourState.sessionKey = getTourUserKey(session);

  if (!activeTourState.boundReposition) {
    activeTourState.boundReposition = () => positionTourStepElements();
    window.addEventListener("resize", activeTourState.boundReposition);
    window.addEventListener("scroll", activeTourState.boundReposition, true);
  }

  renderTourStep();
}

function nextTourStep() {
  if (!activeTourState.isOpen) return;
  if (activeTourState.stepIndex >= activeTourState.steps.length - 1) {
    closeDashboardTour(true);
    showToast("Dashboard tour completed! You can replay it anytime from the Tour button.", "success");
    return;
  }
  activeTourState.stepIndex += 1;
  renderTourStep();
}

function prevTourStep() {
  if (!activeTourState.isOpen) return;
  if (activeTourState.stepIndex > 0) {
    activeTourState.stepIndex -= 1;
    renderTourStep();
  }
}

function goToTourStep(index) {
  if (!activeTourState.isOpen) return;
  if (index >= 0 && index < activeTourState.steps.length) {
    activeTourState.stepIndex = index;
    renderTourStep();
  }
}

function closeDashboardTour(markCompleted = true) {
  activeTourState.isOpen = false;
  if (activeTourState.repositionTimer) {
    clearTimeout(activeTourState.repositionTimer);
    activeTourState.repositionTimer = null;
  }
  if (activeTourState.boundReposition) {
    window.removeEventListener("resize", activeTourState.boundReposition);
    window.removeEventListener("scroll", activeTourState.boundReposition, true);
    activeTourState.boundReposition = null;
  }

  document.querySelectorAll(".tour-target-active").forEach((el) => {
    el.classList.remove("tour-target-active");
  });

  ["rp-tour-backdrop", "rp-tour-spotlight", "rp-tour-modal"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  if (markCompleted) {
    const session = getSession();
    if (session) markDashboardTourCompleted(session);
  }
}

/**
 * Creates an accessible, color-coded status badge with a live-colored dot
 */
function createStatusBadge(status) {
  const badge = document.createElement("span");
  let statusClass = "badge-pending";
  if (
    status === "Approved" ||
    status === "Available" ||
    status === "Active" ||
    status === "Confirmed" ||
    status === "Open"
  ) {
    statusClass = "badge-approved";
  } else if (status === "Rejected" || status === "Inactive") {
    statusClass = "badge-rejected";
  } else if (status === "Maintenance" || status === "Pending") {
    statusClass = "badge-pending";
  }
  badge.className = `status-badge ${statusClass}`;
  badge.innerHTML = `<span class="badge-dot" aria-hidden="true"></span><span>${escapeHtml(status)}</span>`;
  return badge;
}

function updateStudentRequestsNotice(studentRequests) {
  const noticeEl = document.getElementById("student-requests-notice");
  if (!noticeEl) return;

  if (!studentRequests || studentRequests.length === 0) {
    noticeEl.style.display = "none";
    return;
  }

  const pending = studentRequests.filter((r) => r.status === "Pending").length;
  const approved = studentRequests.filter((r) => r.status === "Approved").length;
  const rejected = studentRequests.filter((r) => r.status === "Rejected").length;

  const parts = [];
  if (approved > 0) {
    parts.push(`<span class="badge-dot" style="background:#10b981; width:6px; height:6px; border-radius:50%; display:inline-block;" aria-hidden="true"></span><strong>${approved}</strong> Approved`);
  }
  if (pending > 0) {
    parts.push(`<span class="badge-dot" style="background:#f59e0b; width:6px; height:6px; border-radius:50%; display:inline-block;" aria-hidden="true"></span><strong>${pending}</strong> Pending`);
  }
  if (rejected > 0) {
    parts.push(`<span class="badge-dot" style="background:#ef4444; width:6px; height:6px; border-radius:50%; display:inline-block;" aria-hidden="true"></span><strong>${rejected}</strong> Rejected`);
  }

  noticeEl.innerHTML = parts.join(' <span style="opacity: 0.4; margin: 0 0.2rem;">&bull;</span> ');
  noticeEl.style.display = "inline-flex";
}

function renderStudentRequests(studentId) {
  const tbody = document.getElementById("student-requests-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const normId = normalizeStudentId(studentId);
  const requests = getData(STORAGE_KEYS.REQUESTS);
  const studentRequests = requests.filter(
    (req) => normalizeStudentId(req.student_id) === normId
  );

  updateStudentRequestsNotice(studentRequests);

  if (studentRequests.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="table-empty-row">No requests yet.</td>`;
    tbody.appendChild(tr);
    return;
  }

  studentRequests.forEach((req) => {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.className = "tabular";
    tdId.textContent = req.request_id;

    const tdTitle = document.createElement("td");
    tdTitle.style.fontWeight = "600";
    tdTitle.textContent = req.project_title;

    const tdDate = document.createElement("td");
    tdDate.className = "tabular";
    tdDate.style.color = "var(--color-text-muted)";
    tdDate.textContent = req.created_at;

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createStatusBadge(req.status));

    const tdAction = document.createElement("td");
    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn btn-outline btn-sm";
    viewBtn.textContent = "View";
    viewBtn.onclick = () => openRequestDetail(req.request_id);
    tdAction.appendChild(viewBtn);

    tr.appendChild(tdId);
    tr.appendChild(tdTitle);
    tr.appendChild(tdDate);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function getTodayLocalDateStr() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * new-request.html: checks active student session (redirects to login.html if missing),
 * populates supervisor dropdown, sets date constraints, and wires live error clearing.
 */
function initNewRequestPage() {
  const form = document.getElementById("new-request-form");
  if (!form) return;

  const session = getSession();
  if (!session || session.role !== "student") {
    window.location.href = "login.html";
    return;
  }

  updateActiveSidebarItem();

  const student = findStudent(session.id);
  const topIdEl = document.getElementById("topbar-student-id");
  if (topIdEl) {
    topIdEl.textContent = student && student.name
      ? `${student.name} (${student.student_id})`
      : (student ? student.student_id : session.id);
  }

  const supervisorSelect = document.getElementById("supervisor_id");
  if (supervisorSelect && supervisorSelect.options.length <= 1) {
    const activeSupervisors = getAllSupervisors().filter(
      (sup) => String(sup.status || "Active").toLowerCase() !== "inactive"
    );
    activeSupervisors.forEach((sup) => {
      const opt = document.createElement("option");
      opt.value = sup.supervisor_id;
      opt.textContent = `${sup.supervisor_id} - ${sup.name} (${sup.department})`;
      supervisorSelect.appendChild(opt);
    });
  }

  const todayStr = getTodayLocalDateStr();
  const fromInput = document.getElementById("required_from");
  const toInput = document.getElementById("required_to");
  if (fromInput) fromInput.min = todayStr;
  if (toInput) toInput.min = todayStr;

  if (fromInput && toInput) {
    fromInput.addEventListener("change", () => {
      FormValidator.clearError(fromInput);
      toInput.min = fromInput.value && fromInput.value > todayStr ? fromInput.value : todayStr;
    });
    toInput.addEventListener("change", () => {
      FormValidator.clearError(toInput);
    });
  }

  const fields = [
    "project_title",
    "purpose",
    "supervisor_id",
    "required_from",
    "required_to",
    "model_type",
    "dataset_size",
    "priority"
  ];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.tagName === "SELECT" || el.type === "date" ? "change" : "input";
    el.addEventListener(evt, () => FormValidator.clearError(el));
  });

  form.onsubmit = handleNewRequestSubmit;
}

/**
 * Validates and saves a new research_request into shared localStorage key "rp_requests".
 */
function handleNewRequestSubmit(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  const session = getSession();
  if (!session || session.role !== "student") {
    window.location.href = "login.html";
    return false;
  }

  const titleInput = document.getElementById("project_title");
  const purposeInput = document.getElementById("purpose");
  const supervisorInput = document.getElementById("supervisor_id");
  const fromInput = document.getElementById("required_from");
  const toInput = document.getElementById("required_to");
  const modelInput = document.getElementById("model_type");
  const datasetInput = document.getElementById("dataset_size");
  const priorityInput = document.getElementById("priority");
  const successAlert = document.getElementById("new-request-success-alert");
  const submitBtn = document.getElementById("new-request-submit-btn");

  const allInputs = [
    titleInput,
    purposeInput,
    supervisorInput,
    fromInput,
    toInput,
    modelInput,
    datasetInput,
    priorityInput
  ];

  FormValidator.clearAll(allInputs);
  if (successAlert) {
    successAlert.textContent = "";
    successAlert.classList.remove("alert-visible");
  }

  const project_title = (titleInput ? titleInput.value : "").trim();
  const purpose = (purposeInput ? purposeInput.value : "").trim();
  const rawSupervisorId = (supervisorInput ? supervisorInput.value : "").trim();
  const supervisor_id = /^\d+$/.test(rawSupervisorId) ? Number(rawSupervisorId) : rawSupervisorId;
  const required_from = (fromInput ? fromInput.value : "").trim();
  const required_to = (toInput ? toInput.value : "").trim();
  const model_type = (modelInput ? modelInput.value : "").trim();
  const dataset_size = (datasetInput ? datasetInput.value : "").trim();
  const priority = (priorityInput ? priorityInput.value : "").trim();

  let hasErrors = false;
  let firstErrorEl = null;

  function markError(el, msg) {
    if (!firstErrorEl) firstErrorEl = el;
    FormValidator.showError(el, msg);
    hasErrors = true;
  }

  if (!project_title) markError(titleInput, "Project title is required.");
  if (!supervisor_id) markError(supervisorInput, "Please select a supervisor.");
  if (!purpose) markError(purposeInput, "Research purpose is required.");

  const todayStr = getTodayLocalDateStr();

  if (!required_from) {
    markError(fromInput, "Start date is required.");
  } else if (required_from < todayStr) {
    markError(fromInput, "Start date cannot be in the past.");
  }

  if (!required_to) {
    markError(toInput, "End date is required.");
  } else if (required_to < todayStr) {
    markError(toInput, "End date cannot be in the past.");
  } else if (required_from && required_to < required_from) {
    markError(toInput, "End date cannot be before start date.");
  }

  if (!model_type) markError(modelInput, "Model type is required.");
  if (!dataset_size) markError(datasetInput, "Dataset size is required.");
  if (!priority || !["Low", "Medium", "High"].includes(priority)) {
    markError(priorityInput, "Please select a priority (Low, Medium, or High).");
  }

  if (hasErrors) {
    if (firstErrorEl && typeof firstErrorEl.focus === "function") {
      firstErrorEl.focus();
    }
    return false;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
  }

  const requests = getData(STORAGE_KEYS.REQUESTS, DEFAULT_REQUESTS);
  const newRequest = {
    request_id: nextId(STORAGE_KEYS.REQUESTS),
    student_id: session.id,
    supervisor_id,
    project_title,
    purpose,
    required_from,
    required_to,
    model_type,
    dataset_size,
    priority,
    status: "Pending",
    created_at: todayStr
  };

  requests.unshift(newRequest);
  saveData(STORAGE_KEYS.REQUESTS, requests);

  addActivityLog({
    action_type: "Request Submitted",
    category: "request",
    actor_id: session.id,
    actor_role: "student",
    target_id: newRequest.request_id,
    description: `Submitted research request ${newRequest.request_id} ("${project_title}", ${priority} priority) for ${required_from} to ${required_to}.`
  });

  addNotificationRecord({
    target_role: "admin",
    target_id: "AD01",
    title: `New request ${newRequest.request_id} from ${session.id}`,
    meta: `${project_title} (${model_type}, ${dataset_size}) requested for ${required_from}`
  });

  if (successAlert) {
    successAlert.textContent = `Request ${newRequest.request_id} submitted successfully! Redirecting to your dashboard...`;
    successAlert.classList.add("alert-visible");
  }
  showToast(`Request ${newRequest.request_id} submitted for review.`, "success");

  setTimeout(() => {
    window.location.href = "student-dashboard.html";
  }, 1200);

  return false;
}

/* ==========================================================================
   MY REQUESTS PAGE MODULE (my-requests.html)
   ========================================================================== */

let activeMyRequestsState = {
  studentId: null,
  statusFilter: "ALL",
  searchQuery: ""
};

function initMyRequestsPage() {
  const tbody = document.getElementById("my-requests-tbody");
  if (!tbody) return;

  const session = getSession();
  if (!session || session.role !== "student") {
    window.location.href = "login.html";
    return;
  }

  activeMyRequestsState.studentId = session.id;
  activeMyRequestsState.statusFilter = "ALL";
  activeMyRequestsState.searchQuery = "";

  updateActiveSidebarItem();

  const student = findStudent(session.id);
  const topIdEl = document.getElementById("topbar-student-id");
  if (topIdEl) {
    topIdEl.textContent = student && student.name
      ? `${student.name} (${student.student_id})`
      : (student ? student.student_id : session.id);
  }

  const statusFilter = document.getElementById("my-requests-status-filter");
  if (statusFilter) {
    statusFilter.value = "ALL";
    statusFilter.addEventListener("change", function () {
      activeMyRequestsState.statusFilter = this.value || "ALL";
      renderMyRequestsTable();
    });
  }

  const searchInput = document.getElementById("my-requests-search-input");
  const clearBtn = document.getElementById("my-requests-clear-search");
  if (searchInput) {
    searchInput.value = "";
    if (clearBtn) clearBtn.style.display = "none";

    searchInput.addEventListener("input", function () {
      activeMyRequestsState.searchQuery = (this.value || "").trim().toLowerCase();
      if (clearBtn) {
        clearBtn.style.display = this.value ? "inline" : "none";
      }
      renderMyRequestsTable();
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        searchInput.value = "";
        activeMyRequestsState.searchQuery = "";
        clearBtn.style.display = "none";
        searchInput.focus();
        renderMyRequestsTable();
      });
    }
  }

  renderMyRequestsTable();
}

function renderMyRequestsTable() {
  const tbody = document.getElementById("my-requests-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const studentId = activeMyRequestsState.studentId;
  const normId = normalizeStudentId(studentId);
  const statusFilter = activeMyRequestsState.statusFilter || "ALL";
  const searchQuery = (activeMyRequestsState.searchQuery || "").trim().toLowerCase();

  const allRequests = getData(STORAGE_KEYS.REQUESTS);
  const studentRequests = allRequests.filter(
    (req) => normalizeStudentId(req.student_id) === normId
  );

  // Update header notice badge
  const noticeEl = document.getElementById("my-requests-notice");
  if (noticeEl) {
    if (studentRequests.length === 0) {
      noticeEl.style.display = "none";
    } else {
      const pending = studentRequests.filter((r) => r.status === "Pending").length;
      const approved = studentRequests.filter((r) => r.status === "Approved").length;
      const rejected = studentRequests.filter((r) => r.status === "Rejected").length;
      noticeEl.innerHTML = `
        <strong>${studentRequests.length}</strong> Total
        <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
        <strong>${approved}</strong> Approved
        <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
        <strong>${pending}</strong> Pending
        <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
        <strong>${rejected}</strong> Rejected
      `;
      noticeEl.style.display = "inline-flex";
    }
  }

  const filteredRequests = studentRequests.filter((req) => {
    if (statusFilter !== "ALL" && req.status !== statusFilter) {
      return false;
    }
    if (searchQuery) {
      const title = (req.project_title || "").toLowerCase();
      if (!title.includes(searchQuery)) return false;
    }
    return true;
  });

  if (filteredRequests.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" class="table-empty-row">No requests yet.</td>`;
    tbody.appendChild(tr);
    return;
  }

  filteredRequests.forEach((req) => {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.className = "tabular";
    tdId.textContent = req.request_id;

    const tdTitle = document.createElement("td");
    tdTitle.style.fontWeight = "600";
    tdTitle.textContent = req.project_title;

    const tdPriority = document.createElement("td");
    tdPriority.textContent = req.priority || "Normal";

    const tdDates = document.createElement("td");
    tdDates.className = "tabular";
    tdDates.style.color = "var(--color-text-muted)";
    if (req.required_from && req.required_to && req.required_from !== req.required_to) {
      tdDates.textContent = `${req.required_from} → ${req.required_to}`;
    } else {
      tdDates.textContent = req.required_from || req.required_to || req.created_at || "-";
    }

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createStatusBadge(req.status));

    const tdAction = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "action-buttons";

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn btn-outline btn-sm";
    viewBtn.textContent = "View";
    viewBtn.onclick = () => openRequestDetail(req.request_id);
    actionWrap.appendChild(viewBtn);

    if (req.status === "Pending") {
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "btn-reject";
      cancelBtn.textContent = "Cancel";
      cancelBtn.onclick = () => openCancelRequestConfirm(req.request_id);
      actionWrap.appendChild(cancelBtn);
    }

    tdAction.appendChild(actionWrap);

    tr.appendChild(tdId);
    tr.appendChild(tdTitle);
    tr.appendChild(tdPriority);
    tr.appendChild(tdDates);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function openCancelRequestConfirm(requestId) {
  const requests = getData(STORAGE_KEYS.REQUESTS);
  const req = requests.find((r) => r.request_id === requestId);
  if (!req || req.status !== "Pending") return;

  let modalEl = document.getElementById("cancel-confirm-modal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "cancel-confirm-modal";
    modalEl.className = "modal-overlay";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "cancel-confirm-title");
    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 440px;">
        <div class="modal-header">
          <div>
            <span class="kicker">CONFIRM CANCELLATION</span>
            <h3 id="cancel-confirm-title">Cancel Pending Request?</h3>
          </div>
          <button type="button" class="toast-close" onclick="closeCancelRequestConfirm()" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <p id="cancel-confirm-message" style="font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.5;"></p>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="closeCancelRequestConfirm()">Keep Request</button>
          <button type="button" id="cancel-confirm-submit-btn" class="btn-reject" style="padding: 0.45rem 0.9rem; font-size: 0.8125rem;">Confirm Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeCancelRequestConfirm();
    });
  }

  const msgEl = document.getElementById("cancel-confirm-message");
  if (msgEl) {
    msgEl.textContent = `Are you sure you want to cancel request ${req.request_id} ("${req.project_title}")? This action cannot be undone.`;
  }

  const confirmBtn = document.getElementById("cancel-confirm-submit-btn");
  if (confirmBtn) {
    confirmBtn.onclick = () => confirmCancelPendingRequest(req.request_id);
  }

  modalEl.classList.add("open");
}

function closeCancelRequestConfirm() {
  const modalEl = document.getElementById("cancel-confirm-modal");
  if (modalEl) modalEl.classList.remove("open");
}

function confirmCancelPendingRequest(requestId) {
  const requests = getData(STORAGE_KEYS.REQUESTS);
  const idx = requests.findIndex((r) => r.request_id === requestId && r.status === "Pending");
  if (idx === -1) {
    closeCancelRequestConfirm();
    return;
  }

  const cancelledReq = requests[idx];
  requests.splice(idx, 1);
  saveData(STORAGE_KEYS.REQUESTS, requests);

  addActivityLog({
    action_type: "Request Cancelled",
    category: "request",
    actor_id: cancelledReq.student_id,
    actor_role: "student",
    target_id: requestId,
    description: `Student cancelled pending request ${requestId} ("${cancelledReq.project_title}").`
  });

  closeCancelRequestConfirm();
  renderMyRequestsTable();
  showToast(`Request ${requestId} cancelled and removed.`, "info");
}

/* ==========================================================================
   MY SCHEDULE PAGE MODULE (my-schedule.html)
   ========================================================================== */

let activeMyScheduleState = {
  studentId: null
};

function getStudentConfirmedAllocations(studentId) {
  const normId = normalizeStudentId(studentId);
  const allocations = getData(STORAGE_KEYS.ALLOCATIONS);
  const requests = getData(STORAGE_KEYS.REQUESTS);
  const pcs = getData(STORAGE_KEYS.PCS);
  const slots = getData(STORAGE_KEYS.SLOTS);

  const items = [];

  allocations.forEach((alloc) => {
    if (!isAllocationConfirmed(alloc)) return;

    const req = requests.find((r) => r.request_id === alloc.request_id);
    if (req && req.status !== "Approved") return;

    const ownerId =
      alloc.student_id ||
      (req ? req.student_id : MOCK_ALLOCATION_OWNERS[alloc.request_id]);

    if (!ownerId || normalizeStudentId(ownerId) !== normId) return;

    const pc = pcs.find((p) => p.pc_id === alloc.pc_id);
    const slot = slots.find((s) => s.slot_id === alloc.slot_id);

    const slotDate = slot && slot.slot_date ? slot.slot_date : (req && req.required_from ? req.required_from : "");
    const startTime = slot && slot.start_time ? slot.start_time : "";
    const endTime = slot && slot.end_time ? slot.end_time : "";
    const timeLabel = startTime && endTime ? `${startTime} - ${endTime}` : (alloc.slot_id || "-");

    items.push({
      allocation_id: alloc.allocation_id,
      request_id: alloc.request_id,
      slot_date: slotDate,
      start_time: startTime,
      end_time: endTime,
      time: timeLabel,
      pc_id: alloc.pc_id,
      pc_number: pc ? (pc.pc_number || pc.pc_id) : (alloc.pc_id || "-"),
      pc_specification: pc ? (pc.specification || "-") : "-",
      project_title: req && req.project_title ? req.project_title : `Research Session (${alloc.request_id})`
    });
  });

  // Sort chronologically by date, start time, and PC number
  items.sort((a, b) => {
    const dateCmp = String(a.slot_date || "").localeCompare(String(b.slot_date || ""));
    if (dateCmp !== 0) return dateCmp;
    const timeCmp = String(a.start_time || "").localeCompare(String(b.start_time || ""));
    if (timeCmp !== 0) return timeCmp;
    return String(a.pc_number || "").localeCompare(String(b.pc_number || ""));
  });

  return items;
}

function initMySchedulePage() {
  const tbody = document.getElementById("my-schedule-tbody");
  if (!tbody) return;

  const session = getSession();
  if (!session || session.role !== "student") {
    window.location.href = "login.html";
    return;
  }

  activeMyScheduleState.studentId = session.id;
  updateActiveSidebarItem();

  const student = findStudent(session.id);
  const topIdEl = document.getElementById("topbar-student-id");
  if (topIdEl) {
    topIdEl.textContent = student && student.name
      ? `${student.name} (${student.student_id})`
      : (student ? student.student_id : session.id);
  }

  renderMySchedule();
}

function renderMySchedule() {
  const tbody = document.getElementById("my-schedule-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const studentId = activeMyScheduleState.studentId;
  const bookings = getStudentConfirmedAllocations(studentId);

  const nextBookingEl = document.getElementById("next-booking-text");
  const noticeEl = document.getElementById("my-schedule-notice");

  if (bookings.length === 0) {
    if (nextBookingEl) {
      nextBookingEl.textContent = "You have no booked slots yet.";
    }
    if (noticeEl) {
      noticeEl.style.display = "none";
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="table-empty-row">You have no booked slots yet.</td>`;
    tbody.appendChild(tr);
    return;
  }

  // Determine the upcoming booking (date >= today, picking earliest upcoming; fallback to first sorted)
  const now = new Date();
  const todayStr = getTodayLocalDateStr();
  const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const nextBooking =
    bookings.find(
      (b) =>
        b.slot_date > todayStr ||
        (b.slot_date === todayStr && (!b.end_time || b.end_time >= nowHHMM))
    ) || bookings[0];

  if (nextBookingEl && nextBooking) {
    const dateObj = nextBooking.slot_date ? new Date(nextBooking.slot_date + "T00:00:00") : null;
    const formattedDate =
      dateObj && !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
        : nextBooking.slot_date;
    nextBookingEl.textContent = `${formattedDate}, ${nextBooking.time} · ${nextBooking.pc_number} (${nextBooking.project_title})`;
  }

  if (noticeEl) {
    noticeEl.innerHTML = `<strong>${bookings.length}</strong> Confirmed Booking${bookings.length === 1 ? "" : "s"}`;
    noticeEl.style.display = "inline-flex";
  }

  bookings.forEach((b) => {
    const tr = document.createElement("tr");

    const tdDate = document.createElement("td");
    tdDate.className = "tabular";
    tdDate.textContent = b.slot_date || "-";

    const tdTime = document.createElement("td");
    tdTime.className = "tabular";
    tdTime.textContent = b.time || "-";

    const tdPc = document.createElement("td");
    tdPc.className = "tabular";
    tdPc.style.fontWeight = "600";
    tdPc.textContent = b.pc_number;

    const tdSpec = document.createElement("td");
    tdSpec.style.color = "var(--color-text-muted)";
    tdSpec.textContent = b.pc_specification;

    const tdTitle = document.createElement("td");
    tdTitle.style.fontWeight = "600";
    tdTitle.textContent = b.project_title;

    tr.appendChild(tdDate);
    tr.appendChild(tdTime);
    tr.appendChild(tdPc);
    tr.appendChild(tdSpec);
    tr.appendChild(tdTitle);

    tbody.appendChild(tr);
  });
}

function exportMyScheduleCSV() {
  const session = getSession();
  const studentId = activeMyScheduleState.studentId || (session && session.id);
  if (!studentId) {
    window.location.href = "login.html";
    return;
  }

  const bookings = getStudentConfirmedAllocations(studentId);
  if (bookings.length === 0) {
    showToast("You have no booked slots yet.", "warning");
    return;
  }

  function escapeCsvCell(value) {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }

  const headers = ["Date", "Time", "PC number", "PC specification", "Project title"];
  const csvRows = [headers.map(escapeCsvCell).join(",")];

  bookings.forEach((b) => {
    csvRows.push(
      [b.slot_date, b.time, b.pc_number, b.pc_specification, b.project_title]
        .map(escapeCsvCell)
        .join(",")
    );
  });

  const csvContent = csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = `ResearchPC_My_Schedule_${normalizeStudentId(studentId)}.csv`;

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

  showToast(`Schedule exported as ${filename}`, "success");
}

/* ==========================================================================
   PROFILE PAGE MODULE (profile.html)
   ========================================================================== */

let activeProfileEditMode = false;

function populateProfileFields(student) {
  if (!student) return;
  const idEl = document.getElementById("profile_student_id");
  const nameEl = document.getElementById("profile_name");
  const emailEl = document.getElementById("profile_email");
  const phoneEl = document.getElementById("profile_phone");
  const deptEl = document.getElementById("profile_department");
  const batchEl = document.getElementById("profile_batch");

  if (idEl) idEl.value = student.student_id || "";
  if (nameEl) nameEl.value = student.name || "";
  if (emailEl) emailEl.value = student.email || "";
  if (phoneEl) phoneEl.value = student.phone || "";
  if (deptEl) deptEl.value = student.department || "";
  if (batchEl) batchEl.value = student.batch || "";
}

function setProfileEditable(isEditable) {
  activeProfileEditMode = !!isEditable;
  const editableIds = ["profile_phone", "profile_department", "profile_batch"];
  editableIds.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.readOnly = !activeProfileEditMode;
    if (!activeProfileEditMode) {
      el.setAttribute("readonly", "readonly");
    } else if (typeof el.removeAttribute === "function") {
      el.removeAttribute("readonly");
    }
  });

  const editBtn = document.getElementById("profile-edit-btn");
  const saveBtn = document.getElementById("profile-save-btn");
  const cancelBtn = document.getElementById("profile-cancel-btn");

  if (editBtn) editBtn.disabled = activeProfileEditMode;
  if (saveBtn) saveBtn.disabled = !activeProfileEditMode;
  if (cancelBtn) cancelBtn.style.display = activeProfileEditMode ? "inline-flex" : "none";
}

function initProfilePage() {
  const form = document.getElementById("profile-info-form");
  if (!form) return;

  const session = getSession();
  if (!session || session.role !== "student") {
    window.location.href = "login.html";
    return;
  }

  updateActiveSidebarItem();

  const student = findStudent(session.id);
  if (!student) {
    window.location.href = "login.html";
    return;
  }

  const topIdEl = document.getElementById("topbar-student-id");
  if (topIdEl) {
    topIdEl.textContent = student.name
      ? `${student.name} (${student.student_id || session.id})`
      : (student.student_id || session.id);
  }

  populateProfileFields(student);
  setProfileEditable(false);

  ["profile_phone", "profile_department", "profile_batch"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => FormValidator.clearError(el));
  });

  ["current_password", "new_password", "confirm_new_password"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => FormValidator.clearError(el));
  });

  const pwdForm = document.getElementById("change-password-form");
  if (pwdForm) {
    pwdForm.onsubmit = handleChangePasswordSubmit;
  }
}

function enableProfileEdit() {
  const infoErr = document.getElementById("profile-info-error");
  const infoSuccess = document.getElementById("profile-info-success");
  if (infoErr) {
    infoErr.textContent = "";
    infoErr.classList.remove("alert-visible");
  }
  if (infoSuccess) {
    infoSuccess.textContent = "";
    infoSuccess.classList.remove("alert-visible");
  }

  setProfileEditable(true);
  const phoneEl = document.getElementById("profile_phone");
  if (phoneEl && typeof phoneEl.focus === "function") {
    phoneEl.focus();
  }
}

function cancelProfileEdit() {
  const session = getSession();
  if (!session || session.role !== "student") {
    window.location.href = "login.html";
    return;
  }

  const student = findStudent(session.id);
  if (student) populateProfileFields(student);

  FormValidator.clearAll([
    document.getElementById("profile_phone"),
    document.getElementById("profile_department"),
    document.getElementById("profile_batch")
  ]);

  const infoErr = document.getElementById("profile-info-error");
  if (infoErr) {
    infoErr.textContent = "";
    infoErr.classList.remove("alert-visible");
  }

  setProfileEditable(false);
}

function saveProfileChanges(event) {
  if (event && event.preventDefault) event.preventDefault();

  const session = getSession();
  if (!session || session.role !== "student") {
    window.location.href = "login.html";
    return false;
  }

  if (!activeProfileEditMode) return false;

  const phoneEl = document.getElementById("profile_phone");
  const deptEl = document.getElementById("profile_department");
  const batchEl = document.getElementById("profile_batch");
  const infoErr = document.getElementById("profile-info-error");
  const infoSuccess = document.getElementById("profile-info-success");

  FormValidator.clearAll([phoneEl, deptEl, batchEl]);
  if (infoErr) {
    infoErr.textContent = "";
    infoErr.classList.remove("alert-visible");
  }
  if (infoSuccess) {
    infoSuccess.textContent = "";
    infoSuccess.classList.remove("alert-visible");
  }

  const phoneVal = (phoneEl ? phoneEl.value : "").trim();
  const deptVal = (deptEl ? deptEl.value : "").trim();
  const batchVal = (batchEl ? batchEl.value : "").trim();

  let hasErrors = false;
  if (!phoneVal) {
    FormValidator.showError(phoneEl, "Phone number is required.");
    hasErrors = true;
  }
  if (!deptVal) {
    FormValidator.showError(deptEl, "Department is required.");
    hasErrors = true;
  }
  if (!batchVal) {
    FormValidator.showError(batchEl, "Batch / Year is required.");
    hasErrors = true;
  }

  if (hasErrors) {
    if (infoErr) {
      infoErr.textContent = "Please fill in phone, department, and batch before saving.";
      infoErr.classList.add("alert-visible");
    }
    return false;
  }

  const studentsList = getData(STORAGE_KEYS.STUDENTS);
  const normId = normalizeStudentId(session.id);
  const idx = studentsList.findIndex((s) => normalizeStudentId(s.student_id) === normId);

  if (idx >= 0) {
    studentsList[idx] = {
      ...studentsList[idx],
      phone: phoneVal,
      department: deptVal,
      batch: batchVal
    };
  } else {
    const fallbackStudent = findStudent(session.id);
    if (!fallbackStudent) return false;
    studentsList.push({
      ...fallbackStudent,
      phone: phoneVal,
      department: deptVal,
      batch: batchVal
    });
  }

  saveData(STORAGE_KEYS.STUDENTS, studentsList);
  setProfileEditable(false);

  addActivityLog({
    action_type: "Profile Updated",
    category: "profile",
    actor_id: session.id,
    actor_role: "student",
    target_id: session.id,
    description: `Updated student profile (Phone: ${phoneVal}, Dept: ${deptVal}, Batch: ${batchVal}).`
  });

  if (infoSuccess) {
    infoSuccess.textContent = "Profile updated and saved successfully!";
    infoSuccess.classList.add("alert-visible");
  }
  showToast("Profile details saved.", "success");
  return false;
}

function handleChangePasswordSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();

  const session = getSession();
  if (!session || session.role !== "student") {
    window.location.href = "login.html";
    return false;
  }

  const currentEl = document.getElementById("current_password");
  const newEl = document.getElementById("new_password");
  const confirmEl = document.getElementById("confirm_new_password");
  const pwdErr = document.getElementById("profile-pwd-error");
  const pwdSuccess = document.getElementById("profile-pwd-success");

  FormValidator.clearAll([currentEl, newEl, confirmEl]);
  if (pwdErr) {
    pwdErr.textContent = "";
    pwdErr.classList.remove("alert-visible");
  }
  if (pwdSuccess) {
    pwdSuccess.textContent = "";
    pwdSuccess.classList.remove("alert-visible");
  }

  const student = findStudent(session.id);
  if (!student) {
    window.location.href = "login.html";
    return false;
  }

  const currentVal = (currentEl ? currentEl.value : "").trim();
  const newVal = (newEl ? newEl.value : "").trim();
  const confirmVal = (confirmEl ? confirmEl.value : "").trim();

  let errorMsg = "";

  if (!currentVal) {
    FormValidator.showError(currentEl, "Current password is required.");
    errorMsg = "Please enter your current password.";
  } else if (currentVal !== student.password_hash) {
    FormValidator.showError(currentEl, "Current password is incorrect.");
    errorMsg = "Current password is incorrect.";
  } else if (!newVal || newVal.length < 6) {
    FormValidator.showError(newEl, "New password must be at least 6 characters.");
    errorMsg = "New password must be at least 6 characters.";
  } else if (!confirmVal || newVal !== confirmVal) {
    FormValidator.showError(confirmEl, "New passwords do not match.");
    errorMsg = "New passwords do not match.";
  }

  if (errorMsg) {
    if (pwdErr) {
      pwdErr.textContent = errorMsg;
      pwdErr.classList.add("alert-visible");
    }
    return false;
  }

  // Save updated password in both rp_students and student password overrides
  const studentsList = getData(STORAGE_KEYS.STUDENTS);
  const normId = normalizeStudentId(student.student_id);
  const idx = studentsList.findIndex((s) => normalizeStudentId(s.student_id) === normId);
  if (idx >= 0) {
    studentsList[idx] = { ...studentsList[idx], password_hash: newVal };
    saveData(STORAGE_KEYS.STUDENTS, studentsList);
  }
  saveStudentPasswordOverride(student.student_id, newVal);

  addActivityLog({
    action_type: "Password Changed",
    category: "profile",
    actor_id: student.student_id,
    actor_name: student.name,
    actor_role: "student",
    target_id: student.student_id,
    description: `Student ${student.student_id} (${student.name}) changed account password via Profile settings.`
  });

  if (currentEl) currentEl.value = "";
  if (newEl) newEl.value = "";
  if (confirmEl) confirmEl.value = "";

  if (pwdSuccess) {
    pwdSuccess.textContent = "Password changed successfully!";
    pwdSuccess.classList.add("alert-visible");
  }
  showToast("Password updated successfully!", "success");
  return false;
}

/**
 * 3. admin-dashboard.html: read the session.
 * If missing or role is not "admin", redirect to admin-login.html.
 * Otherwise show admin name, four summary cards, and Recent Requests table with Approve & Reject buttons.
 */
function initAdminDashboard() {
  const session = getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "admin-login.html";
    return;
  }

  updateActiveSidebarItem();

  const adminList = getAdmins();
  const admin = adminList.find((a) => a.admin_id === session.id) || adminList[0];
  const adminName = admin && admin.name ? admin.name : "Md. Atik Ishrak";

  const adminNameEl = document.getElementById("topbar-admin-name");
  if (adminNameEl) {
    adminNameEl.textContent = adminName;
  }

  updateAdminMetrics();
  renderAdminRequests();
  renderAdminEmergencyRequests();
  renderAdminNotifications(session.id);
  initSlotAvailability("admin", session.id);
}

/* ==========================================================================
   F2. SUPERVISOR DASHBOARD ("supervisor-dashboard.html")
   ========================================================================== */

function initSupervisorDashboard() {
  const tbody = document.getElementById("supervisor-requests-tbody");
  if (!tbody) return;

  const session = getSession();
  if (!session || session.role !== "supervisor") {
    window.location.href = "supervisor-login.html";
    return;
  }

  if (!isValidSupervisorSession(session)) {
    clearSession();
    window.location.href = "supervisor-login.html";
    return;
  }

  updateActiveSidebarItem();

  const supervisorsList = getAllSupervisors();
  const supervisor = supervisorsList.find(
    (s) => String(s.supervisor_id) === String(session.id)
  );
  const supervisorName = supervisor && supervisor.name ? supervisor.name : "Supervisor";

  const topbarNameEl = document.getElementById("topbar-supervisor-name");
  if (topbarNameEl) topbarNameEl.textContent = supervisorName;

  const welcomeNameEl = document.getElementById("supervisor-welcome-name");
  if (welcomeNameEl) welcomeNameEl.textContent = supervisorName;

  renderSupervisorDashboard();
}

function renderSupervisorDashboard() {
  const tbody = document.getElementById("supervisor-requests-tbody");
  if (!tbody) return;

  const session = getSession();
  if (!session || session.role !== "supervisor") return;
  if (!isValidSupervisorSession(session)) {
    clearSession();
    window.location.href = "supervisor-login.html";
    return;
  }

  const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
  const assignedRequests = allRequests.filter(
    (r) =>
      r &&
      r.supervisor_id !== null &&
      r.supervisor_id !== undefined &&
      r.supervisor_id !== "" &&
      String(r.supervisor_id) === String(session.id)
  );

  const totalCount = assignedRequests.length;
  const pendingCount = assignedRequests.filter((r) => r.status === "Pending").length;
  const approvedCount = assignedRequests.filter((r) => r.status === "Approved").length;

  const totalEl = document.getElementById("sup-metric-total");
  if (totalEl) totalEl.textContent = String(totalCount);

  const pendingEl = document.getElementById("sup-metric-pending");
  if (pendingEl) pendingEl.textContent = String(pendingCount);

  const approvedEl = document.getElementById("sup-metric-approved");
  if (approvedEl) approvedEl.textContent = String(approvedCount);

  const noticeEl = document.getElementById("supervisor-requests-notice");
  if (noticeEl) {
    noticeEl.innerHTML = `
      <span class="badge-dot" style="background:${pendingCount > 0 ? "#f59e0b" : "#10b981"}; width:6px; height:6px; border-radius:50%; display:inline-block;" aria-hidden="true"></span>
      <strong>${pendingCount} Pending</strong> <span style="opacity:0.4; margin: 0 0.2rem;">&bull;</span> <span>${approvedCount} Approved</span>
    `;
    noticeEl.style.display = "inline-flex";
  }

  tbody.innerHTML = "";
  if (assignedRequests.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" class="table-empty-row">No requests assigned to you yet.</td>`;
    tbody.appendChild(tr);
    return;
  }

  assignedRequests.forEach((req) => {
    const tr = document.createElement("tr");
    tr.id = `supervisor-row-${req.request_id}`;

    const tdId = document.createElement("td");
    tdId.className = "tabular";
    tdId.style.fontWeight = "600";
    tdId.textContent = req.request_id || "-";

    const stu = findStudent(req.student_id);
    const tdStudent = document.createElement("td");
    tdStudent.innerHTML = stu
      ? `<span class="tabular" style="font-weight: 600;">${escapeHtml(req.student_id)}</span> &ndash; ${escapeHtml(stu.name || "-")}`
      : `<span class="tabular">${escapeHtml(req.student_id || "-")}</span>`;

    const tdTitle = document.createElement("td");
    tdTitle.style.fontWeight = "500";
    tdTitle.textContent = req.project_title || "-";

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createStatusBadge(req.status || "Pending"));

    tr.appendChild(tdId);
    tr.appendChild(tdStudent);
    tr.appendChild(tdTitle);
    tr.appendChild(tdStatus);
    tbody.appendChild(tr);
  });
}

let activeSupervisorRequestsState = {
  supervisorId: null,
  statusFilter: "ALL",
  searchQuery: "",
  selectedIds: new Set()
};

function getSupervisorAssignedRequests(supId) {
  const allRequests = getData(STORAGE_KEYS.REQUESTS, []);
  return allRequests.filter(
    (r) =>
      r &&
      r.supervisor_id !== null &&
      r.supervisor_id !== undefined &&
      r.supervisor_id !== "" &&
      String(r.supervisor_id) === String(supId)
  );
}

function getFilteredSupervisorRequests(supId) {
  const mine = getSupervisorAssignedRequests(supId);
  const statusFilter = activeSupervisorRequestsState.statusFilter || "ALL";
  const searchQuery = (activeSupervisorRequestsState.searchQuery || "").trim().toLowerCase();

  return mine.filter((req) => {
    if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
    if (searchQuery) {
      const stu = findStudent(req.student_id);
      const stuName = stu && stu.name ? stu.name : "";
      const hay = `${req.request_id || ""} ${req.student_id || ""} ${stuName} ${req.project_title || ""}`.toLowerCase();
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  });
}

function updateSupervisorBulkUI(visibleRequests) {
  const selectAllEl = document.getElementById("supervisor-select-all-checkbox");
  const countEl = document.getElementById("supervisor-bulk-selected-count");
  const bulkBtn = document.getElementById("supervisor-bulk-actions-btn");

  const visibleList = Array.isArray(visibleRequests) ? visibleRequests : [];
  const selectedIds = activeSupervisorRequestsState.selectedIds;
  const totalSelected = selectedIds.size;

  let visibleSelectedCount = 0;
  visibleList.forEach((req) => {
    if (selectedIds.has(req.request_id)) {
      visibleSelectedCount += 1;
    }
  });

  if (selectAllEl) {
    selectAllEl.disabled = visibleList.length === 0;
    selectAllEl.checked =
      visibleList.length > 0 && visibleSelectedCount === visibleList.length;
    selectAllEl.indeterminate =
      visibleSelectedCount > 0 && visibleSelectedCount < visibleList.length;
  }

  if (countEl) {
    countEl.textContent = `${totalSelected} selected`;
    countEl.classList.toggle("has-selection", totalSelected > 0);
  }

  if (bulkBtn) {
    bulkBtn.disabled = totalSelected === 0;
    if (totalSelected === 0) {
      closeSupervisorBulkMenu();
    }
  }
}

function toggleSupervisorBulkMenu(event) {
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }

  const menuEl = document.getElementById("supervisor-bulk-actions-menu");
  const btnEl = document.getElementById("supervisor-bulk-actions-btn");
  if (!menuEl || !btnEl || btnEl.disabled) return;

  const isOpen = menuEl.style.display === "block";
  if (isOpen) {
    closeSupervisorBulkMenu();
  } else {
    menuEl.style.display = "block";
    btnEl.setAttribute("aria-expanded", "true");
  }
}

function closeSupervisorBulkMenu() {
  const menuEl = document.getElementById("supervisor-bulk-actions-menu");
  const btnEl = document.getElementById("supervisor-bulk-actions-btn");
  if (menuEl) {
    menuEl.style.display = "none";
  }
  if (btnEl) {
    btnEl.setAttribute("aria-expanded", "false");
  }
}

function clearSupervisorSelection() {
  activeSupervisorRequestsState.selectedIds.clear();
  closeSupervisorBulkMenu();
  renderSupervisorRequestsPage();
}

function findAvailablePcSlotForApproval(req, allocationsList) {
  const pcs = getData(STORAGE_KEYS.PCS, []);
  const slots = getData(STORAGE_KEYS.SLOTS, []);
  const activePcs = pcs.filter(
    (p) => p && (!p.status || (p.status !== "Maintenance" && p.status !== "Inactive"))
  );
  const activeSlots = slots.filter((s) => s && s.status !== "Inactive");

  function isPairFree(pcId, slotId) {
    if (!pcId || !slotId) return false;
    const pcObj = activePcs.find((p) => p.pc_id === pcId);
    const slotObj = activeSlots.find((s) => s.slot_id === slotId);
    if (!pcObj || !slotObj) return false;
    return !allocationsList.some(
      (a) => a.pc_id === pcId && a.slot_id === slotId && isAllocationConfirmed(a)
    );
  }

  const defaultTarget =
    typeof DEFAULT_PENDING_TARGETS !== "undefined" && DEFAULT_PENDING_TARGETS[req.request_id]
      ? DEFAULT_PENDING_TARGETS[req.request_id]
      : {};
  const preferredPc = req.pc_id || defaultTarget.pc_id;
  const preferredSlot = req.slot_id || defaultTarget.slot_id;

  if (isPairFree(preferredPc, preferredSlot)) {
    return { pc_id: preferredPc, slot_id: preferredSlot };
  }

  // Prefer slots matching req.required_from date first, then any open active slot
  const sortedSlots = activeSlots.slice().sort((a, b) => {
    const aMatch = req.required_from && a.slot_date === req.required_from ? 0 : 1;
    const bMatch = req.required_from && b.slot_date === req.required_from ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    const dCmp = String(a.slot_date || "").localeCompare(String(b.slot_date || ""));
    if (dCmp !== 0) return dCmp;
    return String(a.start_time || "").localeCompare(String(b.start_time || ""));
  });

  for (let i = 0; i < sortedSlots.length; i += 1) {
    const slot = sortedSlots[i];
    for (let j = 0; j < activePcs.length; j += 1) {
      const pc = activePcs[j];
      if (isPairFree(pc.pc_id, slot.slot_id)) {
        return { pc_id: pc.pc_id, slot_id: slot.slot_id };
      }
    }
  }

  return null;
}

function handleSupervisorBulkAction(newStatus) {
  const session = getSession();
  if (!session || session.role !== "supervisor") {
    window.location.href = "supervisor-login.html";
    return;
  }
  if (!isValidSupervisorSession(session)) {
    clearSession();
    window.location.href = "supervisor-login.html";
    return;
  }
  if (newStatus !== "Approved" && newStatus !== "Rejected") return;

  const selectedIds = activeSupervisorRequestsState.selectedIds;
  if (!selectedIds || selectedIds.size === 0) {
    closeSupervisorBulkMenu();
    showToast("Please select at least one request first.", "info");
    return;
  }

  const requests = getData(STORAGE_KEYS.REQUESTS, []);
  let allocations = getData(STORAGE_KEYS.ALLOCATIONS, []);
  const slots = getData(STORAGE_KEYS.SLOTS, []);

  let updatedCount = 0;
  let unchangedCount = 0;
  const allocatedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
  const actorId = String(session.id);

  // Track numeric offset for sequential allocation IDs generated inside this batch
  let maxAlNum = 0;
  allocations.forEach((a) => {
    const m = String((a && a.allocation_id) || "").match(/^AL(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxAlNum) maxAlNum = n;
    }
  });

  requests.forEach((req) => {
    if (
      !req ||
      !selectedIds.has(req.request_id) ||
      String(req.supervisor_id) !== actorId
    ) {
      return;
    }

    if (req.status === newStatus) {
      unchangedCount += 1;
      return;
    }

    req.status = newStatus;
    updatedCount += 1;

    if (newStatus === "Approved") {
      const existingAlloc = allocations.find(
        (a) => a.request_id === req.request_id && isAllocationConfirmed(a)
      );
      let assignedPair = existingAlloc
        ? { pc_id: existingAlloc.pc_id, slot_id: existingAlloc.slot_id }
        : null;

      if (!assignedPair) {
        const candidate = findAvailablePcSlotForApproval(req, allocations);
        if (candidate) {
          maxAlNum += 1;
          const allocId = `AL${String(maxAlNum).padStart(2, "0")}`;
          allocations.push({
            allocation_id: allocId,
            request_id: req.request_id,
            pc_id: candidate.pc_id,
            slot_id: candidate.slot_id,
            allocated_by: actorId,
            allocated_at: allocatedAt,
            status: "Confirmed"
          });
          assignedPair = candidate;
        }
      }

      const assignedSlotObj = assignedPair
        ? slots.find((s) => s.slot_id === assignedPair.slot_id)
        : null;

      addActivityLog({
        action_type: "Request Approved",
        category: "request",
        actor_id: actorId,
        actor_role: "supervisor",
        target_id: req.request_id,
        description: assignedPair
          ? `Supervisor bulk-approved request ${req.request_id} ("${req.project_title}") and assigned ${assignedPair.pc_id} for slot ${assignedPair.slot_id}.`
          : `Supervisor bulk-approved request ${req.request_id} ("${req.project_title}").`
      });

      addNotificationRecord({
        target_role: "student",
        target_id: req.student_id,
        title: `Your request ${req.request_id} was approved`,
        meta: assignedPair
          ? `Assigned ${assignedPair.pc_id}${assignedSlotObj ? ` on ${assignedSlotObj.slot_date} (${assignedSlotObj.start_time} - ${assignedSlotObj.end_time})` : ""}`
          : `${req.project_title} · Approved by supervisor (workstation assignment pending).`
      });
    } else if (newStatus === "Rejected") {
      allocations = allocations.filter((a) => a.request_id !== req.request_id);

      addActivityLog({
        action_type: "Request Rejected",
        category: "request",
        actor_id: actorId,
        actor_role: "supervisor",
        target_id: req.request_id,
        description: `Supervisor bulk-rejected request ${req.request_id} ("${req.project_title}") submitted by ${req.student_id}.`
      });

      addNotificationRecord({
        target_role: "student",
        target_id: req.student_id,
        title: `Request ${req.request_id} was not approved`,
        meta: `${req.project_title} · Rejected by supervisor. Please review requirements.`
      });
    }
  });

  if (updatedCount > 0) {
    saveData(STORAGE_KEYS.REQUESTS, requests);
    saveData(STORAGE_KEYS.ALLOCATIONS, allocations);
  }

  activeSupervisorRequestsState.selectedIds.clear();
  closeSupervisorBulkMenu();

  renderSupervisorRequestsPage();
  if (typeof renderSupervisorDashboard === "function") {
    renderSupervisorDashboard();
  }
  if (typeof renderSlotGrid === "function") {
    renderSlotGrid();
  }

  if (updatedCount === 0 && unchangedCount > 0) {
    showToast(`Selected requests are already marked ${newStatus}.`, "info");
  } else if (updatedCount > 0) {
    const verb = newStatus === "Approved" ? "Approved" : "Rejected";
    const noun = updatedCount === 1 ? "request" : "requests";
    const suffix =
      unchangedCount > 0 ? ` (${unchangedCount} already ${newStatus})` : "";
    showToast(`${verb} ${updatedCount} selected ${noun}${suffix}.`, newStatus === "Approved" ? "success" : "info");
  }
}

function initSupervisorRequestsPage() {
  const tbody = document.getElementById("supervisor-page-requests-tbody");
  if (!tbody) return;

  const session = getSession();
  if (!session || session.role !== "supervisor") {
    window.location.href = "supervisor-login.html";
    return;
  }

  if (!isValidSupervisorSession(session)) {
    clearSession();
    window.location.href = "supervisor-login.html";
    return;
  }

  activeSupervisorRequestsState.supervisorId = session.id;
  activeSupervisorRequestsState.statusFilter = "ALL";
  activeSupervisorRequestsState.searchQuery = "";
  activeSupervisorRequestsState.selectedIds = new Set();

  updateActiveSidebarItem();

  const supervisorsList = getAllSupervisors();
  const supervisor = supervisorsList.find(
    (s) => String(s.supervisor_id) === String(session.id)
  );
  const supervisorName = supervisor && supervisor.name ? supervisor.name : "Supervisor";

  const topbarNameEl = document.getElementById("topbar-supervisor-name");
  if (topbarNameEl) topbarNameEl.textContent = supervisorName;

  const statusFilterEl = document.getElementById("supervisor-requests-status-filter");
  if (statusFilterEl) {
    statusFilterEl.value = "ALL";
    statusFilterEl.onchange = function () {
      activeSupervisorRequestsState.statusFilter = this.value || "ALL";
      renderSupervisorRequestsPage();
    };
  }

  const searchInput = document.getElementById("supervisor-requests-search-input");
  const clearBtn = document.getElementById("supervisor-requests-clear-search");
  if (searchInput) {
    searchInput.value = "";
    if (clearBtn) clearBtn.style.display = "none";

    searchInput.oninput = function () {
      activeSupervisorRequestsState.searchQuery = (this.value || "").trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = this.value ? "inline" : "none";
      renderSupervisorRequestsPage();
    };

    if (clearBtn) {
      clearBtn.onclick = function () {
        searchInput.value = "";
        activeSupervisorRequestsState.searchQuery = "";
        clearBtn.style.display = "none";
        searchInput.focus();
        renderSupervisorRequestsPage();
      };
    }
  }

  const selectAllEl = document.getElementById("supervisor-select-all-checkbox");
  if (selectAllEl) {
    selectAllEl.onchange = function () {
      const currSession = getSession();
      if (!currSession || currSession.role !== "supervisor") return;
      const visible = getFilteredSupervisorRequests(currSession.id);
      const shouldSelect = Boolean(this.checked);
      visible.forEach((req) => {
        if (shouldSelect) {
          activeSupervisorRequestsState.selectedIds.add(req.request_id);
        } else {
          activeSupervisorRequestsState.selectedIds.delete(req.request_id);
        }
      });

      const checkboxes = tbody.querySelectorAll(".supervisor-row-checkbox");
      checkboxes.forEach((cb) => {
        cb.checked = shouldSelect;
        const row = cb.closest("tr");
        if (row) row.classList.toggle("row-selected", shouldSelect);
      });
      updateSupervisorBulkUI(visible);
    };
  }

  if (!window._rpSupBulkMenuBound) {
    window._rpSupBulkMenuBound = true;
    document.addEventListener("click", function (e) {
      const wrap = document.getElementById("supervisor-bulk-actions-wrap");
      if (wrap && !wrap.contains(e.target)) {
        closeSupervisorBulkMenu();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeSupervisorBulkMenu();
      }
    });
  }

  renderSupervisorRequestsPage();
}

function renderSupervisorRequestsPage() {
  const tbody = document.getElementById("supervisor-page-requests-tbody");
  if (!tbody) return;

  const session = getSession();
  if (!session || session.role !== "supervisor") {
    window.location.href = "supervisor-login.html";
    return;
  }
  if (!isValidSupervisorSession(session)) {
    clearSession();
    window.location.href = "supervisor-login.html";
    return;
  }

  const supId = session.id;
  if (
    activeSupervisorRequestsState.supervisorId !== null &&
    String(activeSupervisorRequestsState.supervisorId) !== String(supId)
  ) {
    activeSupervisorRequestsState.selectedIds.clear();
  }
  activeSupervisorRequestsState.supervisorId = supId;

  const mine = getSupervisorAssignedRequests(supId);
  const mineIds = new Set(mine.map((r) => r.request_id));
  Array.from(activeSupervisorRequestsState.selectedIds).forEach((id) => {
    if (!mineIds.has(id)) {
      activeSupervisorRequestsState.selectedIds.delete(id);
    }
  });

  const noticeEl = document.getElementById("supervisor-page-requests-notice");
  if (noticeEl) {
    const pendingCount = mine.filter((r) => r.status === "Pending").length;
    const approvedCount = mine.filter((r) => r.status === "Approved").length;
    noticeEl.innerHTML = `
      <strong>${mine.length}</strong> Total
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${pendingCount}</strong> Pending
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${approvedCount}</strong> Approved
    `;
    noticeEl.style.display = "inline-flex";
  }

  const filtered = getFilteredSupervisorRequests(supId);

  tbody.innerHTML = "";
  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="8" class="table-empty-row">No matching student requests found.</td>`;
    tbody.appendChild(tr);
    updateSupervisorBulkUI(filtered);
    return;
  }

  filtered.forEach((req) => {
    const isChecked = activeSupervisorRequestsState.selectedIds.has(req.request_id);
    const tr = document.createElement("tr");
    tr.id = `sup-page-row-${req.request_id}`;
    if (isChecked) {
      tr.classList.add("row-selected");
    }

    const tdSelect = document.createElement("td");
    tdSelect.className = "col-checkbox";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "table-checkbox supervisor-row-checkbox";
    checkbox.value = req.request_id;
    checkbox.checked = isChecked;
    checkbox.setAttribute("aria-label", `Select request ${req.request_id}`);
    checkbox.onchange = function () {
      if (this.checked) {
        activeSupervisorRequestsState.selectedIds.add(req.request_id);
      } else {
        activeSupervisorRequestsState.selectedIds.delete(req.request_id);
      }
      tr.classList.toggle("row-selected", this.checked);
      updateSupervisorBulkUI(filtered);
    };
    tdSelect.appendChild(checkbox);

    const tdId = document.createElement("td");
    tdId.className = "tabular";
    tdId.style.fontWeight = "600";
    tdId.textContent = req.request_id || "-";

    const stu = findStudent(req.student_id);
    const tdStudent = document.createElement("td");
    tdStudent.innerHTML = stu
      ? `<span class="tabular" style="font-weight: 600;">${escapeHtml(req.student_id)}</span> &ndash; ${escapeHtml(stu.name || "-")}`
      : `<span class="tabular">${escapeHtml(req.student_id || "-")}</span>`;

    const tdTitle = document.createElement("td");
    tdTitle.style.fontWeight = "500";
    tdTitle.textContent = req.project_title || "-";

    const tdPriority = document.createElement("td");
    tdPriority.textContent = req.priority || "Normal";

    const tdDates = document.createElement("td");
    tdDates.className = "tabular";
    tdDates.style.color = "var(--color-text-muted)";
    if (req.required_from && req.required_to && req.required_from !== req.required_to) {
      tdDates.textContent = `${req.required_from} → ${req.required_to}`;
    } else {
      tdDates.textContent = req.required_from || req.required_to || req.created_at || "-";
    }

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createStatusBadge(req.status || "Pending"));

    const tdAction = document.createElement("td");
    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn btn-outline btn-sm";
    viewBtn.textContent = "View";
    viewBtn.onclick = () => openRequestDetail(req.request_id);
    tdAction.appendChild(viewBtn);

    tr.appendChild(tdSelect);
    tr.appendChild(tdId);
    tr.appendChild(tdStudent);
    tr.appendChild(tdTitle);
    tr.appendChild(tdPriority);
    tr.appendChild(tdDates);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  });

  updateSupervisorBulkUI(filtered);
}

/* ==========================================================================
   F3. EMERGENCY REQUEST PAGE ("emergency-request.html")
   ========================================================================== */

function initEmergencyRequestPage() {
  const form = document.getElementById("emergency-request-form");
  if (!form) return;

  const session = getSession();
  if (!session || session.role !== "supervisor") {
    window.location.href = "supervisor-login.html";
    return;
  }

  if (!isValidSupervisorSession(session)) {
    clearSession();
    window.location.href = "supervisor-login.html";
    return;
  }

  updateActiveSidebarItem();

  const supervisorsList = getAllSupervisors();
  const supervisor = supervisorsList.find(
    (s) => String(s.supervisor_id) === String(session.id)
  );
  const supervisorName = supervisor && supervisor.name ? supervisor.name : "Supervisor";

  const topbarNameEl = document.getElementById("topbar-supervisor-name");
  if (topbarNameEl) topbarNameEl.textContent = supervisorName;

  populateSupervisorEmergencyRequestDropdown(session.id);

  const todayStr = getTodayLocalDateStr();
  const dateInput = document.getElementById("required_date");
  if (dateInput) dateInput.min = todayStr;

  ["request_id", "reason", "required_date", "required_time"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.tagName === "SELECT" || el.type === "date" || el.type === "time" ? "change" : "input";
    el.addEventListener(evt, () => FormValidator.clearError(el));
  });

  form.onsubmit = handleEmergencyRequestSubmit;
  renderSupervisorEmergencyTable();
}

function populateSupervisorEmergencyRequestDropdown(supervisorId) {
  const selectEl = document.getElementById("request_id");
  if (!selectEl) return;

  const prevValue = selectEl.value;
  const requests = getData(STORAGE_KEYS.REQUESTS, []);
  const mine = requests.filter(
    (r) =>
      r &&
      r.supervisor_id !== null &&
      r.supervisor_id !== undefined &&
      r.supervisor_id !== "" &&
      String(r.supervisor_id) === String(supervisorId)
  );

  const signature = mine.map((r) => `${r.request_id}:${r.status}`).join("|");
  if (selectEl.dataset && selectEl.dataset.supSignature === signature) {
    return;
  }

  selectEl.innerHTML = '<option value="">-- Select Assigned Request --</option>';
  mine.forEach((req) => {
    const opt = document.createElement("option");
    opt.value = req.request_id;
    opt.textContent = `${req.request_id} - ${req.project_title} (${req.status})`;
    selectEl.appendChild(opt);
  });

  if (prevValue && mine.some((r) => r.request_id === prevValue)) {
    selectEl.value = prevValue;
  }
  if (selectEl.dataset) {
    selectEl.dataset.supSignature = signature;
  }
}

function handleEmergencyRequestSubmit(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  const session = getSession();
  if (!session || session.role !== "supervisor") {
    window.location.href = "supervisor-login.html";
    return false;
  }

  const reqSelect = document.getElementById("request_id");
  const reasonInput = document.getElementById("reason");
  const dateInput = document.getElementById("required_date");
  const timeInput = document.getElementById("required_time");
  const successAlert = document.getElementById("emergency-success-alert");

  const allInputs = [reqSelect, reasonInput, dateInput, timeInput];
  FormValidator.clearAll(allInputs);
  if (successAlert) {
    successAlert.textContent = "";
    successAlert.classList.remove("alert-visible");
  }

  const request_id = (reqSelect ? reqSelect.value : "").trim();
  const reason = (reasonInput ? reasonInput.value : "").trim();
  const required_date = (dateInput ? dateInput.value : "").trim();
  const required_time = (timeInput ? timeInput.value : "").trim();

  let hasErrors = false;
  let firstErrorEl = null;

  function markError(el, msg) {
    if (!firstErrorEl) firstErrorEl = el;
    FormValidator.showError(el, msg);
    hasErrors = true;
  }

  if (!request_id) markError(reqSelect, "Please select one of your requests.");
  if (!reason) markError(reasonInput, "Emergency reason is required.");

  const todayStr = getTodayLocalDateStr();
  if (!required_date) {
    markError(dateInput, "Required date is required.");
  } else if (required_date < todayStr) {
    markError(dateInput, "Required date cannot be in the past.");
  }

  if (!required_time) {
    markError(timeInput, "Required time is required.");
  }

  if (hasErrors) {
    if (firstErrorEl && typeof firstErrorEl.focus === "function") {
      firstErrorEl.focus();
    }
    return false;
  }

  const emergencies = getData(STORAGE_KEYS.EMERGENCY, []);
  const newEmergency = {
    emergency_id: nextId(STORAGE_KEYS.EMERGENCY, "E", "emergency_id"),
    request_id: request_id,
    reason: reason,
    required_date: required_date,
    required_time: required_time,
    status: "Pending",
    created_at: todayStr
  };

  emergencies.unshift(newEmergency);
  saveData(STORAGE_KEYS.EMERGENCY, emergencies);

  addActivityLog({
    action_type: "Emergency Request Submitted",
    category: "request",
    actor_id: String(session.id),
    actor_role: "supervisor",
    target_id: newEmergency.emergency_id,
    description: `Submitted emergency request ${newEmergency.emergency_id} for ${request_id} (${required_date} ${required_time}).`
  });

  addNotificationRecord({
    target_role: "admin",
    target_id: "AD01",
    title: `Emergency request ${newEmergency.emergency_id} awaits review`,
    meta: `Request ${request_id} flagged for ${required_date} at ${required_time}`
  });

  if (successAlert) {
    successAlert.textContent = `Emergency request ${newEmergency.emergency_id} submitted successfully (Pending review).`;
    successAlert.classList.add("alert-visible");
  }

  const formEl = document.getElementById("emergency-request-form");
  if (formEl && typeof formEl.reset === "function") {
    formEl.reset();
  }
  populateSupervisorEmergencyRequestDropdown(session.id);
  renderSupervisorEmergencyTable();
  showToast(`Emergency request ${newEmergency.emergency_id} submitted.`, "success");
  return false;
}

function renderSupervisorEmergencyTable() {
  const tbody = document.getElementById("supervisor-emergency-tbody");
  if (!tbody) return;

  const session = getSession();
  if (!session || session.role !== "supervisor") return;

  const requests = getData(STORAGE_KEYS.REQUESTS, []);
  const myRequestIds = new Set(
    requests
      .filter((r) => r && String(r.supervisor_id) === String(session.id))
      .map((r) => r.request_id)
  );

  const emergencies = getData(STORAGE_KEYS.EMERGENCY, []);
  const myEmergencies = emergencies.filter(
    (e) => e && myRequestIds.has(e.request_id)
  );

  const noticeEl = document.getElementById("supervisor-emergency-notice");
  if (noticeEl) {
    const pendingCount = myEmergencies.filter((e) => e.status === "Pending").length;
    const approvedCount = myEmergencies.filter((e) => e.status === "Approved").length;
    noticeEl.innerHTML = `
      <strong>${myEmergencies.length}</strong> Total
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${pendingCount}</strong> Pending
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${approvedCount}</strong> Approved
    `;
    noticeEl.style.display = "inline-flex";
  }

  tbody.innerHTML = "";
  if (myEmergencies.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" class="table-empty-row">No emergency requests submitted yet.</td>`;
    tbody.appendChild(tr);
    return;
  }

  myEmergencies.forEach((em) => {
    const tr = document.createElement("tr");
    tr.id = `sup-emergency-row-${em.emergency_id}`;

    const tdId = document.createElement("td");
    tdId.className = "tabular";
    tdId.style.fontWeight = "600";
    tdId.textContent = em.emergency_id || "-";

    const tdReq = document.createElement("td");
    tdReq.className = "tabular";
    tdReq.textContent = em.request_id || "-";

    const tdReason = document.createElement("td");
    tdReason.textContent = em.reason || "-";

    const tdDate = document.createElement("td");
    tdDate.className = "tabular";
    tdDate.textContent = em.required_date || "-";

    const tdTime = document.createElement("td");
    tdTime.className = "tabular";
    tdTime.textContent = em.required_time || "-";

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createStatusBadge(em.status || "Pending"));

    tr.appendChild(tdId);
    tr.appendChild(tdReq);
    tr.appendChild(tdReason);
    tr.appendChild(tdDate);
    tr.appendChild(tdTime);
    tr.appendChild(tdStatus);
    tbody.appendChild(tr);
  });
}

function updateAdminMetrics() {
  const requests = getData(STORAGE_KEYS.REQUESTS);
  const emergencies = getData(STORAGE_KEYS.EMERGENCY);
  const pcs = getData(STORAGE_KEYS.PCS);
  const slots = getData(STORAGE_KEYS.SLOTS);

  const reqCountEl = document.getElementById("metric-student-requests");
  if (reqCountEl) reqCountEl.textContent = requests.length.toString();

  const emergencyCountEl = document.getElementById("metric-emergency-requests");
  if (emergencyCountEl) emergencyCountEl.textContent = emergencies.length.toString();

  const pcCountEl = document.getElementById("metric-pcs");
  if (pcCountEl) pcCountEl.textContent = pcs.length.toString();

  const slotCountEl = document.getElementById("metric-time-slots");
  if (slotCountEl) slotCountEl.textContent = slots.length.toString();
}

function updateAdminRequestsNotice() {
  const noticeEl = document.getElementById("admin-requests-notice");
  if (!noticeEl) return;

  const requests = getData(STORAGE_KEYS.REQUESTS);
  const pending = requests.filter((r) => r.status === "Pending").length;
  const approved = requests.filter((r) => r.status === "Approved").length;
  const rejected = requests.filter((r) => r.status === "Rejected").length;

  noticeEl.innerHTML = `
    <span class="badge-dot" style="background:${pending > 0 ? '#f59e0b' : '#10b981'}; width:6px; height:6px; border-radius:50%; display:inline-block;" aria-hidden="true"></span>
    <strong>${pending} Pending</strong> in queue <span style="opacity:0.4; margin: 0 0.2rem;">&bull;</span> <span>${approved} Approved, ${rejected} Rejected</span>
  `;
  noticeEl.style.display = "inline-flex";
}

function renderAdminRequests() {
  const tbody = document.getElementById("admin-requests-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  updateAdminRequestsNotice();

  const requests = getData(STORAGE_KEYS.REQUESTS);
  requests.forEach((req) => {
    const tr = document.createElement("tr");
    tr.id = `admin-row-${req.request_id}`;

    const tdId = document.createElement("td");
    tdId.className = "tabular";
    tdId.textContent = req.request_id;

    const tdStudent = document.createElement("td");
    tdStudent.className = "tabular";
    tdStudent.style.color = "var(--color-text-muted)";
    tdStudent.textContent = req.student_id;

    const tdTitle = document.createElement("td");
    tdTitle.style.fontWeight = "600";
    tdTitle.textContent = req.project_title;

    const tdStatus = document.createElement("td");
    tdStatus.id = `status-cell-${req.request_id}`;
    tdStatus.appendChild(createStatusBadge(req.status));

    const tdAction = document.createElement("td");
    tdAction.id = `action-cell-${req.request_id}`;

    const actionWrap = document.createElement("div");
    actionWrap.className = "action-buttons";

    if (req.status === "Pending") {
      const btnApprove = document.createElement("button");
      btnApprove.type = "button";
      btnApprove.className = "btn-approve";
      btnApprove.textContent = "Approve";
      btnApprove.onclick = () => adminSetStatus(req.request_id, "Approved");

      const btnReject = document.createElement("button");
      btnReject.type = "button";
      btnReject.className = "btn-reject";
      btnReject.textContent = "Reject";
      btnReject.onclick = () => adminSetStatus(req.request_id, "Rejected");

      actionWrap.appendChild(btnApprove);
      actionWrap.appendChild(btnReject);
    } else {
      const resolvedSpan = document.createElement("span");
      resolvedSpan.style.fontSize = "0.75rem";
      resolvedSpan.style.color = "var(--color-text-subtle)";
      resolvedSpan.style.marginRight = "0.5rem";
      resolvedSpan.textContent = req.status;
      actionWrap.appendChild(resolvedSpan);
    }

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn btn-outline btn-sm";
    viewBtn.textContent = "View";
    viewBtn.onclick = () => openRequestDetail(req.request_id);
    actionWrap.appendChild(viewBtn);

    tdAction.appendChild(actionWrap);

    tr.appendChild(tdId);
    tr.appendChild(tdStudent);
    tr.appendChild(tdTitle);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function renderAdminEmergencyRequests() {
  const tbody = document.getElementById("admin-emergency-tbody");
  if (!tbody) return;

  const emergencies = getData(STORAGE_KEYS.EMERGENCY, []);
  const requests = getData(STORAGE_KEYS.REQUESTS, []);
  const supervisors = getAllSupervisors();

  const noticeEl = document.getElementById("admin-emergency-notice");
  if (noticeEl) {
    const pending = emergencies.filter((e) => e && e.status === "Pending").length;
    const approved = emergencies.filter((e) => e && e.status === "Approved").length;
    const rejected = emergencies.filter((e) => e && e.status === "Rejected").length;
    noticeEl.innerHTML = `
      <span class="badge-dot" style="background:${pending > 0 ? "#f59e0b" : "#10b981"}; width:6px; height:6px; border-radius:50%; display:inline-block;" aria-hidden="true"></span>
      <strong>${pending} Pending</strong> <span style="opacity:0.4; margin: 0 0.2rem;">&bull;</span> <span>${approved} Approved, ${rejected} Rejected</span>
    `;
    noticeEl.style.display = "inline-flex";
  }

  tbody.innerHTML = "";
  if (emergencies.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" class="table-empty-row">No emergency requests yet.</td>`;
    tbody.appendChild(tr);
    return;
  }

  emergencies.forEach((em) => {
    const tr = document.createElement("tr");
    tr.id = `admin-emergency-row-${em.emergency_id}`;

    const linkedReq = requests.find((r) => r.request_id === em.request_id);
    const linkedSup = linkedReq
      ? supervisors.find((s) => String(s.supervisor_id) === String(linkedReq.supervisor_id))
      : null;

    const tdId = document.createElement("td");
    tdId.className = "tabular";
    tdId.style.fontWeight = "600";
    tdId.textContent = em.emergency_id || "-";

    const tdReq = document.createElement("td");
    tdReq.className = "tabular";
    tdReq.textContent = em.request_id || "-";

    const tdReason = document.createElement("td");
    const supPrefix = linkedSup ? `<strong>${escapeHtml(linkedSup.name)}</strong>: ` : "";
    tdReason.innerHTML = `${supPrefix}${escapeHtml(em.reason || "-")}`;

    const tdDateTime = document.createElement("td");
    tdDateTime.className = "tabular";
    tdDateTime.textContent = `${em.required_date || "-"} ${em.required_time || ""}`.trim();

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createStatusBadge(em.status || "Pending"));

    const tdAction = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "action-buttons";

    if (em.status === "Pending") {
      const btnApprove = document.createElement("button");
      btnApprove.type = "button";
      btnApprove.className = "btn-approve";
      btnApprove.textContent = "Approve";
      btnApprove.onclick = () => adminSetEmergencyStatus(em.emergency_id, "Approved");

      const btnReject = document.createElement("button");
      btnReject.type = "button";
      btnReject.className = "btn-reject";
      btnReject.textContent = "Reject";
      btnReject.onclick = () => adminSetEmergencyStatus(em.emergency_id, "Rejected");

      actionWrap.appendChild(btnApprove);
      actionWrap.appendChild(btnReject);
    } else {
      const resolvedSpan = document.createElement("span");
      resolvedSpan.style.fontSize = "0.75rem";
      resolvedSpan.style.color = "var(--color-text-subtle)";
      resolvedSpan.textContent = em.status;
      actionWrap.appendChild(resolvedSpan);
    }

    tdAction.appendChild(actionWrap);

    tr.appendChild(tdId);
    tr.appendChild(tdReq);
    tr.appendChild(tdReason);
    tr.appendChild(tdDateTime);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  });
}

function adminSetEmergencyStatus(emergencyId, newStatus) {
  if (newStatus !== "Approved" && newStatus !== "Rejected") return;
  const emergencies = getData(STORAGE_KEYS.EMERGENCY, []);
  const idx = emergencies.findIndex((e) => e && e.emergency_id === emergencyId);
  if (idx === -1) return;

  emergencies[idx] = { ...emergencies[idx], status: newStatus };
  saveData(STORAGE_KEYS.EMERGENCY, emergencies);

  const session = getSession();
  const adminId = session && session.role === "admin" ? session.id : "AD01";
  addActivityLog({
    action_type: newStatus === "Approved" ? "Emergency Approved" : "Emergency Rejected",
    category: "request",
    actor_id: adminId,
    actor_role: "admin",
    target_id: emergencyId,
    description: `Marked emergency request ${emergencyId} (for ${emergencies[idx].request_id}) as ${newStatus}.`
  });

  updateAdminMetrics();
  renderAdminEmergencyRequests();
  showToast(
    `Emergency request ${emergencyId} marked ${newStatus}.`,
    newStatus === "Approved" ? "success" : "warning"
  );
}

/**
 * Admin status setter: updates request status, synchronizes active allocations, and refreshes the slot grid.
 */
window.adminSetStatus = function(requestId, newStatus) {
  const requests = getData(STORAGE_KEYS.REQUESTS);
  let allocations = getData(STORAGE_KEYS.ALLOCATIONS);
  const req = requests.find((r) => r.request_id === requestId);
  if (!req) return;

  if (newStatus === "Approved") {
    const defaultTarget = DEFAULT_PENDING_TARGETS[req.request_id] || {};
    const targetPc = req.pc_id || defaultTarget.pc_id || "PC02";
    const targetSlot = req.slot_id || defaultTarget.slot_id || "SLOT_1_3";

    // Double-booking check: admin should not be able to assign the same PC and same slot twice
    const alreadyBooked = allocations.find(
      (a) => a.pc_id === targetPc && a.slot_id === targetSlot && isAllocationConfirmed(a)
    );

    if (alreadyBooked) {
      showToast("This PC is already booked for this time slot.", "error");
      return;
    }

    req.status = "Approved";

    const session = getSession();
    const allocatedBy = (session && session.role === "admin" && session.id) ? session.id : "AD01";
    const allocatedAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    const newAlloc = {
      allocation_id: nextId(STORAGE_KEYS.ALLOCATIONS, "AL", "allocation_id"),
      request_id: req.request_id,
      pc_id: targetPc,
      slot_id: targetSlot,
      allocated_by: allocatedBy,
      allocated_at: allocatedAt,
      status: "Confirmed"
    };
    allocations.push(newAlloc);

    saveData(STORAGE_KEYS.REQUESTS, requests);
    saveData(STORAGE_KEYS.ALLOCATIONS, allocations);

    addActivityLog({
      action_type: "Request Approved",
      category: "request",
      actor_id: allocatedBy,
      actor_role: "admin",
      target_id: req.request_id,
      description: `Approved request ${req.request_id} ("${req.project_title}") and assigned ${targetPc} for slot ${targetSlot}.`
    });

    const assignedSlotObj = getData(STORAGE_KEYS.SLOTS, []).find((s) => s.slot_id === targetSlot);
    addNotificationRecord({
      target_role: "student",
      target_id: req.student_id,
      title: `Your request ${req.request_id} was approved`,
      meta: `Assigned ${targetPc}${assignedSlotObj ? ` on ${assignedSlotObj.slot_date} (${assignedSlotObj.start_time} - ${assignedSlotObj.end_time})` : ""}`
    });

    showToast(`Notification: Request ${requestId} approved and workstation slot allocated.`, "success");
  } else if (newStatus === "Rejected") {
    req.status = "Rejected";

    // If an allocation existed for this request, remove it
    allocations = allocations.filter(
      (a) => a.request_id !== req.request_id
    );

    saveData(STORAGE_KEYS.REQUESTS, requests);
    saveData(STORAGE_KEYS.ALLOCATIONS, allocations);

    const session = getSession();
    const actorId = (session && session.role === "admin" && session.id) ? session.id : "AD01";
    addActivityLog({
      action_type: "Request Rejected",
      category: "request",
      actor_id: actorId,
      actor_role: "admin",
      target_id: req.request_id,
      description: `Rejected request ${req.request_id} ("${req.project_title}") submitted by ${req.student_id}.`
    });

    addNotificationRecord({
      target_role: "student",
      target_id: req.student_id,
      title: `Request ${req.request_id} was not approved`,
      meta: `${req.project_title} · Please review requirements or contact lab admin.`
    });

    showToast(`Notification: Request ${requestId} rejected.`, "info");
  }

  const statusCell = document.getElementById(`status-cell-${requestId}`);
  const actionCell = document.getElementById(`action-cell-${requestId}`);

  if (statusCell) {
    statusCell.innerHTML = "";
    statusCell.appendChild(createStatusBadge(newStatus));
  }

  if (actionCell) {
    actionCell.innerHTML = `
      <div class="action-buttons">
        <span style="font-size: 0.75rem; color: var(--color-text-subtle); margin-right: 0.5rem;">${newStatus}</span>
        <button type="button" class="btn btn-outline btn-sm" onclick="openRequestDetail('${requestId}')">View</button>
      </div>
    `;
  }

  updateAdminMetrics();
  updateAdminRequestsNotice();
  renderSlotGrid();
  if (typeof renderAdminRequestsManageTable === "function") {
    renderAdminRequestsManageTable();
  }
  if (typeof renderHomeOverview === "function") {
    renderHomeOverview();
  }
};

/* ==========================================================================
   ADMIN REQUESTS MANAGEMENT MODULE (admin-requests.html)
   ========================================================================== */

let activeAdminRequestsState = {
  adminId: null,
  statusFilter: "ALL",
  priorityFilter: "ALL",
  searchQuery: "",
  approvingRequestId: null,
  rejectingRequestId: null
};

function initAdminRequestsPage() {
  const tbody = document.getElementById("admin-manage-requests-tbody");
  if (!tbody) return;

  const session = getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "admin-login.html";
    return;
  }

  activeAdminRequestsState.adminId = session.id;
  updateActiveSidebarItem();

  const adminList = getAdmins();
  const admin = adminList.find((a) => a.admin_id === session.id) || adminList[0];
  const adminName = admin && admin.name ? admin.name : "Md. Atik Ishrak";
  const adminNameEl = document.getElementById("topbar-admin-name");
  if (adminNameEl) {
    adminNameEl.textContent = adminName;
  }

  const statusSelect = document.getElementById("admin-requests-status-filter");
  if (statusSelect) {
    activeAdminRequestsState.statusFilter = statusSelect.value || "ALL";
    statusSelect.addEventListener("change", function () {
      activeAdminRequestsState.statusFilter = this.value || "ALL";
      renderAdminRequestsManageTable();
    });
  }

  const prioritySelect = document.getElementById("admin-requests-priority-filter");
  if (prioritySelect) {
    activeAdminRequestsState.priorityFilter = prioritySelect.value || "ALL";
    prioritySelect.addEventListener("change", function () {
      activeAdminRequestsState.priorityFilter = this.value || "ALL";
      renderAdminRequestsManageTable();
    });
  }

  const searchInput = document.getElementById("admin-requests-search-input");
  const clearBtn = document.getElementById("admin-requests-clear-search");
  if (searchInput) {
    activeAdminRequestsState.searchQuery = searchInput.value || "";
    searchInput.addEventListener("input", function () {
      activeAdminRequestsState.searchQuery = this.value || "";
      if (clearBtn) {
        clearBtn.style.display = this.value.trim().length > 0 ? "flex" : "none";
      }
      renderAdminRequestsManageTable();
    });
  }
  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", function () {
      searchInput.value = "";
      activeAdminRequestsState.searchQuery = "";
      clearBtn.style.display = "none";
      renderAdminRequestsManageTable();
      searchInput.focus();
    });
  }

  renderAdminRequestsManageTable();
}

function renderAdminRequestsManageTable() {
  const tbody = document.getElementById("admin-manage-requests-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const allRequests = getData(STORAGE_KEYS.REQUESTS);
  const statusFilter = activeAdminRequestsState.statusFilter || "ALL";
  const priorityFilter = activeAdminRequestsState.priorityFilter || "ALL";
  const searchQuery = (activeAdminRequestsState.searchQuery || "").trim().toLowerCase();

  // Update notice badge
  const noticeEl = document.getElementById("admin-manage-requests-notice");
  if (noticeEl) {
    const pending = allRequests.filter((r) => r.status === "Pending").length;
    const approved = allRequests.filter((r) => r.status === "Approved").length;
    const rejected = allRequests.filter((r) => r.status === "Rejected").length;
    noticeEl.innerHTML = `
      <strong>${allRequests.length}</strong> Total
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${pending}</strong> Pending
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${approved}</strong> Approved
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${rejected}</strong> Rejected
    `;
    noticeEl.style.display = "inline-flex";
  }

  const filtered = allRequests.filter((req) => {
    if (statusFilter !== "ALL" && req.status !== statusFilter) {
      return false;
    }
    if (priorityFilter !== "ALL") {
      const reqPriority = (req.priority || "Normal").trim().toLowerCase();
      if (reqPriority !== priorityFilter.toLowerCase()) {
        return false;
      }
    }
    if (searchQuery) {
      const student = findStudent(req.student_id);
      const studentName = student && student.name ? student.name.toLowerCase() : "";
      const title = (req.project_title || "").toLowerCase();
      const reqId = (req.request_id || "").toLowerCase();
      const studId = (req.student_id || "").toLowerCase();
      if (
        !title.includes(searchQuery) &&
        !reqId.includes(searchQuery) &&
        !studId.includes(searchQuery) &&
        !studentName.includes(searchQuery)
      ) {
        return false;
      }
    }
    return true;
  });

  if (allRequests.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7" class="table-empty-row">No requests yet.</td>`;
    tbody.appendChild(tr);
    return;
  }

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7" class="table-empty-row">No matching requests found.</td>`;
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach((req) => {
    const tr = document.createElement("tr");
    tr.id = `manage-row-${req.request_id}`;

    const student = findStudent(req.student_id);
    const studentName = student && student.name ? student.name : "Unknown Student";

    const tdId = document.createElement("td");
    tdId.className = "tabular";
    tdId.textContent = req.request_id;

    const tdStudent = document.createElement("td");
    tdStudent.innerHTML = `<span class="tabular" style="font-weight: 600;">${escapeHtml(req.student_id)}</span><br /><span style="font-size: 0.78rem; color: var(--color-text-muted);">${escapeHtml(studentName)}</span>`;

    const tdTitle = document.createElement("td");
    tdTitle.style.fontWeight = "600";
    tdTitle.textContent = req.project_title;

    const tdPriority = document.createElement("td");
    tdPriority.textContent = req.priority || "Normal";

    const tdDates = document.createElement("td");
    tdDates.className = "tabular";
    tdDates.style.color = "var(--color-text-muted)";
    if (req.required_from && req.required_to && req.required_from !== req.required_to) {
      tdDates.textContent = `${req.required_from} → ${req.required_to}`;
    } else {
      tdDates.textContent = req.required_from || req.required_to || req.created_at || "-";
    }

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createStatusBadge(req.status));

    const tdAction = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "action-buttons";

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn btn-outline btn-sm";
    viewBtn.textContent = "View";
    viewBtn.onclick = () => openRequestDetail(req.request_id);
    actionWrap.appendChild(viewBtn);

    if (req.status === "Pending") {
      const btnApprove = document.createElement("button");
      btnApprove.type = "button";
      btnApprove.className = "btn-approve";
      btnApprove.textContent = "Approve";
      btnApprove.onclick = () => openAdminApproveModal(req.request_id);
      actionWrap.appendChild(btnApprove);

      const btnReject = document.createElement("button");
      btnReject.type = "button";
      btnReject.className = "btn-reject";
      btnReject.textContent = "Reject";
      btnReject.onclick = () => openAdminRejectConfirm(req.request_id);
      actionWrap.appendChild(btnReject);
    }

    tdAction.appendChild(actionWrap);

    tr.appendChild(tdId);
    tr.appendChild(tdStudent);
    tr.appendChild(tdTitle);
    tr.appendChild(tdPriority);
    tr.appendChild(tdDates);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function openAdminApproveModal(requestId) {
  const requests = getData(STORAGE_KEYS.REQUESTS);
  const req = requests.find((r) => r.request_id === requestId);
  if (!req || req.status !== "Pending") return;

  activeAdminRequestsState.approvingRequestId = req.request_id;
  const student = findStudent(req.student_id);
  const studentDisplay = student ? `${req.student_id} (${student.name})` : req.student_id;

  let modalEl = document.getElementById("admin-approve-modal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "admin-approve-modal";
    modalEl.className = "modal-overlay";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "approve-modal-title");
    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 500px;">
        <div class="modal-header">
          <div>
            <span class="kicker">ALLOCATE WORKSTATION &amp; TIME SLOT</span>
            <h3 id="approve-modal-title">Approve Request</h3>
          </div>
          <button type="button" class="toast-close" onclick="closeAdminApproveModal()" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <div id="approve-request-summary" style="padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-subtle); margin-bottom: 1rem; font-size: 0.85rem;"></div>

          <div id="approve-modal-error" class="alert-message alert-error" role="alert" style="margin-bottom: 1rem;"></div>

          <form id="admin-approve-form" onsubmit="return handleAdminApproveSubmit(event)">
            <div class="form-group">
              <label for="approve-pc-select">Select Research PC <span style="color: var(--color-danger);">*</span></label>
              <select id="approve-pc-select" name="pc_id" class="form-control" required></select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label for="approve-slot-select">Select Available Time Slot <span style="color: var(--color-danger);">*</span></label>
              <select id="approve-slot-select" name="slot_id" class="form-control" required></select>
              <span class="field-hint">Only free time slots for the selected PC are listed.</span>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; background: transparent; border-top: 1px solid var(--color-border); margin-top: 1.25rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminApproveModal()">Cancel</button>
              <button type="submit" id="approve-confirm-btn" class="btn-approve" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Confirm Approval</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeAdminApproveModal();
    });

    const pcSelectListener = document.getElementById("approve-pc-select");
    if (pcSelectListener) {
      pcSelectListener.addEventListener("change", function () {
        updateApproveSlotDropdown();
      });
    }

    const slotSelectListener = document.getElementById("approve-slot-select");
    if (slotSelectListener) {
      slotSelectListener.addEventListener("change", function () {
        const errEl = document.getElementById("approve-modal-error");
        if (errEl) {
          errEl.textContent = "";
          errEl.classList.remove("alert-visible");
        }
      });
    }
  }

  const summaryEl = document.getElementById("approve-request-summary");
  if (summaryEl) {
    const datesText =
      req.required_from && req.required_to && req.required_from !== req.required_to
        ? `${req.required_from} to ${req.required_to}`
        : (req.required_from || req.required_to || "-");
    summaryEl.innerHTML = `
      <div><strong>${escapeHtml(req.request_id)}</strong> &mdash; ${escapeHtml(req.project_title)}</div>
      <div style="color: var(--color-text-muted); margin-top: 0.25rem;">Student: ${escapeHtml(studentDisplay)} &bull; Requested: ${escapeHtml(datesText)}</div>
    `;
  }

  const errEl = document.getElementById("approve-modal-error");
  if (errEl) {
    errEl.textContent = "";
    errEl.classList.remove("alert-visible");
  }

  const pcSelect = document.getElementById("approve-pc-select");
  if (pcSelect) {
    const pcs = getData(STORAGE_KEYS.PCS);
    const activePcs = pcs.filter(
      (p) => !p.status || (p.status !== "Maintenance" && p.status !== "Inactive")
    );
    const pcList = activePcs.length > 0 ? activePcs : pcs;

    pcSelect.innerHTML = "";
    pcList.forEach((pc) => {
      const opt = document.createElement("option");
      opt.value = pc.pc_id;
      opt.textContent = `${pc.pc_number || pc.pc_id} — ${pc.specification || pc.location || "Research PC"}`;
      pcSelect.appendChild(opt);
    });

    const defaultTarget = DEFAULT_PENDING_TARGETS[req.request_id] || {};
    const preferredPc = req.pc_id || defaultTarget.pc_id;
    if (preferredPc && pcList.some((p) => p.pc_id === preferredPc)) {
      pcSelect.value = preferredPc;
    }
  }

  updateApproveSlotDropdown(req.required_from);
  modalEl.classList.add("open");
}

function updateApproveSlotDropdown(preferredDate) {
  const pcSelect = document.getElementById("approve-pc-select");
  const slotSelect = document.getElementById("approve-slot-select");
  const errEl = document.getElementById("approve-modal-error");
  const confirmBtn = document.getElementById("approve-confirm-btn");

  if (errEl) {
    errEl.textContent = "";
    errEl.classList.remove("alert-visible");
  }
  if (!pcSelect || !slotSelect) return;

  const selectedPcId = pcSelect.value;
  const slots = getData(STORAGE_KEYS.SLOTS);

  // Use existing isSlotAvailable(pc_id, slot_id) to list only free slots for the selected PC
  const freeSlots = slots.filter((slot) => {
    if (!slot || slot.status === "Inactive") return false;
    const avail = isSlotAvailable(selectedPcId, slot.slot_id);
    return avail && avail.status === "Available";
  });

  // Sort chronologically by date and start_time
  freeSlots.sort((a, b) => {
    const dateCmp = String(a.slot_date || "").localeCompare(String(b.slot_date || ""));
    if (dateCmp !== 0) return dateCmp;
    return String(a.start_time || "").localeCompare(String(b.start_time || ""));
  });

  slotSelect.innerHTML = "";

  if (freeSlots.length === 0) {
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "No free time slots available for this PC";
    slotSelect.appendChild(emptyOpt);
    if (confirmBtn) confirmBtn.disabled = true;
    return;
  }

  if (confirmBtn) confirmBtn.disabled = false;

  freeSlots.forEach((slot) => {
    const opt = document.createElement("option");
    opt.value = slot.slot_id;
    opt.textContent = `${slot.slot_date} · ${slot.start_time} - ${slot.end_time} (${slot.slot_id})`;
    slotSelect.appendChild(opt);
  });

  if (preferredDate) {
    const matchingDateSlot = freeSlots.find((s) => s.slot_date === preferredDate);
    if (matchingDateSlot) {
      slotSelect.value = matchingDateSlot.slot_id;
    }
  }
}

function closeAdminApproveModal() {
  const modalEl = document.getElementById("admin-approve-modal");
  if (modalEl) modalEl.classList.remove("open");
  activeAdminRequestsState.approvingRequestId = null;
}

function handleAdminApproveSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();

  const session = getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "admin-login.html";
    return false;
  }

  const requestId = activeAdminRequestsState.approvingRequestId;
  const pcSelect = document.getElementById("approve-pc-select");
  const slotSelect = document.getElementById("approve-slot-select");
  const errEl = document.getElementById("approve-modal-error");

  const pcId = pcSelect ? pcSelect.value : "";
  const slotId = slotSelect ? slotSelect.value : "";

  if (!pcId || !slotId) {
    if (errEl) {
      errEl.textContent = "Please select an available PC and time slot.";
      errEl.classList.add("alert-visible");
    }
    return false;
  }

  const requests = getData(STORAGE_KEYS.REQUESTS);
  const allocations = getData(STORAGE_KEYS.ALLOCATIONS);
  const req = requests.find((r) => r.request_id === requestId);
  if (!req) {
    closeAdminApproveModal();
    return false;
  }

  // Re-verify slot availability right before saving
  const avail = isSlotAvailable(pcId, slotId);
  const alreadyBooked = allocations.find(
    (a) => a.pc_id === pcId && a.slot_id === slotId && isAllocationConfirmed(a)
  );

  if (alreadyBooked || !avail || avail.status !== "Available") {
    const conflictMsg = "This PC is already booked for this time slot.";
    if (errEl) {
      errEl.textContent = conflictMsg;
      errEl.classList.add("alert-visible");
    }
    showToast(conflictMsg, "error");
    return false;
  }

  req.status = "Approved";

  const allocatedBy = session.id || "AD01";
  const allocatedAt = new Date().toISOString().slice(0, 19).replace("T", " ");

  const newAlloc = {
    allocation_id: nextId(STORAGE_KEYS.ALLOCATIONS, "AL", "allocation_id"),
    request_id: req.request_id,
    pc_id: pcId,
    slot_id: slotId,
    allocated_by: allocatedBy,
    allocated_at: allocatedAt,
    status: "Confirmed"
  };

  allocations.push(newAlloc);
  saveData(STORAGE_KEYS.REQUESTS, requests);
  saveData(STORAGE_KEYS.ALLOCATIONS, allocations);

  addActivityLog({
    action_type: "Request Approved",
    category: "request",
    actor_id: allocatedBy,
    actor_role: "admin",
    target_id: req.request_id,
    description: `Approved request ${req.request_id} ("${req.project_title}") and assigned ${pcId} for slot ${slotId} (${newAlloc.allocation_id}).`
  });

  const assignedSlotObj = getData(STORAGE_KEYS.SLOTS, []).find((s) => s.slot_id === slotId);
  addNotificationRecord({
    target_role: "student",
    target_id: req.student_id,
    title: `Your request ${req.request_id} was approved`,
    meta: `Assigned ${pcId}${assignedSlotObj ? ` on ${assignedSlotObj.slot_date} (${assignedSlotObj.start_time} - ${assignedSlotObj.end_time})` : ""}`
  });

  closeAdminApproveModal();
  renderAdminRequestsManageTable();
  updateAdminMetrics();
  updateAdminRequestsNotice();
  renderAdminRequests();
  renderSlotGrid();
  if (typeof renderHomeOverview === "function") {
    renderHomeOverview();
  }

  showToast(`Request ${req.request_id} approved (${pcId} / ${slotId}).`, "success");
  return false;
}

function openAdminRejectConfirm(requestId) {
  const requests = getData(STORAGE_KEYS.REQUESTS);
  const req = requests.find((r) => r.request_id === requestId);
  if (!req || req.status !== "Pending") return;

  activeAdminRequestsState.rejectingRequestId = req.request_id;

  let modalEl = document.getElementById("admin-reject-modal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "admin-reject-modal";
    modalEl.className = "modal-overlay";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "admin-reject-title");
    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 440px;">
        <div class="modal-header">
          <div>
            <span class="kicker">CONFIRM REJECTION</span>
            <h3 id="admin-reject-title">Reject Research Request?</h3>
          </div>
          <button type="button" class="toast-close" onclick="closeAdminRejectConfirm()" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <p id="admin-reject-message" style="font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.5;"></p>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="closeAdminRejectConfirm()">Keep Pending</button>
          <button type="button" id="admin-reject-confirm-btn" class="btn-reject" style="padding: 0.45rem 0.9rem; font-size: 0.8125rem;">Confirm Reject</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeAdminRejectConfirm();
    });
  }

  const msgEl = document.getElementById("admin-reject-message");
  if (msgEl) {
    msgEl.textContent = `Are you sure you want to reject request ${req.request_id} ("${req.project_title}") submitted by ${req.student_id}?`;
  }

  const confirmBtn = document.getElementById("admin-reject-confirm-btn");
  if (confirmBtn) {
    confirmBtn.onclick = () => confirmAdminRejectRequest(req.request_id);
  }

  modalEl.classList.add("open");
}

function closeAdminRejectConfirm() {
  const modalEl = document.getElementById("admin-reject-modal");
  if (modalEl) modalEl.classList.remove("open");
  activeAdminRequestsState.rejectingRequestId = null;
}

function confirmAdminRejectRequest(requestId) {
  const requests = getData(STORAGE_KEYS.REQUESTS);
  let allocations = getData(STORAGE_KEYS.ALLOCATIONS);
  const req = requests.find((r) => r.request_id === requestId);
  if (!req) {
    closeAdminRejectConfirm();
    return;
  }

  req.status = "Rejected";
  allocations = allocations.filter((a) => a.request_id !== req.request_id);

  saveData(STORAGE_KEYS.REQUESTS, requests);
  saveData(STORAGE_KEYS.ALLOCATIONS, allocations);

  const session = getSession();
  const actorId = (session && session.role === "admin" && session.id) ? session.id : "AD01";
  addActivityLog({
    action_type: "Request Rejected",
    category: "request",
    actor_id: actorId,
    actor_role: "admin",
    target_id: req.request_id,
    description: `Rejected request ${req.request_id} ("${req.project_title}") submitted by ${req.student_id}.`
  });

  addNotificationRecord({
    target_role: "student",
    target_id: req.student_id,
    title: `Request ${req.request_id} was not approved`,
    meta: `${req.project_title} · Please review requirements or contact lab admin.`
  });

  closeAdminRejectConfirm();
  renderAdminRequestsManageTable();
  updateAdminMetrics();
  updateAdminRequestsNotice();
  renderAdminRequests();
  renderSlotGrid();
  if (typeof renderHomeOverview === "function") {
    renderHomeOverview();
  }

  showToast(`Request ${requestId} marked as Rejected.`, "info");
}

/* ==========================================================================
   ADMIN PCs & TIME SLOTS MODULE (admin-pcs-slots.html)
   ========================================================================== */

let activePcSlotsTab = "pcs";
let editingPcId = null;
let deletingSlotId = null;

function formatPcDisplayStatus(rawStatus) {
  if (rawStatus === "Maintenance") return "Maintenance";
  return "Available";
}

function nextUniqueSlotId(existingSlots) {
  const used = new Set(
    (existingSlots || []).map((s) => String((s && s.slot_id) || "").trim().toUpperCase())
  );
  let num = (existingSlots ? existingSlots.length : 0) + 1;
  while (used.has(`SLOT_${num}`)) {
    num++;
  }
  return `SLOT_${num}`;
}

function timeToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string" || !hhmm.includes(":")) return NaN;
  const parts = hhmm.trim().split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
}

function isSlotAllocated(slotId) {
  if (!slotId) return false;
  const allocations = getData(STORAGE_KEYS.ALLOCATIONS);
  return allocations.some(
    (a) => a && a.slot_id === slotId && a.status !== "Cancelled" && a.status !== "Released"
  );
}

function initAdminPcsSlotsPage() {
  const pcsTbody = document.getElementById("admin-pcs-tbody");
  const slotsTbody = document.getElementById("admin-slots-tbody");
  if (!pcsTbody && !slotsTbody) return;

  const session = getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "admin-login.html";
    return;
  }

  updateActiveSidebarItem();

  const adminList = getAdmins();
  const admin = adminList.find((a) => a.admin_id === session.id) || adminList[0];
  const adminName = admin && admin.name ? admin.name : "Md. Atik Ishrak";
  const adminNameEl = document.getElementById("topbar-admin-name");
  if (adminNameEl) {
    adminNameEl.textContent = adminName;
  }

  // Clear add-slot form errors when editing fields
  ["add-slot-date", "add-slot-start", "add-slot-end"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      FormValidator.clearError(el);
      const errBanner = document.getElementById("add-slot-error");
      if (errBanner) {
        errBanner.textContent = "";
        errBanner.classList.remove("alert-visible");
      }
      const successBanner = document.getElementById("add-slot-success");
      if (successBanner) {
        successBanner.textContent = "";
        successBanner.classList.remove("alert-visible");
      }
    });
  });

  renderAdminPcsTable();
  renderAdminSlotsTable();

  let initialTab = "pcs";
  try {
    const search = (window.location && window.location.search) || "";
    if (search.toLowerCase().includes("tab=slots")) {
      initialTab = "slots";
    }
  } catch (e) {}
  switchPcSlotTab(initialTab);
}

function switchPcSlotTab(tabName) {
  const useTab = tabName === "slots" ? "slots" : "pcs";
  activePcSlotsTab = useTab;

  const pcTabBtn = document.getElementById("tab-btn-pcs");
  const slotTabBtn = document.getElementById("tab-btn-slots");
  const pcPanel = document.getElementById("panel-research-pcs");
  const slotPanel = document.getElementById("panel-time-slots");

  if (pcTabBtn) {
    if (useTab === "pcs") pcTabBtn.classList.add("active");
    else pcTabBtn.classList.remove("active");
    pcTabBtn.setAttribute("aria-selected", useTab === "pcs" ? "true" : "false");
  }
  if (slotTabBtn) {
    if (useTab === "slots") slotTabBtn.classList.add("active");
    else slotTabBtn.classList.remove("active");
    slotTabBtn.setAttribute("aria-selected", useTab === "slots" ? "true" : "false");
  }

  if (pcPanel) {
    pcPanel.style.display = useTab === "pcs" ? "block" : "none";
    if (useTab === "pcs") pcPanel.classList.add("active");
    else pcPanel.classList.remove("active");
  }
  if (slotPanel) {
    slotPanel.style.display = useTab === "slots" ? "block" : "none";
    if (useTab === "slots") slotPanel.classList.add("active");
    else slotPanel.classList.remove("active");
  }

  if (useTab === "pcs") {
    renderAdminPcsTable();
  } else {
    renderAdminSlotsTable();
  }
}

function renderAdminPcsTable() {
  const tbody = document.getElementById("admin-pcs-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const pcs = getData(STORAGE_KEYS.PCS);

  const noticeEl = document.getElementById("admin-pcs-notice");
  if (noticeEl) {
    const availableCount = pcs.filter((p) => formatPcDisplayStatus(p.status) === "Available").length;
    const maintCount = pcs.filter((p) => formatPcDisplayStatus(p.status) === "Maintenance").length;
    noticeEl.innerHTML = `
      <strong>${pcs.length}</strong> Total
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${availableCount}</strong> Available
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${maintCount}</strong> Maintenance
    `;
    noticeEl.style.display = "inline-flex";
  }

  if (pcs.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="table-empty-row">No Research PCs configured yet. Click "+ Add PC" to add one.</td>`;
    tbody.appendChild(tr);
    return;
  }

  pcs.forEach((pc) => {
    const tr = document.createElement("tr");
    tr.id = `pc-row-${pc.pc_id}`;

    const displayStatus = formatPcDisplayStatus(pc.status);

    const tdNumber = document.createElement("td");
    tdNumber.className = "tabular";
    tdNumber.style.fontWeight = "600";
    tdNumber.textContent = pc.pc_number || pc.pc_id;

    const tdSpec = document.createElement("td");
    tdSpec.textContent = pc.specification || "-";

    const tdLocation = document.createElement("td");
    tdLocation.style.color = "var(--color-text-muted)";
    tdLocation.textContent = pc.location || "-";

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createStatusBadge(displayStatus));

    const tdAction = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "action-buttons";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-outline btn-sm";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => openPcFormModal(pc.pc_id);
    actionWrap.appendChild(editBtn);

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    if (displayStatus === "Available") {
      toggleBtn.className = "btn-toggle-maintenance";
      toggleBtn.textContent = "Set Maintenance";
    } else {
      toggleBtn.className = "btn-approve";
      toggleBtn.textContent = "Set Available";
    }
    toggleBtn.onclick = () => togglePcStatus(pc.pc_id);
    actionWrap.appendChild(toggleBtn);

    tdAction.appendChild(actionWrap);

    tr.appendChild(tdNumber);
    tr.appendChild(tdSpec);
    tr.appendChild(tdLocation);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function openPcFormModal(pcId) {
  editingPcId = pcId || null;
  const pcs = getData(STORAGE_KEYS.PCS);
  const existingPc = editingPcId ? pcs.find((p) => p.pc_id === editingPcId) : null;

  let modalEl = document.getElementById("pc-form-modal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "pc-form-modal";
    modalEl.className = "modal-overlay";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "pc-modal-title");
    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 480px;">
        <div class="modal-header">
          <div>
            <span class="kicker">RESEARCH WORKSTATION</span>
            <h3 id="pc-modal-title">Add Research PC</h3>
          </div>
          <button type="button" class="toast-close" onclick="closePcFormModal()" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <div id="pc-modal-error" class="alert-message alert-error" role="alert" style="margin-bottom: 1rem;"></div>

          <form id="pc-modal-form" onsubmit="return handlePcFormSubmit(event)" novalidate>
            <div class="form-group">
              <label for="pc-form-number">PC Number <span style="color: var(--color-danger);">*</span></label>
              <input type="text" id="pc-form-number" name="pc_number" class="form-control" placeholder="e.g. PC04" required />
              <span class="field-error" id="err-pc-form-number"></span>
            </div>

            <div class="form-group">
              <label for="pc-form-spec">Specification <span style="color: var(--color-danger);">*</span></label>
              <input type="text" id="pc-form-spec" name="specification" class="form-control" placeholder="e.g. Core i9, 32GB RAM, NVIDIA RTX 4090" required />
              <span class="field-error" id="err-pc-form-spec"></span>
            </div>

            <div class="form-group">
              <label for="pc-form-location">Location <span style="color: var(--color-danger);">*</span></label>
              <input type="text" id="pc-form-location" name="location" class="form-control" placeholder="e.g. Research Lab" required />
              <span class="field-error" id="err-pc-form-location"></span>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label for="pc-form-status">Status</label>
              <select id="pc-form-status" name="status" class="form-control">
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; background: transparent; border-top: 1px solid var(--color-border); margin-top: 1.25rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn btn-outline btn-sm" onclick="closePcFormModal()">Cancel</button>
              <button type="submit" id="pc-form-submit-btn" class="btn btn-blue btn-sm">Save PC</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closePcFormModal();
    });

    ["pc-form-number", "pc-form-spec", "pc-form-location"].forEach((id) => {
      const inp = document.getElementById(id);
      if (inp) {
        inp.addEventListener("input", () => {
          FormValidator.clearError(inp);
          const errBox = document.getElementById("pc-modal-error");
          if (errBox) {
            errBox.textContent = "";
            errBox.classList.remove("alert-visible");
          }
        });
      }
    });
  }

  const titleEl = document.getElementById("pc-modal-title");
  const submitBtn = document.getElementById("pc-form-submit-btn");
  const numInput = document.getElementById("pc-form-number");
  const specInput = document.getElementById("pc-form-spec");
  const locInput = document.getElementById("pc-form-location");
  const statusSelect = document.getElementById("pc-form-status");
  const errBox = document.getElementById("pc-modal-error");

  if (errBox) {
    errBox.textContent = "";
    errBox.classList.remove("alert-visible");
  }
  [numInput, specInput, locInput].forEach((inp) => {
    if (inp) FormValidator.clearError(inp);
  });

  if (existingPc) {
    if (titleEl) titleEl.textContent = `Edit Research PC (${existingPc.pc_number || existingPc.pc_id})`;
    if (submitBtn) submitBtn.textContent = "Save Changes";
    if (numInput) numInput.value = existingPc.pc_number || "";
    if (specInput) specInput.value = existingPc.specification || "";
    if (locInput) locInput.value = existingPc.location || "";
    if (statusSelect) statusSelect.value = formatPcDisplayStatus(existingPc.status);
  } else {
    if (titleEl) titleEl.textContent = "Add Research PC";
    if (submitBtn) submitBtn.textContent = "Add PC";
    if (numInput) numInput.value = "";
    if (specInput) specInput.value = "";
    if (locInput) locInput.value = "Research Lab";
    if (statusSelect) statusSelect.value = "Available";
  }

  modalEl.classList.add("open");
}

function closePcFormModal() {
  const modalEl = document.getElementById("pc-form-modal");
  if (modalEl) modalEl.classList.remove("open");
  editingPcId = null;
}

function handlePcFormSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();

  const numInput = document.getElementById("pc-form-number");
  const specInput = document.getElementById("pc-form-spec");
  const locInput = document.getElementById("pc-form-location");
  const statusSelect = document.getElementById("pc-form-status");
  const errBox = document.getElementById("pc-modal-error");

  const pcNumber = numInput ? numInput.value.trim() : "";
  const specification = specInput ? specInput.value.trim() : "";
  const location = locInput ? locInput.value.trim() : "";
  const status = statusSelect && statusSelect.value === "Maintenance" ? "Maintenance" : "Available";

  if (errBox) {
    errBox.textContent = "";
    errBox.classList.remove("alert-visible");
  }

  let hasError = false;

  if (!pcNumber) {
    hasError = true;
    if (numInput) FormValidator.showError(numInput, "PC number is required.");
  }
  if (!specification) {
    hasError = true;
    if (specInput) FormValidator.showError(specInput, "Specification is required.");
  }
  if (!location) {
    hasError = true;
    if (locInput) FormValidator.showError(locInput, "Location is required.");
  }

  const pcs = getData(STORAGE_KEYS.PCS);
  if (pcNumber) {
    const duplicate = pcs.find(
      (p) =>
        p &&
        String(p.pc_number || "").trim().toLowerCase() === pcNumber.toLowerCase() &&
        p.pc_id !== editingPcId
    );
    if (duplicate) {
      hasError = true;
      const dupMsg = "PC number must be unique. This PC number already exists.";
      if (numInput) FormValidator.showError(numInput, dupMsg);
      if (errBox) {
        errBox.textContent = dupMsg;
        errBox.classList.add("alert-visible");
      }
    }
  }

  if (hasError) return false;

  if (editingPcId) {
    const idx = pcs.findIndex((p) => p.pc_id === editingPcId);
    if (idx !== -1) {
      pcs[idx] = {
        ...pcs[idx],
        pc_number: pcNumber,
        specification,
        location,
        status
      };
    }
    saveData(STORAGE_KEYS.PCS, pcs);
    addActivityLog({
      action_type: "Workstation Updated",
      category: "system",
      actor_role: "admin",
      target_id: pcNumber,
      description: `Updated workstation ${pcNumber} (${specification}, ${location}, status: ${status}).`
    });
    closePcFormModal();
    renderAdminPcsTable();
    updateAdminMetrics();
    renderSlotGrid();
    if (typeof renderHomeOverview === "function") renderHomeOverview();
    showToast(`Research PC ${pcNumber} updated.`, "success");
  } else {
    const newPc = {
      pc_id: nextId(STORAGE_KEYS.PCS, "PC", "pc_id"),
      pc_number: pcNumber,
      specification,
      status,
      location
    };
    pcs.push(newPc);
    saveData(STORAGE_KEYS.PCS, pcs);
    addActivityLog({
      action_type: "Workstation Added",
      category: "system",
      actor_role: "admin",
      target_id: pcNumber,
      description: `Added workstation ${pcNumber} (${specification}, ${location}, status: ${status}).`
    });
    closePcFormModal();
    renderAdminPcsTable();
    updateAdminMetrics();
    renderSlotGrid();
    if (typeof renderHomeOverview === "function") renderHomeOverview();
    showToast(`Research PC ${pcNumber} added.`, "success");
  }

  return false;
}

function togglePcStatus(pcId) {
  const pcs = getData(STORAGE_KEYS.PCS);
  const idx = pcs.findIndex((p) => p.pc_id === pcId);
  if (idx === -1) return;

  const currentDisplay = formatPcDisplayStatus(pcs[idx].status);
  const nextStatus = currentDisplay === "Available" ? "Maintenance" : "Available";
  pcs[idx] = {
    ...pcs[idx],
    status: nextStatus
  };

  saveData(STORAGE_KEYS.PCS, pcs);
  addActivityLog({
    action_type: "Workstation Status Changed",
    category: "system",
    actor_role: "admin",
    target_id: pcs[idx].pc_number || pcs[idx].pc_id,
    description: `Changed workstation ${pcs[idx].pc_number || pcs[idx].pc_id} status from ${currentDisplay} to ${nextStatus}.`
  });
  renderAdminPcsTable();
  updateAdminMetrics();
  renderSlotGrid();
  if (typeof renderHomeOverview === "function") renderHomeOverview();
  showToast(`${pcs[idx].pc_number || pcs[idx].pc_id} status set to ${nextStatus}.`, "info");
}

function renderAdminSlotsTable() {
  const tbody = document.getElementById("admin-slots-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const slots = getData(STORAGE_KEYS.SLOTS);

  // Sort chronologically by date, start_time, end_time
  const sortedSlots = [...slots].sort((a, b) => {
    const dateCmp = String((a && a.slot_date) || "").localeCompare(String((b && b.slot_date) || ""));
    if (dateCmp !== 0) return dateCmp;
    const startCmp = String((a && a.start_time) || "").localeCompare(String((b && b.start_time) || ""));
    if (startCmp !== 0) return startCmp;
    return String((a && a.end_time) || "").localeCompare(String((b && b.end_time) || ""));
  });

  const noticeEl = document.getElementById("admin-slots-notice");
  if (noticeEl) {
    const allocatedCount = sortedSlots.filter((s) => isSlotAllocated(s.slot_id)).length;
    noticeEl.innerHTML = `
      <strong>${sortedSlots.length}</strong> Total
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${allocatedCount}</strong> Allocated
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${sortedSlots.length - allocatedCount}</strong> Unallocated
    `;
    noticeEl.style.display = "inline-flex";
  }

  if (sortedSlots.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" class="table-empty-row">No time slots configured yet.</td>`;
    tbody.appendChild(tr);
    return;
  }

  sortedSlots.forEach((slot) => {
    const tr = document.createElement("tr");
    tr.id = `slot-row-${slot.slot_id}`;

    const allocated = isSlotAllocated(slot.slot_id);

    const tdDate = document.createElement("td");
    tdDate.className = "tabular";
    tdDate.style.fontWeight = "600";
    tdDate.textContent = slot.slot_date || "-";

    const tdStart = document.createElement("td");
    tdStart.className = "tabular";
    tdStart.textContent = slot.start_time || "-";

    const tdEnd = document.createElement("td");
    tdEnd.className = "tabular";
    tdEnd.textContent = slot.end_time || "-";

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createStatusBadge(slot.status || "Open"));
    if (allocated) {
      const allocNote = document.createElement("span");
      allocNote.style.fontSize = "0.72rem";
      allocNote.style.color = "var(--color-text-muted)";
      allocNote.style.marginLeft = "0.45rem";
      allocNote.textContent = "(Allocated)";
      tdStatus.appendChild(allocNote);
    }

    const tdAction = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "action-buttons";

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = allocated ? "btn-reject btn-disabled-muted" : "btn-reject";
    delBtn.textContent = "Delete";
    if (allocated) {
      delBtn.setAttribute("aria-disabled", "true");
      delBtn.title = "Allocated slot cannot be deleted";
    }
    delBtn.onclick = () => openSlotDeleteConfirm(slot.slot_id);
    actionWrap.appendChild(delBtn);

    tdAction.appendChild(actionWrap);

    tr.appendChild(tdDate);
    tr.appendChild(tdStart);
    tr.appendChild(tdEnd);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function handleAddTimeSlotSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();

  const dateEl = document.getElementById("add-slot-date");
  const startEl = document.getElementById("add-slot-start");
  const endEl = document.getElementById("add-slot-end");
  const errBanner = document.getElementById("add-slot-error");
  const successBanner = document.getElementById("add-slot-success");

  if (errBanner) {
    errBanner.textContent = "";
    errBanner.classList.remove("alert-visible");
  }
  if (successBanner) {
    successBanner.textContent = "";
    successBanner.classList.remove("alert-visible");
  }

  const slotDate = dateEl ? dateEl.value.trim() : "";
  const startTime = startEl ? startEl.value.trim() : "";
  const endTime = endEl ? endEl.value.trim() : "";

  let hasError = false;
  if (!slotDate) {
    hasError = true;
    if (dateEl) FormValidator.showError(dateEl, "Date is required.");
  }
  if (!startTime) {
    hasError = true;
    if (startEl) FormValidator.showError(startEl, "Start time is required.");
  }
  if (!endTime) {
    hasError = true;
    if (endEl) FormValidator.showError(endEl, "End time is required.");
  }

  if (startTime && endTime) {
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (isNaN(startMins) || isNaN(endMins) || endMins <= startMins) {
      hasError = true;
      const msg = "End time must be after start time.";
      if (endEl) FormValidator.showError(endEl, msg);
      if (errBanner) {
        errBanner.textContent = msg;
        errBanner.classList.add("alert-visible");
      }
    }
  }

  const slots = getData(STORAGE_KEYS.SLOTS);
  if (!hasError && slotDate && startTime && endTime) {
    const duplicate = slots.find(
      (s) =>
        s &&
        String(s.slot_date || "").trim() === slotDate &&
        String(s.start_time || "").trim() === startTime &&
        String(s.end_time || "").trim() === endTime
    );
    if (duplicate) {
      hasError = true;
      const dupMsg = "A time slot with the same date and time already exists.";
      if (errBanner) {
        errBanner.textContent = dupMsg;
        errBanner.classList.add("alert-visible");
      }
      showToast(dupMsg, "error");
    }
  }

  if (hasError) return false;

  const newSlot = {
    slot_id: nextUniqueSlotId(slots),
    slot_date: slotDate,
    start_time: startTime,
    end_time: endTime,
    status: "Open"
  };

  slots.push(newSlot);
  saveData(STORAGE_KEYS.SLOTS, slots);

  addActivityLog({
    action_type: "Time Slot Added",
    category: "system",
    actor_role: "admin",
    target_id: newSlot.slot_id,
    description: `Added time slot ${newSlot.slot_id} on ${slotDate} (${startTime} - ${endTime}).`
  });

  if (dateEl) dateEl.value = "";
  if (startEl) startEl.value = "";
  if (endEl) endEl.value = "";

  if (successBanner) {
    successBanner.textContent = `Time slot ${slotDate} (${startTime} - ${endTime}) added successfully.`;
    successBanner.classList.add("alert-visible");
  }

  renderAdminSlotsTable();
  updateAdminMetrics();
  renderSlotGrid();
  if (typeof renderHomeOverview === "function") renderHomeOverview();
  showToast(`Time slot ${slotDate} ${startTime}-${endTime} added.`, "success");
  return false;
}

function openSlotDeleteConfirm(slotId) {
  const slots = getData(STORAGE_KEYS.SLOTS);
  const slot = slots.find((s) => s.slot_id === slotId);
  if (!slot) return;

  if (isSlotAllocated(slot.slot_id)) {
    const errMsg = "This time slot is already allocated and cannot be deleted.";
    showToast(errMsg, "error");
    return;
  }

  deletingSlotId = slot.slot_id;

  let modalEl = document.getElementById("slot-delete-modal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "slot-delete-modal";
    modalEl.className = "modal-overlay";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "slot-delete-title");
    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 440px;">
        <div class="modal-header">
          <div>
            <span class="kicker">CONFIRM DELETION</span>
            <h3 id="slot-delete-title">Delete Time Slot?</h3>
          </div>
          <button type="button" class="toast-close" onclick="closeSlotDeleteConfirm()" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <p id="slot-delete-message" style="font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.5;"></p>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="closeSlotDeleteConfirm()">Cancel</button>
          <button type="button" id="slot-delete-confirm-btn" class="btn-reject" style="padding: 0.45rem 0.9rem; font-size: 0.8125rem;">Confirm Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeSlotDeleteConfirm();
    });
  }

  const msgEl = document.getElementById("slot-delete-message");
  if (msgEl) {
    msgEl.textContent = `Are you sure you want to delete the time slot on ${slot.slot_date} (${slot.start_time} - ${slot.end_time})?`;
  }

  const confirmBtn = document.getElementById("slot-delete-confirm-btn");
  if (confirmBtn) {
    confirmBtn.onclick = () => confirmDeleteTimeSlot(slot.slot_id);
  }

  modalEl.classList.add("open");
}

function closeSlotDeleteConfirm() {
  const modalEl = document.getElementById("slot-delete-modal");
  if (modalEl) modalEl.classList.remove("open");
  deletingSlotId = null;
}

function confirmDeleteTimeSlot(slotId) {
  if (isSlotAllocated(slotId)) {
    closeSlotDeleteConfirm();
    showToast("This time slot is already allocated and cannot be deleted.", "error");
    return;
  }

  const slots = getData(STORAGE_KEYS.SLOTS);
  const removed = slots.find((s) => s.slot_id === slotId);
  const filtered = slots.filter((s) => s.slot_id !== slotId);
  saveData(STORAGE_KEYS.SLOTS, filtered);

  if (removed) {
    addActivityLog({
      action_type: "Time Slot Deleted",
      category: "system",
      actor_role: "admin",
      target_id: removed.slot_id,
      description: `Deleted time slot ${removed.slot_id} on ${removed.slot_date} (${removed.start_time} - ${removed.end_time}).`
    });
  }

  closeSlotDeleteConfirm();
  renderAdminSlotsTable();
  updateAdminMetrics();
  renderSlotGrid();
  if (typeof renderHomeOverview === "function") renderHomeOverview();
  showToast("Time slot deleted.", "info");
}

/* ==========================================================================
   ADMIN ALLOCATIONS MODULE (admin-allocations.html)
   ========================================================================== */

let activeAdminAllocationsState = {
  dateFilter: "ALL",
  pcFilter: "ALL",
  searchQuery: "",
  cancellingAllocationId: null
};

function getEnrichedAllocations() {
  const allocations = getData(STORAGE_KEYS.ALLOCATIONS);
  const requests = getData(STORAGE_KEYS.REQUESTS);
  const pcs = getData(STORAGE_KEYS.PCS);
  const slots = getData(STORAGE_KEYS.SLOTS);

  const enriched = allocations.map((alloc) => {
    const req = requests.find((r) => r.request_id === alloc.request_id);
    const pc = pcs.find((p) => p.pc_id === alloc.pc_id);
    const slot = slots.find((s) => s.slot_id === alloc.slot_id);

    const studentId =
      alloc.student_id ||
      (req ? req.student_id : null) ||
      MOCK_ALLOCATION_OWNERS[alloc.request_id] ||
      "ST01";
    const student = findStudent(studentId);
    const studentName = alloc.student_name || (student && student.name) || "Unknown Student";

    const projectTitle =
      req && req.project_title
        ? req.project_title
        : `Research Session (${alloc.request_id || alloc.allocation_id})`;

    const pcLabel = pc ? (pc.pc_number || pc.pc_id) : (alloc.pc_id || "-");
    const dateStr =
      slot && slot.slot_date
        ? slot.slot_date
        : (req && req.required_from ? req.required_from : "-");
    const timeStr =
      slot && slot.start_time && slot.end_time
        ? `${slot.start_time} - ${slot.end_time}`
        : (alloc.slot_id || "-");

    const adminObj = getAdmins().find((a) => a.admin_id === alloc.allocated_by);
    const allocatedByLabel = adminObj
      ? `${adminObj.admin_id} (${adminObj.name})`
      : (alloc.allocated_by || "AD01");

    return {
      allocation_id: alloc.allocation_id,
      request_id: alloc.request_id || "-",
      student_id: studentId,
      student_name: studentName,
      project_title: projectTitle,
      pc_id: alloc.pc_id || "",
      pc_label: pcLabel,
      slot_id: alloc.slot_id || "",
      date: dateStr,
      time: timeStr,
      allocated_by: alloc.allocated_by || "AD01",
      allocated_by_label: allocatedByLabel,
      status: alloc.status || "Confirmed"
    };
  });

  enriched.sort((a, b) => {
    const dCmp = String(a.date || "").localeCompare(String(b.date || ""));
    if (dCmp !== 0) return dCmp;
    const tCmp = String(a.time || "").localeCompare(String(b.time || ""));
    if (tCmp !== 0) return tCmp;
    return String(a.allocation_id || "").localeCompare(String(b.allocation_id || ""));
  });

  return enriched;
}

function getFilteredAllocations() {
  const all = getEnrichedAllocations();
  const dateFilter = activeAdminAllocationsState.dateFilter || "ALL";
  const pcFilter = activeAdminAllocationsState.pcFilter || "ALL";
  const searchQuery = (activeAdminAllocationsState.searchQuery || "").trim().toLowerCase();

  return all.filter((row) => {
    if (dateFilter !== "ALL" && row.date !== dateFilter) {
      return false;
    }
    if (pcFilter !== "ALL" && row.pc_id !== pcFilter) {
      return false;
    }
    if (searchQuery) {
      const haystack = [
        row.allocation_id,
        row.request_id,
        row.student_id,
        row.student_name,
        row.project_title,
        row.pc_label,
        row.date,
        row.time,
        row.allocated_by_label,
        row.status
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(searchQuery)) return false;
    }
    return true;
  });
}

function populateAllocationFilterOptions() {
  const dateSelect = document.getElementById("allocations-date-filter");
  const pcSelect = document.getElementById("allocations-pc-filter");

  if (dateSelect) {
    const prevDate = activeAdminAllocationsState.dateFilter || dateSelect.value || "ALL";
    const enriched = getEnrichedAllocations();
    const dates = Array.from(
      new Set([
        ...getAvailableSlotDates(),
        ...enriched.map((r) => r.date).filter((d) => d && d !== "-")
      ])
    ).sort();

    dateSelect.innerHTML = '<option value="ALL">All Dates</option>';
    dates.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      dateSelect.appendChild(opt);
    });

    if (prevDate === "ALL" || dates.includes(prevDate)) {
      dateSelect.value = prevDate;
      activeAdminAllocationsState.dateFilter = prevDate;
    } else {
      dateSelect.value = "ALL";
      activeAdminAllocationsState.dateFilter = "ALL";
    }
  }

  if (pcSelect) {
    const prevPc = activeAdminAllocationsState.pcFilter || pcSelect.value || "ALL";
    const pcs = getData(STORAGE_KEYS.PCS);
    pcSelect.innerHTML = '<option value="ALL">All PCs</option>';
    pcs.forEach((pc) => {
      const opt = document.createElement("option");
      opt.value = pc.pc_id;
      opt.textContent = pc.pc_number || pc.pc_id;
      pcSelect.appendChild(opt);
    });

    if (prevPc === "ALL" || pcs.some((p) => p.pc_id === prevPc)) {
      pcSelect.value = prevPc;
      activeAdminAllocationsState.pcFilter = prevPc;
    } else {
      pcSelect.value = "ALL";
      activeAdminAllocationsState.pcFilter = "ALL";
    }
  }
}

function initAdminAllocationsPage() {
  const tbody = document.getElementById("admin-allocations-tbody");
  if (!tbody) return;

  const session = getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "admin-login.html";
    return;
  }

  updateActiveSidebarItem();

  const adminList = getAdmins();
  const admin = adminList.find((a) => a.admin_id === session.id) || adminList[0];
  const adminName = admin && admin.name ? admin.name : "Md. Atik Ishrak";
  const adminNameEl = document.getElementById("topbar-admin-name");
  if (adminNameEl) {
    adminNameEl.textContent = adminName;
  }

  populateAllocationFilterOptions();

  const dateSelect = document.getElementById("allocations-date-filter");
  if (dateSelect) {
    activeAdminAllocationsState.dateFilter = dateSelect.value || "ALL";
    dateSelect.addEventListener("change", function () {
      activeAdminAllocationsState.dateFilter = this.value || "ALL";
      renderAdminAllocationsTable();
    });
  }

  const pcSelect = document.getElementById("allocations-pc-filter");
  if (pcSelect) {
    activeAdminAllocationsState.pcFilter = pcSelect.value || "ALL";
    pcSelect.addEventListener("change", function () {
      activeAdminAllocationsState.pcFilter = this.value || "ALL";
      renderAdminAllocationsTable();
    });
  }

  const searchInput = document.getElementById("allocations-search-input");
  const clearBtn = document.getElementById("allocations-clear-search");
  if (searchInput) {
    activeAdminAllocationsState.searchQuery = searchInput.value || "";
    searchInput.addEventListener("input", function () {
      activeAdminAllocationsState.searchQuery = this.value || "";
      if (clearBtn) {
        clearBtn.style.display = this.value.trim().length > 0 ? "flex" : "none";
      }
      renderAdminAllocationsTable();
    });
  }
  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", function () {
      searchInput.value = "";
      activeAdminAllocationsState.searchQuery = "";
      clearBtn.style.display = "none";
      renderAdminAllocationsTable();
      searchInput.focus();
    });
  }

  renderAdminAllocationsTable();
}

function renderAdminAllocationsTable() {
  const tbody = document.getElementById("admin-allocations-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const allAllocations = getEnrichedAllocations();
  const filtered = getFilteredAllocations();

  const noticeEl = document.getElementById("admin-allocations-notice");
  if (noticeEl) {
    const confirmedCount = allAllocations.filter((a) => isAllocationConfirmed(a)).length;
    noticeEl.innerHTML = `
      <strong>${filtered.length}</strong> Showing
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${allAllocations.length}</strong> Total
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${confirmedCount}</strong> Confirmed
    `;
    noticeEl.style.display = "inline-flex";
  }

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="10" class="table-empty-row">No allocations found.</td>`;
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach((row) => {
    const tr = document.createElement("tr");
    tr.id = `alloc-row-${row.allocation_id}`;

    const tdAllocId = document.createElement("td");
    tdAllocId.className = "tabular";
    tdAllocId.style.fontWeight = "600";
    tdAllocId.textContent = row.allocation_id;

    const tdReqId = document.createElement("td");
    tdReqId.className = "tabular";
    tdReqId.textContent = row.request_id;

    const tdStudent = document.createElement("td");
    tdStudent.innerHTML = `<span class="tabular" style="font-weight: 600;">${escapeHtml(row.student_id)}</span><br /><span style="font-size: 0.78rem; color: var(--color-text-muted);">${escapeHtml(row.student_name)}</span>`;

    const tdProject = document.createElement("td");
    tdProject.style.fontWeight = "600";
    tdProject.textContent = row.project_title;

    const tdPc = document.createElement("td");
    tdPc.className = "tabular";
    tdPc.textContent = row.pc_label;

    const tdDate = document.createElement("td");
    tdDate.className = "tabular";
    tdDate.textContent = row.date;

    const tdTime = document.createElement("td");
    tdTime.className = "tabular";
    tdTime.textContent = row.time;

    const tdBy = document.createElement("td");
    tdBy.style.fontSize = "0.8125rem";
    tdBy.style.color = "var(--color-text-muted)";
    tdBy.textContent = row.allocated_by_label;

    const tdStatus = document.createElement("td");
    tdStatus.appendChild(createStatusBadge(row.status));

    const tdAction = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "action-buttons";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn-reject";
    cancelBtn.textContent = "Cancel allocation";
    cancelBtn.onclick = () => openCancelAllocationConfirm(row.allocation_id);
    actionWrap.appendChild(cancelBtn);

    tdAction.appendChild(actionWrap);

    tr.appendChild(tdAllocId);
    tr.appendChild(tdReqId);
    tr.appendChild(tdStudent);
    tr.appendChild(tdProject);
    tr.appendChild(tdPc);
    tr.appendChild(tdDate);
    tr.appendChild(tdTime);
    tr.appendChild(tdBy);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function openCancelAllocationConfirm(allocationId) {
  const enriched = getEnrichedAllocations();
  const row = enriched.find((a) => a.allocation_id === allocationId);
  if (!row) return;

  activeAdminAllocationsState.cancellingAllocationId = row.allocation_id;

  let modalEl = document.getElementById("alloc-cancel-modal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "alloc-cancel-modal";
    modalEl.className = "modal-overlay";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "alloc-cancel-title");
    modalEl.innerHTML = `
      <div class="modal-box" style="max-width: 460px;">
        <div class="modal-header">
          <div>
            <span class="kicker">RELEASE WORKSTATION ALLOCATION</span>
            <h3 id="alloc-cancel-title">Cancel Allocation?</h3>
          </div>
          <button type="button" class="toast-close" onclick="closeCancelAllocationConfirm()" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <p id="alloc-cancel-message" style="font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.5;"></p>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="closeCancelAllocationConfirm()">Keep Allocation</button>
          <button type="button" id="alloc-cancel-confirm-btn" class="btn-reject" style="padding: 0.45rem 0.9rem; font-size: 0.8125rem;">Confirm Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeCancelAllocationConfirm();
    });
  }

  const msgEl = document.getElementById("alloc-cancel-message");
  if (msgEl) {
    msgEl.textContent = `Are you sure you want to cancel allocation ${row.allocation_id} (${row.pc_label}, ${row.date} ${row.time})? This will make the slot Available again and set request ${row.request_id} back to Pending.`;
  }

  const confirmBtn = document.getElementById("alloc-cancel-confirm-btn");
  if (confirmBtn) {
    confirmBtn.onclick = () => confirmCancelAllocation(row.allocation_id);
  }

  modalEl.classList.add("open");
}

function closeCancelAllocationConfirm() {
  const modalEl = document.getElementById("alloc-cancel-modal");
  if (modalEl) modalEl.classList.remove("open");
  activeAdminAllocationsState.cancellingAllocationId = null;
}

function confirmCancelAllocation(allocationId) {
  const allocations = getData(STORAGE_KEYS.ALLOCATIONS);
  const target = allocations.find((a) => a.allocation_id === allocationId);
  if (!target) {
    closeCancelAllocationConfirm();
    return;
  }

  // 1. Remove allocation from rp_allocations (makes the PC+slot Available again)
  const remainingAllocs = allocations.filter((a) => a.allocation_id !== allocationId);
  saveData(STORAGE_KEYS.ALLOCATIONS, remainingAllocs);

  // 2. Set the linked request back to Pending in rp_requests (if present)
  if (target.request_id) {
    const requests = getData(STORAGE_KEYS.REQUESTS);
    const reqIdx = requests.findIndex((r) => r.request_id === target.request_id);
    if (reqIdx !== -1) {
      requests[reqIdx].status = "Pending";
      if ("pc_id" in requests[reqIdx]) delete requests[reqIdx].pc_id;
      if ("slot_id" in requests[reqIdx]) delete requests[reqIdx].slot_id;
      if (typeof DEFAULT_PENDING_TARGETS !== "undefined" && DEFAULT_PENDING_TARGETS[target.request_id]) {
        delete DEFAULT_PENDING_TARGETS[target.request_id];
      }
      saveData(STORAGE_KEYS.REQUESTS, requests);
    }
  }

  closeCancelAllocationConfirm();

  addActivityLog({
    action_type: "Allocation Cancelled",
    category: "allocation",
    actor_role: "admin",
    target_id: allocationId,
    description: `Cancelled allocation ${allocationId} (${target.pc_id} / ${target.slot_id}); slot made Available and request ${target.request_id} returned to Pending.`
  });

  populateAllocationFilterOptions();
  renderAdminAllocationsTable();
  updateAdminMetrics();
  updateAdminRequestsNotice();
  renderAdminRequests();
  if (typeof renderAdminRequestsManageTable === "function") {
    renderAdminRequestsManageTable();
  }
  renderSlotGrid();
  updateNextFreeSlotBadge();
  if (typeof renderHomeOverview === "function") {
    renderHomeOverview();
  }

  showToast(
    `Allocation ${allocationId} cancelled. Slot ${target.slot_id} on ${target.pc_id} is now Available and request ${target.request_id} is Pending.`,
    "info"
  );
}

function exportFilteredAllocationsCSV() {
  const filtered = getFilteredAllocations();
  if (filtered.length === 0) {
    showToast("No allocations found.", "warning");
    return;
  }

  function escapeCsvCell(value) {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }

  const headers = [
    "Allocation ID",
    "Request ID",
    "Student ID",
    "Student Name",
    "Project",
    "PC",
    "Date",
    "Time",
    "Allocated by",
    "Status"
  ];
  const csvRows = [headers.map(escapeCsvCell).join(",")];

  filtered.forEach((row) => {
    csvRows.push(
      [
        row.allocation_id,
        row.request_id,
        row.student_id,
        row.student_name,
        row.project_title,
        row.pc_label,
        row.date,
        row.time,
        row.allocated_by_label,
        row.status
      ]
        .map(escapeCsvCell)
        .join(",")
    );
  });

  const csvContent = csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = "ResearchPC_Allocations_Schedule.csv";

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

  showToast(`Schedule exported (${filtered.length} allocation${filtered.length === 1 ? "" : "s"}).`, "success");
}

/* ==========================================================================
   ADMIN ACTIVITY LOGS MODULE (admin-logs.html)
   ========================================================================== */

let activeAdminLogsState = {
  categoryFilter: "ALL",
  order: "newest",
  searchQuery: ""
};

function createActivityBadge(actionType) {
  const badge = document.createElement("span");
  const typeLower = String(actionType || "").toLowerCase();
  let statusClass = "badge-pending";
  if (
    typeLower.includes("approved") ||
    typeLower.includes("registered") ||
    typeLower.includes("added")
  ) {
    statusClass = "badge-approved";
  } else if (
    typeLower.includes("rejected") ||
    typeLower.includes("cancelled") ||
    typeLower.includes("deleted")
  ) {
    statusClass = "badge-rejected";
  }
  badge.className = `status-badge ${statusClass}`;
  badge.innerHTML = `<span class="badge-dot" aria-hidden="true"></span><span>${escapeHtml(actionType || "Activity")}</span>`;
  return badge;
}

function getNumericLogSeq(logId) {
  const m = String(logId || "").match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

function getFilteredLogs() {
  const logs = getData(STORAGE_KEYS.LOGS, []);
  const categoryFilter = activeAdminLogsState.categoryFilter || "ALL";
  const order = activeAdminLogsState.order || "newest";
  const searchQuery = (activeAdminLogsState.searchQuery || "").trim().toLowerCase();

  const filtered = logs.filter((entry) => {
    if (!entry) return false;
    if (categoryFilter !== "ALL" && entry.category !== categoryFilter) {
      return false;
    }
    if (searchQuery) {
      const haystack = [
        entry.log_id,
        entry.timestamp,
        entry.action_type,
        entry.category,
        entry.actor_id,
        entry.actor_name,
        entry.actor_role,
        entry.target_id,
        entry.description
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(searchQuery)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    const timeCmp = String(a.timestamp || "").localeCompare(String(b.timestamp || ""));
    if (timeCmp !== 0) {
      return order === "oldest" ? timeCmp : -timeCmp;
    }
    const seqCmp = getNumericLogSeq(a.log_id) - getNumericLogSeq(b.log_id);
    return order === "oldest" ? seqCmp : -seqCmp;
  });

  return filtered;
}

function initAdminLogsPage() {
  const tbody = document.getElementById("admin-logs-tbody");
  if (!tbody) return;

  const session = getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "admin-login.html";
    return;
  }

  updateActiveSidebarItem();

  const adminList = getAdmins();
  const admin = adminList.find((a) => a.admin_id === session.id) || adminList[0];
  const adminName = admin && admin.name ? admin.name : "Md. Atik Ishrak";
  const adminNameEl = document.getElementById("topbar-admin-name");
  if (adminNameEl) {
    adminNameEl.textContent = adminName;
  }

  const categorySelect = document.getElementById("logs-category-filter");
  if (categorySelect) {
    activeAdminLogsState.categoryFilter = categorySelect.value || "ALL";
    categorySelect.addEventListener("change", function () {
      activeAdminLogsState.categoryFilter = this.value || "ALL";
      renderAdminLogsTable();
    });
  }

  const orderSelect = document.getElementById("logs-order-select");
  if (orderSelect) {
    activeAdminLogsState.order = orderSelect.value || "newest";
    orderSelect.addEventListener("change", function () {
      activeAdminLogsState.order = this.value || "newest";
      renderAdminLogsTable();
    });
  }

  const searchInput = document.getElementById("logs-search-input");
  const clearBtn = document.getElementById("logs-clear-search");
  if (searchInput) {
    activeAdminLogsState.searchQuery = searchInput.value || "";
    searchInput.addEventListener("input", function () {
      activeAdminLogsState.searchQuery = this.value || "";
      if (clearBtn) {
        clearBtn.style.display = this.value.trim().length > 0 ? "flex" : "none";
      }
      renderAdminLogsTable();
    });
  }
  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", function () {
      searchInput.value = "";
      activeAdminLogsState.searchQuery = "";
      clearBtn.style.display = "none";
      renderAdminLogsTable();
      searchInput.focus();
    });
  }

  renderAdminLogsTable();
}

function renderAdminLogsTable() {
  const tbody = document.getElementById("admin-logs-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const allLogs = getData(STORAGE_KEYS.LOGS, []);
  const filtered = getFilteredLogs();

  const noticeEl = document.getElementById("admin-logs-notice");
  if (noticeEl) {
    noticeEl.innerHTML = `
      <strong>${filtered.length}</strong> Showing
      <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
      <strong>${allLogs.length}</strong> Total Events
    `;
    noticeEl.style.display = "inline-flex";
  }

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" class="table-empty-row">No activity logs found.</td>`;
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach((entry) => {
    const tr = document.createElement("tr");
    tr.id = `log-row-${entry.log_id}`;

    const tdId = document.createElement("td");
    tdId.className = "tabular";
    tdId.style.fontWeight = "600";
    tdId.textContent = entry.log_id;

    const tdTime = document.createElement("td");
    tdTime.className = "tabular";
    tdTime.style.color = "var(--color-text-muted)";
    tdTime.textContent = entry.timestamp || "-";

    const tdActivity = document.createElement("td");
    tdActivity.appendChild(createActivityBadge(entry.action_type));

    const tdActor = document.createElement("td");
    const roleLabel = entry.actor_role ? ` (${entry.actor_role})` : "";
    tdActor.innerHTML = `<span class="tabular" style="font-weight: 600;">${escapeHtml(entry.actor_id || "-")}</span><br /><span style="font-size: 0.78rem; color: var(--color-text-muted);">${escapeHtml((entry.actor_name || "-") + roleLabel)}</span>`;

    const tdTarget = document.createElement("td");
    tdTarget.className = "tabular";
    tdTarget.textContent = entry.target_id || "-";

    const tdDesc = document.createElement("td");
    tdDesc.textContent = entry.description || "-";

    tr.appendChild(tdId);
    tr.appendChild(tdTime);
    tr.appendChild(tdActivity);
    tr.appendChild(tdActor);
    tr.appendChild(tdTarget);
    tr.appendChild(tdDesc);

    tbody.appendChild(tr);
  });
}

function exportActivityLogsCSV() {
  const filtered = getFilteredLogs();
  if (filtered.length === 0) {
    showToast("No activity logs found.", "warning");
    return;
  }

  function escapeCsvCell(value) {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }

  const headers = [
    "Log ID",
    "Timestamp",
    "Action Type",
    "Category",
    "Actor ID",
    "Actor Name",
    "Role",
    "Target",
    "Details"
  ];
  const csvRows = [headers.map(escapeCsvCell).join(",")];

  filtered.forEach((entry) => {
    csvRows.push(
      [
        entry.log_id,
        entry.timestamp,
        entry.action_type,
        entry.category,
        entry.actor_id,
        entry.actor_name,
        entry.actor_role,
        entry.target_id,
        entry.description
      ]
        .map(escapeCsvCell)
        .join(",")
    );
  });

  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = "ResearchPC_Activity_Logs.csv";

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

  showToast(`Downloaded ${filtered.length} activity log entries as ${filename}.`, "success");
}

/* ==========================================================================
   ADMIN USERS MANAGEMENT PAGE ("admin-users.html")
   ========================================================================== */

let activeAdminUsersState = {
  tab: "students",
  searchQuery: ""
};

function normalizeUserStatusLabel(status) {
  return String(status || "Active").toLowerCase() === "inactive" ? "Inactive" : "Active";
}

function getStudentRequestCount(studentId) {
  const target = normalizeStudentId(studentId);
  if (!target) return 0;
  const requests = getData(STORAGE_KEYS.REQUESTS, []);
  return requests.filter((r) => r && normalizeStudentId(r.student_id) === target).length;
}

function initAdminUsersPage() {
  const studentsTbody = document.getElementById("admin-users-students-tbody");
  const supervisorsTbody = document.getElementById("admin-users-supervisors-tbody");
  if (!studentsTbody || !supervisorsTbody) return;

  const session = getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "admin-login.html";
    return;
  }

  updateActiveSidebarItem();

  const adminList = getAdmins();
  const admin = adminList.find((a) => a.admin_id === session.id) || adminList[0];
  const adminName = admin && admin.name ? admin.name : "Md. Atik Ishrak";
  const adminNameEl = document.getElementById("topbar-admin-name");
  if (adminNameEl) {
    adminNameEl.textContent = adminName;
  }

  const searchInput = document.getElementById("users-search-input");
  const clearBtn = document.getElementById("users-clear-search");
  if (searchInput) {
    activeAdminUsersState.searchQuery = searchInput.value || "";
    searchInput.addEventListener("input", function () {
      activeAdminUsersState.searchQuery = this.value || "";
      if (clearBtn) {
        clearBtn.style.display = this.value.trim().length > 0 ? "flex" : "none";
      }
      renderAdminUsersTables();
    });
  }
  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", function () {
      searchInput.value = "";
      activeAdminUsersState.searchQuery = "";
      clearBtn.style.display = "none";
      renderAdminUsersTables();
      searchInput.focus();
    });
  }

  switchUsersTab(activeAdminUsersState.tab || "students");
}

function switchUsersTab(tabName) {
  const tab = tabName === "supervisors" ? "supervisors" : "students";
  activeAdminUsersState.tab = tab;

  const btnStudents = document.getElementById("tab-btn-students");
  const btnSupervisors = document.getElementById("tab-btn-supervisors");
  const panelStudents = document.getElementById("panel-users-students");
  const panelSupervisors = document.getElementById("panel-users-supervisors");
  const titleEl = document.getElementById("users-table-title");
  const subtitleEl = document.getElementById("users-table-subtitle");

  if (btnStudents) {
    btnStudents.classList.toggle("active", tab === "students");
    btnStudents.setAttribute("aria-selected", tab === "students" ? "true" : "false");
  }
  if (btnSupervisors) {
    btnSupervisors.classList.toggle("active", tab === "supervisors");
    btnSupervisors.setAttribute("aria-selected", tab === "supervisors" ? "true" : "false");
  }
  if (panelStudents) {
    panelStudents.classList.toggle("active", tab === "students");
    panelStudents.style.display = tab === "students" ? "block" : "none";
  }
  if (panelSupervisors) {
    panelSupervisors.classList.toggle("active", tab === "supervisors");
    panelSupervisors.style.display = tab === "supervisors" ? "block" : "none";
  }

  if (titleEl) {
    titleEl.textContent = tab === "students" ? "Students" : "Supervisors";
  }
  if (subtitleEl) {
    subtitleEl.textContent =
      tab === "students"
        ? "Registered student accounts from shared storage with total submitted requests"
        : "Faculty research supervisors available for request endorsements";
  }

  renderAdminUsersTables();
}

function renderAdminUsersTables() {
  renderAdminUsersStudentsTable();
  renderAdminUsersSupervisorsTable();
  updateAdminUsersNotice();
}

function updateAdminUsersNotice() {
  const noticeEl = document.getElementById("admin-users-notice");
  if (!noticeEl) return;

  const isStudents = activeAdminUsersState.tab !== "supervisors";
  const list = isStudents
    ? getData(STORAGE_KEYS.STUDENTS, [])
    : getAllSupervisors();

  const activeCount = list.filter((u) => normalizeUserStatusLabel(u && u.status) === "Active").length;
  const inactiveCount = list.length - activeCount;

  noticeEl.innerHTML = `
    <strong>${activeCount}</strong> Active
    <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
    <strong>${inactiveCount}</strong> Inactive
    <span style="opacity:0.4; margin: 0 0.25rem;">&bull;</span>
    <strong>${list.length}</strong> Total
  `;
  noticeEl.style.display = "inline-flex";
}

function renderAdminUsersStudentsTable() {
  const tbody = document.getElementById("admin-users-students-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const query = (activeAdminUsersState.searchQuery || "").trim().toLowerCase();
  const studentsList = getData(STORAGE_KEYS.STUDENTS, []);

  const filtered = studentsList.filter((stu) => {
    if (!stu) return false;
    const statusLabel = normalizeUserStatusLabel(stu.status);
    if (!query) return true;
    // Deliberately exclude password_hash from search or DOM
    const haystack = [
      stu.student_id,
      stu.name,
      stu.email,
      stu.phone,
      stu.department,
      stu.batch,
      statusLabel
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="9" class="table-empty-row">No students found.</td>`;
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach((stu) => {
    const statusLabel = normalizeUserStatusLabel(stu.status);
    const isActive = statusLabel === "Active";
    const reqCount = getStudentRequestCount(stu.student_id);

    const tr = document.createElement("tr");
    tr.id = `user-student-row-${stu.student_id}`;

    const tdId = document.createElement("td");
    tdId.className = "tabular";
    tdId.style.fontWeight = "600";
    tdId.textContent = stu.student_id || "-";

    const tdName = document.createElement("td");
    tdName.style.fontWeight = "500";
    tdName.textContent = stu.name || "-";

    const tdEmail = document.createElement("td");
    tdEmail.textContent = stu.email || "-";

    const tdPhone = document.createElement("td");
    tdPhone.className = "tabular";
    tdPhone.textContent = stu.phone || "-";

    const tdDept = document.createElement("td");
    tdDept.textContent = stu.department || "-";

    const tdBatch = document.createElement("td");
    tdBatch.className = "tabular";
    tdBatch.textContent = stu.batch || "-";

    const tdReqCount = document.createElement("td");
    tdReqCount.className = "tabular";
    tdReqCount.style.fontWeight = "600";
    tdReqCount.textContent = String(reqCount);

    const tdStatus = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `status-badge ${isActive ? "badge-approved" : "badge-rejected"}`;
    badge.innerHTML = `<span class="badge-dot" aria-hidden="true"></span><span>${statusLabel}</span>`;
    tdStatus.appendChild(badge);

    const tdAction = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "admin-actions-cell";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = isActive ? "btn-reject" : "btn-approve";
    toggleBtn.textContent = isActive ? "Deactivate" : "Activate";
    toggleBtn.onclick = () => toggleUserStatus("student", stu.student_id);
    actionWrap.appendChild(toggleBtn);
    tdAction.appendChild(actionWrap);

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdEmail);
    tr.appendChild(tdPhone);
    tr.appendChild(tdDept);
    tr.appendChild(tdBatch);
    tr.appendChild(tdReqCount);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function renderAdminUsersSupervisorsTable() {
  const tbody = document.getElementById("admin-users-supervisors-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const query = (activeAdminUsersState.searchQuery || "").trim().toLowerCase();
  const supervisorsList = getAllSupervisors();

  const filtered = supervisorsList.filter((sup) => {
    if (!sup) return false;
    const statusLabel = normalizeUserStatusLabel(sup.status);
    if (!query) return true;
    const haystack = [
      sup.supervisor_id,
      sup.name,
      sup.email,
      sup.phone,
      sup.department,
      statusLabel
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7" class="table-empty-row">No supervisors found.</td>`;
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach((sup) => {
    const statusLabel = normalizeUserStatusLabel(sup.status);
    const isActive = statusLabel === "Active";

    const tr = document.createElement("tr");
    tr.id = `user-supervisor-row-${sup.supervisor_id}`;

    const tdId = document.createElement("td");
    tdId.className = "tabular";
    tdId.style.fontWeight = "600";
    tdId.textContent = sup.supervisor_id || "-";

    const tdName = document.createElement("td");
    tdName.style.fontWeight = "500";
    tdName.textContent = sup.name || "-";

    const tdEmail = document.createElement("td");
    tdEmail.textContent = sup.email || "-";

    const tdPhone = document.createElement("td");
    tdPhone.className = "tabular";
    tdPhone.textContent = sup.phone || "-";

    const tdDept = document.createElement("td");
    tdDept.textContent = sup.department || "-";

    const tdStatus = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `status-badge ${isActive ? "badge-approved" : "badge-rejected"}`;
    badge.innerHTML = `<span class="badge-dot" aria-hidden="true"></span><span>${statusLabel}</span>`;
    tdStatus.appendChild(badge);

    const tdAction = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "admin-actions-cell";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = isActive ? "btn-reject" : "btn-approve";
    toggleBtn.textContent = isActive ? "Deactivate" : "Activate";
    toggleBtn.onclick = () => toggleUserStatus("supervisor", sup.supervisor_id);
    actionWrap.appendChild(toggleBtn);
    tdAction.appendChild(actionWrap);

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdEmail);
    tr.appendChild(tdPhone);
    tr.appendChild(tdDept);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

function toggleUserStatus(userType, userId) {
  const session = getSession();
  const adminId = session && session.role === "admin" ? session.id : "AD01";

  if (userType === "student") {
    const studentsList = getData(STORAGE_KEYS.STUDENTS, []);
    const targetNorm = normalizeStudentId(userId);
    const idx = studentsList.findIndex(
      (s) => s && normalizeStudentId(s.student_id) === targetNorm
    );
    if (idx === -1) return;

    const currentStatus = normalizeUserStatusLabel(studentsList[idx].status);
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
    studentsList[idx] = { ...studentsList[idx], status: nextStatus };
    saveData(STORAGE_KEYS.STUDENTS, studentsList);

    addActivityLog({
      action_type: nextStatus === "Inactive" ? "User Deactivated" : "User Activated",
      category: "profile",
      actor_id: adminId,
      actor_role: "admin",
      target_id: studentsList[idx].student_id,
      description: `${nextStatus === "Inactive" ? "Deactivated" : "Activated"} student account ${studentsList[idx].student_id} (${studentsList[idx].name}).`
    });

    showToast(
      `Student ${studentsList[idx].student_id} is now ${nextStatus}.`,
      nextStatus === "Active" ? "success" : "warning"
    );
  } else if (userType === "supervisor") {
    const supervisorsList = getAllSupervisors();
    const idx = supervisorsList.findIndex(
      (s) => s && String(s.supervisor_id).toUpperCase() === String(userId).toUpperCase()
    );
    if (idx === -1) return;

    const currentStatus = normalizeUserStatusLabel(supervisorsList[idx].status);
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
    supervisorsList[idx] = { ...supervisorsList[idx], status: nextStatus };
    saveData(STORAGE_KEYS.SUPERVISORS, supervisorsList);

    addActivityLog({
      action_type: nextStatus === "Inactive" ? "User Deactivated" : "User Activated",
      category: "profile",
      actor_id: adminId,
      actor_role: "admin",
      target_id: supervisorsList[idx].supervisor_id,
      description: `${nextStatus === "Inactive" ? "Deactivated" : "Activated"} supervisor ${supervisorsList[idx].supervisor_id} (${supervisorsList[idx].name}).`
    });

    showToast(
      `Supervisor ${supervisorsList[idx].supervisor_id} is now ${nextStatus}.`,
      nextStatus === "Active" ? "success" : "warning"
    );
  }

  renderAdminUsersTables();
}

/**
 * 4. Logout removes "rp_session" and goes to index.html.
 */
function handleLogout() {
  clearSession();
  window.location.href = "index.html";
}
window.handleLogout = handleLogout;


/* ==========================================================================
   DYNAMIC SIDEBAR & MODALS
   ========================================================================== */

function updateActiveSidebarItem() {
  const pathname = window.location.pathname || "";
  const segments = pathname.split("/").filter(Boolean);
  const currentFileName = (segments.length > 0 ? segments[segments.length - 1] : "").toLowerCase();
  const currentBase = currentFileName.replace(/\.html$/, "");

  const sidebarNav = document.querySelector(".portal-sidebar .sidebar-nav");
  if (!sidebarNav) return;

  const sidebarLinks = sidebarNav.querySelectorAll(".sidebar-item");
  if (!sidebarLinks || sidebarLinks.length === 0) return;

  let matched = false;

  sidebarLinks.forEach((item) => {
    item.classList.remove("active");

    const href = item.getAttribute("href");
    if (href) {
      const linkFile = href.split("#")[0].split("?")[0].split("/").pop().toLowerCase();
      const linkBase = linkFile.replace(/\.html$/, "");
      if (
        (currentFileName && linkFile && currentFileName === linkFile) ||
        (currentBase && linkBase && currentBase === linkBase) ||
        (pathname && linkFile && pathname.toLowerCase().endsWith(linkFile))
      ) {
        item.classList.add("active");
        matched = true;
      }
    }
  });

  if (!matched && document.body && document.body.classList) {
    const fallbackMap = [
      ["page-student-dashboard", 'a[href*="student-dashboard"]'],
      ["page-new-request", 'a[href*="new-request"]'],
      ["page-my-requests", 'a[href*="my-requests"]'],
      ["page-my-schedule", 'a[href*="my-schedule"]'],
      ["page-profile", 'a[href*="profile"]'],
      ["page-admin-dashboard", 'a[href*="admin-dashboard"]'],
      ["page-admin-requests", 'a[href*="admin-requests"]'],
      ["page-admin-pcs-slots", 'a[href*="admin-pcs-slots"]'],
      ["page-admin-allocations", 'a[href*="admin-allocations"]'],
      ["page-admin-logs", 'a[href*="admin-logs"]'],
      ["page-admin-users", 'a[href*="admin-users"]'],
      ["page-supervisor-dashboard", 'a[href*="supervisor-dashboard"]'],
      ["page-supervisor-requests", 'a[href*="supervisor-requests"]'],
      ["page-emergency-request", 'a[href*="emergency-request"]']
    ];
    for (const [bodyClass, selector] of fallbackMap) {
      if (document.body.classList.contains(bodyClass)) {
        const el = sidebarNav.querySelector(selector);
        if (el) el.classList.add("active");
        break;
      }
    }
  }
}

// Request detail modal
window.openRequestDetail = function(requestId) {
  const requests = getData(STORAGE_KEYS.REQUESTS);
  const req = requests.find((r) => r.request_id === requestId);
  if (!req) return;

  const student = findStudent(req.student_id) || {
    name: "Unknown Student",
    department: "Research Lab"
  };

  const supervisorsList = getAllSupervisors();
  const supervisorObj = supervisorsList.find((s) => String(s.supervisor_id) === String(req.supervisor_id)) || null;
  const supervisorText = supervisorObj
    ? `${supervisorObj.supervisor_id} (${supervisorObj.name})`
    : (req.supervisor_id || "-");

  const datesText =
    req.required_from && req.required_to && req.required_from !== req.required_to
      ? `${req.required_from} to ${req.required_to}`
      : (req.required_from || req.required_to || "-");

  let modalEl = document.getElementById("request-modal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "request-modal";
    modalEl.className = "modal-overlay";
    modalEl.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <div>
            <span class="kicker">DATABASE RECORD: RESEARCH_REQUEST</span>
            <h3 id="modal-project-title">Request Details</h3>
          </div>
          <button type="button" class="toast-close" onclick="closeRequestDetail()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">request_id</span>
              <span class="detail-value tabular" id="modal-req-id"></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">student_id &amp; name</span>
              <span class="detail-value" id="modal-student-info"></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">supervisor_id</span>
              <span class="detail-value" id="modal-supervisor"></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">status</span>
              <span class="detail-value" id="modal-status"></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">required_from / required_to</span>
              <span class="detail-value tabular" id="modal-dates"></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">created_at</span>
              <span class="detail-value tabular" id="modal-created"></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">model_type</span>
              <span class="detail-value" id="modal-model"></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">dataset_size</span>
              <span class="detail-value" id="modal-dataset"></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">priority</span>
              <span class="detail-value" id="modal-priority"></span>
            </div>
            <div class="detail-item detail-full">
              <span class="detail-label">purpose</span>
              <p class="detail-value" id="modal-purpose" style="margin-top: 0.25rem; font-size: 0.875rem; color: var(--color-text-muted);"></p>
            </div>
            <div class="detail-item detail-full" id="modal-allocation-section" style="display: none; padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid #bbf7d0; background-color: #f0fdf4;">
              <span class="detail-label" style="color: #166534;">ALLOCATED WORKSTATION &amp; TIME SLOT</span>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.5rem;">
                <div>
                  <span class="detail-label">Allocated PC</span>
                  <div class="detail-value tabular" id="modal-allocated-pc" style="font-weight: 600; color: #166534;"></div>
                </div>
                <div>
                  <span class="detail-label">Time Slot</span>
                  <div class="detail-value tabular" id="modal-allocated-slot" style="font-weight: 600; color: #166534;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="closeRequestDetail()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeRequestDetail();
    });
  }

  document.getElementById("modal-project-title").textContent = req.project_title;
  document.getElementById("modal-req-id").textContent = req.request_id;
  document.getElementById("modal-student-info").textContent = `${req.student_id} (${student.name})`;
  document.getElementById("modal-supervisor").textContent = supervisorText;
  const modalStatusEl = document.getElementById("modal-status");
  if (modalStatusEl) {
    modalStatusEl.innerHTML = "";
    modalStatusEl.appendChild(createStatusBadge(req.status));
  }
  const modalDatesEl = document.getElementById("modal-dates");
  if (modalDatesEl) modalDatesEl.textContent = datesText;
  document.getElementById("modal-model").textContent = req.model_type || "-";
  document.getElementById("modal-dataset").textContent = req.dataset_size || "-";
  document.getElementById("modal-priority").textContent = req.priority || "-";
  document.getElementById("modal-created").textContent = req.created_at || "-";
  document.getElementById("modal-purpose").textContent = req.purpose || "-";

  // Show allocated PC & time slot if Approved
  const allocSection = document.getElementById("modal-allocation-section");
  const allocPcEl = document.getElementById("modal-allocated-pc");
  const allocSlotEl = document.getElementById("modal-allocated-slot");
  if (allocSection && allocPcEl && allocSlotEl) {
    if (req.status === "Approved") {
      const allocations = getData(STORAGE_KEYS.ALLOCATIONS);
      const pcs = getData(STORAGE_KEYS.PCS);
      const slots = getData(STORAGE_KEYS.SLOTS);

      const alloc =
        allocations.find((a) => a.request_id === req.request_id && isAllocationConfirmed(a)) ||
        allocations.find((a) => a.request_id === req.request_id);

      if (alloc) {
        const pc = pcs.find((p) => p.pc_id === alloc.pc_id);
        const slot = slots.find((s) => s.slot_id === alloc.slot_id);
        allocPcEl.textContent = pc ? `${pc.pc_number || pc.pc_id} (${pc.specification || pc.location || "Lab PC"})` : alloc.pc_id;
        allocSlotEl.textContent = slot ? `${slot.slot_date}, ${slot.start_time} - ${slot.end_time}` : alloc.slot_id;
      } else {
        allocPcEl.textContent = "Pending assignment";
        allocSlotEl.textContent = "To be scheduled";
      }
      allocSection.style.display = "block";
    } else {
      allocSection.style.display = "none";
    }
  }

  modalEl.classList.add("open");
};

window.closeRequestDetail = function() {
  const modalEl = document.getElementById("request-modal");
  if (modalEl) modalEl.classList.remove("open");
};

/* ==========================================================================
   TOAST NOTIFICATION SYSTEM
   Consistent non-blocking UI feedback across portal pages.
   ========================================================================== */

let toastTimer = null;

function showToast(message, type = "info", duration = 3000) {
  if (!message) return;

  let toastEl = document.getElementById("global-toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "global-toast";
    toastEl.className = "toast-notice";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    toastEl.innerHTML = `
      <span class="toast-icon" id="toast-icon">ℹ</span>
      <span id="toast-message-text" class="toast-message-text"></span>
      <button type="button" class="toast-close" onclick="hideToast()" aria-label="Close notification">&times;</button>
    `;
    document.body.appendChild(toastEl);
  }

  const msgSpan = document.getElementById("toast-message-text");
  if (msgSpan) {
    msgSpan.textContent = message;
  }

  const iconSpan = document.getElementById("toast-icon");
  if (iconSpan) {
    if (type === "success") iconSpan.textContent = "✓";
    else if (type === "warning") iconSpan.textContent = "⚠";
    else if (type === "error") iconSpan.textContent = "✕";
    else iconSpan.textContent = "ℹ";
  }

  toastEl.classList.remove("toast-info", "toast-success", "toast-warning", "toast-error");
  toastEl.classList.add(`toast-${type}`);

  // Re-trigger animation cleanly even if toast is already visible
  toastEl.classList.remove("show");
  void toastEl.offsetWidth; // Force DOM reflow
  toastEl.classList.add("show");

  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    hideToast();
  }, duration);
}

function hideToast() {
  const toastEl = document.getElementById("global-toast");
  if (toastEl) {
    toastEl.classList.remove("show");
  }
}

// Global exposure
window.showToast = showToast;
window.hideToast = hideToast;

// Safe replacement of window.alert with toast notification system
try {
  window.alert = function (msg) {
    showToast(String(msg || ""), "info", 3500);
  };
} catch (e) {
  // Graceful fallback if window.alert cannot be redefined
}

// Password toggle helper (supports single ID or comma-separated IDs)
function setupPasswordToggles() {
  const toggleBoxes = document.querySelectorAll("[data-toggle-password]");
  toggleBoxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const attr = this.getAttribute("data-toggle-password") || "";
      const targetIds = attr.split(",").map((id) => id.trim()).filter(Boolean);
      targetIds.forEach((targetId) => {
        const targetInput = document.getElementById(targetId);
        if (targetInput) {
          targetInput.type = this.checked ? "text" : "password";
        }
        const confirmInput = document.getElementById("confirm_password");
        if (confirmInput && targetId === "password_hash") {
          confirmInput.type = this.checked ? "text" : "password";
        }
      });
    });
  });
}


/* ==========================================================================
   FEATURE 1: 6-DIGIT VERIFICATION CODE MANAGER
   ========================================================================== */

const verificationState = {
  student: {
    pendingData: null,
    code: null,
    expiresAt: 0,
    attempts: 0,
    timerInterval: null,
    resendCooldownInterval: null
  },
  admin: {
    pendingAdmin: null,
    code: null,
    expiresAt: 0,
    attempts: 0,
    timerInterval: null,
    resendCooldownInterval: null
  },
  supervisor: {
    pendingSupervisor: null,
    code: null,
    expiresAt: 0,
    attempts: 0,
    timerInterval: null,
    resendCooldownInterval: null
  },
  reset: {
    role: "student",
    account: null,
    code: null,
    expiresAt: 0,
    attempts: 0,
    timerInterval: null,
    resendCooldownInterval: null
  }
};

let isSendingVerificationCode = false;

let activeVerification = {
  code: null,
  expiresAt: 0,
  toEmail: "",
  toName: ""
};

/**
 * Checks whether all EmailJS configuration keys are populated with real values.
 */
function isEmailJsConfigured() {
  if (!EMAILJS_CONFIG || typeof EMAILJS_CONFIG !== "object") return false;
  const values = [EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, EMAILJS_CONFIG.publicKey];
  return values.every((val) => {
    if (typeof val !== "string") return false;
    const trimmed = val.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith("PASTE_") || trimmed.startsWith("YOUR_")) return false;
    return true;
  });
}

/**
 * Renders an EmailJS verification send failure message cleanly with an optional grey Reason line.
 */
function showVerificationSendError(containerEl, result) {
  if (!containerEl) return;
  containerEl.innerHTML = "";

  const mainMsg = document.createElement("div");
  mainMsg.textContent = (result && result.userMessage)
    ? result.userMessage
    : "Could not send the code. Please check your email address and try again.";
  containerEl.appendChild(mainMsg);

  if (result && result.reason) {
    const reasonEl = document.createElement("div");
    reasonEl.style.marginTop = "0.25rem";
    reasonEl.style.fontSize = "0.75rem";
    reasonEl.style.color = "var(--color-text-muted)";
    reasonEl.style.fontWeight = "400";
    reasonEl.textContent = "Reason: " + result.reason;
    containerEl.appendChild(reasonEl);
  }
}

/**
 * Generates random 6-digit numeric string (0-9 only), preserving leading zeros.
 */
function generateVerificationCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

function renderDemoCodeBox(containerEl, boxId, insertBeforeEl, result) {
  if (!containerEl) return;
  let box = document.getElementById(boxId);
  if (result && result.demoMode && result.demoCode) {
    if (!box) {
      box = document.createElement("div");
      box.id = boxId;
      box.className = "demo-code-box";
      if (insertBeforeEl && insertBeforeEl.parentNode === containerEl) {
        containerEl.insertBefore(box, insertBeforeEl);
      } else {
        containerEl.appendChild(box);
      }
    }
    box.innerHTML = `Demo mode &mdash; Your verification code: <strong class="tabular">${escapeHtml(result.demoCode)}</strong>`;
    box.style.display = "block";
  } else if (box) {
    box.style.display = "none";
  }
}

// For the final version, generate and check the code on the Flask server and store it in MySQL, not in the browser.
async function sendVerificationCode(toEmail, toName) {
  const cleanEmail = String(toEmail || "").trim();
  const cleanName = String(toName || "User").trim() || "User";
  const code = generateVerificationCode();

  const storeCodeState = () => {
    const expiresAt = Date.now() + 5 * 60 * 1000;
    activeVerification = {
      code: code,
      expiresAt: expiresAt,
      toEmail: cleanEmail,
      toName: cleanName
    };

    if (typeof verificationState !== "undefined") {
      if (verificationState.student) {
        verificationState.student.code = code;
        verificationState.student.expiresAt = expiresAt;
      }
      if (verificationState.admin) {
        verificationState.admin.code = code;
        verificationState.admin.expiresAt = expiresAt;
      }
      if (verificationState.supervisor) {
        verificationState.supervisor.code = code;
        verificationState.supervisor.expiresAt = expiresAt;
      }
      if (verificationState.reset) {
        verificationState.reset.code = code;
        verificationState.reset.expiresAt = expiresAt;
      }
    }
    return expiresAt;
  };

  // In DEMO_MODE without EmailJS keys configured, surface the 6-digit code in the "Demo mode" box
  if (typeof DEMO_MODE !== "undefined" && DEMO_MODE && !isEmailJsConfigured()) {
    const expiresAt = storeCodeState();
    return {
      ok: true,
      demoMode: true,
      demoCode: code,
      expiresAt: expiresAt,
      email: cleanEmail
    };
  }

  // 1. Check that EmailJS SDK is loaded
  if (typeof emailjs === "undefined") {
    return {
      ok: false,
      userMessage: "EmailJS did not load. Check your internet connection.",
      reason: null
    };
  }

  // 2. Check that real EmailJS keys are set
  if (!isEmailJsConfigured()) {
    return {
      ok: false,
      userMessage: "EmailJS keys are not set in script.js.",
      reason: null
    };
  }

  try {
    await emailjs.send(
      EMAILJS_CONFIG.serviceId.trim(),
      EMAILJS_CONFIG.templateId.trim(),
      {
        to_email: cleanEmail,
        email: cleanEmail,
        user_email: cleanEmail,
        to_name: cleanName,
        name: cleanName,
        otp_code: code,
        expiry_minutes: 5
      }
    );

    // Only save the code and expiry time AFTER the send succeeds
    const expiresAt = storeCodeState();
    return { ok: true, expiresAt: expiresAt, email: cleanEmail };
  } catch (error) {
    console.error(error);
    const reasonText = (error && (error.text || error.message))
      ? String(error.text || error.message)
      : String(error || "Unknown error");

    return {
      ok: false,
      userMessage: "Could not send the code. Please check your email address and try again.",
      reason: reasonText
    };
  }
}

function startStudentVerification(newStudent, result) {
  const formStep = document.getElementById("register-step-form");
  const verifyStep = document.getElementById("register-step-verify");
  if (!formStep || !verifyStep) return;

  const state = verificationState.student;
  state.pendingData = newStudent;
  state.attempts = 0;

  formStep.style.display = "none";
  verifyStep.style.display = "block";

  const subtitleEl = document.getElementById("student-verify-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = `We sent a 6-digit code to ${newStudent.email}. Check your inbox and spam folder.`;
  }

  renderDemoCodeBox(
    verifyStep,
    "student-demo-code-box",
    document.getElementById("student-digit-wrap"),
    result
  );

  clearDigitBoxes("student-digit");
  const errEl = document.getElementById("student-verify-error");
  if (errEl) errEl.innerHTML = "";

  startVerificationTimer("student");
  startResendCooldown("student");
  setTimeout(() => focusFirstDigitBox("student-digit"), 50);
}

function handleVerifyStudentCode() {
  const state = verificationState.student;
  const errEl = document.getElementById("student-verify-error");
  const typedCode = getEnteredCode("student-digit");

  if (!typedCode || typedCode.length < 6) {
    if (errEl) errEl.textContent = "Please enter all 6 digits.";
    shakeDigitBoxes("student-digit");
    return;
  }

  if (Date.now() > state.expiresAt) {
    if (errEl) errEl.textContent = "Code expired. Please click 'Resend code'.";
    shakeDigitBoxes("student-digit");
    return;
  }

  const validCode = state.code || activeVerification.code;
  if (typedCode === validCode) {
    // Correct code: finalize student registration into shared localStorage
    clearInterval(state.timerInterval);
    clearInterval(state.resendCooldownInterval);

    const studentToSave = state.pendingData;
    const studentsList = getData(STORAGE_KEYS.STUDENTS);
    studentsList.push(studentToSave);
    saveData(STORAGE_KEYS.STUDENTS, studentsList);

    addActivityLog({
      action_type: "Student Registered",
      category: "profile",
      actor_id: studentToSave.student_id,
      actor_name: studentToSave.name,
      actor_role: "student",
      target_id: studentToSave.student_id,
      description: `Registered new student account ${studentToSave.student_id} (${studentToSave.name}, ${studentToSave.department}).`
    });

    const verifyStep = document.getElementById("register-step-verify");
    if (verifyStep) verifyStep.style.display = "none";

    const successAlert = document.getElementById("register-success-alert");
    if (successAlert) {
      successAlert.textContent = "Registration successful! Redirecting to login...";
      successAlert.classList.add("alert-visible");
    }

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } else {
    state.attempts++;
    if (state.attempts >= 3) {
      clearInterval(state.timerInterval);
      clearInterval(state.resendCooldownInterval);
      if (errEl) errEl.textContent = "Too many attempts, please try again";
      shakeDigitBoxes("student-digit");
      showToast("Too many attempts, please try again", "error");
      setTimeout(() => {
        cancelStudentVerification();
      }, 1500);
    } else {
      const remaining = 3 - state.attempts;
      if (errEl) {
        errEl.textContent = `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`;
      }
      shakeDigitBoxes("student-digit");
      clearDigitBoxes("student-digit");
      focusFirstDigitBox("student-digit");
    }
  }
}

function handleResendStudentCode() {
  const state = verificationState.student;
  const resendBtn = document.getElementById("student-resend-btn");
  if ((resendBtn && resendBtn.disabled) || isSendingVerificationCode) {
    return;
  }

  const errEl = document.getElementById("student-verify-error");
  if (errEl) errEl.innerHTML = "";

  const originalText = resendBtn ? resendBtn.textContent : "Resend code";
  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.textContent = "Sending code...";
  }

  const student = state.pendingData || { email: "", name: "" };
  isSendingVerificationCode = true;
  sendVerificationCode(student.email, student.name)
    .then((result) => {
      if (result && result.ok) {
        state.attempts = 0;
        renderDemoCodeBox(
          document.getElementById("register-step-verify"),
          "student-demo-code-box",
          document.getElementById("student-digit-wrap"),
          result
        );
        clearDigitBoxes("student-digit");
        focusFirstDigitBox("student-digit");
        startVerificationTimer("student");
        startResendCooldown("student");
        showToast("New verification code sent.", "info");
      } else {
        showVerificationSendError(errEl, result);
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.textContent = originalText;
        }
      }
    })
    .finally(() => {
      isSendingVerificationCode = false;
    });
}

function cancelStudentVerification() {
  const state = verificationState.student;
  clearInterval(state.timerInterval);
  clearInterval(state.resendCooldownInterval);
  state.pendingData = null;

  const formStep = document.getElementById("register-step-form");
  const verifyStep = document.getElementById("register-step-verify");
  if (verifyStep) verifyStep.style.display = "none";
  if (formStep) formStep.style.display = "block";
}

function startAdminVerification(matchedAdmin, result) {
  const formStep = document.getElementById("admin-step-form");
  const verifyStep = document.getElementById("admin-step-verify");
  if (!formStep || !verifyStep) return;

  const state = verificationState.admin;
  state.pendingAdmin = matchedAdmin;
  state.attempts = 0;

  formStep.style.display = "none";
  verifyStep.style.display = "block";

  const subtitleEl = document.getElementById("admin-verify-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = `We sent a 6-digit code to ${matchedAdmin.email}. Check your inbox and spam folder.`;
  }

  renderDemoCodeBox(
    verifyStep,
    "admin-demo-code-box",
    document.getElementById("admin-digit-wrap"),
    result
  );

  clearDigitBoxes("admin-digit");
  const errEl = document.getElementById("admin-verify-error");
  if (errEl) errEl.innerHTML = "";

  startVerificationTimer("admin");
  startResendCooldown("admin");
  setTimeout(() => focusFirstDigitBox("admin-digit"), 50);
}

function handleVerifyAdminCode() {
  const state = verificationState.admin;
  const errEl = document.getElementById("admin-verify-error");
  const typedCode = getEnteredCode("admin-digit");

  if (!typedCode || typedCode.length < 6) {
    if (errEl) errEl.textContent = "Please enter all 6 digits.";
    shakeDigitBoxes("admin-digit");
    return;
  }

  if (Date.now() > state.expiresAt) {
    if (errEl) errEl.textContent = "Code expired. Please click 'Resend code'.";
    shakeDigitBoxes("admin-digit");
    return;
  }

  const validCode = state.code || activeVerification.code;
  if (typedCode === validCode) {
    // Correct code: save admin session in shared localStorage and open admin dashboard
    clearInterval(state.timerInterval);
    clearInterval(state.resendCooldownInterval);

    setSession("admin", state.pendingAdmin.admin_id);
    window.location.href = "admin-dashboard.html";
  } else {
    state.attempts++;
    if (state.attempts >= 3) {
      clearInterval(state.timerInterval);
      clearInterval(state.resendCooldownInterval);
      if (errEl) errEl.textContent = "Too many attempts, please try again";
      shakeDigitBoxes("admin-digit");
      showToast("Too many attempts, please try again", "error");
      setTimeout(() => {
        cancelAdminVerification();
      }, 1500);
    } else {
      const remaining = 3 - state.attempts;
      if (errEl) {
        errEl.textContent = `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`;
      }
      shakeDigitBoxes("admin-digit");
      clearDigitBoxes("admin-digit");
      focusFirstDigitBox("admin-digit");
    }
  }
}

function handleResendAdminCode() {
  const state = verificationState.admin;
  const resendBtn = document.getElementById("admin-resend-btn");
  if ((resendBtn && resendBtn.disabled) || isSendingVerificationCode) {
    return;
  }

  const errEl = document.getElementById("admin-verify-error");
  if (errEl) errEl.innerHTML = "";

  const originalText = resendBtn ? resendBtn.textContent : "Resend code";
  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.textContent = "Sending code...";
  }

  const admin = state.pendingAdmin || { email: ADMIN_EMAIL, name: "Admin" };
  isSendingVerificationCode = true;
  sendVerificationCode(admin.email, admin.name)
    .then((result) => {
      if (result && result.ok) {
        state.attempts = 0;
        renderDemoCodeBox(
          document.getElementById("admin-step-verify"),
          "admin-demo-code-box",
          document.getElementById("admin-digit-wrap"),
          result
        );
        clearDigitBoxes("admin-digit");
        focusFirstDigitBox("admin-digit");
        startVerificationTimer("admin");
        startResendCooldown("admin");
        showToast("New verification code sent.", "info");
      } else {
        showVerificationSendError(errEl, result);
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.textContent = originalText;
        }
      }
    })
    .finally(() => {
      isSendingVerificationCode = false;
    });
}

function cancelAdminVerification() {
  const state = verificationState.admin;
  clearInterval(state.timerInterval);
  clearInterval(state.resendCooldownInterval);
  state.pendingAdmin = null;

  const formStep = document.getElementById("admin-step-form");
  const verifyStep = document.getElementById("admin-step-verify");
  if (verifyStep) verifyStep.style.display = "none";
  if (formStep) formStep.style.display = "block";
}

function startSupervisorVerification(matchedSupervisor, result) {
  const formStep = document.getElementById("supervisor-step-form");
  const verifyStep = document.getElementById("supervisor-step-verify");
  if (!formStep || !verifyStep) return;

  const state = verificationState.supervisor;
  state.pendingSupervisor = matchedSupervisor;
  state.attempts = 0;

  formStep.style.display = "none";
  verifyStep.style.display = "block";

  const subtitleEl = document.getElementById("supervisor-verify-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = `We sent a 6-digit code to ${matchedSupervisor.email}. Check your inbox and spam folder.`;
  }

  renderDemoCodeBox(
    verifyStep,
    "supervisor-demo-code-box",
    document.getElementById("supervisor-digit-wrap"),
    result
  );

  clearDigitBoxes("supervisor-digit");
  const errEl = document.getElementById("supervisor-verify-error");
  if (errEl) errEl.innerHTML = "";

  startVerificationTimer("supervisor");
  startResendCooldown("supervisor");
  setTimeout(() => focusFirstDigitBox("supervisor-digit"), 50);
}

function handleVerifySupervisorCode() {
  const state = verificationState.supervisor;
  const errEl = document.getElementById("supervisor-verify-error");
  const typedCode = getEnteredCode("supervisor-digit");

  if (!typedCode || typedCode.length < 6) {
    if (errEl) errEl.textContent = "Please enter all 6 digits.";
    shakeDigitBoxes("supervisor-digit");
    return;
  }

  if (Date.now() > state.expiresAt) {
    if (errEl) errEl.textContent = "Code expired. Please click 'Resend code'.";
    shakeDigitBoxes("supervisor-digit");
    return;
  }

  const validCode = state.code || activeVerification.code;
  if (typedCode === validCode) {
    clearInterval(state.timerInterval);
    clearInterval(state.resendCooldownInterval);

    setSession("supervisor", state.pendingSupervisor.supervisor_id);
    window.location.href = "supervisor-dashboard.html";
  } else {
    state.attempts++;
    if (state.attempts >= 3) {
      clearInterval(state.timerInterval);
      clearInterval(state.resendCooldownInterval);
      if (errEl) errEl.textContent = "Too many attempts, please try again";
      shakeDigitBoxes("supervisor-digit");
      showToast("Too many attempts, please try again", "error");
      setTimeout(() => {
        cancelSupervisorVerification();
      }, 1500);
    } else {
      const remaining = 3 - state.attempts;
      if (errEl) {
        errEl.textContent = `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`;
      }
      shakeDigitBoxes("supervisor-digit");
      clearDigitBoxes("supervisor-digit");
      focusFirstDigitBox("supervisor-digit");
    }
  }
}

function handleResendSupervisorCode() {
  const state = verificationState.supervisor;
  const resendBtn = document.getElementById("supervisor-resend-btn");
  if ((resendBtn && resendBtn.disabled) || isSendingVerificationCode) {
    return;
  }

  const errEl = document.getElementById("supervisor-verify-error");
  if (errEl) errEl.innerHTML = "";

  const originalText = resendBtn ? resendBtn.textContent : "Resend code";
  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.textContent = "Sending code...";
  }

  const sup = state.pendingSupervisor || { email: "", name: "Supervisor" };
  isSendingVerificationCode = true;
  sendVerificationCode(sup.email, sup.name)
    .then((result) => {
      if (result && result.ok) {
        state.attempts = 0;
        renderDemoCodeBox(
          document.getElementById("supervisor-step-verify"),
          "supervisor-demo-code-box",
          document.getElementById("supervisor-digit-wrap"),
          result
        );
        clearDigitBoxes("supervisor-digit");
        focusFirstDigitBox("supervisor-digit");
        startVerificationTimer("supervisor");
        startResendCooldown("supervisor");
        showToast("New verification code sent.", "info");
      } else {
        showVerificationSendError(errEl, result);
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.textContent = originalText;
        }
      }
    })
    .finally(() => {
      isSendingVerificationCode = false;
    });
}

function cancelSupervisorVerification() {
  const state = verificationState.supervisor;
  clearInterval(state.timerInterval);
  clearInterval(state.resendCooldownInterval);
  state.pendingSupervisor = null;

  const formStep = document.getElementById("supervisor-step-form");
  const verifyStep = document.getElementById("supervisor-step-verify");
  if (verifyStep) verifyStep.style.display = "none";
  if (formStep) formStep.style.display = "block";
}

function setupDigitBoxes(className, onEnterCallback) {
  const boxes = document.querySelectorAll(`.${className}`);
  if (!boxes || boxes.length === 0) return;

  boxes.forEach((box, index) => {
    // Input event - strip non-digits, keep single digit, auto-move
    box.addEventListener("input", function () {
      const val = this.value.replace(/\D/g, "");
      this.value = val ? val[0] : "";
      if (this.value && index < boxes.length - 1) {
        boxes[index + 1].focus();
        boxes[index + 1].select();
      }
    });

    // Keydown event - strictly block letters and symbols
    box.addEventListener("keydown", function (e) {
      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "Tab" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Home" ||
        e.key === "End" ||
        e.key === "Escape"
      ) {
        if (e.key === "Backspace") {
          if (!this.value && index > 0) {
            e.preventDefault();
            boxes[index - 1].focus();
            boxes[index - 1].value = "";
          }
        } else if (e.key === "ArrowLeft" && index > 0) {
          boxes[index - 1].focus();
        } else if (e.key === "ArrowRight" && index < boxes.length - 1) {
          boxes[index + 1].focus();
        }
        return;
      }

      if (e.key === "Enter") {
        if (typeof onEnterCallback === "function") {
          onEnterCallback();
        }
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        return;
      }

      // Block all non-digit keys (letters, symbols, punctuation, spaces)
      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
      }
    });

    // Paste event - extract up to 6 digits and spread across boxes
    box.addEventListener("paste", function (e) {
      e.preventDefault();
      const pasteText = (e.clipboardData || window.clipboardData).getData("text") || "";
      const digits = pasteText.replace(/\D/g, "").slice(0, boxes.length);
      for (let i = 0; i < digits.length; i++) {
        if (boxes[i]) boxes[i].value = digits[i];
      }
      const nextIdx = Math.min(digits.length, boxes.length - 1);
      if (boxes[nextIdx]) {
        boxes[nextIdx].focus();
        boxes[nextIdx].select();
      }
    });
  });
}

function startVerificationTimer(role) {
  const state = verificationState[role];
  if (state.timerInterval) clearInterval(state.timerInterval);

  const timerEl = document.getElementById(`${role}-verify-timer`);

  function update() {
    const diff = Math.max(0, Math.floor((state.expiresAt - Date.now()) / 1000));
    const mins = String(Math.floor(diff / 60)).padStart(2, "0");
    const secs = String(diff % 60).padStart(2, "0");
    if (timerEl) {
      timerEl.textContent = `${mins}:${secs}`;
    }
    if (diff <= 0) {
      clearInterval(state.timerInterval);
      const errEl = document.getElementById(`${role}-verify-error`);
      if (errEl) errEl.textContent = "Code expired. Please click 'Resend code'.";
    }
  }

  update();
  state.timerInterval = setInterval(update, 1000);
}

function startResendCooldown(role) {
  const state = verificationState[role];
  if (state.resendCooldownInterval) clearInterval(state.resendCooldownInterval);

  const btn = document.getElementById(`${role}-resend-btn`);
  if (!btn) return;

  let cooldown = 30;
  btn.disabled = true;
  btn.textContent = `Resend code (${cooldown}s)`;

  state.resendCooldownInterval = setInterval(() => {
    cooldown--;
    if (cooldown > 0) {
      btn.textContent = `Resend code (${cooldown}s)`;
    } else {
      clearInterval(state.resendCooldownInterval);
      btn.disabled = false;
      btn.textContent = "Resend code";
    }
  }, 1000);
}

function getEnteredCode(className) {
  const boxes = document.querySelectorAll(`.${className}`);
  let code = "";
  boxes.forEach((b) => {
    code += (b.value || "").trim();
  });
  return code;
}

function clearDigitBoxes(className) {
  const boxes = document.querySelectorAll(`.${className}`);
  boxes.forEach((b) => {
    b.value = "";
  });
}

function focusFirstDigitBox(className) {
  const first = document.querySelector(`.${className}`);
  if (first) first.focus();
}

function shakeDigitBoxes(className) {
  const boxes = document.querySelectorAll(`.${className}`);
  boxes.forEach((b) => {
    b.classList.remove("input-shake");
    void b.offsetWidth;
    b.classList.add("input-shake");
  });
}

/* ==========================================================================
   FORGOT PASSWORD & CREDENTIAL RECOVERY SYSTEM
   Uses the EmailJS 6-digit verification system to safely reset user credentials.
   ========================================================================== */

function ensureForgotPasswordModal() {
  let modalEl = document.getElementById("forgot-password-modal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "forgot-password-modal";
    modalEl.className = "modal-overlay";
    modalEl.innerHTML = `
      <div class="modal-box support-modal-box">
        <div class="modal-header">
          <div>
            <span class="kicker" id="forgot-modal-kicker">ACCOUNT CREDENTIALS RECOVERY</span>
            <h3 id="forgot-modal-title">Reset Password</h3>
            <p class="support-modal-desc" id="forgot-modal-desc">Safely recover access using your 6-digit verification code</p>
          </div>
          <button type="button" class="toast-close" onclick="closeForgotPassword()" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Step 1: Identifier -->
          <div id="forgot-step-1">
            <form onsubmit="return handleForgotStep1Submit(event);" novalidate>
              <div class="form-group">
                <label for="forgot-account-id" id="forgot-id-label">Student ID or Registered Email</label>
                <input
                  type="text"
                  id="forgot-account-id"
                  class="form-control"
                  placeholder="e.g. ST01 or arpita.das@univ.edu"
                  required
                  autocomplete="username"
                />
                <span id="forgot-step1-error" class="field-error"></span>
              </div>

              <div style="font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 1.25rem; line-height: 1.4;">
                A temporary 6-digit verification code will be sent to your email address to verify identity prior to updating account credentials.
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button type="button" class="btn btn-outline" onclick="closeForgotPassword()">Cancel</button>
                <button type="submit" class="btn btn-blue" id="forgot-step1-btn">Send 6-Digit Code</button>
              </div>
            </form>
          </div>

          <!-- Step 2: 6-Digit Verification Code -->
          <div id="forgot-step-2" style="display: none;">
            <div style="text-align: center; margin-bottom: 0.75rem;">
              <p style="font-size: 0.875rem; color: var(--color-text-muted);" id="forgot-step2-text">We sent a 6-digit code to your email. Check your inbox and spam folder.</p>
            </div>

            <!-- 6 Separate Boxes for the digits -->
            <div class="digit-inputs-wrap" id="reset-digit-wrap">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="digit-box reset-digit" data-idx="0" autocomplete="off" />
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="digit-box reset-digit" data-idx="1" autocomplete="off" />
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="digit-box reset-digit" data-idx="2" autocomplete="off" />
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="digit-box reset-digit" data-idx="3" autocomplete="off" />
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="digit-box reset-digit" data-idx="4" autocomplete="off" />
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="digit-box reset-digit" data-idx="5" autocomplete="off" />
            </div>

            <!-- Red error message under the boxes -->
            <div id="reset-verify-error" class="verify-error-msg"></div>

            <!-- 5-minute timer & 30-second cooldown resend link -->
            <div class="verify-meta-row">
              <span class="timer-text">Code expires in: <strong id="reset-verify-timer" class="tabular">05:00</strong></span>
              <button type="button" id="reset-resend-btn" class="btn-resend-link" disabled onclick="handleResendResetCode()">Resend code (30s)</button>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
              <button type="button" class="btn btn-outline" onclick="cancelResetVerification()">Back</button>
              <button type="button" id="reset-verify-btn" class="btn btn-blue" onclick="handleVerifyResetCode()">Verify Code</button>
            </div>
          </div>

          <!-- Step 3: Set New Password -->
          <div id="forgot-step-3" style="display: none;">
            <form onsubmit="return handleForgotStep3Submit(event);" novalidate>
              <div style="background-color: var(--color-blue-light); border: 1px solid var(--color-blue-border); border-radius: 6px; padding: 0.625rem 0.875rem; font-size: 0.8125rem; color: var(--color-blue); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Identity verified successfully. Enter your new password below.</span>
              </div>

              <div class="form-group">
                <label for="reset-new-password">New Password</label>
                <input
                  type="password"
                  id="reset-new-password"
                  class="form-control"
                  placeholder="••••••••"
                  required
                  autocomplete="new-password"
                />
                <span id="err-reset-new-password" class="field-error"></span>
              </div>

              <div class="form-group">
                <label for="reset-confirm-password">Confirm New Password</label>
                <input
                  type="password"
                  id="reset-confirm-password"
                  class="form-control"
                  placeholder="••••••••"
                  required
                  autocomplete="new-password"
                />
                <span id="err-reset-confirm-password" class="field-error"></span>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="show-reset-password" onchange="toggleResetPasswordVisibility(this)" />
                  <span>Show password</span>
                </label>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem;">
                <button type="button" class="btn btn-outline" onclick="closeForgotPassword()">Cancel</button>
                <button type="submit" class="btn btn-blue" id="reset-save-btn">Save New Password</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeForgotPassword();
    });

    setupDigitBoxes("reset-digit", handleVerifyResetCode);
  }
}

function openForgotPassword(role = "student") {
  ensureForgotPasswordModal();

  const state = verificationState.reset;
  state.role = role;
  state.account = null;
  state.code = null;
  state.attempts = 0;
  if (state.timerInterval) clearInterval(state.timerInterval);
  if (state.resendCooldownInterval) clearInterval(state.resendCooldownInterval);

  const modalEl = document.getElementById("forgot-password-modal");
  const kickerEl = document.getElementById("forgot-modal-kicker");
  const titleEl = document.getElementById("forgot-modal-title");
  const idLabelEl = document.getElementById("forgot-id-label");
  const idInput = document.getElementById("forgot-account-id");
  const errEl = document.getElementById("forgot-step1-error");

  const step1 = document.getElementById("forgot-step-1");
  const step2 = document.getElementById("forgot-step-2");
  const step3 = document.getElementById("forgot-step-3");

  if (step1) step1.style.display = "block";
  if (step2) step2.style.display = "none";
  if (step3) step3.style.display = "none";

  if (role === "admin") {
    if (kickerEl) kickerEl.textContent = "ADMINISTRATOR CREDENTIALS RECOVERY";
    if (titleEl) titleEl.textContent = "Reset Admin Password";
    if (idLabelEl) idLabelEl.textContent = "Administrator Email";
    if (idInput) {
      idInput.placeholder = "admin@example.com";
      const pageEmail = document.getElementById("email");
      idInput.value = pageEmail && pageEmail.value ? pageEmail.value.trim() : "";
    }
  } else if (role === "supervisor") {
    if (kickerEl) kickerEl.textContent = "SUPERVISOR CREDENTIALS RECOVERY";
    if (titleEl) titleEl.textContent = "Reset Supervisor Password";
    if (idLabelEl) idLabelEl.textContent = "Supervisor Email";
    if (idInput) {
      idInput.placeholder = "karim@example.com";
      const pageEmail = document.getElementById("email");
      idInput.value = pageEmail && pageEmail.value ? pageEmail.value.trim() : "";
    }
  } else {
    if (kickerEl) kickerEl.textContent = "STUDENT CREDENTIALS RECOVERY";
    if (titleEl) titleEl.textContent = "Reset Student Password";
    if (idLabelEl) idLabelEl.textContent = "Student ID or Registered Email";
    if (idInput) {
      idInput.placeholder = "e.g. ST01 or arpita.das@univ.edu";
      const pageId = document.getElementById("student_id");
      idInput.value = pageId && pageId.value ? pageId.value.trim() : "";
    }
  }

  if (errEl) {
    errEl.innerHTML = "";
    errEl.classList.remove("visible");
  }
  if (idInput) idInput.classList.remove("input-error");

  if (modalEl) modalEl.classList.add("open");
  setTimeout(() => {
    if (idInput) idInput.focus();
  }, 100);
}

function closeForgotPassword() {
  const state = verificationState.reset;
  if (state.timerInterval) clearInterval(state.timerInterval);
  if (state.resendCooldownInterval) clearInterval(state.resendCooldownInterval);

  const modalEl = document.getElementById("forgot-password-modal");
  if (modalEl) modalEl.classList.remove("open");
}

function handleForgotStep1Submit(event) {
  if (event && event.preventDefault) event.preventDefault();

  const submitBtn = document.getElementById("forgot-step1-btn");
  if ((submitBtn && submitBtn.disabled) || isSendingVerificationCode) {
    return false;
  }

  const state = verificationState.reset;
  const idInput = document.getElementById("forgot-account-id");
  const errEl = document.getElementById("forgot-step1-error");
  if (!idInput) return false;

  const rawVal = (idInput.value || "").trim();
  if (errEl) {
    errEl.innerHTML = "";
    errEl.classList.remove("visible");
  }
  idInput.classList.remove("input-error");

  if (!rawVal) {
    if (errEl) {
      errEl.textContent =
        state.role === "admin"
          ? "Administrator email is required."
          : state.role === "supervisor"
            ? "Supervisor email is required."
            : "Student ID or email is required.";
      errEl.classList.add("visible");
    }
    idInput.classList.add("input-error", "input-shake");
    return false;
  }

  let matched = null;
  if (state.role === "admin") {
    const typedEmail = rawVal.toLowerCase();
    matched = getAdmins().find((a) => (a.email || "").toLowerCase() === typedEmail);
  } else if (state.role === "supervisor") {
    const typedEmail = rawVal.toLowerCase();
    matched = getAllSupervisors().find((s) => (s.email || "").toLowerCase() === typedEmail);
  } else {
    const norm = normalizeStudentId(rawVal);
    const typedEmail = rawVal.toLowerCase();
    matched = getAllStudents().find((s) => {
      const sNorm = normalizeStudentId(s.student_id);
      const sEmail = (s.email || "").toLowerCase();
      return sNorm === norm || (sEmail && sEmail === typedEmail);
    });
  }

  if (!matched) {
    if (errEl) {
      errEl.textContent =
        state.role === "admin"
          ? "No administrator account found with this email."
          : state.role === "supervisor"
            ? "No supervisor account found with this email."
            : "No registered student found with this ID or email.";
      errEl.classList.add("visible");
    }
    idInput.classList.add("input-error", "input-shake");
    return false;
  }

  const emailTarget = (matched.email || "").trim();
  if (!emailTarget) {
    if (errEl) {
      errEl.textContent = "This account has no registered email address.";
      errEl.classList.add("visible");
    }
    return false;
  }

  const originalBtnText = submitBtn ? submitBtn.textContent : "Send 6-Digit Code";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending code...";
  }

  isSendingVerificationCode = true;
  sendVerificationCode(emailTarget, matched.name)
    .then((result) => {
      if (result && result.ok) {
        state.account = matched;
        state.attempts = 0;

        const step2Text = document.getElementById("forgot-step2-text");
        if (step2Text) {
          step2Text.textContent = `We sent a 6-digit code to ${emailTarget}. Check your inbox and spam folder.`;
        }

        const step1 = document.getElementById("forgot-step-1");
        const step2 = document.getElementById("forgot-step-2");
        if (step1) step1.style.display = "none";
        if (step2) step2.style.display = "block";

        renderDemoCodeBox(
          step2,
          "reset-demo-code-box",
          document.getElementById("reset-digit-wrap"),
          result
        );

        clearDigitBoxes("reset-digit");
        const verifyErr = document.getElementById("reset-verify-error");
        if (verifyErr) verifyErr.innerHTML = "";

        startVerificationTimer("reset");
        startResendCooldown("reset");
        setTimeout(() => focusFirstDigitBox("reset-digit"), 50);
      } else {
        showVerificationSendError(errEl, result);
        if (errEl) errEl.classList.add("visible");
      }
    })
    .finally(() => {
      isSendingVerificationCode = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });

  return false;
}

function handleVerifyResetCode() {
  const state = verificationState.reset;
  const errEl = document.getElementById("reset-verify-error");
  const typedCode = getEnteredCode("reset-digit");

  if (!typedCode || typedCode.length < 6) {
    if (errEl) errEl.textContent = "Please enter all 6 digits.";
    shakeDigitBoxes("reset-digit");
    return;
  }

  if (Date.now() > state.expiresAt) {
    if (errEl) errEl.textContent = "Code expired. Please click 'Resend code'.";
    shakeDigitBoxes("reset-digit");
    return;
  }

  const validCode = state.code || activeVerification.code;
  if (typedCode === validCode) {
    if (state.timerInterval) clearInterval(state.timerInterval);
    if (state.resendCooldownInterval) clearInterval(state.resendCooldownInterval);

    const step2 = document.getElementById("forgot-step-2");
    const step3 = document.getElementById("forgot-step-3");
    if (step2) step2.style.display = "none";
    if (step3) step3.style.display = "block";

    const pwdInput = document.getElementById("reset-new-password");
    const confirmInput = document.getElementById("reset-confirm-password");
    if (pwdInput) {
      pwdInput.value = "";
      pwdInput.classList.remove("input-error");
    }
    if (confirmInput) {
      confirmInput.value = "";
      confirmInput.classList.remove("input-error");
    }

    const err1 = document.getElementById("err-reset-new-password");
    const err2 = document.getElementById("err-reset-confirm-password");
    if (err1) err1.classList.remove("visible");
    if (err2) err2.classList.remove("visible");

    showToast("Identity verified! Please set your new password.", "success");
    setTimeout(() => {
      if (pwdInput) pwdInput.focus();
    }, 50);
  } else {
    state.attempts++;
    if (state.attempts >= 3) {
      if (state.timerInterval) clearInterval(state.timerInterval);
      if (state.resendCooldownInterval) clearInterval(state.resendCooldownInterval);
      if (errEl) errEl.textContent = "Too many attempts, please try again";
      shakeDigitBoxes("reset-digit");
      showToast("Too many attempts, please try again", "error");
      setTimeout(() => {
        cancelResetVerification();
      }, 1500);
    } else {
      const remaining = 3 - state.attempts;
      if (errEl) {
        errEl.textContent = `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`;
      }
      shakeDigitBoxes("reset-digit");
      clearDigitBoxes("reset-digit");
      focusFirstDigitBox("reset-digit");
    }
  }
}

function handleResendResetCode() {
  const state = verificationState.reset;
  const resendBtn = document.getElementById("reset-resend-btn");
  if ((resendBtn && resendBtn.disabled) || isSendingVerificationCode) {
    return;
  }

  const errEl = document.getElementById("reset-verify-error");
  if (errEl) errEl.innerHTML = "";

  const originalText = resendBtn ? resendBtn.textContent : "Resend code";
  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.textContent = "Sending code...";
  }

  const acc = state.account || { email: "", name: "User" };
  isSendingVerificationCode = true;
  sendVerificationCode(acc.email, acc.name)
    .then((result) => {
      if (result && result.ok) {
        state.attempts = 0;
        clearDigitBoxes("reset-digit");
        focusFirstDigitBox("reset-digit");
        startVerificationTimer("reset");
        startResendCooldown("reset");
        showToast("New verification code sent.", "info");
      } else {
        showVerificationSendError(errEl, result);
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.textContent = originalText;
        }
      }
    })
    .finally(() => {
      isSendingVerificationCode = false;
    });
}

function cancelResetVerification() {
  const state = verificationState.reset;
  if (state.timerInterval) clearInterval(state.timerInterval);
  if (state.resendCooldownInterval) clearInterval(state.resendCooldownInterval);

  const step1 = document.getElementById("forgot-step-1");
  const step2 = document.getElementById("forgot-step-2");
  const step3 = document.getElementById("forgot-step-3");
  if (step2) step2.style.display = "none";
  if (step3) step3.style.display = "none";
  if (step1) step1.style.display = "block";

  const idInput = document.getElementById("forgot-account-id");
  if (idInput) idInput.focus();
}

function toggleResetPasswordVisibility(checkbox) {
  const pwdInput = document.getElementById("reset-new-password");
  const confirmInput = document.getElementById("reset-confirm-password");
  const isText = checkbox && checkbox.checked;
  if (pwdInput) pwdInput.type = isText ? "text" : "password";
  if (confirmInput) confirmInput.type = isText ? "text" : "password";
}

function handleForgotStep3Submit(event) {
  if (event && event.preventDefault) event.preventDefault();

  const state = verificationState.reset;
  const pwdInput = document.getElementById("reset-new-password");
  const confirmInput = document.getElementById("reset-confirm-password");
  const err1 = document.getElementById("err-reset-new-password");
  const err2 = document.getElementById("err-reset-confirm-password");

  const newPwd = (pwdInput ? pwdInput.value : "").trim();
  const confirmPwd = (confirmInput ? confirmInput.value : "").trim();

  let isValid = true;
  if (err1) err1.classList.remove("visible");
  if (err2) err2.classList.remove("visible");
  if (pwdInput) pwdInput.classList.remove("input-error");
  if (confirmInput) confirmInput.classList.remove("input-error");

  if (!newPwd) {
    if (err1) {
      err1.textContent = "New password is required.";
      err1.classList.add("visible");
    }
    if (pwdInput) pwdInput.classList.add("input-error", "input-shake");
    isValid = false;
  } else if (newPwd.length < 4) {
    if (err1) {
      err1.textContent = "Password must be at least 4 characters.";
      err1.classList.add("visible");
    }
    if (pwdInput) pwdInput.classList.add("input-error", "input-shake");
    isValid = false;
  }

  if (!confirmPwd) {
    if (err2) {
      err2.textContent = "Please confirm your password.";
      err2.classList.add("visible");
    }
    if (confirmInput) confirmInput.classList.add("input-error", "input-shake");
    isValid = false;
  } else if (newPwd && confirmPwd && newPwd !== confirmPwd) {
    if (err2) {
      err2.textContent = "Passwords do not match.";
      err2.classList.add("visible");
    }
    if (confirmInput) confirmInput.classList.add("input-error", "input-shake");
    isValid = false;
  }

  if (!isValid) return false;

  const targetAccount = state.account;
  if (!targetAccount) return false;

  // Persist updated credentials safely in shared storage
  if (state.role === "admin") {
    targetAccount.password_hash = newPwd;
    saveAdminPasswordOverride(newPwd);
  } else if (state.role === "supervisor") {
    targetAccount.password_hash = newPwd;
    saveSupervisorPasswordOverride(targetAccount.supervisor_id, newPwd);

    const supervisorsList = getData(STORAGE_KEYS.SUPERVISORS, DEFAULT_SUPERVISORS);
    const supIdx = supervisorsList.findIndex(
      (s) => String(s.supervisor_id) === String(targetAccount.supervisor_id)
    );
    if (supIdx >= 0) {
      supervisorsList[supIdx].password_hash = newPwd;
      saveData(STORAGE_KEYS.SUPERVISORS, supervisorsList);
    }
  } else {
    targetAccount.password_hash = newPwd;
    saveStudentPasswordOverride(targetAccount.student_id, newPwd);

    const studentsList = getData(STORAGE_KEYS.STUDENTS);
    const regIdx = studentsList.findIndex(
      (s) => normalizeStudentId(s.student_id) === normalizeStudentId(targetAccount.student_id)
    );
    if (regIdx >= 0) {
      studentsList[regIdx].password_hash = newPwd;
      saveData(STORAGE_KEYS.STUDENTS, studentsList);
    }
  }

  closeForgotPassword();
  const actorTargetId =
    state.role === "admin"
      ? targetAccount.admin_id
      : state.role === "supervisor"
        ? String(targetAccount.supervisor_id)
        : targetAccount.student_id;
  addActivityLog({
    action_type: "Password Reset",
    category: "profile",
    actor_id: actorTargetId,
    actor_name: targetAccount.name,
    actor_role: state.role,
    target_id: actorTargetId,
    description: `Reset password for ${state.role} account (${actorTargetId}) via 6-digit verification.`
  });
  showToast("Password reset successfully! You can now log in with your new credentials.", "success", 4000);

  // Pre-fill login input on active page
  if (state.role === "admin" || state.role === "supervisor") {
    const pageEmail = document.getElementById("email");
    const pagePwd = document.getElementById("password_hash");
    if (pageEmail) pageEmail.value = targetAccount.email;
    if (pagePwd) {
      pagePwd.value = "";
      pagePwd.focus();
    }
  } else {
    const pageId = document.getElementById("student_id");
    const pagePwd = document.getElementById("password_hash");
    if (pageId) pageId.value = targetAccount.student_id;
    if (pagePwd) {
      pagePwd.value = "";
      pagePwd.focus();
    }
  }

  return false;
}


/* ==========================================================================
   FEATURE 2: PC SLOT AVAILABILITY MODULE
   ========================================================================== */

function getAvailableSlotDates() {
  const slots = getData(STORAGE_KEYS.SLOTS);
  const uniqueDates = Array.from(
    new Set(slots.map((s) => s && s.slot_date).filter(Boolean))
  ).sort();
  return uniqueDates.length > 0 ? uniqueDates : slotDates;
}

let activeAvailabilityState = {
  selectedDate: slotDates[0],
  selectedPcFilter: "ALL",
  searchQuery: "",
  role: "student",
  studentId: null,
  selectedCellId: null
};

function initSlotAvailability(role, currentUserId) {
  const card = document.getElementById("slot-availability-card");
  if (!card) return;

  const availableDates = getAvailableSlotDates();
  const pcs = getData(STORAGE_KEYS.PCS);

  activeAvailabilityState.role = role;
  activeAvailabilityState.studentId = currentUserId;
  activeAvailabilityState.selectedDate = availableDates[0];
  activeAvailabilityState.selectedPcFilter = "ALL";
  activeAvailabilityState.searchQuery = "";

  const datePicker = document.getElementById("slot-date-picker");
  if (datePicker) {
    datePicker.min = availableDates[0];
    datePicker.max = availableDates[availableDates.length - 1];
    datePicker.value = activeAvailabilityState.selectedDate;

    datePicker.addEventListener("change", function () {
      if (this.value) {
        activeAvailabilityState.selectedDate = this.value;
        renderSlotGrid();
      }
    });
  }

  const pcFilter = document.getElementById("pc-filter-select");
  if (pcFilter) {
    pcFilter.innerHTML = '<option value="ALL">All PCs</option>';
    pcs.forEach((pc) => {
      const opt = document.createElement("option");
      opt.value = pc.pc_id;
      opt.textContent = pc.pc_number || pc.pc_id;
      pcFilter.appendChild(opt);
    });
    pcFilter.value = activeAvailabilityState.selectedPcFilter;
    pcFilter.addEventListener("change", function () {
      activeAvailabilityState.selectedPcFilter = this.value;
      renderSlotGrid();
    });
  }

  // Setup hardware spec search input (e.g. RTX, RAM, i7)
  const searchInput = document.getElementById("pc-hardware-search");
  const clearBtn = document.getElementById("clear-search-btn");

  if (searchInput) {
    searchInput.value = "";
    if (clearBtn) clearBtn.style.display = "none";

    searchInput.addEventListener("input", function () {
      activeAvailabilityState.searchQuery = (this.value || "").trim().toLowerCase();
      if (clearBtn) {
        clearBtn.style.display = this.value ? "inline" : "none";
      }
      renderSlotGrid();
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        searchInput.value = "";
        activeAvailabilityState.searchQuery = "";
        clearBtn.style.display = "none";
        searchInput.focus();
        renderSlotGrid();
      });
    }
  }

  if (role === "admin") {
    const yourSlotLegend = document.getElementById("legend-item-yourslot");
    if (yourSlotLegend) yourSlotLegend.style.display = "none";

    const adminSummaryRow = document.getElementById("admin-summary-row");
    if (adminSummaryRow) adminSummaryRow.style.display = "block";
  }

  updateNextFreeSlotBadge();
  renderSlotGrid();
}

function updateNextFreeSlotBadge() {
  const nextFreeEl = document.getElementById("next-free-slot-text");
  if (!nextFreeEl) return;

  const availableDates = getAvailableSlotDates();
  const slots = getData(STORAGE_KEYS.SLOTS);
  const pcs = getData(STORAGE_KEYS.PCS);

  for (const dateStr of availableDates) {
    const daySlots = slots.filter((ts) => ts.slot_date === dateStr);
    for (const slot of daySlots) {
      for (const pc of pcs) {
        const check = isSlotAvailable(pc.pc_id, slot.slot_id);
        if (check.status === "Available") {
          const dateObj = new Date(dateStr + "T00:00:00");
          const formattedDate = dateObj.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
          nextFreeEl.textContent = `${pc.pc_number || pc.pc_id}, ${formattedDate}, ${slot.start_time}-${slot.end_time}`;
          return;
        }
      }
    }
  }

  nextFreeEl.textContent = "None available";
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderSlotGrid() {
  const tbody = document.getElementById("slot-grid-tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const availableDates = getAvailableSlotDates();
  const pcs = getData(STORAGE_KEYS.PCS);
  const slots = getData(STORAGE_KEYS.SLOTS);

  const currentDate = activeAvailabilityState.selectedDate || availableDates[0];
  const currentFilter = activeAvailabilityState.selectedPcFilter;
  const searchQuery = (activeAvailabilityState.searchQuery || "").trim().toLowerCase();
  const role = activeAvailabilityState.role;
  const studentId = activeAvailabilityState.studentId;

  // Filter PCs by both the dropdown filter and the hardware search query (e.g. 'RTX', 'RAM')
  const visiblePCs = pcs.filter((pc) => {
    // 1. Dropdown filter
    if (currentFilter !== "ALL" && pc.pc_id !== currentFilter) {
      return false;
    }
    // 2. Hardware search filter: checks specification, pc_number, pc_id, location
    if (searchQuery) {
      const matchSpec = (pc.specification || "").toLowerCase().includes(searchQuery);
      const matchNumber = (pc.pc_number || "").toLowerCase().includes(searchQuery);
      const matchId = (pc.pc_id || "").toLowerCase().includes(searchQuery);
      const matchLocation = (pc.location || "").toLowerCase().includes(searchQuery);
      return matchSpec || matchNumber || matchId || matchLocation;
    }
    return true;
  });

  const daySlots = slots.filter((ts) => ts.slot_date === currentDate);

  // If no PCs match the hardware search query
  if (visiblePCs.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="4" class="table-empty-row" style="padding: 2rem 1rem; text-align: center; color: var(--color-text-muted);">
        No PC models found matching "<strong>${escapeHtml(searchQuery)}</strong>".<br />
        <span style="font-size: 0.8125rem; color: var(--color-text-subtle);">Try searching for specifications like <em>RTX</em>, <em>RAM</em>, <em>Core i7</em>, or <em>16GB</em>.</span>
      </td>
    `;
    tbody.appendChild(tr);

    const emptyWarning = document.getElementById("empty-slots-warning");
    if (emptyWarning) emptyWarning.style.display = "none";

    const adminSummaryText = document.getElementById("admin-summary-text");
    if (adminSummaryText && role === "admin") {
      adminSummaryText.textContent = `Available: 0 | Booked: 0 | Pending: 0 (No matching PCs)`;
    }
    return;
  }

  let totalAvailable = 0;
  let totalBooked = 0;
  let totalPending = 0;

  visiblePCs.forEach((pc) => {
    const tr = document.createElement("tr");
    const isMaintPc = formatPcDisplayStatus(pc.status) === "Maintenance";

    // Format specification with highlighted search match if present
    let formattedSpec = escapeHtml(pc.specification);
    if (searchQuery) {
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escapedQuery})`, "gi");
      formattedSpec = formattedSpec.replace(
        regex,
        '<mark style="background-color: #fef08a; color: #854d0e; font-weight: 700; padding: 0 2px; border-radius: 2px;">$1</mark>'
      );
    }

    const tdPc = document.createElement("td");
    tdPc.innerHTML = `
      <div style="font-weight: 600; color: var(--color-text-main); font-family: var(--font-mono);">${escapeHtml(pc.pc_number || pc.pc_id)}${isMaintPc ? '<span class="pc-maint-tag">Maintenance</span>' : ""}</div>
      <div style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.35; margin-top: 0.125rem;">${formattedSpec}</div>
    `;
    tr.appendChild(tdPc);

    standardSlotTimes.forEach((slotTime) => {
      const matchingSlot = daySlots.find(
        (ts) => ts.start_time === slotTime.start_time && ts.end_time === slotTime.end_time
      );
      const slotId = matchingSlot ? matchingSlot.slot_id : null;

      const tdSlot = document.createElement("td");
      tdSlot.className = "slot-cell";
      const cellId = `cell-${pc.pc_id}-${slotId}`;
      tdSlot.id = cellId;

      if (slotId) {
        const check = isSlotAvailable(pc.pc_id, slotId);

        let cellClass = "slot-available";
        let cellText = "Available";
        let subText = "";

        if (check.status === "Maintenance") {
          cellClass = "slot-maintenance";
          cellText = "Maintenance";
        } else if (check.status === "Booked") {
          totalBooked++;
          const isOwnSlot = (role === "student" && studentId && normalizeStudentId(studentId) === normalizeStudentId(check.student_id));
          if (isOwnSlot) {
            cellClass = "slot-yourslot";
            cellText = "Your slot";
          } else {
            cellClass = "slot-booked";
            cellText = "Booked";
          }

          if (role === "admin") {
            subText = `${check.student_id} ${check.student_name}`;
          }
        } else if (check.status === "Pending") {
          totalPending++;
          cellClass = "slot-pending";
          cellText = "Pending";
          if (role === "admin") {
            subText = `${check.student_id} ${check.student_name}`;
          }
        } else {
          totalAvailable++;
          cellClass = "slot-available";
          cellText = "Available";
        }

        const inner = document.createElement("div");
        inner.className = `slot-cell-inner ${cellClass}`;

        const statusSpan = document.createElement("span");
        statusSpan.textContent = cellText;
        inner.appendChild(statusSpan);

        if (subText) {
          const subSpan = document.createElement("span");
          subSpan.className = "slot-admin-info";
          subSpan.textContent = subText;
          inner.appendChild(subSpan);
        }

        tdSlot.appendChild(inner);

        tdSlot.addEventListener("click", () => {
          handleSlotCellClick(pc, slotTime, slotId, check, cellId);
        });
      } else {
        tdSlot.innerHTML = `<span style="color: var(--color-text-subtle); font-size: 0.75rem;">N/A</span>`;
      }

      tr.appendChild(tdSlot);
    });

    tbody.appendChild(tr);
  });

  // Rule 8: If every slot of a day is booked, show warning banner
  const emptyWarning = document.getElementById("empty-slots-warning");
  if (emptyWarning) {
    if (totalAvailable === 0 && !searchQuery) {
      emptyWarning.style.display = "block";
    } else {
      emptyWarning.style.display = "none";
    }
  }

  // Admin Summary Row
  const adminSummaryText = document.getElementById("admin-summary-text");
  if (adminSummaryText && role === "admin") {
    adminSummaryText.textContent = `Available: ${totalAvailable} | Booked: ${totalBooked} | Pending: ${totalPending}`;
  }

  updateNextFreeSlotBadge();
}

function handleSlotCellClick(pc, slotTime, slotId, check, cellId) {
  const role = activeAvailabilityState.role;
  const studentId = activeAvailabilityState.studentId;

  if (activeAvailabilityState.selectedCellId) {
    const prev = document.getElementById(activeAvailabilityState.selectedCellId);
    if (prev) prev.classList.remove("slot-selected");
  }

  if (check.status === "Maintenance") {
    showToast(`${pc.pc_number || pc.pc_id} is currently under Maintenance and cannot be booked.`, "warning");
  } else if (check.status === "Available") {
    // Rule 6: Clicking an Available cell highlights it and shows message
    const cellEl = document.getElementById(cellId);
    if (cellEl) {
      cellEl.classList.add("slot-selected");
      activeAvailabilityState.selectedCellId = cellId;
    }
    showToast("Slot selected. Click 'New Request' to submit a booking request.", "info");
  } else if (check.status === "Booked") {
    // Rule 7: Clicking a Booked cell shows small message and cannot be selected
    const isOwnSlot = (role === "student" && studentId && normalizeStudentId(studentId) === normalizeStudentId(check.student_id));
    if (isOwnSlot) {
      showToast("This is your allocated research slot.", "info");
    } else if (role === "admin") {
      showToast(`Booked for ${check.student_id} (${check.student_name}).`, "info");
    } else {
      showToast("This slot is already taken. Please choose another slot.", "warning");
    }
  } else if (check.status === "Pending") {
    if (role === "admin") {
      showToast(`Pending request from ${check.student_id} (${check.student_name}).`, "info");
    } else {
      showToast("This slot has a pending request awaiting approval.", "info");
    }
  }
}

/**
 * FEATURE: DOWNLOAD SCHEDULE AS CSV
 * Exports the current view of the PC Slot Availability grid as a CSV file.
 * Respects active date, PC dropdown filter, hardware search query, and user role.
 * - For Students: preserves privacy (booked cells say "Booked" or "Your slot").
 * - For Admins: includes student ID and name for allocated/pending slots.
 */
function exportScheduleCSV() {
  const availableDates = getAvailableSlotDates();
  const pcs = getData(STORAGE_KEYS.PCS);
  const slots = getData(STORAGE_KEYS.SLOTS);

  const currentDate = activeAvailabilityState.selectedDate || availableDates[0];
  const currentFilter = activeAvailabilityState.selectedPcFilter || "ALL";
  const searchQuery = (activeAvailabilityState.searchQuery || "").trim().toLowerCase();
  const role = activeAvailabilityState.role || "student";
  const studentId = activeAvailabilityState.studentId || null;

  // Filter PCs matching current view
  const visiblePCs = pcs.filter((pc) => {
    if (currentFilter !== "ALL" && pc.pc_id !== currentFilter) {
      return false;
    }
    if (searchQuery) {
      const matchSpec = (pc.specification || "").toLowerCase().includes(searchQuery);
      const matchNumber = (pc.pc_number || "").toLowerCase().includes(searchQuery);
      const matchId = (pc.pc_id || "").toLowerCase().includes(searchQuery);
      const matchLocation = (pc.location || "").toLowerCase().includes(searchQuery);
      return matchSpec || matchNumber || matchId || matchLocation;
    }
    return true;
  });

  if (visiblePCs.length === 0) {
    showToast("No PCs match the current filter or search criteria to export.", "warning");
    return;
  }

  const daySlots = slots.filter((ts) => ts.slot_date === currentDate);

  function escapeCsvCell(value) {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  }

  // Construct CSV Header
  const headers = [
    "Date",
    "PC ID",
    "PC Number",
    "Hardware Specification",
    "Location",
    "09:00 - 11:00",
    "11:00 - 13:00",
    "14:00 - 16:00"
  ];

  const csvRows = [];
  csvRows.push(headers.map(escapeCsvCell).join(","));

  visiblePCs.forEach((pc) => {
    const row = [
      currentDate,
      pc.pc_id,
      pc.pc_number,
      pc.specification,
      pc.location
    ];

    standardSlotTimes.forEach((slotTime) => {
      const matchingSlot = daySlots.find(
        (ts) => ts.start_time === slotTime.start_time && ts.end_time === slotTime.end_time
      );

      if (!matchingSlot) {
        row.push("N/A");
        return;
      }

      const check = isSlotAvailable(pc.pc_id, matchingSlot.slot_id);

      if (check.status === "Maintenance") {
        row.push("Maintenance");
      } else if (check.status === "Booked") {
        const isOwnSlot = (role === "student" && studentId && normalizeStudentId(studentId) === normalizeStudentId(check.student_id));
        if (isOwnSlot) {
          row.push("Your slot");
        } else if (role === "admin") {
          row.push(`Booked (${check.student_id} - ${check.student_name})`);
        } else {
          // Privacy preserved: student does NOT see who booked a slot
          row.push("Booked");
        }
      } else if (check.status === "Pending") {
        if (role === "admin") {
          row.push(`Pending (${check.student_id} - ${check.student_name})`);
        } else {
          row.push("Pending");
        }
      } else {
        row.push("Available");
      }
    });

    csvRows.push(row.map(escapeCsvCell).join(","));
  });

  const csvContent = csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = `ResearchPC_Schedule_${currentDate}.csv`;

  // Create temporary link element to trigger browser download
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

  showToast(`Schedule exported as ${filename}`, "success");
}

/* ==========================================================================
   GLOBAL KEYBOARD SHORTCUTS MODULE
   Implements accessible shortcuts across all pages:
   - Alt + L: Student Login (focuses field if on login page)
   - Alt + A: Admin Portal (or active Admin Dashboard)
   - Alt + F: Frequently Asked Questions (scrolls to #faq on index.html)
   - Alt + H: University Computing Home Page
   - Alt + R: Student Registration
   - Alt + D: Active Role Dashboard (Student or Admin)
   - Alt + / or ?: Keyboard Shortcuts Guide Modal
   - Escape: Dismiss open modals / popups
   ========================================================================== */

function isTypingInField() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName ? el.tagName.toUpperCase() : "";
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function handleGlobalKeydown(e) {
  if (activeTourState && activeTourState.isOpen) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDashboardTour(true);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextTourStep();
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevTourStep();
      return;
    }
  }

  // 1. Escape key: closes any open modal dialog or popover
  if (e.key === "Escape") {
    const notifPopover = document.getElementById("student-notifications-popover");
    if (notifPopover && notifPopover.style.display === "block") {
      e.preventDefault();
      closeNotificationsPanel();
      return;
    }
    const forgotModal = document.getElementById("forgot-password-modal");
    if (forgotModal && forgotModal.classList.contains("open")) {
      e.preventDefault();
      closeForgotPassword();
      return;
    }
    const supportModal = document.getElementById("contact-support-modal");
    if (supportModal && supportModal.classList.contains("open")) {
      e.preventDefault();
      closeContactSupportModal();
      return;
    }
    const shortcutsModal = document.getElementById("shortcuts-modal");
    if (shortcutsModal && shortcutsModal.classList.contains("open")) {
      e.preventDefault();
      closeShortcutsModal();
      return;
    }
    const cancelModal = document.getElementById("cancel-confirm-modal");
    if (cancelModal && cancelModal.classList.contains("open")) {
      e.preventDefault();
      closeCancelRequestConfirm();
      return;
    }
    const approveModal = document.getElementById("admin-approve-modal");
    if (approveModal && approveModal.classList.contains("open")) {
      e.preventDefault();
      closeAdminApproveModal();
      return;
    }
    const rejectModal = document.getElementById("admin-reject-modal");
    if (rejectModal && rejectModal.classList.contains("open")) {
      e.preventDefault();
      closeAdminRejectConfirm();
      return;
    }
    const pcModal = document.getElementById("pc-form-modal");
    if (pcModal && pcModal.classList.contains("open")) {
      e.preventDefault();
      closePcFormModal();
      return;
    }
    const slotDelModal = document.getElementById("slot-delete-modal");
    if (slotDelModal && slotDelModal.classList.contains("open")) {
      e.preventDefault();
      closeSlotDeleteConfirm();
      return;
    }
    const allocCancelModal = document.getElementById("alloc-cancel-modal");
    if (allocCancelModal && allocCancelModal.classList.contains("open")) {
      e.preventDefault();
      closeCancelAllocationConfirm();
      return;
    }
    const requestModal = document.getElementById("request-modal");
    if (requestModal && requestModal.classList.contains("open")) {
      e.preventDefault();
      closeRequestDetail();
      return;
    }
  }

  // 2. '?' key to open shortcut guide (when not typing in an input field)
  if (e.key === "?" && !isTypingInField() && !e.altKey && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    toggleShortcutsModal();
    return;
  }

  // 3. Modifier: Alt + key (ignoring Ctrl, Meta / Cmd)
  if (!e.altKey || e.ctrlKey || e.metaKey) {
    return;
  }

  const key = (e.key || "").toLowerCase();
  const code = e.code || "";

  // 'Alt + L' for Login
  if (key === "l" || code === "KeyL") {
    e.preventDefault();
    const pathname = (window.location.pathname || "").toLowerCase();
    if (pathname.endsWith("login.html") && !pathname.endsWith("admin-login.html")) {
      const studentInput = document.getElementById("student_id");
      if (studentInput) {
        studentInput.focus();
        showToast("Focused Student ID field (Alt + L)", "info");
      }
    } else {
      showToast("Navigating to Student Login (Alt + L)", "info");
      window.location.href = "login.html";
    }
    return;
  }

  // 'Alt + A' for Admin Portal
  if (key === "a" || code === "KeyA") {
    e.preventDefault();
    const session = getSession();
    if (session && session.role === "admin") {
      const pathname = (window.location.pathname || "").toLowerCase();
      if (pathname.endsWith("admin-dashboard.html")) {
        showToast("Already on Admin Dashboard (Alt + A)", "info");
      } else {
        showToast("Navigating to Admin Dashboard (Alt + A)", "info");
        window.location.href = "admin-dashboard.html";
      }
    } else {
      const pathname = (window.location.pathname || "").toLowerCase();
      if (pathname.endsWith("admin-login.html")) {
        const adminInput = document.getElementById("email");
        if (adminInput) {
          adminInput.focus();
          showToast("Focused Admin Email field (Alt + A)", "info");
        }
      } else {
        showToast("Navigating to Admin Portal (Alt + A)", "info");
        window.location.href = "admin-login.html";
      }
    }
    return;
  }

  // 'Alt + F' for FAQ
  if (key === "f" || code === "KeyF") {
    e.preventDefault();
    const faqSection = document.getElementById("faq");
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: "smooth" });
      faqSection.setAttribute("tabindex", "-1");
      faqSection.focus({ preventScroll: true });
      showToast("Navigated to FAQ section (Alt + F)", "info");
    } else {
      showToast("Navigating to FAQ section (Alt + F)", "info");
      window.location.href = "index.html#faq";
    }
    return;
  }

  // 'Alt + H' for Home
  if (key === "h" || code === "KeyH") {
    e.preventDefault();
    const pathname = (window.location.pathname || "").toLowerCase();
    if (pathname.endsWith("index.html") || pathname === "/" || !pathname.includes(".html")) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Returned to top of Home (Alt + H)", "info");
    } else {
      showToast("Navigating to Home (Alt + H)", "info");
      window.location.href = "index.html";
    }
    return;
  }

  // 'Alt + R' for Register
  if (key === "r" || code === "KeyR") {
    e.preventDefault();
    const pathname = (window.location.pathname || "").toLowerCase();
    if (pathname.endsWith("register.html")) {
      const idInput = document.getElementById("student_id");
      if (idInput) {
        idInput.focus();
        showToast("Focused Registration field (Alt + R)", "info");
      }
    } else {
      showToast("Navigating to Registration (Alt + R)", "info");
      window.location.href = "register.html";
    }
    return;
  }

  // 'Alt + D' for Dashboard
  if (key === "d" || code === "KeyD") {
    e.preventDefault();
    const session = getSession();
    if (session && session.role === "admin") {
      showToast("Navigating to Admin Dashboard (Alt + D)", "info");
      window.location.href = "admin-dashboard.html";
    } else if (session && session.role === "supervisor") {
      showToast("Navigating to Supervisor Dashboard (Alt + D)", "info");
      window.location.href = "supervisor-dashboard.html";
    } else if (session && session.role === "student") {
      showToast("Navigating to Student Dashboard (Alt + D)", "info");
      window.location.href = "student-dashboard.html";
    } else {
      showToast("Please log in to view your dashboard (Alt + D)", "info");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 600);
    }
    return;
  }

  // 'Alt + T' for Theme Toggle
  if (key === "t" || code === "KeyT") {
    e.preventDefault();
    toggleTheme();
    return;
  }

  // 'Alt + C' for Contact Support
  if (key === "c" || code === "KeyC") {
    e.preventDefault();
    openContactSupportModal();
    return;
  }

  // 'Alt + /' or 'Alt + ?' for Shortcuts Modal
  if (key === "/" || key === "?" || code === "Slash") {
    e.preventDefault();
    toggleShortcutsModal();
  }
}

/* ==========================================================================
   THEME SWITCHER MODULE (DARK / LIGHT MODE)
   ========================================================================== */

function getStoredTheme() {
  try {
    const saved = localStorage.getItem("rp_theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch (e) {
    // Ignore storage issues
  }
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function applyTheme(theme, notify = false) {
  const isDark = theme === "dark";
  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }

  try {
    localStorage.setItem("rp_theme", theme);
  } catch (e) {
    // Ignore storage issues
  }

  updateThemeToggleButtons(theme);

  if (notify) {
    showToast(`Switched to ${isDark ? "Dark" : "Light"} Mode (Alt + T)`, "info");
  }
}

function updateThemeToggleButtons(theme) {
  const isDark = theme === "dark";
  const buttons = document.querySelectorAll(".theme-toggle-btn");
  buttons.forEach((btn) => {
    const iconSpan = btn.querySelector(".theme-icon");
    const labelSpan = btn.querySelector(".theme-label");
    if (iconSpan) {
      iconSpan.textContent = isDark ? "☀️" : "🌙";
    }
    if (labelSpan) {
      labelSpan.textContent = isDark ? "Light" : "Dark";
    }
    btn.setAttribute("title", `Switch to ${isDark ? "Light" : "Dark"} mode (Alt + T)`);
    btn.setAttribute("aria-label", `Current theme is ${theme}. Click to switch to ${isDark ? "Light" : "Dark"} mode.`);
  });
}

function toggleTheme() {
  const isDark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    document.documentElement.classList.contains("dark");
  const nextTheme = isDark ? "light" : "dark";
  applyTheme(nextTheme, true);
}

function openShortcutsModal() {
  let modalEl = document.getElementById("shortcuts-modal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "shortcuts-modal";
    modalEl.className = "modal-overlay";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.setAttribute("aria-labelledby", "shortcuts-modal-title");
    modalEl.innerHTML = `
      <div class="modal-box shortcuts-modal-box">
        <div class="modal-header">
          <div>
            <span class="kicker">ACCESSIBILITY &amp; NAVIGATION</span>
            <h3 id="shortcuts-modal-title">Keyboard Shortcuts</h3>
          </div>
          <button type="button" class="toast-close" onclick="closeShortcutsModal()" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 1rem;">
            Use these global key combinations from any page to navigate quickly across the system:
          </p>
          <div class="shortcuts-list">
            <div class="shortcut-item">
              <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>L</kbd></div>
              <div class="shortcut-desc">
                <strong>Student Login</strong>
                <span>Open login portal or focus Student ID input</span>
              </div>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>A</kbd></div>
              <div class="shortcut-desc">
                <strong>Admin Portal</strong>
                <span>Open admin portal or your active admin dashboard</span>
              </div>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>F</kbd></div>
              <div class="shortcut-desc">
                <strong>FAQ Section</strong>
                <span>Jump directly to Frequently Asked Questions</span>
              </div>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>H</kbd></div>
              <div class="shortcut-desc">
                <strong>Home Page</strong>
                <span>Return to university computing home page</span>
              </div>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>R</kbd></div>
              <div class="shortcut-desc">
                <strong>Registration</strong>
                <span>Register a new university student account</span>
              </div>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>D</kbd></div>
              <div class="shortcut-desc">
                <strong>Dashboard</strong>
                <span>Access your active student or administrator portal</span>
              </div>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>T</kbd></div>
              <div class="shortcut-desc">
                <strong>Dark / Light Theme</strong>
                <span>Toggle between dark and light appearance modes</span>
              </div>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys"><kbd>Alt</kbd> + <kbd>C</kbd></div>
              <div class="shortcut-desc">
                <strong>Contact Support</strong>
                <span>Open contact & booking assistance form</span>
              </div>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys"><kbd>?</kbd> or <kbd>Alt</kbd> + <kbd>/</kbd></div>
              <div class="shortcut-desc">
                <strong>Shortcuts Guide</strong>
                <span>Toggle this keyboard shortcuts dialog</span>
              </div>
            </div>
            <div class="shortcut-item">
              <div class="shortcut-keys"><kbd>Esc</kbd></div>
              <div class="shortcut-desc">
                <strong>Dismiss Overlay</strong>
                <span>Close active dialogs or modal overlays</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="closeShortcutsModal()">Close (<kbd>Esc</kbd>)</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeShortcutsModal();
    });
  }

  modalEl.classList.add("open");
}

function closeShortcutsModal() {
  const modalEl = document.getElementById("shortcuts-modal");
  if (modalEl) modalEl.classList.remove("open");
}

function toggleShortcutsModal() {
  const modalEl = document.getElementById("shortcuts-modal");
  if (modalEl && modalEl.classList.contains("open")) {
    closeShortcutsModal();
  } else {
    openShortcutsModal();
  }
}

/* ==========================================================================
   CONTACT SUPPORT MODAL MODULE
   Enables reporting booking issues or requesting system assistance
   ========================================================================== */

function openContactSupportModal(preselectedCategory, preselectedPc) {
  let modalEl = document.getElementById("contact-support-modal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "contact-support-modal";
    modalEl.className = "modal-overlay";
    modalEl.innerHTML = `
      <div class="modal-box support-modal-box">
        <div class="modal-header">
          <div>
            <span class="kicker">RESEARCH COMPUTING SUPPORT DESK</span>
            <h3 id="support-modal-title">Contact Support</h3>
            <p class="support-modal-desc">Report workstation booking conflicts, hardware issues, or request system assistance</p>
          </div>
          <button type="button" class="toast-close" onclick="closeContactSupportModal()" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body">
          <form id="contact-support-form" class="support-form" onsubmit="return handleContactSupportSubmit(event)">
            <div class="support-ticket-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Lab administrators monitor requests continuously. For critical booking conflicts, tickets are prioritized within 15 minutes.</span>
            </div>

            <div class="support-form-group">
              <label for="support-category">Issue Category <span style="color:var(--color-danger);">*</span></label>
              <select id="support-category" class="form-control" required>
                <option value="Booking Conflict / Slot Taken">Booking Issue: PC Slot Already Taken or Conflict</option>
                <option value="Hardware / Terminal Malfunction">Hardware / Terminal Problem (GPU, RAM, Crash)</option>
                <option value="Account & Login Assistance">Account / Verification Code / Access Help</option>
                <option value="Cancellation / Reschedule">Request Cancellation or Reschedule</option>
                <option value="General System Assistance">General System / DBMS Assistance</option>
              </select>
            </div>

            <div class="support-form-grid">
              <div class="support-form-group">
                <label for="support-name">Your Full Name <span style="color:var(--color-danger);">*</span></label>
                <input type="text" id="support-name" class="form-control" placeholder="e.g. Arpita Das" required>
                <span class="support-form-error" id="support-name-error">Name is required.</span>
              </div>

              <div class="support-form-group">
                <label for="support-contact">University Email or Student ID <span style="color:var(--color-danger);">*</span></label>
                <input type="text" id="support-contact" class="form-control" placeholder="e.g. ST01 or student@univ.edu" required>
                <span class="support-form-error" id="support-contact-error">Contact identifier is required.</span>
              </div>
            </div>

            <div class="support-form-grid">
              <div class="support-form-group">
                <label for="support-pc">Affected PC Workstation</label>
                <select id="support-pc" class="form-control">
                  <option value="General / None">General / Not Workstation Specific</option>
                  <option value="PC01 (Core i5, 16GB RAM)">PC01 - Core i5, 16GB RAM</option>
                  <option value="PC02 (Core i7, 16GB RAM)">PC02 - Core i7, 16GB RAM</option>
                  <option value="PC03 (Core i5, 8GB RAM)">PC03 - Core i5, 8GB RAM</option>
                </select>
                <span class="field-hint">Select the lab PC node if issue is terminal-specific</span>
              </div>

              <div class="support-form-group">
                <label for="support-priority">Priority / Urgency</label>
                <select id="support-priority" class="form-control">
                  <option value="Normal">Normal - Standard Review</option>
                  <option value="High">High - Impending Lab Window</option>
                  <option value="Urgent">Urgent - Immediate Booking / Academic Deadline</option>
                </select>
                <span class="field-hint">Urgent tickets alert lab supervisor</span>
              </div>
            </div>

            <div class="support-form-group">
              <label for="support-subject">Subject / Summary <span style="color:var(--color-danger);">*</span></label>
              <input type="text" id="support-subject" class="form-control" placeholder="e.g. PC02 slot booked but terminal locked" required>
              <span class="support-form-error" id="support-subject-error">Subject is required.</span>
            </div>

            <div class="support-form-group">
              <label for="support-message">Description of Issue or Assistance Needed <span style="color:var(--color-danger);">*</span></label>
              <textarea id="support-message" class="form-control" rows="4" placeholder="Provide details: date, slot time, symptoms, error messages, or what you need assistance with..." required></textarea>
              <span class="support-form-error" id="support-message-error">Description is required.</span>
            </div>

            <div class="modal-footer" style="padding: 1rem 0 0; background: transparent; border-top: 1px solid var(--color-border); margin-top: 0.5rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn btn-outline" onclick="closeContactSupportModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" id="support-submit-btn">
                Submit Support Request
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener("click", function (e) {
      if (e.target === modalEl) closeContactSupportModal();
    });
  }

  // Sync PC dropdown from shared localStorage table rp_pcs
  const pcSelectEl = document.getElementById("support-pc");
  if (pcSelectEl) {
    const pcs = getData(STORAGE_KEYS.PCS);
    pcSelectEl.innerHTML = '<option value="General / None">General / Not Workstation Specific</option>';
    pcs.forEach((pc) => {
      const opt = document.createElement("option");
      const label = `${pc.pc_number || pc.pc_id} (${pc.specification || "Research PC"})`;
      opt.value = label;
      opt.textContent = label;
      pcSelectEl.appendChild(opt);
    });
  }

  // Pre-fill user data if logged in
  const session = getSession();
  const nameInput = document.getElementById("support-name");
  const contactInput = document.getElementById("support-contact");
  if (session) {
    if (session.role === "student") {
      const student = findStudent(session.id);
      if (student && nameInput && !nameInput.value) nameInput.value = student.name;
      if (student && contactInput && !contactInput.value) contactInput.value = `${student.student_id} (${student.email})`;
    } else if (session.role === "admin") {
      const adminList = getAdmins();
      const admin = adminList.find((a) => a.admin_id === session.id) || adminList[0];
      if (admin && nameInput && !nameInput.value) nameInput.value = admin.name;
      if (admin && contactInput && !contactInput.value) contactInput.value = admin.email;
    }
  }

  if (preselectedCategory) {
    const catSelect = document.getElementById("support-category");
    if (catSelect) catSelect.value = preselectedCategory;
  }
  if (preselectedPc && pcSelectEl) {
    pcSelectEl.value = preselectedPc;
  }

  modalEl.classList.add("open");

  // Focus the subject field or name
  setTimeout(() => {
    const subjInput = document.getElementById("support-subject");
    if (subjInput && (!nameInput || nameInput.value)) {
      subjInput.focus();
    } else if (nameInput) {
      nameInput.focus();
    }
  }, 100);
}

function closeContactSupportModal() {
  const modalEl = document.getElementById("contact-support-modal");
  if (modalEl) modalEl.classList.remove("open");
}

function handleContactSupportSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();

  const nameEl = document.getElementById("support-name");
  const contactEl = document.getElementById("support-contact");
  const subjectEl = document.getElementById("support-subject");
  const messageEl = document.getElementById("support-message");
  const categoryEl = document.getElementById("support-category");
  const pcEl = document.getElementById("support-pc");
  const priorityEl = document.getElementById("support-priority");

  const nameVal = (nameEl ? nameEl.value : "").trim();
  const contactVal = (contactEl ? contactEl.value : "").trim();
  const subjectVal = (subjectEl ? subjectEl.value : "").trim();
  const messageVal = (messageEl ? messageEl.value : "").trim();

  let hasError = false;

  const validateField = (inputEl, errorId, isValid) => {
    const errEl = document.getElementById(errorId);
    if (!isValid) {
      hasError = true;
      if (inputEl) inputEl.classList.add("input-error");
      if (errEl) errEl.classList.add("visible");
    } else {
      if (inputEl) inputEl.classList.remove("input-error");
      if (errEl) errEl.classList.remove("visible");
    }
  };

  validateField(nameEl, "support-name-error", !!nameVal);
  validateField(contactEl, "support-contact-error", !!contactVal);
  validateField(subjectEl, "support-subject-error", !!subjectVal);
  validateField(messageEl, "support-message-error", !!messageVal);

  if (hasError) {
    showToast("Please complete all required support fields.", "error");
    return false;
  }

  const ticketId = "TIC-" + Math.floor(1000 + Math.random() * 9000);
  const category = categoryEl ? categoryEl.value : "General Inquiry";
  const priority = priorityEl ? priorityEl.value : "Normal";

  console.log("Support Ticket Created:", {
    ticketId,
    category,
    name: nameVal,
    contact: contactVal,
    pc: pcEl ? pcEl.value : "None",
    priority,
    subject: subjectVal,
    message: messageVal,
    created_at: new Date().toISOString()
  });

  closeContactSupportModal();

  // Reset form
  const form = document.getElementById("contact-support-form");
  if (form) form.reset();

  showToast(`Support ticket #${ticketId} submitted. Lab administrator notified.`, "success");
  return false;
}

function initKeyboardShortcuts() {
  window.addEventListener("keydown", handleGlobalKeydown);

  // If page loads with #faq hash, smoothly scroll and focus
  if (window.location.hash === "#faq") {
    setTimeout(() => {
      const faqEl = document.getElementById("faq");
      if (faqEl) {
        faqEl.scrollIntoView({ behavior: "smooth" });
        faqEl.setAttribute("tabindex", "-1");
        faqEl.focus({ preventScroll: true });
        showToast("Navigated to FAQ section (Alt + F)", "info");
      }
    }, 200);
  }
}

/**
 * Renders the homepage Allocation Overview card from the shared localStorage data layer
 * (rp_pcs, rp_slots, rp_allocations, rp_requests).
 */
let activeHomePcSearchQuery = "";
let activeHomePcSort = "name";

function getGpuPerformanceScore(spec) {
  const s = String(spec || "").toUpperCase();
  if (!s) return 0;

  if (/\bH100\b/.test(s)) return 9800;
  if (/\bA100\b/.test(s)) return 9200;
  if (/\bRTX\s*5090\b/.test(s)) return 5090;
  if (/\bRTX\s*5080\b/.test(s)) return 5080;
  if (/\bRTX\s*4090\b/.test(s)) return 4090;
  if (/\bRTX\s*4080\b/.test(s)) return 4080;
  if (/\bRTX\s*4070\b/.test(s)) return 4070;
  if (/\bRTX\s*4060\b/.test(s)) return 4060;
  if (/\bRTX\s*A6000\b/.test(s)) return 3950;
  if (/\bRTX\s*3090\b/.test(s)) return 3090;
  if (/\bRTX\s*3080\b/.test(s)) return 3080;
  if (/\bRTX\s*A5000\b/.test(s)) return 3050;
  if (/\bRTX\s*A4000\b/.test(s)) return 3040;
  if (/\bRTX\s*3070\b/.test(s)) return 3070;
  if (/\bRTX\s*3060\b/.test(s)) return 3060;

  const rtxMatch = s.match(/(?:RTX|GTX)\s*A?(\d{3,4})/);
  if (rtxMatch) return parseInt(rtxMatch[1], 10);

  const vramMatch = s.match(/\((\d+)\s*GB\)/);
  if (vramMatch) return parseInt(vramMatch[1], 10) * 10;

  return 0;
}

function initHomeOverviewSearch() {
  const searchInput = document.getElementById("home-pc-search");
  const clearBtn = document.getElementById("home-pc-clear-search");
  const sortSelect = document.getElementById("home-pc-sort");

  if (sortSelect) {
    activeHomePcSort = sortSelect.value || "name";
    sortSelect.onchange = function () {
      activeHomePcSort = this.value || "name";
      renderHomeOverview();
    };
  }

  if (!searchInput) return;

  activeHomePcSearchQuery = (searchInput.value || "").trim().toLowerCase();
  if (clearBtn) {
    clearBtn.style.display = activeHomePcSearchQuery ? "flex" : "none";
  }

  searchInput.oninput = function () {
    activeHomePcSearchQuery = (this.value || "").trim().toLowerCase();
    if (clearBtn) {
      clearBtn.style.display = activeHomePcSearchQuery ? "flex" : "none";
    }
    renderHomeOverview();
  };

  if (clearBtn) {
    clearBtn.onclick = function () {
      searchInput.value = "";
      activeHomePcSearchQuery = "";
      clearBtn.style.display = "none";
      renderHomeOverview();
      if (typeof searchInput.focus === "function") searchInput.focus();
    };
  }
}

function formatShortDayMonth(isoDateStr) {
  if (!isoDateStr || typeof isoDateStr !== "string") return "";
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return isoDateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  if (isNaN(year) || isNaN(monthIdx) || isNaN(day) || monthIdx < 0 || monthIdx > 11) {
    return isoDateStr;
  }
  return `${day} ${monthNames[monthIdx]}`;
}

function getDisplayedHomeOverviewWorkstations() {
  const pcs = getData(STORAGE_KEYS.PCS, []);
  const slots = getData(STORAGE_KEYS.SLOTS, []);
  const allocations = getData(STORAGE_KEYS.ALLOCATIONS, []);
  const requests = getData(STORAGE_KEYS.REQUESTS, []);

  const availableDates = getAvailableSlotDates();
  const todayDate = availableDates[0] || getTodayLocalDateStr();
  const todaySlots = slots.filter((s) => s.slot_date === todayDate);
  const todaySlotMap = new Map(todaySlots.map((s) => [s.slot_id, s]));
  const allSlotMap = new Map(slots.map((s) => [s.slot_id, s]));

  // Current local HH:MM window check so live dots reflect whether the PC has a Confirmed allocation right now
  const now = new Date();
  const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const currentTimeSlotIds = new Set(
    todaySlots
      .filter((s) => s.start_time && s.end_time && nowHHMM >= s.start_time && nowHHMM < s.end_time)
      .map((s) => s.slot_id)
  );

  // Calculate dynamic overview metrics directly from rp_pcs, rp_requests, rp_slots, rp_allocations
  let freeSlotsThisWeek = 0;
  pcs.forEach((pc) => {
    slots.forEach((slot) => {
      const check = isSlotAvailable(pc.pc_id, slot.slot_id);
      if (check && check.status === "Available") {
        freeSlotsThisWeek += 1;
      }
    });
  });

  const summaryStats = {
    totalPcs: pcs.length,
    availablePcs: pcs.filter((p) => formatPcDisplayStatus(p.status) !== "Maintenance").length,
    maintenancePcs: pcs.filter((p) => formatPcDisplayStatus(p.status) === "Maintenance").length,
    totalRequests: requests.length,
    approvedRequests: requests.filter((r) => r.status === "Approved").length,
    pendingRequests: requests.filter((r) => r.status === "Pending").length,
    rejectedRequests: requests.filter((r) => r.status === "Rejected").length,
    totalTimeSlots: slots.length,
    freeSlotsThisWeek
  };

  const searchInput = document.getElementById("home-pc-search");
  const query = (
    searchInput ? searchInput.value : activeHomePcSearchQuery || ""
  )
    .trim()
    .toLowerCase();

  const sortSelect = document.getElementById("home-pc-sort");
  const sortMode = sortSelect ? sortSelect.value || "name" : activeHomePcSort || "name";

  const filteredPcs = query
    ? pcs.filter((pc) => {
        const haystack = [
          pc.pc_id || "",
          pc.pc_number || "",
          pc.specification || "",
          pc.location || ""
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
    : pcs.slice();

  filteredPcs.sort((a, b) => {
    const nameA = String(a.pc_number || a.pc_id || "");
    const nameB = String(b.pc_number || b.pc_id || "");
    if (sortMode === "gpu_desc") {
      const scoreDiff = getGpuPerformanceScore(b.specification) - getGpuPerformanceScore(a.specification);
      if (scoreDiff !== 0) return scoreDiff;
    }
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" });
  });

  const totalWeekSlots = Math.max(slots.length, 1);

  const workstations = filteredPcs.map((pc) => {
    const isMaint = formatPcDisplayStatus(pc.status) === "Maintenance";
    const confirmedAllocs = allocations.filter(
      (a) => a.pc_id === pc.pc_id && isAllocationConfirmed(a)
    );
    const currentSlotAllocs = confirmedAllocs.filter((a) => currentTimeSlotIds.has(a.slot_id));
    const weekScheduledAllocs = confirmedAllocs
      .filter((a) => allSlotMap.has(a.slot_id))
      .slice()
      .sort((a, b) => {
        const sa = allSlotMap.get(a.slot_id);
        const sb = allSlotMap.get(b.slot_id);
        const ka = sa ? `${sa.slot_date} ${sa.start_time}` : "";
        const kb = sb ? `${sb.slot_date} ${sb.start_time}` : "";
        return ka.localeCompare(kb);
      });

    const bookedWeekCount = weekScheduledAllocs.length;

    let statusState = "available";
    let isBusy = false;
    let statusLabel = "Available";
    let statusClass = "node-status-available";
    let dotClass = "live-dot-available";
    let statusTitle = "Live Status: Available (Free for current time slot)";
    let specText = "Free all week";
    let fillPct = 0;

    if (isMaint) {
      statusState = "maintenance";
      isBusy = true;
      statusLabel = "Maintenance";
      statusClass = "node-status-maintenance";
      dotClass = "live-dot-maintenance";
      statusTitle = "Live Status: Under maintenance";
      specText = "Under maintenance";
      fillPct = 0;
    } else if (currentSlotAllocs.length > 0) {
      statusState = "busy";
      isBusy = true;
      statusLabel = "Busy";
      statusClass = "node-status-busy";
      dotClass = "live-dot-busy";
      statusTitle = "Live Status: Busy (Allocated in current time slot)";
      const primaryAlloc = currentSlotAllocs[0];
      const slot = todaySlotMap.get(primaryAlloc.slot_id) || allSlotMap.get(primaryAlloc.slot_id);
      const whenLabel = slot
        ? `${formatShortDayMonth(slot.slot_date)}, ${slot.start_time}-${slot.end_time}`
        : "Active slot";
      specText = `In use now (${whenLabel})`;
      fillPct = Math.min(100, Math.round((bookedWeekCount / totalWeekSlots) * 100));
    } else if (weekScheduledAllocs.length > 0) {
      const nextUpcoming =
        weekScheduledAllocs.find((a) => {
          const s = allSlotMap.get(a.slot_id);
          if (!s) return false;
          if (s.slot_date > todayDate) return true;
          if (s.slot_date === todayDate && s.end_time && s.end_time > nowHHMM) return true;
          return false;
        }) || weekScheduledAllocs[0];
      const nextSlot = allSlotMap.get(nextUpcoming.slot_id);
      const whenLabel = nextSlot
        ? `${formatShortDayMonth(nextSlot.slot_date)}, ${nextSlot.start_time}-${nextSlot.end_time}`
        : nextUpcoming.slot_id;
      specText = `Free now. Next booked: ${whenLabel}`;
      fillPct = Math.min(100, Math.round((bookedWeekCount / totalWeekSlots) * 100));
    }

    const specParts = (pc.specification || "").split(",");
    const shortSpec = specParts.length > 1 ? specParts[specParts.length - 1].trim() : pc.specification;
    const nodeHeading = `${pc.pc_number || pc.pc_id} · ${shortSpec || "Research Node"}`;

    return {
      pc_id: pc.pc_id,
      pc_number: pc.pc_number || pc.pc_id,
      nodeHeading,
      specification: pc.specification || "-",
      location: pc.location || "Research Lab",
      rawStatus: formatPcDisplayStatus(pc.status),
      statusState,
      isBusy,
      statusLabel,
      statusClass,
      dotClass,
      statusTitle,
      specText,
      bookedWeekCount: isMaint ? 0 : bookedWeekCount,
      totalWeekSlots: slots.length,
      fillPct
    };
  });

  return {
    totalCatalogCount: pcs.length,
    query,
    sortMode,
    dateLabel: todayDate,
    summaryStats,
    workstations
  };
}

function renderHomeOverview() {
  const summaryEl = document.getElementById("home-overview-summary");
  const grid = document.querySelector(".overview-card .placeholder-grid");
  if (!grid) return;

  const { totalCatalogCount, query, summaryStats, workstations } = getDisplayedHomeOverviewWorkstations();

  if (summaryEl && summaryStats) {
    summaryEl.innerHTML = `
      <span class="overview-summary-item"><strong>${summaryStats.totalPcs}</strong> Research PCs (${summaryStats.maintenancePcs} Maintenance)</span>
      <span class="overview-summary-item"><strong>${summaryStats.totalRequests}</strong> Requests (${summaryStats.approvedRequests} Approved, ${summaryStats.pendingRequests} Pending, ${summaryStats.rejectedRequests} Rejected)</span>
      <span class="overview-summary-item"><strong>${summaryStats.freeSlotsThisWeek}</strong> Open PC-Slots This Week<span class="overview-summary-note">Pending requests are counted as held</span></span>
    `;
  }

  if (!totalCatalogCount) return;

  if (workstations.length === 0) {
    grid.innerHTML = `
      <div class="overview-empty-state">
        No workstations match "<strong>${escapeHtml(query)}</strong>". Try searching for <em>RTX</em>, <em>16GB</em>, or <em>Core i7</em>.
      </div>
    `;
    return;
  }

  grid.innerHTML = workstations
    .map((pc) => `
        <div class="placeholder-box">
          <div class="placeholder-box-top">
            <span class="node-name">${escapeHtml(pc.nodeHeading)}</span>
            <span class="node-status ${pc.statusClass}" title="${escapeHtml(pc.statusTitle)}">
              <span class="live-dot ${pc.dotClass}" aria-hidden="true"></span>
              <span>${escapeHtml(pc.statusLabel)}</span>
            </span>
          </div>
          <span class="node-hw">${escapeHtml(pc.specification)}</span>
          <span class="node-specs">${escapeHtml(pc.specText)}</span>
          <span class="node-progress-label">Booked this week: ${pc.bookedWeekCount} / ${pc.totalWeekSlots} slots</span>
          <div class="grey-bar-bg">
            <div class="grey-bar-fill" style="width: ${pc.fillPct}%;"></div>
          </div>
        </div>
      `)
    .join("");
}

function sanitizePdfAscii(str) {
  return String(str || "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u00B7\u2022]/g, "|")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfLiteral(str) {
  return sanitizePdfAscii(str)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfText(text, maxChars) {
  const clean = sanitizePdfAscii(text);
  if (!clean) return ["-"];
  const words = clean.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function buildWorkstationReportPdfBytes(reportData) {
  const { workstations, query, sortMode, dateLabel } = reportData;
  const now = new Date();
  const generatedStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const availCount = workstations.filter((w) => !w.isBusy).length;
  const busyCount = workstations.length - availCount;
  const sortLabel = sortMode === "gpu_desc" ? "GPU Performance (High to Low)" : "Name (A-Z)";
  const filterLabel = query ? `"${query}"` : "None (All Workstations)";

  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 40;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const BOTTOM_LIMIT = 64;

  const pageStreams = [];
  let cmds = [];
  let y = PAGE_H - 42;

  const pushText = (font, size, x, ty, rgb, text) => {
    cmds.push(`BT /${font} ${size} Tf ${rgb} rg 1 0 0 1 ${x.toFixed(2)} ${ty.toFixed(2)} Tm (${escapePdfLiteral(text)}) Tj ET`);
  };

  const drawTableHeader = () => {
    cmds.push(`0.941 0.961 0.988 rg ${MARGIN} ${(y - 22).toFixed(2)} ${CONTENT_W} 22 re f`);
    cmds.push(`0.796 0.835 0.882 RG 0.7 w ${MARGIN} ${(y - 22).toFixed(2)} ${CONTENT_W} 22 re S`);
    const ty = y - 14.5;
    pushText("F2", 8.5, MARGIN + 8, ty, "0.118 0.161 0.231", "NODE");
    pushText("F2", 8.5, MARGIN + 66, ty, "0.118 0.161 0.231", "STATUS");
    pushText("F2", 8.5, MARGIN + 132, ty, "0.118 0.161 0.231", "LOAD");
    pushText("F2", 8.5, MARGIN + 178, ty, "0.118 0.161 0.231", "HARDWARE SPECIFICATION & ACTIVE ASSIGNMENT");
    y -= 24;
  };

  const drawPageHeader = (isFirstPage) => {
    cmds = [];
    y = PAGE_H - 40;

    // Top accent bar
    cmds.push(`0.145 0.388 0.922 rg ${MARGIN} ${(y - 46).toFixed(2)} ${CONTENT_W} 46 re f`);
    pushText("F2", 14, MARGIN + 14, y - 20, "1 1 1", "Research PC Allocation & Scheduling System");
    pushText("F1", 9.5, MARGIN + 14, y - 35, "0.878 0.929 1", "Allocation Overview - Workstation Summary Report (Research Lab)");
    y -= 60;

    if (isFirstPage) {
      cmds.push(`0.973 0.980 0.988 rg ${MARGIN} ${(y - 44).toFixed(2)} ${CONTENT_W} 44 re f`);
      cmds.push(`0.886 0.910 0.941 RG 0.6 w ${MARGIN} ${(y - 44).toFixed(2)} ${CONTENT_W} 44 re S`);
      pushText("F2", 8.5, MARGIN + 10, y - 15, "0.118 0.161 0.231", `Generated: ${generatedStamp}`);
      pushText("F1", 8.5, MARGIN + 210, y - 15, "0.278 0.333 0.412", `Schedule Date: ${dateLabel}`);
      pushText("F1", 8.5, MARGIN + 380, y - 15, "0.278 0.333 0.412", `Listed: ${workstations.length} (${availCount} Available, ${busyCount} Busy)`);
      pushText("F1", 8.5, MARGIN + 10, y - 32, "0.278 0.333 0.412", `Filter: ${filterLabel}`);
      pushText("F1", 8.5, MARGIN + 260, y - 32, "0.278 0.333 0.412", `Sort Order: ${sortLabel}`);
      y -= 56;
    }

    drawTableHeader();
  };

  drawPageHeader(true);

  workstations.forEach((pc, idx) => {
    const specLines = wrapPdfText(pc.specification, 64);
    const detailLines = wrapPdfText(`Status Note: ${pc.specText}`, 64);
    const allRightLines = specLines.concat(detailLines);
    const rowHeight = Math.max(36, 14 + allRightLines.length * 11.5 + 8);

    if (y - rowHeight < BOTTOM_LIMIT) {
      pageStreams.push(cmds);
      drawPageHeader(false);
    }

    if (idx % 2 === 1) {
      cmds.push(`0.984 0.988 0.996 rg ${MARGIN} ${(y - rowHeight).toFixed(2)} ${CONTENT_W} ${rowHeight.toFixed(2)} re f`);
    }
    cmds.push(`0.886 0.910 0.941 RG 0.5 w ${MARGIN} ${(y - rowHeight).toFixed(2)} m ${(MARGIN + CONTENT_W)} ${(y - rowHeight).toFixed(2)} l S`);

    const rowTopTextY = y - 15;
    pushText("F2", 9.5, MARGIN + 8, rowTopTextY, "0.059 0.090 0.165", pc.pc_number || pc.pc_id);
    pushText("F1", 7.5, MARGIN + 8, rowTopTextY - 12, "0.392 0.455 0.545", pc.location || "Research Lab");

    const statusRgb =
      pc.statusState === "maintenance"
        ? "0.392 0.455 0.545"
        : pc.isBusy
          ? "0.725 0.110 0.110"
          : "0.020 0.478 0.333";
    pushText("F2", 9, MARGIN + 66, rowTopTextY, statusRgb, pc.statusLabel);
    if (pc.rawStatus && pc.rawStatus !== "Available" && pc.statusLabel !== pc.rawStatus) {
      pushText("F1", 7.5, MARGIN + 66, rowTopTextY - 12, "0.392 0.455 0.545", `(${pc.rawStatus})`);
    }

    pushText("F1", 9, MARGIN + 132, rowTopTextY, "0.118 0.161 0.231", `${pc.fillPct}%`);

    let lineY = rowTopTextY;
    specLines.forEach((line) => {
      pushText("F2", 8.5, MARGIN + 178, lineY, "0.118 0.161 0.231", line);
      lineY -= 11.5;
    });
    detailLines.forEach((line) => {
      pushText("F1", 8, MARGIN + 178, lineY, "0.392 0.455 0.545", line);
      lineY -= 11.5;
    });

    y -= rowHeight;
  });

  pageStreams.push(cmds);

  // Add consistent page footers
  const totalPages = pageStreams.length;
  const finalizedStreams = pageStreams.map((streamCmds, pageIdx) => {
    const out = streamCmds.slice();
    out.push(`0.886 0.910 0.941 RG 0.5 w ${MARGIN} 42 m ${(MARGIN + CONTENT_W)} 42 l S`);
    out.push(`BT /F1 8 Tf 0.392 0.455 0.545 rg 1 0 0 1 ${MARGIN} 28 Tm (${escapePdfLiteral("University Research Computing Services - Allocation Overview Reference")}) Tj ET`);
    out.push(`BT /F1 8 Tf 0.392 0.455 0.545 rg 1 0 0 1 ${(PAGE_W - MARGIN - 54)} 28 Tm (Page ${pageIdx + 1} of ${totalPages}) Tj ET`);
    return out.join("\n");
  });

  // Assemble PDF objects:
  // 1: Catalog, 2: Pages, 3: Font F1 (Helvetica), 4: Font F2 (Helvetica-Bold), 5+: Page & Content pairs
  const objects = [
    "", // 0 placeholder
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "", // 2 Pages placeholder
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n"
  ];

  const pageRefs = [];
  finalizedStreams.forEach((streamText) => {
    const pageObjId = objects.length;
    const contentObjId = objects.length + 1;
    pageRefs.push(`${pageObjId} 0 R`);
    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream\nendobj\n`
    );
  });

  objects[2] = `2 0 obj\n<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>\nendobj\n`;

  let pdfStr = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 1; i < objects.length; i++) {
    offsets.push(pdfStr.length);
    pdfStr += objects[i];
  }

  const xrefOffset = pdfStr.length;
  pdfStr += `xref\n0 ${objects.length}\n`;
  pdfStr += "0000000000 65535 f \n";
  for (let i = 1; i < objects.length; i++) {
    pdfStr += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdfStr += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const bytes = new Uint8Array(pdfStr.length);
  for (let i = 0; i < pdfStr.length; i++) {
    bytes[i] = pdfStr.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function downloadOverviewReportPDF() {
  const reportData = getDisplayedHomeOverviewWorkstations();
  if (!reportData.workstations || reportData.workstations.length === 0) {
    showToast("No workstations are currently listed to export. Clear or adjust your search filter.", "info");
    return false;
  }

  const pdfBytes = buildWorkstationReportPdfBytes(reportData);
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const dateTag = getTodayLocalDateStr();
  const filename = `workstation-allocation-report-${dateTag}.pdf`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  showToast(
    `Summary PDF downloaded (${reportData.workstations.length} workstation${reportData.workstations.length === 1 ? "" : "s"}).`,
    "success"
  );
  return true;
}

let isHomeOverviewRefreshing = false;
let homeOverviewRefreshTimer = null;

function refreshHomeOverview() {
  const grid = document.querySelector(".overview-card .placeholder-grid");
  if (!grid || isHomeOverviewRefreshing) return;

  const btn = document.getElementById("home-pc-refresh-btn");
  const labelEl = btn ? btn.querySelector(".refresh-label") : null;

  isHomeOverviewRefreshing = true;
  if (btn) {
    btn.disabled = true;
    btn.classList.add("is-refreshing");
  }
  if (labelEl) {
    labelEl.textContent = "Syncing...";
  }
  grid.classList.add("is-refreshing");

  if (homeOverviewRefreshTimer) {
    clearTimeout(homeOverviewRefreshTimer);
  }

  homeOverviewRefreshTimer = setTimeout(() => {
    grid.classList.remove("is-refreshing");
    renderHomeOverview();

    const boxes = typeof grid.querySelectorAll === "function"
      ? grid.querySelectorAll(".placeholder-box")
      : [];
    boxes.forEach((box, idx) => {
      if (box && box.classList) {
        setTimeout(() => {
          box.classList.add("just-updated");
          setTimeout(() => box.classList.remove("just-updated"), 780);
        }, idx * 70);
      }
    });

    if (btn) {
      btn.disabled = false;
      btn.classList.remove("is-refreshing");
    }
    if (labelEl) {
      labelEl.textContent = "Refresh";
    }
    isHomeOverviewRefreshing = false;
    showToast("Workstation node statuses updated.", "info", 2200);
  }, 480);
}

/* ==========================================================================
   G. SAFETY & APP INITIALIZATION (Runs after page load)
   ========================================================================== */

// Expose shared data helpers and handlers globally
window.DEMO_MODE = DEMO_MODE;
window.STORAGE_KEYS = STORAGE_KEYS;
window.DEFAULT_ADMINS = DEFAULT_ADMINS;
window.DEFAULT_SUPERVISORS = DEFAULT_SUPERVISORS;
window.getAdmins = getAdmins;
window.fillStudentPreset = fillStudentPreset;
window.fillAdminPreset = fillAdminPreset;
window.fillSupervisorPreset = fillSupervisorPreset;
window.initSharedData = initSharedData;
window.getData = getData;
window.saveData = saveData;
window.nextId = nextId;
window.getDisplayedHomeOverviewWorkstations = getDisplayedHomeOverviewWorkstations;
window.renderHomeOverview = renderHomeOverview;
window.refreshHomeOverview = refreshHomeOverview;
window.buildWorkstationReportPdfBytes = buildWorkstationReportPdfBytes;
window.downloadOverviewReportPDF = downloadOverviewReportPDF;
window.parseSlotDurationHours = parseSlotDurationHours;
window.getStudentMonthlyGpuUsage = getStudentMonthlyGpuUsage;
window.setStudentGpuChartView = setStudentGpuChartView;
window.renderStudentGpuChart = renderStudentGpuChart;
window.initNewRequestPage = initNewRequestPage;
window.handleNewRequestSubmit = handleNewRequestSubmit;
window.initMyRequestsPage = initMyRequestsPage;
window.renderMyRequestsTable = renderMyRequestsTable;
window.openCancelRequestConfirm = openCancelRequestConfirm;
window.closeCancelRequestConfirm = closeCancelRequestConfirm;
window.confirmCancelPendingRequest = confirmCancelPendingRequest;
window.getStudentConfirmedAllocations = getStudentConfirmedAllocations;
window.initMySchedulePage = initMySchedulePage;
window.renderMySchedule = renderMySchedule;
window.exportMyScheduleCSV = exportMyScheduleCSV;
window.initProfilePage = initProfilePage;
window.enableProfileEdit = enableProfileEdit;
window.cancelProfileEdit = cancelProfileEdit;
window.saveProfileChanges = saveProfileChanges;
window.handleChangePasswordSubmit = handleChangePasswordSubmit;
window.initAdminRequestsPage = initAdminRequestsPage;
window.renderAdminRequestsManageTable = renderAdminRequestsManageTable;
window.openAdminApproveModal = openAdminApproveModal;
window.closeAdminApproveModal = closeAdminApproveModal;
window.updateApproveSlotDropdown = updateApproveSlotDropdown;
window.handleAdminApproveSubmit = handleAdminApproveSubmit;
window.openAdminRejectConfirm = openAdminRejectConfirm;
window.closeAdminRejectConfirm = closeAdminRejectConfirm;
window.confirmAdminRejectRequest = confirmAdminRejectRequest;
window.initAdminPcsSlotsPage = initAdminPcsSlotsPage;
window.switchPcSlotTab = switchPcSlotTab;
window.renderAdminPcsTable = renderAdminPcsTable;
window.openPcFormModal = openPcFormModal;
window.closePcFormModal = closePcFormModal;
window.handlePcFormSubmit = handlePcFormSubmit;
window.togglePcStatus = togglePcStatus;
window.renderAdminSlotsTable = renderAdminSlotsTable;
window.handleAddTimeSlotSubmit = handleAddTimeSlotSubmit;
window.isSlotAllocated = isSlotAllocated;
window.openSlotDeleteConfirm = openSlotDeleteConfirm;
window.closeSlotDeleteConfirm = closeSlotDeleteConfirm;
window.confirmDeleteTimeSlot = confirmDeleteTimeSlot;
window.getEnrichedAllocations = getEnrichedAllocations;
window.getFilteredAllocations = getFilteredAllocations;
window.initAdminAllocationsPage = initAdminAllocationsPage;
window.renderAdminAllocationsTable = renderAdminAllocationsTable;
window.openCancelAllocationConfirm = openCancelAllocationConfirm;
window.closeCancelAllocationConfirm = closeCancelAllocationConfirm;
window.confirmCancelAllocation = confirmCancelAllocation;
window.exportFilteredAllocationsCSV = exportFilteredAllocationsCSV;
window.addActivityLog = addActivityLog;
window.getFilteredLogs = getFilteredLogs;
window.initAdminLogsPage = initAdminLogsPage;
window.renderAdminLogsTable = renderAdminLogsTable;
window.exportActivityLogsCSV = exportActivityLogsCSV;
window.getAllSupervisors = getAllSupervisors;
window.getStudentRequestCount = getStudentRequestCount;
window.initAdminUsersPage = initAdminUsersPage;
window.switchUsersTab = switchUsersTab;
window.renderAdminUsersTables = renderAdminUsersTables;
window.toggleUserStatus = toggleUserStatus;
window.handleStudentLogin = handleStudentLogin;
window.handleAdminLogin = handleAdminLogin;
window.handleSupervisorLogin = handleSupervisorLogin;
window.initSupervisorDashboard = initSupervisorDashboard;
window.renderSupervisorDashboard = renderSupervisorDashboard;
window.initSupervisorRequestsPage = initSupervisorRequestsPage;
window.renderSupervisorRequestsPage = renderSupervisorRequestsPage;
window.toggleSupervisorBulkMenu = toggleSupervisorBulkMenu;
window.closeSupervisorBulkMenu = closeSupervisorBulkMenu;
window.clearSupervisorSelection = clearSupervisorSelection;
window.handleSupervisorBulkAction = handleSupervisorBulkAction;
window.initEmergencyRequestPage = initEmergencyRequestPage;
window.handleEmergencyRequestSubmit = handleEmergencyRequestSubmit;
window.renderSupervisorEmergencyTable = renderSupervisorEmergencyTable;
window.renderAdminEmergencyRequests = renderAdminEmergencyRequests;
window.adminSetEmergencyStatus = adminSetEmergencyStatus;
window.handleStudentRegister = handleStudentRegister;
window.normalizeStudentId = normalizeStudentId;
window.getAllStudents = getAllStudents;
window.findStudent = findStudent;
window.getSession = getSession;
window.setSession = setSession;
window.clearSession = clearSession;
window.FormValidator = FormValidator;
window.updateActiveSidebarItem = updateActiveSidebarItem;
window.handleVerifyStudentCode = handleVerifyStudentCode;
window.handleResendStudentCode = handleResendStudentCode;
window.cancelStudentVerification = cancelStudentVerification;
window.handleVerifyAdminCode = handleVerifyAdminCode;
window.handleResendAdminCode = handleResendAdminCode;
window.cancelAdminVerification = cancelAdminVerification;
window.handleVerifySupervisorCode = handleVerifySupervisorCode;
window.handleResendSupervisorCode = handleResendSupervisorCode;
window.cancelSupervisorVerification = cancelSupervisorVerification;
window.isSlotAvailable = isSlotAvailable;
window.renderSlotGrid = renderSlotGrid;
window.exportScheduleCSV = exportScheduleCSV;
window.openShortcutsModal = openShortcutsModal;
window.closeShortcutsModal = closeShortcutsModal;
window.toggleShortcutsModal = toggleShortcutsModal;
window.openContactSupportModal = openContactSupportModal;
window.closeContactSupportModal = closeContactSupportModal;
window.handleContactSupportSubmit = handleContactSupportSubmit;
window.openForgotPassword = openForgotPassword;
window.closeForgotPassword = closeForgotPassword;
window.handleForgotStep1Submit = handleForgotStep1Submit;
window.handleVerifyResetCode = handleVerifyResetCode;
window.handleResendResetCode = handleResendResetCode;
window.cancelResetVerification = cancelResetVerification;
window.handleForgotStep3Submit = handleForgotStep3Submit;
window.toggleResetPasswordVisibility = toggleResetPasswordVisibility;
window.handleGlobalKeydown = handleGlobalKeydown;
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;
window.getStoredTheme = getStoredTheme;
window.startDashboardTour = startDashboardTour;
window.closeDashboardTour = closeDashboardTour;
window.nextTourStep = nextTourStep;
window.prevTourStep = prevTourStep;
window.goToTourStep = goToTourStep;
window.toggleNotificationsPanel = toggleNotificationsPanel;
window.closeNotificationsPanel = closeNotificationsPanel;
window.markStudentNotificationsRead = markStudentNotificationsRead;
window.toggleAdminNotificationsPanel = toggleAdminNotificationsPanel;
window.closeAdminNotificationsPanel = closeAdminNotificationsPanel;
window.markAdminNotificationsRead = markAdminNotificationsRead;

function enforcePageRoleGuard() {
  if (!document.body || !document.body.classList) return true;
  const cl = document.body.classList;
  const session = getSession();

  const isStudentPage =
    cl.contains("page-student-dashboard") ||
    cl.contains("page-new-request") ||
    cl.contains("page-my-requests") ||
    cl.contains("page-my-schedule") ||
    cl.contains("page-profile");

  if (isStudentPage) {
    if (!session || session.role !== "student") {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  const isAdminPage =
    cl.contains("page-admin-dashboard") ||
    cl.contains("page-admin-requests") ||
    cl.contains("page-admin-pcs-slots") ||
    cl.contains("page-admin-allocations") ||
    cl.contains("page-admin-logs") ||
    cl.contains("page-admin-users");

  if (isAdminPage) {
    if (!session || session.role !== "admin") {
      window.location.href = "admin-login.html";
      return false;
    }
    return true;
  }

  const isSupervisorPage =
    cl.contains("page-supervisor-dashboard") ||
    cl.contains("page-supervisor-requests") ||
    cl.contains("page-emergency-request");

  if (isSupervisorPage) {
    if (!session || session.role !== "supervisor") {
      window.location.href = "supervisor-login.html";
      return false;
    }
    if (!isValidSupervisorSession(session)) {
      clearSession();
      window.location.href = "supervisor-login.html";
      return false;
    }
    return true;
  }

  return true;
}

function initApp() {
  // Ensure shared localStorage tables exist
  initSharedData();

  if (!enforcePageRoleGuard()) return;

  // Initialize EmailJS once when the page loads
  if (typeof emailjs !== "undefined" && typeof emailjs.init === "function") {
    try {
      emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    } catch (e) {
      // Ignore init error here; sendVerificationCode will check config/errors on send
    }
  }

  // Sync theme
  applyTheme(getStoredTheme(), false);

  initKeyboardShortcuts();
  setupPasswordToggles();

  // Setup 6-digit verification code boxes
  setupDigitBoxes("student-digit", handleVerifyStudentCode);
  setupDigitBoxes("admin-digit", handleVerifyAdminCode);
  setupDigitBoxes("supervisor-digit", handleVerifySupervisorCode);
  setupDigitBoxes("reset-digit", handleVerifyResetCode);

  // Sync homepage overview card with shared localStorage data if present
  initHomeOverviewSearch();
  renderHomeOverview();

  // Attach submit listeners safely if form elements exist
  const studentForm = document.getElementById("student-login-form");
  if (studentForm) {
    studentForm.onsubmit = handleStudentLogin;
  }

  const adminForm = document.getElementById("admin-login-form");
  if (adminForm) {
    adminForm.onsubmit = handleAdminLogin;
  }

  const supervisorForm = document.getElementById("supervisor-login-form");
  if (supervisorForm) {
    supervisorForm.onsubmit = handleSupervisorLogin;
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.onsubmit = handleStudentRegister;

    // Field-level blur & input listeners for register form
    const regInputs = [
      document.getElementById("student_id"),
      document.getElementById("name"),
      document.getElementById("email"),
      document.getElementById("phone"),
      document.getElementById("department"),
      document.getElementById("batch"),
      document.getElementById("password_hash"),
      document.getElementById("confirm_password")
    ];

    regInputs.forEach((input) => {
      if (!input) return;
      input.addEventListener("input", () => {
        FormValidator.clearError(input);
      });
    });
  }

  // Live input error clearing on login forms
  const allInputs = document.querySelectorAll("input.form-control");
  allInputs.forEach((input) => {
    input.addEventListener("input", () => {
      FormValidator.clearError(input);
      const loginAlert = document.getElementById("login-error-alert");
      if (loginAlert) {
        loginAlert.textContent = "";
        loginAlert.classList.remove("alert-visible");
      }
    });
  });

  // Safe portal page initialization
  if (document.body && document.body.classList) {
    if (
      document.body.classList.contains("page-new-request") ||
      document.getElementById("new-request-form")
    ) {
      initNewRequestPage();
    } else if (
      document.body.classList.contains("page-my-requests") ||
      document.getElementById("my-requests-tbody")
    ) {
      initMyRequestsPage();
    } else if (
      document.body.classList.contains("page-my-schedule") ||
      document.getElementById("my-schedule-tbody")
    ) {
      initMySchedulePage();
    } else if (
      document.body.classList.contains("page-profile") ||
      document.getElementById("profile-info-form")
    ) {
      initProfilePage();
    } else if (
      document.body.classList.contains("page-student-dashboard") ||
      document.getElementById("student-requests-tbody")
    ) {
      initStudentDashboard();
    } else if (
      document.body.classList.contains("page-admin-requests") ||
      document.getElementById("admin-manage-requests-tbody")
    ) {
      initAdminRequestsPage();
    } else if (
      document.body.classList.contains("page-admin-pcs-slots") ||
      document.getElementById("admin-pcs-tbody")
    ) {
      initAdminPcsSlotsPage();
    } else if (
      document.body.classList.contains("page-admin-allocations") ||
      document.getElementById("admin-allocations-tbody")
    ) {
      initAdminAllocationsPage();
    } else if (
      document.body.classList.contains("page-admin-logs") ||
      document.getElementById("admin-logs-tbody")
    ) {
      initAdminLogsPage();
    } else if (
      document.body.classList.contains("page-admin-users") ||
      document.getElementById("admin-users-students-tbody")
    ) {
      initAdminUsersPage();
    } else if (
      document.body.classList.contains("page-supervisor-dashboard") ||
      document.getElementById("supervisor-requests-tbody")
    ) {
      initSupervisorDashboard();
    } else if (
      document.body.classList.contains("page-supervisor-requests") ||
      document.getElementById("supervisor-page-requests-tbody")
    ) {
      initSupervisorRequestsPage();
    } else if (
      document.body.classList.contains("page-emergency-request") ||
      document.getElementById("emergency-request-form")
    ) {
      initEmergencyRequestPage();
    } else if (
      document.body.classList.contains("page-admin-dashboard") ||
      document.getElementById("admin-requests-tbody")
    ) {
      initAdminDashboard();
    }
  }

  startLivePortalUpdates();
}

/**
 * Redraws dynamic tables, metrics, and grids for the active portal page
 * without disturbing open modal dialogs or active form inputs.
 */
function refreshCurrentPortalView() {
  if (!enforcePageRoleGuard()) return;

  // Pause auto-redraw while an action/edit modal is open so user selections aren't cleared
  if (document.querySelector(".modal-overlay.open")) {
    return;
  }

  const session = getSession();

  if (document.getElementById("admin-manage-requests-tbody")) {
    renderAdminRequestsManageTable();
  }
  if (document.getElementById("admin-pcs-tbody")) {
    renderAdminPcsTable();
    renderAdminSlotsTable();
  }
  if (document.getElementById("admin-allocations-tbody")) {
    renderAdminAllocationsTable();
  }
  if (document.getElementById("admin-logs-tbody")) {
    renderAdminLogsTable();
  }
  if (document.getElementById("admin-users-students-tbody")) {
    renderAdminUsersTables();
  }
  if (document.getElementById("supervisor-requests-tbody")) {
    renderSupervisorDashboard();
  }
  if (document.getElementById("supervisor-page-requests-tbody")) {
    renderSupervisorRequestsPage();
  }
  if (document.getElementById("emergency-request-form") && session && session.role === "supervisor") {
    populateSupervisorEmergencyRequestDropdown(session.id);
    renderSupervisorEmergencyTable();
  }
  if (document.getElementById("admin-requests-tbody")) {
    updateAdminMetrics();
    renderAdminRequests();
    renderAdminEmergencyRequests();
    renderAdminNotifications();
    renderSlotGrid();
  }
  if (document.getElementById("student-requests-tbody") && session && session.role === "student") {
    renderStudentRequests(session.id);
    renderStudentGpuChart(session.id);
    renderSlotGrid();
    renderStudentNotifications(session.id);
  }
  if (document.getElementById("my-requests-tbody")) {
    renderMyRequestsTable();
  }
  if (document.getElementById("my-schedule-tbody")) {
    renderMySchedule();
  }
  if (document.querySelector(".overview-card .placeholder-grid") && !isHomeOverviewRefreshing) {
    renderHomeOverview();
  }
}
window.refreshCurrentPortalView = refreshCurrentPortalView;

function startLivePortalUpdates() {
  if (window._rpLiveUpdatesBound) return;
  window._rpLiveUpdatesBound = true;

  // Cross-tab instant synchronization via storage event
  window.addEventListener("storage", function (e) {
    if (e && e.key && !String(e.key).startsWith("rp_")) return;
    refreshCurrentPortalView();
  });

  // Periodic 3-second backup poll for active tables, grids, and metric counts
  window._rpLiveUpdateTimer = setInterval(function () {
    refreshCurrentPortalView();
  }, 3000);
}

// Refresh dynamic tables/metrics/grids & enforce session protection if browser restores page from bfcache (Back/Forward)
window.addEventListener("pageshow", function (event) {
  if (!event.persisted) return;
  if (!enforcePageRoleGuard()) return;

  if (document.getElementById("admin-manage-requests-tbody")) {
    renderAdminRequestsManageTable();
  }
  if (document.getElementById("admin-pcs-tbody")) {
    renderAdminPcsTable();
    renderAdminSlotsTable();
  }
  if (document.getElementById("admin-allocations-tbody")) {
    populateAllocationFilterOptions();
    renderAdminAllocationsTable();
  }
  if (document.getElementById("admin-logs-tbody")) {
    renderAdminLogsTable();
  }
  if (document.getElementById("admin-users-students-tbody")) {
    renderAdminUsersTables();
  }
  if (document.getElementById("supervisor-requests-tbody")) {
    initSupervisorDashboard();
  }
  if (document.getElementById("supervisor-page-requests-tbody")) {
    initSupervisorRequestsPage();
  }
  if (document.getElementById("emergency-request-form")) {
    initEmergencyRequestPage();
  }
  if (document.getElementById("admin-requests-tbody")) {
    updateAdminMetrics();
    renderAdminRequests();
    renderAdminEmergencyRequests();
    renderSlotGrid();
  }
  if (document.getElementById("student-requests-tbody")) {
    initStudentDashboard();
  }
  if (document.getElementById("my-requests-tbody")) {
    renderMyRequestsTable();
  }
  if (document.getElementById("my-schedule-tbody")) {
    renderMySchedule();
  }
  if (document.getElementById("profile-info-form")) {
    initProfilePage();
  }
});

// All dashboard code must run after page has loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
