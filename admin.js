const adminApp = document.getElementById('adminApp');
const databaseKey = 'northstar_university_data';
const defaultData = { courses: [], students: [] };
 
// NOTE: هذه الصفحة تعتمد على تخزين محلي (localStorage) كقاعدة بيانات وهمية.
// المصادقة هنا (admin/admin123) وكلمات مرور الطلاب مخزنة نصًا صريحًا لأغراض العرض فقط،
// وفي بيئة إنتاج حقيقية يجب أن تنتقل كل عمليات التحقق والتشفير إلى الـ backend.
 
const adminState = {
    loggedIn: false,
    page: 'courses',
    selectedYear: 'First Year',
 
    // 'list' | 'course-form' | 'lectures-list' | 'lecture-form'
    view: 'list',
 
    editingCourse: null,   // كورس حقيقي = تعديل، null = إضافة جديد
    activeCourse: null,    // الكورس اللي بنتصفح محاضراته حاليًا
    editingLecture: null,  // محاضرة حقيقية = تعديل، null = إضافة جديدة
 
    data: loadAdminData()
};
 
function loadAdminData() {
    try {
        const raw = localStorage.getItem(databaseKey);
        if (!raw) return structuredClone(defaultData);
        const parsed = JSON.parse(raw);
        return {
            courses: Array.isArray(parsed.courses) ? parsed.courses : [],
            students: Array.isArray(parsed.students) ? parsed.students : []
        };
    } catch (err) {
        console.error('Failed to read stored data, starting fresh.', err);
        return structuredClone(defaultData);
    }
}
 
function saveAdminData() {
    try {
        localStorage.setItem(databaseKey, JSON.stringify(adminState.data));
        return true;
    } catch (err) {
        console.error('Failed to save data', err);
        if (err && err.name === 'QuotaExceededError') {
            adminToast('Storage is full — try a smaller file or remove old videos.');
        } else {
            adminToast('Could not save changes.');
        }
        return false;
    }
}
 
function makeId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
 
function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}
 
// ---------- Toast ----------
let toastTimer = null;
function adminToast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}
 
// ---------- Login ----------
function showAdminLogin() {
    adminApp.innerHTML = `
    <main class="admin-login-page">
      <div class="admin-login-card">
        <button class="back-button" data-action="back-to-home">← Back to Home</button>
        <div class="brand">
          <span class="brand-mark">N</span> NORTHSTAR UNIVERSITY
        </div>
        <h2>Admin Login</h2>
        <p>Enter administrator credentials to manage the platform.</p>
        <div class="field">
          <label>Username</label>
          <input id="adminUsername" type="text" placeholder="Enter username" autocomplete="username">
        </div>
        <div class="field">
          <label>Password</label>
          <input id="adminPassword" type="password" placeholder="Enter password" autocomplete="current-password">
        </div>
        <div class="login-error" id="adminLoginError"></div>
        <button class="primary" id="adminLoginBtn">Sign In</button>
      </div>
    </main>
  `;
 
    document.getElementById('adminLoginBtn').addEventListener('click', handleAdminLogin);
    document.getElementById('adminPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminLogin();
    });
}
 
function handleAdminLogin() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('adminLoginError');
 
    if (username === 'admin' && password === 'admin123') {
        adminState.loggedIn = true;
        localStorage.setItem('northstar_admin_session', 'true');
        renderAdminPanel();
    } else {
        errorEl.textContent = 'Invalid administrator credentials.';
    }
}
 
function adminLogout() {
    adminState.loggedIn = false;
    localStorage.removeItem('northstar_admin_session');
    showAdminLogin();
}
 
// ---------- Shell ----------
function renderAdminPanel() {
    adminApp.innerHTML = `
    <div class="admin-shell">
      ${adminSidebar()}
      <main class="admin-main">
        <button class="mobile-menu-button" data-action="toggle-sidebar">☰ Menu</button>
        <div id="adminContent"></div>
      </main>
    </div>
  `;
    renderAdminContent();
}
 
function adminSidebar() {
    return `
    <aside class="admin-sidebar">
      <div class="mobile-sidebar-head">
        <span>Menu</span>
        <button data-action="close-sidebar">&times;</button>
      </div>
      <div class="brand">
        <span class="brand-mark">N</span> NORTHSTAR
      </div>
      <nav>
        <button class="admin-nav-link ${adminState.page === 'courses' ? 'active' : ''}" data-action="navigate-courses">
          Courses Management
        </button>
        <button class="admin-nav-link ${adminState.page === 'students' ? 'active' : ''}" data-action="navigate-students">
          Student Accounts
        </button>
      </nav>
      <div class="admin-sidebar-bottom">
        <div class="admin-profile">
          <div class="avatar">SA</div>
          <div>
            <b>System Admin</b>
            <span>Administrator</span>
          </div>
        </div>
        <button class="admin-signout" data-action="logout">Sign Out</button>
      </div>
    </aside>
  `;
}
 
function toggleAdminSidebar() {
    document.querySelector('.admin-sidebar')?.classList.toggle('open');
}
 
function closeAdminSidebar() {
    document.querySelector('.admin-sidebar')?.classList.remove('open');
}
 
function adminNavigate(page) {
    adminState.page = page;
    resetCourseNavigation();
    renderAdminPanel();
}
 
function resetCourseNavigation() {
    adminState.view = 'list';
    adminState.editingCourse = null;
    adminState.activeCourse = null;
    adminState.editingLecture = null;
}
 
function renderAdminContent() {
    const content = document.getElementById('adminContent');
    if (!content) return;
 
    if (adminState.page === 'courses') {
        content.innerHTML = adminCoursesPage();
    } else if (adminState.page === 'students') {
        content.innerHTML = adminStudentsPage();
    }
}
 
// ---------- Courses page (router) ----------
function adminCoursesPage() {
    switch (adminState.view) {
        case 'course-form':
            return adminCourseForm();
        case 'lectures-list':
            return adminCourseLecturesPage(adminState.activeCourse);
        case 'lecture-form':
            return adminLectureForm();
        default:
            return adminCoursesListPage();
    }
}
 
function adminCoursesListPage() {
    const years = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
    const filteredCourses = adminState.data.courses.filter(
        c => c.year === adminState.selectedYear
    );
 
    return `
    <header class="admin-topbar">
      <div>
        <h1>Courses Management</h1>
        <p>Create and manage courses for all academic years</p>
      </div>
    </header>
 
    <section class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <h3>Select Year</h3>
          <p>Manage courses for a specific academic year</p>
        </div>
        <div class="year-selector">
          ${years.map(year => `
            <button
                class="${adminState.selectedYear === year ? 'active' : ''}"
                data-action="select-year"
                data-year="${esc(year)}">
                ${esc(year)}
            </button>
          `).join('')}
        </div>
      </div>
 
      <div style="display:flex;justify-content:flex-end;margin:20px 0;">
        <button class="secondary" data-action="add-course">+ Add New Course</button>
      </div>
 
      ${filteredCourses.length === 0 ? `
        <div class="empty-state-admin">
            <div class="empty-icon">📚</div>
            <h3>No Courses Yet</h3>
            <p>No courses available for ${esc(adminState.selectedYear)}.</p>
        </div>
      ` : `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Course Title</th>
                    <th>Lectures</th>
                    <th>Cover</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
            ${filteredCourses.map(course => `
                <tr>
                    <td><strong>${esc(course.title)}</strong></td>
                    <td>${course.lectures ? course.lectures.length : 0}</td>
                    <td>${course.cover ? '✓ Yes' : '✗ No'}</td>
                    <td>
                        <div class="admin-actions">
                            <button class="btn-edit" data-action="manage-lectures" data-course-id="${esc(course.id)}">
                                Manage Lectures
                            </button>
                            <button class="btn-edit" data-action="edit-course" data-course-id="${esc(course.id)}">
                                Edit
                            </button>
                            <button class="btn-delete" data-action="delete-course" data-course-id="${esc(course.id)}">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('')}
            </tbody>
        </table>
      `}
    </section>
  `;
}
 
function adminCourseLecturesPage(course) {
    if (!course) return adminCoursesListPage();
    const lectures = course.lectures || [];
 
    return `
    <header class="admin-topbar">
      <div>
        <button class="back-button" data-action="back-to-courses">← Back to Courses</button>
        <h1>${esc(course.title)}</h1>
        <p>Manage lectures for this course</p>
      </div>
    </header>
    <section class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <h3>Lectures</h3>
          <p>${lectures.length} lecture${lectures.length === 1 ? '' : 's'}</p>
        </div>
        <button class="secondary" data-action="add-lecture" data-course-id="${esc(course.id)}">+ Add Lecture</button>
      </div>
      ${lectures.length === 0 ? `
        <div class="empty-state-admin">
          <div class="empty-icon">📹</div>
          <h3>No Lectures</h3>
          <p>This course has no lectures yet. Click "Add Lecture" to create one.</p>
        </div>
      ` : `
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Lecture Title</th>
              <th>Video</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${lectures.map((lecture, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${esc(lecture.title)}</strong></td>
                <td>${lecture.videoData ? '✓ Yes' : '✗ No'}</td>
                <td><span class="badge ${index === 0 ? 'free' : 'premium'}">${index === 0 ? 'FREE' : 'PREMIUM'}</span></td>
                <td>
                  <div class="admin-actions">
                    <button class="btn-edit" data-action="edit-lecture" data-course-id="${esc(course.id)}" data-lecture-id="${esc(lecture.id)}">Edit</button>
                    <button class="btn-delete" data-action="delete-lecture" data-course-id="${esc(course.id)}" data-lecture-id="${esc(lecture.id)}">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </section>
  `;
}
 
function adminCourseForm() {
    const course = adminState.editingCourse;
    const isEditing = course !== null;
 
    return `
    <header class="admin-topbar">
      <div>
        <h1>${isEditing ? 'Edit Course' : 'Add New Course'}</h1>
        <p>${isEditing ? 'Update course details' : 'Create a new course for'} ${esc(adminState.selectedYear)}</p>
      </div>
    </header>
    <section class="admin-panel admin-form-section">
      <div class="field">
        <label>Course Title *</label>
        <input id="courseTitle" type="text" value="${isEditing ? esc(course.title) : ''}" placeholder="Enter course title">
      </div>
      <div class="field">
        <label>Description</label>
        <textarea id="courseDescription" placeholder="Enter course description">${isEditing ? esc(course.description || '') : ''}</textarea>
      </div>
      <div class="field">
        <label>Cover Image</label>
        <input id="courseCover" type="file" accept="image/*">
        ${isEditing && course.cover ? `
          <div style="margin-top: 8px;">
            <img src="${course.cover}" style="max-width: 100px; max-height: 100px; border-radius: 4px; border: 1px solid var(--line);">
            <button data-action="remove-cover" class="btn-delete" style="margin-left: 10px; padding: 2px 8px;">Remove</button>
          </div>
        ` : ''}
      </div>
      <div class="form-actions">
        <button class="outline" data-action="cancel-course-form">Cancel</button>
        <button class="primary" data-action="save-course">${isEditing ? 'Update Course' : 'Create Course'}</button>
      </div>
    </section>
  `;
}
 
function adminLectureForm() {
    const course = adminState.activeCourse;
    const lecture = adminState.editingLecture;
    if (!course) return adminCoursesListPage();
    const isEditing = lecture !== null;
 
    return `
    <header class="admin-topbar">
      <div>
        <button class="back-button" data-action="back-to-lectures" data-course-id="${esc(course.id)}">← Back to Lectures</button>
        <h1>${isEditing ? 'Edit Lecture' : 'Add New Lecture'}</h1>
        <p>${isEditing ? 'Update lecture details' : 'Add a new lecture to'} ${esc(course.title)}</p>
      </div>
    </header>
    <section class="admin-panel admin-form-section">
      <div class="field">
        <label>Lecture Title *</label>
        <input id="lectureTitle" type="text" value="${isEditing ? esc(lecture.title) : ''}" placeholder="Enter lecture title">
      </div>
      <div class="field">
        <label>Video File</label>
        <input id="lectureVideo" type="file" accept="video/*">
        ${isEditing && lecture.videoData ? `
          <div style="margin-top: 8px; font-size: 12px; color: var(--muted);">
            Current video: ✓ Uploaded
            <button data-action="remove-video" class="btn-delete" style="margin-left: 10px; padding: 2px 8px;">Remove</button>
          </div>
        ` : ''}
      </div>
      <div class="form-actions">
        <button class="outline" data-action="cancel-lecture-form">Cancel</button>
        <button class="primary" data-action="save-lecture">${isEditing ? 'Update Lecture' : 'Add Lecture'}</button>
      </div>
    </section>
  `;
}
 
function adminStudentsPage() {
    const students = adminState.data.students;
 
    return `
    <header class="admin-topbar">
      <div>
        <h1>Student Accounts</h1>
        <p>Manage student access credentials</p>
      </div>
    </header>
    <section class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <h3>All Students</h3>
          <p>${students.length} student account(s)</p>
        </div>
        <button class="secondary add-student-btn" data-action="add-student">+ Add Student</button>
      </div>
      ${students.length === 0 ? `
        <div class="empty-state-admin">
          <div class="empty-icon">☷</div>
          <h3>No Student Accounts</h3>
          <p>Create student accounts to allow them to access premium content.</p>
        </div>
      ` : `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email/Username</th>
              <th>Year</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${students.map(student => `
              <tr>
                <td><strong>${esc(student.name)}</strong></td>
                <td>${esc(student.email || student.username)}</td>
                <td><span class="badge free">${esc(student.year || 'N/A')}</span></td>
                <td>
                  <div class="admin-actions">
                    <button class="btn-delete" data-action="delete-student" data-student-id="${esc(student.id)}">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </section>
  `;
}
 
// ---------- Navigation actions ----------
function selectAdminYear(year) {
    adminState.selectedYear = year;
    resetCourseNavigation();
    renderAdminPanel();
}
 
function showAddCourseForm() {
    adminState.editingCourse = null;
    adminState.view = 'course-form';
    renderAdminPanel();
}
 
function editCourse(courseId) {
    const course = adminState.data.courses.find(c => c.id === courseId);
    if (!course) return;
    adminState.editingCourse = course;
    adminState.view = 'course-form';
    renderAdminPanel();
}
 
function manageCourseLectures(courseId) {
    const course = adminState.data.courses.find(c => c.id === courseId);
    if (!course) return;
    adminState.activeCourse = course;
    adminState.editingLecture = null;
    adminState.view = 'lectures-list';
    renderAdminPanel();
}
 
function backToCoursesList() {
    resetCourseNavigation();
    renderAdminPanel();
}
 
function showAddLectureForm(courseId) {
    const course = adminState.data.courses.find(c => c.id === courseId);
    if (!course) return;
    adminState.activeCourse = course;
    adminState.editingLecture = null;
    adminState.view = 'lecture-form';
    renderAdminPanel();
}
 
function editLecture(courseId, lectureId) {
    const course = adminState.data.courses.find(c => c.id === courseId);
    if (!course) return;
    const lecture = (course.lectures || []).find(l => l.id === lectureId);
    if (!lecture) return;
    adminState.activeCourse = course;
    adminState.editingLecture = lecture;
    adminState.view = 'lecture-form';
    renderAdminPanel();
}
 
function cancelCourseForm() {
    adminState.editingCourse = null;
    adminState.view = 'list';
    renderAdminPanel();
}
 
function cancelLectureForm() {
    adminState.editingLecture = null;
    adminState.view = 'lectures-list';
    renderAdminPanel();
}
 
// ---------- File helpers ----------
const MAX_COVER_BYTES = 2 * 1024 * 1024;   // ~2MB
const MAX_VIDEO_BYTES = 4 * 1024 * 1024;   // ~4MB — localStorage has a small total quota
 
function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
 
// ---------- Save / delete: courses ----------
async function saveCourse() {
    const title = document.getElementById('courseTitle').value.trim();
    const description = document.getElementById('courseDescription').value.trim();
    const coverFile = document.getElementById('courseCover').files[0];
 
    if (!title) {
        adminToast('Please enter a course title.');
        return;
    }
 
    if (coverFile && coverFile.size > MAX_COVER_BYTES) {
        adminToast('Cover image is too large (max ~2MB) for local storage.');
        return;
    }
 
    const course = adminState.editingCourse;
    const isEditing = course !== null;
 
    let coverData = isEditing ? course.cover : null;
    if (coverFile) {
        try {
            coverData = await readFileAsDataUrl(coverFile);
        } catch (err) {
            console.error(err);
            adminToast('Could not read the cover image.');
            return;
        }
    }
 
    if (!isEditing) {
        adminState.data.courses.push({
            id: makeId(),
            title,
            description,
            year: adminState.selectedYear,
            cover: coverData,
            lectures: []
        });
        if (!saveAdminData()) return;
        adminToast('Course created successfully!');
    } else {
        const index = adminState.data.courses.findIndex(c => c.id === course.id);
        if (index === -1) return;
        adminState.data.courses[index].title = title;
        adminState.data.courses[index].description = description;
        adminState.data.courses[index].cover = coverData;
        if (!saveAdminData()) return;
        adminToast('Course updated successfully!');
    }
 
    adminState.editingCourse = null;
    adminState.view = 'list';
    renderAdminPanel();
}
 
function removeCover() {
    const course = adminState.editingCourse;
    if (!course) return;
    course.cover = null;
    if (saveAdminData()) adminToast('Cover removed.');
    renderAdminPanel();
}
 
function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? This will also delete all lectures.')) return;
    adminState.data.courses = adminState.data.courses.filter(c => c.id !== courseId);
    if (saveAdminData()) adminToast('Course deleted.');
    renderAdminPanel();
}
 
// ---------- Save / delete: lectures ----------
async function saveLecture() {
    const course = adminState.activeCourse;
    if (!course) return;
 
    const title = document.getElementById('lectureTitle').value.trim();
    const videoFile = document.getElementById('lectureVideo').files[0];
 
    if (!title) {
        adminToast('Please enter a lecture title.');
        return;
    }
 
    if (videoFile && videoFile.size > MAX_VIDEO_BYTES) {
        adminToast('Video is too large for local storage (max ~4MB in this demo).');
        return;
    }
 
    const lecture = adminState.editingLecture;
    const isEditing = lecture !== null;
 
    let videoData = isEditing ? lecture.videoData : null;
    if (videoFile) {
        try {
            videoData = await readFileAsDataUrl(videoFile);
        } catch (err) {
            console.error(err);
            adminToast('Could not read the video file.');
            return;
        }
    }
 
    if (!course.lectures) course.lectures = [];
 
    if (!isEditing) {
        course.lectures.push({ id: makeId(), title, videoData });
        if (!saveAdminData()) return;
        adminToast('Lecture added successfully!');
    } else {
        const index = course.lectures.findIndex(l => l.id === lecture.id);
        if (index === -1) return;
        course.lectures[index].title = title;
        course.lectures[index].videoData = videoData;
        if (!saveAdminData()) return;
        adminToast('Lecture updated successfully!');
    }
 
    adminState.editingLecture = null;
    adminState.view = 'lectures-list';
    renderAdminPanel();
}
 
function removeVideo() {
    const course = adminState.activeCourse;
    const lecture = adminState.editingLecture;
    if (!course || !lecture) return;
    const index = course.lectures.findIndex(l => l.id === lecture.id);
    if (index === -1) return;
    course.lectures[index].videoData = null;
    if (saveAdminData()) adminToast('Video removed.');
    renderAdminPanel();
}
 
function deleteLecture(courseId, lectureId) {
    if (!confirm('Are you sure you want to delete this lecture?')) return;
    const course = adminState.data.courses.find(c => c.id === courseId);
    if (!course) return;
    course.lectures = (course.lectures || []).filter(l => l.id !== lectureId);
    if (saveAdminData()) adminToast('Lecture deleted.');
    renderAdminPanel();
}
 
// ---------- Students ----------
function showAddStudentForm() {
    document.getElementById('studentModal')?.remove();
 
    const modalHtml = `
    <div class="modal-backdrop" id="studentModal">
      <div class="modal">
        <h2>Add Student Account</h2>
        <p>Create credentials for a new student.</p>
        <div class="field">
          <label>Full Name *</label>
          <input id="studentName" type="text" placeholder="Enter full name">
        </div>
        <div class="field">
          <label>Email or Username *</label>
          <input id="studentEmail" type="text" placeholder="Enter email or username">
        </div>
        <div class="field">
          <label>Password *</label>
          <input id="studentPassword" type="password" placeholder="Enter password">
        </div>
        <div class="field">
          <label>Academic Year</label>
          <select id="studentYear">
            <option>First Year</option>
            <option>Second Year</option>
            <option>Third Year</option>
            <option>Fourth Year</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="outline" data-action="close-student-modal">Cancel</button>
          <button class="primary" data-action="save-student">Create Student</button>
        </div>
      </div>
    </div>
  `;
 
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}
 
function closeStudentModal() {
    document.getElementById('studentModal')?.remove();
}
 
function saveStudent() {
    const name = document.getElementById('studentName').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    const password = document.getElementById('studentPassword').value;
    const year = document.getElementById('studentYear').value;
 
    if (!name || !email || !password) {
        adminToast('Please fill in all required fields.');
        return;
    }
 
    const emailTaken = adminState.data.students.some(
        s => (s.email || s.username).toLowerCase() === email.toLowerCase()
    );
    if (emailTaken) {
        adminToast('A student with this email/username already exists.');
        return;
    }
 
    adminState.data.students.push({
        id: makeId(),
        name,
        username: email,
        email,
        password,
        year
    });
 
    if (!saveAdminData()) return;
    closeStudentModal();
    renderAdminPanel();
    adminToast('Student account created.');
}
 
function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student account?')) return;
    adminState.data.students = adminState.data.students.filter(s => s.id !== studentId);
    if (saveAdminData()) adminToast('Student account deleted.');
    renderAdminPanel();
}
 
// ---------- Event delegation ----------
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
 
    if (!target) {
        const openSidebar = document.querySelector('.admin-sidebar.open');
        if (openSidebar && !openSidebar.contains(e.target) && !e.target.closest('.mobile-menu-button')) {
            openSidebar.classList.remove('open');
        }
        return;
    }
 
    const action = target.dataset.action;
 
    switch (action) {
        case 'toggle-sidebar': toggleAdminSidebar(); break;
        case 'close-sidebar': closeAdminSidebar(); break;
        case 'back-to-home': window.location.href = 'index.html'; break;
        case 'navigate-courses': adminNavigate('courses'); break;
        case 'navigate-students': adminNavigate('students'); break;
        case 'logout': adminLogout(); break;
        case 'select-year': selectAdminYear(target.dataset.year); break;
        case 'add-course': showAddCourseForm(); break;
        case 'edit-course': editCourse(target.dataset.courseId); break;
        case 'manage-lectures': manageCourseLectures(target.dataset.courseId); break;
        case 'delete-course': deleteCourse(target.dataset.courseId); break;
        case 'back-to-courses': backToCoursesList(); break;
        case 'add-lecture': showAddLectureForm(target.dataset.courseId); break;
        case 'edit-lecture': editLecture(target.dataset.courseId, target.dataset.lectureId); break;
        case 'delete-lecture': deleteLecture(target.dataset.courseId, target.dataset.lectureId); break;
        case 'back-to-lectures': manageCourseLectures(target.dataset.courseId); break;
        case 'save-course': saveCourse(); break;
        case 'cancel-course-form': cancelCourseForm(); break;
        case 'remove-cover': removeCover(); break;
        case 'save-lecture': saveLecture(); break;
        case 'cancel-lecture-form': cancelLectureForm(); break;
        case 'remove-video': removeVideo(); break;
        case 'add-student': showAddStudentForm(); break;
        case 'save-student': saveStudent(); break;
        case 'close-student-modal': closeStudentModal(); break;
        case 'delete-student': deleteStudent(target.dataset.studentId); break;
    }
});
 
// ---------- Bootstrap ----------
if (localStorage.getItem('northstar_admin_session') === 'true') {
    adminState.loggedIn = true;
    renderAdminPanel();
} else {
    showAdminLogin();
}