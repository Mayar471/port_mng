/* ===== API Constants & Initialization ===== */
// العنوان الأساسي لجميع مكالمات API
const API_BASE_URL = '/api'; 

// مصفوفات للتخزين المؤقت لبيانات المخزون والموردين (لتغذية القوائم المنسدلة وتجنب التحميل المتكرر)
let INVENTORY_ITEMS = []; 
let SUPPLIERS = []; 

// عند تحميل الصفحة، ابدأ بتحميل وعرض جميع البيانات
document.addEventListener('DOMContentLoaded', renderAll);


/* ===== Utility Functions (Alerts, Modals, Network) ===== */

// وظيفة عرض التنبيهات على الشاشة
function showAlert(message, type = 'success') {
    const alertEl = document.getElementById('lowStockAlert');
    alertEl.classList.remove('hidden', 'alert-success', 'alert-danger', 'alert-warning');
    alertEl.classList.add('alert', `alert-${type}`);
    alertEl.textContent = message;
    setTimeout(() => {
        alertEl.classList.add('hidden');
    }, 5000);
}

// دالة مساعدة لجلب البيانات من الـ API (GET Requests)
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const result = await response.json();
        if (!response.ok || !result.success) {
            // في حالة عدم النجاح (status: 200, success: false)، أو خطأ HTTP (response.ok: false)
            throw new Error(result.message || 'فشل في جلب البيانات من الخادم.');
        }
        return result;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        showAlert(`خطأ في جلب البيانات: ${error.message}`, 'danger');
        return null;
    }
}

// دالة مساعدة لإرسال البيانات إلى الـ API (POST Requests)
async function postData(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST', // نستخدم POST للتعديل والإضافة في هذا النظام
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'فشل تنفيذ العملية على الخادم.');
        }
        return result;
    } catch (error) {
        console.error(`Error posting to ${endpoint}:`, error);
        showAlert(`خطأ في تنفيذ العملية: ${error.message}`, 'danger');
        return null;
    }
}

// الوظائف الأصلية للـ Modal و الـ HTML Escaping (تم الحفاظ عليها)
function modal(html) { document.getElementById('modalRoot').innerHTML = `<div class='modal-bg'> <div class='modal'>${html}</div> </div>`; }
function closeModal() { document.getElementById('modalRoot').innerHTML = ''; }
function readFileAsDataURL(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); }); }
function escapeHtml(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }


/* ===== Section Navigation & Global Render (العرض الشامل) ===== */
function show(id) { 
    ['inventory', 'requests', 'suppliers', 'transactions'].forEach(x => document.getElementById(x).classList.add('hidden')); 
    document.getElementById(id).classList.remove('hidden'); 
}

async function renderAll() { 
    // يجب أولاً جلب البيانات الضرورية للقوائم المنسدلة (المخزون والموردين)
    await populateDropdowns(); 
    
    // عرض الجداول
    await renderItems(); 
    await renderRequests(); 
    await renderSuppliers(); 
    await renderTransactions(); 
    
    // التحقق من انخفاض المخزون بعد تحميله
    checkLowStock(); 
}

// دالة لجلب البيانات الأساسية للقوائم المنسدلة وتحديث الذاكرة المؤقتة
async function populateDropdowns() {
    // يجب أن تكون '/inventory/items' نقطة نهاية موجودة
    const itemData = await fetchData('/inventory/items'); 
    if (itemData) {
        INVENTORY_ITEMS = itemData.items;
    }
    // يجب أن تكون '/suppliers' نقطة نهاية موجودة
    const supData = await fetchData('/suppliers'); 
    if (supData) {
        SUPPLIERS = supData.suppliers;
    }
}


/* ===== Inventory Items (المخزون) API Functions ===== */

function checkLowStock() { 
    const low = INVENTORY_ITEMS.filter(i => i.current_qty <= i.min_stock); 
    const alertEl = document.getElementById('lowStockAlert'); 
    
    alertEl.classList.remove('alert-warning', 'alert-success', 'hidden'); 
    
    if (low.length > 0) { 
        alertEl.classList.remove('hidden'); 
        alertEl.textContent = `تنبيه: ${low.length} مادة وصلت للحد الأدنى أو أقل.`; 
        alertEl.classList.add('alert-warning');
    } else { 
        alertEl.classList.add('hidden'); 
        alertEl.textContent = ''; 
    } 
}

async function renderItems() {
    const tbody = document.querySelector('#itemsTable tbody'); 
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">جاري تحميل المخزون...</td></tr>';
    
    const data = await fetchData('/inventory/items');
    if (!data) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">فشل تحميل بيانات المخزون.</td></tr>';
        return;
    }
    
    INVENTORY_ITEMS = data.items;
    const q = document.getElementById('searchItem').value.trim().toLowerCase(); 
    tbody.innerHTML = ''; 
    
    INVENTORY_ITEMS.filter(it => !q || it.item_name.toLowerCase().includes(q) || it.item_code.toLowerCase().includes(q)).forEach(it => {
        // الـ images تأتي كـ مصفوفة جاهزة من الـ API
        const imgs = (it.images || []).map(src => `<img src="${src}" class="img-thumb">`).join(' '); 
        const locationText = `${it.warehouse_name || 'غير محدد'}/${it.rack || '-'}/${it.location_code || '-'}`;
        
        const tr = document.createElement('tr'); 
        tr.innerHTML = `
            <td>${escapeHtml(it.item_code)}</td>
            <td style="cursor:pointer;color:#2980b9" onclick="openEditItemModal(${it.item_id})">${escapeHtml(it.item_name)}</td>
            <td>${it.current_qty} ${escapeHtml(it.unit)}</td>
            <td>${it.min_stock}</td>
            <td>${locationText}</td>
            <td>${imgs}</td>
            <td><button class='btn' onclick='openEditItemModal(${it.item_id})'>تعديل</button></td>
        `; 
        tbody.appendChild(tr);
    });
    checkLowStock();
}

function openAddItemModal() {
    modal(`<h3>إضافة مادة جديدة بالكامل</h3>
        <input id='itm_code' placeholder='كود المادة' required>
        <input id='itm_name' placeholder='اسم المادة' required>
        <input id='itm_qty' type='number' placeholder='الكمية الأولية (استلام)' value='0' min='0' step='0.01'>
        <input id='itm_min' type='number' placeholder='الحد الأدنى' value='5' min='0'>
        <input id='itm_unit' placeholder='الوحدة (مثال: قطعة)' value='قطعة'>
        <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:15px'>
            <button class='btn btn-primary' onclick='saveNewItem()'>➕ حفظ وإضافة</button>
            <button class='btn secondary' onclick='closeModal()'>إلغاء</button>
        </div>
    `);
}

async function saveNewItem() {
    const code = document.getElementById('itm_code').value.trim();
    const name = document.getElementById('itm_name').value.trim();
    const qty = Number(document.getElementById('itm_qty').value);
    const min = Number(document.getElementById('itm_min').value);
    const unit = document.getElementById('itm_unit').value || 'قطعة';
    const files = document.getElementById('itm_images').files;

    if (!name || !code) { 
        showAlert('الرجاء إدخال كود واسم المادة.', 'warning');
        return; 
    }
    
    const payload = { code, name, qty, min, unit, user: 'مشرف' };
    
    // معالجة الصور وإرسالها كـ JSON string
    if (files && files.length) {
        try {
            const readers = []; 
            for (let i = 0; i < files.length; i++) { 
                readers.push(readFileAsDataURL(files[i])); 
            }
            const results = await Promise.all(readers);
            payload.images = JSON.stringify(results); 
        } catch (e) {
             showAlert('فشل معالجة الصور.', 'danger');
             return;
        }
    }

    // استخدام API إضافة مادة جديدة
    const result = await postData('/inventory/new', payload);
    if (result) {
        showAlert(result.message);
        closeModal();
        renderAll();
    }
}

/**
 * دالة جديدة: تفتح نموذج تعديل البيانات الوصفية للمادة
 */
function openEditItemModal(id) {
    const item = INVENTORY_ITEMS.find(i => i.item_id === id);
    if (!item) return showAlert('المادة غير موجودة في المخزون المؤقت.', 'danger');
    
    // عرض الصور الحالية
    const currentImagesHtml = (item.images || []).map(src => `<img src="${src}" class="img-thumb" style="max-height: 50px; margin: 5px; border: 1px solid #ccc;">`).join('');

    modal(`<h3>تعديل بيانات المادة: ${escapeHtml(item.item_name)}</h3>
        <input id='edit_code' placeholder='كود المادة' value='${escapeHtml(item.item_code)}' required>
        <input id='edit_name' placeholder='اسم المادة' value='${escapeHtml(item.item_name)}' required>
        <input id='edit_min' type='number' placeholder='الحد الأدنى' value='${item.min_stock}' min='0'>
        <input id='edit_unit' placeholder='الوحدة (مثال: قطعة)' value='${escapeHtml(item.unit)}'>
        
        <label class='small'>الموقع الحالي (غير قابل للتعديل حالياً في هذا النموذج): ${item.location_code || 'غير محدد'}</label>
        
        <hr style="margin: 10px 0;">    
        <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:15px'>
            <button class='btn btn-primary' onclick='saveEditItem(${item.item_id})'>💾 حفظ التعديلات</button>
            <button class='btn secondary' onclick='closeModal()'>إلغاء</button>
        </div>
    `);
}

/**
 * دالة جديدة: لحفظ تعديلات البيانات الوصفية للمادة عبر API
 */
async function saveEditItem(id) {
    const code = document.getElementById('edit_code').value.trim();
    const name = document.getElementById('edit_name').value.trim();
    // التأكد من أن القيمة رقمية
    const min_stock = parseFloat(document.getElementById('edit_min').value); 
    const unit = document.getElementById('edit_unit').value || 'قطعة';
    const files = document.getElementById('edit_images').files;

    if (!name || !code || isNaN(min_stock)) { 
        showAlert('الرجاء إدخال كود واسم المادة والحد الأدنى بشكل صحيح.', 'warning');
        return; 
    }
    
    // بناء حمولة البيانات
    const payload = { code, name, min_stock, unit };
    
    // معالجة الصور الجديدة
    if (files && files.length > 0) {
        try {
            const readers = []; 
            for (let i = 0; i < files.length; i++) { 
                readers.push(readFileAsDataURL(files[i])); 
            }
            const results = await Promise.all(readers);
            // new_images هو الحقل المتوقع في API التعديل
            payload.new_images = JSON.stringify(results); 
        } catch (e) {
             showAlert('فشل معالجة الصور المرفقة.', 'danger');
             return;
        }
    }

    // استدعاء API تعديل المادة
    const result = await postData(`/inventory/edit/${id}`, payload);
    if (result) {
        showAlert(result.message);
        closeModal();
        renderAll();
    }
}


/* ===== استلام/صرف (Issue/Receive Modals) API Functions ===== */

function openIssueModal() {
    if (INVENTORY_ITEMS.length === 0) {
        return showAlert('يجب تحميل بيانات المخزون أولاً.', 'warning');
    }
    const itemOptions = INVENTORY_ITEMS.map(i => `<option value='${i.item_id}'>${escapeHtml(i.item_name)} (${i.item_code}) - متوفر: ${i.current_qty}</option>`).join('');
    
    modal(`<h3>صرف مادة من المخزون</h3>
        <select id='iss_item' required><option value=''>--- اختر المادة ---</option>${itemOptions}</select>
        <input id='iss_qty' type='number' placeholder='الكمية المراد صرفها' min='0.01' step='0.01' required>
        <input id='iss_ref' placeholder='مرجع (طلب/سند صرف/عمل صيانة)'>
        <input id='iss_user' placeholder='اسم الموظف الذي قام بالصرف' value='مشرف النظام'>
       
        <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:15px'>
            <button class='btn btn-warning' onclick='saveIssue()'>صرف المادة</button>
            <button class='btn secondary' onclick='closeModal()'>إلغاء</button>
        </div>`);
}

async function saveIssue() { 
    const id = Number(document.getElementById('iss_item').value); 
    const qty = Number(document.getElementById('iss_qty').value);
    const ref = document.getElementById('iss_ref').value || 'صرف يدوي'; 
    const user = document.getElementById('iss_user').value || 'مشرف النظام'; 
    const file = document.getElementById('iss_file').files[0];
    
    if (!qty || !id) { 
        showAlert('الرجاء اختيار مادة وإدخال كمية صحيحة.', 'warning'); 
        return; 
    } 

    const it = INVENTORY_ITEMS.find(x => x.item_id === id); 
    if (it && it.current_qty < qty && !confirm(`المخزون المتوفر (${it.current_qty}) غير كافٍ لصرف الكمية المطلوبة (${qty}). هل تريد السماح بالرصيد السالب؟`)) {
        return;
    }
    
    const payload = { item_id: id, qty, reference: ref, user };
    
    if (file) {
        try {
            const dataURL = await readFileAsDataURL(file);
            payload.attachment_paths = JSON.stringify([dataURL]);
        } catch (e) {
             showAlert('فشل معالجة المرفق.', 'danger');
             return;
        }
    }
    
    // استخدام API تسجيل الصرف
    const result = await postData('/inventory/issue', payload);
    
    if (result) {
        showAlert(result.message, 'warning');
        closeModal();
        renderAll();
    }
}


/* ===== Suppliers (الموردون) API Functions ===== */

async function renderSuppliers() { 
    const tbody = document.querySelector('#supTable tbody'); 
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">جاري تحميل الموردين...</td></tr>';
    
    const data = await fetchData('/suppliers');
    if (!data) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">فشل تحميل بيانات الموردين.</td></tr>';
        return;
    }
    
    SUPPLIERS = data.suppliers; 
    tbody.innerHTML = '';
    
    // ملاحظة: الحقول في الـ API هي name, primary_phone, contact_person, address
    SUPPLIERS.forEach(s => { 
        const tr = document.createElement('tr'); 
        tr.innerHTML = `
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.primary_phone || '-')}</td>
            <td>${escapeHtml(s.contact_person || '-')}</td>
            <td>${escapeHtml(s.address || '-')}</td>
            <td><button class='btn' onclick='editSupplier(${s.supplier_id})'>تعديل</button></td>
        `; 
        tbody.appendChild(tr); 
    }); 
}

function openAddSupplierModal() {
    modal(`<h3>إضافة مورد جديد</h3>
        <input id='sup_name' placeholder='اسم المورد' required>
        <input id='sup_phone' placeholder='هاتف أساسي'>
        <input id='sup_contact' placeholder='مسؤول الاتصال' required>
        <input id='sup_addr' placeholder='عنوان المورد'>
        <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:15px'>
            <button class='btn btn-primary' onclick='saveSupplier()'>حفظ</button>
            <button class='btn secondary' onclick='closeModal()'>إلغاء</button>
        </div>`);
}
// **ملاحظة:** يتم افتراض أن /api/suppliers يقبل POST لإضافة مورد جديد
async function saveSupplier() { 
    const name = document.getElementById('sup_name').value || ''; 
    const contact_person = document.getElementById('sup_contact').value || '';
    
    if (!name || !contact_person) { 
        showAlert('ادخل اسم المورد واسم مسؤول الاتصال.', 'warning'); 
        return; 
    } 

    const payload = { 
        name, 
        primary_phone: document.getElementById('sup_phone').value || null, 
        contact_person, 
        address: document.getElementById('sup_addr').value || null,
        specialization: 'غير محدد',
        payment_terms: 'غير محدد',
        currency: 'SYP',
        rating: 5 // قيمة افتراضية للتقييم، مطلوبة في API الإضافة
    };
    
    const result = await postData('/suppliers', payload);
    
    if (result) {
        showAlert('تم إضافة المورد بنجاح.');
        closeModal();
        renderAll();
    }
}

function editSupplier(id) { 
    // يجب استخدام supplier_id من قاعدة البيانات
    const s = SUPPLIERS.find(x => x.supplier_id === id); 
    if (!s) return showAlert('المورد غير موجود.', 'danger');
    
    modal(`<h3>تعديل مورد</h3>
        <input id='su_name' value='${escapeHtml(s.name)}' placeholder='اسم المورد'>
        <input id='su_phone' value='${escapeHtml(s.primary_phone || '')}' placeholder='هاتف أساسي'>
        <input id='su_contact' value='${escapeHtml(s.contact_person || '')}' placeholder='مسؤول الاتصال'>
        <input id='su_addr' value='${escapeHtml(s.address || '')}' placeholder='عنوان المورد'>
        
        <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:15px'>
            <button class='btn btn-primary' onclick='saveEditSupplier(${id})'>حفظ التعديلات</button>
            <button class='btn secondary' onclick='closeModal()'>إلغاء</button>
        </div>`);
}

async function saveEditSupplier(id) { 
    const payload = {
        name: document.getElementById('su_name').value,
        primary_phone: document.getElementById('su_phone').value,
        contact_person: document.getElementById('su_contact').value,
        address: document.getElementById('su_addr').value
    };
    
    // استخدام API تعديل المورد
    // ملاحظة: يجب أن يقبل /suppliers/edit/:id الحقول الأربعة المطلوبة
    const result = await postData(`/suppliers/edit/${id}`, payload);
    
    if (result) {
        showAlert(result.message);
        closeModal();
        renderAll();
    }
}


/* ===== Transactions (الحركات) API Functions ===== */

async function renderTransactions() { 
    const tbody = document.querySelector('#transTable tbody'); 
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">جاري تحميل سجل الحركات...</td></tr>';
    
    // يجب أن تكون '/inventory/transactions' نقطة نهاية موجودة
    const data = await fetchData('/inventory/transactions');
    if (!data) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">فشل تحميل سجل الحركات.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    data.transactions.forEach(t => { 
        const dateString = new Date(t.date).toLocaleString('ar-SY', { dateStyle: 'short', timeStyle: 'short' });
        const qtyDisplay = t.type === 'صرف' ? `<span style="color:red;font-weight:bold">${t.qty}</span>` : `<span style="color:green;font-weight:bold">+${t.qty}</span>`;
        
        const tr = document.createElement('tr'); 
        tr.innerHTML = `
            <td>${t.id}</td>
            <td>${t.type}</td>
            <td>${escapeHtml(t.itemName || '-')}</td>
            <td>${qtyDisplay}</td>
            <td>${escapeHtml(t.reference || '')}</td>
            <td>${escapeHtml(t.user || '')}</td>
            <td>${dateString}</td>
            <td><button class='btn' onclick='openTransactionDetail(${t.id})'>تفاصيل</button></td>
        `; 
        tbody.appendChild(tr); 
    }); 
}

/* ===== Transactions (الحركات) API Functions (القسم الذي يحوي الوظيفة) ===== */

// ... (بقية دوال القسم)

async function openTransactionDetail(id) {
    const data = await fetchData(`/inventory/transactions/${id}`);
    
    if (!data || !data.transaction) {
        // رسالة الخطأ يتم عرضها بالفعل عبر showAlert في دالة fetchData
        return;
    }

    const t = data.transaction;
    const dateString = new Date(t.date).toLocaleString('ar-SY', { dateStyle: 'full', timeStyle: 'short' });
    const qtyChange = t.qty > 0 ? `+${t.qty}` : t.qty;
    
    // معالجة المرفقات
    let attachmentsHtml = 'لا توجد مرفقات.';
    if (t.attachment_paths) {
        try {
            // يتم افتراض أن attachment_paths هو JSON string لمسارات/DataURLs الصور
            const paths = JSON.parse(t.attachment_paths);
            if (Array.isArray(paths) && paths.length > 0) {
                attachmentsHtml = paths.map(src => `<img src="${src}" class="img-thumb" style="max-height: 100px; margin: 5px; border: 1px solid #ccc;">`).join('');
            }
        } catch (e) {
            console.error('Error parsing attachment_paths:', e);
            attachmentsHtml = 'فشل في عرض المرفقات.';
        }
    }

    modal(`
        <style>
            .detail-table th, .detail-table td { padding: 8px; text-align: right; border-bottom: 1px solid #eee; }
            .detail-table th { background-color: #f7f7f7; width: 30%; }
        </style>
        <h3>تفاصيل الحركة #${t.id}</h3>
        <table class="detail-table" style="width: 100%; border-collapse: collapse;">
            <tr><th>نوع الحركة</th><td>${escapeHtml(t.type)}</td></tr>
            <tr><th>المادة</th><td>${escapeHtml(t.item_name)} (${escapeHtml(t.item_code)})</td></tr>
            <tr><th>تغيّر الكمية</th><td><span style="font-weight: bold; color: ${t.qty > 0 ? 'green' : 'red'};">${qtyChange}</span> ${escapeHtml(t.unit)}</td></tr>
            <tr><th>التاريخ والوقت</th><td>${dateString}</td></tr>
            <tr><th>المرجع</th><td>${escapeHtml(t.reference || '-')}</td></tr>
            <tr><th>المستخدم</th><td>${escapeHtml(t.user || '-')}</td></tr>
        </table>
        
        <h4>المرفقات</h4>
        <div style="display: flex; flex-wrap: wrap; border: 1px dashed #ccc; padding: 10px; min-height: 50px; justify-content: center;">
            ${attachmentsHtml}
        </div>

        <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:20px'>
            <button class='btn btn-primary' onclick='window.print()'>🖨️ طباعة السجل</button>
            <button class='btn secondary' onclick='closeModal()'>إغلاق</button>
        </div>
    `);
}


/* ===== Requests (الطلبات) API Functions ===== */

async function renderRequests() { 
    const tbody = document.querySelector('#reqTable tbody'); 
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">جاري تحميل الطلبات...</td></tr>';
    
    // يجب أن تكون '/requests' نقطة نهاية موجودة
    const data = await fetchData('/requests');
    if (!data) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">فشل تحميل قائمة الطلبات.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    data.requests.forEach(r => { 
        const dateString = new Date(r.date).toLocaleString('ar-SY', { dateStyle: 'short', timeStyle: 'short' });
        
        const actionButton = r.status === 'جديد' ? 
            `<button class='btn btn-success' onclick='approveRequest(${r.id})'>اعتماد وصرف</button>` : ''; 
        
        const tr = document.createElement('tr'); 
        tr.innerHTML = `
            <td>${r.id}</td>
            <td>${escapeHtml(r.itemName)} (${escapeHtml(r.itemCode)})</td>
            <td>${r.qty}</td>
            <td>${escapeHtml(r.requested_by)}</td>
            <td>${r.status}</td>
            <td>${dateString}</td>
            <td>${actionButton}</td>
        `; 
        tbody.appendChild(tr); 
    }); 
}

function openNewRequestModal() {
    if (INVENTORY_ITEMS.length === 0) {
        return showAlert('يجب تحميل بيانات المخزون أولاً.', 'warning');
    }
    const itemOptions = INVENTORY_ITEMS.map(i => `<option value='${i.item_id}'>${escapeHtml(i.item_name)} (${i.item_code}) - متوفر: ${i.current_qty}</option>`).join('');
    
    modal(`<h3>إنشاء طلب مادة</h3>
        <select id='req_item' required><option value=''>--- اختر المادة ---</option>${itemOptions}</select>
        <input id='req_qty' type='number' placeholder='كمية الطلب' min='0.01' step='0.01' required>
        <input id='req_by' placeholder='اسم الطالب' required>
        <textarea id='req_justification' rows="3" placeholder='مبررات الطلب (اختياري)'></textarea>
        
        <div style='display:flex;gap:8px;justify-content:flex-end;margin-top:15px'>
            <button class='btn btn-primary' onclick='saveNewRequest()'>إرسال الطلب</button>
            <button class='btn secondary' onclick='closeModal()'>إلغاء</button>
        </div>`);
}

async function saveNewRequest() { 
    const id = Number(document.getElementById('req_item').value); 
    const quantity = Number(document.getElementById('req_qty').value);
    const requested_by = document.getElementById('req_by').value || 'فني'; 
    const justification = document.getElementById('req_justification').value; 
    
    if (!quantity || quantity <= 0 || !id || !requested_by) { 
        showAlert('الرجاء إدخال بيانات صحيحة وكاملة للطلب.', 'warning'); 
        return; 
    } 

    const payload = { item_id: id, quantity, requested_by, justification };
    
    // يجب أن تكون '/requests' نقطة نهاية موجودة
    const result = await postData('/requests', payload);
    
    if (result) {
        showAlert('تم إرسال طلب المادة بنجاح.');
        closeModal();
        renderAll();
    }
}

async function approveRequest(id) { 
    if (!confirm('هل أنت متأكد من اعتماد هذا الطلب وصرف الكمية المطلوبة؟ سيتم تحديث المخزون.')) {
        return;
    }
    
    const payload = { user: 'مشرف النظام' }; 
    
    // يجب أن تكون '/requests/approve/:id' نقطة نهاية موجودة
    const result = await postData(`/requests/approve/${id}`, payload);
    
    if (result) {
        showAlert(result.message, 'success');
        renderAll();
    }
}