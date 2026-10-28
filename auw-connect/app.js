import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, runTransaction, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const state = { user:null, profile:null, authMode:"login", view:"overview", slots:[], teachers:[], booking:null, activeChat:null, chats:[], chatUnsub:null, messagesUnsub:null, listeners:[], listings:[], feedback:[], approved:[] };
const PROGRAMS = { pathways:"Pathways", foundation:"Foundation", undergraduate:"Undergraduate", staff:"Staff" };
const SUPPORT = { none:"No specific support area", concepts:"Concept understanding", practice:"More practice", confidence:"Confidence / participation", time:"Time management", language:"Language support" };
const appReady = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_") && firebaseConfig.projectId && !firebaseConfig.projectId.startsWith("YOUR_");
let app, auth, db;

function toast(message, type="success") {
  const el=$("toast"); el.textContent=message; el.className=`toast show ${type}`;
  clearTimeout(toast._timer); toast._timer=setTimeout(()=>el.className="toast",3600);
}
function setMessage(id, message, type="") { const el=$(id); if(!el)return; el.textContent=message; el.className=`message ${type}`.trim(); }
function safeDate(value) { if(!value)return null; if(typeof value.toDate==="function")return value.toDate(); const d=new Date(value); return Number.isNaN(d.getTime())?null:d; }
function fmtDate(value, opts={dateStyle:"medium",timeStyle:"short"}) { const d=safeDate(value); return d?new Intl.DateTimeFormat("en-GB",opts).format(d):"Not set"; }
function localInputDate(date) { const d=new Date(date.getTime()-date.getTimezoneOffset()*60000); return d.toISOString().slice(0,16); }
function cleanEmail(value) { return String(value||"").trim().toLowerCase(); }
function isRole(...roles) { return !!state.profile && roles.includes(state.profile.role); }
function escapeHtml(value="") { return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function shortName(name="") { return name.trim().split(/\s+/)[0] || "there"; }
function roleLabel(role) { return ({student:"Student",teacher:"Teacher",admin:"Administrator"}[role]||"Member"); }
function approvedPath(email) { return doc(db,"approvedEmails",cleanEmail(email)); }
function showAuth(mode="login") {
  state.authMode=mode; const registering=mode==="register";
  $("loginTab").classList.toggle("active",!registering); $("registerTab").classList.toggle("active",registering);
  $("authTitle").textContent=registering?"Create your account":"Welcome back";
  $("authSubtitle").textContent=registering?"Use the email address pre-approved by your university platform administrator.":"Sign in with your approved university email.";
  $("fullName").classList.toggle("hidden",!registering); $("nameLabel").classList.toggle("hidden",!registering);
  $("fullName").required=registering; $("password").autocomplete=registering?"new-password":"current-password";
  $("authSubmit").innerHTML=registering?'Create account <span>→</span>':'Sign in <span>→</span>';
  $("authHint").textContent=registering?"Your email must already be on the administrator's approved list.":"Your account and role are controlled by administrator approval.";
  setMessage("authMessage","");
}
function showView(view) {
  if(view==="admin"&&!isRole("admin")) return toast("Administrator access is required.","error");
  if(view==="faculty"&&!isRole("teacher","admin")) return toast("The Faculty Circle is for teachers only.","error");
  state.view=view;
  document.querySelectorAll(".view-panel").forEach(el=>el.classList.toggle("hidden",el.id!==`view-${view}`));
  document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
  const headings={overview:["Overview","A thoughtful space for your university journey."],appointments:["Appointments","Find the right teacher, time, and support."],progress:["Academic progress","Notice your strengths and plan your next step."],messages:["Messages","Connect with classmates and colleagues."],community:["Student exchange","A little sharing can make campus life easier."],faculty:["Faculty circle","Share practice, ideas, and ways to support students."],admin:["Administration","Manage access and appointment sessions."]};
  $("viewTitle").textContent=headings[view][0]; $("viewSubtitle").textContent=headings[view][1];
  if(view==="appointments") loadSlots(); if(view==="progress") loadFeedback(); if(view==="messages") loadChats(); if(view==="community") loadListings(); if(view==="faculty") loadFacultyFeed(); if(view==="admin") {loadApproved();loadAdminSlots();}
}
function renderProfile() {
  const p=state.profile||{}; const name=p.displayName||state.user?.displayName||state.user?.email||"AUW Member";
  $("profileName").textContent=name; $("profileRole").textContent=`${roleLabel(p.role)}${p.program&&p.program!=="staff"?" · "+(PROGRAMS[p.program]||p.program):""}`;
  $("avatar").textContent=(name[0]||"A").toUpperCase(); $("welcomeName").textContent=`Welcome, ${shortName(name)}.`;
  document.querySelectorAll(".admin-only").forEach(el=>el.classList.toggle("hidden",!isRole("admin")));
  $("teacherGradeBox").classList.toggle("hidden",!isRole("teacher","admin"));
  $("teacherRequestBox").classList.toggle("hidden",!isRole("student"));
  $("signOutBtn").classList.remove("hidden");
  $("programFilter").value=p.program&&PROGRAMS[p.program]?p.program:"all";
  $("todayLabel").textContent=new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"short"}).format(new Date());
}
function clearListeners() { state.listeners.forEach(fn=>fn()); state.listeners=[]; if(state.chatUnsub)state.chatUnsub(); if(state.messagesUnsub)state.messagesUnsub(); state.chatUnsub=state.messagesUnsub=null; }
function resetApp() {
  clearListeners(); state.user=null;state.profile=null;state.booking=null;state.activeChat=null;state.chats=[];state.slots=[];state.teachers=[];state.feedback=[];state.listings=[];
  $("appView").classList.add("hidden");$("authView").classList.remove("hidden");$("signOutBtn").classList.add("hidden");
}
async function handleAuthSubmit(e) {
  e.preventDefault(); if(!appReady)return setMessage("authMessage","Add your Firebase web configuration in firebase-config.js first.","error");
  const email=cleanEmail($("email").value), password=$("password").value, name=$("fullName").value.trim();
  $("authSubmit").disabled=true; setMessage("authMessage","Please wait…");
  try {
    if(state.authMode==="register") {
      if(!name)throw new Error("Enter your full name.");
      const allowSnap=await getDoc(approvedPath(email));
      if(!allowSnap.exists()||allowSnap.data().enabled===false)throw new Error("This email has not been approved. Please contact your platform administrator.");
      const approved=allowSnap.data(); if(!["student","teacher","admin"].includes(approved.role))throw new Error("The approved account role is invalid.");
      const cred=await createUserWithEmailAndPassword(auth,email,password);
      await updateProfile(cred.user,{displayName:name});
      await setDoc(doc(db,"users",cred.user.uid),{uid:cred.user.uid,email,displayName:name,role:approved.role,program:approved.program||"staff",createdAt:serverTimestamp(),active:true});
      setMessage("authMessage","Account created. Loading your workspace…","success");
    } else {
      await signInWithEmailAndPassword(auth,email,password);
    }
  } catch(err) { setMessage("authMessage",friendlyError(err),"error"); }
  finally { $("authSubmit").disabled=false; }
}
function friendlyError(err) {
  const code=err?.code||"";
  if(code==="auth/invalid-credential"||code==="auth/wrong-password"||code==="auth/user-not-found")return "Email or password is incorrect.";
  if(code==="auth/email-already-in-use")return "An account already exists for this email. Please sign in.";
  if(code==="auth/weak-password")return "Choose a stronger password with at least 8 characters.";
  if(code==="auth/invalid-email")return "Please enter a valid email address.";
  if(code==="permission-denied"||code==="firestore/permission-denied")return "You do not have permission to do that. If this seems wrong, contact the administrator.";
  if(code==="auth/too-many-requests")return "Too many attempts. Please wait and try again.";
  return err?.message||"Something went wrong. Please try again.";
}
async function loadProfile(user) {
  const snap=await getDoc(doc(db,"users",user.uid));
  if(!snap.exists()) {
    // If a previous sign-up partially completed, profile creation can be retried only if the email remains approved.
    const a=await getDoc(approvedPath(user.email));
    if(!a.exists()||a.data().enabled===false)throw new Error("Your approved access could not be verified. Contact the administrator.");
    const approved=a.data();
    await setDoc(doc(db,"users",user.uid),{uid:user.uid,email:cleanEmail(user.email),displayName:user.displayName||"",role:approved.role,program:approved.program||"staff",createdAt:serverTimestamp(),active:true});
    return (await getDoc(doc(db,"users",user.uid))).data();
  }
  const p=snap.data(); if(p.active===false)throw new Error("This account has been deactivated. Contact the administrator."); return p;
}
async function enterApp(user) {
  try {
    state.user=user; state.profile=await loadProfile(user);
    $("authView").classList.add("hidden"); $("appView").classList.remove("hidden"); renderProfile(); showView("overview");
    await refreshOverview();
    if(isRole("admin"))loadAdminSlots();
  } catch(err) { toast(friendlyError(err),"error"); await signOut(auth); resetApp(); }
}
async function refreshOverview() {
  try {
    const [bookingSnap, listingSnap, feedbackSnap]=await Promise.all([
      getDoc(doc(db,"reservations",state.user.uid)),
      getDocs(query(collection(db,"listings"),where("status","==","active"),limit(100))),
      getDocs(query(collection(db,"feedback"),where("studentUid","==",state.user.uid),limit(100)))
    ]);
    if(bookingSnap.exists()) {const b=bookingSnap.data();state.booking={id:bookingSnap.id,...b};$("statBooking").textContent="Booked";$("statBookingNote").textContent=b.slotTitle||"Your appointment is reserved";} else {$("statBooking").textContent="None";$("statBookingNote").textContent="Choose a session when you're ready";}
    const scores=feedbackSnap.docs.map(d=>d.data()).filter(f=>Number.isFinite(Number(f.score)));
    $("statProgress").textContent=scores.length?`${Math.round(scores.reduce((a,f)=>a+Number(f.score),0)/scores.length)}%`:"—";
    $("statCommunity").textContent=String(listingSnap.size);
  } catch(err) { console.warn(err); }
}
async function loadTeachers() {
  try {
    const snap=await getDocs(query(collection(db,"users"),where("role","==","teacher"),where("active","==",true),limit(100)));
    state.teachers=snap.docs.map(d=>({id:d.id,...d.data()}));
    const select=$("teacherFilter"), current=select.value;
    select.innerHTML='<option value="all">All teachers</option>'+state.teachers.map(t=>`<option value="${escapeHtml(t.uid)}">${escapeHtml(t.displayName||t.email)}</option>`).join("");
    if([...select.options].some(o=>o.value===current))select.value=current;
  } catch(e){console.warn("Teacher list",e);}
}
async function loadSlots() {
  if(!state.user)return;
  $("slotsList").innerHTML='<div class="empty-state">Loading appointment sessions…</div>';
  try {
    const [slotsSnap,bookingSnap]=await Promise.all([
      getDocs(query(collection(db,"slots"),where("active","==",true),limit(200))),
      getDoc(doc(db,"reservations",state.user.uid))
    ]);
    state.slots=slotsSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(safeDate(a.startAt)||0)-(safeDate(b.startAt)||0));
    state.booking=bookingSnap.exists()?{id:bookingSnap.id,...bookingSnap.data()}:null;
    await loadTeachers(); renderSlots(); renderMyBooking();
  } catch(err) { $("slotsList").innerHTML=`<div class="empty-state">${escapeHtml(friendlyError(err))}<br>Check Firestore setup and security rules.</div>`; }
}
function renderMyBooking() {
  const el=$("myBookingBox");
  if(!state.booking){el.classList.add("hidden");return;}
  const b=state.booking;el.classList.remove("hidden");
  el.innerHTML=`<div><b>Your current reservation</b>${escapeHtml(b.slotTitle||"Appointment")} · ${escapeHtml(b.teacherName||"Teacher")}<br>${escapeHtml(fmtDate(b.startAt))}</div><button id="cancelBookingBtn" class="button button-secondary">Cancel booking</button>`;
  $("cancelBookingBtn").onclick=()=>cancelBooking();
}
function renderSlots() {
  const program=$("programFilter").value, teacher=$("teacherFilter").value, now=Date.now();
  const slots=state.slots.filter(s=>(program==="all"||s.program===program)&&(teacher==="all"||s.teacherUid===teacher)&&safeDate(s.startAt)?.getTime()>now);
  if(!slots.length){$("slotsList").innerHTML='<div class="empty-state">No upcoming sessions match these filters. Check back later or ask the administrator to publish a session.</div>';return;}
  $("slotsList").innerHTML=slots.map(s=>{
    const booked=Array.isArray(s.bookedUids)?s.bookedUids.length:Number(s.bookedCount||0), cap=20, remaining=Math.max(0,cap-booked);
    const isMine=state.booking?.slotId===s.id, full=remaining===0, teacherName=s.teacherName||state.teachers.find(t=>t.uid===s.teacherUid)?.displayName||"AUW Teacher";
    const deadline=safeDate(s.bookingDeadline), canBook=!state.booking&&!full&&(!deadline||Date.now()<deadline.getTime())&&s.active!==false;
    return `<article class="slot-card"><div class="slot-top"><div><span class="mini-label">${escapeHtml(PROGRAMS[s.program]||s.program||"Appointment")}</span><h3>${escapeHtml(s.title||"Teacher appointment")}</h3><p>${escapeHtml(teacherName)}</p></div><span class="pill ${isMine?"green":full?"":"green"}">${isMine?"Your seat":full?"Full":`${remaining} seats left`}</span></div><div class="slot-meta"><span>◷ ${escapeHtml(fmtDate(s.startAt))} · ${Number(s.duration||30)} min</span><span>⌁ Booking closes ${escapeHtml(fmtDate(s.bookingDeadline,{dateStyle:"medium",timeStyle:"short"}))}</span><span>↻ Cancellation closes ${escapeHtml(fmtDate(s.cancellationDeadline,{dateStyle:"medium",timeStyle:"short"}))}</span></div><div class="seat-track"><span style="width:${Math.min(100,booked/20*100)}%"></span></div><div class="seat-label"><span>${booked} of 20 seats reserved</span><span>20 max</span></div><div class="slot-actions"><small>${isMine?"Reserved for you":state.booking?"Cancel your current booking before choosing another":full?"No seats available":deadline&&Date.now()>deadline.getTime()?"Booking closed":"First come, first served"}</small><button class="button ${isMine?"button-secondary":"button-primary"}" data-book="${escapeHtml(s.id)}" ${(!canBook&&!isMine)?"disabled":""}>${isMine?"View booking":canBook?"Book seat":"Unavailable"}</button></div></article>`;
  }).join("");
  document.querySelectorAll("[data-book]").forEach(btn=>btn.addEventListener("click",()=>bookSlot(btn.dataset.book)));
}
async function bookSlot(slotId) {
  if(!state.user||!state.profile)return;
  const slot=state.slots.find(s=>s.id===slotId);if(!slot)return;
  const reason=prompt("What would you like help with? Please give a brief, valid reason for this appointment.");
  if(reason===null)return;if(reason.trim().length<5){toast("Please enter a short reason (at least 5 characters).","error");return;}
  try {
    await runTransaction(db,async tx=>{
      const slotRef=doc(db,"slots",slotId), reservationRef=doc(db,"reservations",state.user.uid);
      const [sSnap,rSnap]=await Promise.all([tx.get(slotRef),tx.get(reservationRef)]);
      if(!sSnap.exists())throw new Error("This session no longer exists.");
      if(rSnap.exists())throw new Error("You already have a reservation. Cancel it before booking another.");
      const s=sSnap.data(), now=Date.now(), deadline=safeDate(s.bookingDeadline);
      if(s.active===false||safeDate(s.startAt)?.getTime()<=now)throw new Error("This session is no longer available.");
      if(deadline&&now>=deadline.getTime())throw new Error("The booking deadline has passed.");
      if(state.profile.program!=="staff"&&state.profile.program!==s.program)throw new Error("This session is for a different student schedule.");
      const uids=Array.isArray(s.bookedUids)?s.bookedUids:[];
      if(uids.includes(state.user.uid))throw new Error("You already have a seat in this session.");
      if(uids.length>=20)throw new Error("This session is full.");
      tx.update(slotRef,{bookedUids:[...uids,state.user.uid],updatedAt:serverTimestamp()});
      tx.set(reservationRef,{uid:state.user.uid,studentEmail:cleanEmail(state.user.email),studentName:state.profile.displayName||state.user.displayName||"",slotId,slotTitle:s.title||"Teacher appointment",teacherUid:s.teacherUid,teacherName:s.teacherName||"",program:s.program,startAt:s.startAt,bookingDeadline:s.bookingDeadline,cancellationDeadline:s.cancellationDeadline,reason:reason.trim(),createdAt:serverTimestamp()});
    });
    toast("Your appointment is booked.","success");await loadSlots();await refreshOverview();
  } catch(err){toast(friendlyError(err),"error");await loadSlots();}
}
async function cancelBooking() {
  const b=state.booking;if(!b)return;
  const slot=state.slots.find(s=>s.id===b.slotId);
  const deadline=safeDate(b.cancellationDeadline);
  if(deadline&&Date.now()>deadline.getTime()){toast("The cancellation deadline has passed. Contact the administrator for help.","error");return;}
  const reason=prompt("Please enter a valid reason for cancelling this appointment (at least 10 characters).");
  if(reason===null)return;if(reason.trim().length<10){toast("Please enter a valid reason of at least 10 characters.","error");return;}
  try {
    await runTransaction(db,async tx=>{
      const rRef=doc(db,"reservations",state.user.uid), rSnap=await tx.get(rRef);
      if(!rSnap.exists())throw new Error("No active reservation was found.");
      const reservation=rSnap.data(), sRef=doc(db,"slots",reservation.slotId), sSnap=await tx.get(sRef);
      const d=safeDate(reservation.cancellationDeadline);if(d&&Date.now()>d.getTime())throw new Error("The cancellation deadline has passed.");
      if(sSnap.exists()){const s=sSnap.data();tx.update(sRef,{bookedUids:(s.bookedUids||[]).filter(uid=>uid!==state.user.uid),updatedAt:serverTimestamp()});}
      tx.delete(rRef);
      tx.set(doc(collection(db,"cancellations")), {uid:state.user.uid,slotId:reservation.slotId,reason:reason.trim(),createdAt:serverTimestamp()});
    });
    toast("Your booking was cancelled.","success");await loadSlots();await refreshOverview();
  } catch(err){toast(friendlyError(err),"error");}
}
async function submitTeacherRequest(e) {
  e.preventDefault();const reason=$("teacherRequestReason").value.trim();if(reason.length<10)return toast("Please explain what support you need in a little more detail.","error");
  try{await addDoc(collection(db,"teacherRequests"),{studentUid:state.user.uid,studentEmail:cleanEmail(state.user.email),studentName:state.profile.displayName||"",program:state.profile.program,reason,status:"open",createdAt:serverTimestamp()});$("teacherRequestReason").value="";toast("Your request has been sent to the support team.");}
  catch(err){toast(friendlyError(err),"error");}
}
async function loadFeedback() {
  try{
    let q;
    if(isRole("teacher","admin")) q=query(collection(db,"feedback"),where("teacherUid","==",state.user.uid),limit(100));
    else q=query(collection(db,"feedback"),where("studentUid","==",state.user.uid),limit(100));
    const snap=await getDocs(q);state.feedback=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(safeDate(b.createdAt)||0)-(safeDate(a.createdAt)||0));
    if(isRole("teacher","admin")) {
      $("feedbackList").innerHTML=state.feedback.length?state.feedback.map(f=>feedbackHtml(f,true)).join(""):'<div class="empty-state">You have not shared feedback yet.</div>';
      $("progressSummary").innerHTML='<div class="progress-card"><small>Feedback shared</small><strong>'+state.feedback.length+'</strong><small>Student learning records</small></div>';
    } else {
      const grouped={};state.feedback.forEach(f=>{const k=f.course||"Course";(grouped[k] ||= []).push(Number(f.score));});
      const entries=Object.entries(grouped);
      $("progressSummary").innerHTML=entries.length?entries.map(([course,scores])=>{const avg=Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);return `<div class="progress-card"><small>${escapeHtml(course)}</small><strong>${avg}%</strong><div class="progress-track"><span style="width:${Math.max(0,Math.min(100,avg))}%"></span></div><small>Average of ${scores.length} shared score${scores.length===1?"":"s"}</small></div>`;}).join(""):'<div class="empty-state">No academic feedback has been shared with you yet.</div>';
      $("feedbackList").innerHTML=state.feedback.length?state.feedback.map(f=>feedbackHtml(f,false)).join(""):'<div class="empty-state">No feedback has been shared yet.</div>';
    }
  }catch(err){$("feedbackList").innerHTML=`<div class="empty-state">${escapeHtml(friendlyError(err))}</div>`;}
}
function feedbackHtml(f,teacherView) {
  return `<article class="feedback-item"><div class="feedback-item-top"><div><h4>${escapeHtml(f.course||"Academic feedback")} · ${Number(f.score)||0}%</h4><small>${escapeHtml(teacherView?(f.studentEmail||"Student"):(f.teacherName||"Teacher"))} · ${escapeHtml(fmtDate(f.createdAt))}</small></div><span class="support-tag">${escapeHtml(SUPPORT[f.supportArea]||f.supportArea||"Feedback")}</span></div><p>${escapeHtml(f.feedback||"")}</p></article>`;
}
async function submitGrade(e) {
  e.preventDefault();if(!isRole("teacher","admin"))return;
  const email=cleanEmail($("gradeStudentEmail").value);
  try{
    const approved=await getDoc(approvedPath(email));if(!approved.exists()||approved.data().role!=="student"||approved.data().enabled===false)throw new Error("This email is not an active approved student.");
    const users=await getDocs(query(collection(db,"users"),where("email","==",email),where("role","==","student"),limit(1)));
    if(users.empty)throw new Error("The student must create an account before feedback can be added.");
    const student=users.docs[0].data();
    await addDoc(collection(db,"feedback"),{studentUid:student.uid,studentEmail:email,studentName:student.displayName||"",teacherUid:state.user.uid,teacherName:state.profile.displayName||"",course:$("gradeCourse").value.trim(),score:Number($("gradeScore").value),supportArea:$("gradeSupport").value,feedback:$("gradeFeedback").value.trim(),createdAt:serverTimestamp()});
    $("gradeForm").reset();toast("Feedback saved.");await loadFeedback();
  }catch(err){toast(friendlyError(err),"error");}
}
async function loadChats() {
  try {
    const snap=await getDocs(query(collection(db,"chats"),where("memberUids","array-contains",state.user.uid),limit(100)));
    state.chats=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(safeDate(b.updatedAt)||0)-(safeDate(a.updatedAt)||0));
    renderChats();
  }catch(err){$("chatList").innerHTML=`<div class="empty-state">${escapeHtml(friendlyError(err))}</div>`;}
}
function renderChats() {
  $("chatList").innerHTML=state.chats.length?state.chats.map(c=>`<button class="chat-list-item ${state.activeChat?.id===c.id?"active":""}" data-chat="${escapeHtml(c.id)}"><b>${escapeHtml(c.title||"Conversation")}</b><small>${escapeHtml(c.type||"group")} · ${Number(c.memberUids?.length||0)} members</small></button>`).join(""):'<div class="empty-state">No conversations yet. Start one with approved community members.</div>';
  document.querySelectorAll("[data-chat]").forEach(b=>b.onclick=()=>openChat(b.dataset.chat));
}
async function submitChatCreate(e) {
  e.preventDefault();const type=$("chatType").value,title=$("chatTitle").value.trim(),emails=[...new Set($("chatMembers").value.split(",").map(cleanEmail).filter(Boolean))];
  if(type==="faculty"&&!isRole("teacher","admin"))return toast("Only teachers can create Faculty Circle conversations.","error");
  if(!emails.includes(cleanEmail(state.user.email)))emails.push(cleanEmail(state.user.email));
  try {
    const members=[];
    for(const email of emails){
      const a=await getDoc(approvedPath(email));if(!a.exists()||a.data().enabled===false)throw new Error(`${email} is not an approved active email.`);
      if(type==="faculty"&&!["teacher","admin"].includes(a.data().role))throw new Error("Faculty Circle conversations can include teachers and administrators only.");
      const u=await getDocs(query(collection(db,"users"),where("email","==",email),limit(1)));
      if(u.empty)throw new Error(`${email} must create an account before being added.`);
      members.push({uid:u.docs[0].id,email,displayName:u.docs[0].data().displayName||email});
    }
    if(type==="private"&&members.length!==2)throw new Error("A private chat must have exactly two members, including you.");
    if(type==="group"&&members.length<2)throw new Error("Add at least one other member to a group discussion.");
    const ref=await addDoc(collection(db,"chats"),{title,type,memberUids:members.map(m=>m.uid),memberEmails:members.map(m=>m.email),memberNames:members.map(m=>m.displayName),createdBy:state.user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    $("chatCreateForm").reset();toast("Conversation created.");await loadChats();await openChat(ref.id);
  }catch(err){toast(friendlyError(err),"error");}
}
async function openChat(chatId) {
  const chat=state.chats.find(c=>c.id===chatId);if(!chat)return;
  if(!chat.memberUids?.includes(state.user.uid))return toast("You are not a member of this conversation.","error");
  state.activeChat=chat;renderChats();$("chatPlaceholder").classList.add("hidden");$("activeChat").classList.remove("hidden");
  $("activeChatTitle").textContent=chat.title||"Conversation";$("activeChatType").textContent=chat.type||"Group";
  if(state.messagesUnsub)state.messagesUnsub();
  $("chatMessages").innerHTML='<div class="empty-state">Loading messages…</div>';
  state.messagesUnsub=onSnapshot(query(collection(db,"chats",chatId,"messages"),orderBy("createdAt","asc"),limit(150)),snap=>{
    $("chatMessages").innerHTML=snap.empty?'<div class="empty-state">This is the start of your conversation.</div>':snap.docs.map(d=>{const m=d.data(),mine=m.senderUid===state.user.uid;return `<div class="chat-bubble ${mine?"mine":""}"><b>${escapeHtml(m.senderName||m.senderEmail||"Member")}</b><p>${escapeHtml(m.text||"")}</p><small>${escapeHtml(fmtDate(m.createdAt))}</small></div>`;}).join("");
    $("chatMessages").scrollTop=$("chatMessages").scrollHeight;
  },err=>toast(friendlyError(err),"error"));
}
async function sendMessage(e) {
  e.preventDefault();const chat=state.activeChat,textValue=$("messageInput").value.trim();if(!chat||!textValue)return;
  try{
    if(!chat.memberUids.includes(state.user.uid))throw new Error("You are not a member of this conversation.");
    await addDoc(collection(db,"chats",chat.id,"messages"),{senderUid:state.user.uid,senderEmail:cleanEmail(state.user.email),senderName:state.profile.displayName||"",text:textValue,createdAt:serverTimestamp()});
    await updateDoc(doc(db,"chats",chat.id),{updatedAt:serverTimestamp()});$("messageInput").value="";
  }catch(err){toast(friendlyError(err),"error");}
}
async function loadListings() {
  try{const snap=await getDocs(query(collection(db,"listings"),where("status","==","active"),limit(100)));state.listings=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(safeDate(b.createdAt)||0)-(safeDate(a.createdAt)||0));renderListings();}
  catch(err){$("listingGrid").innerHTML=`<div class="empty-state">${escapeHtml(friendlyError(err))}</div>`;}
}
function renderListings() {
  const category=$("listingFilter").value,items=state.listings.filter(l=>category==="all"||l.category===category);
  $("listingGrid").innerHTML=items.length?items.map(l=>`<article class="listing-card"><div><span class="pill">${escapeHtml(l.category||"Community")}</span><h3>${escapeHtml(l.title||"Untitled listing")}</h3></div><p>${escapeHtml(l.details||"")}</p><div class="listing-card-foot"><small>${escapeHtml(l.offerType||"Sharing")} · ${escapeHtml(l.ownerName||"AUW member")}</small><span class="listing-price">${l.price!==null&&l.price!==undefined&&l.price!==""?`৳${Number(l.price).toLocaleString("en-BD")}`:"Free"}</span></div><small>Posted ${escapeHtml(fmtDate(l.createdAt,{dateStyle:"medium"}))}</small>${l.ownerUid===state.user.uid?`<button class="button button-secondary" data-remove-listing="${escapeHtml(l.id)}">Remove listing</button>`:`<button class="button button-secondary" data-contact-listing="${escapeHtml(l.id)}">Message owner</button>`}</article>`).join(""):'<div class="empty-state">No listings in this category yet. Be the first to share something helpful.</div>';
  document.querySelectorAll("[data-remove-listing]").forEach(b=>b.onclick=()=>removeListing(b.dataset.removeListing));
  document.querySelectorAll("[data-contact-listing]").forEach(b=>b.onclick=()=>contactListing(b.dataset.contactListing));
}
async function submitListing(e) {
  e.preventDefault();
  try{await addDoc(collection(db,"listings"),{title:$("listingTitle").value.trim(),category:$("listingCategory").value,offerType:$("listingType").value,price:$("listingPrice").value===""?null:Number($("listingPrice").value),details:$("listingDetails").value.trim(),ownerUid:state.user.uid,ownerEmail:cleanEmail(state.user.email),ownerName:state.profile.displayName||"",status:"active",createdAt:serverTimestamp()});$("listingForm").reset();$("listingFormCard").classList.add("hidden");toast("Your listing is live.");await loadListings();await refreshOverview();}
  catch(err){toast(friendlyError(err),"error");}
}
async function removeListing(id) {if(!confirm("Remove this listing from the community?"))return;try{const l=state.listings.find(x=>x.id===id);if(!l||l.ownerUid!==state.user.uid)throw new Error("You can only remove your own listing.");await updateDoc(doc(db,"listings",id),{status:"removed"});toast("Listing removed.");await loadListings();}catch(err){toast(friendlyError(err),"error");}}
async function contactListing(id) {
  const l=state.listings.find(x=>x.id===id);if(!l)return;
  try{
    const snap=await getDocs(query(collection(db,"chats"),where("memberUids","array-contains",state.user.uid),limit(100)));
    const existing=snap.docs.find(d=>d.data().type==="private"&&d.data().memberUids.includes(l.ownerUid));
    let chatId;
    if(existing)chatId=existing.id;
    else {const owner=await getDoc(doc(db,"users",l.ownerUid));if(!owner.exists())throw new Error("The listing owner is not available.");const p=owner.data();const ref=await addDoc(collection(db,"chats"),{title:`Listing: ${l.title}`,type:"private",memberUids:[state.user.uid,l.ownerUid],memberEmails:[cleanEmail(state.user.email),l.ownerEmail],memberNames:[state.profile.displayName||"",p.displayName||""],createdBy:state.user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});chatId=ref.id;}
    showView("messages");await loadChats();await openChat(chatId);$("messageInput").focus();
  }catch(err){toast(friendlyError(err),"error");}
}
async function loadFacultyFeed() {
  if(!isRole("teacher","admin"))return;
  try{const snap=await getDocs(query(collection(db,"facultyPosts"),orderBy("createdAt","desc"),limit(100)));$("facultyFeed").innerHTML=snap.empty?'<div class="empty-state">No shared ideas yet. Start the conversation.</div>':snap.docs.map(d=>{const p=d.data();return `<article class="faculty-post"><h4>${escapeHtml(p.topic||"Teaching idea")}</h4><p>${escapeHtml(p.body||"")}</p><small>${escapeHtml(p.authorName||"Teacher")} · ${escapeHtml(fmtDate(p.createdAt))}</small></article>`;}).join("");}
  catch(err){$("facultyFeed").innerHTML=`<div class="empty-state">${escapeHtml(friendlyError(err))}</div>`;}
}
async function submitFacultyPost(e) {
  e.preventDefault();if(!isRole("teacher","admin"))return toast("Faculty Circle is for teachers only.","error");
  try{await addDoc(collection(db,"facultyPosts"),{topic:$("facultyTopic").value.trim(),body:$("facultyBody").value.trim(),authorUid:state.user.uid,authorName:state.profile.displayName||"",createdAt:serverTimestamp()});$("facultyPostForm").reset();toast("Your idea has been shared.");await loadFacultyFeed();}
  catch(err){toast(friendlyError(err),"error");}
}
async function loadApproved() {
  try{const snap=await getDocs(query(collection(db,"approvedEmails"),limit(200)));state.approved=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.id.localeCompare(b.id));$("approvedList").innerHTML=state.approved.length?state.approved.map(a=>`<div class="approved-user"><div><b>${escapeHtml(a.id)}</b><small>${escapeHtml(roleLabel(a.role))} · ${escapeHtml(PROGRAMS[a.program]||a.program||"Staff")} · ${a.enabled===false?"Disabled":"Active"}</small></div><button class="tiny-button" data-toggle-approved="${escapeHtml(a.id)}" data-enabled="${a.enabled!==false}">${a.enabled===false?"Enable":"Disable"}</button></div>`).join(""):'<div class="empty-state">No approved accounts found.</div>';
    document.querySelectorAll("[data-toggle-approved]").forEach(b=>b.onclick=()=>toggleApproved(b.dataset.toggleApproved,b.dataset.enabled==="true"));
  }catch(err){$("approvedList").innerHTML=`<div class="empty-state">${escapeHtml(friendlyError(err))}</div>`;}
}
async function submitAllowlist(e) {
  e.preventDefault();if(!isRole("admin"))return;
  const email=cleanEmail($("approvedEmail").value),role=$("approvedRole").value,program=$("approvedProgram").value;
  if(role==="admin")return toast("For security, admin accounts must be seeded directly in Firebase Console.","error");
  try{await setDoc(approvedPath(email),{role,program,enabled:true,updatedAt:serverTimestamp(),updatedBy:state.user.uid});$("allowlistForm").reset();toast("Email approved. The person can now register.");await loadApproved();}
  catch(err){toast(friendlyError(err),"error");}
}
async function toggleApproved(email,currentlyEnabled) {
  if(!isRole("admin"))return;
  if(email===cleanEmail(state.user.email))return toast("You cannot disable your own administrator access here.","error");
  try{await updateDoc(approvedPath(email),{enabled:!currentlyEnabled,updatedAt:serverTimestamp(),updatedBy:state.user.uid});toast(currentlyEnabled?"Account approval disabled.":"Account approval enabled.");await loadApproved();}
  catch(err){toast(friendlyError(err),"error");}
}
async function submitSlot(e) {
  e.preventDefault();if(!isRole("admin"))return;
  const email=cleanEmail($("slotTeacherEmail").value),teacherSnap=await getDocs(query(collection(db,"users"),where("email","==",email),where("role","==","teacher"),limit(1)));
  if(teacherSnap.empty)return toast("This email does not belong to an active teacher account.","error");
  const teacher=teacherSnap.docs[0].data(),start=new Date($("slotStart").value),bookingDeadline=new Date($("slotDeadline").value),cancelDeadline=new Date($("slotCancelDeadline").value);
  if(![start,bookingDeadline,cancelDeadline].every(d=>!Number.isNaN(d.getTime())))return toast("Enter valid dates and times.","error");
  if(start<=new Date()||bookingDeadline>=start||cancelDeadline>=start)return toast("The session must be in the future; booking and cancellation deadlines must be before it starts.","error");
  const program=$("slotProgram").value;
  try{await addDoc(collection(db,"slots"),{title:$("slotTitle").value.trim(),teacherUid:teacher.uid,teacherEmail:email,teacherName:teacher.displayName||email,program,startAt:Timestamp.fromDate(start),duration:Number($("slotDuration").value),bookingDeadline:Timestamp.fromDate(bookingDeadline),cancellationDeadline:Timestamp.fromDate(cancelDeadline),capacity:20,bookedUids:[],active:true,createdBy:state.user.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});$("slotForm").reset();toast("20-seat session published.");await loadAdminSlots();await loadSlots();}
  catch(err){toast(friendlyError(err),"error");}
}
async function loadAdminSlots() {
  if(!isRole("admin"))return;
  try{const snap=await getDocs(query(collection(db,"slots"),limit(200)));const slots=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(safeDate(a.startAt)||0)-(safeDate(b.startAt)||0));
    $("adminSlotsList").innerHTML=slots.length?`<table><thead><tr><th>SESSION</th><th>TEACHER</th><th>SCHEDULE</th><th>TIME</th><th>SEATS</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>${slots.map(s=>`<tr><td>${escapeHtml(s.title||"Appointment")}</td><td>${escapeHtml(s.teacherName||"Teacher")}</td><td>${escapeHtml(PROGRAMS[s.program]||s.program)}</td><td>${escapeHtml(fmtDate(s.startAt))}</td><td>${(s.bookedUids||[]).length}/20</td><td>${s.active===false?"Closed":"Active"}</td><td><button class="tiny-button" data-close-slot="${escapeHtml(s.id)}" data-active="${s.active!==false}">${s.active===false?"Reopen":"Close"}</button></td></tr>`).join("")}</tbody></table>`:'<div class="empty-state">No sessions have been created.</div>';
    document.querySelectorAll("[data-close-slot]").forEach(b=>b.onclick=()=>toggleSlot(b.dataset.closeSlot,b.dataset.active==="true"));
  }catch(err){$("adminSlotsList").innerHTML=`<div class="empty-state">${escapeHtml(friendlyError(err))}</div>`;}
}
async function toggleSlot(id,active) {try{await updateDoc(doc(db,"slots",id),{active:!active,updatedAt:serverTimestamp()});toast(active?"Session closed.":"Session reopened.");await loadAdminSlots();await loadSlots();}catch(err){toast(friendlyError(err),"error");}}

function bindUI() {
  $("loginTab").onclick=()=>showAuth("login");$("registerTab").onclick=()=>showAuth("register");$("authForm").addEventListener("submit",handleAuthSubmit);
  $("togglePassword").onclick=()=>{const p=$("password");p.type=p.type==="password"?"text":"password";$("togglePassword").textContent=p.type==="password"?"Show":"Hide";};
  $("signOutBtn").onclick=async()=>{clearListeners();await signOut(auth);resetApp();showAuth("login");};
  document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>showView(b.dataset.view));
  document.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>showView(b.dataset.jump));
  $("programFilter").onchange=renderSlots;$("teacherFilter").onchange=renderSlots;$("refreshSlots").onclick=loadSlots;
  $("teacherRequestForm").addEventListener("submit",submitTeacherRequest);$("gradeForm").addEventListener("submit",submitGrade);
  $("chatCreateForm").addEventListener("submit",submitChatCreate);$("sendMessageForm").addEventListener("submit",sendMessage);
  $("newListingToggle").onclick=()=>$("listingFormCard").classList.toggle("hidden");$("listingForm").addEventListener("submit",submitListing);$("listingFilter").onchange=renderListings;$("refreshListings").onclick=loadListings;
  $("facultyPostForm").addEventListener("submit",submitFacultyPost);$("allowlistForm").addEventListener("submit",submitAllowlist);$("slotForm").addEventListener("submit",submitSlot);
  $("refreshAdmin").onclick=()=>{loadAdminSlots();loadApproved();};
  const now=new Date();$("slotStart").min=localInputDate(now);$("slotDeadline").min=localInputDate(now);$("slotCancelDeadline").min=localInputDate(now);
}
bindUI();
if(!appReady) {
  setMessage("authMessage","Setup required: create a Firebase project, then add your web config to firebase-config.js. See README.md.","error");
  $("authSubmit").disabled=true;
  $("authHint").textContent="The website UI is ready. Firebase setup is required before accounts and shared data can work.";
} else {
  app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
  onAuthStateChanged(auth,user=>{if(user)enterApp(user);else resetApp();});
}
