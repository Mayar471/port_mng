// يُنشأ هذا الكود في ملف add_purchase.js

const API_BASE_URL = '/api';

// ****************************
// 1. وظائف مساعدة عامة
// ****************************

function showAlert(message, type = 'success') {
    const alertDiv = document.getElementById('alert-message');
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.display = 'block';
    setTimeout(() => { alertDiv.style.display = 'none'; }, 5000);
}

// ****************************
// 2. حساب الإجمالي
// ****************************

function calculateTotal() {
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const unitPrice = parseFloat(document.getElementById('unit-price').value) || 0;
    const totalPriceField = document.getElementById('total-price');
    
    const total = quantity * unitPrice;
    
    // تنسيق وعرض الإجمالي
    totalPriceField.value = total.toFixed(2);
}

// ****************************
// 3. جلب الموردين لملء القائمة المنسدلة
// ****************************
async function fetchSuppliers() {
    const selectElement = document.getElementById('supplier-id');
    try {
        // (ملاحظة: نفترض وجود مسار API لجلب قائمة الموردين لديك مثل /api/suppliers)
        const response = await fetch(`${API_BASE_URL}/suppliers`); 
        const result = await response.json();

        if (response.ok && result.success) {
            result.suppliers.forEach(supplier => {
                const option = document.createElement('option');
                // نستخدم supplier_id كقيمة
                option.value = supplier.supplier_id; 
                option.textContent = `${supplier.name} (${supplier.specialization})`;
                selectElement.appendChild(option);
            });
        } else {
            showAlert('فشل جلب قائمة الموردين: ' + (result.message || 'خطأ في الاتصال'), 'danger');
        }
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        showAlert('خطأ في الاتصال بالخادم لجلب الموردين.', 'danger');
    }
}

// ****************************
// 4. معالج إرسال النموذج
// ****************************

document.addEventListener('DOMContentLoaded', () => {
    // 1. جلب قائمة الموردين عند تحميل الصفحة
    fetchSuppliers(); 
    
    // 2. ربط حقول الكمية والسعر بدالة حساب الإجمالي
    document.getElementById('quantity').addEventListener('input', calculateTotal);
    document.getElementById('unit-price').addEventListener('input', calculateTotal);
    
    // 3. معالج إرسال النموذج
    const form = document.getElementById('purchase-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // جمع البيانات
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // حساب الإجمالي وإضافته يدوياً قبل الإرسال (للتأكد)
        data.total = (parseFloat(data.quantity) * parseFloat(data.unit_price)).toFixed(2);

        try {
            // (ملاحظة: هذا المسار POST /api/purchases غير موجود بعد، سننشئه لاحقاً)
            const response = await fetch(`${API_BASE_URL}/purchases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();

            if (response.ok && result.success) {
                showAlert('✅ تم تسجيل عملية الشراء بنجاح!');
                form.reset(); // إعادة تعيين النموذج
                document.getElementById('total-price').value = '0.00';
            } else {
                showAlert('❌ فشل تسجيل عملية الشراء: ' + (result.message || 'خطأ غير معروف.'), 'danger');
            }
        } catch (error) {
            console.error('Submission error:', error);
            showAlert('❌ خطأ في الاتصال بالخادم.', 'danger');
        }
    });
    
    // تعيين تاريخ اليوم كقيمة افتراضية
    document.getElementById('transaction-date').valueAsDate = new Date();
});