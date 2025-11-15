// مصفوفة لتخزين البيانات التي يتم جلبها من الخادم
let suppliers = []; 

// واجهة API الأساسية
const API_BASE_URL = '/api/suppliers';

// DOM جاهز
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة التبويبات
    initTabs();
    
    // جلب وعرض بيانات الموردين من الخادم عند بدء التشغيل
    fetchAndRenderSuppliers(); 
    
    // تهيئة النماذج
    initForms();
    
    // تهيئة البحث والتصفية
    initSearchFilter();
    
    // تهيئة النوافذ المنبثقة
    initModals();
});

// وظيفة تهيئة التبويبات
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // إزالة النشاط من جميع التبويبات والمحتويات
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            // إضافة النشاط للتبويب والمحتوى المحدد
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// 🛑 وظيفة مُصححة: جلب البيانات من الخادم وعرضها (Read - GET)
async function fetchAndRenderSuppliers(queryParams = '') {
    const tableBody = document.getElementById('suppliers-table-body');
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">جاري تحميل البيانات من الخادم...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE_URL}${queryParams}`);
        
        if (!response.ok) {
            alert("ERROR")
            // فشلت الاستجابة (مثل 404 أو 500)
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data = await response.json();
        
        // تحديث المصفوفة المحلية بالبيانات التي تم جلبها
        // يتوقع هيكل استجابة: { suppliers: [...] }
        suppliers = data.suppliers || []; 
        tableBody.innerHTML = '';
        
        if (suppliers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا توجد بيانات موردين لعرضها</td></tr>';
            renderReportTable(); 
            return;
        }
        
        // بناء وعرض صفوف الجدول
        suppliers.forEach(supplier => {
            const row = document.createElement('tr');
            let stars = '★'.repeat(supplier.rating) + '☆'.repeat(5 - supplier.rating);
            
            row.innerHTML = `
                <td>${supplier.id}</td>
                <td>${supplier.name}</td>
                <td>${supplier.specialization}</td>
                <td>${supplier.category}</td>
                <td class="rating-stars">${stars}</td>
                <td>${supplier.primary_phone}</td>
                <td><span class="status-badge ${supplier.status === 'active' ? 'status-active' : 'status-inactive'}">${supplier.status === 'active' ? 'نشط' : 'غير نشط'}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm view-supplier" data-id="${supplier.id}">عرض</button>
                    <button class="btn btn-warning btn-sm edit-supplier" data-id="${supplier.id}">تعديل</button>
                    <button class="btn btn-danger btn-sm delete-supplier" data-id="${supplier.id}">حذف</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // إضافة معالجات الأحداث للأزرار بعد بناء الجدول
        addSupplierActionListeners();
        // تحديث جدول التقارير بناءً على البيانات الجديدة
        renderReportTable();

    } catch (error) {
        console.error('Error fetching suppliers:', error);
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">حدث خطأ أثناء جلب البيانات من الخادم.</td></tr>';
        showAlert('فشل الاتصال بالخادم أو جلب البيانات. تحقق من راوت GET في الباك إند.', 'danger');
    }
}

// وظيفة مساعدة لإضافة معالجات الأحداث
function addSupplierActionListeners() {
    document.querySelectorAll('.view-supplier').forEach(btn => {
        btn.addEventListener('click', function() {
            const supplierId = parseInt(this.getAttribute('data-id'));
            viewSupplier(supplierId);
        });
    });
    
    document.querySelectorAll('.edit-supplier').forEach(btn => {
        btn.addEventListener('click', function() {
            const supplierId = parseInt(this.getAttribute('data-id'));
            fetchSupplierForEdit(supplierId); 
        });
    });
    
    document.querySelectorAll('.delete-supplier').forEach(btn => {
        btn.addEventListener('click', function() {
            const supplierId = parseInt(this.getAttribute('data-id'));
            confirmDelete(supplierId);
        });
    });
}

// 🛑 وظيفة مُصححة: جلب مورد واحد للتعديل (Read - GET)
async function fetchSupplierForEdit(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const supplier = await response.json();
        
        // ملء النموذج ببيانات المورد (باستخدام أسماء الحقول كما هي من الـ DB/Back-end: snake_case)
        document.getElementById('supplier-name').value = supplier.name;
        document.getElementById('supplier-specialization').value = supplier.specialization;
        document.getElementById('supplier-category').value = supplier.category;
        document.getElementById('supplier-rating').value = supplier.rating;
        document.getElementById('contact-person').value = supplier.contact_person;
        document.getElementById('primary-phone').value = supplier.primary_phone;
        document.getElementById('secondary-phone').value = supplier.secondary_phone;
        document.getElementById('email').value = supplier.email;
        document.getElementById('address').value = supplier.address;
        document.getElementById('commercial-reg').value = supplier.commercial_reg;
        document.getElementById('tax-number').value = supplier.tax_number;
        document.getElementById('payment-terms').value = supplier.payment_terms;
        document.getElementById('currency').value = supplier.currency;
        
        // تبديل إلى تبويب إضافة مورد جديد
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        document.querySelector('.tab[data-tab="add-supplier"]').classList.add('active');
        document.getElementById('add-supplier').classList.add('active');
        
        // تغيير نص زر الحفظ والإشارة إلى التعديل
        const submitBtn = document.querySelector('#supplier-form button[type="submit"]');
        submitBtn.textContent = 'تحديث المورد';
        submitBtn.setAttribute('data-edit-id', id);

    } catch (error) {
        console.error('Error fetching supplier for edit:', error);
        showAlert('فشل جلب بيانات المورد للتعديل', 'danger');
    }
}

// 🛑 وظيفة مُصححة: عرض تفاصيل المورد (Read - GET)
async function viewSupplier(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const supplier = await response.json();
        
        // توليد نجوم التقييم
        let stars = '★'.repeat(supplier.rating) + '☆'.repeat(5-supplier.rating);

        const detailsHtml = `
            <div class="form-grid">
                <div class="form-group">
                    <label>اسم المورد:</label>
                    <p>${supplier.name}</p>
                </div>
                <div class="form-group">
                    <label>التخصص:</label>
                    <p>${supplier.specialization}</p>
                </div>
                <div class="form-group">
                    <label>التصنيف:</label>
                    <p>${supplier.category}</p>
                </div>
                <div class="form-group">
                    <label>التقييم:</label>
                    <p class="rating-stars">${stars}</p>
                </div>
                <div class="form-group">
                    <label>الشخص المسؤول:</label>
                    <p>${supplier.contact_person}</p>
                </div>
                <div class="form-group">
                    <label>الهاتف الرئيسي:</label>
                    <p>${supplier.primary_phone}</p>
                </div>
                <div class="form-group">
                    <label>الهاتف الاحتياطي:</label>
                    <p>${supplier.secondary_phone || 'غير متوفر'}</p>
                </div>
                <div class="form-group">
                    <label>البريد الإلكتروني:</label>
                    <p>${supplier.email || 'غير متوفر'}</p>
                </div>
                <div class="form-group">
                    <label>العنوان:</label>
                    <p>${supplier.address}</p>
                </div>
                <div class="form-group">
                    <label>رقم السجل التجاري:</label>
                    <p>${supplier.commercial_reg || 'غير متوفر'}</p>
                </div>
                <div class="form-group">
                    <label>الرقم الضريبي:</label>
                    <p>${supplier.tax_number || 'غير متوفر'}</p>
                </div>
                <div class="form-group">
                    <label>شروط الدفع:</label>
                    <p>${supplier.payment_terms}</p>
                </div>
                <div class="form-group">
                    <label>عملة التعامل:</label>
                    <p>${supplier.currency}</p>
                </div>
            </div>
        `;
        
        document.getElementById('supplier-details').innerHTML = detailsHtml;
        document.getElementById('details-modal').style.display = 'flex';

    } catch (error) {
        console.error('Error viewing supplier:', error);
        showAlert('فشل جلب تفاصيل المورد', 'danger');
    }
}


// وظيفة تأكيد الحذف
function confirmDelete(id) {
    const modal = document.getElementById('delete-modal');
    modal.style.display = 'flex';
    
    document.getElementById('confirm-delete').onclick = function() {
        deleteSupplier(id); 
        modal.style.display = 'none';
    };
    
    document.getElementById('cancel-delete').onclick = function() {
        modal.style.display = 'none';
    };
}


// 🛑 وظيفة مُصححة: حذف المورد (Delete - DELETE)
async function deleteSupplier(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('تم حذف المورد بنجاح', 'success');
            await fetchAndRenderSuppliers();
            
        } else {
            const data = await response.json();
            showAlert(`فشل حذف المورد: ${data.message || 'خطأ غير معروف'}`, 'danger');
        }
    } catch (error) {
        console.error('Error deleting supplier:', error);
        showAlert('فشل الاتصال بالخادم أثناء الحذف', 'danger');
    }
}


// وظيفة تهيئة النماذج
function initForms() {
    const supplierForm = document.getElementById('supplier-form');
    
    supplierForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const editId = document.querySelector('#supplier-form button[type="submit"]').getAttribute('data-edit-id');
        
        if (editId) {
            updateSupplier(parseInt(editId));
        } else {
            addSupplier();
        }
    });
    
    // إعادة تعيين النموذج
    supplierForm.addEventListener('reset', function() {
        const submitBtn = document.querySelector('#supplier-form button[type="submit"]');
        submitBtn.textContent = 'حفظ المورد';
        submitBtn.removeAttribute('data-edit-id');
    });
}

// 🛑 وظيفة مُصححة: إضافة مورد جديد (Create - POST)
async function addSupplier() {
    // جمع البيانات من النموذج وإرسالها بأسماء أعمدة قاعدة البيانات (snake_case)
    const newSupplier = {
        name: document.getElementById('supplier-name').value,
        specialization: document.getElementById('supplier-specialization').value,
        category: document.getElementById('supplier-category').value,
        rating: parseInt(document.getElementById('supplier-rating').value),
        contact_person: document.getElementById('contact-person').value, 
        primary_phone: document.getElementById('primary-phone').value, 
        secondary_phone: document.getElementById('secondary-phone').value, 
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        commercial_reg: document.getElementById('commercial-reg').value, 
        tax_number: document.getElementById('tax-number').value, 
        payment_terms: document.getElementById('payment-terms').value, 
        currency: document.getElementById('currency').value
    };
    
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newSupplier)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            document.getElementById('supplier-form').reset();
            showAlert('تم إضافة المورد بنجاح', 'success');
            await fetchAndRenderSuppliers();
            
        } else {
            showAlert(`فشل إضافة المورد: ${data.message || 'خطأ غير معروف'}`, 'danger');
        }
        
    } catch (error) {
        console.error('Error adding supplier:', error);
        showAlert('فشل الاتصال بالخادم أثناء الإضافة', 'danger');
    }
}

// 🛑 وظيفة مُصححة: تحديث مورد موجود (Update - PUT)
async function updateSupplier(id) {
    const updatedData = {
        name: document.getElementById('supplier-name').value,
        specialization: document.getElementById('supplier-specialization').value,
        category: document.getElementById('supplier-category').value,
        rating: parseInt(document.getElementById('supplier-rating').value),
        contact_person: document.getElementById('contact-person').value,
        primary_phone: document.getElementById('primary-phone').value,
        secondary_phone: document.getElementById('secondary-phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        commercial_reg: document.getElementById('commercial-reg').value,
        tax_number: document.getElementById('tax-number').value,
        payment_terms: document.getElementById('payment-terms').value,
        currency: document.getElementById('currency').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            document.getElementById('supplier-form').reset();
            const submitBtn = document.querySelector('#supplier-form button[type="submit"]');
            submitBtn.textContent = 'حفظ المورد';
            submitBtn.removeAttribute('data-edit-id');

            showAlert('تم تحديث المورد بنجاح', 'success');
            await fetchAndRenderSuppliers();
            
        } else {
            showAlert(`فشل تحديث المورد: ${data.message || 'خطأ غير معروف'}`, 'danger');
        }
    } catch (error) {
        console.error('Error updating supplier:', error);
        showAlert('فشل الاتصال بالخادم أثناء التحديث', 'danger');
    }
}


// 🛑 وظيفة مُصححة: تهيئة البحث والتصفية (Read - GET مع Query Params)
function initSearchFilter() {
    document.getElementById('search-btn').addEventListener('click', function() {
        const nameSearch = document.getElementById('search-name').value;
        const categoryFilter = document.getElementById('filter-category').value;
        const ratingFilter = document.getElementById('filter-rating').value;
        const statusFilter = document.getElementById('filter-status').value;

        // بناء Query String لإرساله للخادم (باستخدام أسماء الـ Query Params التي يتوقعها الباك إند)
        const params = new URLSearchParams();
        if (nameSearch) params.append('search', nameSearch);
        if (categoryFilter) params.append('category', categoryFilter);
        if (ratingFilter) params.append('min_rating', ratingFilter);
        if (statusFilter) params.append('status', statusFilter);

        // استدعاء دالة الجلب مع عوامل التصفية
        fetchAndRenderSuppliers(`?${params.toString()}`);
    });
    
    document.getElementById('reset-filters').addEventListener('click', function() {
        document.getElementById('search-name').value = '';
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-rating').value = '';
        document.getElementById('filter-status').value = '';
        // إعادة جلب جميع الموردين
        fetchAndRenderSuppliers(); 
    });
}

// 🛑 وظيفة مُصححة: عرض جدول التقارير
function renderReportTable() {
    const tableBody = document.getElementById('report-table-body');
    tableBody.innerHTML = '';
    
    if (suppliers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد بيانات لعرضها</td></tr>';
        return;
    }
    
    suppliers.forEach(supplier => {
        const row = document.createElement('tr');
        
        let stars = '★'.repeat(supplier.rating) + '☆'.repeat(5 - supplier.rating);
        
        row.innerHTML = `
            <td>${supplier.name}</td>
            <td>${supplier.specialization}</td>
            <td>${supplier.category}</td>
            <td class="rating-stars">${stars}</td>
            <td>${supplier.transactions}</td>
            <td>${formatCurrency(supplier.total_value, supplier.currency)}</td> 
        `;
        
        tableBody.appendChild(row);
    });
}

// وظيفة تهيئة النوافذ المنبثقة
function initModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // إغلاق النوافذ المنبثقة عند النقر على X
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // إغلاق النوافذ المنبثقة عند النقر خارجها
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// وظيفة إظهار التنبيهات
function showAlert(message, type) {
    const alertDiv = document.getElementById('alert-message');
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.display = 'block';
    
    // إخفاء التنبيه بعد 5 ثوان
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

// وظيفة مساعدة لتنسيق العملة
function formatCurrency(amount, currency) {
    const formatter = new Intl.NumberFormat('ar-SY', {
        style: 'currency',
        currency: currency
    });
    
    return formatter.format(amount);
}

// معالجات أحداث أزرار التقارير
document.getElementById('generate-report').addEventListener('click', function() {
    showAlert('تم إنشاء التقرير بنجاح', 'success');
});

document.getElementById('export-report').addEventListener('click', function() {
    showAlert('تم تصدير التقرير بنجاح', 'success');
});