// يُستبدل هذا الكود بكود <script> في صفحة تاريخ المورد

// نقطة اتصال الـ API الرئيسية
const API_BASE_URL = '/api'; 

// دالة تنسيق العملة
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SY', { 
        style: 'currency', 
        currency: 'SYP', 
        minimumFractionDigits: 0
    }).format(amount);
}

// دالة جلب البيانات العامة (FETCH HELPER)
async function fetchData(endpoint) {
    try {
        const response = await fetch(API_BASE_URL + endpoint);
        const result = await response.json();

        if (!response.ok || !result.success) {
            alert('❌ فشل جلب البيانات: ' + (result.message || 'حدث خطأ غير معروف'));
            throw new Error(result.message || 'API Error');
        }
        return result;
    } catch (error) {
        console.error('Fetch Error:', error);
        alert('❌ خطأ في الاتصال بالخادم أو جلب البيانات: ' + error.message);
        throw error;
    }
}

// جلب وتحديث تاريخ المورد
async function fetchSupplierHistory(id) {
    try {
        // استخدام الـ API الجديد
        const result = await fetchData(`/suppliers/${id}/history`);
        const supplier = result.history;
        
        if (!supplier) {
             alert('لم يتم العثور على بيانات المورد.');
             return;
        }
        
        // تحديث المعلومات الأساسية
        document.getElementById('supplier-name').textContent = supplier.name;
        document.getElementById('total-transactions').textContent = supplier.total_transactions;
        document.getElementById('total-value').textContent = formatCurrency(supplier.total_value);
        document.getElementById('last-purchase').textContent = supplier.last_purchase || '-';

        // استخدام القيمة المحسوبة من الباك اند
        document.getElementById('avg-transaction').textContent = formatCurrency(supplier.avg_transaction_value || 0);
        
        // ملء جدول التعاملات
        const transactionsBody = document.getElementById('transactions-body');
        transactionsBody.innerHTML = '';
        
        if (supplier.transactions.length > 0) {
            supplier.transactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${transaction.date}</td>
                    <td>${transaction.product}</td>
                    <td>${transaction.quantity}</td>
                    <td>${formatCurrency(transaction.unit_price)}</td>
                    <td>${formatCurrency(transaction.total)}</td>
                    <td>${transaction.year}</td>
                    <td>${transaction.notes || '—'}</td>
                `;
                transactionsBody.appendChild(row);
            });
        } else {
            transactionsBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا توجد تعاملات مسجلة</td></tr>';
        }
        
        // إنشاء الرسوم البيانية
        createCharts(supplier);

    } catch (e) {
        console.error('Failed to load supplier history:', e);
    }
}

// دالة إنشاء الرسوم البيانية
function createCharts(supplier) {
    // تجميع البيانات السنوية
    const yearlyData = {};
    supplier.transactions.forEach(transaction => {
        if (!yearlyData[transaction.year]) { yearlyData[transaction.year] = 0; }
        yearlyData[transaction.year] += transaction.total;
    });
    
    const years = Object.keys(yearlyData).sort();
    const yearlyValues = years.map(year => yearlyData[year]);
    
    // رسم بياني للتعاملات السنوية
    const yearlyCtx = document.getElementById('yearlyChart').getContext('2d');
    if (window.yearlyChartInstance) window.yearlyChartInstance.destroy(); 
    window.yearlyChartInstance = new Chart(yearlyCtx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'قيمة التعاملات بالليرة السورية',
                data: yearlyValues,
                backgroundColor: 'rgba(46, 134, 193, 0.7)',
                borderColor: 'rgba(26, 82, 118, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) { return value.toLocaleString('ar-SY') + ' ل.س'; }
                    }
                }
            }
        }
    });
    
    // تجميع بيانات المنتجات
    const productData = {};
    supplier.transactions.forEach(transaction => {
        if (!productData[transaction.product]) { productData[transaction.product] = 0; }
        productData[transaction.product] += transaction.quantity;
    });
    
    const products = Object.keys(productData);
    const productQuantities = products.map(product => productData[product]);
    
    // رسم بياني للمنتجات
    const productsCtx = document.getElementById('productsChart').getContext('2d');
    if (window.productsChartInstance) window.productsChartInstance.destroy(); 
    window.productsChartInstance = new Chart(productsCtx, {
        type: 'pie',
        data: {
            labels: products,
            datasets: [{
                data: productQuantities,
                backgroundColor: [
                    'rgba(243, 156, 18, 0.7)', 'rgba(46, 134, 193, 0.7)', 'rgba(40, 167, 69, 0.7)',
                    'rgba(220, 53, 69, 0.7)', 'rgba(108, 117, 125, 0.7)'
                ],
                borderColor: [
                    'rgba(243, 156, 18, 1)', 'rgba(46, 134, 193, 1)', 'rgba(40, 167, 69, 1)',
                    'rgba(220, 53, 69, 1)', 'rgba(108, 117, 125, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// البدء عند تحميل الصفحة
const urlParams = new URLSearchParams(window.location.search);
const supplierId = urlParams.get('id');

if (supplierId) {
    fetchSupplierHistory(supplierId);
} else {
    alert('لم يتم تحديد مورد');
    window.location.href = 'index.php'; 
}