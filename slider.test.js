/**
 * Тестовый скрипт для ручной проверки слайдера
 * Запускать через browser console
 */

// Проверка элемента слайдера
function testSlider() {
    console.log('=== ТЕСТ СЛАЙДЕРА ===');
    
    // Проверка существования элемента слайдера
    const sliderElement = document.getElementById('slider');
    console.log('Элемент слайдера:', sliderElement ? 'НАЙДЕН' : 'НЕ НАЙДЕН');
    
    if (!sliderElement) return;
    
    // Проверка наличия слайдов
    const slides = document.querySelectorAll('.slide');
    console.log(`Количество слайдов: ${slides.length}`);
    
    slides.forEach((slide, index) => {
        console.log(`Слайд ${index + 1}:`, {
            isActive: slide.classList.contains('active'),
            opacity: slide.style.opacity,
            backgroundImage: slide.querySelector('div')?.style.backgroundImage || 'нет'
        });
    });
    
    // Проверка элементов управления
    const prevButton = document.getElementById('slider-prev');
    const nextButton = document.getElementById('slider-next');
    
    console.log('Кнопка "назад":', prevButton ? 'НАЙДЕНА' : 'НЕ НАЙДЕНА');
    console.log('Кнопка "вперед":', nextButton ? 'НАЙДЕНА' : 'НЕ НАЙДЕНА');
    
    // Проверка стилей кнопок
    if (prevButton) {
        const prevStyles = window.getComputedStyle(prevButton);
        console.log('Стили кнопки "назад":', {
            zIndex: prevStyles.zIndex,
            backgroundColor: prevStyles.backgroundColor,
            position: prevStyles.position,
            display: prevStyles.display,
            visibility: prevStyles.visibility
        });
    }
    
    if (nextButton) {
        const nextStyles = window.getComputedStyle(nextButton);
        console.log('Стили кнопки "вперед":', {
            zIndex: nextStyles.zIndex,
            backgroundColor: nextStyles.backgroundColor,
            position: nextStyles.position,
            display: nextStyles.display,
            visibility: nextStyles.visibility
        });
    }
    
    // Проверка видимости элементов
    const sliderContainerStyle = window.getComputedStyle(document.querySelector('section'));
    console.log('Стили контейнера слайдера:', {
        height: sliderContainerStyle.height,
        overflow: sliderContainerStyle.overflow,
        position: sliderContainerStyle.position
    });
    
    // Проверка наличия z-index конфликтов
    const overlayElement = document.querySelector('.absolute.inset-0.bg-black\\/50');
    if (overlayElement) {
        const overlayStyle = window.getComputedStyle(overlayElement);
        console.log('Z-index затемнения:', overlayStyle.zIndex);
    }
    
    const contentElement = document.querySelector('.absolute.inset-0.z-20');
    if (contentElement) {
        const contentStyle = window.getComputedStyle(contentElement);
        console.log('Z-index контента:', contentStyle.zIndex);
    }
    
    const navigationElement = document.querySelector('.absolute.inset-x-0.top-1\\/2');
    if (navigationElement) {
        const navStyle = window.getComputedStyle(navigationElement);
        console.log('Z-index навигации:', navStyle.zIndex);
    }
    
    console.log('=== ТЕСТ ЗАВЕРШЕН ===');
}

// Тестовое переключение слайдов вручную
function testSwitchSlides() {
    console.log('=== ТЕСТ ПЕРЕКЛЮЧЕНИЯ СЛАЙДОВ ===');
    
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) {
        console.error('Слайды не найдены!');
        return;
    }
    
    // Находим текущий активный слайд
    let currentIndex = Array.from(slides).findIndex(slide => 
        slide.classList.contains('active') || slide.style.opacity === '1'
    );
    
    if (currentIndex === -1) currentIndex = 0;
    
    console.log(`Текущий активный слайд: ${currentIndex + 1}`);
    
    // Тестируем переключение вперед
    function nextSlide() {
        slides.forEach(slide => {
            slide.classList.remove('active');
            slide.style.opacity = '0';
        });
        
        currentIndex = (currentIndex + 1) % slides.length;
        slides[currentIndex].classList.add('active');
        slides[currentIndex].style.opacity = '1';
        
        console.log(`Переключение на слайд ${currentIndex + 1}`);
    }
    
    // Тестируем переключение всех слайдов по одному
    let testInterval = setInterval(() => {
        nextSlide();
        if (currentIndex === slides.length - 1) {
            clearInterval(testInterval);
            console.log('Тест переключения завершен');
        }
    }, 1500);
    
    console.log('Тест переключения запущен...');
}

// Эти функции можно вызвать в консоли браузера:
// testSlider() - для проверки состояния слайдера
// testSwitchSlides() - для проверки переключения слайдов 