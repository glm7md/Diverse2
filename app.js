const app = document.getElementById('app');
const databaseKey = 'northstar_university_data';
const defaultData = { courses: [], students: [] };

const state = {
    user: null,
    page: 'home',
    selectedYear: null,
    data: loadStudentData()
};

function loadStudentData() {
    try {
        const raw = localStorage.getItem(databaseKey);
        if (!raw) return structuredClone(defaultData);
        const parsed = JSON.parse(raw);
        return {
            courses: Array.isArray(parsed.courses) ? parsed.courses : [],
            students: Array.isArray(parsed.students) ? parsed.students : []
        };
    } catch (err) {
        console.error(err);
        return structuredClone(defaultData);
    }
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

let toastTimer = null;
function toast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
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
          <div class="year-card" data-action="select-year" data-year="${esc(year)}">
            <div class="year-card-icon">${index + 1}</div>
            <h3>${esc(year)}</h3>
            <p>Access all courses and learning materials for ${esc(year.toLowerCase())} students</p>
          </div>
        `).join('')}
      </div>
      <div class="admin-link">
        <button data-action="open-signin">Sign In</button>
      </div>
    </main>
  `;
}

function selectYear(year) {
    state.selectedYear = year;

    try {
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
    } catch (err) {
        console.error(err);
        localStorage.removeItem('northstar_student_session');
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
      <main class="main">
        <button class="mobile-menu-button" data-action="toggle-menu">☰ Menu</button>
        <div id="content"></div>
      </main>
    </div>
  `;
    document.getElementById('content').innerHTML = studentDashboardContent(yearCourses);
}

function studentSidebar() {
    const name = state.user && state.user.name ? state.user.name : 'Student';

    return `
    <aside class="sidebar">
      <div class="mobile-sidebar-head">
        <span>Navigation</span>
        <button data-action="close-menu">&times;</button>
      </div>
      <div class="brand">
        <span class="brand-mark">N</span> NORTHSTAR
      </div>
      <nav>
        <button class="nav-link active" data-action="navigate-dashboard">My Courses</button>
      </nav>
      <div class="sidebar-bottom">
        <div class="profile-mini">
          <div class="avatar">${esc(name.charAt(0).toUpperCase())}</div>
          <div>
            <b>${esc(name)}</b>
            <span>${esc(state.selectedYear)}</span>
          </div>
        </div>
        <button class="signout" data-action="change-year">Change Year</button>
      </div>
    </aside>
  `;
}

function studentDashboardContent(courses) {
    const header = `
    <header class="topbar">
      <div>
        <h1>${esc(state.selectedYear)} Courses</h1>
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
        <p>There are no courses for ${esc(state.selectedYear)} yet. Content is added by the administration.</p>
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
    <article class="course-card" data-action="open-course" data-course-id="${esc(course.id)}">
      <div class="course-card-thumb" style="background-image: url('${esc(course.cover || '')}');">
        ${course.cover ? '' : '<div class="course-placeholder">📚</div>'}
      </div>
      <div class="course-card-info">
        <h4>${esc(course.title)}</h4>
        <p>${esc(course.description || 'No description available')}</p>
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
      <button class="back-button" data-action="back-to-dashboard">← Back to courses</button>
      ${course.cover ? `<div class="course-cover-wrapper"><img src="${esc(course.cover)}" alt="${esc(course.title)}" class="course-cover"></div>` : ''}
      <h1 class="course-detail-title">${esc(course.title)}</h1>
      <p class="course-detail-description">${esc(course.description || 'No description provided')}</p>
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
    const action = isLocked ? 'open-login' : 'open-lecture';

    return `
    <div class="lecture-item ${isLocked ? 'locked' : ''}" data-action="${action}" data-course-id="${esc(courseId)}" data-lecture-id="${esc(lecture.id)}">
      <div class="lecture-item-left">
        <span class="lecture-number">${index + 1}</span>
        <div>
          <div class="lecture-title">${esc(lecture.title)}</div>
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
      <button class="back-button" data-action="back-to-course" data-course-id="${esc(courseId)}">← Back to course</button>
      <h2>${esc(lecture.title)}</h2>
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
    document.getElementById('loginModal')?.remove();

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
          <button class="outline" data-action="close-login-modal">Cancel</button>
          <button class="primary" data-action="submit-login" data-course-id="${esc(courseId || '')}" data-lecture-id="${esc(lectureId || '')}">Login</button>
        </div>
      </div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleStudentLogin(courseId || null, lectureId || null);
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
    document.getElementById('loginModal')?.remove();
}

function openUnifiedSignInModal() {
    document.getElementById('signInModal')?.remove();

    const modalHtml = `
    <div class="modal-backdrop" id="signInModal">
      <div class="modal">
        <h2>Sign In</h2>
        <p>Login with your student or administrator account.</p>
        <div class="field">
          <label>Email or Username</label>
          <input id="signInEmail" type="text" placeholder="Enter your email or username">
        </div>
        <div class="field">
          <label>Password</label>
          <input id="signInPassword" type="password" placeholder="Enter your password">
        </div>
        <div class="login-error" id="signInError"></div>
        <div class="modal-actions">
          <button class="outline" data-action="close-signin-modal">Cancel</button>
          <button class="primary" data-action="submit-signin">Sign In</button>
        </div>
      </div>
    </div>
  `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('signInPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUnifiedSignIn();
    });
}

function closeUnifiedSignInModal() {
    document.getElementById('signInModal')?.remove();
}

function handleUnifiedSignIn() {
    const email = document.getElementById('signInEmail').value.trim();
    const password = document.getElementById('signInPassword').value;
    const errorEl = document.getElementById('signInError');

    if (!email || !password) {
        errorEl.textContent = 'Please enter both email/username and password.';
        return;
    }

    if (email === 'admin' && password === 'admin123') {
        localStorage.setItem('northstar_admin_session', 'true');
        window.location.href = 'admin.html';
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
    state.selectedYear = student.year || 'First Year';
    localStorage.setItem('northstar_student_session', JSON.stringify({ id: student.id }));
    closeUnifiedSignInModal();
    toast('Login successful! Welcome back.');
    renderStudentDashboard();
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

function toggleStudentSidebar() {
    document.querySelector('.sidebar')?.classList.toggle('open');
}

function closeStudentSidebar() {
    document.querySelector('.sidebar')?.classList.remove('open');
}

document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');

    if (!target) {
        const openSidebar = document.querySelector('.sidebar.open');
        if (openSidebar && !openSidebar.contains(e.target) && !e.target.closest('.mobile-menu-button')) {
            openSidebar.classList.remove('open');
        }
        return;
    }

    const action = target.dataset.action;

    switch (action) {
        case 'select-year': selectYear(target.dataset.year); break;
        case 'open-signin': openUnifiedSignInModal(); break;
        case 'close-signin-modal': closeUnifiedSignInModal(); break;
        case 'submit-signin': handleUnifiedSignIn(); break;
        case 'toggle-menu': toggleStudentSidebar(); break;
        case 'close-menu': closeStudentSidebar(); break;
        case 'navigate-dashboard': navigateStudent('dashboard'); break;
        case 'change-year': backToYearSelection(); break;
        case 'open-course': openCourseDetail(target.dataset.courseId); break;
        case 'back-to-dashboard': renderStudentDashboard(); break;
        case 'open-lecture': openLecturePlayer(target.dataset.courseId, target.dataset.lectureId); break;
        case 'open-login': openLoginModal(target.dataset.courseId, target.dataset.lectureId); break;
        case 'back-to-course': openCourseDetail(target.dataset.courseId); break;
        case 'close-login-modal': closeLoginModal(); break;
        case 'submit-login': handleStudentLogin(target.dataset.courseId || null, target.dataset.lectureId || null); break;
    }
});

yearSelectionPage();