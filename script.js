// Supabase connection
const SUPABASE_URL = 'https://xvovsxigkhgmstlnwsvj.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_jgzjUWcoNNtvSUxPLgkkvA_xHxnz12d';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

supabaseClient
  .from('profiles')
  .select('id')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection error:', error.message);
    } else {
      console.log('Supabase connected successfully!');
    }
  });


// AUW Connect - beginner-friendly front-end prototype.
// Data is saved in localStorage, so it stays in this browser only.
const STORAGE_KEY = 'auwConnectStudentProjectV2';
const COMPONENT_MARKS_STORAGE_KEY = `${STORAGE_KEY}_componentMarks`;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const gradeScale = [
  { letter: 'A+', gpa: 4.0, min: 97, max: 100, description: 'Excellent' },
  { letter: 'A', gpa: 4.0, min: 93, max: 96.99, description: 'Excellent' },
  { letter: 'A-', gpa: 3.7, min: 90, max: 92.99, description: 'Excellent / Very Good' },
  { letter: 'B+', gpa: 3.3, min: 87, max: 89.99, description: 'Good' },
  { letter: 'B', gpa: 3.0, min: 83, max: 86.99, description: 'Good' },
  { letter: 'B-', gpa: 2.7, min: 80, max: 82.99, description: 'Good' },
  { letter: 'C+', gpa: 2.3, min: 77, max: 79.99, description: 'Average' },
  { letter: 'C', gpa: 2.0, min: 73, max: 76.99, description: 'Average' },
  { letter: 'C-', gpa: 1.7, min: 70, max: 72.99, description: 'Average' },
  { letter: 'D+', gpa: 1.3, min: 67, max: 69.99, description: 'Poor' },
  { letter: 'D', gpa: 1.0, min: 60, max: 66.99, description: 'Poor / Pass' },
  { letter: 'F', gpa: 0.0, min: 0, max: 59.99, description: 'Failure' }
];

function makeInitialData() {
  return {
    currentUserId: 's1',
    users: [
      { id: 's1', name: 'Ilma Sathi', email: 'ilma.sathi@auw.edu.bd', username: 'ilma', password: 'Student1', role: 'Student', group: 'UG-1.1' },
      { id: 's2', name: 'Ayesha Karim', email: 'ayesha.karim@auw.edu.bd', username: 'ayesha', password: 'Student1', role: 'Student', group: 'UG-1.1' },
      { id: 's3', name: 'Nusrat Jahan', email: 'nusrat.jahan@auw.edu.bd', username: 'nusrat', password: 'Student1', role: 'Student', group: 'UG-2.1' },
      { id: 's4', name: 'Samira Noor', email: 'samira.noor@auw.edu.bd', username: 'samira', password: 'Student1', role: 'Student', group: 'UG-3.1' },
      { id: 't1', name: 'Mr. Morshed Bin Shiraj', email: 'morshed.bin.shiraj@auw.edu.bd', username: 'morshed', password: 'Faculty1', role: 'Teacher', group: 'Faculty' },
      { id: 't2', name: 'Rayhana Chowdhury', email: 'rayhana.chowdhury@auw.edu.bd', username: 'rayhana', password: 'Faculty1', role: 'Teacher', group: 'Faculty' },
      { id: 't3', name: 'Fahim Faysal', email: 'fahim.faysal@auw.edu.bd', username: 'fahim', password: 'Faculty1', role: 'Teacher', group: 'Faculty' },
    ],
    courses: [
      { id: 'c1', code: 'ENG101', name: 'English', teacherId: 't2', credits: 1 },
      { id: 'c2', code: 'MTH101', name: 'Mathematics', teacherId: 't1', credits: 1 },
      { id: 'c3', code: 'CTP101', name: 'CTP', teacherId: 't3', credits: 1 }
    ],
    schedules: [
      { id: 'sc1', courseId: 'c1', days: 'SMTW', day: 'SMTW', start: '08:00', end: '09:20', room: 'Academic 204', teacherId: 't2', group: 'UG-1.1' },
      { id: 'sc2', courseId: 'c2', days: 'SMTW', day: 'SMTW', start: '09:30', end: '10:50', room: 'Computer Lab 2', teacherId: 't1', group: 'UG-1.1' },
      { id: 'sc3', courseId: 'c3', days: 'SMTW', day: 'SMTW', start: '11:00', end: '12:20', room: 'Academic 105', teacherId: 't3', group: 'UG-1.1' },
    ],
    grades: [
      { id: 'g1', studentId: 's1', courseId: 'c1', obtained: 46, total: 50, feedback: 'Very clear writing. Keep practising your academic vocabulary.' },
      { id: 'g2', studentId: 's1', courseId: 'c2', obtained: 44, total: 50, feedback: 'Good work. Review spreadsheet formulas.' },
      { id: 'g3', studentId: 's2', courseId: 'c1', obtained: 42, total: 50, feedback: 'Good progress.' }
    ],
    bookings: [],
    assessments: [],
    registrations: [],
    registrationSettings: { open: true, trimester: 'Fall 2026', capacity: 20 },
    announcements: [
      { id: 'an1', title: 'Welcome to AUW Connect', text: 'This campus portal brings student services, schedules, grades and communication together.', category: 'General', date: new Date().toLocaleDateString() },
      { id: 'an2', title: 'Academic reminder', text: 'Please check your course schedule regularly and contact your instructor if you need academic support.', category: 'Academic', date: new Date().toLocaleDateString() }
    ],
    conversations: [
      { id: 'chat1', title: 'Pathways Study Group', type: 'group', memberIds: ['s1', 's2', 's3', 't1'], messages: [{ id: 'm1', senderId: 't1', text: 'Welcome everyone. Please use this group to discuss class questions.', time: 'Yesterday' }] },
      { id: 'chat2', title: 'Mr. Morshed Bin Shiraj', type: 'private', memberIds: ['s1', 't1'], messages: [{ id: 'm2', senderId: 't1', text: 'Hello! Let me know if you need support with Mathematics.', time: 'Yesterday' }] }
    ],
    facultyPosts: [{ id: 'fp1', title: 'Supporting academic writing', text: 'Short weekly writing exercises can help students build confidence.', authorId: 't1' }],
    courseMaterials: [],
    helpMessages: []
  };
}

let data;
try {
  data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || makeInitialData();
} catch (error) {
  data = makeInitialData();
}
delete data.posts; // Student Community has been removed from this version.
// Make older saved browser data compatible with the current website.
data.users = Array.isArray(data.users) ? data.users : [];
data.users = data.users.filter(user => !['admin', 'administrator'].includes(String(user.role || '').trim().toLowerCase()));
// Normalize legacy faculty role labels to the single internal role used by the portal.
data.users.forEach(user => { if (String(user.role || '').trim().toLowerCase() === 'faculty') user.role = 'Teacher'; if (!user.username) user.username = String(user.email || '').split('@')[0].toLowerCase(); });
data.schedules = Array.isArray(data.schedules) ? data.schedules : [];
data.announcements = Array.isArray(data.announcements) ? data.announcements : [];
data.helpMessages = Array.isArray(data.helpMessages) ? data.helpMessages : [];
data.accountDeletionRequests = Array.isArray(data.accountDeletionRequests) ? data.accountDeletionRequests : [];
data.registrations = Array.isArray(data.registrations) ? data.registrations : [];
data.bookings = Array.isArray(data.bookings) ? data.bookings : [];
data.officeHours = Array.isArray(data.officeHours) ? data.officeHours : [];
data.appointments = Array.isArray(data.appointments) ? data.appointments : data.bookings;
data.appointments = data.appointments.map(a => ({...a, status:a.status || 'Pending'}));
data.assessments = Array.isArray(data.assessments) ? data.assessments : [];
data.notifications = Array.isArray(data.notifications) ? data.notifications : [];
data.courseMaterials = Array.isArray(data.courseMaterials) ? data.courseMaterials : [];
data.studyTasks = Array.isArray(data.studyTasks) ? data.studyTasks : [];
data.componentMarks = Array.isArray(data.componentMarks) ? data.componentMarks : [];
// Recover component marks separately if the main demo record was too large to save.
try {
  let backup = null;
  try { backup = sessionStorage.getItem(COMPONENT_MARKS_STORAGE_KEY); } catch (error) { /* Session storage may be blocked. */ }
  if (!backup) {
    try { backup = localStorage.getItem(COMPONENT_MARKS_STORAGE_KEY); } catch (error) { /* Local storage may be blocked. */ }
  }
  if (backup) {
    const savedMarks = JSON.parse(backup);
    if (Array.isArray(savedMarks)) {
      const byRecord = new Map(data.componentMarks.map(mark => [`${mark.studentId}|${mark.courseId}|${mark.category}|${mark.trimester}`, mark]));
      savedMarks.forEach(mark => byRecord.set(`${mark.studentId}|${mark.courseId}|${mark.category}|${mark.trimester}`, mark));
      data.componentMarks = [...byRecord.values()];
    }
  }
} catch (error) { console.warn('Could not restore the separate component-mark backup.', error); }
data.progressReleases = data.progressReleases && typeof data.progressReleases === 'object' ? data.progressReleases : {};
data.registrationSettings = data.registrationSettings || { open: true, trimester: 'Fall 2026', capacity: 20 };
data.registrationSettings.capacity = Math.max(1, Math.min(20, Number(data.registrationSettings.capacity) || 20));
data.conversations = Array.isArray(data.conversations) ? data.conversations : [];
data.conversations.forEach(chat => {
  chat.memberIds = Array.isArray(chat.memberIds) ? chat.memberIds : [];
  chat.messages = Array.isArray(chat.messages) ? chat.messages : [];
});

const validStoredSections = ['UG-1.1','UG-1.2','UG-1.3','UG-2.1','UG-2.2','UG-2.3','UG-3.1','UG-3.2','UG-3.3','UG-4.1','UG-4.2','UG-4.3','UG-4.4'];
data.users.filter(user => user.role === 'Student').forEach(user => { if (!validStoredSections.includes(user.group) && !(user.accountStatus === 'pending' || user.trimesterStatus === 'not_requested' || user.trimesterStatus === 'pending')) user.group = 'UG-1.1'; });
data.schedules.forEach(item => { if (item.group === 'Pathways' || item.group === 'Foundation' || item.group === 'UG') item.group = 'UG-1.1'; });
// Admin accounts are no longer part of AUW Connect. Remove legacy Admin records.
data.users = data.users.filter(user => !['admin', 'administrator'].includes(String(user.role || '').trim().toLowerCase()));
if (!data.users.some(user => user.id === data.currentUserId)) data.currentUserId = 's1';
// Keep the built-in sample student account available even when this browser
// already contains saved data from an earlier version of AUW Connect.
const sampleStudent = data.users.find(user => user.id === 's1');
if (sampleStudent) {
  sampleStudent.name = 'Ilma Sathi';
  sampleStudent.email = 'ilma.sathi@auw.edu.bd';
  sampleStudent.username = 'ilma.sathi';
  sampleStudent.password = 'Student1';
  sampleStudent.role = 'Student';
  sampleStudent.group = 'UG-1.1';
  sampleStudent.accountStatus = 'approved'; sampleStudent.trimesterStatus = 'assigned'; sampleStudent.assignedTrimester = data.registrationSettings.trimester;
} else {
  data.users.push({
    id: 's1',
    name: 'Ilma Sathi',
    email: 'ilma.sathi@auw.edu.bd',
    username: 'ilma.sathi',
    password: 'Student1',
    role: 'Student',
    group: 'UG-1.1', accountStatus:'approved', trimesterStatus:'assigned', assignedTrimester:data.registrationSettings.trimester
  });
}
const starterAccounts = {
  s1: { email: 'ilma.sathi@auw.edu.bd', username: 'ilma', password: 'Student1', role: 'Student' },
  s2: { email: 'ayesha.karim@auw.edu.bd', username: 'ayesha', password: 'Student1', role: 'Student' },
  s3: { email: 'nusrat.jahan@auw.edu.bd', username: 'nusrat', password: 'Student1', role: 'Student' },
  s4: { email: 'samira.noor@auw.edu.bd', username: 'samira', password: 'Student1', role: 'Student' },
};
Object.entries(starterAccounts).forEach(([id, credentials]) => {
  const account = data.users.find(user => user.id === id);
  if (account) Object.assign(account, credentials);
});
const officialFaculty = [
  { id: 't1', name: 'Mr. Morshed Bin Shiraj', email: 'morshed.bin.shiraj@auw.edu.bd', username: 'morshed', courseId: 'c2' },
  { id: 't2', name: 'Rayhana Chowdhury', email: 'rayhana.chowdhury@auw.edu.bd', username: 'rayhana', courseId: 'c1' },
  { id: 't3', name: 'Fahim Faysal', email: 'fahim.faysal@auw.edu.bd', username: 'fahim', courseId: 'c3' }
];
const normalizeFacultyIdentity = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const facultyIdMap = {};
officialFaculty.forEach(person => {
  const matches = data.users.filter(user => {
    const role = String(user.role || '').trim().toLowerCase();
    if (!['teacher', 'faculty'].includes(role)) return false;
    return user.id === person.id ||
      normalizeFacultyIdentity(user.email) === normalizeFacultyIdentity(person.email) ||
      normalizeFacultyIdentity(user.username) === normalizeFacultyIdentity(person.username) ||
      normalizeFacultyIdentity(user.name) === normalizeFacultyIdentity(person.name);
  });
  // Reuse an existing account whenever possible. Never reset its password.
  let account = matches.find(user => user.id === person.id) || matches[0];
  if (!account) {
    account = { ...person, password: 'Faculty1', role: 'Teacher', group: 'Faculty' };
    data.users.push(account);
  }
  const keptId = account.id;
  matches.forEach(duplicate => {
    facultyIdMap[duplicate.id] = keptId;
    if (duplicate !== account && !account.password && duplicate.password) account.password = duplicate.password;
  });
  facultyIdMap[person.id] = keptId;
  account.name = person.name;
  account.email = account.email || person.email;
  account.username = account.username || person.username;
  account.role = 'Teacher';
  account.group = 'Faculty';
  // Retain the old ID and sign-in credentials for accounts already created in this browser.
});
// Merge duplicate faculty identities and redirect references to the retained account IDs.
data.users = data.users.filter(user => {
  if (!['teacher', 'faculty'].includes(String(user.role || '').trim().toLowerCase())) return true;
  const mappedId = facultyIdMap[user.id];
  return !mappedId || mappedId === user.id;
});
const remapFacultyId = id => facultyIdMap[id] || id;
data.courses.forEach(course => { if (course.teacherId) course.teacherId = remapFacultyId(course.teacherId); });
data.schedules.forEach(item => { if (item.teacherId) item.teacherId = remapFacultyId(item.teacherId); });
data.conversations.forEach(chat => {
  chat.memberIds = [...new Set((chat.memberIds || []).map(remapFacultyId))];
  (chat.messages || []).forEach(message => { if (message.senderId) message.senderId = remapFacultyId(message.senderId); });
});
(data.facultyPosts || []).forEach(post => { if (post.authorId) post.authorId = remapFacultyId(post.authorId); });
const officialAssignments = {
  c1: { name: 'English', code: 'ENG101', teacherId: facultyIdMap.t2 || 't2' },
  c2: { name: 'Mathematics', code: 'MTH101', teacherId: facultyIdMap.t1 || 't1' },
  c3: { name: 'CTP', code: 'CTP101', teacherId: facultyIdMap.t3 || 't3' }
};
Object.entries(officialAssignments).forEach(([id, details]) => { const course = data.courses.find(item => item.id === id); if (course) Object.assign(course, details); });
data.schedules.forEach(item => {
  if (item.courseId === 'c1') item.teacherId = officialAssignments.c1.teacherId;
  if (item.courseId === 'c2') item.teacherId = officialAssignments.c2.teacherId;
  if (item.courseId === 'c3') item.teacherId = officialAssignments.c3.teacherId;
});
data.conversations.forEach(chat => {
  if (chat.id === 'chat2' || /nadia rahman/i.test(chat.title || '')) {
    chat.title = 'Mr. Morshed Bin Shiraj';
    chat.memberIds = [...new Set([...(chat.memberIds || []).filter(id => id !== officialAssignments.c2.teacherId), officialAssignments.c2.teacherId])];
    (chat.messages || []).forEach(message => {
      if (message.senderId === officialAssignments.c2.teacherId) message.text = 'Hello! Let me know if you need support with Mathematics.';
    });
  }
});
data.courses = data.courses.filter(course => !['Computer Science', 'CS101'].includes(course.name) && course.code !== 'CS101');
data.courses = data.courses.filter(course => !['ICT101','CRT101'].includes(course.code));
data.announcements = data.announcements.map(item => ({ ...item, category: item.category || 'General' }));
data.grades = (data.grades || []).map(item => ({ ...item, trimester: item.trimester || 'Fall 2026', published: item.published === false ? false : true }));
data.users.filter(user => user.role === 'Student').forEach(user => { if (!String(user.group || '').startsWith('UG-') && !(user.accountStatus === 'pending' || user.trimesterStatus === 'not_requested' || user.trimesterStatus === 'pending')) user.group = 'UG-1.1'; });
data.users.filter(user => user.role === 'Teacher').forEach(user => { user.group = 'Faculty'; });
(data.registrations || []).forEach(registration => { if (registration.status == null) registration.status = 'approved'; });
data.users.filter(user => user.role === 'Student').forEach(user => { if (user.accountStatus == null) user.accountStatus = 'approved'; if (user.trimesterStatus == null) user.trimesterStatus = 'assigned'; if (user.trimesterStatus === 'assigned' && !user.assignedTrimester) user.assignedTrimester = data.registrationSettings.trimester; });
// Normalize older faculty role labels so all faculty accounts use the same dashboard and permissions.
data.users.forEach(user => { if (String(user.role || '').trim().toLowerCase() === 'faculty') user.role = 'Teacher'; });
data.users.filter(user => user.role === 'Teacher').forEach(user => { user.group = 'Faculty'; });
// Persist compatibility fixes, including legacy 'Faculty' role names.
try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (error) { console.warn('Could not save portal compatibility updates.', error); }

// Every subject has six selectable SMTW sessions for every UG section.
// Admin can still add additional sessions and assign faculty through course management.
const REGISTRATION_SECTIONS = ['UG-1.1','UG-1.2','UG-1.3','UG-2.1','UG-2.2','UG-2.3','UG-3.1','UG-3.2','UG-3.3','UG-4.1','UG-4.2','UG-4.3','UG-4.4'];
const DEFAULT_CLASS_SESSIONS = [
  ['08:00','09:20','G-404'], ['09:30','10:50','G-405'],
  ['11:00','12:20','G-406'], ['12:30','13:50','G-407'],
  ['14:00','15:20','G-408'], ['15:30','16:50','G-409']
];
data.courses.forEach(course => REGISTRATION_SECTIONS.forEach(group => {
  DEFAULT_CLASS_SESSIONS.forEach(([start, end, room], index) => {
    let session = data.schedules.find(item => item.courseId === course.id && item.group === group && item.start === start && item.end === end);
    if (!session) {
      data.schedules.push({ id:`default_${course.id}_${group.replace(/[^a-z0-9]/gi,'')}_${index+1}`, courseId:course.id, days:'SMTW', day:'SMTW', start, end, room, teacherId:'', group, registrationOption:true });
    } else if (/^(Academic 204|Computer Lab 2|Academic 105)$/i.test(String(session.room || ''))) {
      session.room = room;
    }
  });
}));
let selectedHelpUserId = '';
let currentChatId = '';
let editingMaterialId = '';
let selectedRegistrationSessions = {};
let selectedRegistrationSeats = {};
let registrationSessionFilters = {};
let editingAnnouncementId = '';
let editingCourseId = '';
function isAuwAcademicEmail(email) { return /^[^\s@]+@auw\.edu\.bd$/i.test(String(email || '').trim()); }

function persistComponentMarksBackup() {
  const payload = JSON.stringify(data.componentMarks || []);
  try {
    localStorage.setItem(COMPONENT_MARKS_STORAGE_KEY, payload);
    try { sessionStorage.removeItem(COMPONENT_MARKS_STORAGE_KEY); } catch (error) { /* Optional cleanup. */ }
    return 'local';
  } catch (localError) {
    try {
      sessionStorage.setItem(COMPONENT_MARKS_STORAGE_KEY, payload);
      return 'session';
    } catch (sessionError) {
      throw new Error('This browser could not store the component mark. Its storage may be full or blocked.');
    }
  }
}

function saveData() {
  const serialize = () => JSON.stringify(data);
  try {
    localStorage.setItem(STORAGE_KEY, serialize());
  } catch (error) {
    // Attachments and long-running demo sessions can fill browser storage.
    // Keep academic records intact and retry after trimming only old notifications.
    const isQuota = error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22 || error.code === 1014);
    if (!isQuota) throw error;
    const notifications = Array.isArray(data.notifications) ? data.notifications : [];
    data.notifications = notifications.slice(0, 75);
    try {
      localStorage.setItem(STORAGE_KEY, serialize());
    } catch (retryError) {
      throw new Error('Browser storage is full. Remove old uploaded attachments or clear this website’s saved demo data, then try again.');
    }
  }
}
function addNotification(userId, title, message, type = 'general', relatedId = '', actorId = currentUser()?.id) {
  if (!userId) return;
  // A user's own action must not create a notification for that same user.
  // Pass actorId=null for automatic system reminders that are relevant to both participants.
  if (actorId && userId === actorId) return;
  if (!Array.isArray(data.notifications)) data.notifications = [];
  data.notifications.unshift({ id: `nt${Date.now()}${Math.random().toString(36).slice(2,7)}`, userId, actorId: actorId || null, title, message, type, relatedId, createdAt: new Date().toISOString(), read: false });
  // Keep the local demo storage manageable.
  data.notifications = data.notifications.slice(0, 500);
  saveData();
  updateNotificationBadge();
}
function updateNotificationBadge() {
  const user = currentUser();
  if (!user) return;
  const unread = (data.notifications || []).filter(n => n.userId === user.id && !n.read).length;
  const badge = $('#notificationBadge');
  if (badge) { badge.textContent = unread > 99 ? '99+' : String(unread); badge.classList.toggle('hidden', unread === 0); }
  renderNotificationPopover();
}
function notificationCardHTML(n, showReadAction) {
  const date = new Date(n.createdAt);
  const when = Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  return `<article class="notification-item ${n.read ? 'is-read' : 'is-unread'}"><div class="notification-item-top"><strong>${escapeHTML(n.title)}</strong><small>${escapeHTML(when)}</small></div><p>${escapeHTML(n.message)}</p>${showReadAction ? `<button class="text-button" type="button" data-read-notification="${escapeHTML(n.id)}">Mark as read</button>` : '<span class="muted notification-read-label">Read</span>'}</article>`;
}
function renderNotifications() {
  const host = $('#notificationsList');
  if (!host) return;
  const mine = (data.notifications || []).filter(n => n.userId === currentUser().id).sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const unread = mine.filter(n => !n.read);
  const read = mine.filter(n => n.read);
  host.innerHTML = unread.map(n => notificationCardHTML(n, true)).join('') || '<p class="muted notification-empty">You are all caught up. New messages and updates from other people will appear here.</p>';
  const readHost = $('#readNotificationsList');
  if (readHost) readHost.innerHTML = read.map(n => notificationCardHTML(n, false)).join('') || '<p class="muted">No read notifications yet.</p>';
  const readCount = $('#readNotificationCount');
  if (readCount) readCount.textContent = String(read.length);
  const history = $('#notificationHistory');
  if (history && !read.length) history.open = false;
  updateNotificationBadge();
  renderNotificationPopover();
}
function renderNotificationPopover() {
  const list = $('#notificationPopoverList');
  if (!list || !currentUser()) return;
  const unread = (data.notifications || []).filter(n => n.userId === currentUser().id && !n.read).sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const count = $('#notificationPopoverCount');
  if (count) count.textContent = `${unread.length} unread`;
  list.innerHTML = unread.slice(0, 6).map(n => `<article class="notification-popover-item"><strong>${escapeHTML(n.title)}</strong><p>${escapeHTML(n.message)}</p><small>${escapeHTML(new Date(n.createdAt).toLocaleString())}</small><button type="button" data-read-notification="${escapeHTML(n.id)}">Mark read</button></article>`).join('') || '<p class="muted notification-empty">You are all caught up.</p>';
}


// Send an appointment reminder once, ten minutes before its approved start time.
// The browser-only demo checks while the portal is open; it cannot run while the browser is closed.
function checkAppointmentReminders() {
  const now = Date.now();
  let changed = false;
  (data.appointments || []).forEach(appointment => {
    if (appointment.status !== 'Approved' || appointment.reminderSentAt) return;
    const start = new Date(`${appointment.date}T${appointment.time}:00`).getTime();
    if (!Number.isFinite(start)) return;
    const reminderAt = start - 10 * 60 * 1000;
    if (now >= reminderAt && now < start) {
      const student = getUser(appointment.studentId);
      const faculty = getUser(appointment.facultyId);
      const when = `${appointment.date} at ${formatTime(appointment.time)}`;
      addNotification(appointment.studentId, 'Appointment starts in 10 minutes', `Your approved appointment with ${faculty?.name || 'your faculty member'} starts at ${when}.`, 'appointment-reminder', appointment.id, null);
      addNotification(appointment.facultyId, 'Appointment starts in 10 minutes', `Your approved appointment with ${student?.name || 'a student'} starts at ${when}.`, 'appointment-reminder', appointment.id, null);
      appointment.reminderSentAt = new Date(now).toISOString();
      changed = true;
      // Show a native browser alert only when the user has already granted permission.
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification('AUW Connect: appointment reminder', { body: `Your appointment starts in 10 minutes (${when}).` }); } catch (error) { /* In-app notification remains available. */ }
      }
    }
  });
  if (changed) saveData();
}

// Refresh the visible notification list when this same demo is open in another tab.
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  try {
    const latest = JSON.parse(event.newValue);
    if (Array.isArray(latest.notifications)) data.notifications = latest.notifications;
    updateNotificationBadge();
    if ($('#view-notifications')?.classList.contains('active')) renderNotifications();
  } catch (error) { /* Ignore incomplete storage updates. */ }
});

function isUserOnline(userId) {
  const lastSeen = data.presence?.[userId];
  return Boolean(lastSeen && Date.now() - lastSeen < 45000);
}
function updateMyPresence() {
  if (!data.presence) data.presence = {};
  data.presence[currentUser().id] = Date.now();
  saveData();
}
function renderPresence() {
  const user = currentUser();
  const online = isUserOnline(user.id);
  const profile = $('#profilePresence');
  if (profile) {
    profile.classList.toggle('is-offline', !online);
    profile.innerHTML = `<span class="presence-dot"></span><strong>${online ? 'Online' : 'Offline'}</strong><small>${online ? 'Your profile is visible as online' : 'You are currently offline'}</small>`;
  }
  const sideDot = $('#sidebarPresenceDot');
  if (sideDot) {
    sideDot.classList.toggle('is-offline', !online);
    sideDot.title = online ? 'Online' : 'Offline';
  }
}
function presenceLabel(userId) {
  const online = isUserOnline(userId);
  return `<span class="presence-label ${online ? 'is-online' : 'is-offline'}"><i class="presence-dot"></i>${online ? 'Online' : 'Offline'}</span>`;
}
function currentUser() { return data.users.find(user => user.id === data.currentUserId) || data.users.find(user => user.role === 'Student') || data.users[0]; }
function getUser(id) { return data.users.find(user => user.id === id); }
function getCourse(id) { return data.courses.find(course => course.id === id); }
function getTeacher(id) { return getUser(id); }
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function initials(name) { return String(name || 'AU').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(); }
function avatarContent(user) {
  if (user && user.photo) return `<img class="avatar-photo" src="${escapeHTML(user.photo)}" alt="${escapeHTML(user.name)} profile picture">`;
  return initials(user?.name || 'AU');
}
function formatTime(time) {
  if (!time) return '';
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}
function courseName(id) { const course = getCourse(id); return course ? `${course.code} · ${course.name}` : 'Course not found'; }
function gradeFor(obtained, total) {
  const percentage = total > 0 ? (obtained / total) * 100 : 0;
  const result = gradeScale.find(item => percentage >= item.min) || gradeScale[gradeScale.length - 1];
  return { percentage, letter: result.letter, gpa: result.gpa };
}
function goTo(viewName) {
  const role = currentUser()?.role;
  const studentViews = ['notifications','overview','profile','faculty-directory','office-booking','appointments','assessment','grades','cgpa','tasks','student-messenger','materials'];
  const facultyViews = ['notifications','overview','profile','office-hours','appointment-requests','assessment','grades','faculty-tasks','faculty-materials'];
  const allowed = role === 'Student' ? studentViews : facultyViews;
  if (!allowed.includes(viewName)) viewName = 'overview';
  const target = document.getElementById(`view-${viewName}`);
  if (!target) return;
  $$('.view').forEach(view => view.classList.remove('active'));
  target.classList.add('active');
  $$('.nav-item[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === viewName));
  const labels = {'notifications':'Notifications','overview':'Dashboard overview','profile':'My profile','faculty-directory':'Faculty directory','office-booking':'Office-hour booking','appointments':'My appointments','assessment':'Assessments','grades':'Grades and results','cgpa':'CGPA & academic history','tasks':'Study tasks','student-messenger':'Student messenger','materials':'Learning materials','office-hours':'Manage office hours','appointment-requests':'Appointment requests','faculty-tasks':'Study task provision','faculty-materials':'Learning materials'};
  $('#crumb').textContent = labels[viewName] || viewName;
  $('#sidebar').classList.remove('open');
  renderCurrentView(viewName);
}
function renderIdentity() {
  const user = currentUser();
  $('#sidebarAvatar').innerHTML = `${avatarContent(user)}<span id="sidebarPresenceDot" class="presence-dot" title="Online"></span>`;
  $('#topAvatar').innerHTML = `<span class="profile-top-initials">${avatarContent(user)}</span><span>Profile</span>`;
  $('#profilePhotoPreview').innerHTML = avatarContent(user);
  $('#removeProfilePhoto').classList.toggle('hidden', !user.photo);
  $('#sidebarName').textContent = user.name;
  $('#sidebarRole').textContent = user.role === 'Admin' ? 'Admin · Working in Admin' : user.role === 'Teacher' ? `Faculty · ${user.group || 'Faculty'}` : `Student · ${user.group}`;
  $('#welcomeName').textContent = user.name.split(' ')[0];
  const profileHeading = $('#view-profile h1');
  if (profileHeading) profileHeading.textContent = 'My profile';
  document.body.classList.toggle('faculty-profile-theme', user.role === 'Teacher');
  document.body.classList.toggle('student-profile-theme', user.role === 'Student');
  ['sidebarAvatar','topAvatar','profilePhotoPreview'].forEach(id => { const el = document.getElementById(id); if (el) { el.classList.toggle('faculty-avatar', user.role === 'Teacher'); el.classList.toggle('student-avatar', user.role === 'Student'); } });
  $$('.teacher-only').forEach(item => item.classList.toggle('hidden', user.role !== 'Teacher'));
  $$('.student-only').forEach(item => item.classList.toggle('hidden', user.role !== 'Student'));
  $$('.admin-only').forEach(item => item.classList.add('hidden'));
  $$('.teacher-only').forEach(item => item.classList.toggle('hidden', user.role !== 'Teacher'));
  $$('.student-only').forEach(item => item.classList.toggle('hidden', user.role !== 'Student'));
  $$('.faculty-nav-label').forEach(item => item.classList.toggle('hidden', user.role !== 'Teacher'));
  $$('.student-nav-label').forEach(item => item.classList.toggle('hidden', user.role !== 'Student'));
  $('#profileGroupFieldLabel').classList.toggle('hidden', user.role === 'Teacher');
  $('#profileName').value = user.name;
  $('#profileEmail').value = user.email;
  $('#profileUsername').value = user.username || String(user.email || '').split('@')[0].toLowerCase();
  $('#profileRole').value = user.role;
  $('#profileGroup').value = user.group;
  const affiliation = $('#profileAffiliation');
  if (affiliation) affiliation.textContent = user.role === 'Student' ? `Student · ${user.group}` : user.role === 'Teacher' ? `Faculty · ${user.group || 'Faculty'}` : 'Admin · Working in Admin';
  $('#profileGroup').disabled = true;
  renderPresence();
  const deletionStatus = $('#accountDeletionStatus');
  const deletionForm = $('#accountDeletionForm');
  if (deletionStatus && deletionForm) {
    const request = data.accountDeletionRequests.find(item => item.userId === user.id && item.status === 'pending');
    const approved = user.accountDeletionStatus === 'approved' || user.accountStatus === 'deletion_approved';
    deletionStatus.textContent = approved ? 'This account has been deactivated.' : request ? 'Your request is pending institutional review. You can continue using your account until a decision is made.' : 'No deletion request submitted.';
    deletionForm.querySelector('button[type="submit"]').disabled = Boolean(request || approved);
    deletionForm.querySelector('button[type="submit"]').textContent = request ? 'Request pending' : approved ? 'Account deactivated' : 'Request account deletion';
  }
}
function normalizeAssessmentGroup(value) {
  return String(value || '').trim().toUpperCase().replace(/[\s_]+/g, '-');
}
function studentMatchesAssessmentGroup(student, assessment) {
  const registration = data.registrations.find(item => item.studentId === student.id && item.trimester === (assessment.trimester || data.registrationSettings.trimester));
  const studentGroups = [student.group, student.section, registration?.section, student.requestedGroup]
    .map(normalizeAssessmentGroup).filter(Boolean);
  return studentGroups.includes(normalizeAssessmentGroup(assessment.group));
}
function getStudentAssessments(student = currentUser()) {
  return (data.assessments || []).filter(assessment => studentMatchesAssessmentGroup(student, assessment));
}
function renderOverview() {
  const registration = getStudentRegistration();
  const upcomingHost = $('#dashboardUpcomingAssessments');
  if (upcomingHost) {
    const student = currentUser();
    const dashboardAssessmentPanel = $('#dashboardAssessmentPanel');
    if (dashboardAssessmentPanel) dashboardAssessmentPanel.style.display = student.role === 'Student' ? '' : 'none';
    const upcoming = student.role === 'Student' ? getStudentAssessments(student)
      .filter(item => !item.deadline || new Date(item.deadline).getTime() >= Date.now())
      .sort((a,b) => new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31')) : [];
    upcomingHost.innerHTML = upcoming.length ? `<div class="upcoming-assessment-grid">${upcoming.slice(0,4).map(item => {
      const course = getCourse(item.courseId);
      const due = item.deadline ? new Date(item.deadline) : null;
      const validDue = due && !Number.isNaN(due.getTime());
      const submitted = (item.submissions || []).some(sub => sub.studentId === student.id);
      const dateLabel = validDue ? due.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline';
      const timeLabel = validDue ? due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : 'Check instructions';
      const daysLeft = validDue ? Math.ceil((due.getTime() - Date.now()) / 86400000) : null;
      const dueLabel = daysLeft === null ? 'Schedule not set' : daysLeft === 0 ? 'Due today' : daysLeft === 1 ? 'Due tomorrow' : `Due in ${daysLeft} days`;
      return `<article class="upcoming-assessment-card"><div class="upcoming-assessment-card-top"><span class="upcoming-assessment-type">${escapeHTML(item.type || 'Assessment')}</span><span class="status-pill ${submitted ? 'assessment-submitted' : 'assessment-pending'}">${submitted ? 'Submitted' : 'To do'}</span></div><h4>${escapeHTML(item.title)}</h4><p class="upcoming-assessment-course">${escapeHTML(course?.name || 'Course')}</p><div class="upcoming-assessment-deadline"><span class="assessment-calendar-icon">▦</span><span><strong>${escapeHTML(dateLabel)}</strong><small>${escapeHTML(timeLabel)}</small></span></div><div class="upcoming-assessment-card-footer"><span>${escapeHTML(dueLabel)}</span><span>${Number(item.total) > 0 ? `${escapeHTML(String(item.total))} marks` : ''}</span></div></article>`;
    }).join('')}</div>` : '<div class="upcoming-assessment-empty"><span class="upcoming-assessment-empty-icon">✓</span><strong>You’re all caught up</strong><p>No upcoming assessments are currently assigned to your group.</p></div>';
  }
  $('#statBooking').textContent = registration ? registration.section : 'Not registered';
  const registeredSubjects = registration?.subjectSelections?.length || 0;
  $('#statBookingSub').textContent = registration ? `${registration.trimester} · ${registeredSubjects} subject(s) registered` : 'Choose a session and seat for each subject';
  const grades = data.grades.filter(item => item.studentId === currentUser().id);
  const average = grades.length ? grades.reduce((sum, item) => sum + gradeFor(item.obtained, item.total).percentage, 0) / grades.length : 0;
  $('#statAverage').textContent = grades.length ? `${average.toFixed(1)}%` : '—';
  $('#statAnnouncements').textContent = data.registrationSettings.trimester;
  $('#statMessages').textContent = $('#gradeGpa')?.textContent || '—';
}
function scheduleDaysLabel(item) {
  if (Array.isArray(item.days) && item.days.length) return item.days.join('');
  if (typeof item.days === 'string' && item.days.trim()) return item.days.trim().replace(/[ ,]+/g, '');
  const names = { Sunday: 'S', Monday: 'M', Tuesday: 'T', Wednesday: 'W', Thursday: 'R', Friday: 'F', Saturday: 'A' };
  return names[item.day] || item.day || '—';
}
function sessionNumber(item, index = 0) {
  const slots = [['08:00','09:20'],['09:30','10:50'],['11:00','12:20'],['12:30','13:50'],['14:00','15:20'],['15:30','16:50']];
  const found = slots.findIndex(slot => slot[0] === item.start && slot[1] === item.end);
  return found >= 0 ? found + 1 : index + 1;
}
function sessionDisplay(item, index = 0) {
  const course = getCourse(item.courseId);
  const faculty = currentUser().role === 'Student' && data.registrationSettings.open ? 'To be assigned by Admin' : (getTeacher(item.teacherId)?.name || 'To be assigned by Admin');
  return `Session ${sessionNumber(item, index)}: ${scheduleDaysLabel(item)}, ${formatTime(item.start)}–${formatTime(item.end)} · Room: ${item.room} · Faculty: ${faculty} · Class code: ${course?.code || 'No class code'}`;
}

function isRegistrationOption(item) {
  return Boolean(item?.registrationOption || String(item?.id || '').startsWith('default_'));
}
function getConfirmedScheduleIds() {
  const ids = new Set();
  if (!Array.isArray(data.registrations)) return ids;
  data.registrations.forEach(registration => (registration.subjectSelections || []).forEach(selection => {
    if (selection.scheduleId) ids.add(selection.scheduleId);
  }));
  return ids;
}
function getActualTeachingSchedules() {
  const confirmedIds = getConfirmedScheduleIds();
  return data.schedules.filter(item => !isRegistrationOption(item) || (!data.registrationSettings.open && confirmedIds.has(item.id)));
}

function renderSchedule() {
  const user = currentUser();
  let schedules = data.schedules;
  let seatBySchedule = {};
  if (user.role === 'Student') {
    const registration = getStudentRegistration();
    if (registration && registration.status === 'approved') {
      schedules = (registration.subjectSelections || []).map(selection => {
        seatBySchedule[selection.scheduleId] = selection.seat;
        return data.schedules.find(item => item.id === selection.scheduleId);
      }).filter(Boolean);
    } else {
      schedules = [];
    }
  }
  if (user.role === 'Teacher') schedules = getActualTeachingSchedules().filter(item => item.teacherId === user.id);
  if (user.role === 'Admin') schedules = getActualTeachingSchedules();
  schedules = [...schedules].sort((a, b) => a.start.localeCompare(b.start));
  const studentRegistration = user.role === 'Student' ? getStudentRegistration() : null;
  const emptyMessage = user.role === 'Student' && studentRegistration && studentRegistration.status !== 'approved'
    ? 'Your class registration is awaiting Admin approval.'
    : user.role === 'Student' && !studentRegistration
    ? 'Complete your class registration to see your confirmed class schedule here.'
    : 'No classes have been scheduled for this account yet.';
  $('#studentScheduleBody').innerHTML = schedules.map((item, index) => `<tr><td>${escapeHTML(scheduleDaysLabel(item))}</td><td>Session ${sessionNumber(item, index)} · ${formatTime(item.start)} – ${formatTime(item.end)}</td><td>${escapeHTML(courseName(item.courseId))}<br><small>${escapeHTML(getCourse(item.courseId)?.code || '')}</small></td><td>${escapeHTML(item.room)}</td><td>${escapeHTML(user.role === 'Student' && data.registrationSettings.open ? 'To be assigned by Admin' : (getTeacher(item.teacherId)?.name || 'To be assigned by Admin'))}</td><td>${user.role === 'Student' ? String(seatBySchedule[item.id] || '—').padStart(2,'0') : '—'}</td></tr>`).join('') || `<tr><td colspan="6">${emptyMessage}</td></tr>`;
  $('#scheduleHeading').textContent = user.role === 'Student' ? `${user.group} confirmed class schedule` : user.role === 'Teacher' ? 'My teaching schedule' : 'All class schedules';
}
function renderGradeScale() {
  $('#gradeScaleBody').innerHTML = gradeScale.map(item => `<tr><td><span class="grade-letter">${item.letter}</span></td><td>${item.gpa.toFixed(1)}</td><td>${item.letter === 'F' ? '59 or below' : `${item.min}–${Math.floor(item.max)}`}</td><td>${item.description}</td></tr>`).join('');
}
function getPublishedCourseResults(studentId) {
  return data.grades.filter(g => g.studentId === studentId && g.published === true);
}
function calculateCgpa(results) {
  const totals = results.reduce((acc, item) => {
    const credits = Math.max(0, Number(getCourse(item.courseId)?.credits) || 0);
    const point = gradeFor(item.obtained, item.total).gpa;
    acc.credits += credits;
    acc.quality += point * credits;
    return acc;
  }, { credits: 0, quality: 0 });
  return { cgpa: totals.credits ? totals.quality / totals.credits : null, credits: totals.credits, quality: totals.quality };
}
function renderAcademicHistory() {
  const user = currentUser();
  const host = $('#academicHistoryBody');
  if (!host) return;
  if (user.role !== 'Student') return;
  const rows = getPublishedCourseResults(user.id).slice().sort((a,b) => String(a.trimester).localeCompare(String(b.trimester)) || courseName(a.courseId).localeCompare(courseName(b.courseId)));
  const totals = calculateCgpa(rows);
  $('#academicCgpaValue').textContent = totals.cgpa === null ? '—' : totals.cgpa.toFixed(2);
  $('#academicCourseCount').textContent = rows.length;
  $('#academicCredits').textContent = totals.credits.toFixed(1).replace(/\.0$/,'');
  host.innerHTML = rows.map(item => {
    const result = gradeFor(item.obtained,item.total);
    const credits = Math.max(0, Number(getCourse(item.courseId)?.credits) || 0);
    return `<tr><td>${escapeHTML(item.trimester || 'Fall 2026')}</td><td>${escapeHTML(courseName(item.courseId))}</td><td>${credits}</td><td>${Number(item.obtained).toFixed(1)}%</td><td><span class="grade-letter">${result.letter}</span></td><td>${result.gpa.toFixed(2)}</td><td>${(result.gpa*credits).toFixed(2)}</td></tr>`;
  }).join('') || '<tr><td colspan="7">No published course results are available yet.</td></tr>';
}
function renderFinalizationPanel() {
  const user = currentUser();
  const panel = $('#facultyFinalizationPanel');
  if (!panel) return;
  panel.style.display = user.role === 'Teacher' ? '' : 'none';
  if (user.role !== 'Teacher') return;
  const courseSelect = $('#finalizeCourse');
  const courses = data.courses.filter(c => c.teacherId === user.id);
  const priorCourse = courseSelect.value;
  courseSelect.innerHTML = courses.map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.code)} · ${escapeHTML(c.name)}</option>`).join('');
  if (courses.some(c => c.id === priorCourse)) courseSelect.value = priorCourse;
  if ($('#finalizeTrimester') && !$('#finalizeTrimester').value) $('#finalizeTrimester').value = data.registrationSettings.trimester || 'Fall 2026';
  const courseId = courseSelect.value;
  const trimester = $('#finalizeTrimester').value.trim() || data.registrationSettings.trimester;
  const students = [...new Set(data.componentMarks.filter(m => m.courseId === courseId && m.trimester === trimester && m.enteredById === user.id).map(m => m.studentId))];
  const rows = students.map(studentId => ({ studentId, summary: getComponentSummary(studentId,courseId,trimester) }));
  $('#finalizePreview').innerHTML = `<table><thead><tr><th>Student</th><th>Recorded components</th><th>Final weighted mark</th><th>Letter</th><th>Status</th></tr></thead><tbody>${rows.map(({studentId,summary}) => {
    const existing = data.grades.find(g => g.studentId===studentId && g.courseId===courseId && g.trimester===trimester && g.resultSource==='components');
    const ready = summary.allComponents && summary.finalPercentage !== null;
    const result = ready ? gradeFor(summary.finalPercentage,100) : null;
    return `<tr><td>${escapeHTML(getUser(studentId)?.name || 'Student')}</td><td>${summary.totalWeightRecorded}% / 100%</td><td>${ready ? summary.finalPercentage.toFixed(2)+'%' : 'Incomplete'}</td><td>${result ? result.letter : '—'}</td><td>${existing?.published ? 'Published' : ready ? 'Ready for review' : 'Awaiting all six components'}</td></tr>`;
  }).join('') || '<tr><td colspan="5">No component marks have been recorded for this course and trimester.</td></tr>'}</tbody></table><p class="muted">Publication is available only when every student with recorded marks has all six components. Confirm the marks above before publishing.</p>`;
}

const COMPONENT_WEIGHTS = { 'Attendance':5, 'Quiz':20, 'Class Participation':10, 'Presentation':10, 'Midterm':25, 'Final Exam':30 };
function componentKey(category) { return category === 'Final' ? 'Final Exam' : category; }
function getComponentRecords(studentId, courseId, trimester) {
  const manual = data.componentMarks.filter(m => m.studentId === studentId && m.courseId === courseId && m.trimester === trimester);
  const assessmentGroups = {};
  data.assessments.filter(a => a.courseId === courseId && (a.trimester || 'Fall 2026') === trimester && COMPONENT_WEIGHTS[componentKey(a.category)]).forEach(a => {
    (a.submissions || []).filter(sub => sub.studentId === studentId && sub.marks != null).forEach(sub => {
      const category = componentKey(a.category);
      if (!assessmentGroups[category]) assessmentGroups[category] = { earned:0, total:0, source:'assessment' };
      assessmentGroups[category].earned += Number(sub.marks) || 0;
      assessmentGroups[category].total += Number(a.total) || 0;
    });
  });
  const result = {};
  Object.keys(COMPONENT_WEIGHTS).forEach(category => {
    const entries = manual.filter(m => m.category === category);
    if (entries.length) {
      const latest = entries[entries.length - 1];
      // An explicitly cleared component stays blank and must not fall back to 0
      // or to an older assessment-derived value.
      if (latest.cleared === true || latest.percentage === '' || latest.percentage == null) return;
      const value = Number(latest.percentage);
      if (Number.isFinite(value)) result[category] = { percentage: value, source:'manual' };
    } else if (assessmentGroups[category]?.total > 0) result[category] = { percentage: assessmentGroups[category].earned / assessmentGroups[category].total * 100, source:'assessment' };
  });
  return result;
}
function calculateCurrentProgress(studentId, courseId, trimester) {
  const records = getComponentRecords(studentId, courseId, trimester);
  let earned = 0, availableWeight = 0;
  Object.entries(records).forEach(([category, record]) => { if(category==='Final Exam') return; const weight = COMPONENT_WEIGHTS[category] || 0; earned += record.percentage / 100 * weight; availableWeight += weight; });
  return { percentage: availableWeight ? earned / availableWeight * 100 : null, weightedPoints: earned, availableWeight, records };
}
function calculateFinalWeightedMark(studentId,courseId,trimester){const records=getComponentRecords(studentId,courseId,trimester);const required=Object.keys(COMPONENT_WEIGHTS);if(!required.every(k=>records[k]))return null;return required.reduce((sum,k)=>sum+(records[k].percentage/100)*COMPONENT_WEIGHTS[k],0);}
function progressReleaseKey(studentId, courseId, trimester) { return `${studentId}|${courseId}|${trimester}`; }
function renderComponentMarksPanel() {
  const panel = $('#componentMarksPanel'); if (!panel) return;
  const user = currentUser(); panel.style.display = user.role === 'Teacher' ? '' : 'none';
  if (user.role !== 'Teacher') return;
  const students = data.users.filter(u => u.role === 'Student');
  // Match the same course-assignment logic used by Assessments and Learning Materials:
  // a course may be assigned directly on the course record OR through a teaching schedule.
  const assignedCourseIds = new Set([
    ...data.courses.filter(course => course.teacherId === user.id).map(course => course.id),
    ...data.schedules.filter(item => item.teacherId === user.id).map(item => item.courseId)
  ]);
  const courses = assignedCourseIds.size
    ? data.courses.filter(course => assignedCourseIds.has(course.id))
    : data.courses;
  const studentSelect = $('#componentStudent'), courseSelect = $('#componentCourse');
  const prevStudent = studentSelect.value, prevCourse = courseSelect.value;
  studentSelect.innerHTML = students.map(u=>`<option value="${escapeHTML(u.id)}">${escapeHTML(u.name)} (${escapeHTML(u.group||'')})</option>`).join('');
  courseSelect.innerHTML = courses.length ? courses.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.code)} · ${escapeHTML(c.name)}</option>`).join('') : '<option value="">No courses assigned to this faculty account</option>';
  if (students.some(u=>u.id===prevStudent)) studentSelect.value=prevStudent;
  if (courses.some(c=>c.id===prevCourse)) courseSelect.value=prevCourse;
  else if (courses.length) courseSelect.value = courses[0].id;
  courseSelect.disabled = courses.length === 0;
  studentSelect.disabled = students.length === 0;
  const trimester = $('#componentTrimester').value.trim() || data.registrationSettings.trimester || 'Fall 2026';
  const rows = students.filter(st => data.schedules.some(sc=>sc.teacherId===user.id && sc.courseId===courseSelect.value && sc.group===st.group) || courses.some(c=>c.id===courseSelect.value && c.teacherId===user.id));
  $('#componentProgressTable').innerHTML = `<table><thead><tr><th>Student</th><th>Recorded components</th><th>Current progress</th><th>Final weighted mark</th><th>Student visibility</th><th>Action</th></tr></thead><tbody>${rows.map(st=>{const summary=calculateCurrentProgress(st.id,courseSelect.value,trimester);const key=progressReleaseKey(st.id,courseSelect.value,trimester);const release=data.progressReleases[key];const componentText=Object.entries(summary.records).map(([k,v])=>`${k}: ${v.percentage.toFixed(1)}%${v.source==='assessment'?' (assessment)':''}`).join('<br>')||'No marks recorded';const finalMark=calculateFinalWeightedMark(st.id,courseSelect.value,trimester);const existingResult=data.grades.find(g=>g.studentId===st.id&&g.courseId===courseSelect.value&&g.trimester===trimester&&g.resultSource==='components');return `<tr><td>${escapeHTML(st.name)}</td><td>${componentText}</td><td>${summary.percentage===null?'—':summary.percentage.toFixed(1)+'%'}</td><td>${finalMark===null?'Awaiting all 6 components':finalMark.toFixed(1)+'%'}</td><td>${release?'Progress released':'Not released'}${existingResult?.published?' · Final result published':''}</td><td>${summary.percentage===null?'<span class="muted">Add marks first</span>':`<button class="button button-primary" type="button" data-release-progress="${escapeHTML(key)}">${release?'Update release':'Release progress'}</button>`}${finalMark!==null?(existingResult?.published?` <button class="button button-outline" type="button" data-unpublish-component-result="${escapeHTML(key)}">Unpublish result</button>`:` <button class="button button-primary" type="button" data-publish-component-result="${escapeHTML(key)}">Publish final result</button>`):''}</td></tr>`}).join('')||'<tr><td colspan="6">No students found for this course.</td></tr>'}</tbody></table>`;

}
function renderGrades() {
  const user = currentUser();
  const isFacultyView = user.role === 'Teacher' || user.role === 'Admin';
  const allGrades = data.grades.filter(item => {
    if (user.role === 'Admin') return true;
    if (user.role === 'Teacher') return item.enteredById === user.id || (!item.enteredById && getCourse(item.courseId)?.teacherId === user.id);
    return item.studentId === user.id && item.published !== false;
  });
  const publishedStudentGrades = user.role === 'Student' ? allGrades : [];
  const filterWrap = $('#studentResultFilterWrap');
  const filter = $('#studentResultTrimester');
  if (filterWrap) filterWrap.style.display = user.role === 'Student' ? '' : 'none';
  if (filter && user.role === 'Student') {
    const previousValue = filter.value || 'all';
    const trimesters = [...new Set(publishedStudentGrades.map(item => item.trimester || 'Fall 2026'))].sort();
    filter.innerHTML = '<option value="all">All published trimesters</option>' + trimesters.map(term => `<option value="${escapeHTML(term)}">${escapeHTML(term)}</option>`).join('');
    filter.value = trimesters.includes(previousValue) ? previousValue : 'all';
  }
  const selectedTrimester = user.role === 'Student' && filter ? filter.value : 'all';
  const visibleGrades = user.role === 'Student' && selectedTrimester !== 'all'
    ? allGrades.filter(item => (item.trimester || 'Fall 2026') === selectedTrimester)
    : allGrades;
  const results = visibleGrades.map(item => ({ ...item, result: gradeFor(item.obtained, item.total) }));
  // The headline average, subject count and CGPA always use every published result.
  const summaryResults = (user.role === 'Student' ? publishedStudentGrades : allGrades.filter(item => item.published === true)).map(item => ({ ...item, result: gradeFor(item.obtained, item.total) }));
  const average = summaryResults.length ? summaryResults.reduce((sum, item) => sum + item.result.percentage, 0) / summaryResults.length : 0;
  const cgpaSummary = calculateCgpa(summaryResults);
  $('#gradeAverage').textContent = summaryResults.length ? `${average.toFixed(1)}%` : '—';
  $('#gradeGpa').textContent = cgpaSummary.cgpa === null ? '—' : cgpaSummary.cgpa.toFixed(2);
  $('#gradeCount').textContent = summaryResults.length;
  const heading = $('#view-grades h3');
  const description = $('#view-grades .panel-heading .muted');
  if (heading) heading.textContent = isFacultyView ? (user.role === 'Admin' ? 'All student results' : 'Student results I recorded') : 'My results';
  if (description) description.textContent = isFacultyView ? 'Review or correct your recorded marks, then release each result to the student when it is ready.' : 'Choose a trimester to view your subject-wise published results.';
  const header = $('#myGradeBody').closest('table').querySelector('thead tr');
  header.innerHTML = isFacultyView
    ? `<th>Student</th><th>Trimester</th><th>Course</th><th>Obtained</th><th>Total</th><th>Percentage</th><th>Letter</th><th>Grade points</th><th>Feedback</th>${user.role === 'Admin' ? '<th>Publication</th>' : '<th>Student visibility</th>'}`
    : '<th>Trimester</th><th>Course</th><th>Obtained</th><th>Total</th><th>Percentage</th><th>Letter</th><th>Grade points</th><th>Feedback</th>';
  const gradeRows = items => items.map(item => `<tr><td>${escapeHTML(item.trimester || 'Fall 2026')}</td><td>${item.obtained}</td><td>${item.total}</td><td>${item.result.percentage.toFixed(1)}%</td><td><span class="grade-letter">${item.result.letter}</span></td><td>${item.result.gpa.toFixed(1)}</td><td>${escapeHTML(item.feedback || '—')}</td></tr>`).join('');
  if (user.role === 'Student') {
    // One expandable dropdown per subject. Show only progress snapshots released
    // by faculty, or all components after the final result has been published.
    const subjectIds = new Set(results.map(item => String(item.courseId)));
    Object.keys(data.progressReleases || {}).forEach(key => {
      const [studentId, courseId, term] = key.split('|');
      if (studentId === user.id && (selectedTrimester === 'all' || term === selectedTrimester)) subjectIds.add(String(courseId));
    });
    const subjects = [...subjectIds].sort((a,b) => courseName(a).localeCompare(courseName(b)));
    const subjectMarkup = subjects.map(courseId => {
      const subjectGrades = results.filter(item => String(item.courseId) === courseId)
        .sort((a,b) => String(b.trimester || '').localeCompare(String(a.trimester || '')));
      const releaseEntries = Object.entries(data.progressReleases || {}).filter(([key]) => {
        const [studentId, releasedCourseId, term] = key.split('|');
        return studentId === user.id && String(releasedCourseId) === courseId &&
          (selectedTrimester === 'all' || term === selectedTrimester);
      });
      const terms = new Set([
        ...subjectGrades.map(item => item.trimester || 'Fall 2026'),
        ...releaseEntries.map(([key]) => key.split('|')[2] || 'Fall 2026')
      ]);
      const latestGrade = subjectGrades[0];
      const meta = subjectGrades.length
        ? `${subjectGrades.length} published ${subjectGrades.length === 1 ? 'result' : 'results'}`
        : `${releaseEntries.length} released progress ${releaseEntries.length === 1 ? 'update' : 'updates'}`;
      const termMarkup = [...terms].sort((a,b) => String(b).localeCompare(String(a))).map(term => {
        const grade = subjectGrades.find(item => (item.trimester || 'Fall 2026') === term);
        const releaseKey = `${user.id}|${courseId}|${term}`;
        const release = data.progressReleases?.[releaseKey];
        const records = grade?.published === true
          ? getComponentRecords(user.id, courseId, term)
          : (release?.components || null);
        const componentRows = Object.entries(COMPONENT_WEIGHTS).map(([name, weight]) => {
          const record = records && records[name];
          const hasMark = record && record.percentage !== '' && record.percentage != null && Number.isFinite(Number(record.percentage));
          const mark = hasMark ? `${Number(record.percentage).toFixed(1)}%` : 'Not released';
          const contribution = hasMark ? `${(Number(record.percentage) * weight / 100).toFixed(2)} / ${weight}` : '—';
          return `<tr><td>${escapeHTML(name)}</td><td>${weight}%</td><td>${mark}</td><td>${contribution}</td></tr>`;
        }).join('');
        const finalMarkup = grade ? `<div class="subject-result-final"><h5>Published final result</h5><div class="table-wrap"><table><thead><tr><th>Obtained</th><th>Total</th><th>Percentage</th><th>Letter</th><th>Grade points</th><th>Feedback</th></tr></thead><tbody><tr><td>${grade.obtained}</td><td>${grade.total}</td><td>${grade.result.percentage.toFixed(1)}%</td><td><span class="grade-letter">${grade.result.letter}</span></td><td>${grade.result.gpa.toFixed(1)}</td><td>${escapeHTML(grade.feedback || '—')}</td></tr></tbody></table></div></div>` : '';
        const progressMarkup = release ? `<p class="subject-result-progress">Released progress: <strong>${Number(release.percentage).toFixed(1)}%</strong> <span>(${Number(release.availableWeight) || 0}% of course weight recorded)</span></p>` : '';
        return `<section class="subject-result-term"><h4>${escapeHTML(term)}</h4>${progressMarkup}<div class="table-wrap subject-result-table"><table><thead><tr><th>Assessment component</th><th>Weight</th><th>Your mark</th><th>Weighted contribution</th></tr></thead><tbody>${componentRows}</tbody></table></div>${finalMarkup}</section>`;
      }).join('');
      return `<details class="subject-result-dropdown"><summary><span class="subject-result-title">${escapeHTML(courseName(courseId))}</span><span class="subject-result-meta">${meta}${latestGrade ? ` · Latest ${latestGrade.result.percentage.toFixed(1)}%` : ''}</span></summary><div class="subject-result-content">${termMarkup || '<p class="muted">No released marks are available yet.</p>'}</div></details>`;
    });
    $('#myGradeBody').innerHTML = subjectMarkup.length
      ? `<tr><td colspan="8"><div class="subject-result-dropdowns">${subjectMarkup.join('')}</div></td></tr>`
      : `<tr><td colspan="8">No published results or released progress are available for this trimester yet.</td></tr>`;
  } else {
    $('#myGradeBody').innerHTML = results.map(item => `<tr>${isFacultyView ? `<td>${escapeHTML(getUser(item.studentId)?.name || 'Unknown student')}</td>` : ''}<td>${escapeHTML(item.trimester || 'Fall 2026')}</td><td>${escapeHTML(courseName(item.courseId))}</td><td>${item.obtained}</td><td>${item.total}</td><td>${item.result.percentage.toFixed(1)}%</td><td><span class="grade-letter">${item.result.letter}</span></td><td>${item.result.gpa.toFixed(1)}</td><td>${escapeHTML(item.feedback || '—')}</td>${user.role === 'Admin' ? `<td>${item.published === false ? `<span class="muted">Pending</span> <button class="button button-outline" type="button" data-publish-grade="${escapeHTML(item.id)}">Publish</button>` : '<span class="muted">Published</span>'}</td>` : user.role === 'Teacher' ? `<td>${item.published === false ? `<span class="muted">Draft</span> <button class="button button-primary" type="button" data-faculty-release-grade="${escapeHTML(item.id)}">Release to student</button>` : '<span class="soft-tag">Released</span>'}</td>` : ''}</tr>`).join('') || `<tr><td colspan="${user.role === 'Admin' ? 10 : 10}">${isFacultyView ? 'No student marks have been recorded by this account yet.' : 'No grades have been entered for this account yet.'}</td></tr>`;
  }
  renderGradeScale();
}


function renderAcademicHistory() {
  const user = currentUser();
  const host = $('#academicTrimesterHistory');
  const body = $('#cgpaCalculationBody');
  if (!host || !body) return;
  if (user.role !== 'Student') {
    host.innerHTML = '<p class="muted">Academic history is available in the student account.</p>';
    body.innerHTML = '<tr><td colspan="6">Sign in as a student to view academic history.</td></tr>';
    return;
  }
  const published = data.grades.filter(item => item.studentId === user.id && item.published !== false)
    .map(item => {
      const course = getCourse(item.courseId);
      const result = gradeFor(Number(item.obtained) || 0, Number(item.total) || 0);
      const credits = Math.max(0, Number(course?.credits) || 1);
      return { ...item, course, result, credits, qualityPoints: result.gpa * credits, trimester: item.trimester || 'Fall 2026' };
    });
  const totalCredits = published.reduce((sum, item) => sum + item.credits, 0);
  const totalQualityPoints = published.reduce((sum, item) => sum + item.qualityPoints, 0);
  const cgpa = totalCredits > 0 ? totalQualityPoints / totalCredits : null;
  $('#historyCgpa').textContent = cgpa === null ? '—' : cgpa.toFixed(2);
  $('#historyCredits').textContent = Number.isInteger(totalCredits) ? String(totalCredits) : totalCredits.toFixed(1);
  $('#historyCourses').textContent = String(published.length);
  const terms = [...new Set(published.map(item => item.trimester))].sort((a,b) => {
    const da = Date.parse(a), db = Date.parse(b);
    return Number.isNaN(da) || Number.isNaN(db) ? a.localeCompare(b) : da-db;
  });
  host.innerHTML = terms.length ? terms.map(term => {
    const rows = published.filter(item => item.trimester === term);
    const credits = rows.reduce((sum,item) => sum + item.credits,0);
    const points = rows.reduce((sum,item) => sum + item.qualityPoints,0);
    const termCgpa = credits ? (points/credits).toFixed(2) : '—';
    return `<section class="academic-term-card"><div class="academic-term-heading"><div><h4>${escapeHTML(term)}</h4><small>${rows.length} published course${rows.length===1?'':'s'} · ${credits} credit hour${credits===1?'':'s'}</small></div><div><small>Trimester average (grade points)</small><strong>${termCgpa}</strong></div></div><div class="table-wrap"><table><thead><tr><th>Course</th><th>Percentage</th><th>Letter</th><th>Grade points</th><th>Credits</th></tr></thead><tbody>${rows.map(item=>`<tr><td>${escapeHTML(item.course ? `${item.course.code} · ${item.course.name}` : 'Course not found')}</td><td>${item.result.percentage.toFixed(1)}%</td><td><span class="grade-letter">${item.result.letter}</span></td><td>${item.result.gpa.toFixed(2)}</td><td>${item.credits}</td></tr>`).join('')}</tbody></table></div></section>`;
  }).join('') : '<div class="stage-placeholder"><span>↗</span><strong>No published results yet</strong><small>Your academic history and CGPA will appear here after faculty publish your course results.</small></div>';
  body.innerHTML = published.map(item => `<tr><td>${escapeHTML(item.course ? `${item.course.code} · ${item.course.name}` : 'Course not found')}</td><td>${escapeHTML(item.trimester)}</td><td><span class="grade-letter">${item.result.letter}</span></td><td>${item.result.gpa.toFixed(2)}</td><td>${item.credits}</td><td>${item.qualityPoints.toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="6">No published course results are available yet.</td></tr>';
}

function renderAnnouncements() {
  const search = ($('#announcementSearch')?.value || '').trim().toLowerCase();
  const category = $('#announcementFilter')?.value || 'All';
  const readIds = JSON.parse(localStorage.getItem(`auwReadAnnouncements_${currentUser().id}`) || '[]');
  const items = [...data.announcements].filter(item => {
    const matchesText = `${item.title} ${item.text}`.toLowerCase().includes(search);
    const matchesCategory = category === 'All' || (item.category || 'General') === category;
    return matchesText && matchesCategory;
  });
  $('#announcementList').innerHTML = items.map(item => {
    const isRead = readIds.includes(item.id);
    return `<article class="announcement-card ${isRead ? 'announcement-read' : 'announcement-unread'}"><div class="announcement-card-top"><span class="announcement-category category-${(item.category || 'General').toLowerCase()}">${escapeHTML(item.category || 'General')}</span><small>${escapeHTML(item.date || '')}</small></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.text)}</p><button class="text-button" data-read-announcement="${item.id}">${isRead ? '✓ Read' : 'Mark as read'}</button></article>`;
  }).join('') || '<p class="muted">No announcements match your search.</p>';
}
function renderAdminAnnouncements() {
  const host = $('#adminAnnouncementList');
  if (!host) return;
  host.innerHTML = [...data.announcements].map(item => `<div class="admin-announcement-row"><div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.category || 'General')} · ${escapeHTML(item.date || '')}</small></div><div class="row-actions"><button class="text-button" data-edit-announcement="${item.id}">Edit</button><button class="remove-btn" data-delete-announcement="${item.id}">Delete</button></div></div>`).join('') || '<p class="muted">No announcements published yet.</p>';
}
function helpThreadMessages(userId) {
  return data.helpMessages.filter(message => message.threadUserId === userId);
}
function renderAdminHelpInbox() {
  const list = $('#adminHelpThreads');
  const conversation = $('#adminHelpConversation');
  if (!list || !conversation) return;
  const userIds = [...new Set(data.helpMessages.map(message => message.threadUserId))];
  if (!userIds.includes(selectedHelpUserId)) selectedHelpUserId = userIds[0] || '';
  list.innerHTML = userIds.map(userId => {
    const user = getUser(userId);
    const messages = helpThreadMessages(userId);
    const last = messages[messages.length - 1];
    return `<button type="button" class="help-thread-button ${selectedHelpUserId === userId ? 'active' : ''}" data-help-thread="${userId}"><strong>${escapeHTML(user?.name || 'Former user')}</strong><small>${escapeHTML(user?.group || user?.role || 'Campus member')}</small><span>${escapeHTML((last?.text || '').slice(0, 55))}</span></button>`;
  }).join('') || '<p class="muted">No support messages yet. New messages from students and faculty will appear here.</p>';
  const messages = selectedHelpUserId ? helpThreadMessages(selectedHelpUserId) : [];
  conversation.innerHTML = messages.map(message => {
    const fromAdmin = message.senderId === 'a1';
    return `<div class="help-message ${fromAdmin ? 'help-message-admin' : 'help-message-mine'}"><strong>${fromAdmin ? 'Admin' : escapeHTML(getUser(message.senderId)?.name || 'User')}</strong><p>${escapeHTML(message.text)}</p><small>${escapeHTML(message.time)}</small></div>`;
  }).join('') || '<p class="muted">Choose a conversation to read messages.</p>';
  conversation.scrollTop = conversation.scrollHeight;
  $('#adminHelpReplyInput').disabled = !selectedHelpUserId;
  $('#adminHelpReplyForm').querySelector('button').disabled = !selectedHelpUserId;
}
function sendHelpMessage(senderId, threadUserId, text) {
  data.helpMessages.push({ id: `help${Date.now()}${Math.random().toString(16).slice(2, 6)}`, senderId, threadUserId, text, time: new Date().toLocaleString() });
  saveData();
}

function renderTeachers() {
  const teachers = data.users.filter(user => ['Teacher', 'Faculty'].includes(user.role));
  const user = currentUser();
  const isFaculty = user && ['Teacher', 'Faculty'].includes(user.role);

  // A faculty member can use courses assigned through either the course record
  // or an Admin-created teaching schedule. If no assignment exists yet, show
  // the available courses rather than leaving the dropdown blank.
  const assignedIds = new Set([
    ...data.courses.filter(course => course.teacherId === user?.id).map(course => course.id),
    ...data.schedules.filter(item => item.teacherId === user?.id).map(item => item.courseId)
  ]);
  const facultyCourses = isFaculty && assignedIds.size
    ? data.courses.filter(course => assignedIds.has(course.id))
    : data.courses;

  const buildCourseOptions = (courses, placeholder) =>
    `<option value="">${placeholder}</option>` +
    courses.map(course => `<option value="${escapeHTML(course.id)}">${escapeHTML(course.code || '')} · ${escapeHTML(course.name || 'Untitled course')}</option>`).join('');

  const allCourseOptions = buildCourseOptions(data.courses, 'Select a course');
  const facultyCourseOptions = buildCourseOptions(facultyCourses, facultyCourses.length ? 'Select an assigned course' : 'No courses available — ask Admin to add or assign a course');

  if ($('#assessmentCourse')) {
    $('#assessmentCourse').innerHTML = facultyCourseOptions;
    $('#assessmentCourse').disabled = facultyCourses.length === 0;
  }
  if ($('#facultyCourse')) $('#facultyCourse').innerHTML = allCourseOptions;
  if ($('#materialCourse')) {
    $('#materialCourse').innerHTML = facultyCourseOptions;
    $('#materialCourse').disabled = facultyCourses.length === 0;
  }
  if ($('#gradeCourse')) {
    $('#gradeCourse').innerHTML = facultyCourseOptions;
    $('#gradeCourse').disabled = facultyCourses.length === 0;
  }
  if ($('#newCourseTeacher')) {
    $('#newCourseTeacher').innerHTML = teachers.map(user => `<option value="${escapeHTML(user.id)}">${escapeHTML(user.name)}</option>`).join('');
  }
  if ($('#adminScheduleCourse')) $('#adminScheduleCourse').innerHTML = allCourseOptions;
}
function chatTitle(chat) {
  if (chat.type === 'group') return chat.title;
  const otherId = chat.memberIds.find(id => id !== currentUser().id);
  return getUser(otherId)?.name || chat.title || 'Private chat';
}
function isStudentOnlyConversation(chat) {
  return Array.isArray(chat.memberIds) && chat.memberIds.length >= 2 && chat.memberIds.every(id => getUser(id)?.role === 'Student');
}
function ensureGeneralStudentGroup() {
  if (!Array.isArray(data.conversations)) data.conversations = [];
  const studentIds = data.users.filter(person => person.role === 'Student').map(person => person.id);
  let general = data.conversations.find(chat => chat.id === 'auw-general-student-group');
  if (!general) {
    general = { id: 'auw-general-student-group', title: 'General Group', type: 'group', isGeneral: true, memberIds: studentIds, messages: [{ id: 'general-welcome', senderId: 't1', text: 'Welcome to the AUW Connect General Group. You can chat with the student community here.', time: 'Welcome' }] };
    data.conversations.unshift(general);
  } else {
    general.title = 'General Group'; general.type = 'group'; general.isGeneral = true;
    general.memberIds = studentIds; general.messages = Array.isArray(general.messages) ? general.messages : [];
  }
}
function renderConversations() {
  const user = currentUser();
  if (!user || user.role !== 'Student') return;
  ensureGeneralStudentGroup();
  const chats = data.conversations.filter(chat => isStudentOnlyConversation(chat) && chat.memberIds.includes(user.id)).sort((a,b) => (a.isGeneral ? -1 : 0) - (b.isGeneral ? -1 : 0));
  if (!currentChatId || !chats.some(chat => chat.id === currentChatId)) currentChatId = chats[0]?.id || '';
  $('#conversationList').innerHTML = chats.map(chat => {
    const otherId = chat.type === 'private' ? chat.memberIds.find(id => id !== user.id) : '';
    const detail = chat.type === 'group' ? `${chat.memberIds.length} student members · Group chat` : `Student · ${isUserOnline(otherId) ? 'Online' : 'Offline'}`;
    const avatarUser = chat.type === 'private' ? getUser(otherId) : null;
    return `<button class="conversation ${chat.id === currentChatId ? 'active' : ''}" data-chat-id="${escapeHTML(chat.id)}"><span class="avatar">${avatarUser ? avatarContent(avatarUser) : initials(chatTitle(chat))}</span><span><strong>${escapeHTML(chatTitle(chat))}</strong><small>${detail}</small></span>${chat.type === 'private' ? `<i class="presence-dot ${isUserOnline(otherId) ? '' : 'is-offline'}" title="${isUserOnline(otherId) ? 'Online' : 'Offline'}"></i>` : ''}</button>`;
  }).join('') || '<p class="muted">No student conversations yet. Start a private chat or create a group.</p>';
  renderChat();
}
function renderChat() {
  const user = currentUser();
  const chat = user?.role === 'Student' ? data.conversations.find(item => item.id === currentChatId && isStudentOnlyConversation(item) && item.memberIds.includes(user.id)) : null;
  $('#chatTitle').textContent = chat ? chatTitle(chat) : 'Select a conversation';
  if (chat && chat.type === 'private') { const otherId = chat.memberIds.find(id => id !== user.id); $('#chatSubtitle').textContent = `${getUser(otherId)?.name || 'Student'} · ${isUserOnline(otherId) ? 'Online' : 'Offline'}`; }
  else $('#chatSubtitle').textContent = chat ? `${chat.memberIds.length} student members` : 'Start a student conversation';
  const actions = $('#chatGroupActions');
  const memberPanel = $('#chatMemberList');
  if (actions) actions.innerHTML = chat?.type === 'group' ? `<button type="button" class="button button-outline" data-toggle-members>View members (${chat.memberIds.length})</button>${chat.isGeneral ? '<span class="soft-tag">Open to all students</span>' : `${chat.ownerId === user.id ? '<button type="button" class="button button-outline" data-manage-group>Manage members</button>' : ''}<button type="button" class="button button-outline" data-leave-group>Leave group</button>`}` : '';
  if (memberPanel) {
    memberPanel.classList.add('hidden');
    memberPanel.innerHTML = chat?.type === 'group' ? `<strong>Group members (${chat.memberIds.length})</strong><div class="chat-member-grid">${chat.memberIds.map(id => getUser(id)).filter(Boolean).map(person => `<div class="chat-member"><span class="avatar">${avatarContent(person)}</span><span><b>${escapeHTML(person.name)}</b><small>${escapeHTML(person.group || person.role || 'Student')}${person.id === chat.ownerId ? ' · Group creator' : ''}${person.id === user.id ? ' · You' : ''}</small></span></div>`).join('')}</div>` : '';
  }
  $('#chatMessages').innerHTML = chat ? chat.messages.map(message => {
    const sender = getUser(message.senderId);
    const mine = message.senderId === user.id;
    const safeText = escapeHTML(message.text || '').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\n/g, '<br>');
    let attachmentHTML = '';
    if (message.attachment) {
      const file = message.attachment;
      const safeName = escapeHTML(file.name);
      if (file.type && file.type.startsWith('image/')) attachmentHTML = `<div class="message-attachment image-attachment"><a href="${file.data}" target="_blank" rel="noopener noreferrer"><img src="${file.data}" alt="${safeName}"></a><a class="attachment-download" href="${file.data}" download="${safeName}">Download ${safeName}</a></div>`;
      else attachmentHTML = `<div class="message-attachment document-attachment"><span class="document-icon">▤</span><span class="document-name">${safeName}<small>${(file.size / 1024).toFixed(0)} KB</small></span><a class="attachment-download" href="${file.data}" download="${safeName}">Download</a></div>`;
    }
    return `<div class="message ${mine ? 'mine' : ''}"><p>${escapeHTML(mine ? 'You' : sender?.name || 'Student')}</p>${message.text ? `<div class="message-bubble">${safeText}</div>` : ''}${attachmentHTML}<time>${escapeHTML(message.time)}</time></div>`;
  }).join('') : '<p class="muted">Choose a conversation from the left or create a new one.</p>';
  $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
  $('#chatInput').disabled = !chat;
  $('#chatFile').disabled = !chat;
  $('#chatForm').querySelector('button').disabled = !chat;
}
function renderCourseMaterials() {
  const user = currentUser();
  const host = $('#studentMaterialsList');
  if (!host || user.role !== 'Student') return;
  const items = data.courseMaterials.filter(item => item.group === user.group).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
  host.innerHTML = items.map(item => `<article class="announcement-card"><div class="announcement-card-top"><span class="announcement-category category-academic">${escapeHTML(item.group)}</span><small>${escapeHTML(item.date || '')}</small></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(courseName(item.courseId))} · Shared by ${escapeHTML(getUser(item.authorId)?.name || 'Faculty')}</p>${item.description ? `<p>${escapeHTML(item.description)}</p>` : ''}<p><strong>File:</strong> ${escapeHTML(item.fileName || 'No attachment')}</p>${item.fileData ? `<a class="button button-primary" href="${item.fileData}" download="${escapeHTML(item.fileName || 'course-material')}">Download material</a>` : '<span class="muted">The attachment is unavailable in this browser.</span>'}</article>`).join('') || '<article class="panel"><p class="muted">No course materials have been shared with your UG group yet.</p></article>';
}
function renderFacultyMaterials() {
  const user = currentUser();
  const host = $('#facultyMaterialsList');
  if (!host) return;
  const items = data.courseMaterials.filter(item => user.role === 'Admin' || item.authorId === user.id).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
  host.innerHTML = items.map(item => `<article class="announcement-card"><div class="announcement-card-top"><span class="announcement-category category-academic">${escapeHTML(item.group)}</span><small>${escapeHTML(item.date || '')}</small></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(courseName(item.courseId))} · For ${escapeHTML(item.group)}</p>${item.description ? `<p>${escapeHTML(item.description)}</p>` : ''}<p><strong>Attachment:</strong> ${escapeHTML(item.fileName || 'No file')}</p><div class="form-row"><button type="button" class="button button-outline" data-edit-material="${escapeHTML(item.id)}">Edit</button><button type="button" class="remove-btn" data-delete-material="${escapeHTML(item.id)}">Delete material</button></div></article>`).join('') || '<p class="muted">You have not shared any materials yet.</p>';
}

function renderFaculty() {
  const user = currentUser();
  renderTeachers();
  if ($('#gradeTrimester')) $('#gradeTrimester').value = data.registrationSettings.trimester;
  const students = data.users.filter(item => item.role === 'Student');
  const actualSchedules = getActualTeachingSchedules();
  const schedules = actualSchedules.filter(item => user.role === 'Admin' ? true : item.teacherId === user.id);
  $('#facultyStudentCount').textContent = students.length;
  $('#facultyCourseCount').textContent = data.courses.length;
  $('#facultyScheduleCount').textContent = schedules.length;
  $('#facultyScheduleBody').innerHTML = schedules.map((item, index) => `<tr><td>${escapeHTML(scheduleDaysLabel(item))}</td><td>Session ${sessionNumber(item, index)} · ${formatTime(item.start)} – ${formatTime(item.end)}</td><td>${escapeHTML(courseName(item.courseId))}<br><small>${escapeHTML(getCourse(item.courseId)?.code || '')}</small></td><td>${escapeHTML(item.room)}</td></tr>`).join('') || '<tr><td colspan="4">No classes assigned by Admin yet.</td></tr>';
  $('#gradeStudent').innerHTML = students.map(item => `<option value="${item.id}">${escapeHTML(item.name)} (${escapeHTML(item.group)})</option>`).join('');
  const visibleGrades = data.grades.filter(item => user.role === 'Admin' || item.enteredById === user.id || (!item.enteredById && getCourse(item.courseId)?.teacherId === user.id));
  $('#facultyStudentBody').innerHTML = visibleGrades.map(item => {
    const student = getUser(item.studentId); const result = gradeFor(item.obtained, item.total);
    return `<tr><td>${escapeHTML(student?.name || 'Unknown')}</td><td>${escapeHTML(student?.group || '')}</td><td>${escapeHTML(courseName(item.courseId))}</td><td>${item.obtained}/${item.total}</td><td>${result.percentage.toFixed(1)}%</td><td>${result.letter}</td></tr>`;
  }).join('') || '<tr><td colspan="6">No marks have been entered.</td></tr>';
  renderFacultyMaterials();
}

function renderStudentWorkflow() {
  const user = currentUser();
  const panel = $('#studentWorkflowPanel');
  const workspace = $('#registrationWorkspace');
  if (!panel || !workspace || user.role !== 'Student') return;
  const registration = getStudentRegistration();
  if (user.accountStatus !== 'approved') {
    panel.classList.remove('hidden'); workspace.classList.add('hidden');
    panel.innerHTML = `<div class="workflow-status pending"><strong>Account approval pending</strong>Your account has been submitted successfully. Please wait while an administrator reviews and approves it. You will be able to request your trimester after approval.</div>`;
    return;
  }
  if (user.trimesterStatus !== 'assigned' || !REGISTRATION_SECTIONS.includes(user.group)) {
    panel.classList.remove('hidden'); workspace.classList.add('hidden');
    panel.innerHTML = user.trimesterStatus === 'requested'
      ? `<div class="workflow-status pending"><strong>Trimester assignment requested</strong>Your request for an academic trimester has been sent to Admin. Class registration will become available after your trimester is assigned.</div>`
      : `<div class="workflow-status"><strong>Request your trimester assignment</strong>Your account is approved. Select the trimester/UG section that Admin should review. You cannot register for classes until Admin assigns it.<form id="trimesterRequestForm" class="workflow-actions"><label>Requested UG trimester<select id="requestedTrimester" required>${REGISTRATION_SECTIONS.map(group=>`<option value="${group}">${group}</option>`).join('')}</select></label><button class="button button-primary" type="submit">Send request</button></form></div>`;
    return;
  }
  panel.classList.add('hidden'); workspace.classList.remove('hidden');
  if (registration && registration.status !== 'approved') {
    $('#registrationConfirmation').innerHTML = `<div class="workflow-status pending"><strong>Registration submitted — awaiting Admin approval</strong>Your class choices have been received. Your confirmed class schedule will appear after Admin approval.</div>`;
  } else if (registration?.status === 'approved') {
    $('#registrationConfirmation').innerHTML = `<div class="workflow-status approved"><strong>Registration approved</strong>Your class registration has been approved by Admin.</div>`;
  }
}
function renderAdminWorkflowQueue() {
  const host = $('#adminWorkflowQueue'); if (!host) return;
  const accountQueue = data.users.filter(user=>user.role==='Student' && user.accountStatus!=='approved');
  const trimesterQueue = data.users.filter(user=>user.role==='Student' && user.accountStatus==='approved' && user.trimesterStatus==='requested');
  const registrationQueue = data.registrations.filter(item=>item.status!=='approved');
  const sectionOptions = REGISTRATION_SECTIONS.map(g=>`<option value="${g}">${g}</option>`).join('');
  host.innerHTML = `<h4>New account requests</h4>${accountQueue.map(user=>`<div class="workflow-queue-row"><div><strong>${escapeHTML(user.name)}</strong><small>${escapeHTML(user.email)} · Account approval requested</small></div><div class="workflow-queue-actions"><button class="button button-primary" data-approve-account="${user.id}">Approve account</button><button class="button button-outline danger-button" data-reject-account="${user.id}">Reject</button></div></div>`).join('')||'<p class="muted">No account approvals pending.</p>'}
  <h4>Trimester assignment requests</h4>${trimesterQueue.map(user=>`<div class="workflow-queue-row"><div><strong>${escapeHTML(user.name)}</strong><small>Requested: ${escapeHTML(user.requestedGroup||'Not specified')}</small></div><div class="workflow-queue-actions"><select aria-label="Assign trimester" data-assign-group="${user.id}">${sectionOptions}</select><button class="button button-primary" data-assign-trimester="${user.id}">Assign trimester</button></div></div>`).join('')||'<p class="muted">No trimester requests pending.</p>'}
  <h4>Class registrations awaiting approval</h4>${registrationQueue.map(item=>`<div class="workflow-queue-row"><div><strong>${escapeHTML(getUser(item.studentId)?.name||'Student')}</strong><small>${escapeHTML(item.trimester)} · ${escapeHTML(item.section)} · ${(item.subjectSelections||[]).length} subject(s)</small></div><button class="button button-primary" data-approve-registration="${item.id}">Approve registration</button></div>`).join('')||'<p class="muted">No class registrations awaiting approval.</p>'}`;
}
function renderAdminDeletionQueue() {
  const host = $('#adminDeletionQueue'); if (!host) return;
  const pending = data.accountDeletionRequests.filter(request => request.status === 'pending');
  host.innerHTML = pending.map(request => {
    const user = getUser(request.userId);
    return `<div class="workflow-queue-row"><div><strong>${escapeHTML(user?.name || 'Account holder')}</strong><small>${escapeHTML(user?.role || 'User')} · ${escapeHTML(user?.email || '')}<br>Requested ${escapeHTML(new Date(request.requestedAt).toLocaleString())}${request.reason ? `<br>Reason: ${escapeHTML(request.reason)}` : ''}</small></div><div class="workflow-queue-actions"><button class="button button-primary" data-approve-deletion="${request.id}">Approve &amp; deactivate</button><button class="button button-outline danger-button" data-reject-deletion="${request.id}">Decline</button></div></div>`;
  }).join('') || '<p class="muted">No account deletion requests pending.</p>';
}

function renderAdmin() {
  $('#adminUserCount').textContent = data.users.length;
  $('#adminCourseCount').textContent = data.courses.length;
  $('#adminBookingCount').textContent = data.registrations.length;
  $('#adminUserBody').innerHTML = data.users.map(user => `<tr><td>${escapeHTML(user.name)}</td><td>${escapeHTML(user.email)}</td><td>${escapeHTML(user.role)}</td><td>${escapeHTML(user.group)}</td><td>${presenceLabel(user.id)}</td><td>${user.id === 'a1' ? 'Protected' : `<button class="remove-btn" data-delete-user="${user.id}">Remove</button>`}</td></tr>`).join('');
  $('#adminCourseBody').innerHTML = data.courses.map(course => `<tr><td>${escapeHTML(course.code)}</td><td>${escapeHTML(course.name)}</td><td>${escapeHTML(getTeacher(course.teacherId)?.name || 'Unassigned')}</td><td><div class="course-edit-actions"><button class="text-button" data-edit-course="${course.id}">Edit</button><button class="remove-btn" data-delete-course="${course.id}">Remove</button></div></td></tr>`).join('');
  renderAdminAnnouncements();
  renderAdminHelpInbox();
  renderAdminWorkflowQueue();
  renderAdminDeletionQueue();
  renderAdminRegistrations();
  renderAdminSessionFaculty();
  renderAdminAcademicOversight();
}

function renderAdminAcademicOversight() {
  const assessmentHost = $('#adminAssessmentOverview');
  const gradesHost = $('#adminGradesOverview');
  const facultyHost = $('#adminFacultyOverview');
  const materialsHost = $('#adminMaterialsOverview');
  if (!assessmentHost || !gradesHost || !facultyHost || !materialsHost) return;
  const assessments = data.assessments || [];
  assessmentHost.innerHTML = `<table><thead><tr><th>Assessment</th><th>Course / Group</th><th>Created by</th><th>Submissions</th><th>Graded</th></tr></thead><tbody>${assessments.map(a => {
    const subs = a.submissions || [];
    return `<tr><td>${escapeHTML(a.title)}</td><td>${escapeHTML(courseName(a.courseId))} / ${escapeHTML(a.group)}</td><td>${escapeHTML(getUser(a.createdBy)?.name || 'Faculty')}</td><td>${subs.length}</td><td>${subs.filter(x => x.marks != null).length}</td></tr>`;
  }).join('') || '<tr><td colspan="5">No assessments created yet.</td></tr>'}</tbody></table>`;
  const gradeRows = (data.grades || []).map(g => {
    const result = gradeFor(g.obtained, g.total);
    return `<tr><td>${escapeHTML(getUser(g.studentId)?.name || 'Former student')}</td><td>${escapeHTML(courseName(g.courseId))}</td><td>${escapeHTML(g.trimester || '')}</td><td>${g.obtained}/${g.total}</td><td>${result.percentage.toFixed(1)}%</td><td>${result.letter}</td><td>${escapeHTML(getUser(g.enteredById)?.name || 'Faculty')}</td><td>${g.published === false ? '<span class="muted">Pending publication</span>' : '<span class="soft-tag">Published</span>'}</td></tr>`;
  });
  gradesHost.innerHTML = `<table><thead><tr><th>Student</th><th>Course</th><th>Trimester</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Entered by</th><th>Publication status</th></tr></thead><tbody>${gradeRows.join('') || '<tr><td colspan="8">No grades recorded.</td></tr>'}</tbody></table>`;
  const faculty = data.users.filter(u => u.role === 'Teacher' || u.role === 'Faculty');
  facultyHost.innerHTML = `<table><thead><tr><th>Faculty</th><th>Assigned courses</th><th>Assigned classes</th><th>Assessments</th><th>Grades entered</th></tr></thead><tbody>${faculty.map(f => {
    const courseIds = new Set(data.courses.filter(c => c.teacherId === f.id).map(c => c.id));
    data.schedules.filter(x => x.teacherId === f.id).forEach(x => courseIds.add(x.courseId));
    return `<tr><td>${escapeHTML(f.name)}</td><td>${[...courseIds].map(id => escapeHTML(courseName(id))).join(', ') || '—'}</td><td>${data.schedules.filter(x => x.teacherId === f.id).length}</td><td>${assessments.filter(a => a.createdBy === f.id).length}</td><td>${(data.grades || []).filter(g => g.enteredById === f.id).length}</td></tr>`;
  }).join('') || '<tr><td colspan="5">No faculty accounts found.</td></tr>'}</tbody></table>`;
  materialsHost.innerHTML = (data.courseMaterials || []).map(m => `<article class="announcement-card"><h4>${escapeHTML(m.title)}</h4><p>${escapeHTML(courseName(m.courseId))} · ${escapeHTML(m.group)} · Shared by ${escapeHTML(getUser(m.authorId)?.name || 'Faculty')}</p><p>${escapeHTML(m.fileName || 'No attachment')}</p>${m.fileData ? `<a href="${m.fileData}" download="${escapeHTML(m.fileName || 'course-material')}">View / download material</a>` : ''}</article>`).join('') || '<p class="muted">No faculty materials have been shared.</p>';
}

function getStudentRegistration() {
  return data.registrations.find(item => item.studentId === currentUser().id && item.trimester === data.registrationSettings.trimester);
}
function getCourseSessions(courseId, group) {
  return data.schedules.filter(item => item.courseId === courseId && item.group === group)
    .sort((a, b) => a.start.localeCompare(b.start));
}
function registrationSeatIsTaken(courseId, scheduleId, seat, group, excludeStudentId = '') {
  return data.registrations.some(reg => reg.trimester === data.registrationSettings.trimester && reg.section === group && reg.studentId !== excludeStudentId && (reg.subjectSelections || []).some(selection => selection.courseId === courseId && selection.scheduleId === scheduleId && Number(selection.seat) === Number(seat)));
}
function renderRegistration() {
  renderStudentWorkflow();
  const settings = data.registrationSettings;
  const tag = $('#registrationStatusTag');
  tag.textContent = settings.open ? 'Registration open' : 'Registration closed';
  tag.classList.toggle('danger-button', !settings.open);
  const sectionSelect = $('#registrationSection');
  const user = currentUser();
  if (user.role === 'Student' && (user.accountStatus !== 'approved' || user.trimesterStatus !== 'assigned' || !REGISTRATION_SECTIONS.includes(user.group))) return;
  if (sectionSelect && REGISTRATION_SECTIONS.includes(user.group)) sectionSelect.value = user.group;
  const current = getStudentRegistration();
  if (sectionSelect) sectionSelect.disabled = Boolean(current) || REGISTRATION_SECTIONS.includes(user.group);
  $('#registrationTrimesterLabel').textContent = `${settings.trimester} · ${settings.capacity} seats per class session`;

  const host = $('#registrationSubjects');
  if (!host) return;
  const group = sectionSelect?.value || user.group;
  const readOnly = Boolean(current) && !settings.open;
  host.innerHTML = data.courses.map(course => {
    const sessions = getCourseSessions(course.id, group);
    const existing = current?.subjectSelections?.find(item => item.courseId === course.id);
    if (!selectedRegistrationSessions[course.id] && sessions.length) selectedRegistrationSessions[course.id] = existing?.scheduleId || sessions[0].id;
    const selectedScheduleId = (current && settings.open ? selectedRegistrationSessions[course.id] : '') || existing?.scheduleId || selectedRegistrationSessions[course.id] || '';
    const chosenSession = sessions.find(item => item.id === selectedScheduleId) || sessions[0];
    if (chosenSession && !selectedRegistrationSessions[course.id]) selectedRegistrationSessions[course.id] = chosenSession.id;
    const seatChoice = (current && settings.open ? selectedRegistrationSeats[course.id] : 0) || existing?.seat || selectedRegistrationSeats[course.id] || 0;
    const teacher = getTeacher(course.teacherId);
    const filterValue = registrationSessionFilters[course.id] || 'all';
    const filteredSessions = filterValue === 'all' ? sessions : sessions.filter((session, index) => String(sessionNumber(session, index)) === filterValue);
    const filterOptions = `<option value="all">All sessions</option>` + sessions.map((session, index) => `<option value="${sessionNumber(session, index)}" ${filterValue === String(sessionNumber(session, index)) ? 'selected' : ''}>Session ${sessionNumber(session, index)} · SMTW · ${formatTime(session.start)}–${formatTime(session.end)} · ${escapeHTML(session.room)} · ${escapeHTML(course.code)}</option>`).join('');
    const sessionOptions = filteredSessions.map((session) => { const originalIndex = sessions.findIndex(item => item.id === session.id); const faculty = settings.open ? 'To be assigned by Admin' : (getTeacher(session.teacherId)?.name || 'To be assigned by Admin'); const detail = `Session ${sessionNumber(session, originalIndex)}`; return `<label class="slot-option"><input type="radio" name="session_${escapeHTML(course.id)}" value="${escapeHTML(session.id)}" data-registration-session="${escapeHTML(course.id)}" ${session.id === selectedScheduleId ? 'checked' : ''} ${readOnly || !settings.open ? 'disabled' : ''}><span><strong>${detail}</strong><small>Days: SMTW · Time: ${formatTime(session.start)}–${formatTime(session.end)}</small><small>Room: ${escapeHTML(session.room)} · Faculty: ${escapeHTML(faculty)}</small><small>Class code: ${escapeHTML(course.code)}</small></span></label>`; }).join('');
    let seatGrid = '<p class="muted">No class session has been assigned to this subject and section yet. Please contact the campus support team.</p>';
    if (chosenSession) {
      const seats = Array.from({length: settings.capacity}, (_, index) => index + 1).map(seat => {
        const occupied = registrationSeatIsTaken(course.id, chosenSession.id, seat, group, user.id);
        const selected = Number(seatChoice) === seat;
        return `<button type="button" class="seat ${occupied ? 'booked' : ''} ${selected ? 'selected' : ''}" data-registration-seat="${seat}" data-course-id="${escapeHTML(course.id)}" ${occupied || readOnly || !settings.open ? 'disabled' : ''}>${String(seat).padStart(2,'0')}</button>`;
      }).join('');
      const occupiedCount = Array.from({length: settings.capacity}, (_, index) => index + 1).filter(seat => registrationSeatIsTaken(course.id, chosenSession.id, seat, group, user.id)).length;
      seatGrid = `<div class="seat-picker"><div class="seat-picker-heading"><strong>Choose one seat · ${escapeHTML(chosenSession.room)}</strong><span>${settings.capacity - occupiedCount} available · ${occupiedCount}/${settings.capacity} occupied</span></div><div class="seat-legend"><span><i class="legend-dot available"></i> Available</span><span><i class="legend-dot selected"></i> Selected</span><span><i class="legend-dot occupied"></i> Occupied</span></div><div class="seat-grid">${seats}</div></div>`;
    }
    return `<article class="facility-card registration-subject-card"><div class="panel-heading"><div><h3>${escapeHTML(course.name)}</h3><p>${escapeHTML(course.code)} · Faculty: ${escapeHTML(settings.open ? 'To be assigned by Admin' : (teacher?.name || 'To be assigned by Admin'))}</p></div><span class="soft-tag">${existing ? `Seat ${String(existing.seat).padStart(2,'0')} confirmed` : (readOnly ? 'Not selected' : 'One seat required')}</span></div>${sessions.length ? `<div class="session-choice-group"><p class="field-label">Filter class sessions</p><label class="session-dropdown-label">Choose one class session<select class="registration-session-filter" data-registration-session="${escapeHTML(course.id)}" ${readOnly || !settings.open ? 'disabled' : ''}>${sessions.map((session,index)=>`<option value="${escapeHTML(session.id)}" ${session.id===selectedScheduleId?'selected':''}>Session ${sessionNumber(session,index)} · SMTW · ${formatTime(session.start)}–${formatTime(session.end)} · ${escapeHTML(session.room)}</option>`).join('')}</select></label><p class="fine-print">Select one session from the dropdown, then choose an available seat below.</p></div>` : ''}${seatGrid}</article>`;
  }).join('') || '<p class="muted">No subjects have been added by Admin yet.</p>';

  if (current) {
    const approved = current.status === 'approved';
    const rows = (current.subjectSelections || []).map(selection => {
      const course = getCourse(selection.courseId);
      const session = data.schedules.find(item => item.id === selection.scheduleId);
      return `<tr><td><strong>${escapeHTML(course?.name || 'Subject')}</strong><br><small>${escapeHTML(course?.code || '')}</small></td><td>${session ? escapeHTML(sessionDisplay(session)) : 'Details unavailable'}</td><td>${String(selection.seat).padStart(2,'0')}</td></tr>`;
    }).join('');
    $('#registrationConfirmation').innerHTML = `<div class="confirmation-status ${approved ? 'approved' : ''}"><span class="status-icon">${approved ? '✓' : '!'}</span><div><strong>${approved ? 'Registration approved' : 'Waiting for Admin approval'}</strong><p>${approved ? 'Your registration is confirmed. Your class schedule is now available.' : 'Your registration has been submitted. Your confirmed class schedule will appear after Admin approval.'}</p></div></div><div class="confirmation-meta"><div><small>Trimester</small><strong>${escapeHTML(current.trimester)}</strong></div><div><small>UG section</small><strong>${escapeHTML(current.section)}</strong></div><div><small>Submitted</small><strong>${escapeHTML((current.submittedAt || current.createdAt) ? new Date(current.submittedAt || current.createdAt).toLocaleString() : 'Saved')}</strong></div><div><small>Status</small><strong>${approved ? 'Approved' : 'Pending review'}</strong></div></div><h4>Selected classes</h4><div class="confirmation-table-wrap"><table class="confirmation-table"><thead><tr><th>Subject</th><th>Session / time / room</th><th>Seat</th></tr></thead><tbody>${rows || '<tr><td colspan="3">No subject-by-subject details were saved for this older registration.</td></tr>'}</tbody></table></div><small class="confirmation-footnote">Registration details are saved in this browser.</small>`;
  } else {
    $('#registrationConfirmation').textContent = settings.open ? 'Choose one session and one available seat for every listed subject, then confirm your registration.' : 'Registration is currently closed. Please contact the campus support team.';
  }
  const submit = $('#registrationForm button[type="submit"]');
  submit.disabled = !settings.open || user.role !== 'Student' || !data.courses.length;
  submit.textContent = current ? 'Resubmit registration for approval' : 'Submit registration for approval';
  const cancelButton = $('#cancelClassRegistration');
  if (cancelButton) { cancelButton.classList.toggle('hidden', !current || !settings.open); cancelButton.disabled = !current || !settings.open; }
}
function renderAdminSessionFaculty() {
  const facultySelect = $('#adminScheduleFaculty');
  if (facultySelect) { const selected = facultySelect.value; facultySelect.innerHTML = `<option value="">Faculty not assigned yet</option>${data.users.filter(user => user.role === 'Teacher').map(person => `<option value="${escapeHTML(person.id)}">${escapeHTML(person.name)}</option>`).join('')}`; if (selected) facultySelect.value = selected; }
  const body = $('#adminSessionFacultyBody');
  if (!body) return;
  const courseFilter = $('#adminSessionCourseFilter');
  const groupFilter = $('#adminSessionGroupFilter');
  if (courseFilter && !courseFilter.dataset.ready) {
    courseFilter.innerHTML = `<option value="">Choose subject…</option>${data.courses.map(course => `<option value="${escapeHTML(course.id)}">${escapeHTML(course.code)} · ${escapeHTML(course.name)}</option>`).join('')}`;
    courseFilter.dataset.ready = '1';
  }
  if (groupFilter && !groupFilter.dataset.ready) {
    groupFilter.innerHTML = `<option value="">Choose UG section…</option>${REGISTRATION_SECTIONS.map(group => `<option value="${group}">${group}</option>`).join('')}`;
    groupFilter.dataset.ready = '1';
  }
  const selectedCourse = courseFilter?.value || '';
  const selectedGroup = groupFilter?.value || '';
  if (!selectedCourse || !selectedGroup) {
    body.innerHTML = '<tr><td colspan="6">Choose a subject and UG section above to view and assign its six sessions.</td></tr>';
    return;
  }
  const faculty = data.users.filter(user => user.role === 'Teacher');
  const options = selected => `<option value="">Not assigned</option>${faculty.map(person => `<option value="${escapeHTML(person.id)}" ${person.id === selected ? 'selected' : ''}>${escapeHTML(person.name)}</option>`).join('')}`;
  const rows = data.schedules.filter(item => item.courseId === selectedCourse && item.group === selectedGroup).sort((a,b) => a.start.localeCompare(b.start));
  body.innerHTML = rows.map(item => {
    const course = getCourse(item.courseId);
    return `<tr><td>${escapeHTML(course?.name || 'Subject')} (${escapeHTML(course?.code || '')})</td><td>${escapeHTML(item.group)}</td><td>Session ${sessionNumber(item)} · ${formatTime(item.start)}–${formatTime(item.end)}</td><td>${escapeHTML(item.room)}</td><td><select data-session-faculty="${escapeHTML(item.id)}">${options(item.teacherId || '')}</select></td><td><button type="button" class="button button-small button-primary" data-save-session-faculty="${escapeHTML(item.id)}">Save</button></td></tr>`;
  }).join('') || '<tr><td colspan="6">No sessions are available for this subject and section.</td></tr>';
}

function renderAdminRegistrations() {
  const settings = data.registrationSettings;
  const status = $('#adminRegistrationStatus');
  if (status) status.textContent = settings.open ? 'Registration is OPEN' : 'Registration is CLOSED';
  const openButton = $('#openStudentRegistration');
  const closeButton = $('#closeStudentRegistration');
  if (openButton) openButton.disabled = Boolean(settings.open);
  if (closeButton) closeButton.disabled = !settings.open;
  if ($('#adminTrimester')) $('#adminTrimester').value = settings.trimester;
  if ($('#adminCapacity')) $('#adminCapacity').value = settings.capacity;
  if ($('#adminRegistrationBody')) {
    $('#adminRegistrationBody').innerHTML = data.registrations.map(item => {
      const choices = (item.subjectSelections || []).map(selection => {
        const course = getCourse(selection.courseId);
        const session = data.schedules.find(row => row.id === selection.scheduleId);
        return `${escapeHTML(course?.name || 'Subject')}: ${session ? `${escapeHTML(scheduleDaysLabel(session))} ${formatTime(session.start)}–${formatTime(session.end)} · ${escapeHTML(session.room)}` : 'Session unavailable'}, Seat ${String(selection.seat).padStart(2,'0')}`;
      }).join('<br>') || 'Legacy registration';
      return `<tr><td>${escapeHTML(getUser(item.studentId)?.name || 'Former student')}</td><td>${escapeHTML(item.trimester)}</td><td>${escapeHTML(item.section)}</td><td>${choices}</td></tr>`;
    }).join('') || '<tr><td colspan="4">No registrations yet.</td></tr>';
  }
}

function renderAssessments() {
  const user = currentUser();
  const createPanel = $('#assessmentCreatePanel');
  const reviewPanel = $('#assessmentReviewPanel');
  const form = $('#assessmentCreateForm');
  if (!createPanel || !reviewPanel || !form) return;
  createPanel.classList.toggle('hidden', user.role !== 'Teacher');
  reviewPanel.classList.toggle('hidden', user.role !== 'Teacher');

  const relevant = (data.assessments || []).filter(a => user.role === 'Student'
    ? studentMatchesAssessmentGroup(user, a)
    : a.createdBy === user.id);
  $('#assessmentList').innerHTML = relevant.map(a => {
    const course = getCourse(a.courseId);
    const submission = a.submissions?.find(x => x.studentId === user.id);
    const deadlineDate = a.deadline ? new Date(a.deadline) : null;
    const isClosed = deadlineDate && Date.now() > deadlineDate.getTime();
    const status = submission
      ? (submission.marks != null ? `Reviewed · ${submission.marks}/${a.total}` : 'Submitted · awaiting review')
      : (isClosed ? 'Deadline passed · submission closed' : 'Not submitted');
    const attachment = a.attachmentData
      ? `<p class="assessment-attachment"><b>Attachment:</b> <a href="${a.attachmentData}" download="${escapeHTML(a.attachmentName || 'assessment-file')}">${escapeHTML(a.attachmentName || 'Download attachment')}</a></p>`
      : '';
    const studentActions = user.role === 'Student' && !submission && !isClosed
      ? `<button class="button button-primary" type="button" data-submit-assessment="${escapeHTML(a.id)}">Submit work</button>` : '';
    const facultyActions = user.role === 'Teacher'
      ? `<div class="assessment-actions"><button class="button button-outline" type="button" data-edit-assessment="${escapeHTML(a.id)}">Edit</button><button class="button button-outline" type="button" data-delete-assessment="${escapeHTML(a.id)}">Delete</button></div>` : '';
    return `<article class="announcement-card"><h3>${escapeHTML(a.title)}</h3><p>${escapeHTML(course?.name || 'Course')} · ${escapeHTML(a.group)} · ${escapeHTML(a.type || 'Assessment')}</p><p><b>Category:</b> ${escapeHTML(a.category || 'Other')} · <b>Total:</b> ${Number(a.total)} marks</p><p><b>Deadline:</b> ${escapeHTML(deadlineDate ? deadlineDate.toLocaleString() : 'No deadline')}</p><p>${escapeHTML(a.instructions || '')}</p>${attachment}<p><b>${user.role === 'Student' ? 'Your status:' : 'Submissions:'}</b> ${user.role === 'Student' ? escapeHTML(status) : `${(a.submissions || []).length} student submission(s)`}</p>${submission?.feedback ? `<p><b>Faculty feedback:</b> ${escapeHTML(submission.feedback)}</p>` : ''}${studentActions}${facultyActions}</article>`;
  }).join('') || `<p class="muted">${user.role === 'Student' ? 'No assessments are currently assigned to your group.' : 'You have not created any assessments yet.'}</p>`;

  if (user.role === 'Teacher') {
    const rows = [];
    relevant.forEach(a => (a.submissions || []).forEach(sub => rows.push(`<tr><td>${escapeHTML(getUser(sub.studentId)?.name || 'Former student')}</td><td>${escapeHTML(a.title)}</td><td>${escapeHTML(a.group)}</td><td>${sub.fileName ? (sub.fileData ? `<a href="${sub.fileData}" download="${escapeHTML(sub.fileName)}">${escapeHTML(sub.fileName)}</a>` : escapeHTML(sub.fileName)) : 'Text response'}${sub.answer ? `<details><summary>View answer</summary><p>${escapeHTML(sub.answer)}</p></details>` : ''}<small class="muted">Submitted: ${escapeHTML(new Date(sub.submittedAt).toLocaleString())}</small></td><td>${sub.marks == null ? 'Pending' : `${sub.marks}/${a.total}`}</td><td><button class="text-button" type="button" data-grade-submission="${escapeHTML(a.id)}|${escapeHTML(sub.studentId)}">Grade / feedback</button></td></tr>`)));
    $('#assessmentSubmissions').innerHTML = `<table><thead><tr><th>Student</th><th>Assessment</th><th>Group</th><th>Work</th><th>Marks</th><th>Action</th></tr></thead><tbody>${rows.join('') || '<tr><td colspan="6">No student submissions yet.</td></tr>'}</tbody></table>`;
  }
}


function localDateISO(date = new Date()) { const d=new Date(date.getTime()-date.getTimezoneOffset()*60000); return d.toISOString().slice(0,10); }
function timeToMinutes(value) { const [h,m]=value.split(':').map(Number); return h*60+m; }
function minutesToTime(value) { return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`; }
function facultyMembers() { return data.users.filter(u => u.role === 'Teacher'); }
function availableSlots(facultyId, date) {
  const taken=data.appointments.filter(a=>a.facultyId===facultyId && a.date===date && !['Declined','Cancelled'].includes(a.status)).map(a=>a.time);
  return data.officeHours.filter(s=>s.facultyId===facultyId && s.date===date && !s.bookedBy && !taken.includes(s.time)).sort((a,b)=>a.time.localeCompare(b.time));
}
function renderAppointments() {
  const user=currentUser();
  const directory=$('#facultyDirectoryContent'), booking=$('#studentBookingContent'), mine=$('#studentAppointmentsContent'), hours=$('#facultyOfficeHoursContent'), requests=$('#facultyRequestsContent');
  if (directory) directory.innerHTML=facultyMembers().map(f=>`<div class="list-row"><div><strong>${escapeHTML(f.name)}</strong><p class="muted">${escapeHTML(f.email)}</p></div><button class="button button-outline" data-book-faculty="${f.id}">View available slots</button></div>`).join('') || '<p class="muted">No faculty profiles are available.</p>';
  if (booking) {
    const chosen=$('#bookingFaculty')?.value || facultyMembers()[0]?.id || '';
    const date=$('#bookingDate')?.value || localDateISO();
    const slots=availableSlots(chosen,date);
    booking.innerHTML=`<form id="studentAppointmentForm" class="form-stack"><label>Faculty member<select id="bookingFaculty" required>${facultyMembers().map(f=>`<option value="${f.id}" ${f.id===chosen?'selected':''}>${escapeHTML(f.name)}</option>`).join('')}</select></label><label>Date<input type="date" id="bookingDate" min="${localDateISO()}" value="${date}" required></label><label>Available 15-minute time slot<select id="bookingTime" required><option value="">Choose an available time</option>${slots.map(s=>`<option value="${s.time}">${formatTime(s.time)}</option>`).join('')}</select></label><label>Reason for appointment<textarea id="bookingReason" minlength="8" maxlength="500" required placeholder="Briefly explain what academic support you need"></textarea></label><button class="button button-primary" type="submit" ${slots.length?'':'disabled'}>Send booking request</button><small class="muted">Each appointment is 15 minutes. A request remains Pending until the faculty member responds. One student can request a particular slot only once.</small></form>${slots.length?'':'<p class="muted">No available slots for this faculty member on this date. Try another date or faculty member.</p>'}`;
  }
  if (mine) { const rows=data.appointments.filter(a=>a.studentId===user.id).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)); mine.innerHTML=rows.map(a=>`<div class="list-row"><div><strong>${escapeHTML(getUser(a.facultyId)?.name||'Faculty')}</strong><p>${escapeHTML(a.date)} · ${formatTime(a.time)} · 15 minutes</p><p class="muted">${escapeHTML(a.reason)} · <b>${escapeHTML(a.status)}</b>${a.facultyNote?' · '+escapeHTML(a.facultyNote):''}</p></div><div>${['Pending','Approved'].includes(a.status)?`<button class="button button-outline" data-cancel-appointment="${a.id}">Cancel</button><button class="button button-outline" data-reschedule-appointment="${a.id}">Request reschedule</button>`:''}</div></div>`).join('') || '<p class="muted">You have not requested any appointments yet.</p>'; }
  if (hours && user.role==='Teacher') { const own=data.officeHours.filter(s=>s.facultyId===user.id).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)); hours.innerHTML=`<form id="officeHourForm" class="form-stack"><label>Date<input type="date" id="officeDate" min="${localDateISO()}" required></label><div><strong>Select appointment times</strong><p class="muted">Add as many separate 15-minute slots as you want for this date. Each time is the start of one appointment.</p><div id="officeSlotInputs" class="form-stack"><div class="form-row office-slot-row"><label>Time slot 1<input type="time" class="office-slot-time" value="09:00" required></label></div></div><button class="button button-outline" id="addOfficeSlot" type="button">+ Add another time slot</button></div><button class="button button-primary" type="submit">Publish selected time slots</button><small class="muted">Times must start on a 15-minute boundary (for example, 09:00, 09:15 or 10:30). Existing slots are not duplicated.</small></form><h4>Your published availability</h4>${own.map(s=>`<div class="list-row"><div><strong>${s.date} · ${formatTime(s.time)}</strong><p class="muted">${s.bookedBy?'Requested / booked':'Available'}</p></div>${!s.bookedBy?`<button class="button button-outline" data-delete-office-slot="${s.id}">Remove</button>`:''}</div>`).join('')||'<p class="muted">You have not published any slots.</p>'}`; }
  if (requests && user.role==='Teacher') { const rows=data.appointments.filter(a=>a.facultyId===user.id).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)); requests.innerHTML=rows.map(a=>`<div class="list-row"><div><strong>${escapeHTML(getUser(a.studentId)?.name||'Student')}</strong><p>${a.date} · ${formatTime(a.time)} · 15 minutes</p><p class="muted">${escapeHTML(a.reason)} · <b>${escapeHTML(a.status)}</b>${a.rescheduleRequest?' · Student requested rescheduling':''}</p></div><div>${a.status==='Pending'?`<button class="button button-primary" data-appointment-action="Approved" data-appointment-id="${a.id}">Approve</button><button class="button button-outline" data-appointment-action="Declined" data-appointment-id="${a.id}">Decline</button>`:''}${a.status==='Approved'?`<button class="button button-outline" data-appointment-action="Completed" data-appointment-id="${a.id}">Mark completed</button><button class="button button-outline" data-appointment-action="Cancelled" data-appointment-id="${a.id}">Cancel</button>`:''}</div></div>`).join('')||'<p class="muted">No appointment requests yet.</p>'; }
}

function renderCurrentView(view) {
  if (view === 'notifications') renderNotifications();
  if (view === 'overview') renderOverview();
  if (view === 'profile') renderIdentity();
  if (view === 'schedule') renderSchedule();
  if (view === 'assessment') renderAssessments();
    if (view === 'registration') renderRegistration();
  if (view === 'materials') renderCourseMaterials();
  if (view === 'grades') renderGrades();
  if (view === 'cgpa') renderAcademicHistory();
  if (view === 'tasks' || view === 'faculty-tasks') renderStudyTasks();
  if (view === 'student-messenger' && currentUser().role === 'Student') renderConversations();
  if (view === 'faculty-materials' && currentUser().role === 'Teacher') { renderFacultyMaterials(); renderTeachers(); }
  
  if (view === 'faculty') renderFaculty();
  if (view === 'admin') renderAdmin();
}

function renderStudyTasks() {
  const user = currentUser();
  const studentHost = $('#studentTasksList');
  if (studentHost) {
    if (user.role !== 'Student') { studentHost.innerHTML = ''; }
    else {
      const tasks = data.studyTasks.filter(task => task.group === user.group).sort((a,b) => String(a.deadline).localeCompare(String(b.deadline)));
      studentHost.innerHTML = tasks.length ? tasks.map(task => {
        const submission = (task.submissions || []).find(item => item.studentId === user.id);
        const overdue = !submission && new Date(task.deadline).getTime() < Date.now();
        return `<article class="task-card panel"><div class="panel-heading"><div><p class="eyebrow">${escapeHTML(task.type)} · ${escapeHTML(courseName(task.courseId))}</p><h3>${escapeHTML(task.title)}</h3></div><span class="soft-tag">${submission ? 'Submitted' : overdue ? 'Overdue' : 'Not submitted'}</span></div><p>${escapeHTML(task.instructions).replace(/\n/g,'<br>')}</p><p class="muted">Due: ${escapeHTML(new Date(task.deadline).toLocaleString())} · Assigned by ${escapeHTML(getUser(task.authorId)?.name || 'Faculty')}</p>${task.fileData ? `<p><a class="text-link" href="${task.fileData}" download="${escapeHTML(task.fileName || 'task-instructions')}">Download ${escapeHTML(task.fileName || 'attached instructions')}</a></p>` : ''}${submission ? `<div class="notice"><strong>Your submission:</strong> ${escapeHTML(submission.text || 'File submitted')}${submission.fileName ? ` · ${escapeHTML(submission.fileName)}` : ''}<br><strong>Submitted:</strong> ${escapeHTML(new Date(submission.submittedAt).toLocaleString())}${submission.feedback ? `<br><strong>Faculty feedback:</strong> ${escapeHTML(submission.feedback)}` : '<br><span class="muted">Feedback not yet provided.</span>'}</div>` : `<form class="form-stack task-submit-form" data-task-submit="${escapeHTML(task.id)}"><label>Your answer / submission notes<textarea name="submissionText" rows="3" maxlength="3000" placeholder="Write your response or describe your attached work"></textarea></label><label>Attach your work (optional)<input name="submissionFile" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png"/></label><button class="button button-primary" type="submit" ${overdue?'disabled':''}>Submit task</button></form>`}</article>`;
      }).join('') : '<p class="muted">No study tasks have been assigned to your group yet.</p>';
    }
  }
  const facultyHost = $('#facultyStudyTasksList');
  if (facultyHost) {
    if (user.role !== 'Teacher') { facultyHost.innerHTML = ''; return; }
    const tasks = data.studyTasks.filter(task => task.authorId === user.id).sort((a,b) => b.createdAt-a.createdAt);
    facultyHost.innerHTML = tasks.length ? tasks.map(task => `<article class="task-card panel"><div class="panel-heading"><div><p class="eyebrow">${escapeHTML(task.type)} · ${escapeHTML(courseName(task.courseId))} · ${escapeHTML(task.group)}</p><h3>${escapeHTML(task.title)}</h3></div><button class="button button-outline" type="button" data-delete-study-task="${escapeHTML(task.id)}">Delete</button></div><p>${escapeHTML(task.instructions)}</p><p class="muted">Deadline: ${escapeHTML(new Date(task.deadline).toLocaleString())} · ${task.submissions?.length || 0} submission(s)</p>${(task.submissions || []).length ? task.submissions.map(sub => `<div class="task-submission"><strong>${escapeHTML(getUser(sub.studentId)?.name || 'Student')}</strong><p>${escapeHTML(sub.text || 'File submitted')}</p>${sub.fileData ? `<a class="text-link" href="${sub.fileData}" download="${escapeHTML(sub.fileName || 'student-work')}">Download ${escapeHTML(sub.fileName || 'submission')}</a>` : ''}<p class="muted">Submitted ${escapeHTML(new Date(sub.submittedAt).toLocaleString())}</p><form class="task-feedback-form" data-task-feedback="${escapeHTML(task.id)}" data-student-feedback="${escapeHTML(sub.studentId)}"><label>Feedback<textarea name="feedback" rows="2" maxlength="1500" required>${escapeHTML(sub.feedback || '')}</textarea></label><button class="button button-outline" type="submit">Save feedback</button></form></div>`).join('') : '<p class="muted">No student submissions yet.</p>'}</article>`).join('') : '<p class="muted">You have not published any study tasks yet.</p>';
    const courseSelect = $('#taskCourse');
    if (courseSelect) {
      const assignedIds = new Set([...data.courses.filter(course => course.teacherId === user.id).map(course => course.id), ...data.schedules.filter(item => item.teacherId === user.id).map(item => item.courseId)]);
      const owned = assignedIds.size ? data.courses.filter(course => assignedIds.has(course.id)) : data.courses;
      courseSelect.innerHTML = owned.map(course => `<option value="${escapeHTML(course.id)}">${escapeHTML(course.code)} · ${escapeHTML(course.name)}</option>`).join('');
      if (!owned.length) courseSelect.innerHTML = '<option value="">No courses assigned to your account</option>';
    }
  }
}
function publishStudyTask(form) {
  const user=currentUser(); if(user.role!=='Teacher')return showToast('Only faculty can publish study tasks.');
  const title=$('#taskTitle').value.trim(), courseId=$('#taskCourse').value, group=$('#taskGroup').value, type=$('#taskType').value, instructions=$('#taskInstructions').value.trim(), deadline=$('#taskDeadline').value, file=$('#taskAttachment').files[0];
  const assignedIds = new Set([...data.courses.filter(course => course.teacherId === user.id).map(course => course.id), ...data.schedules.filter(item => item.teacherId === user.id).map(item => item.courseId)]);
  if(!title||!courseId||!instructions||!deadline)return showToast('Complete the task title, course, instructions and deadline.');
  if (assignedIds.size && !assignedIds.has(courseId)) return showToast('You can only assign tasks for a course assigned to you.');
  if(new Date(deadline).getTime()<=Date.now())return showToast('Choose a future deadline.');
  if(file&&file.size>700*1024)return showToast('Please choose a task attachment smaller than 700 KB.');
  const saveTask=fileData=>{
    const task={id:`task${Date.now()}`,title,type,courseId,group,instructions,deadline,fileName:file?.name||'',fileData:fileData||'',authorId:user.id,createdAt:Date.now(),submissions:[]};
    data.studyTasks.unshift(task);
    data.users.filter(student=>student.role==='Student'&&student.group===group).forEach(student=>addNotification(student.id,'New study task assigned',`${title} · ${courseName(courseId)}. Deadline: ${new Date(deadline).toLocaleString()}.`,'tasks',task.id));
    addNotification(user.id,'Study task published',`${title} was assigned to ${group}.`,'tasks',task.id);
    saveData();form.reset();renderStudyTasks();showToast('Study task published and students notified.');
  };
  if(!file)return saveTask('');
  const reader=new FileReader();reader.onload=()=>saveTask(String(reader.result||''));reader.onerror=()=>showToast('The selected attachment could not be read.');reader.readAsDataURL(file);
}


// Local FAQ assistant. This is a searchable FAQ helper, not a live generative AI service.
const auwFaqEntries = [
  // ACCOUNT ACCESS AND SECURITY
  {keys:['login','sign in','log in','username','cannot log in','cant log in'],answer:'SIGNING IN\n1. Open the AUW Connect sign-in window.\n2. Enter your username or AUW email address.\n3. Enter your password.\n4. Select the correct account type (Student or Faculty).\n5. Select Log in.\nIf sign-in fails, check spelling, keyboard Caps Lock, password and account type. If the account is not recognized or is not confirmed, contact the AUW Connect support team. This FAQ cannot inspect or unlock accounts.'},
  {keys:['password','reset','forgot password','change password','password not working'],answer:'PASSWORD HELP\nIf you know your current password, use the account password-management process provided by your institution. If you forgot it, request a password reset through the institution’s approved process or AUW Connect support team. The current front-end FAQ cannot reset passwords itself. Never send your password, verification link or sign-in code in this chat.'},
  {keys:['signup','sign up','create account','new account','register account'],answer:'CREATING AN ACCOUNT\n1. Open the sign-in window and choose Create account.\n2. Enter your full name.\n3. Enter your AUW academic email address.\n4. Create a username (3–24 characters; letters, numbers, dots, underscores and hyphens are accepted by the form).\n5. Create a password that meets the form’s minimum length.\n6. Choose Student or Faculty and complete the fields shown for that account type.\n7. Submit Create my account.\nUse an authorized AUW email ending in @auw.edu.bd. Faculty account creation or access may be controlled by the institution.'},
  {keys:['email','auw email','academic email','email not confirmed','confirmation email','verification link'],answer:'AUW EMAIL AND EMAIL CONFIRMATION\nUse your AUW academic email ending in @auw.edu.bd when creating an account. Check the address for spelling errors and check your inbox, spam and junk folders for a confirmation message. If the confirmation link has expired or the website says Email not confirmed, request a fresh confirmation through the institution’s account process. Do not share the link or verification code.'},
  {keys:['logout','log out','sign out','signout'],answer:'SIGNING OUT\nUse the Sign out option in the portal navigation/account area when you finish. If you are using a shared computer, sign out and close the browser window. Do not rely only on closing the tab.'},
  {keys:['account type','student or faculty','wrong role','wrong dashboard'],answer:'CHOOSING THE CORRECT ACCOUNT TYPE\nThe sign-in form asks you to select Student or Faculty. Choose the role assigned to your account. If you select the wrong role, the portal may not open the expected dashboard. If the correct role still does not work, contact the AUW Connect support team.'},
  {keys:['username change','change username','edit username'],answer:'USERNAME\nThe sign-up form lets a new user choose a username. The sign-in form accepts either a username or AUW email. If your username is incorrect or you need it changed, use the editable profile fields if available; otherwise contact the AUW Connect support team. Do not create a duplicate account to work around a username problem.'},
  // STUDENT PROFILE AND PORTAL NAVIGATION
  {keys:['profile','my profile','edit profile','personal information'],answer:'STUDENT PROFILE\nOpen My Profile from the student portal. Review the information displayed and edit only the fields that the page allows you to change. Save your changes if a Save button is provided. Academic details such as assigned trimester or UG section may be institution-controlled and should be corrected by the authorized office rather than changed by the student.'},
  {keys:['photo','profile picture','profile photo','upload picture','remove picture'],answer:'PROFILE PICTURE\nOpen My Profile, use the profile-photo control to choose an image, and follow the page’s save/update action. If the image does not appear, check the file type and size, wait for the upload to finish, then refresh the page. If it still does not save, note the error and contact portal support. Do not upload another person’s image without permission.'},
  {keys:['dashboard','home page','overview','navigation','where can i find'],answer:'FINDING FEATURES\nUse the navigation menu to open the relevant portal section. Students commonly use Overview, Profile, Class Schedule, Registration/Seat Booking (when enabled), Assessments, Grades & Results, CGPA & Academic History, Study Tasks, Learning Materials, Office-hour Booking, My Appointments and Notifications. Faculty use their faculty workspace for assigned courses, assessments, grades, study tasks, materials and office hours. Available sections depend on your account role.'},
  {keys:['dark mode','theme','light mode','appearance'],answer:'LIGHT AND DARK MODE\nUse the theme control in the portal header/navigation to switch between light and dark appearance. If the page does not change, try the control again or refresh the portal. Your browser may also affect how the page initially appears.'},
  {keys:['notification','notifications','alert','reminder'],answer:'NOTIFICATIONS\nOpen Notifications in the portal to review updates generated by portal activity, such as appointment updates, assessment or task information and other account notices. Open the related section to see more details. If you expect a notification but cannot find it, refresh the page and check the relevant section directly.'},
  // STUDENT ACADEMIC PROFILE, TRIMESTER AND CLASS SCHEDULE
  {keys:['trimester','semester','assigned trimester','current trimester'],answer:'TRIMESTER ASSIGNMENT\nYour trimester is an academic detail associated with your student account. Check your profile or academic overview for the assigned trimester. If it is blank, incorrect or outdated, contact the academic office and provide your student account details through an approved channel. Do not create a second account to change your trimester.'},
  {keys:['ug point','ug section','section assignment','group assignment','change section'],answer:'UG SECTION / UG POINT\nYour assigned UG section (for example, UG-1.1 or UG-1.3) determines the student group associated with your academic schedule and activities. Students should not choose or change an assigned section themselves. If the section is missing or incorrect, ask the academic office to review your assignment.'},
  {keys:['course','subject','assigned course','subjects'],answer:'COURSES AND SUBJECTS\nYour courses are associated with your academic group and the portal’s academic setup. Students should review the courses shown in their schedule or registration area rather than selecting a different faculty member or course outside the options provided. If an expected course is missing, contact the academic office or assigned faculty member.'},
  {keys:['schedule','class schedule','timetable','class time','when is my class'],answer:'VIEWING YOUR CLASS SCHEDULE\n1. Open Class Schedule from the student dashboard.\n2. Review each assigned course/session.\n3. Check the day pattern, time, room, class code and faculty information displayed.\n4. Use the available filters (such as day, time, room or class code) to narrow the list if those filters are shown.\nIf a class is missing or details conflict with an official timetable, contact the academic office.'},
  {keys:['session','time slot','class time slot','smtw','sunday','room','class code'],answer:'CLASS SESSION DETAILS\nA session card/row can show the course, session number, days, time, room, faculty assignment and class code. The schedule in this portal uses SMTW (Sunday–Wednesday) for recurring class days where configured. Check the exact time and room shown for your own course; do not assume every course uses the same session. Report duplicate or conflicting sessions to the academic office.'},
  {keys:['registration','seat booking','book a seat','register for class','registration status','cancel registration'],answer:'REGISTRATION AND SEAT BOOKING\nIf the registration/seat-booking section is enabled for your account, open it and follow the available course/session choices shown for your assigned academic group. Review the course, session, room, time and remaining seats before submitting. The portal may show a pending, approved or other registration status depending on the current workflow. Cancellation or changes are available only when the portal’s registration rules allow them. If the section is closed or unavailable, contact the academic office.'},
  {keys:['seat available','available seats','capacity','full class','overbook'],answer:'SEAT AVAILABILITY\nCheck the availability indicator beside the session before submitting a seat request. A full session may not accept another booking. Choose another available session only if it is offered for your assigned course/group. If the displayed seat count appears incorrect, do not submit repeated requests; report the session and error to the academic office.'},
  // ASSESSMENTS AND STUDY SUPPORT
  {keys:['assessment','assignment','quiz','coursework','exam','deadline'],answer:'FINDING ASSESSMENTS\n1. Open Assessments from your student dashboard.\n2. Review the assessment title, course, instructions and deadline.\n3. Open the assessment to read the full requirements.\n4. Prepare your response and any required attachment.\n5. Submit before the stated deadline and look for a submission confirmation/status.\nIf an assessment is missing, ask the assigned faculty member whether it has been published for your course/group.'},
  {keys:['submission','submit assignment','upload answer','attach file','attachment','file upload'],answer:'SUBMITTING WORK AND ATTACHMENTS\nOpen the relevant assessment, read its instructions, select the file or enter the response requested, and use the submission action on that page. Check the accepted file types and size limit displayed by the form. Wait for the upload/submit action to finish and confirm that the submission appears. If it fails, try a supported file type, shorten the filename, check the file size and report the exact error. Do not assume work was submitted without confirmation.'},
  {keys:['late submission','missed deadline','deadline passed','resubmit','edit submission'],answer:'LATE WORK OR RESUBMISSION\nThe portal’s ability to accept late work or another submission depends on the assessment settings. Check whether the assessment page still provides a submission or edit option. If it is closed, contact the assigned faculty member and explain the situation; the chatbot cannot extend deadlines or reopen assessments.'},
  {keys:['study task','tasks','homework','reading task','research task'],answer:'STUDENT STUDY TASKS\nOpen Study Tasks to review tasks assigned to your student group. Read the task title, type, course, instructions and deadline carefully. Complete the work using the instructions provided by faculty. If the task includes an attachment or submission option, follow the controls shown on the task page. Ask the assigned faculty member if instructions are unclear.'},
  {keys:['learning material','materials','course resources','lecture slides','notes','download material'],answer:'LEARNING MATERIALS\nOpen Learning Materials to view resources shared for your course or student group. Check the material title, description, course and any attached file. Use the file link/control provided by the portal to open or save the resource. If a file cannot be opened, check your internet connection and try again; then ask the faculty member who shared it.'},
  // GRADES, RESULTS AND CGPA
  {keys:['grade','grades','mark','marks','result','results','published result'],answer:'VIEWING GRADES AND RESULTS\n1. Open Grades & Results from your student dashboard.\n2. Choose the available course/trimester view if a selector is provided.\n3. Review component marks, progress information and final results that have been released to students.\n4. For older terms, open CGPA & Academic History to review published academic records across trimesters.\nOnly information released/published for student viewing will appear. If a result is missing, ask the assigned faculty member or academic office to check its release status.'},
  {keys:['previous result','past result','old trimester result','previous trimester','academic history','transcript'],answer:'VIEWING PREVIOUS TRIMESTER RESULTS\nOpen CGPA & Academic History from the student dashboard. The page is designed to show published course results across trimesters, not only the current UG section. Review the trimester history and course/grade details shown. If an earlier trimester is missing, contact the academic office to verify that the historical results are recorded and published under your student account.'},
  {keys:['cgpa','gpa','grade point','quality points','credit hours'],answer:'CGPA AND ACADEMIC HISTORY\nOpen CGPA & Academic History to see your cumulative CGPA, completed credits, published courses and trimester history when those records are available. The portal’s displayed formula is: course quality points = grade point × course credit hours; cumulative CGPA = total quality points ÷ total counted credit hours. Unpublished results are excluded. If credits or a past result are missing, ask the academic office to verify the academic record.'},
  {keys:['attendance','weight','component','midterm','final exam','presentation','participation','quiz marks'],answer:'GRADE COMPONENT WEIGHTS\nThe grading breakdown configured for this portal is: Attendance 5%, Quiz 20%, Class Participation 10%, Presentation 10%, Midterm 25% and Final 30%. These components total 100%. Your actual marks and final grade depend on the marks entered for your course and the result-release process.'},
  {keys:['draft marks','saved draft','progress marks','released progress','final result publish','publish grade'],answer:'DRAFTS, PROGRESS AND FINAL RESULTS\nFaculty may enter component marks and save drafts while working. Saving a draft does not by itself mean students can see the marks. Faculty can release progress where that workflow is available. Final results are subject to the portal’s official publication process. Students should check Grades & Results after the relevant progress or final result is released/published.'},
  // OFFICE HOURS AND APPOINTMENTS
  {keys:['office hour','office hours','appointment','book faculty','faculty meeting','15 minute','15-minute'],answer:'BOOKING A FACULTY APPOINTMENT (STUDENT)\n1. Open Office-hour Booking.\n2. Browse the available faculty member and published time slots.\n3. Select an available date/time slot (appointments are arranged in 15-minute slots where configured).\n4. Enter the reason or details requested by the form.\n5. Submit the appointment request.\n6. Open My Appointments to check whether it is pending, approved, declined, cancelled or completed. A request is not confirmed until its status says it has been approved/confirmed.'},
  {keys:['my appointments','appointment status','cancel appointment','reschedule appointment'],answer:'CHECKING OR CHANGING AN APPOINTMENT\nOpen My Appointments to review appointment history and status, including pending, approved, declined, cancelled and completed requests. If the portal offers a cancellation action, follow its instructions. If you need a different time and no reschedule control is available, contact the faculty member through the institution-approved channel and submit a new request if appropriate.'},
  {keys:['publish office hour','create office hour','faculty slot','manage office hours','available time slot'],answer:'PUBLISHING OFFICE HOURS (FACULTY)\nOpen Manage Office Hours in the faculty workspace. Choose the date and add the available start times/slots using the controls provided. Office-hour appointments are organized in 15-minute slots where configured. Save or publish the availability using the page action, then review appointment requests in the appointment-management area. Only publish times when you are available.'},
  {keys:['appointment request','approve appointment','decline appointment','faculty appointment management'],answer:'MANAGING APPOINTMENT REQUESTS (FACULTY)\nOpen the appointment requests/management section in your faculty workspace. Review the student, requested date/time and reason. Use the available action to approve or decline the request. Keep your published availability accurate and check the appointment status after taking action. If a request is not visible, refresh the page and verify the selected account.'},
  // FACULTY WORKSPACE
  {keys:['faculty dashboard','faculty workspace','faculty login','faculty account'],answer:'FACULTY ACCESS AND DASHBOARD\nSign in using your faculty username or AUW email, password and the Faculty account type. The faculty workspace contains the academic tools enabled for your account, such as assigned courses, class schedule, assessments, grades, study tasks, learning materials and office-hour management. If the Faculty role or dashboard is missing, contact the AUW Connect support team; do not create a student account as a workaround.'},
  {keys:['assigned course','faculty course','course dropdown','course list faculty'],answer:'FACULTY COURSE LIST\nFaculty should use the courses assigned to their account in the course selectors and relevant workspace sections. If a course dropdown is empty, first confirm that you are signed in as Faculty and refresh the page. If it remains empty, the course may not be assigned or the portal data may not have loaded; contact the AUW Connect support or academic team with the course and account details.'},
  {keys:['faculty schedule','my schedule','assigned schedule','class roster','student list'],answer:'FACULTY CLASS SCHEDULE\nOpen the faculty Class Schedule/assigned schedule area to review the classes assigned to you. Check the course, UG group, day, time, room and class code shown. Faculty should follow the assigned schedule rather than independently changing a class session. Report a missing or conflicting assignment to the academic office.'},
  {keys:['create assessment','publish assessment','faculty assessment','assessment form'],answer:'CREATING AN ASSESSMENT (FACULTY)\n1. Open Assessments in the faculty workspace.\n2. Start the create/new assessment form.\n3. Enter the title, course, student group, instructions and deadline requested by the form.\n4. Attach a file if needed and check the displayed file type/size limits.\n5. Submit/publish using the form button.\n6. Review the published assessment and student submissions in the assessment area. The exact fields depend on the current form.'},
  {keys:['grade submission','mark assignment','review submission','faculty grading'],answer:'REVIEWING STUDENT SUBMISSIONS (FACULTY)\nOpen the relevant assessment and review the submitted response or attachment. Follow the grading and feedback controls provided by the page. Save your evaluation and verify that it appears in the student’s submission record. If a file is missing or cannot be opened, record the issue and ask the student to resubmit through the approved process if permitted.'},
  {keys:['enter marks','component marks','faculty grades','save marks','save draft'],answer:'ENTERING AND SAVING COMPONENT MARKS (FACULTY)\nOpen Grades & Results in the faculty workspace and select the relevant course/group/student using the available controls. Enter marks for the configured components: Attendance 5%, Quiz 20%, Class Participation 10%, Presentation 10%, Midterm 25% and Final 30%. Review the entries carefully and use Save Draft to preserve work in progress. A saved draft is not automatically a published student result.'},
  {keys:['release progress','progress release','release marks','publish final grades','final grade'],answer:'RELEASING PROGRESS AND FINAL RESULTS (FACULTY)\nUse the Grades & Results workflow for the selected course/group. Save draft marks while they are being prepared. When progress is ready, use the relevant release action if available. Final results must follow the portal’s official publication process; check the status after each action. Do not tell students that results are official until the portal shows the appropriate released/published status.'},
  {keys:['share materials','upload materials','faculty materials','upload lecture slides'],answer:'SHARING LEARNING MATERIALS (FACULTY)\n1. Open Learning Materials in the faculty workspace.\n2. Select the course and student group.\n3. Enter a material title and optional description.\n4. Choose the resource file if you want to attach one.\n5. Check the displayed accepted formats and maximum file size.\n6. Select Share with students.\nReview the Materials I have shared list to confirm the resource appears. Use the available edit/remove controls to manage your own materials.'},
  {keys:['assign study task','publish task','faculty study task','task for students'],answer:'PUBLISHING STUDY TASKS (FACULTY)\n1. Open Study Tasks in the faculty workspace.\n2. Enter a task title and choose the task type.\n3. Select the course and student group.\n4. Write clear instructions.\n5. Set the deadline.\n6. Attach an instruction/document file if needed, within the limit shown on the form.\n7. Select Publish study task.\nThe portal should add the task to the published task list and notify the relevant students when notifications are enabled.'},
  {keys:['faculty profile','edit faculty profile'],answer:'FACULTY PROFILE\nOpen your profile area and review the information displayed. Edit only fields that the portal marks as editable, then save the changes. Assigned courses, role and institutional details may be controlled by the institution. Contact the AUW Connect support team if those details are incorrect.'},
  // STUDENT COMMUNICATION
  {keys:['messenger','student messenger','message student','chat with student','private chat','group chat'],answer:'STUDENT MESSENGER\nIf the Student Messenger section is available in your account, use it for the student-to-student conversations supported by the portal. Select an existing conversation or use the available controls to start one, then type your message and send it. If the message box is disabled, no conversation is selected, or sending fails, refresh the page and report the issue with the conversation type and error. Faculty help should be requested through office-hour booking or the institution-approved email channel.'},
  // TROUBLESHOOTING AND BOUNDARIES
  {keys:['not working','error','bug','problem','broken','failed','does not work','doesnt work'],answer:'TROUBLESHOOTING AUW CONNECT\n1. Refresh the page once.\n2. Check that you are signed in with the correct account type.\n3. Check your internet connection and required form fields.\n4. Confirm that uploaded files meet the accepted type and size limits shown on the page.\n5. Note the exact section, action, time and full error message.\n6. Contact the AUW Connect support team with those details.\nDo not share your password, verification link or private authentication codes.'},
  {keys:['contact','help','support','report issue','technical support'],answer:'GETTING MORE HELP\nFor an account-specific issue or a problem that this FAQ cannot resolve, contact the AUW Connect support or academic team. Include the page or section name, what you were trying to do, the time of the problem and the exact error message. Never send your password or sign-in verification code.'}
];
function renderHelpWidget() {
  const root = document.getElementById('auwChatbot');
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';
  const panel = document.getElementById('auwChatbotPanel');
  const launcher = document.getElementById('auwChatbotLauncher');
  const close = document.getElementById('auwChatbotClose');
  const messages = document.getElementById('auwChatbotMessages');
  const form = document.getElementById('auwChatbotForm');
  const input = document.getElementById('auwChatbotInput');
  if (!panel || !launcher || !close || !messages || !form || !input) return;
  const setOpen = open => {
    panel.classList.toggle('hidden', !open);
    panel.setAttribute('aria-hidden', String(!open));
    launcher.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
  };
  const addMessage = (text, who) => {
    const node = document.createElement('div');
    node.className = `auw-chat-message ${who}`;
    node.textContent = text;
    messages.appendChild(node);
    messages.scrollTop = messages.scrollHeight;
  };
  const answerQuestion = question => {
    const normalized = question.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    // Handle ordinary greetings naturally; do not show the topic list for greetings or thanks.
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|how are you|thanks|thank you)[.!\s]*$/.test(normalized)) {
      addMessage('Hello! I can help you use AUW Connect. What would you like to know about your Student or Faculty account?', 'bot');
      return;
    }
    let best = null, bestScore = 0;
    for (const entry of auwFaqEntries) {
      const score = entry.keys.reduce((total, key) => total + (normalized.includes(key) ? Math.max(1, key.split(' ').length) : 0), 0);
      if (score > bestScore) { best = entry; bestScore = score; }
    }
    const portalContext = /auw|connect|portal|dashboard|account|login|sign in|log in|password|username|email|profile|picture|trimester|ug[- ]?\d|section|course|class|schedule|registration|seat|assessment|assignment|submission|grade|result|cgpa|gpa|office hour|appointment|faculty|student|study task|learning material|notification|message|dark mode|light mode|upload|feedback|marks|attendance|quiz|midterm|final|room|session/.test(normalized);
    if (best && bestScore >= 1 && (portalContext || bestScore >= 3)) {
      addMessage(best.answer, 'bot');
      return;
    }
    addMessage('I’m here to help with AUW Connect. I couldn’t match that question to a feature in the Student or Faculty portal. You can ask me about:\n\nSTUDENT HELP\n• Signing in, creating an account, username, password or email verification\n• Profile details and profile picture\n• Assigned trimester, UG section, courses and class schedule\n• Registration and seat booking, if available in your account\n• Assessments, assignment instructions and file submissions\n• Grades, released results, previous trimester results and CGPA\n• Study tasks and learning materials\n• Faculty office hours and appointments\n• Notifications, student messaging (if available) and light/dark mode\n\nFACULTY HELP\n• Faculty sign-in, profile, assigned courses and class schedule\n• Creating assessments and reviewing student submissions\n• Entering marks, saving drafts and releasing progress/final results\n• Sharing learning materials and publishing study tasks\n• Creating office-hour slots and managing appointments\n\nTry rephrasing your question or tell me which Student or Faculty page you are using. I only answer questions about AUW Connect. If a feature is not available in your account, I’ll explain that rather than suggesting a feature that is not part of the Student or Faculty portal.', 'bot');
  };
  launcher.addEventListener('click', () => setOpen(panel.classList.contains('hidden')));
  close.addEventListener('click', () => setOpen(false));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    addMessage(question, 'user');
    input.value = '';
    answerQuestion(question);
  });
  messages.addEventListener('click', event => {
    const suggestion = event.target.closest('[data-chat-suggestion]');
    if (!suggestion) return;
    const question = suggestion.dataset.chatSuggestion;
    addMessage(question, 'user');
    answerQuestion(question);
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.classList.contains('hidden')) setOpen(false); });
}

function renderAll() {
  renderAppointments();
  renderNotifications();
  renderIdentity(); renderTeachers(); renderSchedule();
  renderGrades(); renderAcademicHistory(); renderOverview(); renderRegistration();
  renderFaculty(); renderAdmin(); renderAssessments(); renderStudyTasks(); renderComponentMarksPanel(); renderHelpWidget();
  if (currentUser().role === 'Student') { renderCourseMaterials(); renderConversations(); }
  if (currentUser().role === 'Teacher') renderFacultyMaterials();
}
function renderContactPicker(searchText = '') {
  const results = $('#contactResults');
  if (!results) return;
  const me = currentUser();
  if (me.role !== 'Student') { results.innerHTML = '<p class="muted">The student messenger is available only to student accounts.</p>'; return; }
  const query = String(searchText || '').trim().toLowerCase();
  const contacts = data.users
    .filter(user => user.role === 'Student' && user.id !== me.id)
    .filter(user => `${user.name} ${user.email} ${user.role} ${user.group || ''}`.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));

  results.innerHTML = contacts.map(user => {
    const existing = data.conversations.some(chat => chat.type === 'private' && Array.isArray(chat.memberIds) && chat.memberIds.length === 2 && chat.memberIds.includes(me.id) && chat.memberIds.includes(user.id));
    const online = isUserOnline(user.id);
    return `<button type="button" class="contact-result" data-start-private-chat="${escapeHTML(user.id)}">
      <span class="avatar">${avatarContent(user)}</span>
      <span class="contact-result-info"><strong>${escapeHTML(user.name)}</strong><small>Student · ${escapeHTML(user.group || 'AUW')}</small></span>
      <span class="contact-result-status"><i class="presence-dot ${online ? '' : 'is-offline'}"></i>${online ? 'Online' : 'Offline'}<b>${existing ? 'Open chat' : 'Message'}</b></span>
    </button>`;
  }).join('') || '<p class="muted contact-empty">No matching people found. Check the spelling or ask them to create an account.</p>';
}

function openContactPicker() {
  if (currentUser().role !== 'Student') return showToast('The student messenger is available only to students.');
  const picker = $('#contactPicker');
  if (!picker) return;
  picker.classList.remove('hidden');
  $('#contactResults').classList.remove('hidden');
  $('#contactSearch').closest('label').classList.remove('hidden');
  $('#groupMemberPicker').classList.add('hidden');
  $('#contactSearch').value = '';
  renderContactPicker();
  $('#contactSearch').focus();
}

function createGroupChat() {
  const me = currentUser();
  if (me.role !== 'Student') return showToast('Only students can create messenger groups.');
  const candidates = data.users.filter(person => person.role === 'Student' && person.id !== me.id).sort((a,b)=>a.name.localeCompare(b.name));
  if (candidates.length < 2) return showToast('At least two other student accounts are needed to create a group chat.');
  const picker = $('#contactPicker');
  const groupPicker = $('#groupMemberPicker');
  picker.classList.remove('hidden');
  $('#contactResults').classList.add('hidden');
  $('#contactSearch').closest('label').classList.add('hidden');
  groupPicker.classList.remove('hidden');
  groupPicker.innerHTML = `<div class="group-picker-heading"><div><h3>Create a group chat</h3><p class="muted">Select at least two students. You will be added automatically.</p></div><button type="button" class="button button-outline" id="cancelGroupSelection">Cancel</button></div><label class="group-name-field">Group name<input id="newGroupName" maxlength="60" placeholder="e.g. Academic Writing Group" required></label><div class="group-select-list">${candidates.map(person=>`<label class="group-select-option"><input type="checkbox" value="${escapeHTML(person.id)}" class="group-member-checkbox"><span><b>${escapeHTML(person.name)}</b><small>${escapeHTML(person.group || 'Student')}</small></span></label>`).join('')}</div><div class="group-picker-footer"><span id="groupSelectionCount" class="muted">0 students selected</span><button type="button" class="button button-primary" id="confirmCreateGroup">Create group</button></div>`;
  $('#contactPicker').scrollIntoView({behavior:'smooth',block:'nearest'});
  groupPicker.querySelectorAll('.group-member-checkbox').forEach(box=>box.addEventListener('change',()=>{
    const count=groupPicker.querySelectorAll('.group-member-checkbox:checked').length;
    $('#groupSelectionCount').textContent=`${count} student${count===1?'':'s'} selected`;
  }));
  $('#cancelGroupSelection').addEventListener('click',()=>{
    groupPicker.classList.add('hidden'); $('#contactResults').classList.remove('hidden'); $('#contactSearch').closest('label').classList.remove('hidden');
  });
  $('#confirmCreateGroup').addEventListener('click',()=>{
    const selectedIds=[...groupPicker.querySelectorAll('.group-member-checkbox:checked')].map(box=>box.value);
    const title=$('#newGroupName').value.trim();
    if(selectedIds.length<2) return showToast('Select at least two students for your group.');
    if(!title) return showToast('Please enter a group name.');
    const memberIds=[...new Set([me.id,...selectedIds])];
    const chat={id:`chat${Date.now()}`,title:title.slice(0,60),type:'group',ownerId:me.id,memberIds,messages:[]};
    data.conversations.push(chat); currentChatId=chat.id; saveData();
    picker.classList.add('hidden'); groupPicker.classList.add('hidden'); $('#contactResults').classList.remove('hidden'); $('#contactSearch').closest('label').classList.remove('hidden');
    renderConversations(); showToast('Group chat created. You can view its members in the chat header.');
  });
}
function createPrivateChat(otherUserId) {
  const me = currentUser();
  const other = getUser(otherUserId);
  if (me.role !== 'Student' || !other || other.role !== 'Student' || other.id === me.id) return showToast('You can only start a private chat with another student.');
  let chat = data.conversations.find(item => item.type === 'private' && isStudentOnlyConversation(item) && item.memberIds.length === 2 && item.memberIds.includes(me.id) && item.memberIds.includes(other.id));
  if (!chat) { chat = { id: `private-${me.id}-${other.id}-${Date.now()}`, title: other.name, type: 'private', memberIds: [me.id, other.id], messages: [] }; data.conversations.push(chat); }
  chat.messages = Array.isArray(chat.messages) ? chat.messages : [];
  currentChatId = chat.id; saveData(); $('#contactPicker').classList.add('hidden'); goTo('student-messenger');
}

function setupThemeToggle() {
  const savedTheme = localStorage.getItem('auwConnectTheme') || 'light';
  document.body.classList.toggle('dark-mode', savedTheme === 'dark');
  const themeButton = $('#themeToggle');
  function updateThemeButton() {
    const darkModeOn = document.body.classList.contains('dark-mode');
    themeButton.textContent = darkModeOn ? '☀️ Light mode' : '🌙 Dark mode';
    themeButton.setAttribute('aria-label', darkModeOn ? 'Switch to light mode' : 'Switch to dark mode');
    themeButton.title = darkModeOn ? 'Switch to light mode' : 'Switch to dark mode';
  }
  updateThemeButton();
  themeButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const newTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('auwConnectTheme', newTheme);
    updateThemeButton();
  });
}

function setupEvents() {
  // Open the Admin panel and move straight to the announcement composer.
  $('#showAnnouncementForm').addEventListener('click', () => {
    if (currentUser().role !== 'Admin') {
      showToast('Please switch to the Administrator account first.');
      $('#authModal').classList.remove('hidden');
      return;
    }
    goTo('admin');
    $('#announcementForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#announcementTitle').focus();
  });

  $('#mainNav').addEventListener('click', event => {
    const button = event.target.closest('[data-view]');
    if (button) goTo(button.dataset.view);
  });
  $('#studyTaskCreateForm')?.addEventListener('submit', event => { event.preventDefault(); publishStudyTask(event.target); });
  document.addEventListener('submit', event => {
    const submissionForm=event.target.closest('.task-submit-form');
    if(submissionForm){
      event.preventDefault();const task=data.studyTasks.find(item=>item.id===submissionForm.dataset.taskSubmit);const user=currentUser();
      if(!task||user.role!=='Student'||task.group!==user.group)return showToast('This task is not available to your account.');
      if((task.submissions||[]).some(item=>item.studentId===user.id))return showToast('You have already submitted this task.');
      const text=submissionForm.elements.submissionText.value.trim(),file=submissionForm.elements.submissionFile.files[0];
      if(!text&&!file)return showToast('Write an answer or attach your work before submitting.');
      if(new Date(task.deadline).getTime()<Date.now())return showToast('The deadline has passed; submission is closed.');
      if(file&&file.size>700*1024)return showToast('Please choose a submission file smaller than 700 KB.');
      const saveSubmission=fileData=>{task.submissions=task.submissions||[];task.submissions.push({studentId:user.id,text,fileName:file?.name||'',fileData:fileData||'',submittedAt:new Date().toISOString(),feedback:''});addNotification(task.authorId,'Study task submitted',`${user.name} submitted “${task.title}”.`,'tasks',task.id);addNotification(user.id,'Submission received',`Your work for “${task.title}” has been submitted.`,'tasks',task.id);saveData();renderStudyTasks();showToast('Your task has been submitted.');};
      if(!file)return saveSubmission('');const reader=new FileReader();reader.onload=()=>saveSubmission(String(reader.result||''));reader.onerror=()=>showToast('The submission file could not be read.');reader.readAsDataURL(file);return;
    }
    const feedbackForm=event.target.closest('.task-feedback-form');
    if(feedbackForm){event.preventDefault();if(currentUser().role!=='Teacher')return showToast('Only faculty can provide feedback.');const task=data.studyTasks.find(item=>item.id===feedbackForm.dataset.taskFeedback);const submission=task?.submissions?.find(item=>item.studentId===feedbackForm.dataset.studentFeedback);if(!submission)return;submission.feedback=feedbackForm.elements.feedback.value.trim();submission.feedbackAt=new Date().toISOString();addNotification(submission.studentId,'Study task feedback available',`Your faculty member provided feedback on “${task.title}”.`,'tasks',task.id);saveData();renderStudyTasks();showToast('Feedback saved and student notified.');return;}
  });
  document.addEventListener('click', event=>{const del=event.target.closest('[data-delete-study-task]');if(!del)return;if(currentUser().role!=='Teacher')return showToast('Only faculty can delete study tasks.');const task=data.studyTasks.find(item=>item.id===del.dataset.deleteStudyTask);if(!task||task.authorId!==currentUser().id)return;task.submissions.forEach(sub=>addNotification(sub.studentId,'Study task removed',`“${task.title}” has been removed by faculty.`,'tasks',task.id));data.studyTasks=data.studyTasks.filter(item=>item.id!==task.id);saveData();renderStudyTasks();showToast('Study task deleted.');});

  $('#topNotificationBtn')?.addEventListener('click', event => {
    event.stopPropagation();
    const popover = $('#notificationPopover');
    if (popover) { const opening = popover.classList.contains('hidden'); popover.classList.toggle('hidden', !opening); if (opening) renderNotificationPopover(); }
  });
  $('#notificationViewAll')?.addEventListener('click', () => { $('#notificationPopover')?.classList.add('hidden'); goTo('notifications'); });
  document.addEventListener('click', event => {
    const popover = $('#notificationPopover');
    if (!popover || popover.classList.contains('hidden')) return;
    if (event.target.closest('#notificationPopover, #topNotificationBtn')) return;
    popover.classList.add('hidden');
  });
  $('#adminHelpReplyForm').addEventListener('submit', event => {
    event.preventDefault();
    if (currentUser().role !== 'Admin') return showToast('Admin access required.');
    const message = $('#adminHelpReplyInput').value.trim();
    if (!selectedHelpUserId || !message) return;
    sendHelpMessage('a1', selectedHelpUserId, message);
    $('#adminHelpReplyInput').value = '';
    renderAdminHelpInbox();
    showToast('Reply sent.');
  });
  document.addEventListener('submit', event => {
    if (event.target && event.target.id === 'trimesterRequestForm') {
      event.preventDefault();
      const u=currentUser(); if(u.role!=='Student'||u.accountStatus!=='approved') return;
      u.requestedGroup=$('#requestedTrimester').value; u.trimesterStatus='requested';
      saveData();renderAll();showToast('Trimester assignment request sent to Admin.');
    }
  });
  document.addEventListener('change', event => {
    if (event.target && event.target.id === 'studentResultTrimester') { renderGrades(); return; }
    const sessionFilter = event.target.closest('[data-registration-session-filter]');
    if (sessionFilter) {
      const courseId = sessionFilter.dataset.registrationSessionFilter;
      registrationSessionFilters[courseId] = sessionFilter.value;
      if (sessionFilter.value !== 'all') {
        const courseSessions = getCourseSessions(courseId, $('#registrationSection')?.value || currentUser().group);
        const chosen = courseSessions.find((session, index) => String(sessionNumber(session, index)) === sessionFilter.value);
        if (chosen) selectedRegistrationSessions[courseId] = chosen.id;
        delete selectedRegistrationSeats[courseId];
      }
      renderRegistration();
      return;
    }
    const sessionSelect = event.target.closest('[data-registration-session]');
    if (sessionSelect) {
      const courseId = sessionSelect.dataset.registrationSession;
      selectedRegistrationSessions[courseId] = sessionSelect.value;
      delete selectedRegistrationSeats[courseId];
      renderRegistration();
    }
  });

  document.addEventListener('click', event => {
    const publishComponent=event.target.closest('[data-publish-component-result]');
    if(publishComponent){if(currentUser().role!=='Teacher')return showToast('Faculty access required.');const [studentId,courseId,trimester]=publishComponent.dataset.publishComponentResult.split('|');const finalMark=calculateFinalWeightedMark(studentId,courseId,trimester);if(finalMark===null)return showToast('All six component marks are required before publishing.');let grade=data.grades.find(g=>g.studentId===studentId&&g.courseId===courseId&&g.trimester===trimester&&g.resultSource==='components');if(!grade){grade={id:`cg${Date.now()}`,studentId,courseId,trimester,resultSource:'components'};data.grades.push(grade);}Object.assign(grade,{obtained:finalMark,total:100,feedback:'Final weighted result calculated from all six course components.',published:true,enteredById:currentUser().id,publishedAt:new Date().toISOString()});addNotification(studentId,'Final course result published',`${courseName(courseId)} · ${trimester}: ${finalMark.toFixed(1)}%. Your letter grade and CGPA have been updated.`, 'grades',grade.id);saveData();renderAll();showToast('Final result published. Student CGPA updated.');return;}
    const unpublishComponent=event.target.closest('[data-unpublish-component-result]');
    if(unpublishComponent){
      if(currentUser().role!=='Teacher')return showToast('Faculty access required.');
      const [studentId,courseId,trimester]=unpublishComponent.dataset.unpublishComponentResult.split('|');
      const grade=data.grades.find(g=>g.studentId===studentId&&g.courseId===courseId&&g.trimester===trimester&&g.resultSource==='components');
      if(!grade||grade.published!==true)return showToast('There is no published final result to unpublish.');
      if(!confirm('Unpublish this final result? The student will no longer see it and it will no longer count toward CGPA. All six saved component marks will remain as a draft.'))return;
      grade.published=false;
      grade.unpublishedAt=new Date().toISOString();
      grade.unpublishedById=currentUser().id;
      addNotification(studentId,'Final result unpublished',`${courseName(courseId)} · ${trimester}: the faculty has withdrawn the final result. Your saved component marks remain recorded.`, 'grades', grade.id);
      saveData();renderAll();showToast('Final result unpublished. The six component marks remain saved, and the result is removed from the student view and CGPA.');return;
    }
    const releaseButton=event.target.closest('[data-release-progress]');
    if(releaseButton){ if(currentUser().role!=='Teacher')return showToast('Faculty access required.'); const key=releaseButton.dataset.releaseProgress; const [studentId,courseId,trimester]=key.split('|'); const summary=calculateCurrentProgress(studentId,courseId,trimester); if(summary.percentage===null)return showToast('Record at least one component mark first.'); data.progressReleases[key]={percentage:summary.percentage,availableWeight:summary.availableWeight,components:Object.fromEntries(Object.entries(summary.records).map(([name,record])=>[name,{percentage:Number(record.percentage),source:record.source||'manual'}])),releasedAt:new Date().toISOString(),releasedBy:currentUser().id}; addNotification(studentId,'Midterm progress released',`${courseName(courseId)} · ${trimester}: your current progress is ${summary.percentage.toFixed(1)}%.`, 'grades', courseId); saveData();renderAll();showToast('Progress percentage released to the student.'); return; }
    const approveDeletion = event.target.closest('[data-approve-deletion]');
    if (approveDeletion) {
      if (currentUser().role !== 'Admin') return showToast('Institutional approval is required.');
      const request = data.accountDeletionRequests.find(item => item.id === approveDeletion.dataset.approveDeletion && item.status === 'pending');
      if (!request) return;
      if (!confirm('Approve this request? The account will be deactivated and sign-in will be blocked. Academic records will be retained.')) return;
      request.status = 'approved'; request.reviewedAt = new Date().toISOString(); request.reviewedById = currentUser().id;
      const account = getUser(request.userId);
      if (account) { account.accountDeletionStatus = 'approved'; account.accountStatus = 'deletion_approved'; }
      addNotification(request.userId, 'Account deletion request approved', 'Your AUW Connect account has been deactivated. Academic records are retained according to institutional policy.', 'profile', request.id);
      saveData(); renderAll(); showToast('Account deactivated. Academic records were retained.'); return;
    }
    const rejectDeletion = event.target.closest('[data-reject-deletion]');
    if (rejectDeletion) {
      if (currentUser().role !== 'Admin') return showToast('Institutional approval is required.');
      const request = data.accountDeletionRequests.find(item => item.id === rejectDeletion.dataset.rejectDeletion && item.status === 'pending');
      if (!request) return;
      request.status = 'declined'; request.reviewedAt = new Date().toISOString(); request.reviewedById = currentUser().id;
      addNotification(request.userId, 'Account deletion request declined', 'Your account remains active. Please contact the institutional support team if you have questions.', 'profile', request.id);
      saveData(); renderAll(); showToast('Deletion request declined. The account remains active.'); return;
    }
    const approveAccount = event.target.closest('[data-approve-account]');
    if (approveAccount && currentUser().role === 'Admin') { const u=getUser(approveAccount.dataset.approveAccount); if(u){u.accountStatus='approved';saveData();renderAll();showToast('Student account approved.');} return; }
    const rejectAccount = event.target.closest('[data-reject-account]');
    if (rejectAccount && currentUser().role === 'Admin') { const u=getUser(rejectAccount.dataset.rejectAccount); if(u){u.accountStatus='rejected';saveData();renderAll();showToast('Student account request rejected.');} return; }
    const assignTrimester = event.target.closest('[data-assign-trimester]');
    if (assignTrimester && currentUser().role === 'Admin') { const u=getUser(assignTrimester.dataset.assignTrimester); const sel=document.querySelector(`[data-assign-group="${assignTrimester.dataset.assignTrimester}"]`); if(u&&sel){u.group=sel.value;u.trimesterStatus='assigned';u.assignedTrimester=data.registrationSettings.trimester;saveData();renderAll();showToast('Trimester assigned to student.');} return; }
    const approveRegistration = event.target.closest('[data-approve-registration]');
    if (approveRegistration && currentUser().role === 'Admin') { const r=data.registrations.find(x=>x.id===approveRegistration.dataset.approveRegistration); if(r){r.status='approved';saveData();renderAll();showToast('Class registration approved.');} return; }
    const facultyReleaseGrade = event.target.closest('[data-faculty-release-grade]');
    if (facultyReleaseGrade) {
      const user = currentUser();
      if (user.role !== 'Teacher') return showToast('Faculty access required.');
      const grade = data.grades.find(item => item.id === facultyReleaseGrade.dataset.facultyReleaseGrade && item.enteredById === user.id);
      if (!grade) return showToast('This mark was not recorded by your faculty account.');
      if (grade.published === true) return showToast('This result has already been released.');
      grade.published = true;
      grade.publishedAt = new Date().toISOString();
      addNotification(grade.studentId, 'Course result released', `${courseName(grade.courseId)} · ${grade.trimester || 'Fall 2026'}: ${gradeFor(grade.obtained, grade.total).percentage.toFixed(1)}%. Your faculty has released this result.`, 'grades', grade.id);
      saveData(); renderAll(); showToast('Result released to the student. Their grades and CGPA have been updated.');
      return;
    }
    const publishGrade = event.target.closest('[data-publish-grade]');
    if (publishGrade) {
      if (currentUser().role !== 'Admin') return showToast('Admin access required.');
      const grade = data.grades.find(item => item.id === publishGrade.dataset.publishGrade);
      if (!grade) return;
      grade.published = true;
      saveData(); renderAll(); showToast('Grades officially published. Students can now view the result.');
      return;
    }
    const goButton = event.target.closest('[data-go]');
    if (goButton) goTo(goButton.dataset.go);
    const registrationSeat = event.target.closest('[data-registration-seat]');
    if (registrationSeat && !registrationSeat.disabled) {
      const courseId = registrationSeat.dataset.courseId;
      selectedRegistrationSeats[courseId] = Number(registrationSeat.dataset.registrationSeat);
      renderRegistration();
    }
    const chatButton = event.target.closest('[data-chat-id]');
    if (chatButton && currentUser().role === 'Student') {
      const chosenChat = data.conversations.find(item => item.id === chatButton.dataset.chatId && isStudentOnlyConversation(item) && item.memberIds.includes(currentUser().id));
      if (chosenChat) { currentChatId = chosenChat.id; renderConversations(); }
    }
    const helpThread = event.target.closest('[data-help-thread]');
    if (helpThread && currentUser().role === 'Admin') { selectedHelpUserId = helpThread.dataset.helpThread; renderAdminHelpInbox(); }
    const deleteUser = event.target.closest('[data-delete-user]');
    if (deleteUser) {
      const id = deleteUser.dataset.deleteUser;
      if (!confirm('Remove this account? Its private conversations and grade records may also become unavailable.')) return;
      data.users = data.users.filter(item => item.id !== id);
      data.bookings = data.bookings.filter(item => item.studentId !== id && item.teacherId !== id);
      data.grades = data.grades.filter(item => item.studentId !== id);
      data.conversations = data.conversations.filter(chat => !chat.memberIds.includes(id));
      data.schedules = data.schedules.filter(item => item.teacherId !== id);
      saveData(); renderAll(); showToast('User removed from this browser.');
    }
    const editCourse = event.target.closest('[data-edit-course]');
    if (editCourse) {
      if (currentUser().role !== 'Admin') return showToast('Admin access required.');
      const course = data.courses.find(item => item.id === editCourse.dataset.editCourse);
      if (!course) return;
      editingCourseId = course.id;
      $('#newCourseName').value = course.name;
      $('#newCourseCode').value = course.code;
      $('#newCourseTeacher').value = course.teacherId || '';
      $('#addCourseForm').querySelector('button').textContent = 'Save course changes';
      $('#addCourseForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#newCourseName').focus();
    }
    const deleteCourse = event.target.closest('[data-delete-course]');
    if (deleteCourse) { const id = deleteCourse.dataset.deleteCourse; data.courses = data.courses.filter(item => item.id !== id); data.schedules = data.schedules.filter(item => item.courseId !== id); data.grades = data.grades.filter(item => item.courseId !== id); saveData(); renderAll(); showToast('Course removed.'); }
    const editAnnouncement = event.target.closest('[data-edit-announcement]');
    if (editAnnouncement) {
      if (currentUser().role !== 'Admin') return showToast('Admin access required.');
      const item = data.announcements.find(row => row.id === editAnnouncement.dataset.editAnnouncement);
      if (!item) return;
      editingAnnouncementId = item.id;
      $('#announcementTitle').value = item.title;
      $('#announcementText').value = item.text;
      $('#announcementCategory').value = item.category || 'General';
      $('#announcementFormHeading').textContent = 'Edit announcement';
      $('#announcementSubmit').textContent = 'Save changes';
      $('#cancelAnnouncementEdit').classList.remove('hidden');
      goTo('admin');
      $('#announcementTitle').focus();
    }
    const deleteAnnouncement = event.target.closest('[data-delete-announcement]');
    if (deleteAnnouncement) {
      if (currentUser().role !== 'Admin') return showToast('Admin access required.');
      if (!confirm('Delete this announcement?')) return;
      const id = deleteAnnouncement.dataset.deleteAnnouncement;
      data.announcements = data.announcements.filter(item => item.id !== id);
      saveData(); renderAll(); showToast('Announcement deleted.');
    }
    const readAnnouncement = event.target.closest('[data-read-announcement]');
    if (readAnnouncement) {
      const key = `auwReadAnnouncements_${currentUser().id}`;
      const readIds = JSON.parse(localStorage.getItem(key) || '[]');
      if (!readIds.includes(readAnnouncement.dataset.readAnnouncement)) readIds.push(readAnnouncement.dataset.readAnnouncement);
      localStorage.setItem(key, JSON.stringify(readIds));
      renderAnnouncements();
    }
    const editMaterial = event.target.closest('[data-edit-material]');
    if (editMaterial) {
      const item = data.courseMaterials.find(row => row.id === editMaterial.dataset.editMaterial && row.authorId === currentUser().id);
      if (!item || currentUser().role !== 'Teacher') return showToast('You can only edit materials you shared.');
      editingMaterialId = item.id; $('#materialCourse').value = item.courseId; $('#materialGroup').value = item.group; $('#materialTitle').value = item.title; $('#materialDescription').value = item.description || ''; $('#materialFile').value = ''; $('#materialSubmitButton').textContent = 'Save material changes'; $('#cancelMaterialEdit').classList.remove('hidden'); $('#facultyMaterialForm').scrollIntoView({behavior:'smooth',block:'center'}); $('#materialTitle').focus();
    }
    const deleteMaterial = event.target.closest('[data-delete-material]');
    if (deleteMaterial) { const item = data.courseMaterials.find(row => row.id === deleteMaterial.dataset.deleteMaterial); if (!item || currentUser().role !== 'Teacher' || item.authorId !== currentUser().id) return showToast('You can only delete materials you shared.'); data.users.filter(student => student.role === 'Student' && student.group === item.group).forEach(student => addNotification(student.id, 'Learning material removed', `${item.title} is no longer available.`, 'materials', item.id)); addNotification(currentUser().id, 'Learning material removed', `You removed ${item.title}.`, 'materials', item.id); data.courseMaterials = data.courseMaterials.filter(row => row.id !== deleteMaterial.dataset.deleteMaterial); saveData(); renderFacultyMaterials(); renderCourseMaterials(); showToast('Course material deleted.'); }
  });
  $('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#topAvatar').addEventListener('click', () => goTo('profile'));
  $('#sidebarProfileButton').addEventListener('click', () => goTo('profile'));
  // Treat the shared profile panel like a dismissible overlay: clicking outside
  // the profile card closes it, while clicks inside the card leave it open.
  document.addEventListener('click', event => {
    const profileView = $('#view-profile');
    if (!profileView || !profileView.classList.contains('active')) return;
    if (event.target.closest('#view-profile .panel')) return;
    if (event.target.closest('#topAvatar, #sidebarProfileButton')) return;
    goTo('overview');
  });
  const setAuthMode = mode => { ['login','signup'].forEach(name => { const pane=$(`#auth${name[0].toUpperCase()+name.slice(1)}Pane`); if(pane) pane.classList.toggle('hidden',name!==mode); }); $$('[data-auth-mode]').forEach(btn=>btn.classList.toggle('button-primary',btn.dataset.authMode===mode)); };
  $$('[data-auth-mode]').forEach(btn=>btn.addEventListener('click',()=>setAuthMode(btn.dataset.authMode)));
  $('#closeAuthBtn').addEventListener('click', () => { if (!document.body.classList.contains('logged-out')) $('#authModal').classList.add('hidden'); });
  $('#authModal').addEventListener('click', event => { if (event.target === $('#authModal')) $('#authModal').classList.add('hidden'); });
  $('#reopenAuthBtn').addEventListener('click', () => { setAuthMode('login'); $('#authModal').classList.remove('hidden'); });
  const signOut = () => { data.currentUserId=''; saveData(); document.body.classList.add('logged-out'); $('#authModal').classList.remove('hidden'); setAuthMode('login'); $('#loginForm').reset(); };
  $('#signOutBtn').addEventListener('click', signOut);
  $('#headerSignOutBtn').addEventListener('click', signOut);
  $('#loginForm').addEventListener('submit', event => {
    event.preventDefault();
    const loginValue = $('#loginEmail').value.trim().toLowerCase();
    const password = $('#loginPassword').value;
    const requestedRole = $('#loginRole').value;
    const normalizeRole = value => {
      const role = String(value || '').trim().toLowerCase();
      if (role === 'faculty' || role === 'teacher') return 'Teacher';
      if (role === 'student') return 'Student';
      return String(value || '').trim();
    };
    const user = data.users.find(item => {
      const savedEmail = String(item.email || '').trim().toLowerCase();
      const savedUsername = String(item.username || savedEmail.split('@')[0]).trim().toLowerCase();
      return (savedEmail === loginValue || savedUsername === loginValue) && normalizeRole(item.role) === normalizeRole(requestedRole);
    });
    if (!user) {
      showToast('No matching account found. Check your username/email and selected account type.');
      return;
    }
    if (user.accountDeletionStatus === 'approved' || user.accountStatus === 'deletion_approved') { showToast('This account has been deactivated following an approved deletion request.'); return; }
    if (normalizeRole(user.role) === 'Student' && user.accountStatus === 'rejected') {
      showToast('This student account is not active. Please contact the campus support team.');
      return;
    }
    if (!user.password) {
      if (password.length < 6) {
        showToast('Create a password with at least 6 characters for this older account.');
        return;
      }
      user.password = password;
      user.username = user.username || String(user.email || '').split('@')[0];
      showToast('A password has been set for this existing browser account.');
    } else if (String(user.password) !== password) {
      showToast('Password is incorrect. Please check it and try again.');
      return;
    }
    user.role = normalizeRole(user.role);
    data.currentUserId = user.id;
    document.body.classList.remove('logged-out');
    try { updateMyPresence(); saveData(); } catch (error) { console.warn('Could not update login presence.', error); }
    $('#authModal').classList.add('hidden');
    $('#loginForm').reset();
    try { renderAll(); } catch (error) { console.error('Dashboard rendering error after login:', error); }
    try { goTo(user.role === 'Teacher' ? 'faculty' : 'overview'); } catch (error) {
      console.error('Dashboard navigation error after login:', error);
      const target = user.role === 'Teacher' ? 'faculty' : 'overview';
      document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === `view-${target}`));
    }
    showToast(`Welcome back, ${user.name}.`);
  });
  $('#signupRole').addEventListener('change', () => {
    const isStudent = $('#signupRole').value === 'Student';
    $('#signupGroupLabel').classList.toggle('hidden', !isStudent);
    $('#signupGroup').required = isStudent;
  });
  $('#signupForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#signupName').value.trim();
    const email = $('#signupEmail').value.trim().toLowerCase();
    const username = $('#signupUsername').value.trim().toLowerCase();
    const password = $('#signupPassword').value;
    const role = $('#signupRole').value === 'Teacher' ? 'Teacher' : 'Student';
    if (password.length < 6) {
      showToast('Please use at least 6 characters for the password.');
      return;
    }
    if (!isAuwAcademicEmail(email)) { showToast('Please use your AUW academic email ending in @auw.edu.bd.'); return; }
    if (!/^[a-z0-9._-]{3,24}$/.test(username)) { showToast('Username must be 3–24 characters and use only letters, numbers, dots, underscores or hyphens.'); return; }
    if (data.users.some(user => String(user.username || '').toLowerCase() === username)) { showToast('That username is already taken. Please choose another.'); return; }
    if (data.users.some(user => String(user.email).toLowerCase() === email)) {
      showToast('An account with this email already exists.');
      return;
    }
    const id = `${role === 'Student' ? 's' : 't'}${Date.now()}`;
    const group = role === 'Student' ? $('#signupGroup').value : 'Faculty';
    data.users.push({ id, name, email, username, role, password, group, accountStatus: 'approved', trimesterStatus: role === 'Student' ? 'not_requested' : 'assigned' });
    saveData();
    $('#signupForm').reset();
    $('#signupRole').value = 'Student';
    $('#signupGroupLabel').classList.remove('hidden');
    $('#signupGroup').required = true;
    document.body.classList.add('logged-out');
    $('#authModal').classList.remove('hidden'); setAuthMode('login');
    $('#loginRole').value = role;
    $('#loginEmail').value = username;
    showToast(`${role === 'Teacher' ? 'Faculty' : 'Student'} account created for ${name}. You can now sign in.`);
  });
  $('#profilePhotoInput').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.');
      event.target.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      showToast('Please choose an image smaller than 1 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      currentUser().photo = reader.result;
      saveData();
      renderAll();
      showToast('Profile picture updated.');
      event.target.value = '';
    };
    reader.onerror = () => showToast('The picture could not be loaded. Please try again.');
    reader.readAsDataURL(file);
  });
  $('#removeProfilePhoto').addEventListener('click', () => {
    delete currentUser().photo;
    saveData();
    renderAll();
    showToast('Profile picture removed.');
  });
  $('#profileForm').addEventListener('submit', event => {
    event.preventDefault();
    const user = currentUser();
    const newEmail = $('#profileEmail').value.trim().toLowerCase();
    const newUsername = $('#profileUsername').value.trim().toLowerCase();
    if (!isAuwAcademicEmail(newEmail)) return showToast('Please use your AUW academic email ending in @auw.edu.bd.');
    if (!/^[a-z0-9._-]{3,24}$/.test(newUsername)) return showToast('Username must be 3–24 characters and use only letters, numbers, dots, underscores or hyphens.');
    if (data.users.some(item => item.id !== user.id && String(item.email || '').toLowerCase() === newEmail)) {
      showToast('That email address is already used by another account.');
      return;
    }
    if (data.users.some(item => item.id !== user.id && String(item.username || String(item.email || '').split('@')[0]).toLowerCase() === newUsername)) {
      showToast('That username is already taken. Please choose another.');
      return;
    }
    user.name = $('#profileName').value.trim();
    user.email = newEmail;
    user.username = newUsername;
    saveData(); renderAll(); showToast('Profile updated.');
  });
  $('#accountDeletionForm').addEventListener('submit', event => {
    event.preventDefault();
    const user = currentUser();
    const password = $('#deleteAccountPassword').value;
    if (!user || !user.password || String(user.password) !== password) return showToast('The password does not match this account. No request was submitted.');
    const existing = data.accountDeletionRequests.find(request => request.userId === user.id && request.status === 'pending');
    if (existing) return showToast('You already have a deletion request awaiting institutional review.');
    const request = { id: `del${Date.now()}`, userId: user.id, reason: $('#deleteAccountReason').value.trim(), requestedAt: new Date().toISOString(), status: 'pending' };
    data.accountDeletionRequests.push(request);
    addNotification(user.id, 'Account deletion request submitted', 'Your request has been sent for institutional review. Your account remains active until a decision is made.', 'profile', request.id);
    saveData();
    $('#deleteAccountPassword').value = '';
    $('#deleteAccountReason').value = '';
    $('#accountDeletionStatus').textContent = 'Your request is pending institutional review. You can continue using your account until a decision is made.';
    renderAdminDeletionQueue();
    showToast('Account deletion request submitted for review.');
  });

  $('#chatFile').addEventListener('change', () => {
    const file = $('#chatFile').files[0];
    $('#chatFileName').textContent = file ? `Selected: ${file.name} · ${(file.size / 1024).toFixed(0)} KB` : 'You can attach a picture or document (maximum 700 KB).';
    if (file && file.size > 700 * 1024) {
      showToast('Please choose a file smaller than 700 KB for this browser demo.');
      $('#chatFile').value = '';
      $('#chatFileName').textContent = 'You can attach a picture or document (maximum 700 KB).';
    }
  });
  $('#chatForm').addEventListener('submit', event => {
    event.preventDefault();
    const chat = data.conversations.find(item => item.id === currentChatId && currentUser().role === 'Student' && isStudentOnlyConversation(item) && item.memberIds.includes(currentUser().id));
    const text = $('#chatInput').value.trim();
    const file = $('#chatFile').files[0];
    if (!chat) return;
    if (!text && !file) return showToast('Write a message or attach a file first.');
    if (file && file.size > 700 * 1024) return showToast('File must be smaller than 700 KB.');
    const sendMessage = attachment => {
      chat.messages.push({ id: `m${Date.now()}`, senderId: currentUser().id, text, attachment, time: new Date().toLocaleString() });
      chat.memberIds.filter(id => id !== currentUser().id).forEach(id => addNotification(id, chat.type === 'group' ? `New message in ${chat.title}` : 'New student message', `${currentUser().name} sent you a message${attachment ? ' with an attachment' : ''}.`, 'messages', chat.id));
      $('#chatInput').value = '';
      $('#chatFile').value = '';
      $('#chatFileName').textContent = 'You can attach a picture or document (maximum 700 KB).';
      try {
        saveData();
        renderConversations(); renderOverview();
      } catch (error) {
        chat.messages.pop();
        showToast('Browser storage is full. Remove older data or choose a smaller file.');
      }
    };
    if (!file) return sendMessage(null);
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt|xls|xlsx|ppt|pptx|zip)$/i.test(file.name);
    if (!allowed) return showToast('This file type is not supported.');
    const reader = new FileReader();
    reader.onload = () => sendMessage({ name: file.name, type: file.type || '', size: file.size, data: reader.result });
    reader.onerror = () => showToast('The file could not be read. Please try again.');
    reader.readAsDataURL(file);
  });
  $('#newChatBtn').addEventListener('click', openContactPicker);
  $('#createGroupChatTopBtn').addEventListener('click', createGroupChat);
  $('#closeContactPicker').addEventListener('click', () => $('#contactPicker').classList.add('hidden'));
  $('#contactSearch').addEventListener('input', event => renderContactPicker(event.target.value));
  $('#createGroupChatBtn').addEventListener('click', createGroupChat);
  $('#chatGroupActions').addEventListener('click', event => {
    const user = currentUser();
    const chat = data.conversations.find(item => item.id === currentChatId && item.type === 'group' && isStudentOnlyConversation(item) && item.memberIds.includes(user.id));
    if (event.target.closest('[data-toggle-members]')) {
      const panel=$('#chatMemberList');
      if(panel) panel.classList.toggle('hidden');
      return;
    }
    if (!chat || user.role !== 'Student' || chat.isGeneral) return;
    if (event.target.closest('[data-manage-group]')) {
      if (chat.ownerId !== user.id) return showToast('Only the group creator can manage members.');
      const action = prompt('Type ADD to invite students or REMOVE to remove a member.');
      if (!action) return;
      if (action.trim().toLowerCase() === 'add') {
        const candidates = data.users.filter(person => person.role === 'Student' && !chat.memberIds.includes(person.id));
        if (!candidates.length) return showToast('There are no other student accounts to add.');
        const list = candidates.map((person,index)=>`${index+1}. ${person.name} (${person.group})`).join('\n');
        const answer = prompt(`Choose student numbers to add, separated by commas:\n${list}`);
        if (answer === null) return;
        const added = answer.split(',').map(v=>candidates[Number(v.trim())-1]).filter(Boolean);
        added.forEach(person=>{if(!chat.memberIds.includes(person.id)){chat.memberIds.push(person.id);addNotification(person.id,'Added to student group',`You were added to “${chat.title}”.`,'messages',chat.id);}});
        saveData(); renderConversations(); showToast('Group membership updated.');
      } else if (action.trim().toLowerCase() === 'remove') {
        const candidates = chat.memberIds.filter(id=>id!==user.id).map(id=>getUser(id)).filter(Boolean);
        if (!candidates.length) return showToast('There are no other members to remove.');
        const list = candidates.map((person,index)=>`${index+1}. ${person.name}`).join('\n');
        const answer = prompt(`Choose a member number to remove:\n${list}`);
        if (answer === null) return;
        const person = candidates[Number(answer.trim())-1];
        if (!person) return showToast('Choose a valid member number.');
        chat.memberIds = chat.memberIds.filter(id=>id!==person.id);
        addNotification(person.id,'Removed from student group',`You were removed from “${chat.title}”.`,'messages',chat.id);
        if (chat.memberIds.length < 2) data.conversations = data.conversations.filter(item=>item.id!==chat.id);
        saveData(); renderConversations(); showToast('Group member removed.');
      } else return showToast('Please type ADD or REMOVE.');
    }
    if (event.target.closest('[data-leave-group]')) {
      if (!confirm(`Leave “${chat.title}”?`)) return;
      chat.memberIds = chat.memberIds.filter(id=>id!==user.id);
      if (chat.ownerId === user.id) chat.ownerId = chat.memberIds[0] || '';
      if (chat.memberIds.length < 2) data.conversations = data.conversations.filter(item=>item.id!==chat.id);
      currentChatId = ''; saveData(); renderConversations(); showToast('You left the group.');
    }
  });
  $('#contactResults').addEventListener('click', event => {
    const contactButton = event.target.closest('[data-start-private-chat]');
    if (!contactButton) return;
    createPrivateChat(contactButton.dataset.startPrivateChat);
  });
  $('#gradeForm').addEventListener('submit', event => {
    event.preventDefault();
    if (currentUser().role !== 'Teacher') return showToast('Only faculty can enter or update marks.');
    const obtained = Number($('#obtainedMarks').value), total = Number($('#totalMarks').value);
    if (total <= 0 || obtained < 0 || obtained > total) return showToast('Obtained marks must be between zero and the total marks.');
    const studentId = $('#gradeStudent').value, courseId = $('#gradeCourse').value;
    const selectedTrimester = $('#gradeTrimester').value.trim() || data.registrationSettings.trimester;
    const existing = data.grades.find(item => item.studentId === studentId && item.courseId === courseId && (item.trimester || 'Fall 2026') === selectedTrimester);
    if (currentUser().role !== 'Teacher') return showToast('Only faculty can enter or update marks.');
    if (existing) { existing.obtained = obtained; existing.total = total; existing.feedback = $('#gradeFeedback').value.trim(); existing.trimester = selectedTrimester; existing.enteredById = currentUser().id; existing.published = false; }
    else data.grades.push({ id: `g${Date.now()}`, studentId, courseId, obtained, total, feedback: $('#gradeFeedback').value.trim(), trimester: selectedTrimester, enteredById: currentUser().id, published: false });
    const result = gradeFor(obtained, total);
    addNotification(studentId, existing ? 'Marks updated' : 'New marks recorded', `${courseName(courseId)}: ${obtained}/${total} (${result.percentage.toFixed(1)}%). These marks are not an official published result yet.`, 'grades', existing?.id || '');
    addNotification(currentUser().id, 'Marks saved', `You saved ${courseName(courseId)} marks for ${getUser(studentId)?.name || 'a student'}.`, 'grades', existing?.id || '');
    saveData(); renderAll(); $('#gradeForm').reset(); showToast(`Saved: ${result.percentage.toFixed(1)}% · ${result.letter} · Grade points ${result.gpa.toFixed(1)}`);
  });
  if ($('#componentMarkForm')) $('#componentMarkForm').onsubmit = event => {
    event.preventDefault();
    const user = currentUser();
    if (user.role !== 'Teacher') return showToast('Only faculty can enter component marks.');
    const studentId=$('#componentStudent').value, courseId=$('#componentCourse').value, category=$('#componentCategory').value, rawScore=$('#componentScore').value.trim(), percentage=rawScore===''?null:Number(rawScore), trimester=$('#componentTrimester').value.trim();
    if(!studentId||!courseId||!trimester) return showToast('Select a student, course and trimester.');
    if(rawScore!==''&&(!Number.isFinite(percentage)||percentage<0||percentage>100)) return showToast('Enter a valid mark from 0 to 100, or leave it blank to clear the mark.');
    const existing=data.componentMarks.find(m=>m.studentId===studentId&&m.courseId===courseId&&m.category===category&&m.trimester===trimester);
    const previous = existing ? {...existing} : null;
    if(rawScore==='') {
      // Keep an explicit blank marker so the component is not silently treated
      // as zero and an assessment mark does not reappear behind the blank.
      if(existing){ existing.percentage=null; existing.cleared=true; existing.enteredById=user.id; existing.updatedAt=new Date().toISOString(); }
      else data.componentMarks.push({id:`cm${Date.now()}`,studentId,courseId,category,percentage:null,cleared:true,trimester,enteredById:user.id,updatedAt:new Date().toISOString()});
      try { saveData(); persistComponentMarksBackup(); }
      catch(error) { if(existing&&previous) Object.assign(existing,previous); else data.componentMarks=data.componentMarks.filter(m=>!(m.studentId===studentId&&m.courseId===courseId&&m.category===category&&m.trimester===trimester&&m.cleared===true)); return showToast(error.message||'Could not save the cleared mark.'); }
      renderAll();
      showToast(`${category} mark cleared and left blank. It will not be counted as zero.`);
      return;
    }
    if(existing){existing.percentage=percentage;delete existing.cleared;existing.enteredById=user.id;existing.updatedAt=new Date().toISOString();}
    else data.componentMarks.push({id:`cm${Date.now()}`,studentId,courseId,category,percentage,trimester,enteredById:user.id,updatedAt:new Date().toISOString()});
    // Save the mark independently first. If the full portal record is too large,
    // keep the mark in a small dedicated browser-storage record instead.
    let markStorage = 'local';
    try {
      saveData();
      try { persistComponentMarksBackup(); } catch (backupError) { console.warn('The main portal data saved; the extra component-mark backup was skipped.', backupError); }
    } catch (saveError) {
      try { markStorage = persistComponentMarksBackup(); }
      catch (backupError) {
        if(existing && previous) Object.assign(existing, previous);
        else data.componentMarks = data.componentMarks.filter(m=>!(m.studentId===studentId&&m.courseId===courseId&&m.category===category&&m.trimester===trimester&&m.enteredById===user.id));
        console.error('Component mark persistence failed:', saveError, backupError);
        return showToast(backupError.message || 'Could not save the mark. Please check this browser’s available storage.');
      }
    }
    const notification = {id:`nt${Date.now()}${Math.random().toString(36).slice(2,7)}`,userId:studentId,title:'Course component mark updated',message:`${courseName(courseId)} · ${category}: ${percentage.toFixed(1)}%. Midterm progress is visible after faculty releases it.`,type:'grades',relatedId:courseId,createdAt:new Date().toISOString(),read:false};
    data.notifications = Array.isArray(data.notifications) ? data.notifications : [];
    data.notifications.unshift(notification);
    data.notifications = data.notifications.slice(0,500);
    try { saveData(); } catch(error) { data.notifications = data.notifications.filter(n=>n.id!==notification.id); console.warn('Mark saved; notification could not be stored:',error); }
    try { renderAll(); } catch (error) { console.error('Component mark saved, but the page could not refresh:', error); }
    showToast(markStorage === 'session'
      ? 'Component mark saved as a draft for this browser session. Keep this tab open; the main browser storage is full.'
      : 'Component mark saved as a draft. Release progress when you are ready for the student to see it.');
  };
  if ($('#componentStudent')) $('#componentStudent').onchange = renderComponentMarksPanel;
  if ($('#componentCourse')) $('#componentCourse').onchange = renderComponentMarksPanel;
  if ($('#componentTrimester')) $('#componentTrimester').onchange = renderComponentMarksPanel;
  $('#facultyMaterialForm').addEventListener('submit', event => {
    event.preventDefault();
    const user = currentUser();
    if (user.role !== 'Teacher') return showToast('Only faculty can share course materials.');
    const title = $('#materialTitle').value.trim(), courseId = $('#materialCourse').value, group = $('#materialGroup').value, description = $('#materialDescription').value.trim(), file = $('#materialFile').files[0];
    if (!title || !courseId || !group) return showToast('Please complete the course, group and material title.');
    if (file && file.size > 700 * 1024) return showToast('Please choose a file smaller than 700 KB.');
    const existing = editingMaterialId ? data.courseMaterials.find(item => item.id === editingMaterialId && item.authorId === user.id) : null;
    if (!existing && !file) return showToast('Please attach a file before sharing the material.');
    const saveMaterial = fileData => {
      let materialId;
      if (existing) {
        const previousGroup = existing.group;
        Object.assign(existing, {title, courseId, group, description, updatedAt: Date.now(), date: new Date().toLocaleDateString()});
        if (file) { existing.fileName = file.name; existing.fileData = fileData || ''; }
        materialId = existing.id;
        if (previousGroup !== group) data.users.filter(student => student.role === 'Student' && student.group === previousGroup).forEach(student => addNotification(student.id, 'Learning material updated', `${title} is no longer assigned to your group.`, 'materials', materialId));
        data.users.filter(student => student.role === 'Student' && student.group === group).forEach(student => addNotification(student.id, 'Learning material updated', `${title} has been updated for ${courseName(courseId)}.`, 'materials', materialId));
      } else {
        materialId = `mat${Date.now()}`;
        data.courseMaterials.unshift({ id: materialId, title, courseId, group, description, fileName: file?.name || '', fileData: fileData || '', authorId: user.id, date: new Date().toLocaleDateString(), createdAt: Date.now() });
        data.users.filter(student => student.role === 'Student' && student.group === group).forEach(student => addNotification(student.id, 'New learning material', `${title} is now available for ${courseName(courseId)}.`, 'materials', materialId));
      }
      addNotification(user.id, existing ? 'Learning material updated' : 'Learning material shared', `${title} was ${existing ? 'updated' : 'shared'} for ${group}.`, 'materials', materialId);
      editingMaterialId = ''; saveData(); $('#facultyMaterialForm').reset(); $('#materialSubmitButton').textContent = 'Share with students'; $('#cancelMaterialEdit').classList.add('hidden'); renderFacultyMaterials(); renderCourseMaterials(); showToast(existing ? 'Course material updated.' : 'Course material shared with the selected student group.');
    };
    if (!file) return saveMaterial(existing?.fileData || '');
    const reader = new FileReader(); reader.onload = () => saveMaterial(String(reader.result || '')); reader.onerror = () => showToast('The selected file could not be read. Please try again.'); reader.readAsDataURL(file);
  });
  $('#cancelMaterialEdit').addEventListener('click', () => { editingMaterialId = ''; $('#facultyMaterialForm').reset(); $('#materialSubmitButton').textContent = 'Share with students'; $('#cancelMaterialEdit').classList.add('hidden'); });
  $('#addUserForm').addEventListener('submit', event => {
    event.preventDefault();
    if (currentUser().role !== 'Admin') return showToast('Admin access required.');
    const email = $('#newUserEmail').value.trim().toLowerCase();
    const username = $('#newUserUsername').value.trim().toLowerCase();
    if (!isAuwAcademicEmail(email)) return showToast('Only AUW academic emails ending in @auw.edu.bd are allowed.');
    if (data.users.some(user => String(user.email || '').toLowerCase() === email)) return showToast('This email already exists.');
    if (!/^[a-z0-9._-]{3,24}$/.test(username)) return showToast('Username must be 3–24 characters and use only letters, numbers, dots, underscores or hyphens.');
    if (data.users.some(user => String(user.username || '').toLowerCase() === username)) return showToast('That username is already taken. Please choose another.');
    const selectedRole = $('#newUserRole').value;
    const role = ['Teacher','Faculty'].includes(selectedRole) ? 'Teacher' : selectedRole;
    if (role === 'Admin') return showToast('The protected Admin account cannot be created or duplicated here.');
    if ($('#newUserPassword').value.length < 6) return showToast('Initial password must contain at least 6 characters.');
    data.users.push({ id: `u${Date.now()}`, name: $('#newUserName').value.trim(), email, username, password: $('#newUserPassword').value, role, group: role === 'Student' ? $('#newUserGroup').value : 'Faculty' });
    saveData(); $('#addUserForm').reset(); renderAll(); showToast('User added to the demo directory.');
  });
  $('#addCourseForm').addEventListener('submit', event => {
    event.preventDefault();
    if (currentUser().role !== 'Admin') return showToast('Admin access required.');
    const code = $('#newCourseCode').value.trim().toUpperCase();
    const name = $('#newCourseName').value.trim();
    if (!code || !name) return showToast('Enter both a course name and course code.');
    if (data.courses.some(course => course.code.toUpperCase() === code && course.id !== editingCourseId)) return showToast('That course code already exists.');
    if (editingCourseId) {
      const course = data.courses.find(item => item.id === editingCourseId);
      if (!course) return showToast('Course not found. Please try again.');
      Object.assign(course, { code, name, teacherId: $('#newCourseTeacher').value });
      // Keep every session linked to the faculty member selected by Admin.
      data.schedules.filter(item => item.courseId === course.id).forEach(item => { item.teacherId = course.teacherId || ''; });
      editingCourseId = '';
      showToast('Course updated.');
    } else {
      const newCourse = { id: `c${Date.now()}`, code, name, teacherId: $('#newCourseTeacher').value, credits: 1 };
      data.courses.push(newCourse);
      // Newly created subjects immediately receive the same six session choices.
      REGISTRATION_SECTIONS.forEach(group => DEFAULT_CLASS_SESSIONS.forEach(([start, end, room], index) => {
        data.schedules.push({ id:`default_${newCourse.id}_${group.replace(/[^a-z0-9]/gi,'')}_${index+1}`, courseId:newCourse.id, days:'SMTW', day:'SMTW', start, end, room, teacherId:newCourse.teacherId || '', group });
      }));
      showToast('Course added with six SMTW sessions for every UG section.');
    }
    $('#addCourseForm').reset(); $('#addCourseForm').querySelector('button').textContent = 'Add course'; saveData(); renderAll();
  });
  $('#announcementForm').addEventListener('submit', event => {
    event.preventDefault();
    if (currentUser().role !== 'Admin') {
      showToast('Admin access required. Use Switch account → Open Admin Control Panel.');
      return;
    }
    const title = $('#announcementTitle').value.trim();
    const text = $('#announcementText').value.trim();
    const category = $('#announcementCategory').value || 'General';
    if (!title || !text) {
      showToast('Please enter both an announcement title and details.');
      return;
    }
    if (editingAnnouncementId) {
      const item = data.announcements.find(row => row.id === editingAnnouncementId);
      if (!item) {
        showToast('This announcement could not be found. Please create it again.');
        editingAnnouncementId = '';
        return;
      }
      Object.assign(item, { title, text, category, updatedDate: new Date().toLocaleDateString() });
    } else {
      data.announcements.unshift({ id: `an${Date.now()}`, title, text, category, date: new Date().toLocaleDateString() });
    }
    try {
      saveData();
      $('#announcementForm').reset();
      editingAnnouncementId = '';
      $('#announcementFormHeading').textContent = 'Publish announcement';
      $('#announcementSubmit').textContent = 'Publish announcement';
      $('#cancelAnnouncementEdit').classList.add('hidden');
      renderAll();
      goTo('admin');
      showToast('Announcement published successfully.');
    } catch (error) {
      showToast('Could not save. Browser storage may be full. Remove some large attachments and try again.');
    }
  });
  $('#cancelAnnouncementEdit').addEventListener('click', () => {
    editingAnnouncementId = '';
    $('#announcementForm').reset();
    $('#announcementFormHeading').textContent = 'Publish announcement';
    $('#announcementSubmit').textContent = 'Publish announcement';
    $('#cancelAnnouncementEdit').classList.add('hidden');
  });
  $('#announcementSearch').addEventListener('input', renderAnnouncements);
  $('#announcementFilter').addEventListener('change', renderAnnouncements);

  $('#assessmentCreateForm').addEventListener('submit', event => {
    event.preventDefault();
    const user = currentUser();
    if (user.role !== 'Teacher') return showToast('Only faculty can create assessments.');
    const editId = $('#assessmentEditId')?.value || '';
    const existing = editId ? data.assessments.find(a => a.id === editId && a.createdBy === user.id) : null;
    if (editId && !existing) return showToast('This assessment could not be found.');
    const total = Number($('#assessmentTotal').value);
    const deadline = $('#assessmentDeadline').value;
    const file = $('#assessmentAttachment').files[0];
    const title = $('#assessmentTitle').value.trim();
    const courseId = $('#assessmentCourse').value;
    const group = $('#assessmentGroup').value;
    const instructions = $('#assessmentInstructions').value.trim();
    if (!title || !courseId || !group || !Number.isFinite(total) || total <= 0 || !deadline || !instructions) return showToast('Complete all required assessment details.');
    if (new Date(deadline).getTime() <= Date.now()) return showToast('Choose a future deadline.');
    if (file && file.size > 1024 * 1024) return showToast('Please keep the assessment attachment under 1 MB.');
    if (existing && (existing.submissions || []).length && (existing.courseId !== courseId || existing.group !== group || Number(existing.total) !== total)) {
      return showToast('Course, group and total marks cannot be changed after students have submitted.');
    }
    const saveAssessment = fileData => {
      const assessmentId = existing?.id || `as${Date.now()}`;
      if (existing) {
        Object.assign(existing, { title, courseId, group, type: $('#assessmentType').value, category: $('#assessmentCategory').value, total, deadline, instructions });
        if (file) { existing.attachmentName = file.name; existing.attachmentData = fileData || ''; }
      } else {
        data.assessments.push({ id: assessmentId, title, courseId, group, type: $('#assessmentType').value, category: $('#assessmentCategory').value, total, deadline, instructions, attachmentName: file?.name || '', attachmentData: fileData || '', createdBy: user.id, trimester: data.registrationSettings?.trimester || 'Fall 2026', submissions: [] });
      }
      data.users.filter(student => student.role === 'Student' && student.group === group).forEach(student => addNotification(student.id, existing ? 'Assessment updated' : 'New assessment published', `${title} · Deadline: ${new Date(deadline).toLocaleString()}`, 'assessment', assessmentId));
      addNotification(user.id, existing ? 'Assessment update saved' : 'Assessment published', `${title} is now ${existing ? 'updated' : 'available'} for ${group}.`, 'assessment', assessmentId);
      saveData();
      $('#assessmentCreateForm').reset();
      if ($('#assessmentEditId')) $('#assessmentEditId').value = '';
      $('#assessmentCreateForm').querySelector('button[type="submit"],button:not([type])').textContent = 'Publish assessment';
      $('#cancelAssessmentEdit')?.classList.add('hidden');
      $('#assessmentCourse').disabled = false; $('#assessmentGroup').disabled = false; $('#assessmentTotal').disabled = false;
      renderAssessments();
      renderOverview();
      showToast(existing ? 'Assessment updated. Students have been notified.' : 'Assessment published. Students have been notified.');
    };
    if (file) {
      const reader = new FileReader();
      reader.onload = () => saveAssessment(String(reader.result || ''));
      reader.onerror = () => showToast('The selected assessment file could not be read. Please choose it again.');
      reader.readAsDataURL(file);
    } else saveAssessment('');
  });
  $('#assessmentList').addEventListener('click', event => {
    const submitButton = event.target.closest('[data-submit-assessment]');
    if (submitButton) {
      const assessment = data.assessments.find(item => item.id === submitButton.dataset.submitAssessment && studentMatchesAssessmentGroup(currentUser(), item));
      if (!assessment) return showToast('Assessment not found for your group.');
      if (new Date(assessment.deadline).getTime() < Date.now()) return showToast('The submission deadline has passed.');
      $('#submissionAssessmentId').value = assessment.id;
      $('#assessmentSubmissionPanel').classList.remove('hidden');
      $('#assessmentSubmissionPanel').scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    const editButton = event.target.closest('[data-edit-assessment]');
    if (editButton && currentUser().role === 'Teacher') {
      const a = data.assessments.find(item => item.id === editButton.dataset.editAssessment && item.createdBy === currentUser().id);
      if (!a) return showToast('Assessment not found.');
      $('#assessmentEditId').value = a.id;
      $('#assessmentTitle').value = a.title;
      $('#assessmentCourse').value = a.courseId;
      $('#assessmentGroup').value = a.group;
      $('#assessmentType').value = a.type || 'Assignment';
      $('#assessmentCategory').value = a.category || 'Quiz';
      $('#assessmentTotal').value = a.total;
      $('#assessmentDeadline').value = a.deadline;
      $('#assessmentInstructions').value = a.instructions || '';
      const hasSubmissions = (a.submissions || []).length > 0;
      $('#assessmentCourse').disabled = hasSubmissions;
      $('#assessmentGroup').disabled = hasSubmissions;
      $('#assessmentTotal').disabled = hasSubmissions;
      $('#assessmentCreateForm').querySelector('button[type="submit"],button:not([type])').textContent = 'Save assessment changes';
      $('#cancelAssessmentEdit').classList.remove('hidden');
      $('#assessmentCreatePanel').scrollIntoView({behavior:'smooth',block:'start'});
      if (hasSubmissions) showToast('This assessment already has submissions. Course, group and total marks are locked.');
      return;
    }
    const deleteButton = event.target.closest('[data-delete-assessment]');
    if (deleteButton && currentUser().role === 'Teacher') {
      const a = data.assessments.find(item => item.id === deleteButton.dataset.deleteAssessment && item.createdBy === currentUser().id);
      if (!a) return showToast('Assessment not found.');
      if (!confirm(`Delete “${a.title}” and its ${(a.submissions || []).length} submission(s)? This cannot be undone.`)) return;
      data.users.filter(student => student.role === 'Student' && student.group === a.group).forEach(student => addNotification(student.id, 'Assessment removed', `${a.title} has been removed by your faculty member.`, 'assessment', a.id)); addNotification(currentUser().id, 'Assessment removed', `You removed ${a.title}.`, 'assessment', a.id);
      data.assessments = data.assessments.filter(item => item.id !== a.id);
      saveData(); renderAssessments(); showToast('Assessment deleted.');
    }
  });
  $('#cancelAssessmentEdit')?.addEventListener('click', () => {
    $('#assessmentCreateForm').reset();
    $('#assessmentEditId').value = '';
    $('#assessmentCourse').disabled = false; $('#assessmentGroup').disabled = false; $('#assessmentTotal').disabled = false;
    $('#assessmentCreateForm').querySelector('button[type="submit"],button:not([type])').textContent = 'Publish assessment';
    $('#cancelAssessmentEdit').classList.add('hidden');
  });
  $('#assessmentSubmissionForm').addEventListener('submit', event => {
    event.preventDefault(); const user = currentUser(); if (user.role !== 'Student') return showToast('Only students can submit assessment work.');
    const a = data.assessments.find(item => item.id === $('#submissionAssessmentId').value && item.group === user.group); if (!a) return showToast('Assessment not found.'); if (new Date(a.deadline).getTime() < Date.now()) return showToast('The submission deadline has passed.');
    const answer = $('#assessmentAnswer').value.trim(); const file = $('#assessmentFile').files[0]; if (!answer && !file) return showToast('Write an answer or attach your work.'); if (file && file.size > 1024*1024) return showToast('Please keep the file under 1 MB.');
    if (!a.submissions) a.submissions = []; const old = a.submissions.find(x => x.studentId === user.id); if (old) return showToast('You have already submitted this assessment. Contact faculty if you need a correction.');
    const saveSubmission = fileData => { a.submissions.push({ studentId:user.id, answer, fileName:file?.name || '', fileData:fileData || '', submittedAt:new Date().toISOString(), marks:null, feedback:'' }); addNotification(a.createdBy, 'Assessment submission received', `${user.name} submitted work for ${a.title}.`, 'assessment', a.id); addNotification(user.id, 'Submission successful', `Your work for ${a.title} was submitted and is awaiting faculty review.`, 'assessment', a.id); saveData(); $('#assessmentSubmissionForm').reset(); $('#assessmentSubmissionPanel').classList.add('hidden'); renderAssessments(); showToast('Your assessment has been submitted.'); };
    if (file) { const reader = new FileReader(); reader.onload = () => saveSubmission(String(reader.result || '')); reader.onerror = () => showToast('The selected file could not be read.'); reader.readAsDataURL(file); } else saveSubmission('');
  });
  $('#assessmentSubmissions').addEventListener('click', event => {
    const button = event.target.closest('[data-grade-submission]'); if (!button) return; const [assessmentId,studentId] = button.dataset.gradeSubmission.split('|'); const a = data.assessments.find(x=>x.id===assessmentId); const sub = a?.submissions?.find(x=>x.studentId===studentId); if (!a || !sub) return;
    const raw = prompt(`Enter marks out of ${a.total}:`, sub.marks ?? ''); if (raw === null) return; const marks = Number(raw); if (!Number.isFinite(marks) || marks < 0 || marks > Number(a.total)) return showToast('Marks must be between 0 and the total marks.'); const feedback = prompt('Enter feedback for the student:', sub.feedback || '') ?? sub.feedback; sub.marks = marks; sub.feedback = feedback; const category=componentKey(a.category || 'Quiz'); if(category!=='Final Exam' && COMPONENT_WEIGHTS[category]) { const oldManual=data.componentMarks.find(m=>m.studentId===studentId&&m.courseId===a.courseId&&m.category===category&&(m.trimester||'Fall 2026')===(a.trimester||'Fall 2026')); if(oldManual) { /* assessed work takes precedence only when no manual override exists */ } } addNotification(studentId, 'Assessment reviewed', `${a.title}: ${marks}/${a.total}. ${feedback ? 'Faculty feedback is available.' : 'Your marks are available.'}`, 'assessment', a.id); addNotification(currentUser().id, 'Review saved', `You reviewed ${getUser(studentId)?.name || 'the student'}’s submission for ${a.title}.`, 'assessment', a.id); saveData(); renderAssessments(); renderComponentMarksPanel(); showToast('Assessment marked and feedback saved.');
  });

  $('#registrationSection').addEventListener('change', () => { selectedRegistrationSessions = {}; selectedRegistrationSeats = {}; registrationSessionFilters = {}; renderRegistration(); });
  $('#registrationForm').addEventListener('submit', event => {
    event.preventDefault();
    const user = currentUser();
    if (user.role !== 'Student') return showToast('Only student accounts can register for classes.');
    const settings = data.registrationSettings;
    if (!settings.open) return showToast('Registration is currently closed.');
    const existingRegistration = getStudentRegistration();
    const section = $('#registrationSection').value;
    if (!REGISTRATION_SECTIONS.includes(section)) return showToast('Your UG section must be assigned before registration.');
    if (!data.courses.length) return showToast('No subjects are available. Please contact the campus support team.');
    const selections = [];
    for (const course of data.courses) {
      const scheduleId = selectedRegistrationSessions[course.id];
      const seat = Number(selectedRegistrationSeats[course.id]);
      const session = getCourseSessions(course.id, section).find(item => item.id === scheduleId);
      if (!session) return showToast(`No class session is assigned for ${course.name}. Please contact the campus support team.`);
      if (!seat) return showToast(`Please select one seat for ${course.name}.`);
      if (registrationSeatIsTaken(course.id, scheduleId, seat, section, user.id)) return showToast(`Seat ${seat} for ${course.name} has just been occupied. Please choose another seat.`);
      selections.push({ courseId: course.id, scheduleId, seat });
    }
    if (existingRegistration) {
      existingRegistration.section = section;
      existingRegistration.subjectSelections = selections;
      existingRegistration.updatedAt = new Date().toISOString();
    } else {
      data.registrations.push({ id:`reg${Date.now()}`, studentId:user.id, trimester:settings.trimester, section, subjectSelections:selections, status:'pending', createdAt:new Date().toISOString() });
    }
    if (existingRegistration) existingRegistration.status = 'pending';
    selectedRegistrationSessions = {}; selectedRegistrationSeats = {};
    saveData(); renderAll(); showToast(existingRegistration ? 'Your changes were submitted for Admin approval.' : 'Registration submitted. Please wait for Admin approval.');
  });
  $('#cancelClassRegistration').addEventListener('click', () => {
    const registration = getStudentRegistration();
    if (currentUser().role !== 'Student' || !data.registrationSettings.open || !registration) return;
    if (!confirm('Cancel your class registration for this trimester? Your selected seats will become available to other students.')) return;
    data.registrations = data.registrations.filter(item => item.id !== registration.id);
    selectedRegistrationSessions = {}; selectedRegistrationSeats = {};
    saveData(); renderAll(); showToast('Your class registration has been cancelled. You may register again while registration is open.');
  });

  function updateRegistrationSettings(open) {
    if (currentUser().role !== 'Admin') return showToast('Admin access required.');
    const capacity = Number($('#adminCapacity').value);
    const trimester = $('#adminTrimester').value.trim();
    if (!trimester || !Number.isInteger(capacity) || capacity < 1 || capacity > 20) return showToast('Enter a trimester and a capacity between 1 and 20.');
    data.registrationSettings = { ...data.registrationSettings, open, trimester, capacity };
    saveData(); renderAll();
    showToast(open ? 'Student registration is now open.' : 'Student registration is now closed.');
  }
  $('#openStudentRegistration').addEventListener('click', () => updateRegistrationSettings(true));
  $('#closeStudentRegistration').addEventListener('click', () => updateRegistrationSettings(false));
  $('#saveRegistrationDetails').addEventListener('click', () => updateRegistrationSettings(Boolean(data.registrationSettings.open)));

  $('#adminSessionCourseFilter').addEventListener('change', () => renderAdminSessionFaculty());
  $('#adminSessionGroupFilter').addEventListener('change', () => renderAdminSessionFaculty());

  $('#adminSessionFacultyBody').addEventListener('click', event => {
    const button = event.target.closest('[data-save-session-faculty]');
    if (!button) return;
    if (currentUser().role !== 'Admin') return showToast('Admin access required.');
    const schedule = data.schedules.find(item => item.id === button.dataset.saveSessionFaculty);
    const select = $('#adminSessionFacultyBody').querySelector(`[data-session-faculty="${button.dataset.saveSessionFaculty}"]`);
    if (!schedule || !select) return;
    const facultyId = select.value;
    if (facultyId && !data.users.some(user => user.id === facultyId && user.role === 'Teacher')) return showToast('Select a valid faculty account.');
    schedule.teacherId = facultyId;
    saveData(); renderAll(); showToast('Faculty assignment saved for this subject, section and session.');
  });

  $('#adminScheduleForm').addEventListener('submit', event => {
    event.preventDefault();
    if (currentUser().role !== 'Admin') return showToast('Admin access required.');
    const [start, end] = $('#adminScheduleSession').value.split('|');
    const courseId = $('#adminScheduleCourse').value;
    const days = $('#adminScheduleDays').value.trim().toUpperCase().replace(/[ ,]+/g, '');
    if (!days) return showToast('Weekly class days are set to SMTW.');
    data.schedules.push({ id: `sc${Date.now()}`, courseId, days: 'SMTW', day: 'SMTW', start, end, room: $('#adminScheduleRoom').value.trim(), teacherId: $('#adminScheduleFaculty').value || '', group: $('#adminScheduleGroup').value });
    saveData(); $('#adminScheduleForm').reset(); renderAll(); showToast('Class schedule added.');
  });

  document.addEventListener('change', event => { if (['bookingFaculty','bookingDate'].includes(event.target.id)) renderAppointments(); });
  document.addEventListener('click', event => {
    const markRead = event.target.closest('[data-read-notification]');
    if (markRead) { const item = data.notifications.find(n => n.id === markRead.dataset.readNotification && n.userId === currentUser().id); if (item) { item.read = true; saveData(); renderNotifications(); } return; }
    const markAll = event.target.closest('#markAllNotificationsRead');
    if (markAll) { data.notifications.filter(n => n.userId === currentUser().id).forEach(n => n.read = true); saveData(); renderNotifications(); return; }
    const addSlot=event.target.closest('#addOfficeSlot'); if(addSlot){const wrap=$('#officeSlotInputs');if(wrap){const count=wrap.querySelectorAll('.office-slot-row').length+1;const row=document.createElement('div');row.className='form-row office-slot-row';row.innerHTML=`<label>Time slot ${count}<input type="time" class="office-slot-time" required></label><button class="button button-outline" type="button" data-remove-office-slot>Remove</button>`;wrap.appendChild(row);} }
    const removeSlot=event.target.closest('[data-remove-office-slot]'); if(removeSlot){const row=removeSlot.closest('.office-slot-row');if(row&&$('#officeSlotInputs').querySelectorAll('.office-slot-row').length>1){row.remove();$('#officeSlotInputs').querySelectorAll('.office-slot-row label').forEach((label,index)=>{label.childNodes[0].textContent=`Time slot ${index+1}`;});}}
    const book=event.target.closest('[data-book-faculty]'); if(book){ goTo('office-booking'); setTimeout(()=>{const sel=$('#bookingFaculty'); if(sel){sel.value=book.dataset.bookFaculty;renderAppointments();}},0); }
    const cancel=event.target.closest('[data-cancel-appointment]'); if(cancel){const a=data.appointments.find(x=>x.id===cancel.dataset.cancelAppointment);if(a&&a.studentId===currentUser().id&&a.status==='Pending'||a&&a.studentId===currentUser().id&&a.status==='Approved'){a.status='Cancelled';addNotification(a.facultyId, 'Appointment cancelled', `${getUser(a.studentId)?.name || 'A student'} cancelled the appointment on ${a.date} at ${formatTime(a.time)}.`, 'appointment', a.id);addNotification(a.studentId, 'Appointment cancellation confirmed', `Your appointment on ${a.date} at ${formatTime(a.time)} has been cancelled.`, 'appointment', a.id);const slot=data.officeHours.find(s=>s.facultyId===a.facultyId&&s.date===a.date&&s.time===a.time);if(slot)delete slot.bookedBy;saveData();renderAppointments();showToast('Appointment cancelled.');}}
    const res=event.target.closest('[data-reschedule-appointment]'); if(res){const a=data.appointments.find(x=>x.id===res.dataset.rescheduleAppointment);if(a&&a.studentId===currentUser().id){a.rescheduleRequest=true;addNotification(a.facultyId, 'Reschedule requested', `${getUser(a.studentId)?.name || 'A student'} requested a new time for ${a.date} at ${formatTime(a.time)}.`, 'appointment', a.id);addNotification(a.studentId, 'Reschedule request sent', `Your request to reschedule the appointment on ${a.date} at ${formatTime(a.time)} was sent to faculty.`, 'appointment', a.id);saveData();renderAppointments();showToast('Reschedule request sent to faculty. Please discuss a new time through your faculty contact details.');}}
    const action=event.target.closest('[data-appointment-action]'); if(action&&currentUser().role==='Teacher'){const a=data.appointments.find(x=>x.id===action.dataset.appointmentId&&x.facultyId===currentUser().id);if(a){a.status=action.dataset.appointmentAction;addNotification(a.studentId, `Appointment ${a.status.toLowerCase()}`, `Your appointment with ${currentUser().name} on ${a.date} at ${formatTime(a.time)} is now ${a.status.toLowerCase()}.`, 'appointment', a.id);addNotification(currentUser().id, `Appointment marked ${a.status.toLowerCase()}`, `You updated the appointment with ${getUser(a.studentId)?.name || 'the student'} on ${a.date} at ${formatTime(a.time)}.`, 'appointment', a.id);if(['Declined','Cancelled'].includes(a.status)){const slot=data.officeHours.find(s=>s.facultyId===a.facultyId&&s.date===a.date&&s.time===a.time);if(slot)delete slot.bookedBy;}saveData();renderAppointments();showToast(`Appointment marked ${a.status.toLowerCase()}.`);}}
    const del=event.target.closest('[data-delete-office-slot]'); if(del&&currentUser().role==='Teacher'){const slot=data.officeHours.find(x=>x.id===del.dataset.deleteOfficeSlot&&x.facultyId===currentUser().id);if(slot&&!slot.bookedBy){data.officeHours=data.officeHours.filter(x=>x.id!==slot.id);saveData();renderAppointments();showToast('Availability slot removed.');}}
  });
  document.addEventListener('submit', event => {
    if(event.target.id==='officeHourForm'){event.preventDefault();if(currentUser().role!=='Teacher')return;const date=$('#officeDate').value,inputs=[...document.querySelectorAll('#officeSlotInputs .office-slot-time')],times=inputs.map(input=>input.value);if(!date||date<localDateISO())return showToast('Choose today or a future date.');if(times.some(time=>!time))return showToast('Please complete every time slot or remove the empty row.');if(times.some(time=>timeToMinutes(time)%15!==0))return showToast('Every appointment must start on a 15-minute boundary (00, 15, 30 or 45).');if(new Set(times).size!==times.length)return showToast('Please remove duplicate times.');let added=0;for(const time of times){if(!data.officeHours.some(s=>s.facultyId===currentUser().id&&s.date===date&&s.time===time)){data.officeHours.push({id:`oh${Date.now()}${time.replace(':','')}${added}`,facultyId:currentUser().id,date,time});added++;}}saveData();renderAppointments();showToast(`${added} available slot(s) published.`);}
    if(event.target.id==='studentAppointmentForm'){event.preventDefault();if(currentUser().role!=='Student')return;const facultyId=$('#bookingFaculty').value,date=$('#bookingDate').value,time=$('#bookingTime').value,reason=$('#bookingReason').value.trim();if(reason.length<8)return showToast('Please enter at least 8 characters for the reason.');const slot=availableSlots(facultyId,date).find(s=>s.time===time);if(!slot)return showToast('That slot is no longer available. Please choose another.');if(data.appointments.some(a=>a.facultyId===facultyId&&a.date===date&&a.time===time&&!['Declined','Cancelled'].includes(a.status)))return showToast('That appointment slot has already been requested.');const appointmentId=`ap${Date.now()}`;data.appointments.push({id:appointmentId,studentId:currentUser().id,facultyId,date,time,reason,status:'Pending',createdAt:new Date().toISOString()});slot.bookedBy=currentUser().id;addNotification(facultyId, 'New appointment request', `${currentUser().name} requested ${date} at ${formatTime(time)}.`, 'appointment', appointmentId);addNotification(currentUser().id, 'Appointment request submitted', `Your request to ${getUser(facultyId)?.name || 'faculty'} for ${date} at ${formatTime(time)} is pending approval.`, 'appointment', appointmentId);saveData();renderAppointments();showToast('Your appointment request has been sent.');}
  });
}

function startApp() {
  // Keep one canonical internal role so older 'Faculty' accounts receive every Faculty permission.
  data.users.forEach(user => {
    const role = String(user.role || '').trim().toLowerCase();
    if (role === 'faculty' || role === 'teacher') user.role = 'Teacher';
    else if (role === 'student') user.role = 'Student';
  });
  if (!data.users.some(user => user.id === data.currentUserId)) data.currentUserId = 's1';
  if (!data.presence) data.presence = {};

  // Register navigation immediately so a rendering problem cannot make the portal feel unclickable.
  document.addEventListener('click', event => {
    const tab = event.target.closest('[data-faculty-tab]');
    if (!tab) return;
    const section = tab.dataset.facultyTab;
    document.querySelectorAll('[data-faculty-tab]').forEach(button => {
      const active = button === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-faculty-panel]').forEach(panel => {
      panel.classList.toggle('hidden', panel.dataset.facultyPanel !== section);
    });
  });

  document.addEventListener('click', event => {
    const navButton = event.target.closest('#mainNav [data-view]');
    if (navButton) {
      event.preventDefault();
      goTo(navButton.dataset.view);
      return;
    }
    const quickLink = event.target.closest('[data-go]');
    if (quickLink) {
      event.preventDefault();
      goTo(quickLink.dataset.go);
    }
  }, true);

  updateMyPresence();
  window.addEventListener('beforeunload', () => {
    if (!data.presence) data.presence = {};
    data.presence[currentUser().id] = 0;
    saveData();
  });
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try { data = JSON.parse(event.newValue); renderAll(); } catch (error) { /* Ignore incomplete storage updates. */ }
    }
  });
  checkAppointmentReminders();
  window.setInterval(() => { updateMyPresence(); renderPresence(); checkAppointmentReminders(); if ($('#view-admin')?.classList.contains('active')) renderAdmin(); }, 15000);
  // Attach controls before rendering dashboard data. Navigation remains available
  // even if an old or incomplete localStorage record causes a rendering issue.
  setupThemeToggle();
  setupEvents();
  try {
    renderAll();
    renderCurrentView('overview');
  } catch (error) {
    console.error('AUW Connect dashboard rendering error:', error);
    showToast('Some saved information could not be displayed. Navigation is still available; please refresh the page.');
  }
}
startApp();


