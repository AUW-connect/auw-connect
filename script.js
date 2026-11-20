// Supabase connection and authentication. The publishable key is safe for browser use.
const SUPABASE_URL = 'https://xvovsxigkhgmstlnwsvj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_jgzjUWcoNNtvSUxPLgkkvA_xHxnz12d';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function portalRole(role) {
  const value = String(role || '').trim().toLowerCase();
  return value === 'admin' || value === 'administrator' ? 'Admin' : (value === 'faculty' || value === 'teacher' ? 'Teacher' : 'Student');
}
function profileToPortalUser(profile) {
  return {
    id: profile.id,
    name: profile.full_name || profile.email || 'AUW user',
    email: String(profile.email || '').toLowerCase(),
    username: profile.username || String(profile.email || '').split('@')[0].toLowerCase(),
    role: portalRole(profile.role),
    group: profile.ug_point || (portalRole(profile.role) === 'Teacher' ? 'Faculty' : ''),
    subject: profile.subject || '',
    teachingUgPoints: Array.isArray(profile.teaching_ug_points) ? profile.teaching_ug_points : [],
    subjects: ['Mathematics', 'English', 'CTP'],
    trimester: profile.trimester || '',
    assignedTrimester: profile.trimester || '',
    accountStatus: 'approved'
  };
}
async function loadSignedInProfile(authUser) {
  if (!authUser) throw new Error('No signed-in account was found.');
  const { data: profile, error } = await supabaseClient
    .from('profiles').select('id, full_name, email, username, role, ug_point, trimester, avatar_url, subject, teaching_ug_points')
    .eq('id', authUser.id).maybeSingle();
  if (error) throw error;
  if (!profile) throw new Error('Your account was created, but its AUW profile was not found. Please contact the portal team.');

  // Complete assignment fields for accounts created before the assignment workflow was added.
  const meta = authUser.user_metadata || {};
  const assignmentPatch = {};
  if (!profile.subject && meta.subject) assignmentPatch.subject = meta.subject;
  if (!profile.ug_point && meta.ug_point && String(meta.role || '').toLowerCase() === 'student') assignmentPatch.ug_point = meta.ug_point;
  if (Object.keys(assignmentPatch).length) {
    const { data: updatedProfile, error: updateError } = await supabaseClient.from('profiles').update(assignmentPatch).eq('id', authUser.id).select('id, full_name, email, username, role, ug_point, trimester, avatar_url, subject, teaching_ug_points').single();
    if (updateError) throw updateError;
    Object.assign(profile, updatedProfile);
  }

  // Load only the signed-in user's own profile here. Do not request the full
  // profiles table during login; directory access is handled separately so a
  // directory RLS/permission restriction cannot prevent authentication.
  data.users = [profileToPortalUser(profile)];
  data.currentUserId = authUser.id;
  if (messengerLoadedForUser && messengerLoadedForUser !== authUser.id) { messengerLoadedForUser = ''; if (messengerRealtimeChannel) { supabaseClient.removeChannel(messengerRealtimeChannel); messengerRealtimeChannel = null; } }
  const me = data.users.find(user => user.id === authUser.id);
  if (me) me.avatar = profile.avatar_url || me.avatar || '';
  document.body.classList.remove('logged-out');
  $('#authModal')?.classList.add('hidden');
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (storageError) { console.warn('Local cache could not be updated:', storageError); }
  await syncAcademicData(false);
  await syncOfficeHourData(false);
  startAcademicRealtime();
  return me;
}
async function initializeSupabaseAuth() {
  const { data: sessionData, error } = await supabaseClient.auth.getSession();
  if (error) console.error('Could not restore Supabase session:', error.message);
  if (sessionData?.session?.user) {
    try { await loadSignedInProfile(sessionData.session.user); }
    catch (profileError) { console.error(profileError); data.currentUserId = ''; document.body.classList.add('logged-out'); $('#authModal')?.classList.remove('hidden'); showToast(profileError.message || 'Could not load your AUW profile.'); }
  } else {
    data.currentUserId = '';
    directoryProfiles = [];
    document.body.classList.add('logged-out');
    $('#authModal')?.classList.remove('hidden');
  }
  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      messengerLoadedForUser = ''; messengerLoading = false; currentChatId = ''; messengerOnlineStudentIds = new Set();
      if (messengerRealtimeChannel) { supabaseClient.removeChannel(messengerRealtimeChannel); messengerRealtimeChannel = null; }
      if (academicRealtimeChannel) { supabaseClient.removeChannel(academicRealtimeChannel); academicRealtimeChannel = null; }
      data.currentUserId = '';
      document.body.classList.add('logged-out');
      $('#authModal')?.classList.remove('hidden');
    }
  });
}

// AUW Connect - beginner-friendly front-end prototype.
// General portal preferences are cached locally; academic records and office-hour data are shared through Supabase.
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
      { id: 'chat1', title: 'Pathways Study Group', type: 'group', memberIds: ['s1', 's2', 's3'], messages: [] }
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

const validStoredSections = ['UG-1.1','UG-1.2','UG-1.3','UG-2.1','UG-2.2','UG-2.3','UG-3.1','UG-3.2','UG-3.3','UG-4.1','UG-4.2','UG-4.3',''];
data.users.filter(user => user.role === 'Student').forEach(user => { if (!validStoredSections.includes(user.group) && !(user.accountStatus === 'pending' || user.trimesterStatus === 'not_requested' || user.trimesterStatus === 'pending')) user.group = 'UG-1.1'; });
data.schedules.forEach(item => { if (item.group === 'Pathways' || item.group === 'Foundation' || item.group === 'UG') item.group = 'UG-1.1'; });
// Admin accounts are no longer part of AUW Connect. Remove legacy Admin records.
data.users = data.users.filter(user => !['admin', 'administrator'].includes(String(user.role || '').trim().toLowerCase()));
if (!data.users.some(user => user.id === data.currentUserId)) data.currentUserId = '';
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
// Legacy faculty messenger conversation injection removed. Student Messenger stays student-only.
data.courses = data.courses.filter(course => !['Computer Science', 'CS101'].includes(course.name) && course.code !== 'CS101');
data.courses = data.courses.filter(course => !['ICT101','CRT101'].includes(course.code));
data.announcements = data.announcements.map(item => ({ ...item, category: item.category || 'General' }));
data.grades = (data.grades || []).map(item => ({ ...item, trimester: item.trimester || 'Fall 2026', published: item.published === false ? false : true }));
data.users.filter(user => user.role === 'Student').forEach(user => { if (!String(user.group || '').startsWith('UG-') && !(user.accountStatus === 'pending' || user.trimesterStatus === 'not_requested' || user.trimesterStatus === 'pending')) user.group = 'UG-1.1'; });
data.users.filter(user => user.role === 'Teacher').forEach(user => { user.group = 'Faculty'; });

// Student Messenger is strictly student-to-student. Clean legacy demo/local chats
// that included faculty accounts or faculty-authored messages.
function sanitizeStudentMessengerData() {
  const isStudentId = id => data.users.some(person => person.id === id && person.role === 'Student');
  data.conversations = (Array.isArray(data.conversations) ? data.conversations : [])
    .filter(chat => {
      if (chat.isGeneral || chat.id === 'auw-general-student-group') return true;
      return Array.isArray(chat.memberIds) && chat.memberIds.length >= 2 && chat.memberIds.every(isStudentId);
    })
    .map(chat => {
      chat.memberIds = chat.isGeneral || chat.id === 'auw-general-student-group'
        ? data.users.filter(person => person.role === 'Student').map(person => person.id)
        : chat.memberIds.filter(isStudentId);
      chat.messages = (Array.isArray(chat.messages) ? chat.messages : [])
        .filter(message => !message.senderId || isStudentId(message.senderId));
      return chat;
    });
}
sanitizeStudentMessengerData();
(data.registrations || []).forEach(registration => { if (registration.status == null) registration.status = 'approved'; });
data.users.filter(user => user.role === 'Student').forEach(user => { if (user.accountStatus == null) user.accountStatus = 'approved'; if (user.trimesterStatus == null) user.trimesterStatus = 'assigned'; if (user.trimesterStatus === 'assigned' && !user.assignedTrimester) user.assignedTrimester = data.registrationSettings.trimester; });
// Normalize older faculty role labels so all faculty accounts use the same dashboard and permissions.
data.users.forEach(user => { if (String(user.role || '').trim().toLowerCase() === 'faculty') user.role = 'Teacher'; });
data.users.filter(user => user.role === 'Teacher').forEach(user => { user.group = 'Faculty'; });
// Persist compatibility fixes, including legacy 'Faculty' role names.
try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (error) { console.warn('Could not save portal compatibility updates.', error); }

// Every subject has six selectable SMTW sessions for every UG section.
// Admin can still add additional sessions and assign faculty through course management.
const REGISTRATION_SECTIONS = ['UG-1.1','UG-1.2','UG-1.3','UG-2.1','UG-2.2','UG-2.3','UG-3.1','UG-3.2','UG-3.3','UG-4.1','UG-4.2','UG-4.3',''];
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
let messengerLoadedForUser = '';
let messengerLoading = false;
let messengerRealtimeChannel = null;
let academicRealtimeChannel = null;
let messengerRefreshInProgress = false;
let messengerOnlineStudentIds = new Set();
let editingMaterialId = '';
let selectedRegistrationSessions = {};
let selectedRegistrationSeats = {};
let registrationSessionFilters = {};
let editingAnnouncementId = '';
let editingCourseId = '';
let facultyUgFilter = 'all';
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


// Appointment reminders are created while AUW Connect is open.
// Server-side scheduled jobs are needed for guaranteed delivery while browsers are closed.
function checkAppointmentReminders() {
  const now = Date.now();
  let changed = false;
  (data.appointments || []).forEach(appointment => {
    if (appointment.status !== 'Approved') return;
    const start = new Date(`${appointment.date}T${appointment.time}:00`).getTime();
    if (!Number.isFinite(start) || start <= now) return;
    const student = getUser(appointment.studentId);
    const faculty = getUser(appointment.facultyId);
    const when = `${appointment.date} at ${formatTime(appointment.time)}`;
    const reminderWindows = [
      { key: 'reminder24hSentAt', minutes: 24 * 60, title: 'Appointment tomorrow', body: `Your appointment is scheduled for ${when}.` },
      { key: 'reminder15mSentAt', minutes: 15, title: 'Appointment in 15 minutes', body: `Your appointment starts at ${when}.` }
    ];
    reminderWindows.forEach(reminder => {
      const dueAt = start - reminder.minutes * 60000;
      if (appointment[reminder.key] || now < dueAt || now >= dueAt + 60 * 60 * 1000) return;
      addNotification(appointment.studentId, reminder.title, `${reminder.body} Faculty: ${faculty?.name || 'your faculty member'}.`, 'appointment-reminder', appointment.id, null);
      addNotification(appointment.facultyId, reminder.title, `${reminder.body} Student: ${student?.name || 'your student'}.`, 'appointment-reminder', appointment.id, null);
      appointment[reminder.key] = new Date(now).toISOString();
      changed = true;
    });
  });
  if (changed) saveData();
}
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
  if (messengerRealtimeChannel && currentUser()?.role === 'Student') return messengerOnlineStudentIds.has(userId);
  const lastSeen = data.presence?.[userId];
  return Boolean(lastSeen && Date.now() - lastSeen < 45000);
}
function updateMyPresence() {
  const user = data.users.find(item => item.id === data.currentUserId);
  if (!user) return;
  if (!data.presence) data.presence = {};
  data.presence[user.id] = Date.now();
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
  const facultyViews = ['notifications','overview','profile','student-directory','office-hours','appointment-requests','assessment','grades','faculty-tasks','faculty-materials'];
  const allowed = role === 'Student' ? studentViews : facultyViews;
  if (!allowed.includes(viewName)) viewName = 'overview';
  const target = document.getElementById(`view-${viewName}`);
  if (!target) return;
  $$('.view').forEach(view => view.classList.remove('active'));
  target.classList.add('active');
  $$('.nav-item[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === viewName));
  const labels = {'notifications':'Notifications','overview':'Dashboard overview','profile':'My profile','faculty-directory':'Faculty directory','student-directory':'Student directory','office-booking':'Office-hour booking','appointments':'My appointments','assessment':'Assessments','grades':'Grades and results','cgpa':'CGPA & academic history','tasks':'Study tasks','student-messenger':'Student messenger','materials':'Learning materials','office-hours':'Manage office hours','appointment-requests':'Appointment requests','faculty-tasks':'Study task provision','faculty-materials':'Learning materials'};
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
  $('#profileFacultySubjectField')?.classList.toggle('hidden', user.role !== 'Teacher');
  $('#profileFacultyGroupsField')?.classList.toggle('hidden', user.role !== 'Teacher');
  $('#profileStudentSubjects')?.classList.toggle('hidden', user.role !== 'Student');
  if ($('#profileFacultySubject')) { $('#profileFacultySubject').value = user.subject || ''; $('#profileFacultySubject').disabled = Boolean(user.subject); }
  if ($('#profileFacultyGroups')) Array.from($('#profileFacultyGroups').options).forEach(option => { option.selected = (user.teachingUgPoints || []).includes(option.value); });
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
  return normalizeAssessmentGroup(assessment.group) === 'ALL-UG-POINTS' || studentGroups.includes(normalizeAssessmentGroup(assessment.group));
}
function getStudentAssessments(student = currentUser()) {
  return (data.assessments || []).filter(assessment => assessment.status !== 'archived' && studentMatchesAssessmentGroup(student, assessment));
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
  const courses = data.courses.filter(c => c.teacherId === user.id || data.schedules.some(sc => sc.teacherId === user.id && sc.courseId === c.id));
  const priorCourse = courseSelect.value;
  courseSelect.innerHTML = courses.map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.code)} · ${escapeHTML(c.name)}</option>`).join('') || '<option value="">No assigned courses</option>';
  if (courses.some(c => c.id === priorCourse)) courseSelect.value = priorCourse;
  if ($('#finalizeTrimester') && !$('#finalizeTrimester').value) $('#finalizeTrimester').value = data.registrationSettings.trimester || 'Fall 2026';
  const courseId = courseSelect.value;
  const trimester = $('#finalizeTrimester').value.trim() || data.registrationSettings.trimester;
  const students = facultyCourseStudents(courseId, trimester, user.id).map(person => person.id);
  const rows = students.map(studentId => ({ studentId, summary: getComponentSummary(studentId,courseId,trimester) }));
  $('#finalizePreview').innerHTML = `<table><thead><tr><th>Student</th><th>Components recorded</th><th>Final weighted mark</th><th>Letter</th><th>Status</th></tr></thead><tbody>${rows.map(({studentId,summary}) => {
    const existing = data.grades.find(g => g.studentId===studentId && g.courseId===courseId && g.trimester===trimester && g.resultSource==='components');
    const ready = summary.allComponents && summary.finalPercentage !== null;
    const result = ready ? gradeFor(summary.finalPercentage,100) : null;
    const status = existing?.published ? 'Officially published' : existing?.scheduledPublishAt ? `Scheduled ${new Date(existing.scheduledPublishAt).toLocaleString()}` : ready ? 'Ready to publish' : 'Awaiting all six components';
    return `<tr><td>${escapeHTML(getUser(studentId)?.name || 'Student')}</td><td>${summary.totalWeightRecorded}% / 100%</td><td>${ready ? summary.finalPercentage.toFixed(2)+'%' : 'Incomplete'}</td><td>${result ? result.letter : '—'}</td><td>${escapeHTML(status)}</td></tr>`;
  }).join('') || '<tr><td colspan="5">No component marks have been recorded for this course and trimester.</td></tr>'}</tbody></table><p class="muted">Progress marks are visible to students as soon as they are saved. Only the complete official result is held until the publication time.</p>`;
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
function facultyCourseStudents(courseId, trimester, facultyId) {
  const course = getCourse(courseId);
  if (course?.trimester && String(course.trimester) !== String(trimester)) return [];
  const people = directoryProfiles.length ? directoryProfiles : data.users;
  const assignedGroups = new Set(data.schedules
    .filter(item => item.courseId === courseId && item.teacherId === facultyId && item.group)
    .map(item => item.group));
  return people.filter(person => person.role === 'Student'
    && String(person.trimester || person.assignedTrimester || '') === String(trimester)
    && (!assignedGroups.size || assignedGroups.has(person.group)));
}
function renderComponentMarksPanel() {
  const panel = $('#componentMarksPanel'); if (!panel) return;
  const user = currentUser();
  // The panel starts with the `hidden` class in the HTML. Remove that class
  // for faculty; changing only inline display does not override `.hidden`.
  const isFaculty = user && user.role === 'Teacher';
  panel.classList.toggle('hidden', !isFaculty);
  panel.style.display = isFaculty ? '' : 'none';
  if (!isFaculty) return;
  const students = directoryProfiles.length ? directoryProfiles.filter(u => u.role === 'Student') : data.users.filter(u => u.role === 'Student');
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
  const progressHost = $('#componentProgressTable');
  const previousUgFilter = progressHost.querySelector('#componentProgressUgFilter')?.value || 'all';
  const ugPoints = ['UG-1.1','UG-1.2','UG-1.3','UG-2.1','UG-2.2','UG-2.3','UG-3.1','UG-3.2','UG-3.3','UG-4.1','UG-4.2','UG-4.3'];
  const allRows = facultyCourseStudents(courseSelect.value, trimester, user.id);
  const selectedUgPoint = ugPoints.includes(previousUgFilter) ? previousUgFilter : 'all';
  const rows = selectedUgPoint === 'all' ? allRows : allRows.filter(student => String(student.group || '').trim() === selectedUgPoint);
  progressHost.innerHTML = `<div class="form-row" style="max-width:360px;margin:0 0 14px"><label for="componentProgressUgFilter">Filter by UG Point<select id="componentProgressUgFilter"><option value="all">All UG Points</option>${ugPoints.map(point=>`<option value="${point}" ${selectedUgPoint===point?'selected':''}>${point}</option>`).join('')}</select></label></div><table><thead><tr><th>Student</th><th>Recorded components</th><th>Current progress</th><th>Final weighted mark</th><th>Visibility</th></tr></thead><tbody>${rows.map(st=>{const summary=calculateCurrentProgress(st.id,courseSelect.value,trimester);const componentText=Object.entries(summary.records).map(([k,v])=>`${k}: ${v.percentage.toFixed(1)}%${v.source==='assessment'?' (assessment)':''}`).join('<br>')||'No marks recorded';const finalMark=calculateFinalWeightedMark(st.id,courseSelect.value,trimester);const existingResult=data.grades.find(g=>g.studentId===st.id&&g.courseId===courseSelect.value&&g.trimester===trimester&&g.resultSource==='components');return `<tr><td>${escapeHTML(st.name)}</td><td>${componentText}</td><td>${summary.percentage===null?'—':summary.percentage.toFixed(1)+'%'}</td><td>${finalMark===null?'Awaiting all 6 components':finalMark.toFixed(1)+'%'}</td><td>${existingResult?.published?'Final result published':'Progress visible automatically'}</td></tr>`}).join('')||'<tr><td colspan="5">No students found for this UG Point and course.</td></tr>'}</tbody></table>`;
  $('#componentProgressUgFilter').onchange = renderComponentMarksPanel;

}
function renderGrades() {
  const user = currentUser();
  const isFacultyView = user.role === 'Teacher' || user.role === 'Admin';
  const allGrades = data.grades.filter(item => {
    if (user.role === 'Admin') return true;
    if (user.role === 'Teacher') return item.enteredById === user.id || (!item.enteredById && getCourse(item.courseId)?.teacherId === user.id);
    return item.studentId === user.id;
  });
  const publishedStudentGrades = user.role === 'Student' ? allGrades.filter(item => item.published === true) : [];
  const filterWrap = $('#studentResultFilterWrap');
  const filter = $('#studentResultTrimester');
  if (filterWrap) filterWrap.style.display = user.role === 'Student' ? '' : 'none';
  if (filter && user.role === 'Student') {
    const previousValue = filter.value || 'all';
    const terms = new Set(publishedStudentGrades.map(item => item.trimester || 'Fall 2026'));
    data.componentMarks.filter(mark => mark.studentId === user.id).forEach(mark => terms.add(mark.trimester || 'Fall 2026'));
    const trimesters = [...terms].sort();
    filter.innerHTML = '<option value="all">All trimesters</option>' + trimesters.map(term => `<option value="${escapeHTML(term)}">${escapeHTML(term)}</option>`).join('');
    filter.value = trimesters.includes(previousValue) ? previousValue : 'all';
  }
  const selectedTrimester = user.role === 'Student' && filter ? filter.value : 'all';
  const visibleGrades = user.role === 'Student'
    ? publishedStudentGrades.filter(item => selectedTrimester === 'all' || (item.trimester || 'Fall 2026') === selectedTrimester)
    : allGrades;
  const results = visibleGrades.map(item => ({ ...item, result: gradeFor(item.obtained, item.total) }));
  const summaryResults = (user.role === 'Student' ? publishedStudentGrades : allGrades.filter(item => item.published === true)).map(item => ({ ...item, result: gradeFor(item.obtained, item.total) }));
  const average = summaryResults.length ? summaryResults.reduce((sum, item) => sum + item.result.percentage, 0) / summaryResults.length : 0;
  const cgpaSummary = calculateCgpa(summaryResults);
  $('#gradeAverage').textContent = summaryResults.length ? `${average.toFixed(1)}%` : '—';
  $('#gradeGpa').textContent = cgpaSummary.cgpa === null ? '—' : cgpaSummary.cgpa.toFixed(2);
  $('#gradeCount').textContent = summaryResults.length;
  const heading = $('#view-grades h3');
  const description = $('#view-grades .panel-heading .muted');
  if (heading) heading.textContent = isFacultyView ? 'Student results I recorded' : 'My results';
  if (description) description.textContent = isFacultyView ? 'Review progress marks and prepare the complete official trimester result.' : 'Progress marks appear as faculty save them. The final result appears after its official publication.';
  const table = $('#myGradeBody')?.closest('table');
  const header = table?.querySelector('thead tr');
  if (header) header.innerHTML = isFacultyView
    ? '<th>Student</th><th>Trimester</th><th>Course</th><th>Obtained</th><th>Total</th><th>Percentage</th><th>Letter</th><th>Grade points</th><th>Feedback</th><th>Publication</th>'
    : '<th>Trimester</th><th>Course</th><th>Obtained</th><th>Total</th><th>Percentage</th><th>Letter</th><th>Grade points</th><th>Feedback</th>';
  if (user.role === 'Student') {
    const ownMarks = data.componentMarks.filter(mark => mark.studentId === user.id && (selectedTrimester === 'all' || (mark.trimester || 'Fall 2026') === selectedTrimester));
    const subjectIds = new Set([...results.map(item => String(item.courseId)), ...ownMarks.map(mark => String(mark.courseId))]);
    const subjects = [...subjectIds].sort((a,b) => courseName(a).localeCompare(courseName(b)));
    const subjectMarkup = subjects.map(courseId => {
      const subjectGrades = results.filter(item => String(item.courseId) === courseId).sort((a,b) => String(b.trimester || '').localeCompare(String(a.trimester || '')));
      const subjectMarks = ownMarks.filter(mark => String(mark.courseId) === courseId);
      const terms = new Set([...subjectGrades.map(item => item.trimester || 'Fall 2026'), ...subjectMarks.map(mark => mark.trimester || 'Fall 2026')]);
      const latestGrade = subjectGrades[0];
      const meta = subjectGrades.length ? `${subjectGrades.length} official ${subjectGrades.length === 1 ? 'result' : 'results'}` : `${subjectMarks.length} progress mark${subjectMarks.length === 1 ? '' : 's'} saved`;
      const termMarkup = [...terms].sort((a,b) => String(b).localeCompare(String(a))).map(term => {
        const grade = subjectGrades.find(item => (item.trimester || 'Fall 2026') === term);
        const records = getComponentRecords(user.id, courseId, term);
        const componentRows = Object.entries(COMPONENT_WEIGHTS).map(([name, weight]) => {
          const record = records[name];
          const hasMark = record && record.percentage !== '' && record.percentage != null && Number.isFinite(Number(record.percentage));
          const mark = hasMark ? `${Number(record.percentage).toFixed(1)}%` : 'Not recorded yet';
          const contribution = hasMark ? `${(Number(record.percentage) * weight / 100).toFixed(2)} / ${Number(weight).toFixed(2)}` : '—';
          return `<tr><td>${escapeHTML(name)}</td><td>${weight}%</td><td>${mark}</td><td>${contribution}</td></tr>`;
        }).join('');
        const current = calculateCurrentProgress(user.id, courseId, term);
        const progressMarkup = current.percentage === null ? '' : `<p class="subject-result-progress">Current progress: <strong>${current.percentage.toFixed(1)}%</strong> <span>(${current.availableWeight}% of course weight recorded)</span></p>`;
        const finalMarkup = grade ? `<div class="subject-result-final"><h5>Official final result</h5><div class="table-wrap"><table><thead><tr><th>Obtained</th><th>Total</th><th>Percentage</th><th>Letter</th><th>Grade points</th><th>Feedback</th></tr></thead><tbody><tr><td>${grade.obtained}</td><td>${grade.total}</td><td>${grade.result.percentage.toFixed(1)}%</td><td><span class="grade-letter">${grade.result.letter}</span></td><td>${grade.result.gpa.toFixed(1)}</td><td>${escapeHTML(grade.feedback || '—')}</td></tr></tbody></table></div></div>` : '<p class="muted">The official final result has not been published yet.</p>';
        return `<section class="subject-result-term"><h4>${escapeHTML(term)}</h4>${progressMarkup}<div class="table-wrap subject-result-table"><table><thead><tr><th>Assessment component</th><th>Weight</th><th>Your mark</th><th>Weighted contribution</th></tr></thead><tbody>${componentRows}</tbody></table></div>${finalMarkup}</section>`;
      }).join('');
      return `<details class="subject-result-dropdown" open><summary><span class="subject-result-title">${escapeHTML(courseName(courseId))}</span><span class="subject-result-meta">${meta}${latestGrade ? ` · Latest official ${latestGrade.result.percentage.toFixed(1)}%` : ''}</span></summary><div class="subject-result-content">${termMarkup || '<p class="muted">No progress marks are available yet.</p>'}</div></details>`;
    });
    $('#myGradeBody').innerHTML = subjectMarkup.length ? `<tr><td colspan="8"><div class="subject-result-dropdowns">${subjectMarkup.join('')}</div></td></tr>` : '<tr><td colspan="8">No progress marks or official results are available yet.</td></tr>';
  } else {
    $('#myGradeBody').innerHTML = results.map(item => `<tr>${isFacultyView ? `<td>${escapeHTML(getUser(item.studentId)?.name || 'Unknown student')}</td>` : ''}<td>${escapeHTML(item.trimester || 'Fall 2026')}</td><td>${escapeHTML(courseName(item.courseId))}</td><td>${item.obtained}</td><td>${item.total}</td><td>${item.result.percentage.toFixed(1)}%</td><td><span class="grade-letter">${item.result.letter}</span></td><td>${item.result.gpa.toFixed(1)}</td><td>${escapeHTML(item.feedback || '—')}</td>${isFacultyView ? `<td>${item.published ? '<span class="soft-tag">Officially published</span>' : item.scheduledPublishAt ? `<span class="muted">Scheduled: ${escapeHTML(new Date(item.scheduledPublishAt).toLocaleString())}</span>` : '<span class="muted">Progress only</span>'}</td>` : ''}</tr>`).join('') || `<tr><td colspan="${isFacultyView ? 10 : 8}">${isFacultyView ? 'No student marks have been recorded by this account yet.' : 'No official results have been published for this account yet.'}</td></tr>`;
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
// A student may open a group only when they are a member. UG groups also
// require the student's assigned UG point to match the group's UG point.
function canAccessStudentConversation(chat, user = currentUser()) {
  if (!chat || !user || user.role !== 'Student') return false;
  if (chat.isGeneral) return chat.memberIds.includes(user.id);
  if (!chat.memberIds.includes(user.id)) return false;
  return !chat.ugPoint || chat.ugPoint === user.group;
}
function renderConversations() {
  const user = currentUser();
  if (!user || user.role !== 'Student') return;
  if (messengerLoadedForUser !== user.id && !messengerLoading) {
    $('#conversationList').innerHTML = '<p class="muted">Connecting to shared student conversations…</p>';
    loadStudentMessenger();
    return;
  }
  // Show all official UG groups, even when this student is not a member.
  // Private chats and student-created groups remain visible only to members.
  const chats = data.conversations.filter(chat =>
    isStudentOnlyConversation(chat) && (chat.memberIds.includes(user.id) || Boolean(chat.ugPoint))
  ).sort((a,b) => Number(b.isGeneral) - Number(a.isGeneral) || Number(Boolean(b.ugPoint)) - Number(Boolean(a.ugPoint)) || (a.title || '').localeCompare(b.title || ''));
  const accessibleChats = chats.filter(chat => canAccessStudentConversation(chat, user));
  if (!currentChatId || !accessibleChats.some(chat => chat.id === currentChatId)) currentChatId = accessibleChats[0]?.id || '';
  $('#conversationList').innerHTML = chats.map(chat => {
    const locked = Boolean(chat.ugPoint && !canAccessStudentConversation(chat, user));
    const otherId = chat.type === 'private' ? chat.memberIds.find(id => id !== user.id) : '';
    const detail = locked
      ? `🔒 Restricted · Only ${chat.ugPoint} students`
      : chat.isGeneral ? 'All students · General Group' : chat.ugPoint ? `${chat.memberIds.length} students · ${chat.ugPoint}` : chat.type === 'group' ? `${chat.memberIds.length} student members · Group chat` : `Student · ${isUserOnline(otherId) ? 'Online' : 'Offline'}`;
    const avatarUser = chat.type === 'private' ? getUser(otherId) : null;
    const actionAttribute = locked ? `data-locked-chat-id="${escapeHTML(chat.id)}" aria-disabled="true"` : `data-chat-id="${escapeHTML(chat.id)}"`;
    return `<button type="button" class="conversation ${chat.id === currentChatId ? 'active' : ''} ${locked ? 'conversation-locked' : ''}" ${actionAttribute} title="${locked ? 'Only students assigned to ' + escapeHTML(chat.ugPoint) + ' can open this group' : ''}"><span class="avatar">${avatarUser ? avatarContent(avatarUser) : initials(chatTitle(chat))}</span><span><strong>${escapeHTML(chatTitle(chat))}</strong><small>${escapeHTML(detail)}</small></span>${chat.type === 'private' ? `<i class="presence-dot ${isUserOnline(otherId) ? '' : 'is-offline'}" title="${isUserOnline(otherId) ? 'Online' : 'Offline'}"></i>` : locked ? '<span aria-hidden="true">🔒</span>' : ''}</button>`;
  }).join('') || '<p class="muted">No groups are available yet. Please ask the portal administrator to run the Messenger setup SQL.</p>';
  renderChat();
}
async function loadStudentMessenger() {
  const me = currentUser();
  if (!me || me.role !== 'Student' || messengerLoading) return;
  messengerLoading = true;
  try {
    const { data: directory, error: directoryError } = await supabaseClient.rpc('student_messenger_directory');
    if (directoryError) throw directoryError;
    const studentUsers = (directory || []).map(profile => ({
      id: profile.id, name: profile.full_name || profile.email || 'Student',
      email: String(profile.email || '').toLowerCase(), username: profile.username || '',
      role: 'Student', group: profile.ug_point || 'UG Point not assigned',
      avatar: profile.avatar_url || '', photo: profile.avatar_url || ''
    }));
    data.users = [...data.users.filter(person => person.role !== 'Student'), ...studentUsers];

    const { data: conversationRows, error: conversationError } = await supabaseClient
      .from('student_conversations')
      .select('id,title,type,owner_id,is_general,ug_point,created_at')
      .order('created_at', { ascending: true });
    if (conversationError) throw conversationError;
    const ids = (conversationRows || []).map(row => row.id);
    let memberRows = [];
    if (ids.length) {
      const { data: members, error: memberError } = await supabaseClient
        .from('student_conversation_members').select('conversation_id,user_id').in('conversation_id', ids);
      if (memberError) throw memberError;
      memberRows = members || [];
    }
    data.conversations = (conversationRows || []).map(row => {
      const memberIds = row.is_general
        ? studentUsers.map(person => person.id)
        : memberRows.filter(member => member.conversation_id === row.id).map(member => member.user_id);
      if (row.type === 'private' && !memberIds.includes(me.id)) return null;
      return {
        id: row.id, title: row.title, type: row.type, ownerId: row.owner_id,
        isGeneral: row.is_general, ugPoint: row.ug_point, memberIds,
        messages: [], createdAt: row.created_at
      };
    }).filter(chat => chat && (chat.memberIds.includes(me.id) || Boolean(chat.ugPoint)));

    const accessibleChats = data.conversations.filter(chat => canAccessStudentConversation(chat, me));
    if (!currentChatId || !accessibleChats.some(chat => chat.id === currentChatId)) {
      currentChatId = accessibleChats[0]?.id || '';
    }
    messengerLoadedForUser = me.id;
    await loadSelectedMessengerMessages();
    subscribeToStudentMessenger();
    renderConversations();
  } catch (error) {
    console.error('Student Messenger connection failed:', error);
    $('#conversationList').innerHTML = `<p class="muted">Messenger could not connect: ${escapeHTML(error.message || 'Check the Messenger SQL setup and permissions.')}</p>`;
    showToast('Messenger could not connect to Supabase. Check the setup SQL and try again.');
  } finally {
    messengerLoading = false;
  }
}
async function loadSelectedMessengerMessages() {
  const chat = data.conversations.find(item => item.id === currentChatId && canAccessStudentConversation(item));
  if (!chat) return;
  const { data: rows, error } = await supabaseClient.from('student_messages')
    .select('id,conversation_id,sender_id,body,attachment_path,attachment_name,attachment_type,attachment_size,created_at')
    .eq('conversation_id', chat.id).order('created_at', { ascending: true }).limit(500);
  if (error) throw error;
  chat.messages = await Promise.all((rows || []).map(async row => {
    let attachment = null;
    if (row.attachment_path) {
      const { data: signed } = await supabaseClient.storage.from('student-messenger-files').createSignedUrl(row.attachment_path, 3600);
      attachment = { name: row.attachment_name || 'Attachment', type: row.attachment_type || '', size: Number(row.attachment_size || 0), data: signed?.signedUrl || '', path: row.attachment_path };
    }
    return { id: row.id, senderId: row.sender_id, text: row.body || '', attachment, time: new Date(row.created_at).toLocaleString(), createdAt: row.created_at };
  }));
}
function subscribeToStudentMessenger() {
  const user = currentUser();
  if (!user || user.role !== 'Student' || messengerRealtimeChannel) return;
  messengerRealtimeChannel = supabaseClient.channel('auw-student-messenger', { config: { presence: { key: user.id } } })
    .on('presence', { event: 'sync' }, () => {
      const state = messengerRealtimeChannel.presenceState();
      messengerOnlineStudentIds = new Set(Object.values(state).flat().map(meta => meta.user_id).filter(Boolean));
      renderConversations(); renderPresence();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'student_messages' }, async payload => {
      const changedConversationId = payload.new?.conversation_id || payload.old?.conversation_id;
      if (changedConversationId === currentChatId && !messengerRefreshInProgress) {
        messengerRefreshInProgress = true;
        try { await loadSelectedMessengerMessages(); renderConversations(); }
        catch (error) { console.error('Could not refresh Messenger messages:', error); }
        finally { messengerRefreshInProgress = false; }
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'student_conversation_members' }, async () => {
      try { messengerLoadedForUser = ''; await loadStudentMessenger(); }
      catch (error) { console.error('Could not refresh Messenger membership:', error); }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'student_conversations' }, async () => {
      try { messengerLoadedForUser = ''; await loadStudentMessenger(); }
      catch (error) { console.error('Could not refresh Messenger groups:', error); }
    })
    .subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        const { error } = await messengerRealtimeChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        if (error) console.warn('Could not publish Messenger online status:', error.message);
      }
      if (status === 'CHANNEL_ERROR') console.warn('Messenger realtime channel error.');
    });
}
function renderChat() {
  const user = currentUser();
  const chat = user?.role === 'Student' ? data.conversations.find(item => item.id === currentChatId && isStudentOnlyConversation(item) && canAccessStudentConversation(item, user)) : null;
  $('#chatTitle').textContent = chat ? chatTitle(chat) : 'Select a conversation';
  if (chat && chat.type === 'private') { const otherId = chat.memberIds.find(id => id !== user.id); $('#chatSubtitle').textContent = `${getUser(otherId)?.name || 'Student'} · ${isUserOnline(otherId) ? 'Online' : 'Offline'}`; }
  else $('#chatSubtitle').textContent = chat ? `${chat.memberIds.length} student members${chat.ugPoint ? ` · ${chat.ugPoint}` : ''}` : 'Start a student conversation';
  const actions = $('#chatGroupActions');
  const memberPanel = $('#chatMemberList');
  if (actions) actions.innerHTML = chat?.type === 'group' ? `<button type="button" class="button button-outline" data-toggle-members>View members (${chat.memberIds.length})</button>${chat.isGeneral || chat.ugPoint ? '<span class="soft-tag">Student group</span>' : `${chat.ownerId === user.id ? '<button type="button" class="button button-outline" data-manage-group>Manage members</button>' : ''}<button type="button" class="button button-outline" data-leave-group>Leave group</button>`}` : '';
  if (memberPanel) {
    memberPanel.classList.add('hidden');
    memberPanel.innerHTML = chat?.type === 'group' ? `<strong>Group members (${chat.memberIds.length})</strong><div class="chat-member-grid">${chat.memberIds.map(id => getUser(id)).filter(Boolean).map(person => `<div class="chat-member"><span class="avatar">${avatarContent(person)}</span><span><b>${escapeHTML(person.name)}</b><small>${escapeHTML(person.group || 'Student')}${person.id === chat.ownerId ? ' · Group creator' : ''}${person.id === user.id ? ' · You' : ''}</small></span></div>`).join('')}</div>` : '';
  }
  $('#chatMessages').innerHTML = chat ? chat.messages.map(message => {
    const sender = getUser(message.senderId);
    const mine = message.senderId === user.id;
    const safeText = escapeHTML(message.text || '').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\n/g, '<br>');
    let attachmentHTML = '';
    if (message.attachment) {
      const file = message.attachment;
      const safeName = escapeHTML(file.name);
      if (file.data && file.type && file.type.startsWith('image/')) attachmentHTML = `<div class="message-attachment image-attachment"><a href="${file.data}" target="_blank" rel="noopener noreferrer"><img src="${file.data}" alt="${safeName}"></a><a class="attachment-download" href="${file.data}" target="_blank" rel="noopener noreferrer">Open ${safeName}</a></div>`;
      else attachmentHTML = `<div class="message-attachment document-attachment"><span class="document-icon">▤</span><span class="document-name">${safeName}<small>${(file.size / 1024).toFixed(0)} KB</small></span>${file.data ? `<a class="attachment-download" href="${file.data}" target="_blank" rel="noopener noreferrer">Download</a>` : '<small>Attachment unavailable</small>'}</div>`;
    }
    return `<div class="message ${mine ? 'mine' : ''}"><p>${escapeHTML(mine ? 'You' : sender?.name || 'AUW Connect')}</p>${message.text ? `<div class="message-bubble">${safeText}</div>` : ''}${attachmentHTML}<time>${escapeHTML(message.time)}</time></div>`;
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
  const items = data.courseMaterials.filter(item => (item.group === 'All UG Points' || item.group === user.group) && (!getCourse(item.courseId)?.trimester || !user.trimester || getCourse(item.courseId).trimester === user.trimester)).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
  host.innerHTML = items.map(item => `<article class="announcement-card"><div class="announcement-card-top"><span class="announcement-category category-academic">${escapeHTML(item.group)}</span><small>${escapeHTML(item.date || '')}</small></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(courseName(item.courseId))} · Shared by ${escapeHTML(getUser(item.authorId)?.name || 'Faculty')}</p>${item.description ? `<p>${escapeHTML(item.description)}</p>` : ''}<p><strong>File:</strong> ${escapeHTML(item.fileName || 'No attachment')}</p>${item.fileUrl ? `<a class="button button-primary" href="${item.fileUrl}" target="_blank" rel="noopener">Download material</a>` : '<span class="muted">The attachment is unavailable. Refresh and try again.</span>'}</article>`).join('') || '<article class="panel"><p class="muted">No course materials have been shared with your UG group yet.</p></article>';
}
function renderFacultyMaterials() {
  const user = currentUser();
  const host = $('#facultyMaterialsList');
  if (!host) return;
  const items = data.courseMaterials.filter(item => user.role === 'Admin' || item.authorId === user.id).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
  host.innerHTML = items.map(item => `<article class="announcement-card"><div class="announcement-card-top"><span class="announcement-category category-academic">${escapeHTML(item.group)}</span><small>${escapeHTML(item.date || '')}</small></div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(courseName(item.courseId))} · For ${escapeHTML(item.group)}</p>${item.description ? `<p>${escapeHTML(item.description)}</p>` : ''}<p><strong>Attachment:</strong> ${escapeHTML(item.fileName || 'No file')}</p>${item.fileUrl ? `<a href="${item.fileUrl}" target="_blank" rel="noopener">View attachment</a>` : ''}<div class="form-row"><button type="button" class="button button-outline" data-edit-material="${escapeHTML(item.id)}">Edit</button><button type="button" class="remove-btn" data-delete-material="${escapeHTML(item.id)}">Delete material</button></div></article>`).join('') || '<p class="muted">You have not shared any materials yet.</p>';
}

function renderFaculty() {
  const user = currentUser();
  renderTeachers();
  if ($('#gradeTrimester')) $('#gradeTrimester').value = data.registrationSettings.trimester;
  const allStudents = user.role === 'Teacher' && directoryProfiles.length ? directoryProfiles.filter(item => item.role === 'Student') : data.users.filter(item => item.role === 'Student');
  const students = allStudents.filter(item => facultyUgFilter === 'all' || String(item.group || '').trim() === facultyUgFilter);
  const actualSchedules = getActualTeachingSchedules();
  const schedules = actualSchedules.filter(item => user.role === 'Admin' ? true : item.teacherId === user.id);
  $('#facultyStudentCount').textContent = students.length;
  const ugFilter = $('#facultyUgFilter');
  if (ugFilter) ugFilter.value = facultyUgFilter;
  $('#facultyCourseCount').textContent = data.courses.length;
  $('#facultyScheduleCount').textContent = schedules.length;
  $('#facultyScheduleBody').innerHTML = schedules.map((item, index) => `<tr><td>${escapeHTML(scheduleDaysLabel(item))}</td><td>Session ${sessionNumber(item, index)} · ${formatTime(item.start)} – ${formatTime(item.end)}</td><td>${escapeHTML(courseName(item.courseId))}<br><small>${escapeHTML(getCourse(item.courseId)?.code || '')}</small></td><td>${escapeHTML(item.room)}</td></tr>`).join('') || '<tr><td colspan="4">No classes assigned by Admin yet.</td></tr>';
  $('#gradeStudent').innerHTML = students.map(item => `<option value="${item.id}">${escapeHTML(item.name)} (${escapeHTML(item.group)})</option>`).join('') || '<option value="">No students in this UG Point</option>';
  const visibleGrades = data.grades.filter(item => {
    const facultyCanSee = user.role === 'Admin' || item.enteredById === user.id || (!item.enteredById && getCourse(item.courseId)?.teacherId === user.id);
    const student = getUser(item.studentId) || allStudents.find(person => person.id === item.studentId);
    return facultyCanSee && student && (facultyUgFilter === 'all' || String(student.group || '').trim() === facultyUgFilter);
  });
  $('#facultyStudentBody').innerHTML = visibleGrades.map(item => {
    const student = getUser(item.studentId) || allStudents.find(person => person.id === item.studentId); const result = gradeFor(item.obtained, item.total);
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
  materialsHost.innerHTML = (data.courseMaterials || []).map(m => `<article class="announcement-card"><h4>${escapeHTML(m.title)}</h4><p>${escapeHTML(courseName(m.courseId))} · ${escapeHTML(m.group)} · Shared by ${escapeHTML(getUser(m.authorId)?.name || 'Faculty')}</p><p>${escapeHTML(m.fileName || 'No attachment')}</p>${m.fileUrl ? `<a href="${m.fileUrl}" target="_blank" rel="noopener">View / download material</a>` : ''}</article>`).join('') || '<p class="muted">No faculty materials have been shared.</p>';
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

  const relevant = (data.assessments || []).filter(a => a.status !== 'archived' && (user.role === 'Student'
    ? studentMatchesAssessmentGroup(user, a)
    : a.createdBy === user.id));
  $('#assessmentList').innerHTML = relevant.map(a => {
    const course = getCourse(a.courseId);
    const submission = a.submissions?.find(x => x.studentId === user.id);
    const deadlineDate = a.deadline ? new Date(a.deadline) : null;
    const isClosed = deadlineDate && Date.now() > deadlineDate.getTime();
    const status = submission
      ? (submission.marks != null ? `Reviewed · ${submission.marks}/${a.total}` : 'Submitted · awaiting review')
      : (isClosed ? 'Deadline passed · submission closed' : 'Not submitted');
    const attachment = a.attachmentUrl
      ? `<p class="assessment-attachment"><b>Attachment:</b> <a href="${a.attachmentUrl}" target="_blank" rel="noopener">${escapeHTML(a.attachmentName || 'Download attachment')}</a></p>`
      : '';
    const studentActions = user.role === 'Student' && !submission && !isClosed
      ? `<button class="button button-primary" type="button" data-submit-assessment="${escapeHTML(a.id)}">Submit work</button>` : '';
    const facultyActions = user.role === 'Teacher'
      ? `<div class="assessment-actions"><button class="button button-outline" type="button" data-edit-assessment="${escapeHTML(a.id)}">Edit</button><button class="button button-outline" type="button" data-delete-assessment="${escapeHTML(a.id)}">Delete</button></div>` : '';
    return `<article class="announcement-card"><h3>${escapeHTML(a.title)}</h3><p>${escapeHTML(course?.name || 'Course')} · ${escapeHTML(a.group)} · ${escapeHTML(a.type || 'Assessment')}</p><p><b>Category:</b> ${escapeHTML(a.category || 'Other')} · <b>Total:</b> ${Number(a.total)} marks</p><p><b>Deadline:</b> ${escapeHTML(deadlineDate ? deadlineDate.toLocaleString() : 'No deadline')}</p><p>${escapeHTML(a.instructions || '')}</p>${attachment}<p><b>${user.role === 'Student' ? 'Your status:' : 'Submissions:'}</b> ${user.role === 'Student' ? escapeHTML(status) : `${(a.submissions || []).length} student submission(s)`}</p>${submission?.feedback ? `<p><b>Faculty feedback:</b> ${escapeHTML(submission.feedback)}</p>` : ''}${studentActions}${facultyActions}</article>`;
  }).join('') || `<p class="muted">${user.role === 'Student' ? 'No assessments are currently assigned to your group.' : 'You have not created any assessments yet.'}</p>`;

  if (user.role === 'Teacher') {
    const rows = [];
    relevant.forEach(a => (a.submissions || []).forEach(sub => rows.push(`<tr><td>${escapeHTML(getUser(sub.studentId)?.name || 'Former student')}</td><td>${escapeHTML(a.title)}</td><td>${escapeHTML(a.group)}</td><td>${sub.fileName ? (sub.fileUrl ? `<a href="${sub.fileUrl}" target="_blank" rel="noopener">${escapeHTML(sub.fileName)}</a>` : escapeHTML(sub.fileName)) : 'Text response'}${sub.answer ? `<details><summary>View answer</summary><p>${escapeHTML(sub.answer)}</p></details>` : ''}<small class="muted">Submitted: ${escapeHTML(new Date(sub.submittedAt).toLocaleString())}</small></td><td>${sub.marks == null ? 'Pending' : `${sub.marks}/${a.total}`}</td><td><button class="text-button" type="button" data-grade-submission="${escapeHTML(a.id)}|${escapeHTML(sub.studentId)}">Grade / feedback</button></td></tr>`)));
    $('#assessmentSubmissions').innerHTML = `<table><thead><tr><th>Student</th><th>Assessment</th><th>Group</th><th>Work</th><th>Marks</th><th>Action</th></tr></thead><tbody>${rows.join('') || '<tr><td colspan="6">No student submissions yet.</td></tr>'}</tbody></table>`;
  }
}


// Shared office-hour data: Supabase is the source of truth across devices.
function officeSlotFromRow(row) {
  const start = new Date(row.starts_at);
  return { id: row.id, facultyId: row.faculty_id, date: localDateISO(start), time: `${String(start.getHours()).padStart(2,'0')}:${String(start.getMinutes()).padStart(2,'0')}`, bookedBy: row.is_available ? '' : 'reserved', isAvailable: !!row.is_available };
}
function appointmentFromRow(row, slotMap) {
  const slot = slotMap.get(row.office_hour_id);
  const statusMap = { pending:'Pending', approved:'Approved', declined:'Declined', cancelled:'Cancelled', completed:'Completed', no_show:'No-show' };
  return { id: row.id, studentId: row.student_id, facultyId: row.faculty_id, officeHourId: row.office_hour_id, date: slot?.date || '', time: slot?.time || '', reason: row.student_note || row.topic || 'Office-hour appointment', status: statusMap[String(row.status || 'pending').toLowerCase()] || (String(row.status).toLowerCase()==='no_show'?'No-show':row.status) || 'Pending', facultyNote: row.faculty_note || '', cancellationReason: row.cancellation_reason || '', createdAt: row.created_at };
}
function isDatabaseUUID(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '')); }
async function syncOfficeHourNotifications(showErrors = false) {
  const me = currentUser();
  if (!me?.id) return false;
  try {
    const { data: rows, error } = await supabaseClient.from('notifications')
      .select('id, user_id, title, body, read_at, created_at')
      .eq('user_id', me.id).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    // Keep existing browser-only notifications from unrelated portal features;
    // replace only database-backed notifications with the shared Supabase rows.
    const localOnly = (data.notifications || []).filter(n => n.userId === me.id && !isDatabaseUUID(n.id));
    const shared = (rows || []).map(row => ({
      id: row.id, userId: row.user_id, actorId: null,
      title: row.title || 'AUW Connect update', message: row.body || '',
      type: 'office-hour', relatedId: '', createdAt: row.created_at,
      read: !!row.read_at, readAt: row.read_at || null
    }));
    data.notifications = [...shared, ...localOnly].sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    updateNotificationBadge();
    if ($('#view-notifications')?.classList.contains('active')) renderNotifications();
    return true;
  } catch (error) {
    console.error('Shared notification sync failed:', error);
    if (showErrors) showToast(`Notifications could not load: ${error.message || 'Check Supabase permissions.'}`);
    return false;
  }
}
async function syncOfficeHourData(showErrors = false) {
  const me = currentUser();
  if (!me?.id) return false;
  try {
    let hoursQuery = supabaseClient.from('office_hours').select('id, faculty_id, starts_at, ends_at, location, meeting_link, is_available');
    if (me.role === 'Teacher') hoursQuery = hoursQuery.eq('faculty_id', me.id);
    // Students also need booked/past slot timestamps to display their appointment history.
    // availableSlots() filters unavailable slots from the booking form.
    const { data: hourRows, error: hourError } = await hoursQuery.order('starts_at', { ascending: true });
    if (hourError) throw hourError;
    const slotMap = new Map((hourRows || []).map(row => [row.id, row]));
    data.officeHours = (hourRows || []).map(officeSlotFromRow);
    let appointmentQuery = supabaseClient.from('appointments').select('id, office_hour_id, faculty_id, student_id, topic, student_note, status, faculty_note, cancellation_reason, created_at');
    appointmentQuery = me.role === 'Teacher' ? appointmentQuery.eq('faculty_id', me.id) : appointmentQuery.eq('student_id', me.id);
    const { data: appointmentRows, error: appointmentError } = await appointmentQuery.order('created_at', { ascending: false });
    if (appointmentError) throw appointmentError;
    data.appointments = (appointmentRows || []).map(row => appointmentFromRow(row, slotMap));
    await syncOfficeHourNotifications(false);
    saveData();
    return true;
  } catch (error) {
    console.error('Office-hour Supabase sync failed:', error);
    if (showErrors) showToast(`Office-hour data could not load: ${error.message || 'Check Supabase permissions.'}`);
    return false;
  }
}
// Shared academic records: Supabase is the source of truth across devices.
function academicFileName(name) {
  return String(name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'attachment';
}
async function uploadAcademicFile(file, folder) {
  if (!file) return '';
  const user = currentUser();
  const path = `${user.id}/${folder}/${crypto.randomUUID()}_${academicFileName(file.name)}`;
  const { error } = await supabaseClient.storage.from('auw-academic-files').upload(path, file, {
    contentType: file.type || 'application/octet-stream', upsert: false
  });
  if (error) throw error;
  return path;
}
async function academicFileUrl(path) {
  if (!path) return '';
  const { data: signed, error } = await supabaseClient.storage.from('auw-academic-files').createSignedUrl(path, 3600);
  if (error) { console.warn('Academic attachment link could not be created:', error.message); return ''; }
  return signed?.signedUrl || '';
}
function supabaseCourseId(localId) { return data.supabaseCourseIdByLocal?.[String(localId)] || localId; }
function portalCourseId(databaseId) { return data.portalCourseIdBySupabase?.[String(databaseId)] || databaseId; }
async function getOrCreateGradeRecord(studentId, courseId, trimester, facultyId) {
  const { data: found, error: findError } = await supabaseClient.from('grade_records')
    .select('id').eq('student_id', studentId).eq('course_id', supabaseCourseId(courseId))
    .eq('trimester', trimester).eq('entered_by', facultyId).limit(1).maybeSingle();
  if (findError) throw findError;
  if (found?.id) return found.id;
  const { data: created, error: insertError } = await supabaseClient.from('grade_records').insert({
    student_id: studentId, course_id: supabaseCourseId(courseId), trimester, total_marks: 0,
    published: false, entered_by: facultyId, credits: Number(getCourse(courseId)?.credits) || 1
  }).select('id').single();
  if (insertError) throw insertError;
  return created.id;
}
async function saveComponentMarkToSupabase(studentId, courseId, category, percentage, trimester, facultyId) {
  const gradeRecordId = await getOrCreateGradeRecord(studentId, courseId, trimester, facultyId);
  const { data: existing, error: findError } = await supabaseClient.from('grade_components')
    .select('id').eq('grade_record_id', gradeRecordId).eq('category', category).limit(1).maybeSingle();
  if (findError) throw findError;
  if (percentage == null) {
    if (existing?.id) {
      const { error } = await supabaseClient.from('grade_components').delete().eq('id', existing.id);
      if (error) throw error;
    }
    return gradeRecordId;
  }
  const weight = Number(COMPONENT_WEIGHTS[category]) || 0;
  const values = { obtained_marks: percentage, total_marks: 100, weight };
  const result = existing?.id
    ? await supabaseClient.from('grade_components').update(values).eq('id', existing.id)
    : await supabaseClient.from('grade_components').insert({ grade_record_id: gradeRecordId, category, ...values });
  if (result.error) throw result.error;
  return gradeRecordId;
}

async function syncAcademicData(showErrors = false) {
  const me = currentUser();
  if (!me?.id) return false;
  try {
    // Any signed-in user can safely ask the database to publish results whose scheduled time has arrived.
    try { await supabaseClient.rpc('publish_due_grade_results'); } catch (scheduleError) { console.warn('Scheduled result check unavailable:', scheduleError.message || scheduleError); }
    const [courseResult, materialResult, assessmentResult, gradeResult, taskResult] = await Promise.all([
      supabaseClient.from('courses').select('id, code, name, credits, faculty_id, trimester').order('code'),
      supabaseClient.from('course_materials').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('assessments').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('grade_records').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('study_tasks').select('*').order('created_at', { ascending: false })
    ]);
    for (const result of [courseResult, materialResult, assessmentResult, gradeResult, taskResult]) if (result.error) throw result.error;

    if (courseResult.data?.length) {
      const byCode = new Map((data.courses || []).map(course => [String(course.code || '').toUpperCase(), course]));
      data.supabaseCourseIdByLocal = {}; data.portalCourseIdBySupabase = {};
      courseResult.data.forEach(row => {
        const local = byCode.get(String(row.code || '').toUpperCase());
        const localId = local?.id || row.id;
        data.supabaseCourseIdByLocal[String(localId)] = row.id;
        data.portalCourseIdBySupabase[String(row.id)] = localId;
        if (local) Object.assign(local, { code: row.code, name: row.name, credits: Number(row.credits) || 1, teacherId: row.faculty_id || local.teacherId || '', trimester: row.trimester || local.trimester || '' });
        else data.courses.push({ id: row.id, code: row.code, name: row.name, credits: Number(row.credits) || 1, teacherId: row.faculty_id || '', trimester: row.trimester || '' });
      });
    }

    data.courseMaterials = await Promise.all((materialResult.data || []).map(async row => ({
      id: row.id, title: row.title, description: row.description || '', courseId: portalCourseId(row.course_id),
      group: row.target_ug_point || 'All UG Points', authorId: row.faculty_id,
      filePath: row.file_path, fileName: row.file_path?.split('/').pop()?.replace(/^.*?_/, '') || 'Course material',
      fileUrl: await academicFileUrl(row.file_path), createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
      date: row.created_at ? new Date(row.created_at).toLocaleDateString() : ''
    })));

    const assessmentRows = assessmentResult.data || [];
    const assessmentIds = assessmentRows.map(row => row.id);
    let submissionRows = [];
    if (assessmentIds.length) {
      const submissionResult = await supabaseClient.from('assessment_submissions').select('*').in('assessment_id', assessmentIds);
      if (submissionResult.error) throw submissionResult.error;
      submissionRows = submissionResult.data || [];
    }
    const submissionsByAssessment = new Map();
    for (const row of submissionRows) {
      const list = submissionsByAssessment.get(row.assessment_id) || [];
      list.push({ id: row.id, studentId: row.student_id, answer: row.answer_text || '', filePath: row.file_path || '',
        fileName: row.file_path?.split('/').pop()?.replace(/^.*?_/, '') || '', fileUrl: await academicFileUrl(row.file_path),
        submittedAt: row.submitted_at, marks: row.marks_obtained == null ? null : Number(row.marks_obtained), feedback: row.feedback || '' });
      submissionsByAssessment.set(row.assessment_id, list);
    }
    data.assessments = await Promise.all(assessmentRows.map(async row => ({
      id: row.id, title: row.title, courseId: portalCourseId(row.course_id), group: row.target_ug_point || 'All UG Points',
      type: row.assessment_type || 'Assessment', category: row.grading_category || 'Quiz', total: Number(row.total_marks) || 100,
      deadline: row.deadline || '', instructions: row.instructions || '', attachmentPath: row.attachment_path || '',
      attachmentName: row.attachment_path?.split('/').pop()?.replace(/^.*?_/, '') || '', attachmentUrl: await academicFileUrl(row.attachment_path),
      createdBy: row.faculty_id, trimester: data.courses.find(course => course.id === portalCourseId(row.course_id))?.trimester || data.registrationSettings?.trimester || 'Fall 2026',
      status: row.status, submissions: submissionsByAssessment.get(row.id) || []
    })));

    const taskRows = taskResult.data || [];
    const taskIds = taskRows.map(row => row.id);
    let taskSubmissionRows = [];
    if (taskIds.length) {
      const taskSubmissionResult = await supabaseClient.from('study_task_submissions').select('*').in('study_task_id', taskIds);
      if (taskSubmissionResult.error) throw taskSubmissionResult.error;
      taskSubmissionRows = taskSubmissionResult.data || [];
    }
    const taskSubsByTask = new Map();
    for (const row of taskSubmissionRows) {
      const list = taskSubsByTask.get(row.study_task_id) || [];
      list.push({ id: row.id, studentId: row.student_id, text: row.answer_text || '', filePath: row.file_path || '',
        fileName: row.file_path?.split('/').pop()?.replace(/^.*?_/, '') || '', fileUrl: await academicFileUrl(row.file_path),
        submittedAt: row.submitted_at, feedback: row.feedback || '' });
      taskSubsByTask.set(row.study_task_id, list);
    }
    data.studyTasks = await Promise.all(taskRows.map(async row => ({
      id: row.id, title: row.title, type: row.task_type || 'Study task', courseId: portalCourseId(row.course_id),
      group: row.target_ug_point || 'All UG Points', instructions: row.instructions || '', deadline: row.due_at || '',
      filePath: row.attachment_path || '', fileName: row.attachment_path?.split('/').pop()?.replace(/^.*?_/, '') || '',
      fileUrl: await academicFileUrl(row.attachment_path), authorId: row.faculty_id,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : 0, submissions: taskSubsByTask.get(row.id) || []
    })));

    const gradeRows = gradeResult.data || [];
    const gradeById = new Map(gradeRows.map(row => [row.id, row]));
    // Students receive only their component-progress fields through a restricted RPC.
    // This avoids exposing unpublished final totals from grade_records.
    let componentRows = [];
    if (me.role === 'Student') {
      const componentResult = await supabaseClient.rpc('get_my_grade_progress');
      if (componentResult.error) throw componentResult.error;
      componentRows = componentResult.data || [];
    } else {
      const componentResult = await supabaseClient.from('grade_components').select('*');
      if (componentResult.error) throw componentResult.error;
      componentRows = componentResult.data || [];
    }
    data.grades = gradeRows.map(row => ({
      id: row.id, studentId: row.student_id, courseId: portalCourseId(row.course_id), trimester: row.trimester,
      obtained: Number(row.total_marks) || 0, total: 100, feedback: row.feedback || '', enteredById: row.entered_by,
      published: !!row.published, publishedAt: row.published_at || '', scheduledPublishAt: row.scheduled_publish_at || '',
      credits: Number(row.credits) || 1, resultSource: 'manual'
    }));
    data.componentMarks = componentRows.map(row => {
      const parent = me.role === 'Student' ? row : gradeById.get(row.grade_record_id);
      if (!parent) return null;
      return { id: row.id, gradeRecordId: row.grade_record_id, studentId: parent.student_id,
        courseId: portalCourseId(parent.course_id), trimester: parent.trimester, category: row.category,
        percentage: Number(row.total_marks) ? Number(row.obtained_marks) / Number(row.total_marks) * 100 : 0,
        enteredById: parent.entered_by, updatedAt: row.updated_at || null };
    }).filter(Boolean);
    // Mark published results that contain component rows so faculty preview can identify them.
    data.grades.forEach(grade => { if (componentRows.some(component => component.grade_record_id === grade.id)) grade.resultSource = 'components'; });
    // If a published final result is corrected later, keep the official result in sync
    // with the six saved components and let the database trigger notify the student.
    if (me.role === 'Teacher') {
      for (const grade of data.grades.filter(item => item.enteredById === me.id && item.published === true && item.resultSource === 'components')) {
        const correctedMark = calculateFinalWeightedMark(grade.studentId, grade.courseId, grade.trimester);
        if (correctedMark === null || Math.abs(correctedMark - Number(grade.obtained || 0)) < 0.005) continue;
        const correctedGrade = gradeFor(correctedMark, 100);
        const { error: correctionError } = await supabaseClient.from('grade_records').update({
          total_marks: correctedMark, letter_grade: correctedGrade.letter, grade_point: correctedGrade.gpa,
          published_at: new Date().toISOString()
        }).eq('id', grade.id).eq('entered_by', me.id);
        if (correctionError) throw correctionError;
        grade.obtained = correctedMark;
        grade.publishedAt = new Date().toISOString();
      }
    }
    saveData();
    renderCourseMaterials(); renderFacultyMaterials(); renderStudyTasks(); renderAssessments(); renderGrades(); renderAcademicHistory();
    return true;
  } catch (error) {
    console.error('Academic Supabase sync failed:', error);
    if (showErrors) showToast(`Academic records could not sync: ${error.message || 'Check Supabase policies.'}`);
    return false;
  }
}

function startAcademicRealtime() {
  const me = currentUser();
  if (!me?.id) return;
  if (academicRealtimeChannel) supabaseClient.removeChannel(academicRealtimeChannel);
  let refreshTimer = null;
  const refreshAcademic = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      syncAcademicData(false);
      syncOfficeHourNotifications(false);
    }, 250);
  };
  academicRealtimeChannel = supabaseClient.channel(`auw-academic-${me.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${me.id}` }, () => syncOfficeHourNotifications(false))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments' }, refreshAcademic)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'assessment_submissions' }, refreshAcademic)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'course_materials' }, refreshAcademic)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'study_tasks' }, refreshAcademic)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'study_task_submissions' }, refreshAcademic)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'grade_records' }, refreshAcademic)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'grade_components' }, refreshAcademic)
    .subscribe(status => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn('Academic realtime channel status:', status);
    });
}

const OFFICE_HOUR_CUTOFF = '2026-12-06'; // Last day of this trimester.
function officeSlotStart(date, time) { return new Date(`${date}T${time}:00`).toISOString(); }
function localDateISO(date = new Date()) { const d=new Date(date.getTime()-date.getTimezoneOffset()*60000); return d.toISOString().slice(0,10); }
function timeToMinutes(value) { const [h,m]=value.split(':').map(Number); return h*60+m; }
function minutesToTime(value) { return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`; }
function facultyMembers() { const signedIn=currentUser(); if (signedIn?.role === 'Student') return directoryProfiles.filter(u => u.role === 'Teacher'); return data.users.filter(u => u.role === 'Teacher'); }
function availableSlots(facultyId, date) {
  if (date > OFFICE_HOUR_CUTOFF) return [];
  const unique = new Map();
  data.officeHours.filter(s=>s.facultyId===facultyId && s.date===date && s.date<=OFFICE_HOUR_CUTOFF && s.isAvailable !== false && !s.bookedBy).sort((a,b)=>a.time.localeCompare(b.time)).forEach(slot=>{ if(!unique.has(slot.time)) unique.set(slot.time,slot); });
  return [...unique.values()];
}
function renderAppointments() {
  const user=currentUser();
  if (!user) return;
  const directory=$('#facultyDirectoryContent'), booking=$('#studentBookingContent'), mine=$('#studentAppointmentsContent'), hours=$('#facultyOfficeHoursContent'), requests=$('#facultyRequestsContent');
  if (directory) directory.innerHTML=facultyMembers().map(f=>`<div class="list-row"><div><strong>${escapeHTML(f.name)}</strong><p class="muted">${escapeHTML(f.email)}</p></div><button class="button button-outline" data-book-faculty="${f.id}">View available slots</button></div>`).join('') || '<p class="muted">No faculty profiles are available.</p>';
  if (booking) {
    const chosen=$('#bookingFaculty')?.value || facultyMembers()[0]?.id || '';
    const requestedDate=$('#bookingDate')?.value || localDateISO();
    const date=requestedDate>OFFICE_HOUR_CUTOFF?OFFICE_HOUR_CUTOFF:requestedDate;
    const slots=availableSlots(chosen,date);
    const activeBooking=data.appointments.some(a=>a.studentId===user.id&&a.facultyId===chosen&&['Pending','Approved'].includes(a.status));
    booking.innerHTML=`<form id="studentAppointmentForm" class="form-stack"><label>Faculty member<select id="bookingFaculty" required>${facultyMembers().map(f=>`<option value="${f.id}" ${f.id===chosen?'selected':''}>${escapeHTML(f.name)}</option>`).join('')}</select></label><label>Date<input type="date" id="bookingDate" min="${localDateISO()}" max="${OFFICE_HOUR_CUTOFF}" value="${date}" required></label><small class="muted">Appointments are available only through December 6, 2026.</small><label>Available 15-minute time slot<select id="bookingTime" required><option value="">Choose an available time</option>${slots.map(s=>`<option value="${s.time}">${formatTime(s.time)}</option>`).join('')}</select></label><label>Reason for appointment<textarea id="bookingReason" minlength="8" maxlength="500" required placeholder="Briefly explain what academic support you need"></textarea></label><button class="button button-primary" type="submit" ${slots.length&&!activeBooking?'':'disabled'}>Book appointment</button><small class="muted">Each appointment is 15 minutes. You can hold only one active appointment with this faculty member. After it is completed or canceled, you may book another.</small></form>${activeBooking?'<p class="weekly-office-summary">You already have an active appointment with this faculty member. Complete or cancel it before booking another.</p>':''}${slots.length?'':'<p class="muted">No available slots for this faculty member on this date. Try another date or faculty member.</p>'}`;
  }
  if (mine) {
    const rows=data.appointments.filter(a=>a.studentId===user.id).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
    const activeTab=mine.dataset.activeTab||'upcoming';
    const filtered=rows.filter(a=>activeTab==='upcoming'?['Pending','Approved'].includes(a.status):activeTab==='completed'?['Completed','No-show'].includes(a.status):['Cancelled','Canceled','Declined'].includes(a.status));
    mine.innerHTML=filtered.map(a=>`<div class="list-row"><div><strong>${escapeHTML(getUser(a.facultyId)?.name||'Faculty')}</strong><p>${escapeHTML(a.date)} · ${formatTime(a.time)} · 15 minutes</p><p class="muted appointment-reason">${escapeHTML(a.reason)} · <span class="appointment-status">${escapeHTML(a.status)}</span>${a.cancellationReason?`<br>Cancellation reason: ${escapeHTML(a.cancellationReason)}`:''}${a.facultyNote?`<br>Faculty note: ${escapeHTML(a.facultyNote)}`:''}</p></div><div>${['Pending','Approved'].includes(a.status)?`<button class="button button-outline" data-cancel-appointment="${a.id}">Cancel</button>`:''}</div></div>`).join('') || '<p class="muted">No appointments in this category yet.</p>';
    document.querySelectorAll('[data-appointment-tab]').forEach(btn=>{const active=btn.dataset.appointmentTab===activeTab;btn.classList.toggle('button-primary',active);btn.classList.toggle('button-outline',!active);});
  }
  if (hours && user.role==='Teacher') {
    const dayOptions=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const own=data.officeHours.filter(s=>s.facultyId===user.id && s.date>=localDateISO() && s.date<=OFFICE_HOUR_CUTOFF).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    const byDate=new Map();
    own.forEach(slot=>{if(!byDate.has(slot.date))byDate.set(slot.date,new Map());const daySlots=byDate.get(slot.date);const previous=daySlots.get(slot.time);if(!previous || (!slot.isAvailable && previous.isAvailable))daySlots.set(slot.time,slot);});
    const upcomingGroups=[...byDate.entries()].slice(0,14);
    const upcomingHtml=upcomingGroups.map(([date,slots])=>{const entries=[...slots.values()].sort((a,b)=>a.time.localeCompare(b.time));return `<section class="office-date-card"><div class="office-date-heading"><strong>${escapeHTML(date)}</strong><span>${entries.length} slot${entries.length===1?'':'s'}</span></div><div class="office-slot-chips">${entries.map(slot=>`<span class="office-slot-chip ${slot.isAvailable?'is-available':'is-booked'}">${formatTime(slot.time)} <small>${slot.isAvailable?'Available':'Booked'}</small></span>`).join('')}</div></section>`;}).join('');
    hours.innerHTML=`<form id="officeHourForm" class="weekly-office-form"><div class="weekly-office-days"><section class="weekly-office-day"><strong>Weekly day 1</strong><label>Day<select id="officeDay1" required>${dayOptions.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></label><label>Start time<input id="officeStart1" type="time" value="09:00" required></label><label>End time<input id="officeEnd1" type="time" value="11:00" readonly></label></section><section class="weekly-office-day"><strong>Weekly day 2</strong><label>Day<select id="officeDay2" required>${dayOptions.map((d,i)=>`<option value="${i}" selected>${d}</option>`).join('')}</select></label><label>Start time<input id="officeStart2" type="time" value="13:00" required></label><label>End time<input id="officeEnd2" type="time" value="15:00" readonly></label></section></div><div class="weekly-office-summary">Each day provides exactly 2 hours of availability: 8 appointments × 15 minutes. Your schedule repeats weekly through December 6, 2026 only. Changes replace future unbooked slots only; confirmed appointments remain unchanged.</div><button class="button button-primary" type="submit">Save weekly schedule</button></form><div class="office-upcoming-heading"><h4>Your upcoming availability</h4><span>Grouped by date</span></div><div class="office-date-list">${upcomingHtml||'<p class="muted">No upcoming slots published yet.</p>'}</div>`;
    const day1=$('#officeDay1'),day2=$('#officeDay2'),start1=$('#officeStart1'),start2=$('#officeStart2');
    const updateEnd=(startId,endId)=>{const start=$(`#${startId}`)?.value;if(start){const end=timeToMinutes(start)+120;const endField=$(`#${endId}`);if(endField)endField.value=end<1440?minutesToTime(end):'';}};
    updateEnd('officeStart1','officeEnd1');updateEnd('officeStart2','officeEnd2');
    if(day1&&day2&&day1.value===day2.value)day2.value=String((Number(day1.value)+1)%7);
    start1?.addEventListener('change',()=>updateEnd('officeStart1','officeEnd1'));
    start2?.addEventListener('change',()=>updateEnd('officeStart2','officeEnd2'));
    day1?.addEventListener('change',()=>{if(day1.value===day2.value)day2.value=String((Number(day1.value)+1)%7);});
    day2?.addEventListener('change',()=>{if(day1.value===day2.value)day1.value=String((Number(day2.value)+1)%7);});
  }
  if (requests && user.role==='Teacher') {
    const rows=data.appointments.filter(a=>a.facultyId===user.id).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    requests.innerHTML=rows.map(a=>`<div class="list-row"><div><strong>${escapeHTML(getUser(a.studentId)?.name||'Student')}</strong><p>${a.date} · ${formatTime(a.time)} · 15 minutes</p><p class="muted appointment-reason">${escapeHTML(a.reason)} · <span class="appointment-status">${escapeHTML(a.status)}</span>${a.cancellationReason?`<br>Cancellation reason: ${escapeHTML(a.cancellationReason)}`:''}</p></div><div>${a.status==='Pending'?`<button class="button button-primary" data-appointment-action="Approved" data-appointment-id="${a.id}">Approve</button><button class="button button-outline" data-appointment-action="Declined" data-appointment-id="${a.id}">Decline</button>`:''}${a.status==='Approved'?`<button class="button button-outline" data-appointment-action="Completed" data-appointment-id="${a.id}">Completed</button><button class="button button-outline" data-appointment-action="No-show" data-appointment-id="${a.id}">No-show</button><button class="button button-outline danger-button" data-appointment-action="Cancelled" data-appointment-id="${a.id}">Cancel</button>`:''}</div></div>`).join('')||'<p class="muted">No appointment requests yet.</p>';
  }
}

let directoryProfiles = [];
let lastAcademicSyncAt = 0;
async function renderUserDirectory() {
  const user = currentUser();
  const host = user.role === 'Student' ? $('#facultyDirectoryContent') : $('#studentDirectoryContent');
  if (!host) return;
  host.innerHTML = '<p class="muted">Loading registered users…</p>';
  const wantedRole = user.role === 'Student' ? 'faculty' : 'student';
  const { data: rows, error } = await supabaseClient
    .from('profiles')
    .select('id, full_name, email, username, role, ug_point, trimester, subject, teaching_ug_points')
    .eq('role', wantedRole)
    .order('full_name', { ascending: true });
  if (error) {
    console.error('Directory loading failed:', error);
    host.innerHTML = '<p class="muted">The directory could not be loaded. Please check your profile table permissions.</p>';
    return;
  }
  directoryProfiles = (rows || []).map(profileToPortalUser);
  // Merge the registered opposite-role accounts into the in-memory directory.
  // Grade entry and office-hour booking both read from this shared user list.
  const otherRole = user.role === 'Student' ? 'Teacher' : 'Student';
  const ownUser = data.users.find(item => item.id === user.id);
  data.users = [ ...(ownUser ? [ownUser] : []), ...data.users.filter(item => item.id !== user.id && item.role !== otherRole), ...directoryProfiles ];
  if (user.role === 'Student') renderAppointments();
  else { renderFaculty(); renderComponentMarksPanel(); renderGrades(); renderFinalizationPanel(); renderAcademicHistory(); }
  if (user.role === 'Student') {
    host.innerHTML = directoryProfiles.map(person => `<div class="list-row"><div><strong>${escapeHTML(person.name)}</strong><p class="muted">${escapeHTML(person.subject || 'Faculty subject not selected yet')} · Teaches: ${escapeHTML((person.teachingUgPoints || []).join(', ') || 'Teaching UG Points not selected yet')}</p><small>${escapeHTML(person.email)}</small></div></div>`).join('') || '<p class="muted">No faculty accounts have registered yet.</p>';
  } else {
    const directoryFilter = $('#studentDirectoryUgFilter');
    if (directoryFilter) directoryFilter.value = facultyUgFilter;
    const visibleStudents = directoryProfiles.filter(person => person.role === 'Student' && (facultyUgFilter === 'all' || String(person.group || '').trim() === facultyUgFilter));
    host.innerHTML = visibleStudents.map(person => `<div class="list-row"><div><strong>${escapeHTML(person.name)}</strong><p class="muted">${escapeHTML(person.group || 'UG Point not set')} · Mathematics, English and CTP</p><small>${escapeHTML(person.email)}</small></div></div>`).join('') || '<p class="muted">No students found for this UG Point.</p>';
  }
}

function renderCurrentView(view) {
  if (view === 'student-directory' || view === 'faculty-directory') renderUserDirectory();
  if (view === 'notifications') renderNotifications();
  if (view === 'overview') renderOverview();
  if (view === 'profile') renderIdentity();
  if (view === 'schedule') renderSchedule();
  if (view === 'assessment') renderAssessments();
    if (view === 'registration') renderRegistration();
  if (view === 'materials') { renderCourseMaterials(); renderStudyTasks(); }
  if (view === 'grades') { renderGrades(); renderFinalizationPanel(); }
  if (view === 'cgpa') renderAcademicHistory();
  if (view === 'faculty-materials') renderStudyTasks();
  if (view === 'student-messenger' && currentUser().role === 'Student') renderConversations();
  if (view === 'faculty-materials' && currentUser().role === 'Teacher') { renderFacultyMaterials(); renderStudyTasks(); renderTeachers(); }
  
  if (view === 'faculty') renderFaculty();
  if (view === 'admin') renderAdmin();
}

function renderStudyTasks() {
  const user = currentUser();
  const studentHost = $('#studentTasksList');
  if (studentHost) {
    if (user.role !== 'Student') studentHost.innerHTML = '';
    else {
      const tasks = data.studyTasks.filter(task => (task.group === 'All UG Points' || task.group === user.group) && (!getCourse(task.courseId)?.trimester || !user.trimester || getCourse(task.courseId).trimester === user.trimester)).sort((a,b) => String(a.deadline).localeCompare(String(b.deadline)));
      studentHost.innerHTML = tasks.length ? tasks.map(task => {
        const submission = (task.submissions || []).find(item => item.studentId === user.id);
        const overdue = !submission && task.deadline && new Date(task.deadline).getTime() < Date.now();
        return `<article class="task-card panel"><div class="panel-heading"><div><p class="eyebrow">${escapeHTML(task.type)} · ${escapeHTML(courseName(task.courseId))}</p><h3>${escapeHTML(task.title)}</h3></div><span class="soft-tag">${submission ? 'Submitted' : overdue ? 'Overdue' : 'Not submitted'}</span></div><p>${escapeHTML(task.instructions).replace(/\n/g,'<br>')}</p><p class="muted">Due: ${escapeHTML(task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline')} · Assigned by ${escapeHTML(getUser(task.authorId)?.name || 'Faculty')}</p>${task.fileUrl ? `<p><a class="text-link" href="${task.fileUrl}" target="_blank" rel="noopener">Download ${escapeHTML(task.fileName || 'task instructions')}</a></p>` : ''}${submission ? `<div class="notice"><strong>Your submission:</strong> ${escapeHTML(submission.text || 'File submitted')}${submission.fileName ? ` · ${escapeHTML(submission.fileName)}` : ''}${submission.fileUrl ? ` · <a href="${submission.fileUrl}" target="_blank" rel="noopener">Download submission</a>` : ''}<br><strong>Submitted:</strong> ${escapeHTML(new Date(submission.submittedAt).toLocaleString())}${submission.feedback ? `<br><strong>Faculty feedback:</strong> ${escapeHTML(submission.feedback)}` : '<br><span class="muted">Feedback not yet provided.</span>'}</div>` : `<form class="form-stack task-submit-form" data-task-submit="${escapeHTML(task.id)}"><label>Your answer / submission notes<textarea name="submissionText" rows="3" maxlength="3000" placeholder="Write your response or describe your attached work"></textarea></label><label>Attach your work (optional)<input name="submissionFile" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png"/></label><button class="button button-primary" type="submit" ${overdue?'disabled':''}>Submit task</button></form>`}</article>`;
      }).join('') : '<p class="muted">No study tasks have been assigned to your group yet.</p>';
    }
  }
  const facultyHost = $('#facultyStudyTasksList');
  if (facultyHost) {
    if (user.role !== 'Teacher') facultyHost.innerHTML = '';
    else {
      const tasks = data.studyTasks.filter(task => task.authorId === user.id).sort((a,b) => b.createdAt-a.createdAt);
      facultyHost.innerHTML = tasks.length ? tasks.map(task => `<article class="task-card panel"><div class="panel-heading"><div><p class="eyebrow">${escapeHTML(task.type)} · ${escapeHTML(courseName(task.courseId))} · ${escapeHTML(task.group)}</p><h3>${escapeHTML(task.title)}</h3></div><button class="button button-outline" type="button" data-delete-study-task="${escapeHTML(task.id)}">Delete</button></div><p>${escapeHTML(task.instructions)}</p><p class="muted">Deadline: ${escapeHTML(task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline')} · ${task.submissions?.length || 0} submission(s)</p>${task.fileUrl ? `<p><a class="text-link" href="${task.fileUrl}" target="_blank" rel="noopener">Download task attachment</a></p>` : ''}${(task.submissions || []).length ? task.submissions.map(sub => `<div class="task-submission"><strong>${escapeHTML(getUser(sub.studentId)?.name || 'Student')}</strong><p>${escapeHTML(sub.text || 'File submitted')}</p>${sub.fileUrl ? `<a class="text-link" href="${sub.fileUrl}" target="_blank" rel="noopener">Download ${escapeHTML(sub.fileName || 'submission')}</a>` : ''}<p class="muted">Submitted ${escapeHTML(new Date(sub.submittedAt).toLocaleString())}</p><form class="task-feedback-form" data-task-feedback="${escapeHTML(task.id)}" data-student-feedback="${escapeHTML(sub.studentId)}"><label>Feedback<textarea name="feedback" rows="2" maxlength="1500" required>${escapeHTML(sub.feedback || '')}</textarea></label><button class="button button-outline" type="submit">Save feedback</button></form></div>`).join('') : '<p class="muted">No student submissions yet.</p>'}</article>`).join('') : '<p class="muted">You have not published any study tasks yet.</p>';
    }
    const courseSelect = $('#taskCourse');
    if (courseSelect) {
      const assignedIds = new Set([...data.courses.filter(course => course.teacherId === user.id).map(course => course.id), ...data.schedules.filter(item => item.teacherId === user.id).map(item => item.courseId)]);
      const owned = assignedIds.size ? data.courses.filter(course => assignedIds.has(course.id)) : data.courses;
      courseSelect.innerHTML = owned.map(course => `<option value="${escapeHTML(course.id)}">${escapeHTML(course.code)} · ${escapeHTML(course.name)}</option>`).join('');
      if (!owned.length) courseSelect.innerHTML = '<option value="">No courses assigned to your account</option>';
    }
  }
}
async function publishStudyTask(form) {
  const user=currentUser(); if(user.role!=='Teacher')return showToast('Only faculty can publish study tasks.');
  const title=$('#taskTitle').value.trim(), courseId=$('#taskCourse').value, group=$('#taskGroup').value, type=$('#taskType').value, instructions=$('#taskInstructions').value.trim(), deadline=$('#taskDeadline').value, file=$('#taskAttachment').files[0];
  const assignedIds = new Set([...data.courses.filter(course => course.teacherId === user.id).map(course => course.id), ...data.schedules.filter(item => item.teacherId === user.id).map(item => item.courseId)]);
  if(!title||!courseId||!instructions||!deadline)return showToast('Complete the task title, course, instructions and deadline.');
  if (assignedIds.size && !assignedIds.has(courseId)) return showToast('You can only assign tasks for a course assigned to you.');
  if(new Date(deadline).getTime()<=Date.now())return showToast('Choose a future deadline.');
  if(file&&file.size>20*1024*1024)return showToast('Please keep the task attachment under 20 MB.');
  let uploadedPath = '';
  try {
    if (file) uploadedPath = await uploadAcademicFile(file, 'study-tasks');
    const payload = { faculty_id:user.id, course_id:supabaseCourseId(courseId), title, task_type:type, instructions,
      target_ug_point:group==='All UG Points'?null:group, due_at:new Date(deadline).toISOString(), attachment_path:uploadedPath || null };
    const { error } = await supabaseClient.from('study_tasks').insert(payload);
    if (error) throw error;
    await syncAcademicData(false);
    form.reset(); renderStudyTasks();
    showToast('Study task saved in Supabase and shared with the assigned students.');
  } catch (error) {
    if (uploadedPath) await supabaseClient.storage.from('auw-academic-files').remove([uploadedPath]);
    console.error('Study task publish failed:', error);
    showToast(`Study task could not be published: ${error.message || 'Please try again.'}`);
  }
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
  {keys:['draft marks','saved draft','progress marks','released progress','final result publish','publish grade'],answer:'PROGRESS MARKS AND OFFICIAL FINAL RESULTS\nFaculty save marks for Attendance, Quiz, Class Participation, Presentation, Midterm and Final Exam in the Grades section. Each saved component mark becomes visible to the relevant student automatically. The complete official final result remains hidden until faculty publishes the whole course result immediately or schedules its publication for a specific date and time. Students can review progress in Grades & Academic Progress; the final result and CGPA appear after official publication.'},
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
  {keys:['release progress','progress release','release marks','publish final grades','final grade'],answer:'PUBLISHING OFFICIAL FINAL RESULTS (FACULTY)\n1. Save the six component marks for every student in the course.\n2. Open Grades & Academic Progress and review the whole-course final result preview.\n3. Choose an official publication date and time, then select Schedule official final result; or choose Publish whole result now.\n4. The scheduled result becomes official at its scheduled time. Students receive Supabase notifications when the final result becomes available. Progress marks do not need a separate release button; students can see them as soon as they are saved.'},
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
  if (currentUser().role === 'Student' || currentUser().role === 'Teacher' || currentUser().role === 'Admin') renderUserDirectory();
  renderNotifications();
  renderIdentity(); renderTeachers(); renderSchedule();
  renderGrades(); renderAcademicHistory(); renderFinalizationPanel(); renderOverview(); renderRegistration();
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
  if (me.role !== 'Student') return showToast('Only students can create Messenger groups.');
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
  $('#confirmCreateGroup').addEventListener('click', async ()=>{
    const selectedIds=[...groupPicker.querySelectorAll('.group-member-checkbox:checked')].map(box=>box.value);
    const title=$('#newGroupName').value.trim();
    if(selectedIds.length<2) return showToast('Select at least two students for your group.');
    if(!title) return showToast('Please enter a group name.');
    const button=$('#confirmCreateGroup'); button.disabled=true;
    try {
      const {data: created,error:createError}=await supabaseClient.from('student_conversations')
        .insert({title:title.slice(0,60),type:'group',owner_id:me.id,is_general:false,ug_point:null})
        .select('id,title,type,owner_id,is_general,ug_point,created_at').single();
      if(createError) throw createError;
      const memberRows=[...new Set([me.id,...selectedIds])].map(user_id=>({conversation_id:created.id,user_id}));
      const {error:memberError}=await supabaseClient.from('student_conversation_members').insert(memberRows);
      if(memberError) throw memberError;
      currentChatId=created.id; messengerLoadedForUser=''; await loadStudentMessenger();
      picker.classList.add('hidden'); groupPicker.classList.add('hidden'); $('#contactResults').classList.remove('hidden'); $('#contactSearch').closest('label').classList.remove('hidden');
      renderConversations(); showToast('Group created and shared with the selected students.');
    } catch(error) { console.error(error); showToast(`Could not create group: ${error.message || 'Please try again.'}`); }
    finally { if ($('#confirmCreateGroup')) $('#confirmCreateGroup').disabled=false; }
  });
}
async function createPrivateChat(otherUserId) {
  const me = currentUser();
  const other = getUser(otherUserId);
  if (me.role !== 'Student' || !other || other.role !== 'Student' || other.id === me.id) return showToast('You can only start a private chat with another student.');
  try {
    let chat = data.conversations.find(item => item.type === 'private' && item.memberIds.length === 2 && item.memberIds.includes(me.id) && item.memberIds.includes(other.id));
    if (!chat) {
      const {data: created,error:createError}=await supabaseClient.from('student_conversations')
        .insert({title:other.name,type:'private',owner_id:me.id,is_general:false,ug_point:null})
        .select('id,title,type,owner_id,is_general,ug_point,created_at').single();
      if(createError) throw createError;
      const {error:memberError}=await supabaseClient.from('student_conversation_members').insert([
        {conversation_id:created.id,user_id:me.id},{conversation_id:created.id,user_id:other.id}
      ]);
      if(memberError) throw memberError;
      currentChatId=created.id;
    } else currentChatId=chat.id;
    messengerLoadedForUser=''; await loadStudentMessenger();
    $('#contactPicker').classList.add('hidden'); goTo('student-messenger');
  } catch(error) { console.error(error); showToast(`Could not start private chat: ${error.message || 'Please try again.'}`); }
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

async function publishWholeCourseResults(scheduleForLater) {
  const user = currentUser();
  if (user.role !== 'Teacher') return showToast('Only faculty can publish official results.');
  const courseId = $('#finalizeCourse')?.value;
  const trimester = $('#finalizeTrimester')?.value.trim() || data.registrationSettings.trimester || 'Fall 2026';
  if (!courseId) return showToast('Choose an assigned course first.');
  const students = facultyCourseStudents(courseId, trimester, user.id).map(person => person.id);
  if (!students.length) return showToast('No students are assigned to this course and trimester.');
  const incomplete = students.filter(studentId => calculateFinalWeightedMark(studentId, courseId, trimester) === null);
  if (incomplete.length) return showToast(`${incomplete.length} student(s) still need all six components. Complete every result before publishing the whole course.`);
  let scheduledAt = null;
  if (scheduleForLater) {
    const localValue = $('#finalizePublishAt')?.value;
    if (!localValue) return showToast('Choose the official publication date and time.');
    const date = new Date(localValue);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) return showToast('Choose a future publication date and time.');
    scheduledAt = date.toISOString();
  }
  try {
    for (const studentId of students) {
      const finalMark = calculateFinalWeightedMark(studentId, courseId, trimester);
      const result = gradeFor(finalMark, 100);
      const grade = data.grades.find(item => item.studentId === studentId && item.courseId === courseId && item.trimester === trimester && item.resultSource === 'components');
      if (!grade) throw new Error(`Grade record missing for ${getUser(studentId)?.name || 'a student'}. Save the component marks again and retry.`);
      const alreadyPublished = grade.published === true;
      const payload = { total_marks: finalMark, letter_grade: result.letter, grade_point: result.gpa,
        feedback: 'Final weighted result calculated from all six course components.',
        published: scheduleForLater ? alreadyPublished : true,
        published_at: scheduleForLater ? (alreadyPublished ? grade.publishedAt : null) : new Date().toISOString(),
        scheduled_publish_at: scheduleForLater && !alreadyPublished ? scheduledAt : null };
      const { error } = await supabaseClient.from('grade_records').update(payload).eq('id', grade.id).eq('entered_by', user.id);
      if (error) throw error;
    }
    await syncAcademicData(false); renderAll();
    showToast(scheduleForLater ? 'Official final results scheduled in Supabase.' : 'Whole course final results published to students.');
  } catch (error) {
    console.error('Whole-course result publication failed:', error);
    showToast(`Final results could not be published: ${error.message || 'Please try again.'}`);
  }
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
      event.preventDefault();
      (async()=>{
        const task=data.studyTasks.find(item=>item.id===submissionForm.dataset.taskSubmit), user=currentUser();
        if(!task||user.role!=='Student'||!(task.group==='All UG Points'||task.group===user.group))return showToast('This task is not available to your account.');
        if((task.submissions||[]).some(item=>item.studentId===user.id))return showToast('You have already submitted this task.');
        const text=submissionForm.elements.submissionText.value.trim(),file=submissionForm.elements.submissionFile.files[0];
        if(!text&&!file)return showToast('Write an answer or attach your work before submitting.');
        if(task.deadline&&new Date(task.deadline).getTime()<Date.now())return showToast('The deadline has passed; submission is closed.');
        if(file&&file.size>20*1024*1024)return showToast('Please keep the submission file under 20 MB.');
        let uploadedPath='';
        try{
          if(file)uploadedPath=await uploadAcademicFile(file,'task-submissions');
          const {error}=await supabaseClient.from('study_task_submissions').insert({study_task_id:task.id,student_id:user.id,answer_text:text||null,file_path:uploadedPath||null});
          if(error)throw error;
          await syncAcademicData(false); renderStudyTasks(); showToast('Your task submission has been saved in Supabase.');
        }catch(error){if(uploadedPath)await supabaseClient.storage.from('auw-academic-files').remove([uploadedPath]);showToast(`Task submission failed: ${error.message||'Please try again.'}`);}
      })(); return;
    }
    const feedbackForm=event.target.closest('.task-feedback-form');
    if(feedbackForm){
      event.preventDefault();
      (async()=>{
        if(currentUser().role!=='Teacher')return showToast('Only faculty can provide feedback.');
        const task=data.studyTasks.find(item=>item.id===feedbackForm.dataset.taskFeedback);
        const submission=task?.submissions?.find(item=>item.studentId===feedbackForm.dataset.studentFeedback);
        if(!submission?.id)return showToast('Submission not found. Refresh and try again.');
        const feedback=feedbackForm.elements.feedback.value.trim();
        const {error}=await supabaseClient.from('study_task_submissions').update({feedback,reviewed_at:new Date().toISOString()}).eq('id',submission.id);
        if(error)return showToast(`Feedback could not be saved: ${error.message}`);
        await syncAcademicData(false); renderStudyTasks(); showToast('Feedback saved in Supabase.');
      })(); return;
    }
  });
  document.addEventListener('click', event=>{
    const del=event.target.closest('[data-delete-study-task]');
    if(!del)return;
    if(currentUser().role!=='Teacher')return showToast('Only faculty can delete study tasks.');
    const task=data.studyTasks.find(item=>item.id===del.dataset.deleteStudyTask);
    if(!task||task.authorId!==currentUser().id)return;
    (async()=>{
      const {error}=await supabaseClient.from('study_tasks').delete().eq('id',task.id).eq('faculty_id',currentUser().id);
      if(error)return showToast(`Study task could not be deleted: ${error.message}`);
      if(task.filePath)await supabaseClient.storage.from('auw-academic-files').remove([task.filePath]);
      await syncAcademicData(false); renderStudyTasks(); showToast('Study task deleted from Supabase.');
    })();
  });


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
    if (event.target && (event.target.id === 'facultyUgFilter' || event.target.id === 'studentDirectoryUgFilter')) {
      facultyUgFilter = event.target.value || 'all';
      const facultyFilter = $('#facultyUgFilter');
      const directoryFilter = $('#studentDirectoryUgFilter');
      if (facultyFilter) facultyFilter.value = facultyUgFilter;
      if (directoryFilter) directoryFilter.value = facultyUgFilter;
      renderFaculty();
      if (event.target.id === 'studentDirectoryUgFilter') {
        const host = $('#studentDirectoryContent');
        const visibleStudents = directoryProfiles.filter(person => person.role === 'Student' && (facultyUgFilter === 'all' || String(person.group || '').trim() === facultyUgFilter));
        if (host) host.innerHTML = visibleStudents.map(person => `<div class="list-row"><div><strong>${escapeHTML(person.name)}</strong><p class="muted">${escapeHTML(person.group || 'UG Point not set')} · Mathematics, English and CTP</p><small>${escapeHTML(person.email)}</small></div></div>`).join('') || '<p class="muted">No students found for this UG Point.</p>';
      }
      return;
    }
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
      (async()=>{const {error}=await supabaseClient.from('grade_records').update({published:true,published_at:new Date().toISOString()}).eq('id',grade.id).eq('entered_by',user.id);if(error)return showToast(`Could not release result: ${error.message}`);await syncAcademicData(false);renderAll();showToast('Result released to the student on all devices.');})();
      return;
    }
    const publishGrade = event.target.closest('[data-publish-grade]');
    if (publishGrade) {
      if (currentUser().role !== 'Admin') return showToast('Admin access required.');
      const grade = data.grades.find(item => item.id === publishGrade.dataset.publishGrade);
      if (!grade) return;
      (async()=>{const {error}=await supabaseClient.from('grade_records').update({published:true,published_at:new Date().toISOString()}).eq('id',grade.id);if(error)return showToast(`Admin could not publish this grade: ${error.message}`);await syncAcademicData(false);renderAll();showToast('Grade officially published for students on all devices.');})();
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
    const lockedChatButton = event.target.closest('[data-locked-chat-id]');
    if (lockedChatButton && currentUser().role === 'Student') {
      const lockedChat = data.conversations.find(item => item.id === lockedChatButton.dataset.lockedChatId);
      if (lockedChat?.ugPoint) showToast(`Access restricted: only ${lockedChat.ugPoint} students can enter this group.`);
    }
    const chatButton = event.target.closest('[data-chat-id]');
    if (chatButton && currentUser().role === 'Student') {
      const chosenChat = data.conversations.find(item => item.id === chatButton.dataset.chatId && isStudentOnlyConversation(item) && canAccessStudentConversation(item, currentUser()));
      if (chosenChat) { currentChatId = chosenChat.id; loadSelectedMessengerMessages().then(renderConversations).catch(error=>showToast(`Could not open conversation: ${error.message}`)); }
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
    if (deleteMaterial) { const item = data.courseMaterials.find(row => row.id === deleteMaterial.dataset.deleteMaterial); if (!item || currentUser().role !== 'Teacher' || item.authorId !== currentUser().id) return showToast('You can only delete materials you shared.'); (async()=>{const {error}=await supabaseClient.from('course_materials').delete().eq('id',item.id).eq('faculty_id',currentUser().id);if(error)return showToast(`Could not delete material: ${error.message}`);if(item.filePath)await supabaseClient.storage.from('auw-academic-files').remove([item.filePath]);await syncAcademicData(false);showToast('Learning material removed from AUW Connect.');})(); }
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
  const updateSignupAssignmentFields = () => { const isFaculty = $('#signupRole').value === 'Teacher'; $('#signupUgPointField').classList.toggle('hidden', isFaculty); $('#signupUgPoint').required = !isFaculty; $('#signupFacultySubjectField').classList.toggle('hidden', !isFaculty); $('#signupFacultySubject').required = isFaculty; };
  $('#signupRole').addEventListener('change', updateSignupAssignmentFields);
  updateSignupAssignmentFields();
  $$('[data-auth-mode]').forEach(btn=>btn.addEventListener('click',()=>setAuthMode(btn.dataset.authMode)));
  $('#closeAuthBtn').addEventListener('click', () => { if (!document.body.classList.contains('logged-out')) $('#authModal').classList.add('hidden'); });
  $('#authModal').addEventListener('click', event => { if (event.target === $('#authModal')) $('#authModal').classList.add('hidden'); });
  $('#reopenAuthBtn').addEventListener('click', () => { setAuthMode('login'); $('#authModal').classList.remove('hidden'); });
  const signOut = async () => {
    try { await supabaseClient.auth.signOut(); }
    catch (error) { showToast(error.message || 'Could not sign out.'); return; }
    data.currentUserId = '';
    document.body.classList.add('logged-out');
    $('#authModal').classList.remove('hidden');
    setAuthMode('login');
    $('#loginForm').reset();
  };
  $('#signOutBtn').addEventListener('click', signOut);
  $('#headerSignOutBtn').addEventListener('click', signOut);

  $('#loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const loginIdentifier = $('#loginEmail').value.trim().toLowerCase();
    const password = $('#loginPassword').value;
    const requestedRole = portalRole($('#loginRole').value);
    const isUsernameLogin = !loginIdentifier.includes('@');
    if (isUsernameLogin && !/^[a-z0-9._-]{3,24}$/.test(loginIdentifier)) {
      showToast('Enter a valid username or your AUW email address.');
      return;
    }
    if (!isUsernameLogin && !isAuwAcademicEmail(loginIdentifier)) {
      showToast('Please sign in with your AUW email ending in @auw.edu.bd.');
      return;
    }
    const submitButton = $('#loginForm').querySelector('button[type="submit"]');
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Signing in…'; }
    try {
      let authUser;
      if (isUsernameLogin) {
        // The Edge Function resolves the username privately and returns an Auth session.
        const { data: loginData, error: loginError } = await supabaseClient.functions.invoke('username-login', {
          body: { username: loginIdentifier, password }
        });
        if (loginError) throw loginError;
        if (!loginData?.session?.access_token || !loginData?.session?.refresh_token) {
          throw new Error(loginData?.error || 'Invalid username or password.');
        }
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.setSession({
          access_token: loginData.session.access_token,
          refresh_token: loginData.session.refresh_token
        });
        if (sessionError) throw sessionError;
        authUser = sessionData.user || loginData.user;
      } else {
        const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
          email: loginIdentifier,
          password
        });
        if (error) throw error;
        authUser = authData.user;
      }
      const user = await loadSignedInProfile(authUser);
      if (!isAuwAcademicEmail(user.email)) {
        await supabaseClient.auth.signOut();
        throw new Error('Please sign in with your AUW email ending in @auw.edu.bd.');
      }
      if (portalRole(user.role) !== requestedRole) {
        await supabaseClient.auth.signOut();
        throw new Error(`This email belongs to a ${user.role === 'Teacher' ? 'Faculty' : 'Student'} account. Please select the correct account type.`);
      }
      $('#loginForm').reset();
      renderAll();
      goTo(user.role === 'Teacher' ? 'faculty' : 'overview');
      showToast(`Welcome back, ${user.name}.`);
    } catch (error) {
      console.error('Supabase sign-in failed:', error);
      showToast(error.message || 'Sign-in failed. Please check your AUW email and password.');
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Log in'; }
    }
  });

  $('#signupForm').addEventListener('submit', async event => {
    event.preventDefault();
    const name = $('#signupName').value.trim();
    const email = $('#signupEmail').value.trim().toLowerCase();
    const username = $('#signupUsername').value.trim().toLowerCase();
    const password = $('#signupPassword').value;
    const role = $('#signupRole').value === 'Teacher' ? 'faculty' : 'student';
    const ugPoint = role === 'student' ? $('#signupUgPoint').value : '';
    const subject = role === 'faculty' ? $('#signupFacultySubject').value : '';
    if (role === 'student' && !ugPoint) { showToast('Please choose your UG Point.'); return; }
    if (role === 'faculty' && !['Mathematics','English','CTP'].includes(subject)) { showToast('Please choose exactly one subject.'); return; }
    if (!isAuwAcademicEmail(email)) { showToast('Please use your AUW academic email ending in @auw.edu.bd.'); return; }
    if (!/^[a-z0-9._-]{3,24}$/.test(username)) { showToast('Username must be 3–24 characters and use only letters, numbers, dots, underscores or hyphens.'); return; }
    if (password.length < 6) { showToast('Please use at least 6 characters for the password.'); return; }
    const submitButton = $('#signupForm').querySelector('button[type="submit"]');
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Creating account…'; }
    try {
      // Username is stored in the profile metadata. We do not query the profile
      // directory before authentication because that would expose private emails.
      const { data: signupData, error } = await supabaseClient.auth.signUp({
        email, password, options: { data: { full_name: name, username, role, ug_point: ugPoint || null, subject: subject || null } }
      });
      if (error) throw error;
      $('#signupForm').reset();
      $('#signupRole').value = 'Student';
      updateSignupAssignmentFields();
      setAuthMode('login');
      $('#loginRole').value = role === 'faculty' ? 'Teacher' : 'Student';
      $('#loginEmail').value = email;
      if (signupData.session?.user) {
        const user = await loadSignedInProfile(signupData.session.user);
        renderAll();
        goTo(user.role === 'Teacher' ? 'faculty' : 'overview');
        showToast(`Welcome to AUW Connect, ${user.name}.`);
      } else {
        showToast('Account created. Check your AUW email for the confirmation link, then sign in.');
      }
    } catch (error) {
      console.error('Supabase sign-up failed:', error);
      showToast(error.message || 'Could not create your account. Please try again.');
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Create my account →'; }
    }
  });
  $('#profileForm').addEventListener('submit', async event => {
    event.preventDefault();
    const user = currentUser();
    const newEmail = $('#profileEmail').value.trim().toLowerCase();
    const newUsername = $('#profileUsername').value.trim().toLowerCase();
    if (!isAuwAcademicEmail(newEmail)) return showToast('Please use your AUW academic email ending in @auw.edu.bd.');
    if (!/^[a-z0-9._-]{3,24}$/.test(newUsername)) return showToast('Username must be 3–24 characters and use only letters, numbers, dots, underscores or hyphens.');
    if (user.role === 'Teacher' && !user.subject && !['Mathematics','English','CTP'].includes($('#profileFacultySubject').value)) return showToast('Please choose your one fixed subject.');
    const selectedTeachingGroups = user.role === 'Teacher' ? Array.from($('#profileFacultyGroups').selectedOptions).map(option => option.value) : [];
    if (user.role === 'Teacher' && selectedTeachingGroups.length === 0) return showToast('Please select at least one UG Point you teach.');
    const patch = { full_name: $('#profileName').value.trim(), username: newUsername };
    if (user.role === 'Teacher') {
      if (!user.subject) patch.subject = $('#profileFacultySubject').value;
      patch.teaching_ug_points = selectedTeachingGroups;
    }
    const { data: savedProfile, error } = await supabaseClient.from('profiles').update(patch).eq('id', user.id).select('id, full_name, email, username, role, ug_point, trimester, avatar_url, subject, teaching_ug_points').single();
    if (error) { console.error('Profile save failed:', error); return showToast(error.message || 'Could not save your profile.'); }
    user.name = savedProfile.full_name || patch.full_name;
    user.username = savedProfile.username || newUsername;
    user.subject = savedProfile.subject || user.subject || '';
    user.teachingUgPoints = savedProfile.teaching_ug_points || selectedTeachingGroups;
    saveData(); renderAll(); showToast('Profile and teaching UG Points saved.');
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
    $('#chatFileName').textContent = file ? `Selected: ${file.name} · ${(file.size / 1024).toFixed(0)} KB` : 'You can attach an image or document (maximum 10 MB).';
    if (file && file.size > 10 * 1024 * 1024) {
      showToast('Please choose a file smaller than 10 MB.');
      $('#chatFile').value = '';
      $('#chatFileName').textContent = 'You can attach an image or document (maximum 10 MB).';
    }
  });
  $('#chatForm').addEventListener('submit', event => {
    event.preventDefault();
    (async () => {
      const me = currentUser();
      const chat = data.conversations.find(item => item.id === currentChatId && me.role === 'Student' && isStudentOnlyConversation(item) && canAccessStudentConversation(item, me));
      const messageText = $('#chatInput').value.trim();
      const file = $('#chatFile').files[0];
      if (!chat) return;
      if (!messageText && !file) return showToast('Write a message or attach a file first.');
      if (file && file.size > 10 * 1024 * 1024) return showToast('File must be smaller than 10 MB.');
      const sendButton = $('#chatForm').querySelector('button');
      sendButton.disabled = true;
      let uploadedPath = '';
      try {
        let attachmentFields = {};
        if (file) {
          const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt|xls|xlsx|ppt|pptx|zip)$/i.test(file.name);
          if (!allowed) throw new Error('This file type is not supported.');
          uploadedPath = `${chat.id}/${me.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const { error: uploadError } = await supabaseClient.storage.from('student-messenger-files').upload(uploadedPath, file, { contentType: file.type || 'application/octet-stream', upsert: false });
          if (uploadError) throw uploadError;
          attachmentFields = { attachment_path: uploadedPath, attachment_name: file.name, attachment_type: file.type || '', attachment_size: file.size };
        }
        const { error: messageError } = await supabaseClient.from('student_messages').insert({
          conversation_id: chat.id, sender_id: me.id, body: messageText, ...attachmentFields
        });
        if (messageError) throw messageError;
        $('#chatInput').value = '';
        $('#chatFile').value = '';
        $('#chatFileName').textContent = 'You can attach an image or document (maximum 10 MB).';
        await loadSelectedMessengerMessages();
        renderConversations();
      } catch (error) {
        if (uploadedPath) await supabaseClient.storage.from('student-messenger-files').remove([uploadedPath]);
        console.error('Messenger send failed:', error);
        showToast(`Message could not be sent: ${error.message || 'Please try again.'}`);
      } finally { sendButton.disabled = false; }
    })();
  });
  $('#newChatBtn').addEventListener('click', openContactPicker);
  $('#createGroupChatTopBtn').addEventListener('click', createGroupChat);
  $('#closeContactPicker').addEventListener('click', () => $('#contactPicker').classList.add('hidden'));
  $('#contactSearch').addEventListener('input', event => renderContactPicker(event.target.value));
  $('#createGroupChatBtn').addEventListener('click', createGroupChat);
  $('#chatGroupActions').addEventListener('click', event => {
    (async () => {
      const user = currentUser();
      const chat = data.conversations.find(item => item.id === currentChatId && item.type === 'group' && isStudentOnlyConversation(item) && item.memberIds.includes(user.id));
      if (event.target.closest('[data-toggle-members]')) {
        const panel=$('#chatMemberList'); if(panel) panel.classList.toggle('hidden'); return;
      }
      if (!chat || user.role !== 'Student' || chat.isGeneral || chat.ugPoint) return;
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
          const added = [...new Set(answer.split(',').map(v=>candidates[Number(v.trim())-1]).filter(Boolean).map(person=>person.id))];
          if (!added.length) return showToast('No valid students were selected.');
          const {error}=await supabaseClient.from('student_conversation_members').insert(added.map(user_id=>({conversation_id:chat.id,user_id})));
          if(error) return showToast(`Could not invite students: ${error.message}`);
          messengerLoadedForUser=''; await loadStudentMessenger(); showToast('Group membership updated.');
        } else if (action.trim().toLowerCase() === 'remove') {
          const candidates = chat.memberIds.filter(id=>id!==user.id).map(id=>getUser(id)).filter(Boolean);
          if (!candidates.length) return showToast('There are no other members to remove.');
          const list = candidates.map((person,index)=>`${index+1}. ${person.name}`).join('\n');
          const answer = prompt(`Choose a member number to remove:\n${list}`);
          if (answer === null) return;
          const person = candidates[Number(answer.trim())-1];
          if (!person) return showToast('Choose a valid member number.');
          const {error}=await supabaseClient.from('student_conversation_members').delete().eq('conversation_id',chat.id).eq('user_id',person.id);
          if(error) return showToast(`Could not remove member: ${error.message}`);
          messengerLoadedForUser=''; await loadStudentMessenger(); showToast('Group member removed.');
        } else return showToast('Please type ADD or REMOVE.');
      }
      if (event.target.closest('[data-leave-group]')) {
        if (!confirm(`Leave “${chat.title}”?`)) return;
        const {error}=await supabaseClient.from('student_conversation_members').delete().eq('conversation_id',chat.id).eq('user_id',user.id);
        if(error) return showToast(`Could not leave group: ${error.message}`);
        currentChatId=''; messengerLoadedForUser=''; await loadStudentMessenger(); showToast('You left the group.');
      }
    })().catch(error=>{console.error(error);showToast(error.message || 'The group action failed.');});
  });
  $('#contactResults').addEventListener('click', event => {
    const contactButton = event.target.closest('[data-start-private-chat]');
    if (!contactButton) return;
    createPrivateChat(contactButton.dataset.startPrivateChat);
  });
  $('#gradeForm').addEventListener('submit', event => {
    event.preventDefault();
    (async () => {
      const user = currentUser();
      if (user.role !== 'Teacher') return showToast('Only faculty can enter progress marks.');
      const obtained = Number($('#obtainedMarks').value), total = Number($('#totalMarks').value);
      if (total <= 0 || obtained < 0 || obtained > total) return showToast('Obtained marks must be between zero and the total marks.');
      const studentId = $('#gradeStudent').value, courseId = $('#gradeCourse').value;
      const category = $('#gradeComponentCategory').value;
      const trimester = $('#gradeTrimester').value.trim() || data.registrationSettings.trimester;
      if (!studentId || !courseId || !category) return showToast('Select a student, course and component.');
      const percentage = obtained / total * 100;
      try {
        const gradeRecordId = await saveComponentMarkToSupabase(studentId, courseId, category, percentage, trimester, user.id);
        const feedback = $('#gradeFeedback').value.trim();
        if (feedback) {
          const { error } = await supabaseClient.from('grade_records').update({ feedback }).eq('id', gradeRecordId).eq('entered_by', user.id);
          if (error) throw error;
        }
        await syncAcademicData(false);
        $('#gradeForm').reset();
        showToast(`${category} progress saved to Supabase and made visible to the student.`);
      } catch (error) {
        console.error('Progress mark save failed:', error);
        showToast(`Progress mark could not be saved: ${error.message || 'Please try again.'}`);
      }
    })();
  });
  if ($('#componentMarkForm')) $('#componentMarkForm').onsubmit = event => {
    event.preventDefault();
    (async () => {
      const user = currentUser();
      if (user.role !== 'Teacher') return showToast('Only faculty can enter component marks.');
      const studentId = $('#componentStudent').value, courseId = $('#componentCourse').value;
      const category = $('#componentCategory').value, rawScore = $('#componentScore').value.trim();
      const percentage = rawScore === '' ? null : Number(rawScore);
      const trimester = $('#componentTrimester').value.trim();
      if (!studentId || !courseId || !trimester) return showToast('Select a student, course and trimester.');
      if (rawScore !== '' && (!Number.isFinite(percentage) || percentage < 0 || percentage > 100)) return showToast('Enter a valid mark from 0 to 100, or leave it blank to clear the mark.');
      try {
        await saveComponentMarkToSupabase(studentId, courseId, category, percentage, trimester, user.id);
        await syncAcademicData(false);
        renderAll();
        showToast(percentage == null ? `${category} mark cleared in Supabase.` : `${category} mark saved to Supabase as a draft.`);
      } catch (error) {
        console.error('Component mark save failed:', error);
        showToast(`Component mark could not be saved: ${error.message || 'Please try again.'}`);
      }
    })();
  };
  if ($('#componentStudent')) $('#componentStudent').onchange = renderComponentMarksPanel;
  if ($('#componentCourse')) $('#componentCourse').onchange = renderComponentMarksPanel;
  if ($('#componentTrimester')) $('#componentTrimester').onchange = renderComponentMarksPanel;
  $('#finalizeResultsForm')?.addEventListener('submit', event => { event.preventDefault(); publishWholeCourseResults(true); });
  $('#publishFinalResultsNow')?.addEventListener('click', () => publishWholeCourseResults(false));
  $('#finalizeCourse')?.addEventListener('change', renderFinalizationPanel);
  $('#finalizeTrimester')?.addEventListener('change', renderFinalizationPanel);
  $('#facultyMaterialForm').addEventListener('submit', event => {
    event.preventDefault();
    (async () => {
      const user = currentUser();
      if (user.role !== 'Teacher') return showToast('Only faculty can share course materials.');
      const title = $('#materialTitle').value.trim();
      const courseId = $('#materialCourse').value;
      const group = $('#materialGroup').value;
      const description = $('#materialDescription').value.trim();
      const file = $('#materialFile').files[0];
      if (!title || !courseId || !group) return showToast('Please complete the course, group and material title.');
      const existing = editingMaterialId ? data.courseMaterials.find(item => item.id === editingMaterialId && item.authorId === user.id) : null;
      if (!existing && !file) return showToast('Please attach a file before sharing the material.');
      if (file && file.size > 20 * 1024 * 1024) return showToast('Please keep the material file under 20 MB.');
      let uploadedPath = '';
      try {
        if (file) uploadedPath = await uploadAcademicFile(file, 'materials');
        const payload = {
          faculty_id: user.id, course_id: supabaseCourseId(courseId), title, description,
          target_ug_point: group === 'All UG Points' ? null : group,
          file_path: uploadedPath || existing?.filePath || ''
        };
        if (!payload.file_path) throw new Error('Please attach a material file.');
        let result;
        if (existing) result = await supabaseClient.from('course_materials').update(payload).eq('id', existing.id).eq('faculty_id', user.id);
        else result = await supabaseClient.from('course_materials').insert(payload);
        if (result.error) throw result.error;
        editingMaterialId = '';
        $('#facultyMaterialForm').reset();
        $('#materialSubmitButton').textContent = 'Share with students';
        $('#cancelMaterialEdit').classList.add('hidden');
        await syncAcademicData(false);
        showToast(existing ? 'Learning material updated for students.' : 'Learning material shared with students on all devices.');
      } catch (error) {
        if (uploadedPath) await supabaseClient.storage.from('auw-academic-files').remove([uploadedPath]);
        console.error('Learning material publish failed:', error);
        showToast(`Material could not be shared: ${error.message || 'Please try again.'}`);
      }
    })();
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
    (async () => {
      const user = currentUser();
      if (user.role !== 'Teacher') return showToast('Only faculty can create assessments.');
      const editId = $('#assessmentEditId')?.value || '';
      const existing = editId ? data.assessments.find(a => a.id === editId && a.createdBy === user.id) : null;
      if (editId && !existing) return showToast('This assessment could not be found. Refresh the page and try again.');
      const total = Number($('#assessmentTotal').value);
      const deadline = $('#assessmentDeadline').value;
      const file = $('#assessmentAttachment').files[0];
      const title = $('#assessmentTitle').value.trim();
      const courseId = $('#assessmentCourse').value;
      const group = $('#assessmentGroup').value;
      const instructions = $('#assessmentInstructions').value.trim();
      if (!title || !courseId || !group || !Number.isFinite(total) || total <= 0 || !deadline || !instructions) return showToast('Complete all required assessment details.');
      if (new Date(deadline).getTime() <= Date.now()) return showToast('Choose a future deadline.');
      if (file && file.size > 20 * 1024 * 1024) return showToast('Please keep the assessment attachment under 20 MB.');
      if (existing && (existing.submissions || []).length && (existing.courseId !== courseId || existing.group !== group || Number(existing.total) !== total)) return showToast('Course, group and total marks cannot be changed after students have submitted.');
      let uploadedPath = '';
      try {
        if (file) uploadedPath = await uploadAcademicFile(file, 'assessments');
        const payload = {
          faculty_id: user.id, course_id: supabaseCourseId(courseId), title, instructions,
          assessment_type: $('#assessmentType').value,
          grading_category: $('#assessmentCategory').value,
          total_marks: total, target_ug_point: group === 'All UG Points' ? null : group,
          deadline: new Date(deadline).toISOString(), status: 'published',
          attachment_path: uploadedPath || existing?.attachmentPath || null
        };
        const result = existing
          ? await supabaseClient.from('assessments').update(payload).eq('id', existing.id).eq('faculty_id', user.id)
          : await supabaseClient.from('assessments').insert(payload);
        if (result.error) throw result.error;
        $('#assessmentCreateForm').reset();
        if ($('#assessmentEditId')) $('#assessmentEditId').value = '';
        $('#assessmentCreateForm').querySelector('button[type="submit"],button:not([type])').textContent = 'Publish assessment';
        $('#cancelAssessmentEdit')?.classList.add('hidden');
        $('#assessmentCourse').disabled = false; $('#assessmentGroup').disabled = false; $('#assessmentTotal').disabled = false;
        await syncAcademicData(false);
        showToast(existing ? 'Assessment updated and synchronized for students.' : 'Assessment published and synchronized for students.');
      } catch (error) {
        if (uploadedPath) await supabaseClient.storage.from('auw-academic-files').remove([uploadedPath]);
        console.error('Assessment publish failed:', error);
        showToast(`Assessment could not be published: ${error.message || 'Please try again.'}`);
      }
    })();
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
      (async () => { const { error } = await supabaseClient.from('assessments').update({ status: 'archived' }).eq('id', a.id).eq('faculty_id', currentUser().id); if (error) return showToast(`Could not archive assessment: ${error.message}`); await syncAcademicData(false); showToast('Assessment archived. Existing submissions have been retained.'); })();
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
    event.preventDefault();
    (async () => {
      const user = currentUser();
      if (user.role !== 'Student') return showToast('Only students can submit assessment work.');
      const a = data.assessments.find(item => item.id === $('#submissionAssessmentId').value && studentMatchesAssessmentGroup(user, item));
      if (!a) return showToast('Assessment not found for your UG Point.');
      if (new Date(a.deadline).getTime() < Date.now()) return showToast('The submission deadline has passed.');
      const answer = $('#assessmentAnswer').value.trim();
      const file = $('#assessmentFile').files[0];
      if (!answer && !file) return showToast('Write an answer or attach your work.');
      if (file && file.size > 20 * 1024 * 1024) return showToast('Please keep the file under 20 MB.');
      if ((a.submissions || []).some(item => item.studentId === user.id)) return showToast('You have already submitted this assessment. Contact faculty if you need a correction.');
      let uploadedPath = '';
      try {
        if (file) uploadedPath = await uploadAcademicFile(file, `submissions/${a.id}`);
        const { error } = await supabaseClient.from('assessment_submissions').insert({
          assessment_id: a.id, student_id: user.id, answer_text: answer || null, file_path: uploadedPath || null
        });
        if (error) throw error;
        $('#assessmentSubmissionForm').reset();
        $('#assessmentSubmissionPanel').classList.add('hidden');
        await syncAcademicData(false);
        showToast('Your submission was saved to AUW Connect and is available to faculty.');
      } catch (error) {
        if (uploadedPath) await supabaseClient.storage.from('auw-academic-files').remove([uploadedPath]);
        console.error('Assessment submission failed:', error);
        showToast(`Submission could not be saved: ${error.message || 'Please try again.'}`);
      }
    })();
  });
  $('#assessmentSubmissions').addEventListener('click', event => {
    const button = event.target.closest('[data-grade-submission]');
    if (!button) return;
    (async () => {
      const [assessmentId, studentId] = button.dataset.gradeSubmission.split('|');
      const assessment = data.assessments.find(item => item.id === assessmentId);
      const submission = assessment?.submissions?.find(item => item.studentId === studentId);
      if (!assessment || !submission || !submission.id) return showToast('Submission could not be found. Refresh and try again.');
      if (currentUser().role !== 'Teacher' || assessment.createdBy !== currentUser().id) return showToast('Only the assigned faculty member can review this submission.');
      const raw = prompt(`Enter marks out of ${assessment.total}:`, submission.marks ?? '');
      if (raw === null) return;
      const marks = Number(raw);
      if (!Number.isFinite(marks) || marks < 0 || marks > Number(assessment.total)) return showToast('Marks must be between 0 and the total marks.');
      const feedback = prompt('Enter feedback for the student:', submission.feedback || '');
      if (feedback === null) return;
      try {
        const { error } = await supabaseClient.from('assessment_submissions').update({
          marks_obtained: marks, feedback, reviewed_at: new Date().toISOString()
        }).eq('id', submission.id);
        if (error) throw error;
        const category = componentKey(assessment.category || 'Quiz');
        if (category !== 'Final Exam' && COMPONENT_WEIGHTS[category]) {
          const percentage = Number(assessment.total) > 0 ? marks / Number(assessment.total) * 100 : 0;
          await saveComponentMarkToSupabase(studentId, assessment.courseId, category, percentage,
            assessment.trimester || data.registrationSettings.trimester, currentUser().id);
        }
        await syncAcademicData(false);
        renderAssessments(); renderComponentMarksPanel();
        showToast('Assessment review and marks saved to Supabase.');
      } catch (error) {
        console.error('Assessment review failed:', error);
        showToast(`Review could not be saved: ${error.message || 'Please try again.'}`);
      }
    })();
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
    if (markRead) { const item = data.notifications.find(n => n.id === markRead.dataset.readNotification && n.userId === currentUser().id); if (item) { (async()=>{ if (isDatabaseUUID(item.id)) { const readAt = new Date().toISOString(); const {error} = await supabaseClient.from('notifications').update({read_at:readAt}).eq('id',item.id).eq('user_id',currentUser().id); if(error)return showToast(`Could not mark notification as read: ${error.message}`); item.readAt=readAt; } item.read = true; saveData(); renderNotifications(); })(); } return; }
    const markAll = event.target.closest('#markAllNotificationsRead');
    if (markAll) { (async()=>{ const me=currentUser(); const {error}=await supabaseClient.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',me.id).is('read_at',null); if(error)return showToast(`Could not update shared notifications: ${error.message}`); data.notifications.filter(n=>n.userId===me.id).forEach(n=>{n.read=true;}); saveData(); await syncOfficeHourNotifications(false); renderNotifications(); })(); return; }
    const addSlot=event.target.closest('#addOfficeSlot'); if(addSlot){const wrap=$('#officeSlotInputs');if(wrap){const count=wrap.querySelectorAll('.office-slot-row').length+1;const row=document.createElement('div');row.className='form-row office-slot-row';row.innerHTML=`<label>Time slot ${count}<input type="time" class="office-slot-time" required></label><button class="button button-outline" type="button" data-remove-office-slot>Remove</button>`;wrap.appendChild(row);} }
    const removeSlot=event.target.closest('[data-remove-office-slot]'); if(removeSlot){const row=removeSlot.closest('.office-slot-row');if(row&&$('#officeSlotInputs').querySelectorAll('.office-slot-row').length>1){row.remove();$('#officeSlotInputs').querySelectorAll('.office-slot-row label').forEach((label,index)=>{label.childNodes[0].textContent=`Time slot ${index+1}`;});}}
    const appointmentTab=event.target.closest('[data-appointment-tab]'); if(appointmentTab){const host=$('#studentAppointmentsContent');if(host){host.dataset.activeTab=appointmentTab.dataset.appointmentTab;renderAppointments();}return;}
    const book=event.target.closest('[data-book-faculty]'); if(book){ goTo('office-booking'); setTimeout(()=>{const sel=$('#bookingFaculty'); if(sel){sel.value=book.dataset.bookFaculty;renderAppointments();}},0); }
    const cancel=event.target.closest('[data-cancel-appointment]'); if(cancel){(async()=>{const a=data.appointments.find(x=>x.id===cancel.dataset.cancelAppointment);if(!a||a.studentId!==currentUser().id||!['Pending','Approved'].includes(a.status))return;const reason=window.prompt('Cancellation reason (optional):','')||'';if(!window.confirm('Cancel this appointment?'))return;const {error}=await supabaseClient.rpc('cancel_office_hour_appointment',{p_appointment_id:a.id});if(error)return showToast(`Could not cancel: ${error.message}`);if(reason.trim()){const {error:reasonError}=await supabaseClient.from('appointments').update({cancellation_reason:reason.trim()}).eq('id',a.id).eq('student_id',currentUser().id);if(reasonError)showToast(`Canceled, but the optional reason could not be saved: ${reasonError.message}`);}await syncOfficeHourData(false);renderAppointments();showToast('Appointment canceled.');})();return;}
    const action=event.target.closest('[data-appointment-action]'); if(action&&currentUser().role==='Teacher'){(async()=>{const a=data.appointments.find(x=>x.id===action.dataset.appointmentId&&x.facultyId===currentUser().id);if(!a)return;const label=action.dataset.appointmentAction;let result;if(['Approved','Declined'].includes(label)){result=await supabaseClient.rpc('respond_to_office_hour_appointment',{p_appointment_id:a.id,p_status:label.toLowerCase(),p_faculty_note:''});}else if(label==='Cancelled'){const reason=window.prompt('Please enter the reason for canceling this appointment:','');if(!reason||!reason.trim())return showToast('A cancellation reason is required.');if(!window.confirm('Cancel this appointment and notify the student?'))return;result=await supabaseClient.from('appointments').update({status:'cancelled',cancellation_reason:reason.trim()}).eq('id',a.id).eq('faculty_id',currentUser().id);}else{const status=label==='No-show'?'no_show':'completed';result=await supabaseClient.from('appointments').update({status}).eq('id',a.id).eq('faculty_id',currentUser().id);}if(result.error)return showToast(`Could not update appointment: ${result.error.message}`);if(label==='Cancelled'&&a.officeHourId)await supabaseClient.from('office_hours').update({is_available:true}).eq('id',a.officeHourId);await syncOfficeHourData(false);renderAppointments();showToast(label==='Cancelled'?'Appointment canceled and updated.':`Appointment marked ${label.toLowerCase()}.`);})();return;}
    const del=event.target.closest('[data-delete-office-slot]'); if(del&&currentUser().role==='Teacher'){(async()=>{const slot=data.officeHours.find(x=>x.id===del.dataset.deleteOfficeSlot&&x.facultyId===currentUser().id);if(!slot||slot.isAvailable===false)return;const {error}=await supabaseClient.from('office_hours').delete().eq('id',slot.id).eq('faculty_id',currentUser().id).eq('is_available',true);if(error)return showToast(`Could not remove slot: ${error.message}`);await syncOfficeHourData(false);renderAppointments();showToast('Availability slot removed.');})();}
  });
  document.addEventListener('submit', event => {
    if(event.target.id==='officeHourForm'){
      event.preventDefault();
      (async()=>{
        if(currentUser().role!=='Teacher')return;
        const day1=Number($('#officeDay1').value),day2=Number($('#officeDay2').value);
        const start1=$('#officeStart1').value,start2=$('#officeStart2').value;
        if(day1===day2)return showToast('Choose two different days.');
        if(!start1||!start2||timeToMinutes(start1)+120>=1440||timeToMinutes(start2)+120>=1440)return showToast('Choose start times that leave a full two-hour window before midnight.');
        const facultyId=currentUser().id;
        const now=new Date();
        const {data:existingRows,error:loadError}=await supabaseClient.from('office_hours')
          .select('id,starts_at,is_available').eq('faculty_id',facultyId).gte('starts_at',now.toISOString());
        if(loadError)return showToast(`Could not update the schedule: ${loadError.message}`);
        const bookedRows=(existingRows||[]).filter(row=>!row.is_available);
        const bookedStarts=new Set(bookedRows.map(row=>new Date(row.starts_at).getTime()));
        const deletable=(existingRows||[]).filter(row=>row.is_available).map(row=>row.id);
        if(deletable.length){
          const {error:deleteError}=await supabaseClient.from('office_hours').delete()
            .eq('faculty_id',facultyId).in('id',deletable).eq('is_available',true);
          if(deleteError)return showToast(`Could not replace unbooked slots: ${deleteError.message}. Please check the office_hours DELETE policy in Supabase.`);
        }
        const today=new Date();today.setHours(0,0,0,0);
        const newRows=[];
        for(let week=0;week<52;week++){
          for(const [day,start] of [[day1,start1],[day2,start2]]){
            const date=new Date(today);
            const offset=(day-date.getDay()+7)%7+(week*7);
            date.setDate(date.getDate()+offset);
            const dateText=localDateISO(date);
            if(dateText>OFFICE_HOUR_CUTOFF)continue;
            for(let slot=0;slot<8;slot++){
              const time=minutesToTime(timeToMinutes(start)+slot*15);
              const startsAt=officeSlotStart(dateText,time);
              const timestamp=new Date(startsAt).getTime();
              if(timestamp<=Date.now()||bookedStarts.has(timestamp))continue;
              newRows.push({faculty_id:facultyId,starts_at:startsAt,ends_at:new Date(timestamp+15*60000).toISOString(),is_available:true});
            }
          }
        }
        let added=0;
        for(let i=0;i<newRows.length;i+=200){
          const {error:insertError}=await supabaseClient.from('office_hours').insert(newRows.slice(i,i+200));
          if(insertError){console.error('Could not add recurring office-hour slots:',insertError);return showToast(`Schedule could not be fully saved: ${insertError.message}`);}
          added+=newRows.slice(i,i+200).length;
        }
        const bookedStudentIds=[...new Set(data.appointments.filter(a=>a.facultyId===facultyId&&['Pending','Approved'].includes(a.status)&&a.date>=localDateISO()).map(a=>a.studentId))];
        let notificationFailures=0;
        for(const studentId of bookedStudentIds){
          const {error:notifyError}=await supabaseClient.from('notifications').insert({user_id:studentId,title:'Faculty office-hour schedule updated',body:`${currentUser().name} updated their weekly office-hour availability. Your existing confirmed appointment remains unchanged.`});
          if(notifyError){notificationFailures++;console.warn('Schedule notification could not be sent:',notifyError.message);}
        }
        await syncOfficeHourData(false);renderAppointments();
        showToast(`Weekly schedule saved. ${added} future slots published; existing booked appointments were preserved.${notificationFailures?` ${notificationFailures} student notification(s) could not be sent.`:''}`);
      })();
    }
    if(event.target.id==='studentAppointmentForm'){event.preventDefault();(async()=>{if(currentUser().role!=='Student')return;const facultyId=$('#bookingFaculty').value,date=$('#bookingDate').value,time=$('#bookingTime').value,reason=$('#bookingReason').value.trim();if(date>OFFICE_HOUR_CUTOFF)return showToast('Appointments are available only through December 6, 2026.');if(reason.length<8)return showToast('Please enter at least 8 characters for the reason.');const slot=availableSlots(facultyId,date).find(s=>s.time===time);if(!slot)return showToast('That slot is no longer available. Refresh and choose another.');const {data:appointmentId,error:bookingError}=await supabaseClient.rpc('book_office_hour',{p_office_hour_id:slot.id,p_topic:'Office-hour appointment',p_student_note:reason});if(bookingError)return showToast(`Booking could not be saved: ${bookingError.message}`);if(!appointmentId)return showToast('The booking could not be confirmed. Please refresh and try again.');await syncOfficeHourData(false);renderAppointments();showToast('Your appointment request has been sent to the faculty member.');})();}
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

  if (data.currentUserId) updateMyPresence();
  window.addEventListener('beforeunload', () => {
    const signedInUser = data.users.find(user => user.id === data.currentUserId);
    if (!signedInUser) return;
    if (!data.presence) data.presence = {};
    data.presence[signedInUser.id] = 0;
    saveData();
  });
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try { data = JSON.parse(event.newValue); renderAll(); } catch (error) { /* Ignore incomplete storage updates. */ }
    }
  });
  checkAppointmentReminders();
  window.setInterval(() => { if (data.currentUserId) { updateMyPresence(); renderPresence(); checkAppointmentReminders(); syncOfficeHourNotifications(false); if (Date.now() - lastAcademicSyncAt > 30000) { lastAcademicSyncAt = Date.now(); syncAcademicData(false); } } }, 15000);
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
// Start the interface immediately so navigation and auth controls are clickable
// even while Supabase restores the session or loads shared office-hour data.
document.body.classList.add('logged-out');
$('#authModal')?.classList.remove('hidden');
startApp();

// Restore authentication in the background; do not hold up event registration.
initializeSupabaseAuth()
  .then(() => {
    if (data.currentUserId && !document.body.classList.contains('logged-out')) {
      try {
        renderAll();
        renderCurrentView('overview');
      } catch (error) {
        console.error('AUW Connect post-login rendering error:', error);
        showToast('Your account loaded, but some dashboard information could not be displayed. Please refresh.');
      }
    }
  })
  .catch(error => {
    console.error('AUW Connect authentication initialization failed:', error);
    data.currentUserId = '';
    document.body.classList.add('logged-out');
    $('#authModal')?.classList.remove('hidden');
    showToast('Could not connect to Supabase. Check your internet connection and refresh the page.');
  });


