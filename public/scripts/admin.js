// في ملف admin.js

let usersData = []; 

// ------------------ الدوال الأساسية للـ UI ------------------

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showAlert(message, type = 'error', targetElementId = 'user-alert') {
    const alertBox = document.getElementById(targetElementId);
    
    if (!alertBox) {
        console.error(`Alert element with ID ${targetElementId} not found.`);
        return;
    }
    
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove('hidden');
    
    // استخدام users-table-body-alert كـ targetId خارج المودال
    if (type === 'success' && targetElementId !== 'user-alert') {
        setTimeout(() => alertBox.classList.add('hidden'), 3000);
    }
}

/**
 * دالة مشتركة لتحديث حالة الأزرار
 * @param {string} targetId - مُعرّف التبويب المستهدف
 */
function updateActiveTab(targetId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const clickedButton = document.querySelector(`.tab-btn[data-target="${targetId}"]`);
    if(clickedButton) {
         clickedButton.classList.add('active');
    }
}


// ------------------ دوال التبديل (المدمجة) ------------------

/**
 * دالة لعرض المحتوى الداخلي (Dashboard, Users)
 * @param {string} targetId - مُعرّف الـ div المستهدف
 */
function showTabContent(targetId) {
    const iframe = document.getElementById('content-iframe');
    
    // 1. إخفاء جميع الأقسام الداخلية والإطار
    document.querySelectorAll('.tab-content').forEach(div => {
        div.classList.add('hidden');
    });
    iframe.classList.add('hidden');
    iframe.src = ''; // مسح مصدر الإطار
    
    // 2. إظهار القسم الداخلي المستهدف
    document.getElementById(targetId).classList.remove('hidden');

    // 3. تحديث الأزرار
    updateActiveTab(targetId);

    // 4. تحميل البيانات إذا كان قسم المستخدمين
    if (targetId === 'users') {
        fetchUsers();
    }
}

/**
 * دالة لعرض المحتوى باستخدام iframe (Warehouses, Vehicles, Suppliers)
 * @param {string} targetId - مُعرّف التبويب المستهدف
 * @param {string} url - مسار الصفحة الخارجية
 */
function loadIframe(targetId, url) {
    const iframe = document.getElementById('content-iframe');

    // 1. إخفاء جميع الأقسام الداخلية
    document.querySelectorAll('.tab-content').forEach(div => {
        div.classList.add('hidden');
    });
    
    // 2. إظهار الـ iframe وتعيين مصدره
    iframe.classList.remove('hidden');
    iframe.src = url;

    // 3. تحديث الأزرار
    updateActiveTab(targetId);
}


// ------------------ دوال إدارة المستخدمين (Users) ------------------

function renderUsersTable(users) {
    const tableBody = document.getElementById('users-table-body'); 
    if (!tableBody) return; 

    tableBody.innerHTML = ''; 

    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #aaa;">
                    لا توجد مستخدمين حالياً لعرضهم.
                </td>
            </tr>
        `;
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        
        const roleClass = `role-${user.role ? user.role.toLowerCase() : 'default'}`;
        
        row.innerHTML = `
            <td>${user.user_id}</td>
            <td>${user.full_name || user.username || 'غير محدد'}</td>
            <td>${user.email || 'لا يوجد'}</td>
            <td><span class="role-badge ${roleClass}">${user.role || 'لا يوجد'}</span></td>
            <td>
                <button class="btn btn-danger delete-user" data-id="${user.id}">حذف</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function fetchUsers() {
    fetch('/api/users')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                usersData = data.users; 
                renderUsersTable(usersData); 
            } else {
                showAlert(data.message || 'فشل في جلب البيانات', 'error', 'users-table-body-alert'); 
            }
        })
        .catch(error => {
            console.error('Error fetching users:', error);
            showAlert('خطأ في الاتصال بالواجهة الخلفية لجلب المستخدمين.', 'error', 'users-table-body-alert'); 
        });
}

async function submitAddUser(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const user = Object.fromEntries(formData.entries());
    
    document.getElementById('user-alert').classList.add('hidden');

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showAlert('تم إضافة المستخدم بنجاح!', 'success', 'users-table-body-alert'); 
            closeModal('addUserModal');
            form.reset();
            fetchUsers(); 
        } else {
            const errorMessage = data.message || 'فشل في إضافة المستخدم. يرجى التحقق من البيانات المدخلة.';
            showAlert(errorMessage, 'error', 'user-alert'); 
        }
    } catch (error) {
        console.error('Error adding user:', error);
        showAlert('خطأ في الاتصال بالسيرفر لإضافة المستخدم.', 'error', 'user-alert'); 
    }
}


async function deleteUser(email) {
    if (!confirm(`هل أنت متأكد من أنك تريد حذف المستخدم صاحب البريد الإلكتروني: ${email}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
        return; 
    }

    try {
        const response = await fetch(`/api/users/delete-by-email`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showAlert(data.message, 'success', 'users-table-body-alert'); 
            fetchUsers(); 
        } else {
            showAlert(data.message || 'فشل في حذف المستخدم.', 'error', 'users-table-body-alert');
        }

    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('خطأ في الاتصال بالسيرفر لإجراء عملية الحذف.', 'error', 'users-table-body-alert');
    }
}


// ------------------ ربط الأحداث (Event Listeners) ------------------

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. عرض لوحة التحكم الافتراضية عند التحميل
    showTabContent('dashboard'); 
    
    // 2. ربط أزرار التبويب الداخلية (Dashboard, Users)
    document.querySelector('.sidebar').addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-btn')) {
            const targetId = e.target.getAttribute('data-target');
            const url = e.target.getAttribute('data-url');
            
            if (url) {
                // إذا كان الزر يحتوي على data-url (المستودعات، الآليات، الموردون)
                loadIframe(targetId, url);
            } else {
                // إذا لم يكن الزر يحتوي على data-url (الرئيسية، المستخدمون)
                showTabContent(targetId);
            }
        }
    });
    
    // 3. ربط زر فتح المودال والـ Form
    document.getElementById('open-add-user-modal').addEventListener('click', () => {
        document.getElementById('add-user-form').reset();
        document.getElementById('user-alert').classList.add('hidden');
        openModal('addUserModal');
    });
    
    document.getElementById('add-user-form').addEventListener('submit', submitAddUser);
    
    // 4. ربط حدث الحذف باستخدام البريد الإلكتروني (Event Delegation)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-user')) {
            const row = e.target.closest('tr'); 
            // الإيميل موجود في العمود الثالث (index 2)
            const emailCell = row.cells[2]; 
            const email = emailCell ? emailCell.textContent.trim() : null;

            if (email) {
                deleteUser(email); 
            } else {
                showAlert('فشل في العثور على البريد الإلكتروني للمستخدم.', 'error', 'users-table-body-alert');
            }
        }
    });
});