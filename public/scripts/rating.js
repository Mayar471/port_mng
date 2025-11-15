  // الحصول على معرّف المورد من العنوان
        const urlParams = new URLSearchParams(window.location.search);
        const supplierId = urlParams.get('id');
        
        if (supplierId) {
            document.getElementById('supplier-id').value = supplierId;
            
            // جلب بيانات المورد (هنا يمكنك استبدال هذا بطلب AJAX لجلب البيانات الفعلية)
            fetchSupplierData(supplierId);
        } else {
            alert('لم يتم تحديد مورد للتقييم');
            window.location.href = 'index.php';
        }
        
        function fetchSupplierData(id) {
            // هذا مثال - في التطبيق الحقيقي سيكون هناك طلب AJAX لجلب البيانات من الخادم
            const suppliers = {
                1: { name: 'شركة البحر الأحمر للمعدات البحرية' },
                2: { name: 'مؤسسة الشام لقطع الغيار' },
                3: { name: 'شركة النورس للخدمات البحرية' }
            };
            
            if (suppliers[id]) {
                document.getElementById('supplier-name').textContent = suppliers[id].name;
            }
        }
        
        // معالجة تقديم النموذج
        document.getElementById('rating-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // جمع النقاط
            const quality = parseInt(document.querySelector('input[name="quality"]:checked')?.value || 0);
            const specs = parseInt(document.querySelector('input[name="specs"]:checked')?.value || 0);
            const delivery = parseInt(document.querySelector('input[name="delivery"]:checked')?.value || 0);
            const response = parseInt(document.querySelector('input[name="response"]:checked')?.value || 0);
            const professionalism = parseInt(document.querySelector('input[name="professionalism"]:checked')?.value || 0);
            const flexibility = parseInt(document.querySelector('input[name="flexibility"]:checked')?.value || 0);
            const pricing = parseInt(document.querySelector('input[name="pricing"]:checked')?.value || 0);
            const support = parseInt(document.querySelector('input[name="support"]:checked')?.value || 0);
            
            // حساب المتوسط
            const totalScore = quality + specs + delivery + response + professionalism + flexibility + pricing + support;
            const averageScore = totalScore / 8;
            
            // تحديد عدد النجوم بناءً على المتوسط
            let stars, ratingText;
            
            if (averageScore >= 4.5) {
                stars = 5;
                ratingText = 'ممتاز - 5 نجوم';
            } else if (averageScore >= 3.5) {
                stars = 4;
                ratingText = 'جيد جداً - 4 نجوم';
            } else if (averageScore >= 2.5) {
                stars = 3;
                ratingText = 'جيد - 3 نجوم';
            } else if (averageScore >= 1.5) {
                stars = 2;
                ratingText = 'متوسط - نجمتين';
            } else {
                stars = 1;
                ratingText = 'ضعيف - نجم واحد';
            }
            
            // عرض النتيجة
            document.getElementById('final-stars').textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars);
            document.getElementById('rating-text').textContent = ratingText;
            document.getElementById('rating-result').style.display = 'block';
            
            // حفظ التقييم عند النقر على زر الحفظ
            document.getElementById('save-rating').onclick = function() {
                saveRating(supplierId, stars);
            };
        });
        
        function saveRating(supplierId, rating) {
            // هنا سيتم إرسال التقييم إلى الخادم
            const formData = new FormData();
            formData.append('supplier_id', supplierId);
            formData.append('rating', rating);
            
            fetch('update_rating.php', {
             method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('تم حفظ التقييم بنجاح!');
                    window.location.href = 'index.php';
                } else {
                    alert('حدث خطأ أثناء حفظ التقييم: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('حدث خطأ أثناء حفظ التقييم');
            });
        }