// ==========================================
// PHẦN 1: BIẾN TOÀN CỤC & TIỆN ÍCH CƠ BẢN
// ==========================================
window.db = null; window.session = null; window.serverOffset = 0; window.isDemoMode = false; window.currentChatRef = null; window.currentPrivateConvo = ""; window.currentStreakRef = null; window.isSpying = false; window.currentGroupChat = ""; window.currentGroupAdmin = ""; window.html5QrcodeScanner = null; window.currentUploadType = null; window.typingTimeout = null; window.IMGBB_API_KEY = "Cdb452c548546016f5ad7d5954d6d280"; window.currentVillage = 'hs';

window.applyBranding = (name, logo) => { 
    document.querySelectorAll('.dynamic-app-name').forEach(el => el.innerText = name || "KIM MIN LAI"); 
    const logoEl = document.getElementById('main-login-logo'); 
    if (logoEl) { 
        if (logo) { logoEl.src = logo; logoEl.classList.remove('hidden'); } 
        else { logoEl.classList.add('hidden'); } 
    } 
};

window.now = () => new Date().getTime() + window.serverOffset;

window.getDateStr = (off = 0) => { 
    const d = new Date(window.now()); 
    d.setDate(d.getDate() + off); 
    const p = n => n < 10 ? '0' + n : n; 
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); 
};

window.toggleDarkMode = (chk) => { 
    const isDark = chk.checked; 
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light'); 
    localStorage.setItem('darkMode', isDark); 
};

window.escapeHTML = (str) => { 
    return str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])) : ''; 
};

const showNetworkToast = (msg, bg) => { 
    const t = document.getElementById('network-toast'); 
    if(t) { 
        t.innerText = msg; t.style.background = bg; t.classList.remove('hidden'); 
        setTimeout(() => t.classList.add('hidden'), 4000); 
    } 
};

window.addEventListener('offline', () => showNetworkToast('⚠️ Mất kết nối mạng!', '#dc3545')); 
window.addEventListener('online', () => showNetworkToast('✅ Có mạng trở lại!', '#4CAF50'));

const setOfflineStatus = () => { 
    if (window.session && window.db) { 
        window.db.ref('tracking/' + window.session.id).update({ status: 'offline', lastLogout: firebase.database.ServerValue.TIMESTAMP }); 
    } 
};

window.addEventListener('beforeunload', setOfflineStatus);
document.addEventListener('visibilitychange', () => { 
    if (document.visibilityState === 'hidden') setOfflineStatus(); 
    else if (document.visibilityState === 'visible' && window.session && window.db) { 
        window.db.ref('tracking/' + window.session.id).update({ status: 'online', lastLogin: firebase.database.ServerValue.TIMESTAMP }); 
    } 
});
// ==========================================
// BẢN VÁ: THÔNG BÁO ĐẨY (PUSH NOTI)
// ==========================================
window.requestNoti = () => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") Notification.requestPermission();
};

window.pushNoti = (title, body) => {
    if (document.visibilityState === 'visible' || Notification.permission !== "granted") return;
    new Notification(title, {
        body: body,
        icon: window.session.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    });
};

// ==========================================
// PHẦN 2: KHỞI TẠO FIREBASE & AUTO-SETUP
// ==========================================

function initFirebase() {
    try {
        if (typeof firebase !== 'không biết') {
            const c = { 
                apiKey: "AIzaSyAcfas2KJo9n4Lpb9YVhGOpKWfYgBlSE9U", 
                authDomain: "app-co-eb5d0.firebaseapp.com", 
                projectId: "app-co-eb5d0", 
                storageBucket: "app-co-eb5d0.firebasestorage.app", 
                messagingSenderId: "160906787270", 
                appId: "1:160906787270:web:638e28599f303dfddd1ac7", 
                databaseURL: "https://app-co-eb5d0-default-rtdb.firebaseio.com" 
            };
            if (!firebase.apps.length) firebase.initializeApp(c);
            window.db = firebase.database();

            window.db.ref('config').once('value', s => {
                if (!s.exists()) {
                    window.db.ref('/').update({
                        "config/branding/name": "LỚP HỌC CÔNG GIÁO",
                        "config/branding/logo": "",
                        "config/clearPin": "654321",
                        "config/maintenance": false,
                        "users/admin/name": "BOSS QUÂN",
                        "users/admin/role": "admin",
                        "users/admin/allowPrivate": true,
                        "users/admin/isLocked": false
                    }).then(() => {
                        window.showCustomAlert("✅ Đã tự động khôi phục dữ liệu gốc! Đang tải lại app...");
                        location.reload();
                    }).catch(err => {
                        window.showCustomAlert("🚨 LỖI GHI DỮ LIỆU: " + err.message);
                    });
                }
            }).catch(err => {
                window.showCustomAlert("🚨 LỖI ĐỌC DỮ LIỆU: " + err.message + "\n👉 Hãy kiểm tra Firebase Rules!");
            });

            window.db.ref('.info/serverTimeOffset').on('value', s => window.serverOffset = s.val() || 0);

            window.db.ref('config/branding').on('value', s => { 
                if (s.exists()) { 
                    const d = s.val(); 
                    window.applyBranding(d.name, d.logo); 
                    if (d.splashLogo) localStorage.setItem('savedSplashLogo', d.splashLogo); 
                } 
                const splash = document.getElementById('splash-screen'); 
                const login = document.getElementById('login-screen'); 
                if (splash && !window.session) { 
                    splash.style.display = 'none'; 
                    splash.classList.add('hidden'); 
                } 
                if (login && !window.session) login.classList.remove('hidden'); 
            }, err => {
                window.showCustomAlert("🚨 LỖI TẢI GIAO DIỆN: " + err.message);
                document.getElementById('splash-screen').classList.add('hidden');
                document.getElementById('login-screen').classList.remove('hidden');
            });
        }
    } catch (e) { 
        window.showCustomAlert("🚨 LỖI HỆ THỐNG: " + e.message); 
    }
}
// ==========================================
// PHẦN 3: XỬ LÝ ĐĂNG NHẬP & ĐĂNG XUẤT
// ==========================================
window.uploadGroupAvatar = async () => {
    const fileInput = document.getElementById('group-avt-file');
    const file = fileInput.files[0];
    if(!file) return;
    
    window.showCustomAlert("⏳ Đang tải ảnh lên thư viện...");
    // Dùng đúng thư viện ImgBB đã setup sẵn trong app
    const url = await window.uploadToImgBB(file);
    
    if(url) {
        window.db.ref('groups/' + window.currentGroupChat).update({ avatar: url }).then(() => {
            window.showCustomAlert("✅ Đã cập nhật ảnh đại diện nhóm!");
            window.toggleModal('group-manage-modal', false);
            fileInput.value = ''; // Reset lại ô chọn file
        });
    } else {
        window.showCustomAlert("❌ Tải ảnh thất bại! Vui lòng thử lại.");
    }
};

window.handleLogin = () => {
    const i = document.getElementById('username').value.trim().toLowerCase(); 
    const p = document.getElementById('password').value.trim(); 
    const b = document.getElementById('login-btn');
    
    if (!i || !p) return window.showCustomAlert('LỖI ĐĂNG NHẬP', 'Vui lòng điền đủ ID và Mật khẩu!', '⚠️'); 
    
    b.innerText = "ĐANG TẢI..."; 
    b.disabled = true;
    const emailAo = i + '@kimminlai.com';

    firebase.auth().signInWithEmailAndPassword(emailAo, p).then(() => {
        window.db.ref('users/' + i).once('value').then(s => {
            if (i === 'admin') { 
                window.session = { 
                    id: i, role: 'admin', name: 'BOSS QUÂN', 
                    avatar: s.val()?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png', 
                    allowPrivate: true 
                }; 
                window.db.ref('tracking/' + i).update({ status: 'online', lastLogin: firebase.database.ServerValue.TIMESTAMP }); 
                window.startIntro();
            } else if (s.exists()) {
                const d = s.val();
                if (d.isLocked) { 
                    window.showCustomAlert('TÀI KHOẢN BỊ KHÓA 🔒', 'Lý do: ' + (d.lockReason || "Vi phạm nội quy!"), '🚫');
                    firebase.auth().signOut(); 
                    b.innerText = "VÀO HỆ THỐNG 🚀"; b.disabled = false;
                } else {
                    window.session = { 
                        id: i, role: d.role, name: d.name, 
                        avatar: d.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png', 
                        allowPrivate: d.allowPrivate !== false 
                    }; 
                    window.db.ref('tracking/' + i).update({ status: 'online', lastLogin: firebase.database.ServerValue.TIMESTAMP }); 
                    window.startIntro();
                }
            } else {
                // VÁ LỖI TẠI ĐÂY: Phát hiện tài khoản đã bị xóa khỏi Database (Bóng ma)
                window.showCustomAlert('TÀI KHOẢN ĐÃ BỊ XÓA', 'Tài khoản này không còn tồn tại trên hệ thống!', '❌');
                firebase.auth().signOut();
                b.innerText = "VÀO HỆ THỐNG 🚀"; 
                b.disabled = false;
            }
        });
    }).catch((error) => { 
        b.innerText = "VÀO HỆ THỐNG 🚀"; 
        b.disabled = false; 
        let errorMsg = 'Sai ID hoặc Mật khẩu! Các em nhập lại nhé hoặc SOS nha😘';
        if (error.code === 'auth/network-request-failed') {
            errorMsg = 'Lỗi kết nối mạng, vui lòng thử lại sau!';
        }
        window.showCustomAlert('ĐĂNG NHẬP THẤT BẠI', errorMsg, '❌');
    });
};

window.handleLogout = () => { 
    if (window.session && window.db) {
        window.db.ref('tracking/' + window.session.id).update({ status: 'offline', lastLogout: firebase.database.ServerValue.TIMESTAMP }).then(() => {
            firebase.auth().signOut().then(() => location.reload());
        }); 
    } else {
        location.reload(); 
    }
};
// ==========================================
// PHẦN 4: CHUẨN BỊ DỮ LIỆU & VÀO APP
// ==========================================

window.prepareAppData = async () => {
    try {
        const dataPromises = [ 
            window.db.ref('users').once('value'), 
            window.db.ref('config').once('value') 
        ];
        
        if (window.session.role === 'admin' || window.session.role === 'gv') {
            dataPromises.push(window.db.ref('grades').once('value'));
            dataPromises.push(window.db.ref('tracking').once('value'));
        } else {
            dataPromises.push(window.db.ref(`friends/${window.session.id}`).once('value'));
            dataPromises.push(window.db.ref(`grades/${window.session.id}`).once('value'));
        }
        await Promise.all(dataPromises);
    } catch (e) { 
        console.error("Lỗi chuẩn bị dữ liệu:", e); 
    }
};

window.startIntro = () => { 
    document.getElementById('login-screen').classList.add('hidden'); 
    const splash = document.getElementById('splash-screen');
    if(splash) { 
        splash.style.display = 'flex'; 
        splash.classList.remove('hidden'); 
    }
    
    window.prepareAppData().then(() => {
        if(splash) { 
            splash.style.display = 'none'; 
            splash.classList.add('hidden'); 
        }
        const o = document.getElementById('intro-overlay'); 
        const img = document.getElementById('intro-img');
        if(img) img.src = window.session.avatar; 
        if(o) o.classList.remove('hidden'); 
        
        setTimeout(() => { 
            document.body.classList.add('shrink-anim'); 
            setTimeout(() => { 
                if(o) o.classList.add('hidden'); 
                document.body.classList.remove('shrink-anim'); 
                window.enterApp(); 
            }, 850); 
        }, 800);
    });
};

window.enterApp = () => { 
    // VÁ LỖI: Gọi xin quyền thông báo ngay khi vào app
    if(typeof window.requestNoti === 'function') window.requestNoti();

    document.getElementById('main-screen').classList.remove('hidden'); 
    document.getElementById('display-name-real').innerText = window.session.name; 
    document.getElementById('display-role').innerText = window.session.role.toUpperCase(); 
    document.getElementById('user-avatar').src = window.session.avatar; 
    
    if (window.session.role === 'admin' || window.session.role === 'gv') {
        const editorZone = document.getElementById('rules-editor-zone');
        if (editorZone) editorZone.classList.remove('hidden');
    }

    const r = window.session.role;
    const adminTabs = ['nav-myprofile', 'nav-connect', 'nav-chat', 'nav-personal', 'nav-manage', 'nav-rules', 'nav-tracking', 'nav-avatar', 'nav-users', 'nav-branding', 'nav-settings', 'nav-clear-data'];
    const hsTabs = ['nav-myprofile', 'nav-connect', 'nav-chat', 'nav-personal', 'nav-rules', 'nav-settings']; 
    const gvTabs = ['nav-myprofile', 'nav-connect', 'nav-chat', 'nav-manage', 'nav-rules', 'nav-users', 'nav-settings'];
    
    document.querySelectorAll('.nav-btn').forEach(b => { 
        if (!b.onclick || !b.onclick.toString().includes('handleLogout')) b.classList.add('hidden'); 
    });

    let activeTabs = (r === 'admin' || window.isDemoMode) ? adminTabs : (r === 'gv' ? gvTabs : hsTabs);
    activeTabs.forEach(id => { 
        const btn = document.getElementById(id); 
        if(btn) btn.classList.remove('hidden');     
    });

    if (window.session.role === 'gv') {
        const roleSelect = document.getElementById('new-role');
        if (roleSelect) {
            for (let i = 0; i < roleSelect.options.length; i++) {
                if (roleSelect.options[i].value === 'gv') roleSelect.options[i].style.display = 'none'; 
            }
            roleSelect.value = 'hs'; 
        }
    }

    if (r === 'admin' || window.isDemoMode) { 
        window.switchTab('manage'); 
        if(typeof window.loadUsers === 'function') window.loadUsers(); 
        if(typeof window.loadTracking === 'function') window.loadTracking(); 
        if(typeof window.loadMasterGrades === 'function') window.loadMasterGrades(); 
        if(typeof window.loadAdminSpy === 'function') window.loadAdminSpy(); 
    } 
    else if (r === 'gv') { 
        window.switchTab('manage'); 
        if(typeof window.loadUsers === 'function') window.loadUsers(); 
        if(typeof window.loadMasterGrades === 'function') window.loadMasterGrades(); 
    } 
    else { 
        window.switchTab('connect'); 
        if(typeof window.loadUsers === 'function') window.loadUsers(); 
    }

    const qrEl = document.getElementById('connect-my-qr');
    if(qrEl) qrEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=user=${window.session.id}`;

    if(typeof window.initBankCardUI === 'function') window.initBankCardUI(); 
    if(typeof window.loadRealtime === 'function') window.loadRealtime(); 
    if(typeof window.loadGroups === 'function') window.loadGroups(); 
    if(typeof window.loadFriendRequests === 'function') window.loadFriendRequests();

    window.db.ref('unread/' + window.session.id).on('value', s => {
        const hasUnread = s.exists() && Object.keys(s.val()).length > 0;
        const dots = ['main-noti-dot', 'menu-noti-dot', 'private-noti-dot'];
        dots.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList[hasUnread ? 'remove' : 'add']('hidden');
        });
        window.unreadData = hasUnread ? s.val() : null;
        
        if(typeof window.renderRecentChats === 'function') window.renderRecentChats();
        if(typeof window.loadAnnouncements === 'function') window.loadAnnouncements();
    });

    const urlParams = new URLSearchParams(window.location.search); 
    const targetUser = urlParams.get('user');
    if(targetUser && targetUser !== window.session.id && typeof window.openUserProfile === 'function') { 
        window.openUserProfile(targetUser); 
    }
};

// ==========================================
// PHẦN 5: ĐIỀU KHIỂN GIAO DIỆN MODAL & TAB
// ==========================================

window.toggleModal = (id, show) => { 
    const m = document.getElementById(id); 
    if (m) m.classList[show ? 'remove' : 'add']('hidden'); 
};

window.toggleSidebar = (show) => { 
    const s = document.getElementById('sidebar'); 
    if (s) { 
        s.classList[show ? 'add' : 'remove']('open'); 
        if(show && window.session) {
            const dot = document.getElementById('main-noti-dot');
            if(dot) dot.classList.add('hidden');
        }
    } 
};

window.switchTab = (id) => { 
    document.querySelectorAll('.tab-pane').forEach(t => t.classList.add('hidden')); 
    const tb = document.getElementById('tab-' + id); 
    if (tb) { 
        tb.classList.remove('hidden'); 
        tb.classList.add('fade-in'); 
    }
    window.toggleSidebar(false); 
    
    if(id === 'chat') { 
        if(typeof window.openChatChannel === 'function') window.openChatChannel('global'); 
        const dot = document.getElementById('menu-noti-dot');
        if(dot) dot.classList.add('hidden'); 
    } 
    if(id === 'myprofile' && typeof window.loadMyProfileTab === 'function') { 
        window.loadMyProfileTab(); 
    } 
};

window.initBankCardUI = () => {
    if(!window.session) return;
    const nameEl = document.getElementById('my-bank-name');
    const idEl = document.getElementById('my-bank-id');
    const avtEl = document.getElementById('my-bank-avt');
    
    if(nameEl) nameEl.innerText = window.session.name;
    if(idEl) idEl.innerText = "ID: " + window.session.id.toUpperCase();
    if(avtEl) avtEl.src = window.session.avatar;
};

// CÔNG THỨC TÍNH ĐIỂM (DÙNG CHUNG)
window.calcGPA = (m, p, t, thi) => {
    const vm = parseFloat(m) || 0, vp = parseFloat(p) || 0, vt = parseFloat(t) || 0, vth = parseFloat(thi) || 0;
    if (vth === 0) return "0.0";
    const g = (vm + vp + (vt * 2) + (vth * 3)) / 7;
    return isNaN(g) ? "0.0" : g.toFixed(1);
};

window.calcYearly = (a1, a2) => { 
    const v1 = parseFloat(a1) || 0; 
    const v2 = parseFloat(a2) || 0; 
    if (v2 === 0) return "-"; // KHÔNG CÒN ĐIỀU KIỆN isHk2Locked NỮA
    const y = (v1 + (v2 * 2)) / 3; 
    return isNaN(y) ? "0.0" : y.toFixed(1); 
};

// TẢI ĐIỂM CÁ NHÂN CHO HỌC SINH (HIỂN THỊ TRỰC TIẾP, KHÔNG KHÓA KỲ 2)
window.loadRealtime = () => {
    if (!window.session || window.session.role !== 'hs') return;
    
    window.db.ref('grades/' + window.session.id).on('value', sn => {
        const g = sn.val() || {}; 
        const h1 = g.hk1 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' }; 
        const h2 = g.hk2 || { m: 0, p: 0, t: 0, thi: 0, hk: '-' };
        
        const t1 = window.calcGPA(h1.m, h1.p, h1.t, h1.thi); 
        const t2 = window.calcGPA(h2.m, h2.p, h2.t, h2.thi); 
        const cn = window.calcYearly(t1, t2);
        
        const ui = document.getElementById('personal-grades-ui'); 
        if (ui) {
            ui.innerHTML = `<div class="scroll-x"><table class="master-table"><tr><th class="sticky-col">KỲ</th><th>M</th><th>15P</th><th>1T</th><th>THI</th><th>TB</th><th>H.KIỂM</th></tr><tr><td class="sticky-col"><b>HK1</b></td><td>${h1.m}</td><td>${h1.p}</td><td>${h1.t}</td><td>${h1.thi}</td><td style="color:var(--pink);font-weight:bold;">${t1}</td><td><b style="color:#4CAF50">${h1.hk || '-'}</b></td></tr><tr><td class="sticky-col"><b>HK2</b></td><td>${h2.m}</td><td>${h2.p}</td><td>${h2.t}</td><td>${h2.thi}</td><td style="color:var(--pink);font-weight:bold;">${t2}</td><td><b style="color:#4CAF50">${h2.hk || '-'}</b></td></tr><tr><td class="sticky-col"><b>CẢ NĂM</b></td><td colspan="4" style="text-align:right"><b>TỔNG KẾT:</b></td><td colspan="2" style="color:red;font-size:18px;font-weight:bold;">${cn}</td></tr></table></div>`;
        }
    });
};
// ==========================================
// PHẦN 6: QUẢN LÝ KẾT NỐI & HỒ SƠ CÁ NHÂN
// ==========================================

window.copyMyLink = () => { 
    const link = location.origin + location.pathname + '?user=' + window.session.id; 
    navigator.clipboard.writeText(link).then(() => window.showCustomAlert("✅ Đã sao chép liên kết cá nhân của bạn!")); 
};

window.searchConnectUser = () => { 
    const val = document.getElementById('connect-search-id').value.trim().toLowerCase(); 
    if(!val) return; 

    // 1. Ưu tiên tìm theo ID chính xác trước
    if (window.allUsersMap && window.allUsersMap[val]) {
        if(typeof window.openUserProfile === 'function') return window.openUserProfile(val); 
    }

    // 2. Nếu không ra ID, quét tìm theo Tên thật
    if (window.allUsersMap) {
        for (let uid in window.allUsersMap) {
            if (window.allUsersMap[uid].name.toLowerCase().includes(val)) {
                if(typeof window.openUserProfile === 'function') return window.openUserProfile(uid);
            }
        }
    }

    // 3. Báo lỗi nếu không có ai khớp
    if(typeof window.showCustomAlert === 'function') {
        window.showCustomAlert("KHÔNG TÌM THẤY", "Không tìm thấy ai có ID hoặc Tên này trên hệ thống!", "❌");
    } else {
        alert("Không tìm thấy người dùng này!");
    }
};


window.startQRScanner = () => {
    document.getElementById('qr-scanner-container').classList.remove('hidden');
    if (!window.html5QrcodeScanner) {
        window.html5QrcodeScanner = new Html5QrcodeScanner("connect-qr-reader", { fps: 15, qrbox: 250 }, false);
        window.html5QrcodeScanner.render((decodedText) => {
            if (decodedText.includes('user=')) { 
                window.stopQRScanner(); 
                let uid = decodedText.split('user=')[1].split('&')[0]; 
                if(typeof window.openUserProfile === 'function') window.openUserProfile(uid); 
            } else { 
                window.showCustomAlert("❌ LỖI: Mã QR này không thuộc hệ thống lớp học!"); 
            }
        }, (err) => { /* Bỏ qua lỗi khi chưa quét trúng mã */ });
    }
};

window.stopQRScanner = () => { 
    if (window.html5QrcodeScanner) { 
        window.html5QrcodeScanner.clear(); 
        window.html5QrcodeScanner = null; 
    } 
    document.getElementById('qr-scanner-container').classList.add('hidden'); 
};

window.loadMyProfileTab = () => {
    if(!window.session) return;
    window.db.ref('users/' + window.session.id).once('value').then(s => {
        const u = s.val() || {}; 
        document.getElementById('my-tab-name').innerText = u.name || window.session.name; 
        document.getElementById('my-tab-id').innerText = "ID: " + window.session.id.toUpperCase(); 
        document.getElementById('my-tab-avatar').src = u.avatar || window.session.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        
        const bYear = document.getElementById('my-tab-birthyear');
        if(bYear) bYear.innerText = u.birthYear ? "🎂 Sinh năm: " + u.birthYear : "";
        
        const quoteEl = document.getElementById('my-tab-quote'); 
        if (quoteEl) {
            if (u.quote) { 
                quoteEl.innerHTML = "❝ " + window.escapeHTML(u.quote) + " ❞"; 
                quoteEl.classList.remove('hidden'); 
            } else { 
                quoteEl.classList.add('hidden'); 
            }
        }
        
        const bioEl = document.getElementById('my-tab-bio');
        if(bioEl) bioEl.innerHTML = window.escapeHTML(u.bio) || "Chưa có tiểu sử...";
        
        const cohortEl = document.getElementById('my-tab-cohort'); 
        if (cohortEl) {
            if (u.role === 'cuu_hs' && u.cohort) { 
                cohortEl.innerText = `🎓 ${u.cohort}`; 
                cohortEl.classList.remove('hidden'); 
            } else { 
                cohortEl.classList.add('hidden'); 
            }
        }
    });
};

window.openSelfEdit = () => { 
    window.db.ref('users/' + window.session.id).once('value').then(s => { 
        const u = s.val() || {}; 
        document.getElementById('self-birthyear').value = u.birthYear || ''; 
        document.getElementById('self-quote').value = u.quote || ''; 
        document.getElementById('self-bio').value = u.bio || ''; 
        window.toggleModal('user-profile-modal', false); 
        window.toggleModal('self-edit-modal', true); 
    }); 
};

window.saveSelfProfile = () => { 
    const by = document.getElementById('self-birthyear').value.trim(); 
    const quote = document.getElementById('self-quote').value.trim(); 
    const bio = document.getElementById('self-bio').value.trim(); 
    
    window.db.ref('users/' + window.session.id).update({ 
        birthYear: by, 
        quote: quote, 
        bio: bio 
    }).then(() => { 
        window.showCustomAlert("✅ Cập nhật hồ sơ thành công!"); 
        window.toggleModal('self-edit-modal', false); 
        window.loadMyProfileTab(); 
        if(typeof window.openUserProfile === 'function') window.openUserProfile(window.session.id);
    }); 
};
// ==========================================
// PHẦN 7: XEM HỒ SƠ & QUẢN LÝ BẠN BÈ
// ==========================================

window.openUserProfile = (uid) => {
    if (!uid) return;
    window.db.ref('users/' + uid).once('value').then(snap => {
        if (!snap.exists()) return window.showCustomAlert("❌ Không tìm thấy người dùng này!");
        const u = snap.val();
        
        document.getElementById('profile-name').innerText = u.name;
        document.getElementById('profile-id').innerText = "ID: " + uid.toUpperCase();
        document.getElementById('profile-avatar').src = u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        document.getElementById('profile-avatar').classList.remove('hidden');
        
        const bYear = document.getElementById('profile-birthyear');
        if(bYear) bYear.innerText = u.birthYear ? "🎂 Sinh năm: " + u.birthYear : "";

        const quoteEl = document.getElementById('profile-quote');
        if(u.quote) { 
            quoteEl.innerHTML = "❝ " + window.escapeHTML(u.quote) + " ❞"; 
            quoteEl.classList.remove('hidden'); 
        } else { 
            quoteEl.classList.add('hidden'); 
        }

        const bioEl = document.getElementById('profile-bio');
        bioEl.innerHTML = window.escapeHTML(u.bio) || "Người này khá bí ẩn, chưa viết tiểu sử...";

        const friendBtn = document.getElementById('profile-friend-btn');
        const chatBtn = document.getElementById('profile-chat-btn');
        const editBtn = document.getElementById('profile-self-edit-btn');

        friendBtn.classList.add('hidden');
        chatBtn.classList.add('hidden');
        editBtn.classList.add('hidden');

        if (uid === window.session.id) {
            editBtn.classList.remove('hidden');
        } else {
            window.db.ref(`friends/${window.session.id}/${uid}`).once('value').then(fSnap => {
                const status = fSnap.val();
                
                if (status === 'accepted') {
                    chatBtn.classList.remove('hidden');
                    chatBtn.onclick = () => { window.toggleModal('user-profile-modal', false); if(typeof window.openDirectChat === 'function') window.openDirectChat(uid); };
                    friendBtn.innerText = "❤️ BẠN BÈ";
                    friendBtn.style.background = "#e91e63";
                    friendBtn.classList.remove('hidden');
                    friendBtn.onclick = null;
                } else if (status === 'pending') {
                    friendBtn.innerText = "⏳ ĐÃ GỬI LỜI MỜI";
                    friendBtn.style.background = "#888";
                    friendBtn.classList.remove('hidden');
                    friendBtn.onclick = null;
                } else if (status === 'requested') {
                    // XỬ LÝ KHI NGƯỜI KHÁC GỬI LỜI MỜI CHO MÌNH
                    friendBtn.innerText = "✅ CHẤP NHẬN";
                    friendBtn.style.background = "#4CAF50";
                    friendBtn.classList.remove('hidden');
                    friendBtn.onclick = () => {
                        window.acceptFriend(uid);
                        window.toggleModal('user-profile-modal', false);
                    };
                } else {
                    friendBtn.innerText = "➕ KẾT BẠN";
                    friendBtn.style.background = "#1877F2";
                    friendBtn.classList.remove('hidden');
                    friendBtn.onclick = () => window.sendFriendRequest(uid);
                }
            });
        }
        window.toggleModal('user-profile-modal', true);
    });
};

window.sendFriendRequest = (targetId) => {
    if (targetId === window.session.id) return;
    window.db.ref(`friends/${window.session.id}/${targetId}`).set('pending');
    window.db.ref(`friends/${targetId}/${window.session.id}`).set('requested').then(() => {
        window.showCustomAlert("🚀 Đã gửi lời mời kết bạn thành công!");
        window.openUserProfile(targetId);
    });
};

window.loadFriendRequests = () => {
    window.db.ref(`friends/${window.session.id}`).on('value', snap => {
        const data = snap.val() || {};
        let html = '';
        let count = 0;
        for (let uid in data) {
            if (data[uid] === 'requested') {
                count++;
                const u = window.allUsersMap?.[uid] || { name: uid.toUpperCase() };
                html += `<div class="card shadow-lux" style="display:flex; justify-content:space-between; align-items:center; padding:10px;">
                    <b>${u.name}</b>
                    <div>
                        <button class="btn-royal" style="padding:5px 10px; background:#4CAF50; font-size:12px;" onclick="window.acceptFriend('${uid}')">ĐỒNG Ý</button>
                        <button class="btn-royal" style="padding:5px 10px; background:#dc3545; font-size:12px;" onclick="window.rejectFriend('${uid}')">XÓA</button>
                    </div>
                </div>`;
            }
        }
        const zone = document.getElementById('friend-requests-zone');
        const list = document.getElementById('friend-requests-list');
        if (count > 0) {
            zone.classList.remove('hidden');
            list.innerHTML = html;
        } else {
            zone.classList.add('hidden');
        }
        window.renderFriendList(data);
    });
};

window.acceptFriend = (uid) => {
    const updates = {};
    updates[`friends/${window.session.id}/${uid}`] = 'accepted';
    updates[`friends/${uid}/${window.session.id}`] = 'accepted';
    window.db.ref().update(updates).then(() => window.showCustomAlert("🎉 Hai bạn đã trở thành bạn bè!"));
};

window.rejectFriend = (uid) => {
    if(confirm("Xác nhận xóa liên kết với người này?")) {
        window.db.ref(`friends/${window.session.id}/${uid}`).remove();
        window.db.ref(`friends/${uid}/${window.session.id}`).remove();
    }
};

window.renderFriendList = (friendData) => {
    let html = '';
    let count = 0;
    for (let uid in friendData) {
        if (friendData[uid] === 'accepted') {
            count++;
            const u = window.allUsersMap?.[uid] || { name: uid.toUpperCase() };
            const avt = u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
            html += `<button class="tt-item" onclick="window.openUserProfile('${uid}')">
                <div class="tt-avt-wrap"><img src="${avt}" class="tt-avt"></div>
                <div class="tt-info"><div class="tt-name">${u.name}</div><span class="tt-preview">ID: ${uid.toUpperCase()}</span></div>
                <div class="tt-action"><i class="fa-solid fa-chevron-right"></i></div>
            </button>`;
        }
    }
    const friendsListEl = document.getElementById('my-friends-list');
    if(friendsListEl) {
        friendsListEl.innerHTML = html || '<p style="text-align:center; color:#888; font-size:13px; margin-top:20px;">Chưa có bạn bè trong danh sách.</p>';
    }
    const badgeEl = document.getElementById('friend-count-badge');
    if(badgeEl) badgeEl.innerText = count;
};
// ==========================================
// PHẦN 8: QUẢN LÝ ĐIỂM SỐ & XUẤT EXCEL
// ==========================================

// TẢI BẢNG ĐIỂM TỔNG HỢP (DÀNH CHO ADMIN & GIÁO VIÊN)
window.loadMasterGrades = () => {
    if (!window.db || !window.session) return;
    window.db.ref('grades').on('value', sGrades => {
        const gradesData = sGrades.val() || {};
        window.db.ref('users').once('value').then(sUsers => {
            const usersData = sUsers.val() || {};
            let html = '';
            for (let id in usersData) {
                const u = usersData[id];
                // Chỉ hiển thị học sinh và cựu học sinh trong bảng điểm
                if (u.role !== 'hs' && u.role !== 'cuu_hs') continue;
                
                const g = gradesData[id] || {};
                const h1 = g.hk1 || { m:0, p:0, t:0, thi:0 };
                const h2 = g.hk2 || { m:0, p:0, t:0, thi:0 };
                
                const t1 = window.calcGPA(h1.m, h1.p, h1.t, h1.thi);
                const t2 = window.calcGPA(h2.m, h2.p, h2.t, h2.thi);
                const cn = window.calcYearly(t1, t2);

                html += `<tr onclick="window.openEditScore('${id}', '${u.name}')" style="cursor:pointer;">
                    <td class="sticky-col"><b>${u.name}</b><br><small>${id.toUpperCase()}</small></td>
                    <td>${h1.m}</td><td>${h1.p}</td><td>${h1.t}</td><td>${h1.thi}</td><td style="background:var(--soft); font-weight:bold;">${t1}</td>
                    <td>${h2.m}</td><td>${h2.p}</td><td>${h2.t}</td><td>${h2.thi}</td><td style="background:var(--soft); font-weight:bold;">${t2}</td>
                    <td style="color:red; font-weight:bold;">${cn}</td>
                </tr>`;
            }
            const body = document.getElementById('master-grade-body');
            if(body) {
                body.innerHTML = html || '<tr><td colspan="12" style="text-align:center; padding:20px;">Chưa có dữ liệu điểm học sinh</td></tr>';
            }
        });
    });
};

// MỞ CỬA SỔ SỬA ĐIỂM CHO TỪNG HỌC SINH
window.openEditScore = (id, name) => {
    // Chỉ Admin và Giáo viên mới có quyền sửa điểm
    if (window.session.role !== 'admin' && window.session.role !== 'gv') return;
    
    const idInput = document.getElementById('score-u-id');
    const nameDisp = document.getElementById('score-u-name');
    if(idInput) idInput.value = id;
    if(nameDisp) nameDisp.innerText = name + " (" + id.toUpperCase() + ")";
    
    window.loadStudentScoreIntoModal();
    window.toggleModal('score-modal', true);
};

// ĐƯA DỮ LIỆU ĐIỂM TỪ FIREBASE VÀO CÁC Ô NHẬP LIỆU TRONG MODAL
window.loadStudentScoreIntoModal = () => {
    const id = document.getElementById('score-u-id').value;
    const term = document.getElementById('score-term').value;
    if(!id) return;

    window.db.ref(`grades/${id}/hk${term}`).once('value').then(s => {
        const d = s.val() || { m:0, p:0, t:0, thi:0, hk:'Tốt' };
        document.getElementById('score-m').value = d.m || 0;
        document.getElementById('score-15p').value = d.p || 0;
        document.getElementById('score-1t').value = d.t || 0;
        document.getElementById('score-thi').value = d.thi || 0;
        document.getElementById('score-conduct').value = d.hk || 'Tốt';
    });
};

// XÁC NHẬN LƯU ĐIỂM MỚI LÊN FIREBASE
window.confirmSaveScore = () => {
    const id = document.getElementById('score-u-id').value;
    const term = document.getElementById('score-term').value;
    if(!id) return;

    let vm = parseFloat(document.getElementById('score-m').value) || 0;
    let vp = parseFloat(document.getElementById('score-15p').value) || 0;
    let vt = parseFloat(document.getElementById('score-1t').value) || 0;
    let vthi = parseFloat(document.getElementById('score-thi').value) || 0;

    if (vm < 0 || vm > 10 || vp < 0 || vp > 10 || vt < 0 || vt > 10 || vthi < 0 || vthi > 10) {
        if(typeof window.showCustomAlert === 'function') {
            return window.showCustomAlert('LỖI DỮ LIỆU', 'Điểm số phải nằm trong khoảng từ 0 đến 10!', '❌');
        } else {
            return alert('LỖI: Điểm số phải nằm trong khoảng từ 0 đến 10!');
        }
    }

    const data = { m: vm, p: vp, t: vt, thi: vthi, hk: document.getElementById('score-conduct').value };

    window.db.ref(`grades/${id}/hk${term}`).set(data).then(() => {
        if(typeof window.showCustomAlert === 'function') {
            window.showCustomAlert('THÀNH CÔNG', 'Đã cập nhật điểm số mới!', '✅');
        } else {
            window.showCustomAlert("✅ Đã cập nhật điểm thành công!");
        }
        window.toggleModal('score-modal', false);
    }).catch(err => {
        window.showCustomAlert("❌ Lỗi khi lưu điểm: " + err.message);
    });
};


// XUẤT TOÀN BỘ BẢNG ĐIỂM RA FILE EXCEL (GIỮ NGUYÊN MÀU SẮC VÀ FORMAT)
window.exportExcel = () => {
    const table = document.querySelector('.master-table');
    if (!table) return window.showCustomAlert("Không tìm thấy dữ liệu bảng điểm để xuất!");

    // Lấy toàn bộ HTML của bảng, giữ nguyên thead (các cột gộp) và tbody
    const tableHTML = table.outerHTML;

    // Tạo cấu trúc HTML chuẩn kèm CSS nội bộ để Excel hiểu được màu sắc, viền, và ô gộp (colspan/rowspan)
    const htmlTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <style>
                table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
                th, td { border: 1px solid #000000; padding: 8px; text-align: center; vertical-align: middle; }
                th { background-color: #ff4d94; color: #ffffff; font-weight: bold; }
                
                /* Làm nổi bật Tên học sinh */
                td:first-child { text-align: left; font-weight: bold; background-color: #f8f9fa; }
                
                /* Tô màu nhẹ cho các cột điểm trung bình (TB) HK1, HK2 để dễ nhìn */
                td:nth-child(6), td:nth-child(11) { background-color: #ffeef2; font-weight: bold; color: #ff4d94; }
                
                /* Bôi đỏ điểm Cả Năm */
                td:last-child { color: red; font-weight: bold; font-size: 16px; background-color: #fff0f0; }
            </style>
        </head>
        <body>
            <h2 style="text-align: center; color: #ff4d94; font-family: Arial, sans-serif;">BẢNG ĐIỂM TỔNG KẾT - LỚP HỌC CÔNG GIÁO</h2>
            <br>
            ${tableHTML}
            <br>
            <p style="text-align: right; font-style: italic;">Ngày xuất: ${window.getDateStr()}</p>
        </body>
        </html>
    `;

    // Dùng Blob xuất thẳng ra file .xls
    const blob = new Blob(['\ufeff', htmlTemplate], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Bang_Diem_Tong_Ket_" + window.getDateStr() + ".xls";
    document.body.appendChild(link);
    link.click();
    
    // Dọn dẹp bộ nhớ sau khi tải xong
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Báo thành công
    if(typeof window.showCustomAlert === 'function') {
        window.showCustomAlert('THÀNH CÔNG', 'Đã tải xuống file Excel bảng điểm!', '✅');
    }
};

// ==========================================
// PHẦN 9: HỆ THỐNG CHAT & TẢI ẢNH (IMGBB)
// ==========================================

// ĐIỀU PHỐI CÁC KÊNH CHAT
window.openChatChannel = (type) => {
    // 1. Cập nhật màu sắc nút bấm
    const btnMap = { 'global': 'btn-chat-global', 'private': 'btn-chat-private', 'group': 'btn-chat-group' };
    for (let k in btnMap) {
        const btn = document.getElementById(btnMap[k]);
        if (btn) {
            btn.style.background = (k === type) ? 'var(--pink)' : 'var(--border)';
            btn.style.color = (k === type) ? 'white' : 'var(--text)';
        }
    }

    // 2. Ẩn tất cả các vùng và vùng giám sát
    const zones = ['chat-global-zone', 'chat-private-zone', 'chat-group-zone', 'admin-spy-zone'];
    zones.forEach(z => {
        const el = document.getElementById(z);
        if (el) el.classList.add('hidden');
    });

    // 3. Xử lý hiển thị từng Tab
    if (type === 'global') {
        const gZone = document.getElementById('chat-global-zone');
        if (gZone) {
            gZone.classList.remove('hidden');
            window.loadGlobalChat(); // Tải tin nhắn chung
        }
    } 
    else if (type === 'private') {
        const pZone = document.getElementById('chat-private-zone');
        if (pZone) {
            pZone.classList.remove('hidden');
            const hasConvo = !!window.currentPrivateConvo;
            
            // Nếu Boss ĐANG nhắn tin (Spying hoặc nhắn thật) thì hiện khung chat, không thì hiện danh sách
            const sView = document.getElementById('private-search-view');
            const cArea = document.getElementById('private-chat-area');
            if (sView && cArea) {
                sView.classList[hasConvo ? 'add' : 'remove']('hidden');
                cArea.classList[hasConvo ? 'remove' : 'add']('hidden');
            }

            // Nếu là Admin và KHÔNG nhắn tin dở, hiện vùng giám sát
            if (window.session?.role === 'admin' && !hasConvo) {
                const spy = document.getElementById('admin-spy-zone');
                if (spy) spy.classList.remove('hidden');
                if (sView) sView.classList.add('hidden'); // Admin dùng Spy thay cho danh sách thường
            } else {
                window.renderRecentChats();
            }
        }
    } 
    else if (type === 'group') {
        const grpZone = document.getElementById('chat-group-zone');
        if (grpZone) {
            grpZone.classList.remove('hidden');
            const hasGrp = !!window.currentGroupChat;
            
            const gListView = document.getElementById('group-list-view');
            const gChatArea = document.getElementById('group-chat-area');
            
            if (gListView && gChatArea) {
                // Nếu đang trong nhóm thì hiện khung chat
                gListView.classList[hasGrp ? 'add' : 'remove']('hidden');
                gChatArea.classList[hasGrp ? 'remove' : 'add']('hidden');
            }

            // QUAN TRỌNG: Admin vẫn cần load danh sách nhóm để Quản lý
            if (!hasGrp) {
                window.loadGroups(); 
                // Chỉ hiện Spy zone nếu Boss muốn (có thể để hiện song song hoặc ẩn tùy ý)
                // Ở đây mình cho hiện danh sách Nhóm trước để Boss còn bấm "Tạo nhóm mới"
            }
        }
    }
};

// TẢI DỮ LIỆU CHAT CHUNG
window.loadGlobalChat = () => {
    const box = document.getElementById('global-chat-box');
    const ind = document.getElementById('global-typing-indicator');
    if (window.currentChatRef) window.currentChatRef.off();
    if (window.typingRef) window.typingRef.off(); 
    if (box) box.innerHTML = ''; 

    const villageId = 'global_' + window.currentVillage; 
    const dbPath = 'chat/' + villageId;
    window.currentChatRef = window.db.ref(dbPath).limitToLast(30);

    // Xử lý khi có tin nhắn mới
    window.currentChatRef.on('child_added', snap => {
        const m = snap.val();
        if (m.id !== window.session.id && typeof window.pushNoti === 'function') {
            window.pushNoti("💬 Làng: " + m.name, m.text);
        }
        const isAtBottom = box ? (box.scrollHeight - box.scrollTop - box.clientHeight) < 50 : false;
        if(box) box.insertAdjacentHTML('beforeend', window.renderMessage(m, window.session && m.id === window.session.id, snap.key, villageId, 'global'));
        if(box && (isAtBottom || m.id === window.session.id)) box.scrollTop = box.scrollHeight;
    });

    // BẢN VÁ: Cập nhật ngay lập tức khi thả biểu cảm
    window.currentChatRef.on('child_changed', snap => {
        const m = snap.val();
        const msgEl = document.getElementById(`msg-${snap.key}`);
        if (msgEl) {
            msgEl.outerHTML = window.renderMessage(m, window.session && m.id === window.session.id, snap.key, villageId, 'global');
        }
    });

    window.typingRef = window.db.ref(`typing/${villageId}/global`);
    window.typingRef.on('value', snap => {
        let t = [];
        snap.forEach(c => { if(window.session && c.key !== window.session.id) t.push(c.val()); });
        if(ind) {
            if(t.length > 0) { ind.innerText = `${t.join(', ')} đang gõ...`; ind.classList.remove('hidden'); } 
            else ind.classList.add('hidden');
        }
    });
};


window.sendGlobalChat = () => {
    const input = document.getElementById('global-chat-input');
    const txt = input.value.trim();
    if (!txt || !window.session) return;
    window.db.ref('chat/global_' + window.currentVillage).push({
        id: window.session.id,
        name: window.session.name,
        text: txt,
        time: firebase.database.ServerValue.TIMESTAMP
    });
    input.value = '';
    window.db.ref(`typing/global_${window.currentVillage}/global/${window.session.id}`).remove();
};
// BỔ SUNG VÀO PHẦN 9 TRONG script.js

window.sendPrivateChat = () => {
    const input = document.getElementById('private-chat-input');
    const txt = input.value.trim();
    
    if (!txt || !window.session || !window.currentPrivateConvo) return;

    const payload = {
        id: window.session.id,
        name: window.session.name,
        text: txt,
        time: firebase.database.ServerValue.TIMESTAMP
    };

    window.db.ref('chat/private/' + window.currentPrivateConvo).push(payload).then(() => {
        // VÁ LỖI: Dùng thuật toán tách mảng để lấy ID người nhận chuẩn xác
        const ids = window.currentPrivateConvo.split('_');
        const targetId = ids[0] === window.session.id ? ids[1] : ids[0];
        
        window.db.ref('unread/' + targetId + '/' + window.session.id).set(true);
        
        input.value = ''; 
        window.db.ref(`typing/private/${window.currentPrivateConvo}/${window.session.id}`).remove();
    });
};

window.sendGroupChat = () => {
    const input = document.getElementById('group-chat-input');
    const txt = input.value.trim();
    
    if (!txt || !window.session || !window.currentGroupChat) return;

    window.db.ref('chat/group/' + window.currentGroupChat).push({
        id: window.session.id,
        name: window.session.name,
        text: txt,
        time: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        input.value = '';
        window.db.ref(`typing/group/${window.currentGroupChat}/${window.session.id}`).remove();
    });
};
// XỬ LÝ ẢNH TRONG CHAT
window.triggerChatImage = (type) => { 
    window.currentUploadType = type; 
    document.getElementById('chat-img-file').click(); 
};

window.uploadChatImage = async () => {
    const f = document.getElementById('chat-img-file').files[0];
    if(!f) return;
    window.showCustomAlert("⏳ Đang gửi ảnh...");
    const url = await window.uploadToImgBB(f);
    if(url) {
        const msgText = `[IMG]${url}[/IMG]`;
        const payload = { id: window.session.id, name: window.session.name, text: msgText, time: firebase.database.ServerValue.TIMESTAMP };
        
        if(window.currentUploadType === 'global') window.db.ref('chat/global_' + window.currentVillage).push(payload);
        else if (window.currentUploadType === 'private') {
            window.db.ref('chat/private/' + window.currentPrivateConvo).push(payload);
            const targetId = window.currentPrivateConvo.replace(window.session.id, '').replace('_', '');
            window.db.ref('unread/' + targetId + '/' + window.session.id).set(true);
        }
        else if (window.currentUploadType === 'group') window.db.ref('chat/group/' + window.currentGroupChat).push(payload);
    } else {
        window.showCustomAlert("❌ Gửi ảnh thất bại! Vui lòng kiểm tra lại kết nối hoặc dung lượng file.");
    }
    document.getElementById('chat-img-file').value = '';
};

window.unsendMsg = (type, convoId, msgKey) => {
    // 1. Gọi giao diện xác nhận Xịn xò thay cho confirm()
    window.showCustomConfirm("THU HỒI TIN NHẮN", "Tin nhắn này sẽ bị thu hồi với mọi người. Bạn có chắc không?", () => {
        
        // Kiểm tra an toàn: Chưa đăng nhập thì cút
        if (!window.session || !window.session.id) {
            return window.showCustomAlert("LỖI", "Bạn chưa đăng nhập!", "❌");
        }

        let refPath = type.startsWith('global') ? `chat/${type}/${msgKey}` : `chat/${type}/${convoId}/${msgKey}`;
        
        // 2. Nâng cấp cốt lõi: Tải tin nhắn về để check xem ai là chủ trước khi cho phép xóa
        window.db.ref(refPath).once('value').then(snap => {
            const msgData = snap.val();
            
            if (!msgData) {
                return window.showCustomAlert("LỖI", "Tin nhắn không tồn tại hoặc đã bị xóa!", "⚠️");
            }

            // CHỐNG HACK: Chỉ cho phép người gửi hoặc Admin được quyền thu hồi
            if (msgData.id === window.session.id || window.session.role === 'admin') {
                
                // Nếu đúng chủ nhân -> Xóa!
                window.db.ref(refPath).update({ text: '[UNSENT]' }).catch(err => {
                    window.showCustomAlert("LỖI", "Không thể thu hồi: " + err.message, "❌");
                });

            } else {
                // Nếu sai chủ nhân (cố tình dùng F12) -> Bắt quả tang
                window.showCustomAlert("CẢNH BÁO", "Chơi bẩn à? Bạn không có quyền thu hồi tin nhắn của người khác đâu!", "🚨");
            }
        });
    });
};


window.onChatInput = (type) => {
    let cId = (type === 'global') ? 'global' : (type === 'private' ? window.currentPrivateConvo : window.currentGroupChat);
    if(!cId) return;
    window.db.ref(`typing/${type}/${cId}/${window.session.id}`).set(window.session.name);
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => window.db.ref(`typing/${type}/${cId}/${window.session.id}`).remove(), 2000);
};
// ==========================================
// PHẦN 10: TIN NHẮN GẦN ĐÂY, NHÓM & ĐỌC LÉN
// ==========================================

// NÂNG CẤP: Danh sách gần đây gộp cả Cá nhân & Nhóm (Real-time)
window.renderRecentChats = () => {
    if(!window.session || !window.allUsersMap) return;
    const rList = document.getElementById('recent-chat-list');
    const onlineZone = document.getElementById('tt-online-zone');
    if(!rList) return;

    // VÁ LỖI: Tắt lắng nghe cũ trước khi bật cái mới để chống tràn RAM/trắng màn hình
    window.db.ref('chat_streaks').off('value');

    window.db.ref('chat_streaks').on('value', async (snap) => {
        let html = ''; let onlineHtml = '';
        const streaks = snap.val() || {};
        
        const [groupsSnap, trackSnap] = await Promise.all([
            window.db.ref('groups').once('value'),
            window.db.ref('tracking').once('value')
        ]);
        
        const groupsData = groupsSnap.val() || {};
        const trackData = trackSnap.val() || {};

        const sortedConvos = Object.keys(streaks).reverse();

        for (let convoId of sortedConvos) {
            if (convoId.includes('_') && convoId.includes(window.session.id)) {
                // VÁ LỖI NHỎ: Sử dụng split để bóc ID thay vì replace để tránh sai lệch tên
                const ids = convoId.split('_');
                const targetId = ids[0] === window.session.id ? ids[1] : ids[0];
                const u = window.allUsersMap[targetId]; 
                
                if(!u && targetId !== 'admin') continue;
                
                const tName = targetId === 'admin' ? 'BOSS QUÂN' : u.name;
                const tAvatar = targetId === 'admin' ? 'https://cdn-icons-png.flaticon.com/512/149/149071.png' : (u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png');
                const hasUnread = (window.unreadData && window.unreadData[targetId]);
                const isOnline = trackData[targetId] && trackData[targetId].status === 'online';
                
                html += `
                <button onclick="window.openDirectChat('${targetId}')" class="tt-item">
                    <div class="tt-avt-wrap">
                        <img src="${tAvatar}" class="tt-avt">
                        ${isOnline ? '<div class="tt-online-dot"></div>' : ''}
                    </div>
                    <div class="tt-info">
                        <div class="tt-name" style="${hasUnread ? 'color:var(--pink); font-weight:bold;' : ''}">${tName}</div>
                        <span class="tt-preview">${hasUnread ? '📩 Tin nhắn mới...' : 'Bấm để nhắn tin'}</span>
                    </div>
                    ${hasUnread ? '<div class="noti-dot"></div>' : ''}
                </button>`;

                if (isOnline) {
                    const shortName = tName.split(' ').pop();
                    onlineHtml += `
                    <div onclick="window.openDirectChat('${targetId}')" class="tt-top-item">
                        <img src="${tAvatar}" class="tt-top-avt">
                        <span class="tt-top-name">${shortName}</span>
                    </div>`;
                }
            } 
            else if (groupsData[convoId]) {
                const g = groupsData[convoId];
                if (g.members?.[window.session.id] || window.session.role === 'admin') {
                    html += `
                    <button onclick="window.switchTab('chat'); window.openChatChannel('group'); window.openGroupChat('${convoId}', '${g.name}', '${g.admin}')" class="tt-item">
                        <div class="tt-avt-wrap">
                            <div class="tt-avt" style="background:#ff0050; color:white; display:flex; justify-content:center; align-items:center; font-size:20px;">👥</div>
                        </div>
                        <div class="tt-info">
                            <div class="tt-name" style="color:#ff0050; font-weight:bold;">${g.name}</div>
                            <span class="tt-preview">Nhóm • Trưởng nhóm: ${g.admin.toUpperCase()}</span>
                        </div>
                    </button>`;
                }
            }
        }
        rList.innerHTML = html || '<p style="text-align:center; color:var(--text-light); font-size:13px; margin-top:20px;">Chưa có hội thoại nào.</p>';
        if(onlineZone) { onlineZone.innerHTML = onlineHtml; onlineZone.style.display = onlineHtml ? 'flex' : 'none'; }
    });
};

// Tìm hàm openDirectChat trong script.js và thêm dòng switchTab
window.openDirectChat = (uid) => {
    // Tự động chuyển sang tab chat trước khi mở cuộc hội thoại
    window.switchTab('chat'); 
    
    window.db.ref('users/'+uid).once('value').then(s => {
        const u = s.val() || { name: 'BOSS QUÂN', role: 'admin', allowPrivate: true };
        const tName = uid === 'admin' ? 'BOSS QUÂN' : u.name;
        
        // Đảm bảo tab "RIÊNG" được chọn
        window.openChatChannel('private');
        window.checkAndStartPrivateChat(uid, tName, u.allowPrivate !== false);
    });
};
window.checkAndStartPrivateChat = (targetId, targetName, allowPrivate) => {
    if (!allowPrivate && window.session.role !== 'admin') return window.showCustomAlert("🔕 Người này đã tắt nhận tin nhắn riêng!");
    
    document.getElementById('private-search-view').classList.add('hidden');
    document.getElementById('private-chat-area').classList.remove('hidden');
    document.getElementById('private-chat-input-zone').classList.remove('hidden');
    
    const dName = window.myNicknames[targetId] || targetName;
    document.getElementById('private-chat-title').innerHTML = `💬 ${dName} <span onclick="window.setNickname('${targetId}', '${dName}')" style="font-size:12px; cursor:pointer; color:var(--text-light); margin-left:5px;">✏️</span>`;
    
    if(typeof window.getConvoId === 'function') {
        window.currentPrivateConvo = window.getConvoId(window.session.id, targetId);
    } else {
        window.currentPrivateConvo = [window.session.id, targetId].sort().join('_');
    }
    
    window.db.ref('unread/' + window.session.id + '/' + targetId).remove();
    window.db.ref('chat_streaks/' + window.currentPrivateConvo).set(true);

    const box = document.getElementById('private-chat-box');
    if(box) box.innerHTML = '<div style="text-align:center;color:#888;margin-top:20px;">Hãy gửi lời chào! 👋</div>';

    if (window.currentChatRef) window.currentChatRef.off();
    window.currentChatRef = window.db.ref('chat/private/' + window.currentPrivateConvo).limitToLast(30);
    
    let isFirstLoad = true;
    
    window.currentChatRef.on('child_added', snap => {
        if (isFirstLoad && box) { box.innerHTML = ''; isFirstLoad = false; }
        const m = snap.val();
        const isAtBottom = box ? (box.scrollHeight - box.scrollTop - box.clientHeight) < 50 : false;
        if(box) box.insertAdjacentHTML('beforeend', window.renderMessage(m, m.id === window.session.id, snap.key, 'private', window.currentPrivateConvo));
        if(box && (isAtBottom || m.id === window.session.id)) box.scrollTop = box.scrollHeight;
    });

    window.currentChatRef.on('child_changed', snap => {
        const m = snap.val();
        const msgEl = document.getElementById(`msg-${snap.key}`);
        if (msgEl) {
            msgEl.outerHTML = window.renderMessage(m, m.id === window.session.id, snap.key, 'private', window.currentPrivateConvo);
        }
    });
};


window.closePrivateChat = () => {
    document.getElementById('private-chat-area').classList.add('hidden');
    document.getElementById('private-search-view').classList.remove('hidden');
    const spyZone = document.getElementById('admin-spy-zone');
    if(spyZone) spyZone.classList.add('hidden');
    if (window.currentChatRef) window.currentChatRef.off();
    window.currentPrivateConvo = "";
    window.isSpying = false;
};

// QUẢN LÝ NHÓM CHAT
window.loadGroups = () => {
    if(!window.session) return;
    window.db.ref('groups').on('value', snap => {
        let html = '';
        snap.forEach(child => {
            const grp = child.val();
            // CHỈ hiển thị ở khung Chat nếu thực sự là thành viên. Đọc lén thì Boss ra khu vực Giám sát.
            if (grp.members && grp.members[window.session.id]) {
                const avtHtml = grp.avatar ? `<img src="${grp.avatar}" class="tt-avt">` : `<div class="tt-avt" style="background:#ff0050; color:white; display:flex; justify-content:center; align-items:center;">👥</div>`;
                html += `<button class="tt-item" onclick="window.openGroupChat('${child.key}', '${grp.name}', '${grp.admin}')">
                    <div class="tt-avt-wrap">${avtHtml}</div>
                    <div class="tt-info"><div class="tt-name">${grp.name}</div><span class="tt-preview">Trưởng nhóm: ${grp.admin.toUpperCase()}</span></div>
                </button>`;
            }
        });
        const groupList = document.getElementById('my-groups-list');
        if(groupList) groupList.innerHTML = html || '<p style="text-align:center; color:#888; margin-top:20px;">Bạn chưa tham gia nhóm nào.</p>';
    });
};
window.openGroupChat = (grpId, grpName, adminId) => {
    document.getElementById('group-list-view').classList.add('hidden');
    document.getElementById('group-chat-area').classList.remove('hidden');
    document.getElementById('group-chat-input-zone').classList.remove('hidden');
    document.getElementById('group-chat-title').innerText = "👥 " + grpName;
    window.currentGroupChat = grpId;
    window.currentGroupAdmin = adminId;

    const box = document.getElementById('group-chat-box');
    if(box) box.innerHTML = '<div style="text-align:center;color:#888;margin-top:20px;">Nhóm mới tạo, hãy bắt đầu trò chuyện!</div>';

    if (window.currentChatRef) window.currentChatRef.off();
    window.currentChatRef = window.db.ref('chat/group/' + grpId).limitToLast(30);
    
    let isFirstLoad = true;

    window.currentChatRef.on('child_added', snap => {
        if (isFirstLoad && box) { box.innerHTML = ''; isFirstLoad = false; }
        const m = snap.val();
        const isAtBottom = box ? (box.scrollHeight - box.scrollTop - box.clientHeight) < 50 : false;
        if(box) box.insertAdjacentHTML('beforeend', window.renderMessage(m, m.id === window.session.id, snap.key, 'group', grpId));
        if(box && (isAtBottom || m.id === window.session.id)) box.scrollTop = box.scrollHeight;
    });

    window.currentChatRef.on('child_changed', snap => {
        const m = snap.val();
        const msgEl = document.getElementById(`msg-${snap.key}`);
        if (msgEl) {
            msgEl.outerHTML = window.renderMessage(m, m.id === window.session.id, snap.key, 'group', grpId);
        }
    });
};


window.closeGroupChat = () => {
    document.getElementById('group-chat-area').classList.add('hidden');
    document.getElementById('group-list-view').classList.remove('hidden');
    const spyZone = document.getElementById('admin-spy-zone');
    if(spyZone) spyZone.classList.add('hidden');
    if (window.currentChatRef) window.currentChatRef.off();
    window.currentGroupChat = "";
    window.isSpying = false;
};

// TÍNH NĂNG ĐỌC LÉN (ADMIN SPY)
window.loadAdminSpy = () => {
    if (!window.session || window.session.role !== 'admin') return;
    window.db.ref('chat_streaks').on('value', snap => {
        let html = '';
        snap.forEach(child => {
            const convoId = child.key;
            if(convoId.includes('_')) {
                const ids = convoId.split('_');
                const n1 = window.allUsersMap?.[ids[0]]?.name || ids[0];
                const n2 = window.allUsersMap?.[ids[1]]?.name || ids[1];
                html += `<div class="spy-convo-item card shadow-lux" style="padding:15px; cursor:pointer; margin-bottom:10px; border-left:4px solid #dc3545;" onclick="window.spyPrivateChat('${ids[0]}', '${ids[1]}')">
                    <div style="font-weight:bold; color:var(--pink);">${n1} 💬 ${n2}</div>
                    <div style="font-size:11px; color:#888;">ID: ${ids[0]} & ${ids[1]}</div>
                </div>`;
            } else if (convoId.startsWith('grp_')) {
                html += `<div class="spy-convo-item card shadow-lux" style="padding:15px; cursor:pointer; margin-bottom:10px; border-left:4px solid #9C27B0;" onclick="window.spyGroupChat('${convoId}')">
                    <div style="font-weight:bold; color:#9C27B0;">👥 NHÓM: ${convoId}</div>
                </div>`;
            }
        });
        const list = document.getElementById('admin-convo-list');
        if(list) list.innerHTML = html || '<p style="text-align:center;color:#888;">Chưa có dữ liệu hội thoại.</p>';
    });
};

window.spyPrivateChat = (id1, id2) => {
    let convoId = '';
    if(typeof window.getConvoId === 'function') convoId = window.getConvoId(id1, id2);
    else convoId = [id1, id2].sort().join('_');
    
    window.isSpying = true;
    document.getElementById('admin-spy-zone').classList.add('hidden');
    document.getElementById('private-chat-area').classList.remove('hidden');
    document.getElementById('private-chat-input-zone').classList.add('hidden'); 
    document.getElementById('private-chat-title').innerText = "🕵️ Đọc lén: " + id1.toUpperCase() + " & " + id2.toUpperCase();
    
    if (window.currentChatRef) window.currentChatRef.off();
    window.currentChatRef = window.db.ref('chat/private/' + convoId);
    window.currentChatRef.on('value', snap => {
        let html = '';
        snap.forEach(child => {
            const m = child.val();
            html += window.renderMessage(m, m.id === id1, child.key, 'private', convoId);
        });
        const box = document.getElementById('private-chat-box');
        if(box) {
            box.innerHTML = html || '<div style="text-align:center;color:#888;margin-top:20px;">Trống!</div>';
            setTimeout(() => { box.scrollTop = box.scrollHeight; }, 100);
        }
    });
};

window.spyGroupChat = (grpId) => {
    window.isSpying = true;
    document.getElementById('admin-spy-zone').classList.add('hidden');
    document.getElementById('group-chat-area').classList.remove('hidden');
    document.getElementById('group-chat-input-zone').classList.add('hidden');
    document.getElementById('group-chat-title').innerText = "🕵️ Đọc lén nhóm: " + grpId;

    if (window.currentChatRef) window.currentChatRef.off();
    window.currentChatRef = window.db.ref('chat/group/' + grpId);
    window.currentChatRef.on('value', snap => {
        let html = '';
        snap.forEach(child => {
            const m = child.val();
            html += window.renderMessage(m, false, child.key, 'group', grpId);
        });
        const box = document.getElementById('group-chat-box');
        if(box) {
            box.innerHTML = html || '<div style="text-align:center;color:#888;margin-top:20px;">Trống!</div>';
            setTimeout(() => { box.scrollTop = box.scrollHeight; }, 100);
        }
    });
};
// ==========================================
// PHẦN 11: QUẢN LÝ NHÓM & BẢO TRÌ HỆ THỐNG
// ==========================================

// QUẢN LÝ THÀNH VIÊN TRONG NHÓM
window.openGroupManageModal = () => {
    if(!window.currentGroupChat) return;
    window.db.ref('groups/' + window.currentGroupChat).once('value').then(snap => {
        const grp = snap.val();
        const isAdmin = (window.session.id === grp.admin); // Chỉ người tạo nhóm mới là Trưởng
        
        const statusEl = document.getElementById('group-admin-status');
        if(statusEl) statusEl.innerText = isAdmin ? "👑 Quản trị viên (Trưởng nhóm)" : "👤 Thành viên";
        
        const addZone = document.getElementById('group-add-member-zone');
        if(addZone) addZone.classList[isAdmin ? 'remove' : 'add']('hidden');
        
        const avtZone = document.getElementById('group-avatar-zone');
        if(avtZone) avtZone.classList[isAdmin ? 'remove' : 'add']('hidden');
        
        let html = '';
        for(let uid in grp.members) {
            let kickBtn = (isAdmin && uid !== grp.admin) ? `<button style="color:red; background:none; border:none; cursor:pointer;" onclick="window.kickGroupMember('${uid}')">❌ Đuổi</button>` : '';
            let roleTxt = (uid === grp.admin) ? '👑 Trưởng nhóm' : '👤 Thành viên';
            html += `<li style="padding:10px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
                <span><b style="color:var(--pink);">${uid.toUpperCase()}</b> <small>(${roleTxt})</small></span> ${kickBtn}
            </li>`;
        }
        if(!isAdmin) html += `<button style="width:100%; margin-top:15px; padding:10px; background:#dc3545; color:white; border:none; border-radius:10px;" onclick="window.leaveGroup()">🚪 RỜI NHÓM</button>`;
        
        const memberList = document.getElementById('group-member-list');
        if(memberList) memberList.innerHTML = html;
        window.toggleModal('group-manage-modal', true);
    });
};

window.copyGroupLink = () => {
    const link = location.origin + location.pathname + '?joingroup=' + window.currentGroupChat;
    navigator.clipboard.writeText(link).then(() => window.showCustomAlert("✅ Đã copy link nhóm! Hãy gửi cho bạn bè để họ tham gia."));
};

window.addGroupMember = () => {
    const uidInput = document.getElementById('new-member-id');
    const uid = uidInput ? uidInput.value.toLowerCase().trim() : '';
    if(!uid) return;
    
    window.db.ref('users/'+uid).once('value').then(s => {
        if(!s.exists()) return window.showCustomAlert("❌ ID không tồn tại trên hệ thống!");
        window.db.ref(`groups/${window.currentGroupChat}/members/${uid}`).set(true).then(() => {
            window.showCustomAlert("✅ Đã thêm người này vào nhóm!");
            if(uidInput) uidInput.value = '';
            window.openGroupManageModal();
        });
    });
};

window.leaveGroup = () => {
    // VÁ LỖI: Chặn trưởng nhóm rời đi
    if (window.currentGroupAdmin === window.session.id) {
        if(typeof window.showCustomAlert === 'function') {
            return window.showCustomAlert("KHÔNG THỂ RỜI ĐI", "Bạn là Trưởng nhóm! Không thể bỏ mặc anh em. Đề nghị không tự ý rời nhóm.", "⚠️");
        } else {
            return alert("Bạn là Trưởng nhóm, không thể rời đi!");
        }
    }

    if(confirm("🚪 Bạn có chắc muốn rời khỏi nhóm này?")) {
        window.db.ref(`groups/${window.currentGroupChat}/members/${window.session.id}`).remove().then(() => {
            if(typeof window.showCustomAlert === 'function') {
                window.showCustomAlert("THÀNH CÔNG", "Đã rời nhóm thành công!", "✅");
            }
            window.toggleModal('group-manage-modal', false);
            if(typeof window.closeGroupChat === 'function') window.closeGroupChat();
            if(typeof window.loadGroups === 'function') window.loadGroups();
        });
    }
};
 

window.kickGroupMember = (uid) => {
    if(confirm("❌ Bạn có chắc muốn xóa người này khỏi nhóm?")) {
        window.db.ref(`groups/${window.currentGroupChat}/members/${uid}`).remove().then(() => {
            window.openGroupManageModal();
        });
    }
};

// CHỨC NĂNG BẢO TRÌ HỆ THỐNG
window.updateMaintenanceUI = () => {
    const mScreen = document.getElementById('maintenance-screen');
    if (!mScreen) return;
    
    // Nếu đang bảo trì, và chưa vượt rào thành công, thì hiện màn hình bảo trì
    if (window.isMaintenance && !window.maintenanceBypass) {
        mScreen.classList.remove('hidden');
    } else {
        mScreen.classList.add('hidden');
    }
};

window.revealMaintenancePin = () => { 
    const pinZone = document.getElementById('maintenance-pin-zone');
    if(pinZone) pinZone.classList.toggle('hidden'); 
};

window.verifyMaintenancePin = () => {
    const pinInput = document.getElementById('maintenance-pin-input');
    const pin = pinInput ? pinInput.value : '';
    
    // Gọi trực tiếp lên Firebase để kiểm tra, không lưu trữ ở Client
    window.db.ref('config/clearPin').once('value').then(snap => {
        const realPin = snap.val() || "654321"; // Lấy PIN từ server
        if (pin === realPin) {
            window.maintenanceBypass = true;
            window.updateMaintenanceUI();
            window.showCustomAlert('CHẾ ĐỘ BOSS', 'Đã mở khóa lối vào thành công!', '🔓');
        } else {
            window.showCustomAlert('TRUY CẬP BỊ CHẶN', 'Sai mã PIN! Vui lòng thử lại.', '❌');
        }
    }).catch(err => {
        window.showCustomAlert('LỖI KẾT NỐI', 'Không thể xác thực với máy chủ!', '🚨');
    });
};


// CÔNG CỤ TẢI ẢNH LÊN IMGBB
window.uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${window.IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const json = await res.json();
        return json.success ? json.data.url : null;
    } catch (e) {
        console.error("Lỗi ImgBB:", e);
        return null;
    }
};

// ADMIN CẤP ẢNH ĐẠI DIỆN CHO HỌC SINH
window.grantAvatar = async () => {
    const targetIdInput = document.getElementById('avatar-target-id');
    const targetId = targetIdInput ? targetIdInput.value.trim().toLowerCase() : '';
    
    if (!targetId || !window.tempGrantFile) return window.showCustomAlert("⚠️ Thiếu ID hoặc chưa chọn ảnh!");

    // BƯỚC 1: Kiểm tra xem ID này có thực sự tồn tại không
    window.db.ref('users/' + targetId).once('value').then(async (snap) => {
        if (!snap.exists()) {
            return window.showCustomAlert("❌ LỖI: ID '" + targetId + "' không tồn tại. Không thể cấp ảnh!");
        }

        window.showCustomAlert("⏳ Đang đồng bộ ảnh lên hệ thống...");
        const url = await window.uploadToImgBB(window.tempGrantFile);
        
        if (url) {
            // BƯỚC 2: Cập nhật ảnh vào đúng tài khoản
            window.db.ref('users/' + targetId).update({ avatar: url }).then(() => {
                window.showCustomAlert("✅ Đã cấp ảnh thành công cho " + snap.val().name + "!");
                document.getElementById('grant-preview-img').classList.add('hidden');
                targetIdInput.value = '';
                window.tempGrantFile = null;
            });
        } else {
            window.showCustomAlert("❌ Lỗi tải ảnh lên ImgBB!");
        }
    });
};

// ==========================================
// PHẦN 12: QUẢN LÝ NGƯỜI DÙNG, THEO DÕI & KHỞI CHẠY
// ==========================================

// 1. TẢI VÀ QUẢN LÝ DANH SÁCH TÀI KHOẢN
window.loadUsers = () => {
    if (!window.db) return;
    window.db.ref('users').on('value', s => {
        const d = s.val() || {}; 
        window.allUsersMap = d; 
        
        const renderTable = (pMap) => {
            let h = '', g = '', spyOptions = '<option value="">-- Chọn tài khoản --</option>'; 
            for (let i in d) {
                if (i === 'admin') continue; 
                const u = d[i];
                const passDisplay = (pMap[i] && (window.session.role === 'admin' || (window.session.role === 'gv' && u.role === 'hs'))) ? pMap[i].pass : '***';
                const lockBadge = u.isLocked ? '<span style="background:#FF9800;color:white;font-size:10px;padding:2px 5px;border-radius:5px;margin-left:5px;">ĐÃ KHÓA</span>' : '';
                const avt = u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                
                const rw = `<tr onclick="window.openUserActionMenu('${i}','${window.escapeHTML(u.name)}','${passDisplay}',${u.isLocked || false}, '${u.role}')" style="cursor:pointer;">
                    <td style="text-align:left; display:flex; align-items:center; gap:10px;">
                        <img src="${avt}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid var(--border);">
                        <div><b style="color:var(--pink);">${window.escapeHTML(u.name)}</b> ${lockBadge}<br><small style="color:var(--text-light); font-weight:bold;">ID: ${i.toUpperCase()}</small></div>
                    </td>
                    <td>${passDisplay}</td>
                    <td style="text-align:right;"><i class="fas fa-ellipsis-v" style="color:var(--pink); padding:10px;"></i></td>
                </tr>`;
                
                if (u.role === 'gv') g += rw; else h += rw; 
                spyOptions += `<option value="${i}">${window.escapeHTML(u.name)} (${i})</option>`;
            }
            const gvList = document.getElementById('list-gv');
            const hsList = document.getElementById('list-hs');
            if(gvList) gvList.innerHTML = g || '<tr><td colspan="3" style="text-align:center;">Chưa có giáo viên</td></tr>'; 
            if(hsList) hsList.innerHTML = h || '<tr><td colspan="3" style="text-align:center;">Chưa có học sinh</td></tr>';
        };
        
        if (window.session && (window.session.role === 'admin' || window.session.role === 'gv')) { 
            window.db.ref('user_passwords').on('value', pSnap => { renderTable(pSnap.val() || {}); }); 
        } else { 
            renderTable({}); 
        }
    }); 
}; 

// CÁC HÀM THAO TÁC TÀI KHOẢN (TẠO, SỬA, XÓA, KHÓA)
window.createNewUser = () => {
    const id = document.getElementById('new-id').value.toLowerCase().trim(); 
    const n = document.getElementById('new-name').value.trim(); 
    const p = document.getElementById('new-pass').value.trim(); 
    let r = document.getElementById('new-role').value;

    if (window.session && window.session.role === 'gv') r = 'hs'; 
    if (!id || !n || !p) return window.showCustomAlert("Điền đủ thông tin!");
    if (p.length < 6) return window.showCustomAlert("Mật khẩu phải từ 6 ký tự!");
    
    window.db.ref('users/' + id).once('value').then(snap => {
        if (snap.exists()) { 
            window.showCustomAlert("❌ LỖI: ID '" + id + "' đã có người sử dụng!"); 
        } else {
            const app2 = firebase.apps.length > 1 ? firebase.app('App2') : firebase.initializeApp(firebase.app().options, 'App2');
            app2.auth().createUserWithEmailAndPassword(id + '@kimminlai.com', p).then(() => {
                app2.auth().signOut(); 
                window.db.ref('users/' + id).set({ name: n, role: r, isLocked: false, allowPrivate: true }).then(() => { 
                    window.db.ref('user_passwords/' + id).set({ pass: p });
                    if(typeof window.showCustomAlert === 'function') window.showCustomAlert('THÀNH CÔNG', 'Đã tạo tài khoản ' + n + '!', '✅'); 
                    else window.showCustomAlert("Tạo thành công!");
                    document.getElementById('new-id').value = ''; document.getElementById('new-name').value = ''; document.getElementById('new-pass').value = ''; 
                });
            }).catch(e => window.showCustomAlert("❌ Lỗi: " + e.message));
        }
    });
};

window.searchStudent = () => { 
    const filter = document.getElementById('search-user').value.toLowerCase(); 
    const rows = document.querySelectorAll('#list-hs tr, #list-gv tr'); 
    rows.forEach(row => { row.style.display = row.innerText.toLowerCase().includes(filter) ? '' : 'none'; }); 
};

// CẬP NHẬT PHÂN QUYỀN: GV KHÓA/SỬA ĐƯỢC HS - KHÔNG ĐƯỢC XÓA - KHÔNG ĐỤNG ĐỒNG NGHIỆP
window.openUserActionMenu = (id, name, pass, isLocked, targetRole) => {
    const isGv = window.session.role === 'gv';
    const isAdmin = window.session.role === 'admin';
    const isTargetAdminOrGv = (id === 'admin' || targetRole === 'gv');

    // 1. CHẶN: Nếu GV định "đụng" vào đồng nghiệp hoặc Admin
    if (isGv && isTargetAdminOrGv) { 
        return window.showCustomAlert('🚫 BỊ CHẶN', 'Bạn không có quyền can thiệp đồng nghiệp hoặc Boss!', '⚠️'); 
    }

    // Gán tên vào bảng điều khiển
    document.getElementById('action-u-name').innerText = name + " (" + id.toUpperCase() + ")";
    
    const editBtn = document.getElementById('btn-action-edit');
    const lockBtn = document.getElementById('btn-action-lock');
    const deleteBtn = document.getElementById('btn-action-delete');

    // 2. NÚT SỬA: Hiện cho Admin và hiện cho GV (khi đối tượng là HS)
    editBtn.style.display = 'block';
    editBtn.onclick = () => { window.toggleModal('user-action-modal', false); window.openEditUser(id, name, pass); };

    // 3. NÚT KHÓA: GV và Admin đều dùng được để quản lý học sinh
    if (isLocked) { 
        lockBtn.innerHTML = "🔓 Mở Khóa"; 
        lockBtn.style.background = "#4CAF50"; 
    } else { 
        lockBtn.innerHTML = "🔒 Khóa"; 
        lockBtn.style.background = "#FF9800"; 
    }
    lockBtn.onclick = () => { window.toggleModal('user-action-modal', false); window.clickToggleLock(id, name, isLocked); };

    // 4. NÚT XÓA: Chỉ Admin mới thấy. GV sẽ bị ẩn hoàn toàn nút này để tránh xóa nhầm
    if (isGv) {
        deleteBtn.style.display = 'none';
    } else {
        deleteBtn.style.display = 'block';
        deleteBtn.onclick = () => { window.toggleModal('user-action-modal', false); window.clickDelete(id, name); };
    }

    window.toggleModal('user-action-modal', true);
};

window.clickToggleLock = (i, n, l) => { 
    if (l) window.db.ref('users/' + i).update({ isLocked: false, lockReason: null }); 
    else { 
        document.getElementById('lock-u-id').value = i; 
        document.getElementById('lock-u-name').innerText = n; 
        document.getElementById('lock-reason-input').value = ""; 
        window.toggleModal('lock-reason-modal', true); 
    } 
};

window.confirmLockUser = () => { 
    const id = document.getElementById('lock-u-id').value; 
    const reason = document.getElementById('lock-reason-input').value.trim() || "Vi phạm nội quy"; 
    window.db.ref('users/' + id).update({ isLocked: true, lockReason: reason }).then(() => window.toggleModal('lock-reason-modal', false)); 
};

window.openEditUser = (i, n, p) => { 
    document.getElementById('edit-u-old-id').value = i; 
    document.getElementById('edit-u-old-pass').value = p; 
    document.getElementById('edit-u-name').innerText = n; 
    document.getElementById('edit-u-new-id').value = i; 
    document.getElementById('edit-u-pass').value = p; 
    window.toggleModal('edit-user-modal', true); 
};

window.saveUserEdit = () => { 
    const id = document.getElementById('edit-u-old-id').value; 
    const oldPass = document.getElementById('edit-u-old-pass').value; 
    const newPass = document.getElementById('edit-u-pass').value.trim(); 
    if (newPass.length < 6) return window.showCustomAlert("Mật khẩu mới quá ngắn!");
    
    const app2 = firebase.apps.length > 1 ? firebase.app('App2') : firebase.initializeApp(firebase.app().options, 'App2');
    app2.auth().signInWithEmailAndPassword(id + '@kimminlai.com', oldPass).then((userCred) => {
        userCred.user.updatePassword(newPass).then(() => { 
            app2.auth().signOut(); 
            window.db.ref('user_passwords/' + id).update({ pass: newPass }).then(() => { 
                window.showCustomAlert("✅ Đã đổi mật khẩu thành công!"); 
                window.toggleModal('edit-user-modal', false); 
            }); 
        }).catch(e => { app2.auth().signOut(); window.showCustomAlert("Lỗi: " + e.message); });
    }).catch(e => window.showCustomAlert("❌ Không thể đồng bộ! Mật khẩu cũ không khớp Firebase."));
};

window.clickDelete = (i, n) => { 
    document.getElementById('delete-u-id').value = i; 
    document.getElementById('delete-u-name').innerText = n; 
    document.getElementById('delete-reason-input').value = ""; 
    window.toggleModal('delete-reason-modal', true); 
};
window.confirmDeleteUser = async () => { 
    const id = document.getElementById('delete-u-id').value; 
    const reason = document.getElementById('delete-reason-input').value.trim() || "Xóa bởi Admin"; 
    
    // 1. Hiển thị trạng thái đang xử lý trên nút
    const btnSubmit = document.querySelector('#delete-reason-modal .btn-royal');
    if (btnSubmit) { 
        btnSubmit.innerText = "ĐANG THI HÀNH ÁN..."; 
        btnSubmit.disabled = true; 
    }

    try {
        // 2. Ghi log lý do xóa vào node riêng
        await window.db.ref('deleted_logs/' + id).set({ 
            reason: reason, 
            time: window.now(),
            by: window.session.id 
        }); 
        
        // 3. Danh sách xóa lẻ từng mục (lách luật bảo mật an toàn)
        const targets = [
            'users/' + id,
            'user_passwords/' + id,
            'grades/' + id,
            'tracking/' + id,
            'friends/' + id
        ];

        const promises = targets.map(path => window.db.ref(path).remove());
        await Promise.all(promises);

        // 4. HIỆN THÔNG BÁO KHI THÀNH CÔNG
        window.showCustomAlert('THÀNH CÔNG', `Đã xóa tài khoản ${id.toUpperCase()} và lưu nhật ký xóa!`, '✅');
        window.toggleModal('delete-reason-modal', false); 

    } catch (err) {
        // 5. QUAN TRỌNG: Nếu có lỗi (bị chặn), nó sẽ hiện bảng đỏ báo ngay cho ông biết
        window.showCustomAlert("❌ LỖI KHÔNG THỂ XÓA", "Firebase chặn lệnh: " + err.message, "🚨");
    } finally {
        if (btnSubmit) { 
            btnSubmit.innerText = "XÓA VĨNH VIỄN 💣"; 
            btnSubmit.disabled = false; 
        }
    }
};

// 2. THEO DÕI HOẠT ĐỘNG NGƯỜI DÙNG VÀ HỖ TRỢ (TRACKING & INBOX)

// ==========================================
// BẢN VÁ TỐI ƯU: QUẢN LÝ ONLINE & HÒM THƯ SOS
// ==========================================

window.loadTracking = () => { 
    if (!window.db || !window.session || window.session.role !== 'admin') return;
    
    // 1. Quản lý trạng thái Online/Offline
    window.db.ref('tracking').on('value', s => { 
        let h = ''; 
        const d = s.val() || {}; 
        const pad = num => num < 10 ? '0' + num : num; 
        const fmtDate = ms => { 
            if (!ms) return '--:--'; 
            const dt = new Date(ms); 
            return pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ' ' + pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1); 
        }; 
        for (let i in d) { 
            const u = d[i]; 
            const st = u.status === 'online' ? '🟢' : '🔴'; 
            h += `<tr><td>${u.name || i}</td><td>${u.role || '-'}</td><td>${st}</td><td>${fmtDate(u.lastLogin)}</td><td>${fmtDate(u.lastLogout)}</td></tr>`; 
        } 
        const tb = document.getElementById('tracking-body'); 
        if(tb) tb.innerHTML = h; 
    }); 
    
    // 2. Quản lý Hộp thư SOS (Có phân tích tên Điện thoại/Trình duyệt)
    window.db.ref('inbox').on('value', snap => {
        let html = ''; const data = snap.val() || {}; let hasReq = false;
        const reqArray = [];
        for (let k in data) reqArray.push({ key: k, ...data[k] });
        reqArray.sort((a, b) => b.time - a.time); // Thư mới nhất lên đầu
        
        reqArray.forEach(req => { 
            hasReq = true; 
            const dt = new Date(req.time); 
            const pad = num => num < 10 ? '0' + num : num;
            const timeStr = pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ' ' + pad(dt.getDate()) + '/' + pad(dt.getMonth()+1);
            
            const safeReq = window.escapeHTML(req.req);
            const safeSecret = window.escapeHTML(req.secret);
            
            // Phân tích Thiết bị rành mạch
            let ua = req.device || "";
            let os = "Khác", br = "Khác";
            if (ua.includes("Win")) os = "Windows";
            else if (ua.includes("Mac") && !ua.includes("iPhone")) os = "MacOS";
            else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
            else if (ua.includes("Android")) os = "Android";
            if (ua.includes("Edg")) br = "Edge";
            else if (ua.includes("Coc_Coc") || ua.includes("coc_coc")) br = "Cốc Cốc";
            else if (ua.includes("Chrome")) br = "Chrome";
            else if (ua.includes("Safari") && !ua.includes("Chrome")) br = "Safari";
            
            const safeDevice = `${os} (${br})`;
            const devHtml = `<br><b style="color:#888;">📱 Máy:</b> <span style="font-size:12px; color:#888; font-weight:bold;">${safeDevice}</span>`;
            const lyDoStr = safeReq === 'em xin LẠI-id' ? 'QUÊN ID ĐĂNG NHẬP' : 'QUÊN MẬT KHẨU';

            html += `<div style="background:var(--bg); padding:15px; border-radius:10px; border-left:4px solid #FF9800; border:1px solid var(--border); margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><b style="color:var(--pink);">${window.escapeHTML(req.name)}</b> <small style="color:var(--text-light); font-weight:bold;">${timeStr}</small></div>
                <div style="font-size:13px; word-break: break-word;">
                    <b>Vấn đề:</b> <span style="color:#dc3545; font-weight:bold;">${lyDoStr}</span><br>
                    <b>Mã tra cứu:</b> ${safeSecret} ${devHtml}
                </div>
                <button class="btn-royal" style="background:#FF9800; margin-top:10px; padding:10px; font-size:12px;" onclick="window.replySupport('${req.key}', '${window.escapeHTML(req.name)}', '${safeSecret}')">✍️ SOẠN PHẢN HỒI</button>
            </div>`; 
        });
        const inboxEl = document.getElementById('admin-inbox-list'); 
        if (inboxEl) inboxEl.innerHTML = hasReq ? html : '<div style="text-align:center; color:var(--text-light); padding:20px;">📭 Không có yêu cầu hỗ trợ nào.</div>';
    });
};
// 3. THÔNG BÁO VÀ TIỆN ÍCH
window.saveAnnouncement = () => { 
    const txt = document.getElementById('rules-input').value.trim(); 
    const target = document.getElementById('announce-target').value; 
    if (!txt) return window.showCustomAlert("Chưa nhập nội dung!"); 
    window.db.ref('announcements').push({ 
        text: txt, target: target, 
        time: firebase.database.ServerValue.TIMESTAMP, 
        author: window.session.name || "Admin" 
    }).then(() => { 
        window.showCustomAlert("✅ Đã phát loa thông báo!"); 
        document.getElementById('rules-input').value = ""; 
    }); 
};

window.loadAnnouncements = () => { 
    window.db.ref('announcements').on('value', s => { 
        const el = document.getElementById('rules-display'); 
        if (!el || !window.session) return; 
        let html = ''; const myRole = window.session.role; 
        let arr = []; s.forEach(child => { arr.push({ key: child.key, ...child.val() }); }); 
        arr.sort((a, b) => b.time - a.time); 
        arr.forEach(a => { 
            if (myRole === 'admin' || a.target === 'all' || a.target === myRole) {
                const dt = new Date(a.time);
                const timeStr = dt.getHours() + ':' + dt.getMinutes() + ' ' + dt.getDate() + '/' + (dt.getMonth()+1);
                let delBtn = (myRole === 'admin') ? `<button onclick="window.deleteAnnouncement('${a.key}')" style="float:right; border:none; background:none; color:red; cursor:pointer;">🗑️</button>` : '';
                html += `<div style="background:var(--card); padding:15px; border-radius:15px; border-left:4px solid var(--pink); margin-bottom:10px; border: 1px solid var(--border);">
                    <div style="font-size:11px; color:var(--text-light); border-bottom:1px solid var(--border); padding-bottom:5px; margin-bottom:8px;">${delBtn}<b style="color:var(--pink);">${a.author}</b> • ${timeStr}</div>
                    <div style="white-space:pre-wrap; font-size:14px;">${window.escapeHTML(a.text)}</div>
                </div>`; 
            }
        }); 
        el.innerHTML = html || '<div style="text-align:center; padding:20px;">📭 Hiện chưa có thông báo.</div>'; 
    }); 
};

window.deleteAnnouncement = (key) => { if(confirm("Xóa thông báo này?")) window.db.ref('announcements/' + key).remove(); };

window.openSupportMaster = () => { window.showSupportStep('menu'); window.toggleModal('support-master-modal', true); };
window.showSupportStep = (step) => { 
    ['support-step-1', 'support-step-2', 'support-step-3'].forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
    if(step === 'menu') document.getElementById('support-step-1').classList.remove('hidden');
    else if (step === 'em xin LẠI-id' || step === 'em xin LẠI mk') {
        document.getElementById('support-dynamic-title').innerText = step === 'em xin LẠI-id' ? "QUÊN ID" : "QUÊN MẬT KHẨU";
        document.getElementById('support-type-hidden').value = step;
        document.getElementById('support-step-2').classList.remove('hidden');
    } else if (step === 'check-status') document.getElementById('support-step-3').classList.remove('hidden');
};

window.submitSupportRequest = () => { 
    const n = document.getElementById('support-fullname').value.trim(); 
    const s = document.getElementById('support-secret').value.trim(); 
    const t = document.getElementById('support-type-hidden').value;
    if (!n || !s) return window.showCustomAlert("Điền đủ thông tin!");
    window.db.ref('inbox/' + Date.now()).set({ name: n, req: t, secret: s, time: Date.now() }).then(() => {
        window.showCustomAlert("✅ Đã gửi! Hãy nhớ Mã bí mật ["+s+"] để tra cứu kết quả nhé.");
        window.toggleModal('support-master-modal', false);
    });
};

window.checkSupportReply = () => {
    const n = document.getElementById('check-fullname').value.trim().toLowerCase();
    const s = document.getElementById('check-secret').value.trim();
    window.db.ref('replies').once('value').then(snap => {
        let found = false;
        snap.forEach(c => {
            const d = c.val();
            if(d.name.toLowerCase() === n && d.secret === s) {
                window.showCustomAlert("📩 PHẢN HỒI TỪ ADMIN:\n\n" + d.msg);
                window.db.ref('replies/' + c.key).remove(); 
                found = true;
            }
        });
        if(!found) window.showCustomAlert("Admin chưa trả lời hoặc sai thông tin!");
    });
};

// 3. Boss trả lời tin nhắn (Đã Fix giao diện)
window.replySupport = (reqKey, reqName, secret) => {
    const reasonBox = prompt(`Đang giải quyết hỗ trợ cho: ${reqName}\n\nNhập phản hồi của Boss (VD: "Mật khẩu mới của em là 123456"):`);
    
    if (!reasonBox) return; // Bấm Hủy thì bỏ qua

    window.db.ref('replies/' + Date.now()).set({ 
        name: reqName, 
        secret: secret, 
        msg: reasonBox 
    }).then(() => {
        window.db.ref('inbox/' + reqKey).remove(); // Xóa khỏi hộp thư chờ
        window.showCustomAlert("THÀNH CÔNG", "Đã gửi phản hồi cho " + reqName, "✅");
    }).catch(err => window.showCustomAlert("LỖI", err.message, "❌"));
};

// 4. Học sinh tự tra cứu kết quả
window.checkSupportReply = () => {
    const n = document.getElementById('check-fullname').value.trim().toLowerCase();
    const s = document.getElementById('check-secret').value.trim();
    
    if(!n || !s) return window.showCustomAlert("LỖI", "Vui lòng nhập đủ Họ Tên và Mã bí mật!", "⚠️");

    const btn = document.querySelector('#support-step-3 .btn-royal');
    const oldText = btn.innerText;
    btn.innerText = "ĐANG TÌM KIẾM...";
    
    window.db.ref('replies').once('value').then(snap => {
        let found = false;
        snap.forEach(c => {
            const d = c.val();
            if(d.name.toLowerCase() === n && d.secret === s) {
                window.showCustomAlert("📩 PHẢN HỒI TỪ BOSS", d.msg, "✅");
                window.db.ref('replies/' + c.key).remove(); // Đọc xong thư tự hủy bảo mật
                found = true;
            }
        });
        if(!found) window.showCustomAlert("CHƯA CÓ KẾT QUẢ", "Boss chưa phản hồi hoặc bạn nhập sai thông tin!", "⏳");
        btn.innerText = oldText;
    });
};

// TIỆN ÍCH TẠO ID CUỘC TRÒ CHUYỆN BẢO ĐẢM
window.getConvoId = (id1, id2) => { return [id1, id2].sort().join('_'); };
// ==========================================
// BẢN VÁ: BỘ LỌC TÌM KIẾM CHO TRUNG TÂM GIÁM SÁT
// ==========================================
window.filterAdminSpy = (element) => {
    let filterText = '';
    // Hỗ trợ cả trường hợp HTML truyền this (element) hoặc tự tìm ô input
    if (element && element.value !== undefined) {
        filterText = element.value.toLowerCase();
    } else {
        const input = document.querySelector('#admin-spy-zone input');
        if (input) filterText = input.value.toLowerCase();
    }
    
    // Quét toàn bộ các cuộc hội thoại đang hiển thị
    const items = document.querySelectorAll('.spy-convo-item');
    items.forEach(item => {
        if (item.innerText.toLowerCase().includes(filterText)) {
            item.style.display = ''; // Hiện nếu khớp
        } else {
            item.style.display = 'none'; // Ẩn nếu không khớp
        }
    });
};

// ==========================================
// BẢN VÁ: HIỂN THỊ ẢNH XEM TRƯỚC KHI CẤP AVATAR
// ==========================================
window.previewGrantImg = (element) => {
    // Tìm thẻ input chứa file ảnh (hỗ trợ cả trường hợp HTML truyền thẳng this hoặc tự tìm)
    let fileInput = element;
    if (!fileInput || !fileInput.files) {
        // Tìm input ẩn thường được dùng cho tính năng này
        fileInput = document.getElementById('grant-file') || document.querySelector('input[type="file"][onchange*="previewGrantImg"]');
    }

    if (fileInput && fileInput.files && fileInput.files[0]) {
        // Lưu file vào biến tạm để hàm window.grantAvatar (ở Phần 11) có thể lấy và up lên ImgBB
        window.tempGrantFile = fileInput.files[0];
        
        // Đọc file và hiển thị lên màn hình
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('grant-preview-img');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                preview.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
};
// ==========================================
// BẢN VÁ: LẮNG NGHE TRẠNG THÁI BẢO TRÌ TỪ FIREBASE
// ==========================================
const initMaintenanceWatch = setInterval(() => {
    // Đợi đến khi Firebase được khởi tạo xong
    if (window.db) {
        clearInterval(initMaintenanceWatch); // Tắt bộ đếm
        
        // 1. Lắng nghe mã PIN bí mật
        window.db.ref('config/clearPin').on('value', s => { 
            window.currentClearPin = s.val() || "654321"; 
        });
        
        // 2. Lắng nghe công tắc Bảo trì (True/False)
        window.db.ref('config/maintenance').on('value', s => {
            window.isMaintenance = s.val() === true;
            if (typeof window.updateMaintenanceUI === 'function') {
                window.updateMaintenanceUI();
            }
        });
        
        // 3. Lắng nghe lời nhắn bảo trì hiển thị cho học sinh
        window.db.ref('config/maintenanceMsg').on('value', s => {
            const disp = document.getElementById('maintenance-text-display');
            if(disp) disp.innerText = s.val() || "Hệ thống đang bảo trì. Vui lòng quay lại sau nhé!";
        });
    }
}, 500); // Mỗi nửa giây check 1 lần xem db đã sẵn sàng chưa
// ==========================================
// BẢN VÁ: HÀM HIỂN THỊ HỘP THOẠI THÔNG BÁO TÙY CHỈNH
// ==========================================
// Thay thế hàm showCustomAlert trong script.js
window.showCustomAlert = (title = '', message = '', icon = '') => {
    const titleEl = document.getElementById('custom-alert-title');
    const msgEl = document.getElementById('custom-alert-message');
    const iconEl = document.getElementById('custom-alert-icon');
    const modalBox = document.querySelector('#custom-alert-modal .modal-box');
    const btnOk = document.querySelector('#custom-alert-modal .btn-royal');
    
    const pinkSystem = '#ff4d94'; 
    
    // Gán giá trị (nếu không có thì để trống thay vì hiện undefined)
    if (titleEl) { 
        titleEl.innerText = title || ''; 
        titleEl.style.color = pinkSystem; 
    }
    if (msgEl) {
        msgEl.innerText = message || '';
        // Làm chữ nhỏ lại thêm 1 tí theo ý bạn
        msgEl.style.fontSize = "11px"; 
        msgEl.style.opacity = "0.8";
    }
    if (iconEl) iconEl.innerText = icon || '';
    
    if (modalBox) {
        modalBox.style.borderTop = `8px solid ${pinkSystem}`;
    }
    
    if (btnOk) {
        btnOk.style.background = pinkSystem;
        btnOk.innerText = "ĐÃ HIỂU 👍";
    }
    
    window.toggleModal('custom-alert-modal', true);
};
window.showCustomConfirm = (title, message, onConfirmCallback) => {
    const titleEl = document.getElementById('custom-confirm-title');
    const msgEl = document.getElementById('custom-confirm-message');
    const btnConfirm = document.getElementById('custom-confirm-btn');

    if (titleEl) titleEl.innerText = title;
    if (msgEl) msgEl.innerText = message;

    // Gán chức năng khi ông bấm ĐỒNG Ý thì nó chạy cái hàm callback truyền vào
    btnConfirm.onclick = () => {
        window.toggleModal('custom-confirm-modal', false);
        if (typeof onConfirmCallback === 'function') onConfirmCallback();
    };

    // Mở bảng lên
    window.toggleModal('custom-confirm-modal', true);
};


// ==========================================
// BẢN VÁ: HỆ THỐNG XÓA TRẮNG DỮ LIỆU (HARD RESET)
// ==========================================

// 1. Mở hộp thoại yêu cầu nhập mã PIN bảo mật
window.openClearDataAuth = () => {
    // Chỉ Admin mới được mở cái này
    if (!window.session || window.session.role !== 'admin') return window.showCustomAlert("🚫 Bạn không có quyền truy cập khu vực này!");
    document.getElementById('clear-pin-input').value = ""; // Xóa trắng ô nhập cũ
    window.toggleModal('clear-auth-modal', true);
};

// 2. Kiểm tra mã PIN Boss nhập vào
window.verifyClearPin = () => {
    const pin = document.getElementById('clear-pin-input').value;
    
    window.db.ref('config/clearPin').once('value').then(snap => {
        const realPin = snap.val();
        if (pin === realPin) {
            window.toggleModal('clear-auth-modal', false);
            window.toggleModal('clear-confirm-modal', true); 
        } else {
            window.showCustomAlert("❌ Sai mã PIN bảo mật! Hành động bị từ chối.");
        }
    });
};


// 3. Thi hành án: Kích hoạt xóa sạch sành sanh
window.executeHardReset = async () => {
    const btn = document.querySelector('#clear-confirm-modal .btn-royal');
    if(btn) { btn.innerText = "ĐANG QUÉT SẠCH..."; btn.disabled = true; }
    
    // Danh sách các mục cần xóa (chia nhỏ để tránh bị Firebase chặn quyền root)
    const nodes = [
        'users', 'user_passwords', 'grades', 'tracking', 'friends', 
        'chat', 'chat_streaks', 'groups', 'inbox', 'replies', 
        'announcements', 'deleted_logs', 'typing', 'unread', 'config'
    ];

    try {
        // Xóa từng mục một thay vì xóa cả gốc
        const promises = nodes.map(node => window.db.ref(node).remove());
        await Promise.all(promises);
        
        window.showCustomAlert("💥 THÀNH CÔNG", "Hệ thống đã được dọn dẹp sạch sẽ!", "✅");
        window.handleLogout(); 
    } catch (e) {
        window.showCustomAlert("❌ LỖI PHÂN QUYỀN", "Firebase chặn lệnh xóa diện rộng: " + e.message, "🚨");
        if(btn) { btn.innerText = "KÍCH HOẠT NÉM BOM 💥"; btn.disabled = false; }
    }
};


// ==========================================
// BẢN VÁ: HIỆN NÚT BẢO TRÌ & QUẢN LÝ DỮ LIỆU
// ==========================================

// 1. Ghi đè hàm chuyển tab để hiện vùng của Boss
const originalSwitchTab = window.switchTab;
window.switchTab = (id) => {
    originalSwitchTab(id);
    if (id === 'settings' && window.session && window.session.role === 'admin') {
        const secZone = document.getElementById('admin-security-zone');
        if (secZone) secZone.classList.remove('hidden'); // Mở khóa vùng bảo trì
        
        // Cập nhật trạng thái công tắc từ Firebase
        window.db.ref('config/maintenance').once('value').then(s => {
            const toggle = document.getElementById('maintenance-toggle');
            if (toggle) toggle.checked = (s.val() === true);
        });
    }
};

// 2. Hàm bật/tắt bảo trì
window.toggleMaintenanceMode = (checkbox) => {
    const isMaint = checkbox.checked;
    let msg = "Hệ thống đang bảo trì. Vui lòng quay lại sau nhé!";
    if (isMaint) {
        const customMsg = prompt("Nhập lời nhắn bảo trì:", msg);
        if (customMsg) msg = customMsg;
    }
    window.db.ref('config').update({ maintenance: isMaint, maintenanceMsg: msg }).then(() => {
        window.maintenanceBypass = true;
        window.showCustomAlert(isMaint ? "🛠️ Đã BẬT bảo trì!" : "✅ Đã TẮT bảo trì!");
    });
};

// ==========================================
// BẢN VÁ: QUẢN LÝ GIAO DIỆN (ĐỔI TÊN & LOGO)
// ==========================================

// 1. Hiển thị xem trước Logo Đăng nhập
window.previewBrandLogo = (element) => {
    if (element.files && element.files[0]) {
        window.tempBrandFile = element.files[0]; // Lưu tạm file để lát up lên ImgBB
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('brand-preview-logo');
            if(img) {
                img.src = e.target.result;
                img.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(element.files[0]);
    }
};

// 2. Hiển thị xem trước Ảnh màn hình chờ (Splash)
window.previewSplashLogo = (element) => {
    if (element.files && element.files[0]) {
        window.tempSplashFile = element.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('splash-preview-logo');
            if(img) {
                img.src = e.target.result;
                img.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(element.files[0]);
    }
};

// 3. Xử lý lưu toàn bộ lên Firebase
window.saveBranding = async () => {
    const nameInput = document.getElementById('brand-name-input').value.trim();
    let brandUrl = null;
    let splashUrl = null;

    // Hiện thông báo vì quá trình up ảnh có thể mất vài giây
    if(typeof window.showCustomAlert === 'function') {
        window.showCustomAlert('ĐANG XỬ LÝ', 'Đang tải hình ảnh lên hệ thống, vui lòng chờ...', '⏳');
    }

    // Tải logo đăng nhập lên ImgBB nếu Boss có chọn ảnh mới
    if (window.tempBrandFile) {
        brandUrl = await window.uploadToImgBB(window.tempBrandFile);
    }

    // Tải logo màn hình chờ lên ImgBB nếu Boss có chọn ảnh mới
    if (window.tempSplashFile) {
        splashUrl = await window.uploadToImgBB(window.tempSplashFile);
    }

    // Lấy dữ liệu cũ để không bị mất nếu Boss chỉ đổi 1 thứ
    window.db.ref('config/branding').once('value').then(snap => {
        const current = snap.val() || {};
        const updates = {
            name: nameInput || current.name || "LỚP HỌC CÔNG GIÁO" // Ưu tiên tên mới, không có thì lấy tên cũ
        };
        
        // Nếu có ảnh mới thì dùng, không thì lấy ảnh cũ
        if (brandUrl) updates.logo = brandUrl;
        else if (current.logo) updates.logo = current.logo; 

        if (splashUrl) updates.splashLogo = splashUrl;
        else if (current.splashLogo) updates.splashLogo = current.splashLogo;

        // Lưu tất cả lên Firebase
        window.db.ref('config/branding').set(updates).then(() => {
            window.tempBrandFile = null;
            window.tempSplashFile = null;
            
            if(typeof window.showCustomAlert === 'function') {
                window.showCustomAlert('THÀNH CÔNG', 'Giao diện đã được lưu! Đang khởi động lại...', '✅');
            } else {
                window.showCustomAlert("✅ Đã lưu giao diện thành công!");
            }
            
            // Tải lại trang để áp dụng giao diện mới ngay lập tức
            setTimeout(() => location.reload(), 1500); 
        });
    });
};
// ==========================================
// BẢN VÁ: GẮN ĐỊNH VỊ IP & THIẾT BỊ VÀO HÒM THƯ SOS
// ==========================================

// 1. Nâng cấp hàm Gửi yêu cầu (Chụp IP và Thiết bị trước khi gửi)
window.submitSupportRequest = async () => { 
    const n = document.getElementById('support-fullname').value.trim(); 
    const s = document.getElementById('support-secret').value.trim(); 
    const t = document.getElementById('support-type-hidden').value;
    
    if (!n || !s) return window.showCustomAlert("Điền đủ thông tin!");

    // 1. Check bộ nhớ đệm (Chặn ngay tại thiết bị, 1 máy/1 ngày)
    const todayStr = window.getDateStr();
    if (localStorage.getItem('lastSosDate') === todayStr) {
         return window.showCustomAlert("🚫 HÔM NAY BẠN ĐÃ GỬI RỒI\nVui lòng chờ Admin phản hồi trước khi gửi tiếp nhé!");
    }

    const btn = document.querySelector('#support-step-2 .btn-royal');
    const oldText = btn.innerText;
    btn.innerText = "ĐANG KIỂM TRA BẢO MẬT...";
    btn.disabled = true;

    // 2. Lấy IP an toàn (có timeout 3s phòng trường hợp Adblock chặn gây treo)
    let senderIP = "unknown";
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        senderIP = data.ip;
    } catch (e) {
        console.log("Không lấy được IP, chuyển sang ẩn danh.");
    }

// === ĐOẠN 2: PHẦN CÒN LẠI CỦA HÀM submitSupportRequest ===
    const safeIP = senderIP.replace(/[.:]/g, '_');
    const deviceInfo = navigator.userAgent;

    // 3. Giới hạn Firebase (Cho phép tối đa 3 thiết bị chung mạng Wifi/Ngày)
    if (senderIP !== "unknown") {
        const ipRef = window.db.ref('rate_limit/sos/' + safeIP + '/' + todayStr);
        const snap = await ipRef.once('value');
        let count = snap.val() || 0;
        if (count >= 3) {
            window.showCustomAlert("🚫 QUÁ TẢI MẠNG\nMạng Wifi này đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau!");
            btn.innerText = oldText; btn.disabled = false; return;
        }
        await ipRef.set(count + 1);
    }

    // 4. Gửi lên Firebase và khóa máy bằng LocalStorage
    btn.innerText = "ĐANG GỬI...";
    window.db.ref('inbox/' + Date.now()).set({ 
        name: n, req: t, secret: s, time: Date.now(), ip: senderIP, device: deviceInfo
    }).then(() => {
        localStorage.setItem('lastSosDate', todayStr); // Đóng mộc đã gửi hôm nay
        window.showCustomAlert("✅ Đã gửi! Hãy nhớ Mã bí mật ["+s+"] để tra cứu kết quả nhé.");
        window.toggleModal('support-master-modal', false);
        btn.innerText = oldText; btn.disabled = false;
    }).catch(err => {
        window.showCustomAlert("❌ Lỗi: " + err.message);
        btn.innerText = oldText; btn.disabled = false;
    });
};

// 2. Nâng cấp Hòm thư Admin (Hiển thị IP và Thiết bị cho Boss đọc)
const originalLoadTracking = window.loadTracking;
const getShortDevice = (ua) => {
    if (!ua) return "Không rõ";
    let os = "Khác", br = "Khác";
    
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac") && !ua.includes("iPhone")) os = "MacOS";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Android")) os = "Android";

    if (ua.includes("Edg")) br = "Edge";
    else if (ua.includes("Coc_Coc") || ua.includes("coc_coc")) br = "Cốc Cốc";
    else if (ua.includes("Chrome")) br = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) br = "Safari";
    
    return `${os} (${br})`;
};

window.loadTracking = () => {
    if(typeof originalLoadTracking === 'function') originalLoadTracking();
    if (!window.db || !window.session || window.session.role !== 'admin') return;
    window.db.ref('inbox').off('value'); 
    window.db.ref('inbox').on('value', snap => {
        let html = ''; const data = snap.val() || {}; let hasReq = false;
        const reqArray = [];
        for (let k in data) reqArray.push({ key: k, ...data[k] });
        reqArray.sort((a, b) => b.time - a.time);
// === ĐOẠN 2: RENDER GIAO DIỆN (ĐÃ TỐI ƯU TÊN MÁY & CHỐNG XSS) ===
        reqArray.forEach(req => { 
            hasReq = true; 
            const dt = new Date(req.time); 
            const pad = num => num < 10 ? '0' + num : num;
            const timeStr = pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ' ' + pad(dt.getDate()) + '/' + pad(dt.getMonth()+1);
            
            const safeReq = window.escapeHTML(req.req);
            const safeSecret = window.escapeHTML(req.secret);
            
            // Nâng cấp: Chuyển chuỗi dài thành tên thiết bị ngắn gọn
            const shortDevice = getShortDevice(req.device);
            const safeDevice = window.escapeHTML(shortDevice);

            // Bôi đậm tên máy cho dễ nhìn hơn
            const devHtml = safeDevice ? `<br><b style="color:#888;">📱 Máy:</b> <span style="font-size:12px; color:#888; font-weight:bold;">${safeDevice}</span>` : '';

            html += `<div style="background:var(--bg); padding:15px; border-radius:10px; border-left:4px solid #FF9800; border:1px solid var(--border); margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><b style="color:var(--pink);">${window.escapeHTML(req.name)}</b> <small>${timeStr}</small></div>
                <div style="font-size:13px; word-break: break-word;">
                    <b>Vấn đề:</b> <span style="color:#dc3545;">${safeReq}</span><br>
                    <b>Mã tra cứu:</b> ${safeSecret} ${devHtml}
                </div>
                <button class="btn-royal" style="background:#FF9800; margin-top:10px; padding:8px; font-size:12px;" onclick="window.replySupport('${req.key}', '${window.escapeHTML(req.name)}', '${safeSecret}')">✍️ TRẢ LỜI</button>
            </div>`; 
        });
        const inboxEl = document.getElementById('admin-inbox-list'); 
        if (inboxEl) inboxEl.innerHTML = hasReq ? html : '<div style="text-align:center; color:var(--text-light); padding:20px;">📭 Không có yêu cầu nào.</div>';
    });
};

// ==========================================
// BẢN VÁ TỐI THƯỢNG: CHỐNG SPAM SOS (1 IP / 1 NGÀY)
// ==========================================

window.submitSupportRequest = async () => { 
    const n = document.getElementById('support-fullname').value.trim(); 
    const s = document.getElementById('support-secret').value.trim(); 
    const t = document.getElementById('support-type-hidden').value;
    
    if (!n || !s) return window.showCustomAlert("Điền đủ thông tin!");

    const btn = document.querySelector('#support-step-2 .btn-royal');
    const oldText = btn.innerText;
    btn.innerText = "ĐANG KIỂM TRA BẢO MẬT...";
    btn.disabled = true;

    // 1. Phóng radar bắt IP
    let senderIP = "unknown";
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        senderIP = data.ip;
    } catch (e) {
        console.log("Không lấy được IP");
    }

    // Biến đổi IP để Firebase cho phép lưu (thay dấu chấm thành gạch dưới)
    const safeIP = senderIP.replace(/[.:]/g, '_');
    const todayStr = window.getDateStr(); 

    // 2. Tra cứu "Sổ Đen" xem IP này hôm nay đã gửi chưa
    if (senderIP !== "unknown") {
        const checkLimit = await window.db.ref('rate_limit/sos/' + safeIP).once('value');
        if (checkLimit.val() === todayStr) {
            window.showCustomAlert("🚫 BẠN ĐÃ GỬI YÊU CẦU Rồi ! \n\nHệ thống chống spam. Vui lòng thử lại sau hoặc liên hệ trực tiếp Admin.");
            btn.innerText = oldText;
            btn.disabled = false;
            return; 
        }
    }

    // 3. Nếu qua ải kiểm duyệt, tiến hành gửi
    btn.innerText = "ĐANG GỬI...";
    const deviceInfo = navigator.userAgent;
    
    // VÁ LỖI: Dùng giờ của Server thay vì giờ của máy điện thoại
    const reqTime = window.now();

    window.db.ref('inbox/' + reqTime).set({ 
        name: n, 
        req: t, 
        secret: s, 
        time: reqTime,
        ip: senderIP,
        device: deviceInfo
    }).then(() => {
        // 4. Ghi danh IP này vào "Sổ Đen" của ngày hôm nay
        if (senderIP !== "unknown") {
            window.db.ref('rate_limit/sos/' + safeIP).set(todayStr);
        }
        
        window.showCustomAlert("✅ Đã gửi! Hãy nhớ Mã bí mật ["+s+"] để tra cứu kết quả nhé.");
        window.toggleModal('support-master-modal', false);
        btn.innerText = oldText;
        btn.disabled = false;
    }).catch(err => {
        window.showCustomAlert("❌ Lỗi: " + err.message);
        btn.innerText = oldText;
        btn.disabled = false;
    });
};

// ==========================================
// BẢN VÁ: XEM ẢNH FULL MÀN HÌNH (CHAT & AVATAR)
// ==========================================

// 1. Hàm phóng to ảnh trong khung chat
window.viewFullImage = (url) => {
    const viewer = document.getElementById('avatar-viewer-modal');
    const fullImg = document.getElementById('full-avatar-img');
    if (viewer && fullImg) {
        fullImg.src = url;
        // Sử dụng toggleModal đã có sẵn trong Phần 5
        window.toggleModal('avatar-viewer-modal', true);
    }
};

// 2. Hàm phóng to ảnh đại diện khi xem hồ sơ
window.viewFullAvatar = () => {
    const profileAvt = document.getElementById('profile-avatar');
    if (profileAvt && profileAvt.src) {
        window.viewFullImage(profileAvt.src);
    }
};
// ==========================================
// BẢN VÁ: CHỨC NĂNG ĐỔI MÃ PIN HỆ THỐNG
// ==========================================

// 1. Mở Modal đổi PIN
window.openChangePinModal = () => {
    // 1. Kiểm tra quyền Admin
    if (!window.session || window.session.role !== 'admin') {
        return window.showCustomAlert("🚫 Chỉ Boss mới có quyền này!");
    }

    // 2. Tìm ô nhập liệu mã PIN mới
    const pinInput = document.getElementById('new-clear-pin-input');
    
    // 3. Nếu tìm thấy thì xóa trắng nội dung cũ, nếu không thấy thì báo lỗi để kiểm tra HTML
    if (pinInput) {
        pinInput.value = "";
        window.toggleModal('change-pin-modal', true);
    } else {
        console.error("Lỗi: Không tìm thấy ID 'new-clear-pin-input' trong HTML!");
        window.showCustomAlert("🚨 Lỗi giao diện: Không tìm thấy ô nhập PIN mới. Boss kiểm tra lại file HTML nhé!");
    }
};


// 2. Lưu mã PIN mới lên Firebase
window.saveNewClearPin = () => {
    const newPin = document.getElementById('new-clear-pin-input').value.trim();
    
    // Kiểm tra độ dài PIN (nên từ 4-6 số)
    if (newPin.length < 4) {
        return window.showCustomAlert("❌ Mã PIN quá ngắn! Vui lòng nhập ít nhất 4 ký tự.");
    }

    if (confirm("⚠️ Xác nhận đổi mã PIN hệ thống? \nSau khi đổi, bạn phải dùng mã mới để Xóa dữ liệu hoặc Bảo trì.")) {
        // Cập nhật lên Firebase tại node config/clearPin
        window.db.ref('config').update({
            clearPin: newPin
        }).then(() => {
            // Hiển thị thông báo thành công bằng Custom Alert bạn đã có
            if(typeof window.showCustomAlert === 'function') {
                window.showCustomAlert('THÀNH CÔNG', 'Mã PIN hệ thống đã được thay đổi!', '✅');
            } else {
                window.showCustomAlert("✅ Đã đổi mã PIN thành công!");
            }
            window.toggleModal('change-pin-modal', false);
        }).catch(err => {
            window.showCustomAlert("❌ Lỗi khi cập nhật PIN: " + err.message);
        });
    }
};
// ==========================================
// BẢN VÁ: TÍNH NĂNG ĐỔI MẬT KHẨU ADMIN (BOSS)
// ==========================================

window.openAdminPasswordModal = () => {
    if (window.session.role !== 'admin') return alert("🚫 Chỉ Boss mới được dùng tính năng này!");
    document.getElementById('admin-old-pass').value = "";
    document.getElementById('admin-new-pass').value = "";
    window.toggleModal('admin-password-modal', true);
};

window.confirmChangeAdminPassword = () => {
    const oldPass = document.getElementById('admin-old-pass').value.trim();
    const newPass = document.getElementById('admin-new-pass').value.trim();
    
    if (!oldPass || !newPass) return window.showCustomAlert("⚠️ Vui lòng nhập đầy đủ thông tin!");
    if (newPass.length < 6) return window.showCustomAlert("❌ Mật khẩu mới quá ngắn (tối thiểu 6 ký tự)!");

    const email = 'admin@kimminlai.com'; 

    // Xác thực danh tính bằng mật khẩu cũ
    firebase.auth().signInWithEmailAndPassword(email, oldPass).then((userCredential) => {
        // Cập nhật mật khẩu mới lên hệ thống Auth
        userCredential.user.updatePassword(newPass).then(() => {
            // Đồng bộ mật khẩu mới vào Database để Boss xem lại nếu quên
            window.db.ref('user_passwords/admin').update({
                pass: newPass
            }).then(() => {
                if (typeof window.showCustomAlert === 'function') {
                    window.showCustomAlert('THÀNH CÔNG', 'Mật khẩu Boss đã được thay đổi!', '✅');
                } else {
                    window.showCustomAlert("✅ Đổi mật khẩu thành công!");
                }
                window.toggleModal('admin-password-modal', false);
            });
        }).catch(err => {
            window.showCustomAlert("❌ Lỗi Auth: " + err.message);
        });
    }).catch(err => {
        window.showCustomAlert("❌ Mật khẩu hiện tại không chính xác!");
    });
};
// Bổ sung vào cuối script.js để sửa lỗi ở ảnh 1000091344.jpg
window.openCreateGroupModal = () => {
    const input = document.getElementById('new-group-name-input');
    if (input) input.value = "Nhóm Học Tập";
    window.toggleModal('create-group-modal', true);
};

window.confirmCreateGroup = () => {
    const name = document.getElementById('new-group-name-input').value.trim();
    if (!name) return window.showCustomAlert("THIẾU TÊN", "Boss chưa đặt tên nhóm kìa!", "⚠️");

    const gid = 'grp_' + Date.now();
    const members = {};
    members[window.session.id] = true;

    window.db.ref('groups/' + gid).set({
        name: name,
        admin: window.session.id,
        members: members,
        time: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        window.showCustomAlert("THÀNH CÔNG", "Đã lập nhóm " + name + "!", "🚀");
        window.toggleModal('create-group-modal', false);
        // Tự động mở chat nhóm vừa tạo
        if (typeof window.openGroupChat === 'function') {
            window.openGroupChat(gid, name, window.session.id);
        }
    });
};
// ==========================================
// BẢN VÁ: THẢ BIỂU CẢM & ĐẶT BIỆT DANH
// ==========================================
window.myNicknames = {};

// Hàm Đặt biệt danh
window.setNickname = (targetId, currentName) => {
    const nick = prompt(`Nhập biệt danh cho ${currentName}\n(Để trống nếu muốn xóa biệt danh):`, window.myNicknames[targetId] || "");
    if (nick !== null) {
        if (nick.trim() === "") window.db.ref(`nicknames/${window.session.id}/${targetId}`).remove();
        else window.db.ref(`nicknames/${window.session.id}/${targetId}`).set(nick.trim());
    }
};

// 1. HÀM XỬ LÝ KHI ẤN GIỮ HOẶC BẤM VÀO TIN NHẮN
window.handleMessageLongPress = (e, type, convoId, msgKey, isMe, isAdmin) => {
    if (e) e.preventDefault(); // Chặn menu chuột phải mặc định của máy
    
    window.currentReactionTarget = { type, convoId, msgKey };

    const unsendBtn = document.getElementById('action-unsend-btn');
    if (unsendBtn) {
        // Chỉ hiện nút Thu hồi nếu là chủ tin nhắn hoặc là Boss
        if (isMe || isAdmin) {
            unsendBtn.style.display = 'block';
            unsendBtn.onclick = () => {
                window.toggleModal('msg-action-modal', false);
                window.unsendMsg(type, convoId, msgKey);
            };
        } else {
            unsendBtn.style.display = 'none'; // Người khác thì giấu nút xóa đi
        }
    }

    window.toggleModal('msg-action-modal', true);
};

// 2. NÂNG CẤP HÀM GỬI CẢM XÚC (LƯU VÀO FIREBASE VÀ ĐÓNG MENU)
window.sendReaction = (emoji) => {
    if(!window.currentReactionTarget || !window.session) return;
    const { type, convoId, msgKey } = window.currentReactionTarget;
    let refPath = type.startsWith('global') ? `chat/${type}/${msgKey}/reactions/${window.session.id}` : `chat/${type}/${convoId}/${msgKey}/reactions/${window.session.id}`;
    
    if (emoji === 'remove') window.db.ref(refPath).remove();
    else window.db.ref(refPath).set(emoji);
    
    window.toggleModal('msg-action-modal', false);
};

// 3. BẢN VÁ: RENDER BONG BÓNG CHAT SẠCH SẼ (GIẤU NÚT, THÊM SỰ KIỆN CLICK)
window.renderMessage = (msg, isMe, msgKey, type, convoId) => {
    const align = isMe ? 'align-self:flex-end;' : 'align-self:flex-start;';
    const bgClass = isMe ? 'msg-me' : 'msg-other';
    const defaultBg = isMe ? 'background:var(--pink); color:white;' : 'background:var(--soft); color:var(--text);';
    const nameColor = isMe ? 'rgba(255,255,255,0.8)' : 'var(--text-light)';
    
    let txtHtml = msg.text;
    let isUnsent = false;
    
    if(txtHtml === '[UNSENT]') {
        txtHtml = '<i style="color:var(--text-light); font-size:12px;">Tin nhắn đã thu hồi</i>';
        isUnsent = true;
    } else if(txtHtml && txtHtml.startsWith('[IMG]') && txtHtml.endsWith('[/IMG]')) {
        let rawUrl = txtHtml.replace('[IMG]','').replace('[/IMG]','');
        let safeUrl = window.escapeHTML(rawUrl); 
        // Bấm vào ảnh thì phóng to ảnh, không mở Menu
        txtHtml = `<img src="${safeUrl}" style="max-height:180px; max-width:100%; border-radius:10px; cursor:pointer; display:block; margin-top:5px;" onclick="event.stopPropagation(); window.viewFullImage('${safeUrl}')">`;
    } else {
        txtHtml = window.escapeHTML(txtHtml);
    }

    const isAdmin = window.session && window.session.role === 'admin';

    // Đếm Cảm Xúc (Chỉ hiện khi có ai đó thả)
    let reactionHtml = '';
    if (msg.reactions) {
        let Object_keys = Object.keys(msg.reactions);
        if(Object_keys.length > 0) {
            let counts = {};
            for(let uid in msg.reactions) {
                let r = msg.reactions[uid];
                counts[r] = (counts[r] || 0) + 1;
            }
            // Cho phép bấm thẳng vào cục cảm xúc để mở Menu luôn
            reactionHtml = `<div class="msg-reaction-badge" style="position:absolute; bottom:-14px; ${isMe ? 'right:15px;' : 'left:15px;'} background:var(--card); border:1px solid var(--border); border-radius:20px; padding:3px 8px; font-size:13px; box-shadow:0 3px 8px rgba(0,0,0,0.15); display:flex; gap:4px; z-index:2; color:var(--text);" onclick="event.stopPropagation(); window.handleMessageLongPress(event, '${type}', '${convoId}', '${msgKey}', ${isMe}, ${isAdmin})">`;
            for(let r in counts) reactionHtml += `<span>${r} <small style="font-size:10px; font-weight:bold; opacity:0.7;">${counts[r]}</small></span>`;
            reactionHtml += `</div>`;
        }
    }

    const dName = (window.myNicknames && window.myNicknames[msg.id]) ? window.myNicknames[msg.id] : msg.name;

    // CỐT LÕI: Gắn sự kiện "Ấn giữ" (oncontextmenu) cho Mobile/PC và "Nhấp" (onclick) cho TV
    const clickEvent = isUnsent ? '' : `oncontextmenu="window.handleMessageLongPress(event, '${type}', '${convoId}', '${msgKey}', ${isMe}, ${isAdmin})" onclick="window.handleMessageLongPress(event, '${type}', '${convoId}', '${msgKey}', ${isMe}, ${isAdmin})"`;

    return `<div id="msg-${msgKey}" class="${bgClass}" style="max-width:75%; ${align} ${defaultBg} padding:10px 14px; border-radius:20px; position:relative; margin-bottom:24px; cursor:pointer; transition:0.2s;" ${clickEvent}>
        <div style="font-size:11px; font-weight:bold; margin-bottom:4px; color:${nameColor};" onclick="event.stopPropagation(); window.openUserProfile('${msg.id}')">${dName}</div>
        <div style="font-size:14.5px; word-break:break-word;">${txtHtml}</div>
        ${reactionHtml}
    </div>`;
};

// ==========================================
// KÍCH HOẠT HỆ THỐNG - ĐỪNG XÓA DÒNG NÀY!
// ==========================================
initFirebase();

// VÁ LỖI CÚ PHÁP: Đưa hàm này xuống DƯỚI initFirebase để hệ thống không bị sốc
firebase.auth().onAuthStateChanged(user => {
    if(user) {
        setTimeout(() => {
            if(window.session && window.db) {
                window.db.ref('nicknames/' + window.session.id).on('value', snap => {
                    window.myNicknames = snap.val() || {};
                    if(typeof window.renderRecentChats === 'function') window.renderRecentChats();
                    if(window.currentPrivateConvo) {
                        const targetId = window.currentPrivateConvo.split('_').find(id => id !== window.session.id);
                        if(targetId) {
                            const dName = window.myNicknames[targetId] || window.allUsersMap[targetId]?.name || targetId;
                            const titleEl = document.getElementById('private-chat-title');
                            if(titleEl) titleEl.innerHTML = `💬 ${dName} <span onclick="window.setNickname('${targetId}', '${dName}')" style="font-size:12px; cursor:pointer; color:var(--text-light); margin-left:5px;">✏️</span>`;
                        }
                    }
                });
            }
        }, 1500);
    }
});
// ==========================================
// BẢN VÁ: TƯƠNG THÍCH ĐIỀU KHIỂN REMOTE TV
// ==========================================

// 1. Tự động khoanh vùng ô nhập ID khi vừa vào web để Remote dễ điều khiển
window.addEventListener('load', () => {
    setTimeout(() => {
        const idInput = document.getElementById('username');
        if (idInput && !window.session) idInput.focus();
    }, 1500);
});

// 2. Ép nút "OK" trên Remote TV (phím Enter) hoạt động như thao tác chọc tay (Click)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const el = document.activeElement; // Lấy phần tử đang được khoanh vùng sáng
        
        // Bỏ qua nếu đang gõ chữ trong ô chat (để tránh gửi tin nhắn 2 lần)
        if (el.tagName === 'INPUT' && el.id.includes('chat-input')) return;
        
        // Nếu đang đứng ở các nút bấm hoặc danh sách, ép nó click
        if (el.tagName === 'BUTTON' || el.classList.contains('tt-item') || el.classList.contains('spy-convo-item')) {
            e.preventDefault(); // Chặn hành vi mặc định
            el.click();
        }
    }
});
