const app = document.getElementById('app');
const databaseKey = 'northstar_university_data';
const defaultData = { courses: [], students: [] };

const state = {
    user: null,
    page: 'home',
    selectedYear: null,
    data: JSON.parse(localStorage.getItem(databaseKey) || JSON.stringify(defaultData))
};

function save() {
    localStorage.setItem(databaseKey, JSON.stringify(state.data));
}

function makeId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toast(message) {
    const element = document.getElementById('toast');
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 2500);
}

function yearSelectionPage() {
    state.user = null;
    state.selectedYear = null;
    state.page = 'home';
    const years = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

    app.innerHTML = `
    <main class="year-selection-page">
      <div class="year-selection-header">
        <div class="brand">
          <span class="brand-mark">N</span> NORTHSTAR UNIVERSITY
        </div>
        <h1>Select Your Academic Year</h1>
        <p>Choose your year to access the learning materials and course content available for your academic level.</p>
      </div>
      <div class="year-grid">
        ${years.map((year, index) => `
          <div class="year-card" onclick="selectYear('${year}')">
            <div class="year-card-icon">${index + 1}</div>
            <h3>${year}</h3>
            <p>Access all courses and learning materials for ${year.toLowerCase()} students</p>
          </div>
        `).join('')}
      </div>
      <div class="admin-link">
        <button onclick="window.location.href='admin.html'">Administrator Access</button>
      </div>
    </main>
  `;
}

function selectYear(year) {
    state.selectedYear = year;
    const savedStudent = localStorage.getItem('northstar_student_session');
    if (savedStudent) {
        const parsed = JSON.parse(savedStudent);
        const studentExists = state.data.students.find(s => s.id === parsed.id);
        if (studentExists) {
            state.user = { ...studentExists, role: 'student' };
            renderStudentDashboard();
            return;
        }
    }
    state.user = { role: 'guest', year: year, name: 'Student' };
    renderStudentDashboard();
}

function renderStudentDashboard() {
    state.page = 'dashboard';
    const yearCourses = state.data.courses.filter(course => course.year === state.selectedYear);

    app.innerHTML = `
    <div class="shell">
      ${studentSidebar()}
      <main class="main" id="content"></main>
    </div>
  `;
    const content = document.getElementById('content');
    content.innerHTML = studentDashboardContent(yearCourses);
}

function studentSidebar() {
    return `
    <aside class="sidebar">
      <div class="mobile-sidebar-head">
        <span>Navigation</span>
        <button onclick="toggleMenu()">×</button>
      </div>
      <div class="brand">
        <span class="brand-mark">N</span> NORTHSTAR
      </div>
      <nav>
        <button class="nav-link active" onclick="navigateStudent('dashboard')">My Courses</button>
      </nav>
      <div class="sidebar-bottom">
        <div class="profile-mini">
          <div class="avatar">${state.user.name ? state.user.name.charAt(0).toUpperCase() : 'S'}</div>
          <div>
            <b>${state.user.name || 'Student'}</b>
            <span>${state.selectedYear}</span>
          </div>
        </div>
        <button class="signout" onclick="backToYearSelection()">Change Year</button>
      </div>
    </aside>
  `;
}

function studentDashboardContent(courses) {
    const header = `
    <header class="topbar">
      <div>
        <button class="mobile-menu-button" onclick="toggleMenu()">☰ Menu</button>
        <h1>${state.selectedYear} Courses</h1>
        <p>Available courses for your academic year</p>
      </div>
    </header>
  `;

    if (courses.length === 0) {
        return `
      ${header}
      <section class="empty-state">
        <div class="empty-icon">☷</div>
        <h2>No Courses Available</h2>
        <p>There are no courses for ${state.selectedYear} yet. Content is added by the administration.</p>
      </section>
    `;
    }

    const coursesGrid = `
    <div class="course-grid">
      ${courses.map(course => courseCard(course)).join('')}
    </div>
  `;

    return `
    ${header}
    <section class="section-head">
      <div>
        <h3>All Courses</h3>
        <p>${courses.length} course${courses.length === 1 ? '' : 's'} available</p>
      </div>
    </section>
    ${coursesGrid}
  `;
}

function courseCard(course) {
    const lectureCount = course.lectures ? course.lectures.length : 0;
    return `
    <article class="course-card" onclick="openCourseDetail('${course.id}')">
      <div class="course-card-thumb" style="background-image: url('${course.cover || ''}');">
        ${course.cover ? '' : '<div class="course-placeholder">📚</div>'}
      </div>
      <div class="course-card-info">
        <h4>${course.title}</h4>
        <p>${course.description || 'No description available'}</p>
      </div>
      <div class="course-card-footer">
        <span>${lectureCount} lecture${lectureCount === 1 ? '' : 's'}</span>
        <span>View Course →</span>
      </div>
    </article>
  `;
}

function openCourseDetail(courseId) {
    const course = state.data.courses.find(c => c.id === courseId);
    if (!course) return;

    state.page = 'course-detail';
    const content = document.getElementById('content');
    const lectures = course.lectures || [];

    content.innerHTML = `
    <div class="course-detail">
      <button class="back-button" onclick="renderStudentDashboard()">← Back to courses</button>
      ${course.cover ? `<div class="course-cover-wrapper"><img src="${course.cover}" alt="${course.title}" class="course-cover"></div>` : ''}
      <h1 class="course-detail-title">${course.title}</h1>
      <p class="course-detail-description">${course.description || 'No description provided'}</p>
      <div class="lectures-section">
        <h3>Course Lectures</h3>
        ${lectures.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📹</div>
            <h2>No Lectures</h2>
            <p>This course has no lectures yet.</p>
          </div>
        ` : `
          <div class="lectures-list">
            ${lectures.map((lecture, index) => lectureItem(lecture, index, courseId)).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

function lectureItem(lecture, index, courseId) {
    const isFirst = index === 0;
    const isLoggedIn = state.user && state.user.role === 'student';
    const isLocked = !isFirst && !isLoggedIn;

    return `
    <div class="lecture-item ${isLocked ? 'locked' : ''}" onclick="${isLocked ? `openLoginModal('${courseId}', '${lecture.id}')` : `openLecturePlayer('${courseId}', '${lecture.id}')`}">
      <div class="lecture-item-left">
        <span class="lecture-number">${index + 1}</span>
        <div>
          <div class="lecture-title">${lecture.title}</div>
          <div class="lecture-meta">${isFirst ? '🔓 Free' : '🔒 Premium'}</div>
        </div>
      </div>
      <div class="lecture-item-right">
        ${isLocked ? '<span class="lock-icon">🔒</span>' : '<span class="play-icon">▶</span>'}
      </div>
    </div>
  `;
}

function openLecturePlayer(courseId, lectureId) {
    const course = state.data.courses.find(c => c.id === courseId);
    if (!course) return;
    const lecture = course.lectures.find(l => l.id === lectureId);
    if (!lecture) return;

    const content = document.getElementById('content');
    content.innerHTML = `
    <div class="lecture-player">
      <button class="back-button" onclick="openCourseDetail('${courseId}')">← Back to course</button>
      <h2>${lecture.title}</h2>
      ${lecture.videoData ? `
        <div class="video-wrapper">
          <video controls src="${lecture.videoData}" style="width:100%; height:100%;"></video>
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-icon">🎬</div>
          <h2>No Video</h2>
          <p>This lecture has no video content yet.</p>
        </div>
      `}
    </div>
  `;
}

function openLoginModal(courseId, lectureId) {
    const existingModal = document.querySelector('.modal-backdrop');
    if (existingModal) existingModal.remove();

    const modalHtml = `
    <div class="modal-backdrop" id="loginModal">
      <div class="modal">
        <h2>Student Login</h2>
        <p>Login to access premium lectures and unlock all content.</p>
        <div class="field">
          <label>Email or Username</label>
          <input id="loginEmail" type="text" placeholder="Enter your email or username">
        </div>
        <div class="field">
          <label>Password</label>
          <input id="loginPassword" type="password" placeholder="Enter your password">
        </div>
        <div class="login-error" id="loginError"></div>
        <div class="modal-actions">
          <button class="outline" onclick="closeLoginModal()">Cancel</button>
          <button class="primary" id="loginSubmitBtn">Login</button>
        </div>
      </div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('loginSubmitBtn').onclick = function() {
        handleStudentLogin(courseId, lectureId);
    };
    document.getElementById('loginPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleStudentLogin(courseId, lectureId);
    });
}

function handleStudentLogin(courseId, lectureId) {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    if (!email || !password) {
        errorEl.textContent = 'Please enter both email/username and password.';
        return;
    }

    const student = state.data.students.find(s =>
        (s.email === email || s.username === email) && s.password === password
    );

    if (!student) {
        errorEl.textContent = 'Invalid credentials. Please try again.';
        return;
    }

    state.user = { ...student, role: 'student' };
    localStorage.setItem('northstar_student_session', JSON.stringify({ id: student.id }));
    closeLoginModal();
    toast('Login successful! Welcome back.');

    if (courseId && lectureId) {
        openLecturePlayer(courseId, lectureId);
    } else {
        renderStudentDashboard();
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.remove();
}

function navigateStudent(page) {
    if (page === 'dashboard') {
        renderStudentDashboard();
    }
}

function backToYearSelection() {
    localStorage.removeItem('northstar_student_session');
    state.user = null;
    state.selectedYear = null;
    yearSelectionPage();
}

function toggleMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

yearSelectionPage();