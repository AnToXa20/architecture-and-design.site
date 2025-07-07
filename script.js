document.addEventListener('DOMContentLoaded', function() {
    // Текущий год в футере
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Мобильное меню
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });

        // Закрывать меню при клике на любую ссылку
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
            });
        });

        // Закрывать меню при клике вне меню
        document.addEventListener('click', function(event) {
            if (!mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target) && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    // Кнопки фильтрации портфолио (радиокнопки)
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Снимаем активный статус со всех кнопок
                filterBtns.forEach(b => {
                    b.classList.remove('bg-gold-1');
                    b.classList.remove('text-black');
                    b.classList.add('border');
                    b.classList.add('border-dark-gray');
                    b.classList.add('text-dark-gray');
                });
                
                // Делаем текущую кнопку активной
                this.classList.add('bg-gold-1');
                this.classList.add('text-black');
                this.classList.remove('border');
                this.classList.remove('border-dark-gray');
                this.classList.remove('text-dark-gray');
                
                // Тут можно добавить код для фильтрации проектов
                const filter = this.getAttribute('data-filter');
                // filterProjects(filter);
            });
        });
    }

    // Слайдер проектов
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');
    const sliderPrev = document.getElementById('slider-prev');
    const sliderNext = document.getElementById('slider-next');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(n) {
        // Скрываем все слайды
        slides.forEach(slide => {
            slide.classList.remove('active');
            slide.style.opacity = '0';
        });

        // Показываем текущий слайд
        slides[n].classList.add('active');
        slides[n].style.opacity = '1';
        
        currentSlide = n;
    }

    function nextSlide() {
        showSlide((currentSlide + 1) % slides.length);
    }

    function prevSlide() {
        showSlide((currentSlide - 1 + slides.length) % slides.length);
    }

    // Обработчики для стрелок навигации
    if (sliderPrev && sliderNext) {
        sliderPrev.addEventListener('click', function() {
            clearInterval(slideInterval);
            prevSlide();
            startSlideInterval();
        });

        sliderNext.addEventListener('click', function() {
            clearInterval(slideInterval);
            nextSlide();
            startSlideInterval();
        });
    }

    // Автоматическое переключение слайдов
    function startSlideInterval() {
        slideInterval = setInterval(nextSlide, 10000);
    }

    // Запускаем слайдер
    if (slides.length > 0) {
        startSlideInterval();
    }

        // Код для обработки этапов работы был перемещен в index.html
    
    // Инициализация ИИ дизайна
    initAIDesign();
});

// ------------ ИИ ДИЗАЙН ФУНКЦИОНАЛЬНОСТЬ ------------

function initAIDesign() {
    console.log('🎨 === ИНИЦИАЛИЗАЦИЯ ИИ ДИЗАЙНА ===');
    console.log('Время инициализации:', new Date().toISOString());
    console.log('URL страницы:', window.location.href);
    
    // Проверяем, находимся ли мы на странице AI дизайна
    const photoUpload = document.getElementById('photo-upload');
    console.log('Элемент photo-upload найден:', !!photoUpload);
    
    if (!photoUpload) {
        console.log('❌ Страница ИИ дизайна не найдена, выходим');
        return;
    }
    
    console.log('✅ Страница ИИ дизайна найдена');
    const uploadArea = photoUpload.parentElement;
    const uploadButton = uploadArea.querySelector('button');
    const submitButton = document.querySelector('form button[type="button"]');
    
    // Активируем загрузку файлов
    photoUpload.disabled = false;
    
    // Обработчики загрузки файлов
    if (uploadButton) {
        uploadButton.onclick = () => photoUpload.click();
    }
    
    // Обработка перетаскивания файлов
    uploadArea.ondragover = (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-gold-1', 'bg-gold-1', 'bg-opacity-10');
    };
    
    uploadArea.ondragleave = () => {
        uploadArea.classList.remove('border-gold-1', 'bg-gold-1', 'bg-opacity-10');
    };
    
    uploadArea.ondrop = (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-gold-1', 'bg-gold-1', 'bg-opacity-10');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            photoUpload.files = files;
            updateUploadDisplay(files[0]);
        }
    };
    
    // Обработка выбора файла
    photoUpload.onchange = (e) => {
        if (e.target.files[0]) {
            updateUploadDisplay(e.target.files[0]);
        }
    };
    
    // Привязываем обработчик к кнопке отправки
    if (submitButton) {
        submitButton.onclick = handleAIDesign;
    }
}

// Функция для ИИ дизайна через Hugging Face
async function handleAIDesign() {
    console.log('\n🚀 === НАЧАЛО ОБРАБОТКИ ИИ ДИЗАЙНА ===');
    console.log('Время начала:', new Date().toISOString());
    
    const photoUpload = document.getElementById('photo-upload');
    const styleSelect = document.getElementById('style-select');
    const promptInput = document.getElementById('prompt-input');
    const submitButton = document.querySelector('form button[type="button"]');
    
    console.log('📋 Проверяем элементы формы:');
    console.log('  photoUpload:', !!photoUpload);
    console.log('  styleSelect:', !!styleSelect);
    console.log('  promptInput:', !!promptInput);
    console.log('  submitButton:', !!submitButton);
    
    // Проверяем заполненность полей
    console.log('🔍 Валидация данных:');
    const file = photoUpload.files[0];
    const style = styleSelect.value;
    const prompt = promptInput.value.trim();
    
    console.log('  Файл:', file ? `${file.name} (${Math.round(file.size/1024)}KB, ${file.type})` : 'НЕТ');
    console.log('  Стиль:', style || 'НЕ ВЫБРАН');
    console.log('  Промт:', prompt || 'ПУСТОЙ');
    
    if (!file) {
        console.log('❌ Валидация провалена: нет файла');
        showErrorMessage('Пожалуйста, загрузите изображение');
        return;
    }
    
    if (!style) {
        console.log('❌ Валидация провалена: нет стиля');
        showErrorMessage('Пожалуйста, выберите стиль');
        return;
    }
    
    if (!prompt) {
        console.log('❌ Валидация провалена: нет промта');
        showErrorMessage('Пожалуйста, опишите желаемые изменения');
        return;
    }
    
    console.log('✅ Валидация прошла успешно');

    // Показываем детальное состояние загрузки
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    
    // Создаем индикатор прогресса
    showLoadingProgress();

    try {
        // Создаем FormData для отправки файла
        console.log('📦 Создаем FormData...');
        const formData = new FormData();
        formData.append('image', file);
        formData.append('style', style);
        formData.append('prompt', prompt);
        
        console.log('FormData подготовлена:');
        console.log('  image:', file.name);
        console.log('  style:', style);
        console.log('  prompt:', prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''));

        updateLoadingProgress('Анализируем изображение...', 25);

        // Отправляем запрос на сервер
        console.log('🌐 Отправляем POST запрос к /api/ai-design-genapi');
        console.log('URL:', window.location.origin + '/api/ai-design-genapi');
        
        const response = await fetch('/api/ai-design-genapi', {
            method: 'POST',
            body: formData
        });

        console.log('📡 Получен ответ от сервера:');
        console.log('  Статус:', response.status, response.statusText);
        console.log('  Content-Type:', response.headers.get('content-type'));
        console.log('  OK:', response.ok);

        updateLoadingProgress('Генерируем новый дизайн...', 75);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ HTTP ошибка:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        console.log('📄 Парсим JSON ответ...');
        const result = await response.json();
        console.log('✅ JSON ответ получен:', result);

        if (result.success) {
            updateLoadingProgress('Готово!', 100);
            setTimeout(() => {
                hideLoadingProgress();
                displayHuggingFaceResult(result);
            }, 1000);
        } else {
            hideLoadingProgress();
            showErrorMessage(result.error, result.details);
        }

    } catch (error) {
        console.error('Ошибка при отправке:', error);
        hideLoadingProgress();
        showErrorMessage('Произошла ошибка при обработке изображения', error.message);
    } finally {
        // Возвращаем кнопку в исходное состояние
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// Функция для обновления отображения загруженного файла
function updateUploadDisplay(file) {
    const uploadArea = document.getElementById('photo-upload').parentElement;
    const fileName = file.name;
    const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    
    uploadArea.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-500 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <p class="text-center mb-2"><strong>Файл загружен:</strong></p>
        <p class="text-center text-sm text-gray mb-3">${fileName} (${fileSize})</p>
        <button type="button" class="btn bg-gold-1 text-black hover:bg-gold-2 transition-colors">
            Выбрать другой файл
        </button>
        <input id="photo-upload" type="file" accept="image/*" class="hidden" />
    `;
    
    // Переназначаем обработчики
    const newUploadInput = document.getElementById('photo-upload');
    const newUploadButton = uploadArea.querySelector('button');
    newUploadButton.onclick = () => newUploadInput.click();
    newUploadInput.onchange = (e) => {
        if (e.target.files[0]) {
            updateUploadDisplay(e.target.files[0]);
        }
    };
}

// Показать индикатор загрузки
function showLoadingProgress() {
    // Удаляем старый индикатор если есть
    const oldProgress = document.getElementById('loading-progress');
    if (oldProgress) oldProgress.remove();

    const progressHTML = `
        <div id="loading-progress" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4">
                <div class="text-center">
                    <div class="mb-4">
                        <svg class="animate-spin h-12 w-12 text-gold-1 mx-auto" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <h3 id="progress-title" class="text-lg font-montserrat font-semibold mb-2">Подготовка...</h3>
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div id="progress-bar" class="bg-gold-1 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <p class="text-gray text-sm">Обработка может занять 30-90 секунд</p>
                    <p class="text-gray text-xs mt-2">Hugging Face модели иногда "засыпают" и требуют времени для загрузки</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', progressHTML);
}

// Обновить прогресс
function updateLoadingProgress(message, percent) {
    const title = document.getElementById('progress-title');
    const bar = document.getElementById('progress-bar');
    
    if (title) title.textContent = message;
    if (bar) bar.style.width = percent + '%';
}

// Скрыть индикатор загрузки
function hideLoadingProgress() {
    const progress = document.getElementById('loading-progress');
    if (progress) progress.remove();
}

// Показать сообщение об ошибке
function showErrorMessage(error, details) {
    const errorHTML = `
        <div id="error-message" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-8 rounded-lg max-w-md w-full mx-4">
                <div class="text-center">
                    <div class="mb-4">
                        <svg class="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 6.5c-.77.833-.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-montserrat font-semibold mb-2 text-red-600">Ошибка</h3>
                    <p class="text-gray mb-4">${error}</p>
                    ${details ? `<p class="text-xs text-gray-500 mb-4">Детали: ${details}</p>` : ''}
                    <button onclick="document.getElementById('error-message').remove()" 
                            class="btn bg-red-500 text-white hover:bg-red-600 transition-colors">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', errorHTML);
}

// Функция для отображения результата Hugging Face
function displayHuggingFaceResult(result) {
    // Создаем секцию для результата если её нет
    let resultSection = document.getElementById('ai-result-section');
    if (!resultSection) {
        resultSection = document.createElement('section');
        resultSection.id = 'ai-result-section';
        resultSection.className = 'mt-12 border border-gray p-8 rounded-lg';
        
        // Вставляем после формы
        const form = document.querySelector('form');
        form.parentNode.insertBefore(resultSection, form.nextSibling);
    }

    resultSection.innerHTML = `
        <h3 class="text-2xl font-montserrat font-semibold mb-6 text-center">
            Результат ИИ-дизайна
        </h3>
        
        ${result.analysis && result.analysis !== 'interior room' ? `
        <div class="mb-6 p-4 bg-light-gray rounded-lg">
            <h4 class="font-montserrat font-medium mb-2">Анализ исходного изображения:</h4>
            <p class="text-sm text-gray">"${result.analysis}"</p>
        </div>
        ` : ''}
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h4 class="text-lg font-montserrat font-medium mb-3 text-center">Исходное изображение</h4>
                <div class="bg-dark-gray rounded-lg overflow-hidden">
                    <img src="${result.originalImage}" alt="Исходное изображение" class="w-full h-auto">
                </div>
            </div>
            <div>
                <h4 class="text-lg font-montserrat font-medium mb-3 text-center">Новый дизайн (${result.style})</h4>
                <div class="bg-dark-gray rounded-lg overflow-hidden">
                    <img src="${result.editedImage}" alt="Обработанное изображение" class="w-full h-auto" 
                         onerror="this.parentElement.innerHTML='<div class=\\'p-8 text-center text-white\\'>Ошибка загрузки изображения</div>'">
                </div>
            </div>
        </div>
        
        <div class="mt-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="p-4 bg-light-gray rounded-lg">
                    <h5 class="font-montserrat font-medium mb-2">Выбранный стиль:</h5>
                    <p class="text-sm"><strong>${result.style}</strong></p>
                </div>
                <div class="p-4 bg-light-gray rounded-lg">
                    <h5 class="font-montserrat font-medium mb-2">Ваше описание:</h5>
                    <p class="text-sm">"${result.prompt}"</p>
                </div>
            </div>
            
            <p class="text-xs text-gray-500 text-center mb-4">Обработано: ${new Date(result.timestamp).toLocaleString()}</p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="${result.editedImage}" download="ai-design-result.png" 
                   class="btn bg-gold-1 text-black hover:bg-gold-2 transition-colors text-center">
                    📥 Скачать результат
                </a>
                <button onclick="document.getElementById('ai-result-section').remove()" 
                        class="btn bg-gray text-white hover:bg-dark-gray transition-colors">
                    ✕ Скрыть результат
                </button>
                <button onclick="location.reload()" 
                        class="btn bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                    🔄 Создать новый дизайн
                </button>
            </div>
        </div>
        
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
            <p class="text-xs text-blue-600">
                <strong>💡 Примечание:</strong> Результат сгенерирован с помощью бесплатных моделей Hugging Face. 
                Качество может отличаться от коммерческих сервисов. При первом использовании модели могут потребовать 30-60 секунд для "разогрева".
            </p>
        </div>
    `;

    // Прокручиваем к результату
    resultSection.scrollIntoView({ behavior: 'smooth' });
} 