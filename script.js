// AUW Connect - beginner-friendly front-end prototype.
// Data is saved in localStorage, so it stays in this browser only.
const STORAGE_KEY = 'auwConnectStudentProjectV2';
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
    currentUserId: null,
    users: [
      { id: 's1', name: 'Ilma Sathi', email: 'ilma@auw.edu.bd', password: 'student123', role: 'Student', group: 'Pathways' },
      { id: 's2', name: 'Ayesha Karim', email: 'ayesha@auw.edu.bd', password: 'student123', role: 'Student', group: 'Pathways' },
      { id: 's3', name: 'Nusrat Jahan', email: 'nusrat@auw.edu.bd', password: 'student123', role: 'Student', group: 'Foundation' },
      { id: 's4', name: 'Samira Noor', email: 'samira@auw.edu.bd', password: 'student123', role: 'Student', group: 'UG' },
      { id: 't1', name: 'Nadia Rahman', email: 'nadia@auw.edu.bd', password: 'faculty123', role: 'Teacher', group: 'Faculty' },
      { id: 't2', name: 'Farhana Ahmed', email: 'farhana@auw.edu.bd', password: 'faculty123', role: 'Teacher', group: 'Faculty' },
      { id: 'a1', name: 'Portal Administrator', email: 'admin@auw.edu.bd', password: 'AUWAdmin2026!', role: 'Admin', group: 'Faculty' }
    ],
    courses: [
      { id: 'c1', code: 'ENG101', name: 'Academic English', teacherId: 't1' },
      { id: 'c2', code: 'ICT101', name: 'Information Technology', teacherId: 't2' },
      { id: 'c3', code: 'MTH101', name: 'Mathematics', teacherId: 't1' },
      { id: 'c4', code: 'CRT101', name: 'Critical Thinking', teacherId: 't2' }
    ],
    schedules: [
      { id: 'sc1', courseId: 'c1', day: 'Sunday', start: '09:00', end: '10:30', room: 'Academic 204', teacherId: 't1', group: 'Pathways' },
      { id: 'sc2', courseId: 'c2', day: 'Monday', start: '11:00', end: '12:30', room: 'Computer Lab 2', teacherId: 't2', group: 'Pathways' },
      { id: 'sc3', courseId: 'c3', day: 'Tuesday', start: '13:00', end: '14:30', room: 'Academic 105', teacherId: 't1', group: 'Pathways' },
      { id: 'sc4', courseId: 'c4', day: 'Wednesday', start: '10:00', end: '11:30', room: 'Academic 302', teacherId: 't2', group: 'Foundation' }
    ],
    grades: [
      { id: 'g1', studentId: 's1', courseId: 'c1', obtained: 46, total: 50, feedback: 'Very clear writing. Keep practising your academic vocabulary.' },
      { id: 'g2', studentId: 's1', courseId: 'c2', obtained: 44, total: 50, feedback: 'Good work. Review spreadsheet formulas.' },
      { id: 'g3', studentId: 's2', courseId: 'c1', obtained: 42, total: 50, feedback: 'Good progress.' }
    ],
    bookings: [],
    facilities: [
      { id: 'f1', name: 'AUW Library', description: 'Study spaces, books, research materials and quiet reading areas.', icon: '▤' },
      { id: 'f2', name: 'Computer Lab', description: 'Computers and digital learning resources for academic work.', icon: '⌘' },
      { id: 'f3', name: 'Health Centre', description: 'Campus health support and basic wellbeing services.', icon: '♡' },
      { id: 'f4', name: 'Student Lounge', description: 'A shared space to relax, meet classmates and collaborate.', icon: '⌂' },
      { id: 'f5', name: 'Career Services', description: 'Career guidance, opportunities and professional development.', icon: '✦' }
    ],
    announcements: [
      { id: 'an1', title: 'Welcome to AUW Connect', text: 'This campus portal brings student services, schedules, grades and communication together.', category: 'General', date: new Date().toLocaleDateString() },
      { id: 'an2', title: 'Academic reminder', text: 'Please check your course schedule regularly and contact your instructor if you need academic support.', category: 'Academic', date: new Date().toLocaleDateString() }
    ],
    conversations: [
      { id: 'chat1', title: 'Pathways Study Group', type: 'group', memberIds: ['s1', 's2', 's3', 't1'], messages: [{ id: 'm1', senderId: 't1', text: 'Welcome everyone. Please use this group to discuss class questions.', time: 'Yesterday' }] },
      { id: 'chat2', title: 'Nadia Rahman', type: 'private', memberIds: ['s1', 't1'], messages: [{ id: 'm2', senderId: 't1', text: 'Hello! Let me know if you need support with Academic English.', time: 'Yesterday' }] }
    ],
    facultyPosts: [{ id: 'fp1', title: 'Supporting academic writing', text: 'Short weekly writing exercises can help students build confidence.', authorId: 't1' }],
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
data.schedules = Array.isArray(data.schedules) ? data.schedules : [];
data.announcements = Array.isArray(data.announcements) ? data.announcements : [];
data.helpMessages = Array.isArray(data.helpMessages) ? data.helpMessages : [];
data.conversations = Array.isArray(data.conversations) ? data.conversations : [];

// Make sure Messenger always has a room for each AUW student group.
function ensureStudentGroupChats() {
  const groups = ['Pathways', 'Foundation', 'UG'];
  groups.forEach(group => {
    let chat = data.conversations.find(item => item.type === 'group' && (item.groupKey === group || item.title === `${group} Group` || (group === 'Pathways' && item.title === 'Pathways Study Group')));
    const groupStudents = data.users.filter(user => user.role === 'Student' && user.group === group).map(user => user.id);
    const staff = data.users.filter(user => ['Teacher', 'Admin'].includes(user.role)).map(user => user.id);
    const starterMembers = [...new Set([...groupStudents, ...staff])];
    if (!chat) {
      chat = { id: `group-${group.toLowerCase()}`, title: `${group} Group`, groupKey: group, type: 'group', memberIds: starterMembers, messages: [{ id: `welcome-${group.toLowerCase()}`, senderId: 'a1', text: `Welcome to the ${group} group. You can use this room to share class updates and ask questions.`, time: 'Welcome' }] };
      data.conversations.push(chat);
    } else {
      chat.groupKey = group;
      chat.title = `${group} Group`;
      chat.memberIds = [...new Set([...(chat.memberIds || []), ...starterMembers])];
      chat.messages = Array.isArray(chat.messages) ? chat.messages : [];
    }
  });
}
ensureStudentGroupChats();
(data.users).forEach(user => { if (user.group === 'Undergraduate') user.group = 'UG'; });
(data.schedules).forEach(item => { if (item.group === 'Undergraduate') item.group = 'UG'; });
// The administrator account is created by the site owner, not public sign-up.
data.users.forEach(user => {
  if (user.password && !user.passwordHash) { user.passwordHash = passwordHash(user.password); delete user.password; }
  // Give the original sample accounts a sign-in password when upgrading older saved data.
  if (!user.passwordHash && user.id === 's1') { user.email = 'ilma@auw.edu.bd'; user.passwordHash = passwordHash('student123'); }
  if (!user.passwordHash && user.id === 's2') { user.email = 'ayesha@auw.edu.bd'; user.passwordHash = passwordHash('student123'); }
  if (!user.passwordHash && user.id === 's3') { user.email = 'nusrat@auw.edu.bd'; user.passwordHash = passwordHash('student123'); }
  if (!user.passwordHash && user.id === 's4') { user.email = 'samira@auw.edu.bd'; user.passwordHash = passwordHash('student123'); }
  if (!user.passwordHash && user.id === 't1') { user.email = 'nadia@auw.edu.bd'; user.passwordHash = passwordHash('faculty123'); }
  if (!user.passwordHash && user.id === 't2') { user.email = 'farhana@auw.edu.bd'; user.passwordHash = passwordHash('faculty123'); }
  if (user.id === 'a1') { user.email = 'admin@auw.edu.bd'; user.name = 'Portal Administrator'; user.role = 'Admin'; user.passwordHash = user.passwordHash || passwordHash('AUWAdmin2026!'); }
});
data.announcements = data.announcements.map(item => ({ ...item, category: item.category || 'General' }));
let selectedHelpUserId = '';
let currentChatId = '';
let selectedSeat = 0;
let editingAnnouncementId = '';
function passwordHash(value) { let hash = 0; for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0; return String(hash); }
function isAuwAcademicEmail(email) { return /^[^\s@]+@auw\.edu\.bd$/i.test(String(email || '').trim()); }

function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
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
function currentUser() { return data.users.find(user => user.id === data.currentUserId) || data.users[0]; }
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
function activeBooking() { return data.bookings.find(booking => booking.studentId === currentUser().id); }

function goTo(viewName) {
  if (viewName === 'admin' && currentUser()?.role !== 'Admin') { showToast('Administrator access is required.'); return; }
  if (viewName === 'faculty' && !['Teacher', 'Admin'].includes(currentUser()?.role)) { showToast('Faculty access is required.'); return; }
  const target = document.getElementById(`view-${viewName}`);
  if (!target) return;
  $$('.view').forEach(view => view.classList.remove('active'));
  target.classList.add('active');
  $$('.nav-item[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === viewName));
  $('#crumb').textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
  $('#sidebar').classList.remove('open');
  renderCurrentView(viewName);
}
function renderIdentity() {
  const user = currentUser();
  $('#sidebarAvatar').innerHTML = `${avatarContent(user)}<span id="sidebarPresenceDot" class="presence-dot" title="Online"></span>`;
  $('#topAvatar').innerHTML = avatarContent(user);
  $('#profilePhotoPreview').innerHTML = avatarContent(user);
  $('#removeProfilePhoto').classList.toggle('hidden', !user.photo);
  $('#sidebarName').textContent = user.name;
  $('#sidebarRole').textContent = `${user.role} · ${user.group}`;
  $('#helpWidget').classList.toggle('admin-view', user.role === 'Admin');
  $('#helpWidgetToggle').querySelector('span').textContent = user.role === 'Admin' ? 'Open support inbox' : 'How can I help you?';
  $('#welcomeName').textContent = user.name.split(' ')[0];
  $$('.teacher-only').forEach(item => item.classList.toggle('hidden', !['Teacher', 'Admin'].includes(user.role)));
  $$('.admin-only').forEach(item => item.classList.toggle('hidden', user.role !== 'Admin'));
  $('#profileName').value = user.name;
  $('#profileEmail').value = user.email;
  $('#profileRole').value = user.role;
  $('#profileGroup').value = user.group;
  $('#profileGroup').disabled = user.role !== 'Student';
  $('#studentGroup').value = user.group === 'Faculty' ? 'Pathways' : user.group;
  renderPresence();
}
function renderOverview() {
  const booking = activeBooking();
  $('#statBooking').textContent = booking ? `Seat ${booking.seat}` : 'Not booked';
  $('#statBookingSub').textContent = booking ? `${booking.date} · ${formatTime(booking.time)}` : 'Find an available seat';
  const grades = data.grades.filter(item => item.studentId === currentUser().id);
  const average = grades.length ? grades.reduce((sum, item) => sum + gradeFor(item.obtained, item.total).percentage, 0) / grades.length : 0;
  $('#statAverage').textContent = grades.length ? `${average.toFixed(1)}%` : '—';
  $('#statAnnouncements').textContent = data.announcements.length;
  $('#statMessages').textContent = data.conversations.filter(chat => chat.memberIds.includes(currentUser().id)).length;
}
function renderFacilities() {
  const list = $('#facilityList');
  if (!list) return;
  list.innerHTML = data.facilities.map(item => `<article class="facility-card"><div class="facility-icon">${escapeHTML(item.icon || '⌂')}</div><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.description)}</p></article>`).join('') || '<p class="muted">No facilities have been added yet.</p>';
}

function renderSchedule() {
  const user = currentUser();
  let schedules = data.schedules;
  if (user.role === 'Student') schedules = schedules.filter(item => item.group === user.group);
  if (user.role === 'Teacher') schedules = schedules.filter(item => item.teacherId === user.id);
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  schedules = [...schedules].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.start.localeCompare(b.start));
  $('#studentScheduleBody').innerHTML = schedules.map(item => `<tr><td>${escapeHTML(item.day)}</td><td>${formatTime(item.start)} – ${formatTime(item.end)}</td><td>${escapeHTML(courseName(item.courseId))}</td><td>${escapeHTML(item.room)}</td><td>${escapeHTML(getTeacher(item.teacherId)?.name || 'Unassigned')}</td></tr>`).join('') || '<tr><td colspan="5">No classes have been scheduled for this account yet.</td></tr>';
  $('#scheduleHeading').textContent = user.role === 'Student' ? `${user.group} weekly schedule` : user.role === 'Teacher' ? 'My teaching schedule' : 'All class schedules';
}
function renderGradeScale() {
  $('#gradeScaleBody').innerHTML = gradeScale.map(item => `<tr><td><span class="grade-letter">${item.letter}</span></td><td>${item.gpa.toFixed(1)}</td><td>${item.letter === 'F' ? '59 or below' : `${item.min}–${Math.floor(item.max)}`}</td><td>${item.description}</td></tr>`).join('');
}
function renderGrades() {
  const user = currentUser();
  const grades = data.grades.filter(item => user.role === 'Admin' || (user.role === 'Student' && item.studentId === user.id) || (user.role === 'Teacher' && getCourse(item.courseId)?.teacherId === user.id));
  const results = grades.map(item => ({ ...item, result: gradeFor(item.obtained, item.total) }));
  const average = results.length ? results.reduce((sum, item) => sum + item.result.percentage, 0) / results.length : 0;
  const gpa = results.length ? results.reduce((sum, item) => sum + item.result.gpa, 0) / results.length : 0;
  $('#gradeAverage').textContent = results.length ? `${average.toFixed(1)}%` : '—';
  $('#gradeGpa').textContent = results.length ? gpa.toFixed(2) : '—';
  $('#gradeCount').textContent = results.length;
  $('#myGradeBody').innerHTML = results.map(item => `<tr><td>${escapeHTML(courseName(item.courseId))}</td><td>${item.obtained}</td><td>${item.total}</td><td>${item.result.percentage.toFixed(1)}%</td><td><span class="grade-letter">${item.result.letter}</span></td><td>${item.result.gpa.toFixed(1)}</td><td>${escapeHTML(item.feedback || '—')}</td></tr>`).join('') || '<tr><td colspan="7">No grades have been entered for this account yet.</td></tr>';
  renderGradeScale();
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
function renderHelpWidget() {
  const host = $('#helpWidgetMessages');
  if (!host || currentUser().role === 'Admin') return;
  const messages = helpThreadMessages(currentUser().id);
  host.innerHTML = messages.map(message => {
    const mine = message.senderId === currentUser().id;
    return `<div class="help-message ${mine ? 'help-message-mine' : 'help-message-admin'}"><strong>${mine ? 'You' : 'AUW Connect Admin'}</strong><p>${escapeHTML(message.text)}</p><small>${escapeHTML(message.time)}</small></div>`;
  }).join('') || '<p class="muted">Hello! Send a message and the Admin team can respond here.</p>';
  host.scrollTop = host.scrollHeight;
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
  const teachers = data.users.filter(user => user.role === 'Teacher');
  $('#teacherSelect').innerHTML = '<option value="">Select a teacher</option>' + teachers.map(user => `<option value="${user.id}">${escapeHTML(user.name)}</option>`).join('');
  if (teachers.length && !$('#teacherSelect').value) $('#teacherSelect').value = teachers[0].id;
  $('#facultyCourse').innerHTML = data.courses.map(course => `<option value="${course.id}">${escapeHTML(course.code)} · ${escapeHTML(course.name)}</option>`).join('');
  const allowedCourses = currentUser().role === 'Admin' ? data.courses : data.courses.filter(course => course.teacherId === currentUser().id);
  $('#gradeCourse').innerHTML = allowedCourses.map(course => `<option value="${course.id}">${escapeHTML(course.code)} · ${escapeHTML(course.name)}</option>`).join('');
  $('#newCourseTeacher').innerHTML = teachers.map(user => `<option value="${user.id}">${escapeHTML(user.name)}</option>`).join('');
  $('#adminScheduleCourse').innerHTML = data.courses.map(course => `<option value="${course.id}">${escapeHTML(course.code)} · ${escapeHTML(course.name)}</option>`).join('');
}
function bookedSeats(teacherId, date, time) {
  return data.bookings.filter(item => item.teacherId === teacherId && item.date === date && item.time === time).map(item => Number(item.seat));
}
function renderSeats() {
  const teacherId = $('#teacherSelect').value;
  const date = $('#bookingDate').value;
  const time = $('#bookingTime').value;
  const occupied = bookedSeats(teacherId, date, time);
  if (occupied.includes(selectedSeat)) selectedSeat = 0;
  $('#seatMapSummary').textContent = teacherId && date ? `${20 - occupied.length} seats available` : 'Select session details';
  $('#seatGrid').innerHTML = Array.from({ length: 20 }, (_, index) => {
    const seat = index + 1;
    const isBooked = occupied.includes(seat);
    const selected = selectedSeat === seat;
    return `<button type="button" class="seat ${isBooked ? 'booked' : ''} ${selected ? 'selected' : ''}" data-seat="${seat}" ${isBooked ? 'disabled' : ''}>${String(seat).padStart(2, '0')}</button>`;
  }).join('');
  $('#seatSelect').value = selectedSeat || '';
  renderCapacity();
}
function renderCapacity() {
  const teacherId = $('#teacherSelect').value;
  const date = $('#bookingDate').value;
  const time = $('#bookingTime').value;
  const teacher = getTeacher(teacherId);
  const occupied = bookedSeats(teacherId, date, time).length;
  $('#capacityGrid').innerHTML = teacher ? `<div class="facility-card"><h3>${escapeHTML(teacher.name)}</h3><p>${20 - occupied} of 20 seats available for ${escapeHTML(date)} at ${formatTime(time)}.</p></div>` : '<p class="muted">Choose a teacher to view capacity.</p>';
}
function renderBooking() {
  const booking = activeBooking();
  $('#currentBooking').innerHTML = booking ? `<div class="booking-card"><strong>Booking confirmed</strong><p>Teacher: ${escapeHTML(booking.teacherName)}</p><p>Date: ${escapeHTML(booking.date)}</p><p>Time: ${formatTime(booking.time)}</p><p>Seat: ${String(booking.seat).padStart(2, '0')}</p><p>Reason: ${escapeHTML(booking.reason)}</p></div>` : 'No active booking yet.';
  $('#cancelArea').classList.toggle('hidden', !booking);
  renderSeats();
}
function chatTitle(chat) {
  if (chat.type === 'group') return chat.title;
  const otherId = chat.memberIds.find(id => id !== currentUser().id);
  return getUser(otherId)?.name || chat.title || 'Private chat';
}
function renderConversations() {
  const chats = data.conversations.filter(chat => chat.type === 'group' || chat.memberIds.includes(currentUser().id));
  if (!currentChatId || !chats.some(chat => chat.id === currentChatId)) currentChatId = chats.find(chat => chat.memberIds.includes(currentUser().id))?.id || chats[0]?.id || '';
  $('#conversationList').innerHTML = chats.map(chat => {
    const otherId = chat.type === 'private' ? chat.memberIds.find(id => id !== currentUser().id) : '';
    const joined = chat.memberIds.includes(currentUser().id);
    const detail = chat.type === 'group' ? (joined ? `${chat.memberIds.length} members · Group chat` : 'Group chat · Select to join') : `${getUser(otherId)?.role || 'Campus member'} · ${isUserOnline(otherId) ? 'Online' : 'Offline'}`;
    const avatarUser = chat.type === 'private' ? getUser(otherId) : null;
    return `<button class="conversation ${chat.id === currentChatId ? 'active' : ''}" data-chat-id="${chat.id}"><span class="avatar">${avatarUser ? avatarContent(avatarUser) : initials(chatTitle(chat))}</span><span><strong>${escapeHTML(chatTitle(chat))}</strong><small>${detail}</small></span>${chat.type === 'private' ? `<i class="presence-dot ${isUserOnline(otherId) ? '' : 'is-offline'}" title="${isUserOnline(otherId) ? 'Online' : 'Offline'}"></i>` : ''}</button>`;
  }).join('') || '<p class="muted">No conversations. Start a new chat.</p>';
  renderChat();
}
function renderChat() {
  const chat = data.conversations.find(item => item.id === currentChatId && (item.type === 'group' || item.memberIds.includes(currentUser().id)) && item.memberIds.includes(currentUser().id));
  $('#chatTitle').textContent = chat ? chatTitle(chat) : 'Select a conversation';
  if (chat && chat.type === 'private') { const otherId = chat.memberIds.find(id => id !== currentUser().id); $('#chatSubtitle').innerHTML = `${escapeHTML(getUser(otherId)?.role || 'Campus member')} · ${presenceLabel(otherId)}`; }
  else $('#chatSubtitle').textContent = chat ? `${chat.memberIds.length} group members` : 'Start a new chat to connect';
  $('#chatMessages').innerHTML = chat ? chat.messages.map(message => {
    const sender = getUser(message.senderId);
    const mine = message.senderId === currentUser().id;
    const safeText = escapeHTML(message.text || '').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\n/g, '<br>');
    let attachmentHTML = '';
    if (message.attachment) {
      const file = message.attachment;
      const safeName = escapeHTML(file.name);
      if (file.type && file.type.startsWith('image/')) {
        attachmentHTML = `<div class="message-attachment image-attachment"><a href="${file.data}" target="_blank" rel="noopener noreferrer"><img src="${file.data}" alt="${safeName}"></a><a class="attachment-download" href="${file.data}" download="${safeName}">Download ${safeName}</a></div>`;
      } else {
        attachmentHTML = `<div class="message-attachment document-attachment"><span class="document-icon">▤</span><span class="document-name">${safeName}<small>${(file.size / 1024).toFixed(0)} KB</small></span><a class="attachment-download" href="${file.data}" download="${safeName}">Download</a></div>`;
      }
    }
    return `<div class="message ${mine ? 'mine' : ''}"><p>${escapeHTML(mine ? 'You' : sender?.name || 'Campus member')}</p>${message.text ? `<div class="message-bubble">${safeText}</div>` : ''}${attachmentHTML}<time>${escapeHTML(message.time)}</time></div>`;
  }).join('') : '<p class="muted">Choose a conversation from the left or create a new one.</p>';
  $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
  $('#chatInput').disabled = !chat;
  $('#chatForm').querySelector('button').disabled = !chat;
}
function renderFaculty() {
  const user = currentUser();
  const students = data.users.filter(item => item.role === 'Student');
  const schedules = data.schedules.filter(item => user.role === 'Admin' || item.teacherId === user.id);
  $('#facultyStudentCount').textContent = students.length;
  $('#facultyCourseCount').textContent = data.courses.length;
  $('#facultyScheduleCount').textContent = schedules.length;
  $('#facultyScheduleBody').innerHTML = schedules.map(item => `<tr><td>${escapeHTML(item.day)}</td><td>${formatTime(item.start)} – ${formatTime(item.end)}</td><td>${escapeHTML(courseName(item.courseId))}</td><td>${escapeHTML(item.room)}</td><td><button class="remove-btn" data-delete-schedule="${item.id}">Remove</button></td></tr>`).join('') || '<tr><td colspan="5">No classes assigned.</td></tr>';
  $('#gradeStudent').innerHTML = students.map(item => `<option value="${item.id}">${escapeHTML(item.name)} (${escapeHTML(item.group)})</option>`).join('');
  const visibleGrades = data.grades.filter(item => user.role === 'Admin' || getCourse(item.courseId)?.teacherId === user.id);
  $('#facultyStudentBody').innerHTML = visibleGrades.map(item => {
    const student = getUser(item.studentId); const result = gradeFor(item.obtained, item.total);
    return `<tr><td>${escapeHTML(student?.name || 'Unknown')}</td><td>${escapeHTML(student?.group || '')}</td><td>${escapeHTML(courseName(item.courseId))}</td><td>${item.obtained}/${item.total}</td><td>${result.percentage.toFixed(1)}%</td><td>${result.letter}</td></tr>`;
  }).join('') || '<tr><td colspan="6">No marks have been entered.</td></tr>';
  $('#facultyPosts').innerHTML = data.facultyPosts.map(post => `<article class="announcement-card"><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.text)}</p><small>Shared by ${escapeHTML(getUser(post.authorId)?.name || 'Faculty')}</small></article>`).join('');
}
function renderAdmin() {
  if (currentUser()?.role !== 'Admin') return;
  $('#adminUserCount').textContent = data.users.length;
  $('#adminCourseCount').textContent = data.courses.length;
  $('#adminBookingCount').textContent = data.bookings.length;
  $('#adminUserBody').innerHTML = data.users.map(user => `<tr><td>${escapeHTML(user.name)}</td><td>${escapeHTML(user.email)}</td><td>${escapeHTML(user.role)}</td><td>${escapeHTML(user.group)}</td><td>${presenceLabel(user.id)}</td><td>${user.id === 'a1' ? 'Protected' : `<button class="remove-btn" data-delete-user="${user.id}">Remove</button>`}</td></tr>`).join('');
  $('#adminCourseBody').innerHTML = data.courses.map(course => `<tr><td>${escapeHTML(course.code)}</td><td>${escapeHTML(course.name)}</td><td>${escapeHTML(getTeacher(course.teacherId)?.name || 'Unassigned')}</td><td><button class="remove-btn" data-delete-course="${course.id}">Remove</button></td></tr>`).join('');
  renderAdminAnnouncements();
  renderAdminHelpInbox();
  $('#adminBookingBody').innerHTML = data.bookings.map(item => `<tr><td>${escapeHTML(getUser(item.studentId)?.name || item.studentName)}</td><td>${escapeHTML(item.teacherName)}</td><td>${escapeHTML(item.date)}</td><td>${formatTime(item.time)}</td><td>${item.seat}</td><td><button class="remove-btn" data-delete-booking="${item.id}">Cancel</button></td></tr>`).join('') || '<tr><td colspan="6">No active bookings.</td></tr>';
}
function renderCurrentView(view) {
  if (view === 'overview') renderOverview();
  if (view === 'profile') renderIdentity();
  if (view === 'schedule') renderSchedule();
  if (view === 'facilities') renderFacilities();
  if (view === 'booking') renderBooking();
  if (view === 'grades') renderGrades();
  if (view === 'announcements') renderAnnouncements();
  if (view === 'messages') renderConversations();
  if (view === 'faculty') renderFaculty();
  if (view === 'admin') renderAdmin();
}
function renderAll() {
  renderIdentity(); renderTeachers(); renderOverview(); renderSchedule(); renderFacilities(); renderBooking();
  renderGrades(); renderAnnouncements(); renderConversations();
  renderFaculty(); renderAdmin(); renderHelpWidget();
}
function renderContactPicker(searchText = '') {
  const results = $('#contactResults');
  if (!results) return;
  const me = currentUser();
  const query = String(searchText || '').trim().toLowerCase();
  const contacts = data.users
    .filter(user => user.id !== me.id)
    .filter(user => `${user.name} ${user.email} ${user.role} ${user.group || ''}`.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));

  results.innerHTML = contacts.map(user => {
    const existing = data.conversations.some(chat => chat.type === 'private' && Array.isArray(chat.memberIds) && chat.memberIds.length === 2 && chat.memberIds.includes(me.id) && chat.memberIds.includes(user.id));
    const online = isUserOnline(user.id);
    return `<button type="button" class="contact-result" data-start-private-chat="${escapeHTML(user.id)}">
      <span class="avatar">${avatarContent(user)}</span>
      <span class="contact-result-info"><strong>${escapeHTML(user.name)}</strong><small>${escapeHTML(user.role)} · ${escapeHTML(user.group || 'AUW')}</small><small>${escapeHTML(user.email)}</small></span>
      <span class="contact-result-status"><i class="presence-dot ${online ? '' : 'is-offline'}"></i>${online ? 'Online' : 'Offline'}<b>${existing ? 'Open chat' : 'Message'}</b></span>
    </button>`;
  }).join('') || '<p class="muted contact-empty">No matching people found. Check the spelling or ask them to create an account.</p>';
}

function openContactPicker() {
  const picker = $('#contactPicker');
  if (!picker) return;
  picker.classList.remove('hidden');
  $('#contactSearch').value = '';
  renderContactPicker();
  $('#contactSearch').focus();
}

function createGroupChat() {
  const me = currentUser();
  const candidates = data.users.filter(user => user.id !== me.id);
  if (candidates.length < 2) return showToast('At least two other accounts are needed to create a group chat.');
  const names = candidates.map((user, index) => `${index + 1}. ${user.name} (${user.role} · ${user.group || 'AUW'})`).join('\n');
  const answer = prompt(`Enter participant numbers separated by commas (choose at least 2 people):\n${names}`);
  if (answer === null) return;
  const selected = answer.split(',').map(value => candidates[Number(value.trim()) - 1]).filter(Boolean);
  const memberIds = [...new Set([me.id, ...selected.map(user => user.id)])];
  if (memberIds.length < 3) return showToast('A group chat needs you and at least two other members.');
  const title = prompt('Give your group chat a name:');
  if (!title || !title.trim()) return showToast('Please enter a group name.');
  const chat = { id: `chat${Date.now()}`, title: title.trim(), type: 'group', memberIds, messages: [] };
  data.conversations.push(chat);
  currentChatId = chat.id;
  saveData();
  $('#contactPicker').classList.add('hidden');
  renderConversations();
  showToast('Group chat created.');
}

function createPrivateChat(otherUserId) {
  const me = currentUser();
  const other = getUser(otherUserId);
  if (!other || other.id === me.id) {
    showToast('Please choose another person from the contact list.');
    return;
  }
  let chat = data.conversations.find(item => item.type === 'private' && Array.isArray(item.memberIds) && item.memberIds.length === 2 && item.memberIds.includes(me.id) && item.memberIds.includes(other.id));
  if (!chat) {
    chat = { id: `private-${me.id}-${other.id}-${Date.now()}`, title: other.name, type: 'private', memberIds: [me.id, other.id], messages: [] };
    data.conversations.push(chat);
  }
  chat.messages = Array.isArray(chat.messages) ? chat.messages : [];
  currentChatId = chat.id;
  saveData();
  const picker = $('#contactPicker');
  if (picker) picker.classList.add('hidden');
  goTo('messages');
  renderConversations();
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
      showToast('Please switch to the Administrator campus account first.');
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
  $('#helpWidgetToggle').addEventListener('click', () => {
    if (currentUser().role === 'Admin') { goTo('admin'); return; }
    $('#helpWidgetPanel').classList.toggle('hidden');
    const isOpen = !$('#helpWidgetPanel').classList.contains('hidden');
    $('#helpWidgetToggle').setAttribute('aria-expanded', String(isOpen));
    if (isOpen) renderHelpWidget();
  });
  $('#helpWidgetClose').addEventListener('click', () => {
    $('#helpWidgetPanel').classList.add('hidden');
    $('#helpWidgetToggle').setAttribute('aria-expanded', 'false');
  });
  $('#helpWidgetForm').addEventListener('submit', event => {
    event.preventDefault();
    if (currentUser().role === 'Admin') return goTo('admin');
    const message = $('#helpWidgetInput').value.trim();
    if (!message) return;
    sendHelpMessage(currentUser().id, currentUser().id, message);
    $('#helpWidgetInput').value = '';
    renderHelpWidget();
    showToast('Your message was sent to Admin.');
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
  document.addEventListener('click', event => {
    const goButton = event.target.closest('[data-go]');
    if (goButton) goTo(goButton.dataset.go);
    const seatButton = event.target.closest('[data-seat]');
    if (seatButton && !seatButton.disabled) { selectedSeat = Number(seatButton.dataset.seat); renderSeats(); }
    const chatButton = event.target.closest('[data-chat-id]');
    if (chatButton) {
      const chosenChat = data.conversations.find(item => item.id === chatButton.dataset.chatId);
      if (chosenChat && chosenChat.type === 'group' && !chosenChat.memberIds.includes(currentUser().id)) {
        chosenChat.memberIds.push(currentUser().id);
        saveData();
        showToast(`You joined the ${chosenChat.groupKey || chosenChat.title} group.`);
      }
      currentChatId = chatButton.dataset.chatId;
      renderConversations();
    }
    const helpThread = event.target.closest('[data-help-thread]');
    if (helpThread && currentUser().role === 'Admin') { selectedHelpUserId = helpThread.dataset.helpThread; renderAdminHelpInbox(); }
    const deleteUser = event.target.closest('[data-delete-user]');
    if (deleteUser) {
      const id = deleteUser.dataset.deleteUser;
      if (!confirm('Remove this campus account? Its private conversations and grade records may also become unavailable.')) return;
      data.users = data.users.filter(item => item.id !== id);
      data.bookings = data.bookings.filter(item => item.studentId !== id && item.teacherId !== id);
      data.grades = data.grades.filter(item => item.studentId !== id);
      data.conversations = data.conversations.filter(chat => !chat.memberIds.includes(id));
      data.schedules = data.schedules.filter(item => item.teacherId !== id);
      saveData(); renderAll(); showToast('User removed from this browser.');
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
    const deleteBooking = event.target.closest('[data-delete-booking]');
    if (deleteBooking) { data.bookings = data.bookings.filter(item => item.id !== deleteBooking.dataset.deleteBooking); saveData(); renderAll(); showToast('Booking cancelled by admin.'); }
    const deleteSchedule = event.target.closest('[data-delete-schedule]');
    if (deleteSchedule) { data.schedules = data.schedules.filter(item => item.id !== deleteSchedule.dataset.deleteSchedule); saveData(); renderFaculty(); renderSchedule(); }
  });
  $('#signOutBtn').addEventListener('click', () => {
    if (currentUser()?.id && data.presence) data.presence[currentUser().id] = 0;
    data.currentUserId = null;
    saveData();
    $('#authModal').classList.remove('hidden');
    $('#loginForm').reset();
    $('#signupForm').reset();
    showToast('You have signed out.');
  });
  $('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#topAvatar').addEventListener('click', () => $('#authModal').classList.remove('hidden'));
  $('#switchAccountBtn').addEventListener('click', () => $('#authModal').classList.remove('hidden'));
  $('#closeAuthBtn').addEventListener('click', () => { if (data.currentUserId) $('#authModal').classList.add('hidden'); });
  $('#authModal').addEventListener('click', event => { if (event.target === $('#authModal') && data.currentUserId) $('#authModal').classList.add('hidden'); });
  $('#loginForm').addEventListener('submit', event => {
    event.preventDefault();
    const email = $('#loginEmail').value.trim().toLowerCase();
    const password = $('#loginPassword').value;
    const user = data.users.find(item => item.email.toLowerCase() === email && item.passwordHash === passwordHash(password));
    if (!user) { showToast('Email or password is incorrect.'); return; }
    data.currentUserId = user.id;
    saveData(); updateMyPresence(); $('#authModal').classList.add('hidden');
    $('#loginForm').reset(); currentChatId = ''; renderAll();
    goTo(user.role === 'Admin' ? 'admin' : 'overview');
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
    const password = $('#signupPassword').value;
    const role = $('#signupRole').value;
    if (role === 'Admin') return showToast('Administrator accounts can only be created by the site owner.');
    if (password.length < 8) return showToast('Use a password with at least 8 characters.');
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return showToast('Include at least one capital letter and one number in your password.');
    if (!isAuwAcademicEmail(email)) return showToast('Please use your AUW academic email ending in @auw.edu.bd.');
    if (data.users.some(user => String(user.email).toLowerCase() === email)) return showToast('An account with this email already exists.');
    const id = `${role === 'Student' ? 's' : 't'}${Date.now()}`;
    data.users.push({ id, name, email, passwordHash: passwordHash(password), role, group: role === 'Student' ? $('#signupGroup').value : 'Faculty' });
    data.currentUserId = id;
    updateMyPresence(); saveData(); $('#signupForm').reset();
    $('#signupGroupLabel').classList.remove('hidden'); $('#signupGroup').required = true;
    $('#authModal').classList.add('hidden'); currentChatId = ''; renderAll(); goTo('overview');
    showToast(`Welcome, ${name}! Your account has been created.`);
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
    if (!isAuwAcademicEmail(newEmail)) return showToast('Please use your AUW academic email ending in @auw.edu.bd.');
    if (data.users.some(item => item.id !== user.id && item.email.toLowerCase() === newEmail)) {
      showToast('That email address is already used by another account.');
      return;
    }
    user.name = $('#profileName').value.trim();
    user.email = newEmail;
    if (user.role === 'Student') user.group = $('#profileGroup').value;
    saveData(); renderAll(); showToast('Profile updated.');
  });
  ['teacherSelect', 'bookingDate', 'bookingTime'].forEach(id => $('#' + id).addEventListener('change', () => { selectedSeat = 0; renderSeats(); }));
  $('#bookingForm').addEventListener('submit', event => {
    event.preventDefault();
    const user = currentUser();
    if (user.role !== 'Student') return showToast('Switch to a Student campus account to book a seat.');
    if (activeBooking()) return showToast('You already have an active booking. Cancel it first.');
    const teacherId = $('#teacherSelect').value, date = $('#bookingDate').value, time = $('#bookingTime').value;
    const reason = $('#bookingReason').value.trim();
    if (!teacherId || !selectedSeat || !date || reason.length < 8) return showToast('Choose a teacher, date, seat and a reason of at least 8 characters.');
    if (date < new Date().toISOString().slice(0, 10)) return showToast('Past dates cannot be booked.');
    if (bookedSeats(teacherId, date, time).includes(selectedSeat)) return showToast('That seat has already been booked. Choose another seat.');
    const teacher = getTeacher(teacherId);
    data.bookings.push({ id: `b${Date.now()}`, studentId: user.id, studentName: user.name, teacherId, teacherName: teacher.name, date, time, seat: selectedSeat, reason });
    selectedSeat = 0; saveData(); renderAll(); $('#bookingReason').value = ''; showToast('Seat booked in this browser.');
  });
  $('#cancelBookingBtn').addEventListener('click', () => {
    if (!activeBooking()) return;
    if ($('#cancelReason').value.trim().length < 5) return showToast('Please enter a short cancellation reason.');
    data.bookings = data.bookings.filter(item => item.studentId !== currentUser().id);
    $('#cancelReason').value = ''; saveData(); renderAll(); showToast('Your booking has been cancelled.');
  });
  $('#chatFile').addEventListener('change', () => {
    const file = $('#chatFile').files[0];
    $('#chatFileName').textContent = file ? `Selected: ${file.name} · ${(file.size / 1024).toFixed(0)} KB` : 'You can attach a picture or document (maximum 700 KB).';
    if (file && file.size > 700 * 1024) {
      showToast('Please choose a file smaller than 700 KB for this browser campus.');
      $('#chatFile').value = '';
      $('#chatFileName').textContent = 'You can attach a picture or document (maximum 700 KB).';
    }
  });
  $('#chatForm').addEventListener('submit', event => {
    event.preventDefault();
    const chat = data.conversations.find(item => item.id === currentChatId && item.memberIds.includes(currentUser().id));
    const text = $('#chatInput').value.trim();
    const file = $('#chatFile').files[0];
    if (!chat) return;
    if (!text && !file) return showToast('Write a message or attach a file first.');
    if (file && file.size > 700 * 1024) return showToast('File must be smaller than 700 KB.');
    const sendMessage = attachment => {
      chat.messages.push({ id: `m${Date.now()}`, senderId: currentUser().id, text, attachment, time: new Date().toLocaleString() });
      $('#chatInput').value = '';
      $('#chatFile').value = '';
      $('#chatFileName').textContent = 'You can attach a picture or document (maximum 700 KB).';
      try {
        saveData();
        renderChat(); renderConversations(); renderOverview();
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
  $('#closeContactPicker').addEventListener('click', () => $('#contactPicker').classList.add('hidden'));
  $('#contactSearch').addEventListener('input', event => renderContactPicker(event.target.value));
  $('#createGroupChatBtn').addEventListener('click', createGroupChat);
  $('#contactResults').addEventListener('click', event => {
    const contactButton = event.target.closest('[data-start-private-chat]');
    if (!contactButton) return;
    createPrivateChat(contactButton.dataset.startPrivateChat);
  });
  $('#facultyScheduleForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!['Teacher', 'Admin'].includes(currentUser().role)) return showToast('Faculty access required.');
    const start = $('#facultyStart').value, end = $('#facultyEnd').value;
    if (start >= end) return showToast('End time must be later than start time.');
    data.schedules.push({ id: `sc${Date.now()}`, courseId: $('#facultyCourse').value, day: $('#facultyDay').value, start, end, room: $('#facultyRoom').value.trim(), teacherId: currentUser().role === 'Admin' ? getCourse($('#facultyCourse').value)?.teacherId : currentUser().id, group: $('#facultyGroup').value });
    saveData(); $('#facultyScheduleForm').reset(); renderAll(); showToast('Class schedule added.');
  });
  $('#gradeForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!['Teacher', 'Admin'].includes(currentUser().role)) return showToast('Faculty access required.');
    const obtained = Number($('#obtainedMarks').value), total = Number($('#totalMarks').value);
    if (total <= 0 || obtained < 0 || obtained > total) return showToast('Obtained marks must be between zero and the total marks.');
    const studentId = $('#gradeStudent').value, courseId = $('#gradeCourse').value;
    if (!data.users.some(user => user.id === studentId && user.role === 'Student')) return showToast('Please select a valid student.');
    if (currentUser().role !== 'Admin' && getCourse(courseId)?.teacherId !== currentUser().id) return showToast('You can only enter marks for your own courses.');
    const existing = data.grades.find(item => item.studentId === studentId && item.courseId === courseId);
    if (existing) { existing.obtained = obtained; existing.total = total; existing.feedback = $('#gradeFeedback').value.trim(); }
    else data.grades.push({ id: `g${Date.now()}`, studentId, courseId, obtained, total, feedback: $('#gradeFeedback').value.trim() });
    const result = gradeFor(obtained, total);
    saveData(); renderAll(); $('#gradeForm').reset(); showToast(`Saved: ${result.percentage.toFixed(1)}% · ${result.letter} · GPA ${result.gpa.toFixed(1)}`);
  });
  $('#facultyPostForm').addEventListener('submit', event => {
    event.preventDefault();
    data.facultyPosts.unshift({ id: `fp${Date.now()}`, title: $('#facultyPostTitle').value.trim(), text: $('#facultyPostText').value.trim(), authorId: currentUser().id });
    saveData(); $('#facultyPostForm').reset(); renderFaculty(); showToast('Teaching idea shared.');
  });
  $('#addUserForm').addEventListener('submit', event => {
    event.preventDefault();
    if (currentUser().role !== 'Admin') return showToast('Admin access required.');
    const email = $('#newUserEmail').value.trim().toLowerCase();
    if (!isAuwAcademicEmail(email)) return showToast('Only AUW academic emails ending in @auw.edu.bd are allowed.');
    if (data.users.some(user => user.email.toLowerCase() === email)) return showToast('This email already exists.');
    const role = $('#newUserRole').value;
    const password = $('#newUserPassword').value;
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return showToast('Use at least 8 characters, one capital letter and one number.');
    data.users.push({ id: `u${Date.now()}`, name: $('#newUserName').value.trim(), email, passwordHash: passwordHash(password), role, group: role === 'Student' ? $('#newUserGroup').value : 'Faculty' });
    saveData(); $('#addUserForm').reset(); renderAll(); showToast('User added to the campus directory.');
  });
  $('#addCourseForm').addEventListener('submit', event => {
    event.preventDefault();
    if (currentUser().role !== 'Admin') return showToast('Admin access required.');
    const code = $('#newCourseCode').value.trim().toUpperCase();
    if (data.courses.some(course => course.code.toUpperCase() === code)) return showToast('That course code already exists.');
    data.courses.push({ id: `c${Date.now()}`, code, name: $('#newCourseName').value.trim(), teacherId: $('#newCourseTeacher').value });
    saveData(); $('#addCourseForm').reset(); renderAll(); showToast('Course added.');
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
  $('#adminScheduleForm').addEventListener('submit', event => {
    event.preventDefault();
    if (currentUser().role !== 'Admin') return showToast('Admin access required.');
    const start = $('#adminScheduleStart').value, end = $('#adminScheduleEnd').value;
    if (start >= end) return showToast('End time must be later than start time.');
    const courseId = $('#adminScheduleCourse').value;
    data.schedules.push({ id: `sc${Date.now()}`, courseId, day: $('#adminScheduleDay').value, start, end, room: $('#adminScheduleRoom').value.trim(), teacherId: getCourse(courseId)?.teacherId, group: $('#adminScheduleGroup').value });
    saveData(); $('#adminScheduleForm').reset(); renderAll(); showToast('Class schedule added.');
  });
}

function startApp() {
  if (data.currentUserId && !data.users.some(user => user.id === data.currentUserId)) data.currentUserId = null;
  if (!data.presence) data.presence = {};
  $('#authModal').classList.remove('hidden');
  if (data.currentUserId) updateMyPresence();
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
  window.setInterval(() => { updateMyPresence(); renderPresence(); if ($('#view-messages').classList.contains('active')) renderConversations(); if ($('#view-admin').classList.contains('active')) renderAdmin(); if (!$('#helpWidgetPanel').classList.contains('hidden')) renderHelpWidget(); }, 15000);
  const today = new Date();
  $('#bookingDate').min = today.toISOString().slice(0, 10);
  $('#bookingDate').value = today.toISOString().slice(0, 10);
  renderAll(); setupThemeToggle(); setupEvents();
  renderCurrentView('overview');
  // Show the help invitation when a visitor first lands on the portal.
  window.setTimeout(() => {
    if (currentUser().role !== 'Admin') {
      $('#helpWidgetPanel').classList.remove('hidden');
      $('#helpWidgetToggle').setAttribute('aria-expanded', 'true');
      renderHelpWidget();
    }
  }, 900);
}
startApp();
