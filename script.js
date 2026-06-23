// ============================================
// AUTH SYSTEM
// ============================================

let users = JSON.parse(localStorage.getItem('lifegrid_users')) || [];
let currentUser = JSON.parse(sessionStorage.getItem('lifegrid_current')) || null;
let userProgress = {};

function loadUsers() {
    const stored = localStorage.getItem('lifegrid_users');
    if (stored) { try { users = JSON.parse(stored); } catch(e) { users = []; } }
    else { users = []; localStorage.setItem('lifegrid_users', JSON.stringify(users)); }
}

function saveUsers() { localStorage.setItem('lifegrid_users', JSON.stringify(users)); }

function loadCurrentUser() {
    const stored = sessionStorage.getItem('lifegrid_current');
    if (stored) { try { currentUser = JSON.parse(stored); } catch(e) { currentUser = null; } }
}

function loadProgress() {
    if (currentUser) {
        const stored = localStorage.getItem('lifegrid_progress_' + currentUser.username);
        if (stored) { try { userProgress = JSON.parse(stored); } catch(e) { userProgress = {}; } }
        else { userProgress = {}; }
    }
}

function saveProgress() {
    if (currentUser) {
        localStorage.setItem('lifegrid_progress_' + currentUser.username, JSON.stringify(userProgress));
    }
}

function updateDashboardUI() {
    const agencies = ['SSS', 'PhilHealth', 'Pag-IBIG', 'PSA', 'LTO', 'BIR'];
    let completed = 0;
    agencies.forEach(agency => {
        const isCompleted = userProgress[agency] || false;
        const statusEl = document.getElementById('status-' + agency);
        if (statusEl) {
            statusEl.textContent = isCompleted ? '✅ COMPLETED' : '● PENDING';
            statusEl.className = isCompleted ? 'card-status completed' : 'card-status';
        }
        const badgeEl = document.getElementById('badge-' + agency);
        if (badgeEl) {
            badgeEl.textContent = isCompleted ? 'COMPLETED' : 'PENDING';
            badgeEl.className = isCompleted ? 'card-badge completed' : 'card-badge pending';
        }
        if (isCompleted) completed++;
    });
    const progress = Math.round((completed / agencies.length) * 100);
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    if (progressText) progressText.textContent = progress + '%';
    if (progressFill) progressFill.style.width = progress + '%';
}

function toggleAgencyStatus(agency) {
    userProgress[agency] = !userProgress[agency];
    saveProgress();
    updateDashboardUI();
    showNotification(
        userProgress[agency] ? '✅ ' + agency + ' marked as COMPLETED!' : '↩️ ' + agency + ' marked as PENDING',
        userProgress[agency] ? '#00ff41' : '#ffd700'
    );
}

function checkAuth() {
    loadCurrentUser();
    const currentPage = window.location.pathname;
    if (currentPage.includes('index.html') || currentPage.endsWith('/main%20website/') || currentPage.endsWith('/')) {
        if (currentUser) { window.location.href = 'dashboard.html'; return true; }
    }
    if (currentPage.includes('dashboard.html')) {
        if (!currentUser) { window.location.href = 'index.html'; return false; }
        const displayName = document.getElementById('displayName');
        if (displayName && currentUser) { displayName.textContent = currentUser.fullname.toUpperCase(); }
        loadProgress();
        updateDashboardUI();
    }
    return !!currentUser;
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'flex';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerForm').style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!username || !password) { showNotification('⚠️ Enter username and password', '#ffd700'); return; }
    loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        sessionStorage.setItem('lifegrid_current', JSON.stringify(user));
        currentUser = user;
        showNotification('✅ ACCESS GRANTED', '#00ff41');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
    } else {
        const userExists = users.find(u => u.username === username);
        showNotification(userExists ? '❌ Wrong password!' : '❌ Username not found! Please register.', '#ff4444');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const fullname = document.getElementById('regFullname').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    if (!fullname || !username || !email || !password) { showNotification('⚠️ All fields are required', '#ffd700'); return; }
    loadUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) { showNotification('⚠️ Username already exists', '#ffd700'); return; }
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) { showNotification('⚠️ Email already registered', '#ffd700'); return; }
    const newUser = { fullname, username, email, password, created: new Date().toISOString() };
    users.push(newUser);
    saveUsers();
    showNotification('✅ ACCOUNT CREATED! Please login.', '#00ff41');
    document.getElementById('regFullname').value = '';
    document.getElementById('regUsername').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPassword').value = '';
    showLogin();
    document.getElementById('loginUsername').value = username;
}

function logout() {
    sessionStorage.removeItem('lifegrid_current');
    currentUser = null;
    window.location.href = 'index.html';
}

// ============================================
// GUIDE DATA
// ============================================

const guideData = {
    'SSS': {
        title: '🏢 SSS - Social Security System',
        description: 'The Social Security System (SSS) is a government agency that provides social security protection to workers in the private sector.',
        requirements: ['Valid government-issued ID', 'Birth certificate (PSA-issued)', 'Marriage certificate (if applicable)', 'Completed SSS application form (E-1 or E-4)', '1x1 ID picture (2 copies)'],
        steps: ['Fill out the SSS application form (E-1 for employed, E-4 for self-employed)', 'Submit the form along with required documents to the nearest SSS branch', 'Wait for your SSS number to be generated (usually 1-2 weeks)', 'Activate your My.SSS online account', 'Start contributing monthly based on your salary'],
        benefits: ['Retirement pension', 'Sickness and maternity benefits', 'Disability and death benefits', 'Funeral benefits', 'Salary loan', 'Housing loan (with Pag-IBIG coordination)'],
        website: 'https://www.sss.gov.ph',
        hotline: '1455'
    },
    'PhilHealth': {
        title: '🏥 PhilHealth - Philippine Health Insurance',
        description: 'PhilHealth is the national health insurance program that provides financial protection against health care costs.',
        requirements: ['Valid government-issued ID', 'Birth certificate (PSA-issued)', 'Marriage certificate (if applicable)', 'PhilHealth Member Registration Form (PMRF)', '1x1 ID picture (2 copies)'],
        steps: ['Download the PhilHealth Member Registration Form (PMRF) online', 'Fill out the form completely', 'Submit the form to the nearest PhilHealth office or through your employer', 'Wait for your PhilHealth number to be issued', 'Start using your PhilHealth coverage for medical expenses'],
        benefits: ['Inpatient hospital care', 'Outpatient care', 'Emergency and disaster-related services', 'Maternity care', 'Dental health services', 'Annual physical exam (for members)'],
        website: 'https://www.philhealth.gov.ph',
        hotline: '1448'
    },
    'Pag-IBIG': {
        title: '🏠 Pag-IBIG Fund - Home Development Fund',
        description: 'Pag-IBIG Fund is a government agency that provides housing loans and savings programs for Filipinos.',
        requirements: ['Valid government-issued ID', 'Birth certificate (PSA-issued)', 'Marriage certificate (if applicable)', 'Pag-IBIG Membership Form (MDF)', '1x1 ID picture (2 copies)'],
        steps: ['Fill out the Pag-IBIG Membership Form (MDF)', 'Submit the form to the nearest Pag-IBIG office or through your employer', 'Wait for your Pag-IBIG MID number to be issued', 'Activate your Pag-IBIG online account', 'Start saving and applying for housing loans'],
        benefits: ['Housing loan up to ₱6,000,000', 'Savings program (MP2) with high interest rates', 'Short-term loans (multi-purpose and calamity)', 'Retirement savings', 'Mortgage redemption insurance'],
        website: 'https://www.pagibigfund.gov.ph',
        hotline: '8-724-4244'
    },
    'PSA': {
        title: '🪪 PSA - Philippine Statistics Authority',
        description: 'The Philippine Statistics Authority is the central statistical agency of the Philippine government.',
        requirements: ['Valid government-issued ID', 'Completed application form', 'Payment for the requested document', 'Additional documents for replacement (if applicable)'],
        steps: ['Visit the nearest PSA office or use their online portal', 'Fill out the application form for your requested document (birth, marriage, death, or CENOMAR)', 'Pay the corresponding fee (₱155-₱365 depending on the document)', 'Wait for your document to be processed (usually 1-3 days)', 'Claim your document or have it delivered'],
        benefits: ['Birth certificate issuance', 'Marriage certificate issuance', 'Death certificate issuance', 'CENOMAR (Certificate of No Marriage)', 'Birth certificate correction', 'Legal document authentication'],
        website: 'https://www.psa.gov.ph',
        hotline: '8-846-4511'
    },
    'LTO': {
        title: '🚗 LTO - Land Transportation Office',
        description: 'The Land Transportation Office handles driver\'s license issuance, vehicle registration, and traffic enforcement.',
        requirements: ['Valid government-issued ID', 'Birth certificate (PSA-issued)', 'Student permit certificate (for new license)', 'Medical certificate', 'Drug test result', 'LTO application form'],
        steps: ['Apply for a student permit (for new drivers)', 'Complete the required driving hours for student license holders', 'Take the written and practical driving exam', 'Pass the exam and pay the license fee', 'Wait for your license card to be issued'],
        benefits: ['Driver\'s license (student, non-professional, professional)', 'Vehicle registration and renewal', 'Vehicle inspection services', 'Driving education programs', 'License renewal and replacement'],
        website: 'https://www.lto.gov.ph',
        hotline: '1-342-586'
    },
    'BIR': {
        title: '💰 BIR - Bureau of Internal Revenue',
        description: 'The Bureau of Internal Revenue is responsible for collecting taxes and enforcing tax laws in the Philippines.',
        requirements: ['Valid government-issued ID', 'Birth certificate (PSA-issued)', 'Marriage certificate (if applicable)', 'BIR Form 1901 (for self-employed) or 1902 (for employed)', 'Certificate of Registration from DTI (for businesses)'],
        steps: ['Secure the appropriate BIR form (1902 for employees, 1901 for self-employed)', 'Fill out the form completely', 'Submit the form to the BIR Revenue District Office (RDO)', 'Wait for your TIN (Tax Identification Number) to be assigned', 'Receive your Certificate of Registration (COR) and official receipt/invoice'],
        benefits: ['Tax Identification Number (TIN) issuance', 'Income tax filing and payment', 'Business registration', 'Value-Added Tax (VAT) registration', 'Withholding tax compliance', 'Tax clearance services'],
        website: 'https://www.bir.gov.ph',
        hotline: '8-981-8888'
    }
};

// ============================================
// MODAL FUNCTIONS
// ============================================

function openGuide(agency) {
    const data = guideData[agency];
    if (!data) return;
    const isCompleted = userProgress[agency] || false;
    document.getElementById('modalTitle').textContent = data.title;
    let html = `
        <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.8;margin-bottom:15px;">${data.description}</p>
        <div style="display:flex;align-items:center;gap:15px;margin-bottom:15px;padding:10px 15px;background:rgba(255,77,227,0.03);border:1px solid rgba(255,77,227,0.08);border-radius:12px;">
            <span style="font-family:'Orbitron',monospace;font-size:10px;color:rgba(255,255,255,0.3);">STATUS:</span>
            <span style="font-family:'Orbitron',monospace;font-size:11px;color:${isCompleted ? '#00ff41' : '#ffd700'};">
                ${isCompleted ? '✅ COMPLETED' : '⏳ PENDING'}
            </span>
            <button onclick="toggleAgencyStatus('${agency}')" style="margin-left:auto;padding:5px 15px;border:2px solid ${isCompleted ? 'rgba(0,255,65,0.2)' : 'rgba(255,77,227,0.2)'};border-radius:10px;background:${isCompleted ? 'rgba(0,255,65,0.05)' : 'rgba(255,77,227,0.05)'};color:${isCompleted ? '#00ff41' : '#ff4de3'};font-family:'Quicksand',sans-serif;font-size:9px;font-weight:700;cursor:pointer;transition:all 0.3s ease;letter-spacing:1px;">
                ${isCompleted ? '↩️ MARK PENDING' : '✅ MARK COMPLETED'}
            </button>
        </div>
        <h3>📋 REQUIREMENTS</h3><ul>${data.requirements.map((req, i) => `<li style="display:flex;align-items:center;gap:10px;padding:6px 0 6px 20px;"><span style="color:rgba(255,255,255,0.15);font-size:11px;">${String(i+1).padStart(2,'0')}.</span><span style="color:rgba(255,255,255,0.6);font-size:13px;">${req}</span></li>`).join('')}</ul>
        <h3>📌 STEPS TO APPLY</h3><ul>${data.steps.map(step => `<li style="display:flex;align-items:center;gap:10px;padding:6px 0 6px 20px;"><span style="color:rgba(255,77,227,0.3);font-size:11px;">▶</span><span style="color:rgba(255,255,255,0.5);font-size:13px;">${step}</span></li>`).join('')}</ul>
        <h3>✅ BENEFITS</h3><ul>${data.benefits.map(benefit => `<li style="display:flex;align-items:center;gap:10px;padding:6px 0 6px 20px;"><span style="color:#00ff41;font-size:11px;">✦</span><span style="color:rgba(255,255,255,0.5);font-size:13px;">${benefit}</span></li>`).join('')}</ul>
        <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;">
            <a href="${data.website}" target="_blank" class="modal-btn">🌐 VISIT WEBSITE</a>
            <span style="color:rgba(255,255,255,0.2);font-size:11px;padding:10px 0;">📞 Hotline: ${data.hotline}</span>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,77,227,0.05);display:flex;gap:10px;flex-wrap:wrap;">
            <button onclick="openMapLocator('${agency}')" class="modal-btn" style="background:rgba(143,252,255,0.05);border-color:rgba(143,252,255,0.15);color:#8ffcff;cursor:pointer;">🗺️ FIND NEAREST OFFICE</button>
            <button onclick="toggleAgencyStatus('${agency}'); closeModal();" class="modal-btn" style="background:${isCompleted ? 'rgba(0,255,65,0.05)' : 'rgba(255,77,227,0.05)'};border-color:${isCompleted ? 'rgba(0,255,65,0.2)' : 'rgba(255,77,227,0.15)'};color:${isCompleted ? '#00ff41' : '#ff4de3'};cursor:pointer;">${isCompleted ? '↩️ MARK PENDING' : '✅ MARK COMPLETED'}</button>
        </div>
    `;
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('guideModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openMapLocator(agency) {
    closeModal();
    showNotification('🗺️ OPENING MAP - ' + agency, '#8ffcff');
    setTimeout(() => { window.open('../main%20map/synapse.html?agency=' + encodeURIComponent(agency), '_blank'); }, 300);
}

function closeModal() {
    document.getElementById('guideModal').classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('click', function(e) {
    if (e.target === document.getElementById('guideModal')) closeModal();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter') {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        if (loginForm && loginForm.style.display !== 'none') loginForm.dispatchEvent(new Event('submit'));
        else if (registerForm && registerForm.style.display !== 'none') registerForm.dispatchEvent(new Event('submit'));
    }
});

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showNotification(message, color = '#ff4de3') {
    let container = document.getElementById('notification-container');
    if (!container) { container = document.createElement('div'); container.id = 'notification-container'; document.body.appendChild(container); }
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.style.borderColor = color;
    notif.style.color = color;
    notif.textContent = '◉ ' + message;
    container.appendChild(notif);
    setTimeout(() => {
        notif.classList.add('hide');
        setTimeout(() => { notif.remove(); }, 300);
    }, 2500);
}

// ============================================
// CONSOLE EASTER EGG
// ============================================

console.log('%c✦ LIFEGRID - KAKYA EDITION ✦', 'color: #ff4de3; font-size: 20px; font-weight: bold;');
console.log('%c█ SYSTEM: ACTIVE █', 'color: #8ffcff; font-size: 14px;');

// ============================================
// AUTO-INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    loadCurrentUser();
    checkAuth();
    document.querySelectorAll('.title-letter').forEach(letter => {
        letter.setAttribute('data-text', letter.textContent);
    });
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/main%20website/')) {
        showLogin();
    }
    if (window.location.pathname.includes('dashboard.html')) {
        updateDashboardUI();
    }
    console.log('✅ System initialized');
});