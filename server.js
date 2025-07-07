const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // Для хеширования паролей
const session = require('express-session'); // Для сессий
const db = require('./db'); // Подключаю модуль для работы с БД
const OpenAI = require('openai'); // Для работы с DALL-E

// Загружаем переменные окружения
require('dotenv').config();

const app = express();

// Настройка multer для загрузки файлов в память
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 20 // максимум 20 файлов
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены'), false);
        }
    }
});

const PORT = 3000;

// Константы
const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';
const BASE_PATH = 'Architecture&design';
// Временно используем прямой API ключ для тестирования
const GENAPI_API_KEY = process.env.GENAPI_API_KEY || 'sk-3fnqSoE1Ld6V2ImZqxpliCsorUBkQ0MQ4RJ9SHpcs4osdoGDpYfFuJA3sBVs';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Инициализация OpenAI
const openai = OPENAI_API_KEY ? new OpenAI({
    apiKey: OPENAI_API_KEY,
}) : null;

// Детальное логирование конфигурации API
console.log('\n=== ПРОВЕРКА API КОНФИГУРАЦИИ ===');
console.log('🔍 Проверяем переменные окружения...');
console.log('process.env.GENAPI_API_KEY:', process.env.GENAPI_API_KEY ? 'НАЙДЕН' : 'НЕ НАЙДЕН');
console.log('process.env.REPLICATE_API_TOKEN:', process.env.REPLICATE_API_TOKEN ? 'НАЙДЕН' : 'НЕ НАЙДЕН');
console.log('GENAPI_API_KEY константа:', GENAPI_API_KEY ? 'НАЙДЕН' : 'НЕ НАЙДЕН');

if (GENAPI_API_KEY) {
    console.log('GenAPI Длина токена:', GENAPI_API_KEY.length);
    console.log('GenAPI Первые 10 символов:', GENAPI_API_KEY.substring(0, 10) + '...');
    console.log('GenAPI Последние 10 символов:', '...' + GENAPI_API_KEY.substring(GENAPI_API_KEY.length - 10));
    console.log('✅ GenAPI токен готов к использованию');
} else {
    console.log('❌ GenAPI токен НЕ НАЙДЕН - будет работать демо режим');
}

if (process.env.REPLICATE_API_TOKEN) {
    console.log('Replicate Длина токена:', process.env.REPLICATE_API_TOKEN.length);
    console.log('Replicate Первые 10 символов:', process.env.REPLICATE_API_TOKEN.substring(0, 10) + '...');
    console.log('Replicate Последние 10 символов:', '...' + process.env.REPLICATE_API_TOKEN.substring(process.env.REPLICATE_API_TOKEN.length - 10));
    console.log('✅ Replicate токен готов к использованию');
} else {
    console.log('❌ Replicate токен НЕ НАЙДЕН');
    console.log('🔍 Возможные причины:');
    console.log('  - .env файл не найден');
    console.log('  - Неправильный формат .env файла');
    console.log('  - Сервер не перезапущен после создания .env');
}
console.log('=== КОНЕЦ ПРОВЕРКИ ===\n');

// Настройка сессий
app.use(session({
    secret: 'your-secret-key-change-in-production', // В продакшне используйте сложный секретный ключ
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // В продакшне с HTTPS установите true
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));  // Обслуживаем файлы из корневой директории
app.use(express.static('public'));  // И из папки public
app.use('/pic2', express.static(path.join(__dirname, 'pic2')));  // Обслуживаем изображения проектов

// Добавляем CORS заголовки
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Проверка подключения к БД при запуске сервера
db.testConnection()
    .then(isConnected => {
        if (isConnected) {
            console.log('База данных готова к работе');
        } else {
            console.error('Не удалось подключиться к базе данных');
        }
    });

// ------------ API для работы с базой данных ------------

// API для получения изображений слайдера
app.get('/api/slider-images', async (req, res) => {
    try {
        const images = await db.query(
            'SELECT * FROM images WHERE entity_type = "slider" AND entity_id = 1 ORDER BY sort_order'
        );
        res.json({ success: true, images });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Старый простой health endpoint удален - используем новый с GenAPI информацией

// Простой API для загрузки изображений в папки
app.post('/api/simple-upload', upload.single('imageFile'), async (req, res) => {
    console.log('\n=== ПРОСТАЯ ЗАГРУЗКА ИЗОБРАЖЕНИЯ ===');
    console.log('Время:', new Date().toISOString());
    console.log('req.body:', req.body);
    console.log('req.file:', req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
    } : 'файл не найден');
    
    try {
        const { folderName } = req.body;
        
        // Валидация
        if (!folderName || !req.file) {
            return res.status(400).json({
                success: false,
                error: 'Название папки и файл обязательны'
            });
        }
        
        // Проверяем что это изображение
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                error: 'Можно загружать только изображения'
            });
        }
        
        console.log('Валидация пройдена');
        
        // Создаем безопасное имя папки
        const safeFolderName = folderName.replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '_');
        
        // Создаем полный путь к папке проекта
        const projectsDir = path.join(__dirname, 'pic2', 'projects');
        const projectFolderPath = path.join(projectsDir, safeFolderName);
        
        console.log('Создание папки:', projectFolderPath);
        
        // Создаем папку projects если её нет
        if (!fs.existsSync(projectsDir)) {
            console.log('Создаю базовую папку projects');
            fs.mkdirSync(projectsDir, { recursive: true });
        }
        
        // Создаем папку проекта если её нет
        if (!fs.existsSync(projectFolderPath)) {
            console.log('Создаю папку проекта');
            fs.mkdirSync(projectFolderPath, { recursive: true });
        }
        
        // Создаем безопасное имя файла
        const timestamp = Date.now();
        const fileExtension = path.extname(req.file.originalname);
        const safeFileName = `image_${timestamp}${fileExtension}`;
        const fullFilePath = path.join(projectFolderPath, safeFileName);
        
        console.log('Сохранение файла:', fullFilePath);
        
        // Сохраняем файл
        fs.writeFileSync(fullFilePath, req.file.buffer);
        
        // Создаем веб-путь для доступа к файлу
        const webPath = `/pic2/projects/${safeFolderName}/${safeFileName}`;
        
        console.log('Файл сохранен успешно');
        console.log('Веб-путь:', webPath);
        
        res.json({
            success: true,
            message: 'Изображение успешно сохранено',
            folderPath: `pic2/projects/${safeFolderName}`,
            fileName: safeFileName,
            fullPath: fullFilePath,
            webPath: webPath,
            fileSize: req.file.size,
            originalName: req.file.originalname
        });
        
    } catch (error) {
        console.error('\n=== ОШИБКА ПРОСТОЙ ЗАГРУЗКИ ===');
        console.error('Время:', new Date().toISOString());
        console.error('Ошибка:', error.message);
        console.error('Стек:', error.stack);
        
        res.status(500).json({
            success: false,
            error: 'Ошибка сохранения файла: ' + error.message
        });
    }
});

// ------------ GENAPI AI DESIGN API ------------

// Функция для работы с GenAPI (Flux Kontext) с правильной обработкой асинхронной генерации
async function callGenAPI(imageBase64, prompt, model = 'flux-kontext') {
    console.log('\n--- ВЫЗОВ GENAPI ---');
    console.log('Модель:', model);
    console.log('Размер изображения:', imageBase64 ? imageBase64.length : 'отсутствует');
    console.log('Промт:', prompt);
    console.log('Токен для запроса:', GENAPI_API_KEY ? `${GENAPI_API_KEY.substring(0, 10)}...` : 'ОТСУТСТВУЕТ');
    
    // Шаг 1: Запуск генерации (ТОЛЬКО ОДИН ЗАПРОС!)
    const API_URL = `https://api.gen-api.ru/api/v1/networks/${model}`;
    console.log('🌐 URL запроса:', API_URL);
    
    try {
        console.log('🚀 Запускаем генерацию (ПЛАТНЫЙ запрос)');
        
        const requestBody = JSON.stringify({
            prompt: prompt,
            image: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null
        });
        
        console.log('📦 Размер тела запроса:', requestBody.length, 'символов');
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${GENAPI_API_KEY}`
        };
        
        const startTime = Date.now();
        console.log('⏱️ Отправляем запрос в GenAPI в', new Date().toLocaleTimeString());
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: headers,
            body: requestBody
        });
        
        const endTime = Date.now();
        console.log(`📥 Ответ получен за ${endTime - startTime}мс`);
        console.log('📊 Статус ответа:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Полный текст ошибки от GenAPI:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('📄 JSON ответ получен');
        console.log('📋 Структура ответа:', Object.keys(result));
        console.log('🔍 Полный ответ:', result);
        
        // Если уже есть готовое изображение (синхронная генерация)
        if (result.image || result.data?.image || result.result?.image) {
            const imageBase64 = result.image || result.data?.image || result.result?.image;
            console.log('✅ GenAPI вернул готовое изображение сразу');
            return imageBase64.replace(/^data:image\/[^;]+;base64,/, '');
        }
        
        // Если генерация асинхронная, получаем request_id
        if (result.request_id && (result.status === 'processing' || result.status === 'pending')) {
            const requestId = result.request_id;
            console.log('🆔 Получен request_id:', requestId);
            console.log('⏳ Генерация запущена, ожидаем результат...');
            
            // Шаг 2: Ожидание результата (БЕСПЛАТНЫЕ проверки статуса)
            return await waitForGeneration(requestId, model);
        }
        
        throw new Error('Неожиданный формат ответа от GenAPI');
        
    } catch (error) {
        console.error('❌ Ошибка GenAPI:', error.message);
        throw error;
    }
}

// Функция ожидания результата генерации (без дополнительных списаний)
async function waitForGeneration(requestId, model, maxAttempts = 30) {
    console.log('\n--- ОЖИДАНИЕ РЕЗУЛЬТАТА ГЕНЕРАЦИИ ---');
    console.log('Request ID:', requestId);
    
    // Правильный URL согласно документации GenAPI
    const STATUS_URL = `https://api.gen-api.ru/api/v1/request/get/${requestId}`;
    console.log('🌐 URL проверки статуса:', STATUS_URL);
    
    for (let i = 0; i < maxAttempts; i++) {
        console.log(`🔍 Проверка статуса ${i + 1}/${maxAttempts} (через 10 сек)`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Ждем 10 секунд
        
        try {
            const response = await fetch(STATUS_URL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${GENAPI_API_KEY}`
                }
            });
            
            console.log(`📊 HTTP статус: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log(`❌ Ошибка ${response.status}: ${errorText}`);
                continue;
            }
            
            const result = await response.json();
            console.log('📋 Полный ответ от GenAPI:', JSON.stringify(result, null, 2));
            
            // Проверяем статус согласно документации GenAPI
            const status = result.status;
            console.log('📋 Статус задачи:', status);
            
            if (status === 'success') {
                // Согласно документации, результат в поле output
                const output = result.output;
                console.log('🎯 Найден output:', typeof output);
                
                if (output) {
                    // Если output это строка (base64 изображение)
                    if (typeof output === 'string' && output.length > 100) {
                        console.log(`✅ Получено изображение: ${output.substring(0, 50)}...`);
                        const cleanImage = output.replace(/^data:image\/[^;]+;base64,/, '');
                        return cleanImage;
                    }
                    // Если output это объект с изображением
                    else if (typeof output === 'object' && output.image) {
                        console.log(`✅ Получено изображение из output.image: ${output.image.substring(0, 50)}...`);
                        const cleanImage = output.image.replace(/^data:image\/[^;]+;base64,/, '');
                        return cleanImage;
                    }
                    // Если output это массив
                    else if (Array.isArray(output) && output.length > 0) {
                        console.log(`✅ Получен массив output: ${output[0].substring(0, 50)}...`);
                        const cleanImage = output[0].replace(/^data:image\/[^;]+;base64,/, '');
                        return cleanImage;
                    }
                }
                
                console.log('⚠️ Статус success, но output не содержит изображение');
                console.log('📋 Тип output:', typeof output);
                console.log('📋 Содержимое output:', output);
                
            } else if (status === 'failed') {
                const errorMsg = result.result || result.error || 'неизвестная ошибка';
                console.log('❌ Генерация завершилась с ошибкой:', errorMsg);
                throw new Error(`Генерация не удалась: ${errorMsg}`);
                
            } else if (status === 'processing') {
                console.log('⏳ Задача ещё в обработке, продолжаем ждать...');
                continue;
                
            } else {
                console.log(`🤔 Неизвестный статус: ${status}, продолжаем ждать...`);
                continue;
            }
            
        } catch (error) {
            console.log(`❌ Ошибка при проверке статуса: ${error.message}`);
        }
    }
    
    console.log('❌ Превышено время ожидания результата генерации');
    throw new Error('Превышено время ожидания результата генерации');
}

// ------------ HUGGING FACE AI DESIGN API (LEGACY) ------------

// Функция для работы с Hugging Face API с детальным логированием
async function callHuggingFaceAPI(model, inputs, retries = 3) {
    console.log('\n--- ВЫЗОВ HUGGING FACE API ---');
    console.log('Модель:', model);
    console.log('Размер входных данных:', typeof inputs === 'string' ? inputs.length : 'не строка');
    console.log('Токен для запроса:', HUGGINGFACE_API_KEY ? `${HUGGINGFACE_API_KEY.substring(0, 10)}...` : 'ОТСУТСТВУЕТ');
    console.log('🔍 Проверка токена: Длина =', HUGGINGFACE_API_KEY ? HUGGINGFACE_API_KEY.length : 0, 'символов');
    console.log('🔍 Токен начинается с hf_:', HUGGINGFACE_API_KEY ? HUGGINGFACE_API_KEY.startsWith('hf_') : false);
    
    const API_URL = `https://api-inference.huggingface.co/models/${model}`;
    console.log('🌐 URL запроса:', API_URL);
    
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🔄 Попытка ${i + 1}/${retries} вызова API`);
            
            const requestBody = JSON.stringify({ 
                inputs,
                parameters: {
                    negative_prompt: "blurry, low quality, distorted, deformed",
                    num_inference_steps: 20,
                    guidance_scale: 7.5
                }
            });
            console.log('📦 Размер тела запроса:', requestBody.length, 'символов');
            console.log('📝 Тело запроса (первые 200 символов):', requestBody.substring(0, 200));
            
            const headers = {
                'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json',
                'User-Agent': 'AI-Design-App/1.0'
            };
            
            console.log('🔐 Заголовки запроса:');
            console.log('  Authorization:', headers.Authorization ? `Bearer ${headers.Authorization.slice(7, 20)}...` : 'НЕТ');
            console.log('  Content-Type:', headers['Content-Type']);
            console.log('  User-Agent:', headers['User-Agent']);
            
            const startTime = Date.now();
            console.log('⏱️ Отправляем запрос в', new Date().toLocaleTimeString());
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: headers,
                body: requestBody
            });
            
            const endTime = Date.now();
            console.log(`📥 Ответ получен за ${endTime - startTime}мс`);
            console.log('📊 Статус ответа:', response.status, response.statusText);
            
            // Подробная информация о заголовках ответа
            console.log('📋 Заголовки ответа:');
            response.headers.forEach((value, key) => {
                console.log(`  ${key}: ${value}`);
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Полный текст ошибки от API:', errorText);
                
                // Детальный анализ ошибок
                if (response.status === 401) {
                    console.error('🚫 Ошибка авторизации: Проверьте правильность API токена');
                } else if (response.status === 403) {
                    console.error('🚫 Доступ запрещен: Возможно модель требует особых разрешений');
                } else if (response.status === 404) {
                    console.error('🚫 Модель не найдена:', model);
                } else if (response.status === 429) {
                    console.error('🚫 Превышен лимит запросов');
                } else if (response.status === 503) {
                    console.error('🚫 Сервис недоступен: Возможно модель загружается');
                }
                
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            // Проверяем тип ответа
            const contentType = response.headers.get('content-type');
            console.log('📄 Content-Type ответа:', contentType);
            
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                console.log('📄 JSON ответ получен, тип:', typeof result);
                console.log('📄 Ключи JSON ответа:', result && typeof result === 'object' ? Object.keys(result) : 'не объект');
                
                // Проверяем, не возвращает ли API ошибку "модель загружается"
                if (result.error) {
                    console.log('⚠️ Ошибка в JSON ответе:', result.error);
                    if (result.error.includes('loading') || result.error.includes('currently loading')) {
                        console.log(`⏳ Модель ${model} загружается, ждем 20 секунд...`);
                        await new Promise(resolve => setTimeout(resolve, 20000));
                        continue;
                    }
                    throw new Error(`API Error: ${result.error}`);
                }
                
                console.log('✅ API вызов успешен, возвращаем JSON результат');
                return result;
            } else {
                // Возвращаем как ArrayBuffer для изображений
                const arrayBuffer = await response.arrayBuffer();
                console.log('🖼️ Получен ArrayBuffer размером:', arrayBuffer.byteLength, 'байт');
                
                if (arrayBuffer.byteLength === 0) {
                    throw new Error('Получен пустой ответ от API');
                }
                
                console.log('✅ API вызов успешен, возвращаем ArrayBuffer');
                return arrayBuffer;
            }

        } catch (error) {
            console.error(`❌ Ошибка HuggingFace API (попытка ${i + 1}/${retries}):`, error.message);
            if (error.stack) {
                console.error('📍 Stack trace:', error.stack);
            }
            
            if (i === retries - 1) {
                console.error('💥 Все попытки исчерпаны, выбрасываем финальную ошибку');
                throw error;
            }
            
            const delay = 5000 * (i + 1); // Увеличиваем задержку с каждой попыткой
            console.log(`⏳ Ждем ${delay}мс перед следующей попыткой...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// API endpoint для проверки состояния сервера
app.get('/api/health', (req, res) => {
    console.log('🩺 Проверка состояния сервера:', new Date().toISOString());
    
    res.json({ 
        success: true, 
        message: 'Сервер работает (GenAPI готов)',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        apis: {
            genapi: {
                ready: !!GENAPI_API_KEY,
                tokenLength: GENAPI_API_KEY ? GENAPI_API_KEY.length : 0,
                status: 'active',
                provider: 'gen-api.ru',
                model: 'flux-kontext'
            }
        },
        genapi: {
            ready: !!GENAPI_API_KEY,
            tokenPresent: !!GENAPI_API_KEY,
            tokenLength: GENAPI_API_KEY ? GENAPI_API_KEY.length : 0
        }
    });
});

// API endpoint для тестирования доступности моделей
app.get('/api/test-models', async (req, res) => {
    console.log('🧪 Тестирование моделей HuggingFace:', new Date().toISOString());
    
    const testModels = [
        'black-forest-labs/FLUX.1-dev',
        'lodestones/Chroma', 
        'stabilityai/stable-diffusion-xl-base-1.0',
        'runwayml/stable-diffusion-v1-5',
        'stabilityai/stable-diffusion-2-base'
    ];
    
    const results = {};
    
    for (const model of testModels) {
        try {
            console.log(`Тестируем модель: ${model}`);
            const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`
                }
            });
            
            results[model] = {
                status: response.status,
                statusText: response.statusText,
                available: response.ok
            };
            
            console.log(`${model}: ${response.status} ${response.statusText}`);
            
        } catch (error) {
            results[model] = {
                status: 'error',
                statusText: error.message,
                available: false
            };
            console.error(`${model}: Ошибка - ${error.message}`);
        }
    }
    
    res.json({
        success: true,
        tokenValid: HUGGINGFACE_API_KEY && HUGGINGFACE_API_KEY.startsWith('hf_'),
        models: results,
        timestamp: new Date().toISOString()
    });
});

// API endpoint для ИИ дизайна через GenAPI (Flux Kontext)
app.post('/api/ai-design-genapi', upload.single('image'), async (req, res) => {
    console.log('\n🚀 === GENAPI ИИ ДИЗАЙН (FLUX KONTEXT) ===');
    console.log('Время запроса:', new Date().toISOString());
    console.log('IP клиента:', req.ip || req.connection.remoteAddress);
    
    try {
        console.log('📋 Проверяем входные данные...');
        console.log('req.body:', req.body);
        console.log('req.file:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : 'НЕТ ФАЙЛА');
        
        if (!req.file) {
            console.log('❌ Файл не загружен');
            return res.status(400).json({ 
                success: false, 
                error: 'Изображение не загружено' 
            });
        }

        const { style, prompt } = req.body;
        
        if (!style || !prompt) {
            console.log('❌ Отсутствуют обязательные параметры:', { style, prompt });
            return res.status(400).json({ 
                success: false, 
                error: 'Стиль и описание обязательны' 
            });
        }

        console.log('✅ Валидация пройдена');
        console.log('📊 Параметры запроса:', { 
            style, 
            prompt, 
            fileSize: req.file.size,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype
        });

        const base64Image = req.file.buffer.toString('base64');
        console.log('🖼️ Изображение конвертировано в base64, размер:', base64Image.length);

        // Создаем промт для стиля (адаптированный для русского языка и Flux Kontext)
        const stylePrompts = {
            'minimalist': 'минималистичная мебель и декор, чистые линии, нейтральная цветовая палитра, простые аксессуары',
            'scandinavian': 'скандинавская мебель, светлое дерево, белые и бежевые цвета, уютный текстиль',
            'industrial': 'индустриальная мебель, металлические элементы, темная цветовая схема, открытые материалы',
            'loft': 'лофтовая мебель и освещение, урбанистический декор, кирпичные текстуры, современные светильники',
            'modern': 'современная мебель, элегантные аксессуары, современное освещение, геометрические формы',
            'contemporary': 'современная мебель и декор, актуальные дизайнерские тренды, стильные аксессуары',
            'classic': 'классическая мебель, традиционные элементы декора, элегантные аксессуары, изысканные материалы',
            'neoclassic': 'неоклассическая мебель и декор, роскошные аксессуары, изысканная цветовая схема',
            'provence': 'мебель в стиле прованс, деревенский шарм, светлая цветовая палитра, винтажные аксессуары',
            'art-deco': 'мебель и узоры арт-деко, геометрические украшения, роскошные материалы и отделка',
            'vintage': 'винтажная мебель, ретро декор, ностальгическая цветовая схема, классические аксессуары',
            'japanese': 'японская минималистичная мебель, дзен элементы декора, натуральные материалы',
            'high-tech': 'хай-тек мебель, интеграция современных технологий, футуристическое освещение',
            'rustic': 'деревенская мебель, натуральные материалы, элементы кантри декора',
            'mediterranean': 'средиземноморская мебель и текстиль, теплая цветовая палитра, натуральные текстуры',
            'boho': 'богемная мебель и текстиль, эклектичный микс декора, цветные тканевые узоры',
            'eclectic': 'эклектичный микс мебели, уникальные комбинации декора, разнообразные стилевые элементы',
            'tropical': 'тропическая мебель, натуральные материалы, зеленые растения в декоре',
            'coastal': 'прибрежная мебель, светлая цветовая схема, декор в морском стиле',
            'mid-century': 'мебель середины века, ретро стиль декора, винтажная цветовая палитра'
        };

        const styleDescription = stylePrompts[style] || `интерьер в стиле ${style}`;
        
        // Создаем промт для Flux Kontext с акцентом на сохранение архитектуры
        const enhancedPrompt = `Измени только мебель и декор на ${styleDescription}. ${prompt}. Сохрани все стены, окна, двери и архитектуру комнаты без изменений. Не перемещай и не удаляй стены. Измени только предметы интерьера, цвета и освещение.`;
        
        console.log('🎨 Генерируем изображение с помощью Flux Kontext...');
        console.log('Промт:', enhancedPrompt);

        try {
            console.log('🔍 Проверяем GenAPI токен:', GENAPI_API_KEY ? 'Токен найден' : 'Токен НЕ найден');
            
            if (!GENAPI_API_KEY) {
                throw new Error('GenAPI токен не найден в переменных окружения');
            }
            
            console.log('📡 Отправляем запрос к GenAPI...');
            
            const editedImageBase64 = await callGenAPI(base64Image, enhancedPrompt, 'flux-kontext');
            
            console.log('✅ Изображение сгенерировано успешно через GenAPI');
            
            res.json({
                success: true,
                message: 'Дизайн интерьера успешно изменен с помощью Flux Kontext',
                originalImage: `data:image/jpeg;base64,${base64Image}`,
                editedImage: `data:image/png;base64,${editedImageBase64}`,
                style: style,
                prompt: prompt,
                model: 'flux-kontext',
                provider: 'GenAPI'
            });

        } catch (error) {
            console.error('❌ Ошибка GenAPI:', error.message);
            console.log('🔄 Создаем заглушку...');
            
            // Создаем заглушку в случае ошибки
            try {
                const canvas = require('canvas');
                const canvasObj = canvas.createCanvas(512, 512);
                const ctx = canvasObj.getContext('2d');
                
                // Фон
                const gradient = ctx.createLinearGradient(0, 0, 512, 512);
                gradient.addColorStop(0, '#f8f9fa');
                gradient.addColorStop(1, '#e9ecef');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 512, 512);
                
                // Заголовок
                ctx.fillStyle = '#495057';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Flux Kontext ИИ Дизайн', 256, 80);
                
                // Стиль
                ctx.font = '18px Arial';
                ctx.fillText(`Стиль: ${style}`, 256, 120);
                
                // Время
                ctx.font = '14px Arial';
                ctx.fillStyle = '#6c757d';
                ctx.fillText(new Date().toLocaleString(), 256, 150);
                
                // Статус
                ctx.fillStyle = '#dc3545';
                ctx.font = 'bold 16px Arial';
                ctx.fillText('Демо режим', 256, 200);
                ctx.fillText('(нужен GenAPI токен)', 256, 220);
                
                const placeholderBase64 = canvasObj.toBuffer().toString('base64');
                
                res.json({
                    success: true,
                    message: 'Демо режим - нужен GenAPI токен для реальной генерации',
                    originalImage: `data:image/jpeg;base64,${base64Image}`,
                    editedImage: `data:image/png;base64,${placeholderBase64}`,
                    style: style,
                    prompt: prompt,
                    model: 'flux-kontext',
                    provider: 'GenAPI (demo)',
                    demo: true,
                    error: error.message
                });
                
            } catch (canvasError) {
                console.error('❌ Ошибка создания заглушки:', canvasError);
                throw error; // Выбрасываем оригинальную ошибку
            }
        }

    } catch (error) {
        console.error('\n❌ === КРИТИЧЕСКАЯ ОШИБКА ===');
        console.error('Время:', new Date().toISOString());
        console.error('Ошибка:', error.message);
        console.error('Стек:', error.stack);
        
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint для ИИ дизайна через Hugging Face (LEGACY)
app.post('/api/ai-design-huggingface', upload.single('image'), async (req, res) => {
    console.log('\n🚀 === HUGGING FACE ИИ ДИЗАЙН ===');
    console.log('Время запроса:', new Date().toISOString());
    console.log('IP клиента:', req.ip || req.connection.remoteAddress);
    console.log('User-Agent:', req.get('User-Agent'));
    console.log('Content-Type:', req.get('Content-Type'));
    
    try {
        console.log('📋 Проверяем входные данные...');
        console.log('req.body:', req.body);
        console.log('req.file:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : 'НЕТ ФАЙЛА');
        
        if (!req.file) {
            console.log('❌ Файл не загружен');
            return res.status(400).json({ 
                success: false, 
                error: 'Изображение не загружено' 
            });
        }

        const { style, prompt } = req.body;
        
        if (!style || !prompt) {
            console.log('❌ Отсутствуют обязательные параметры:', { style, prompt });
            return res.status(400).json({ 
                success: false, 
                error: 'Стиль и описание обязательны' 
            });
        }

        console.log('✅ Валидация пройдена');
        console.log('📊 Параметры запроса:', { 
            style, 
            prompt, 
            fileSize: req.file.size,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype
        });

        const base64Image = req.file.buffer.toString('base64');

        // Шаг 1: Пропускаем анализ изображения для упрощения
        console.log('Шаг 1: Используем базовый анализ изображения...');
        let analysis = 'interior room with furniture and decor elements';
        console.log('Анализ изображения (базовый):', analysis);

        // Шаг 2: Создаем промт для стиля
        const stylePrompts = {
            'minimalist': 'minimalist furniture and decor, clean lines, neutral color palette, simple accessories',
            'scandinavian': 'scandinavian furniture style, light wood textures, white and beige colors, cozy textiles',
            'industrial': 'industrial style furniture, metal fixtures, dark color scheme, exposed materials',
            'loft': 'loft style furniture and lighting, urban decor elements, brick textures, modern fixtures',
            'modern': 'modern furniture design, sleek accessories, contemporary lighting, geometric shapes',
            'contemporary': 'contemporary furniture and decor, current design trends, stylish accessories',
            'classic': 'classic furniture style, traditional decor elements, elegant accessories, refined materials',
            'neoclassic': 'neoclassic furniture and decor, luxury accessories, sophisticated color scheme',
            'provence': 'provence style furniture, rustic charm decor, light color palette, vintage accessories',
            'art-deco': 'art-deco furniture and patterns, geometric decorations, luxury materials and finishes',
            'vintage': 'vintage furniture pieces, retro decor items, nostalgic color scheme, classic accessories',
            'japanese': 'japanese minimalist furniture, zen decor elements, natural material textures',
            'high-tech': 'high-tech furniture design, modern technology integration, futuristic lighting',
            'rustic': 'rustic furniture style, natural material textures, country decor elements',
            'mediterranean': 'mediterranean furniture and textiles, warm color palette, natural textures',
            'boho': 'bohemian furniture and textiles, eclectic decor mix, colorful fabric patterns',
            'eclectic': 'eclectic furniture mix, unique decor combinations, varied style elements',
            'tropical': 'tropical furniture style, natural material textures, green plant decorations',
            'coastal': 'coastal furniture design, light color scheme, beach-inspired decor elements',
            'mid-century': 'mid-century furniture pieces, retro decor style, vintage color palette'
        };

        const styleDescription = stylePrompts[style] || `${style} interior design style`;
        
        // Шаг 3: Создаем детальный промт с сохранением архитектуры
        const enhancedPrompt = `Interior design transformation: ${styleDescription}. ${prompt}. IMPORTANT: Keep existing wall layout, room proportions, and architectural structure UNCHANGED. Only modify furniture, decorations, colors, textures, and lighting. Maintain the original room boundaries and wall positions. Do not move or remove walls. Professional interior photography, realistic lighting, high quality rendering.`;
        
        console.log('Шаг 2: Генерация изображения...');
        console.log('Промт:', enhancedPrompt);

        // Пробуем простую модель, которая точно работает с бесплатным API
        console.log('🎯 Пробуем простую модель: stable-diffusion-v1-5');
        
        let editedImageBase64; // Объявляем переменную в правильной области видимости
        
        try {
            console.log('🔍 Проверяем токен:', process.env.HUGGINGFACE_API_KEY ? 'Токен найден' : 'Токен НЕ найден');
            console.log('🔍 Длина токена:', process.env.HUGGINGFACE_API_KEY ? process.env.HUGGINGFACE_API_KEY.length : 0);
            
            // Попробуем использовать простую модель Stable Diffusion
            console.log('📡 Отправляем запрос к Hugging Face API...');
            
            // Попробуем несколько АКТУАЛЬНЫХ и РАБОТАЮЩИХ моделей последовательно
            const modelsToTry = [
                'black-forest-labs/FLUX.1-dev',        // Самая популярная (1.68M загрузок)
                'lodestones/Chroma',                    // Недавно обновлена
                'stabilityai/stable-diffusion-xl-base-1.0',  // Базовая SDXL
                'runwayml/stable-diffusion-v1-5',      // Классическая SD 1.5
                'stabilityai/stable-diffusion-2-1'     // SD 2.1
            ];
            
            let generationResult = null;
            let lastError = null;
            
            for (const model of modelsToTry) {
                try {
                    console.log(`🔄 Пробуем модель: ${model}`);
                    generationResult = await callHuggingFaceAPI(model, enhancedPrompt);
                    console.log(`✅ Модель ${model} сработала!`);
                    break;
                } catch (error) {
                    console.log(`❌ Модель ${model} не сработала: ${error.message}`);
                    lastError = error;
                    continue;
                }
            }
            
            // Если основные модели не сработали, попробуем простые альтернативы
            if (!generationResult) {
                console.log('🔄 Основные модели не работают, пробуем простые альтернативы...');
                const simpleModels = [
                    'google/ddpm-cifar10-32',              // Простая диффузионная модель
                    'microsoft/DialoGPT-medium',            // Для тестирования API
                    'stabilityai/stable-diffusion-2-base'   // Базовая версия SD2
                ];
                
                for (const model of simpleModels) {
                    try {
                        console.log(`🔄 Пробуем простую модель: ${model}`);
                        generationResult = await callHuggingFaceAPI(model, enhancedPrompt);
                        console.log(`✅ Простая модель ${model} сработала!`);
                        break;
                    } catch (error) {
                        console.log(`❌ Простая модель ${model} не сработала: ${error.message}`);
                        continue;
                    }
                }
            }
            
            if (!generationResult) {
                throw lastError || new Error('Все модели недоступны - возможно нужен другой тип токена или модели требуют специального доступа');
            }

            if (generationResult instanceof ArrayBuffer) {
                editedImageBase64 = Buffer.from(generationResult).toString('base64');
                console.log('✅ Изображение сгенерировано успешно, размер:', generationResult.byteLength, 'байт');
            } else {
                throw new Error('Неожиданный формат ответа от API генерации изображений');
            }
        } catch (error) {
            console.error('❌ Ошибка генерации:', error.message);
            console.log('🔄 Создаем улучшенную заглушку...');
            
            try {
                // Создаем более качественную заглушку в формате PNG
                const canvas = require('canvas');
                const canvasObj = canvas.createCanvas(512, 512);
                const ctx = canvasObj.getContext('2d');
                
                // Фон
                const gradient = ctx.createLinearGradient(0, 0, 512, 512);
                gradient.addColorStop(0, '#f8f9fa');
                gradient.addColorStop(1, '#e9ecef');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 512, 512);
                
                // Рамка
                ctx.strokeStyle = '#6c757d';
                ctx.lineWidth = 2;
                ctx.strokeRect(10, 10, 492, 492);
                
                // Заголовок
                ctx.fillStyle = '#495057';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('ИИ Дизайн интерьера', 256, 80);
                
                // Стиль
                ctx.font = '18px Arial';
                ctx.fillText(`Стиль: ${style}`, 256, 120);
                
                // Время
                ctx.font = '14px Arial';
                ctx.fillStyle = '#6c757d';
                ctx.fillText(new Date().toLocaleString(), 256, 150);
                
                // Имитация интерьера
                ctx.fillStyle = '#dee2e6';
                ctx.fillRect(50, 180, 412, 250);
                
                // Мебель (простые прямоугольники)
                ctx.fillStyle = '#adb5bd';
                ctx.fillRect(100, 350, 80, 40); // диван
                ctx.fillRect(250, 200, 60, 60); // стол
                ctx.fillRect(350, 220, 40, 120); // шкаф
                
                // Окно
                ctx.fillStyle = '#cfe2ff';
                ctx.fillRect(380, 190, 60, 80);
                
                // Текст снизу
                ctx.fillStyle = '#495057';
                ctx.font = '16px Arial';
                ctx.fillText('Демо-версия дизайна', 256, 460);
                ctx.font = '12px Arial';
                ctx.fillStyle = '#6c757d';
                ctx.fillText('Реальная генерация ИИ временно недоступна', 256, 480);
                
                const buffer = canvasObj.toBuffer('image/png');
                editedImageBase64 = buffer.toString('base64');
                console.log('✅ Создана PNG заглушка размером:', buffer.length, 'байт');
            } catch (canvasError) {
                console.error('❌ Ошибка создания canvas:', canvasError.message);
                // Последний fallback - простая SVG заглушка
                const simpleSvg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f8f9fa"/>
                    <text x="256" y="256" text-anchor="middle" font-family="Arial" font-size="18" fill="#495057">
                        Ошибка генерации
                    </text>
                </svg>`;
                editedImageBase64 = Buffer.from(simpleSvg).toString('base64');
                console.log('⚠️ Создана простая SVG заглушка');
            }
        }

        console.log('Генерация завершена успешно');

        res.json({
            success: true,
            originalImage: `data:${req.file.mimetype};base64,${base64Image}`,
            editedImage: `data:image/png;base64,${editedImageBase64}`,
            analysis: analysis,
            enhancedPrompt: enhancedPrompt,
            style: style,
            prompt: prompt,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('\n=== ОШИБКА HUGGING FACE ===');
        console.error('Время:', new Date().toISOString());
        console.error('Ошибка:', error.message);
        
        let errorMessage = 'Ошибка при обработке изображения';
        
        if (error.message.includes('rate limit') || error.message.includes('429')) {
            errorMessage = 'Превышен лимит запросов. Попробуйте через несколько минут.';
        } else if (error.message.includes('loading') || error.message.includes('503')) {
            errorMessage = 'Модель загружается. Попробуйте через 30-60 секунд.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Превышено время ожидания. Попробуйте еще раз.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage = 'Ошибка авторизации API. Проверьте токен.';
        }
        
        res.status(500).json({ 
            success: false, 
            error: errorMessage,
            details: error.message 
        });
    }
});

// API для работы с проектами
app.get('/api/db/projects', async (req, res) => {
    console.log('Запрос списка проектов:', new Date().toISOString());
    try {
        const projects = await db.query('SELECT * FROM projects');
        console.log(`Найдено проектов: ${projects.length}`);
        res.json({ success: true, projects, count: projects.length });
    } catch (error) {
        console.error('Ошибка получения проектов:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/db/projects/:id', async (req, res) => {
    console.log(`Запрос проекта ID: ${req.params.id}`, new Date().toISOString());
    try {
        const project = await db.getOne('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        
        if (!project) {
            console.log(`Проект с ID ${req.params.id} не найден`);
            return res.status(404).json({ success: false, error: 'Проект не найден' });
        }

        console.log('Найден проект:', project.title);

        // Получаем блоки контента проекта из правильной таблицы
        const contentBlocks = await db.query(
            'SELECT * FROM project_content_blocks WHERE project_id = ? ORDER BY sort_order',
            [req.params.id]
        );

        console.log(`Найдено блоков контента: ${contentBlocks.length}`);

        res.json({
            success: true,
            project: {
                ...project,
                contentBlocks
            }
        });
    } catch (error) {
        console.error('Ошибка получения проекта:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Удаление проекта
app.delete('/api/db/projects/:id', async (req, res) => {
    console.log(`Запрос на удаление проекта ID: ${req.params.id}`, new Date().toISOString());
    try {
        const projectId = req.params.id;
        
        // Проверяем существование проекта
        const project = await db.getOne('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (!project) {
            console.log(`Проект с ID ${projectId} не найден`);
            return res.status(404).json({ 
                success: false, 
                error: 'Проект не найден' 
            });
        }
        
        console.log(`Удаляем проект: ${project.title}`);
        
        // Удаляем связанные блоки контента
        await db.query('DELETE FROM project_content_blocks WHERE project_id = ?', [projectId]);
        console.log('Удалены блоки контента проекта');
        
        // Удаляем связанные изображения из таблицы images
        await db.query('DELETE FROM images WHERE entity_type = "project" AND entity_id = ?', [projectId]);
        console.log('Удалены записи изображений проекта');
        
        // Удаляем сам проект
        await db.query('DELETE FROM projects WHERE id = ?', [projectId]);
        console.log('Проект удален из базы данных');
        
        res.json({ 
            success: true, 
            message: 'Проект успешно удален',
            projectId: parseInt(projectId)
        });
        
    } catch (error) {
        console.error('Ошибка удаления проекта:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API для работы со статьями (базовые, без создания)
app.get('/api/db/articles', async (req, res) => {
    try {
        const articles = await db.query('SELECT * FROM articles');
        res.json({ success: true, articles });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/db/articles/:id', async (req, res) => {
    try {
        const article = await db.getOne('SELECT * FROM articles WHERE id = ?', [req.params.id]);
        
        if (!article) {
            return res.status(404).json({ success: false, error: 'Статья не найдена' });
        }

        // Получаем изображения статьи
        const images = await db.query(
            'SELECT * FROM images WHERE entity_type = "article" AND entity_id = ?',
            [req.params.id]
        );

        // Получаем блоки контента статьи
        const contentBlocks = await db.query(
            'SELECT * FROM content_blocks WHERE entity_type = "article" AND entity_id = ? ORDER BY sort_order',
            [req.params.id]
        );

        // Получаем авторов статьи
        const architects = await db.query(
            `SELECT a.* FROM architects a
             JOIN article_architects aa ON a.id = aa.architect_id
             WHERE aa.article_id = ?`,
            [req.params.id]
        );

        res.json({
            success: true,
            article: {
                ...article,
                images,
                contentBlocks,
                architects
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API для работы с администраторами
app.get('/api/db/admins', async (req, res) => {
    try {
        const admins = await db.query('SELECT id, username, email, full_name, role FROM admins ORDER BY username');
        res.json({ success: true, admins });
    } catch (error) {
        console.error('Ошибка получения списка админов:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Создание нового администратора
app.post('/api/db/admins', async (req, res) => {
    try {
        const { username, password, email, full_name, role } = req.body;
        
        // Валидация обязательных полей
        if (!username || !password || !email || !role) {
            return res.status(400).json({ 
                success: false, 
                error: 'Логин, пароль, email и роль обязательны' 
            });
        }
        
        // Проверяем допустимые роли
        const allowedRoles = ['admin', 'editor', 'viewer'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Недопустимая роль' 
            });
        }
        
        // Проверяем уникальность логина
        const existingUsername = await db.getOne('SELECT id FROM admins WHERE username = ?', [username]);
        if (existingUsername) {
            return res.status(400).json({ 
                success: false, 
                error: 'Пользователь с таким логином уже существует' 
            });
        }
        
        // Проверяем уникальность email
        const existingEmail = await db.getOne('SELECT id FROM admins WHERE email = ?', [email]);
        if (existingEmail) {
            return res.status(400).json({ 
                success: false, 
                error: 'Пользователь с таким email уже существует' 
            });
        }
        
        // Хешируем пароль с помощью SHA256
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        // Создаем запись в БД
        const adminData = {
            username: username.trim(),
            password_hash: passwordHash,
            email: email.trim(),
            full_name: full_name ? full_name.trim() : null,
            role: role
        };
        
        const adminId = await db.insert('admins', adminData);
        
        console.log(`Новый администратор создан: ID=${adminId}, username=${username}, role=${role}`);
        
        res.json({ 
            success: true, 
            adminId,
            message: 'Администратор успешно создан',
            admin: {
                id: adminId,
                username: adminData.username,
                email: adminData.email,
                full_name: adminData.full_name,
                role: adminData.role
            }
        });
        
    } catch (error) {
        console.error('Ошибка создания администратора:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Удаление администратора
app.delete('/api/db/admins/:id', async (req, res) => {
    try {
        const adminId = req.params.id;
        
        // Проверяем существование администратора
        const admin = await db.getOne('SELECT * FROM admins WHERE id = ?', [adminId]);
        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                error: 'Администратор не найден' 
            });
        }
        
        // Удаляем администратора
        const deleted = await db.remove('admins', 'id = ?', [adminId]);
        
        if (deleted > 0) {
            console.log(`Администратор удален: ID=${adminId}, username=${admin.username}`);
            res.json({ 
                success: true, 
                message: 'Администратор успешно удален' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Не удалось удалить администратора' 
            });
        }
        
    } catch (error) {
        console.error('Ошибка удаления администратора:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API для авторизации администраторов
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password, remember } = req.body;
        
        console.log('Попытка входа:', { username, remember });
        
        // Валидация данных
        if (!username || !password) {
            console.log('Ошибка валидации: отсутствуют логин или пароль');
            return res.status(400).json({ 
                success: false, 
                error: 'Логин и пароль обязательны' 
            });
        }
        
        // Ищем пользователя в базе данных
        const admin = await db.getOne(
            'SELECT * FROM admins WHERE username = ? OR email = ?', 
            [username, username]
        );
        
        console.log('Результат поиска админа:', admin ? 'найден' : 'не найден');
        
        if (!admin) {
            console.log('Администратор не найден в БД');
            return res.status(401).json({ 
                success: false, 
                error: 'Неверный логин или пароль' 
            });
        }
        
        // Проверяем пароль (хешируем введенный пароль и сравниваем с хешем в БД)
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        console.log('Сравнение паролей:', {
            введенный: passwordHash,
            изБД: admin.password_hash,
            совпадают: admin.password_hash === passwordHash
        });
        
        if (admin.password_hash !== passwordHash) {
            console.log('Пароль не совпадает');
            return res.status(401).json({ 
                success: false, 
                error: 'Неверный логин или пароль' 
            });
        }
        
        // Устанавливаем сессию
        req.session.adminId = admin.id;
        req.session.adminUsername = admin.username;
        req.session.adminRole = admin.role;
        req.session.isAuthenticated = true;
        
        console.log('Сессия установлена:', {
            adminId: req.session.adminId,
            username: req.session.adminUsername,
            isAuthenticated: req.session.isAuthenticated
        });
        
        // Если выбрано "Запомнить меня", увеличиваем время жизни сессии
        if (remember) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дней
            console.log('Установлено длительное время сессии');
        }
        
        // Обновляем время последнего входа
        try {
            await db.query(
                'UPDATE admins SET last_login = NOW() WHERE id = ?', 
                [admin.id]
            );
            console.log('Время последнего входа обновлено');
        } catch (updateError) {
            console.error('Ошибка обновления времени входа:', updateError);
            // Не критично, продолжаем
        }
        
        console.log('Авторизация успешна для:', admin.username);
        
        res.json({ 
            success: true, 
            message: 'Авторизация успешна',
            admin: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name,
                role: admin.role
            }
        });
        
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка сервера при авторизации: ' + error.message 
        });
    }
});

// Проверка активной сессии
app.get('/api/admin/check-session', (req, res) => {
    console.log('Проверка сессии:', {
        sessionExists: !!req.session,
        isAuthenticated: req.session?.isAuthenticated,
        adminId: req.session?.adminId
    });
    
    if (req.session && req.session.isAuthenticated) {
        console.log('Сессия активна для:', req.session.adminUsername);
        res.json({ 
            authenticated: true, 
            admin: {
                id: req.session.adminId,
                username: req.session.adminUsername,
                role: req.session.adminRole
            }
        });
    } else {
        console.log('Сессия не активна');
        res.json({ authenticated: false });
    }
});

// Выход из системы
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: 'Ошибка при выходе из системы' 
            });
        }
        res.clearCookie('connect.sid'); // Очищаем cookie сессии
        res.json({ 
            success: true, 
            message: 'Выход выполнен успешно' 
        });
    });
});

// Middleware для проверки авторизации
function requireAuth(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        next();
    } else {
        res.status(401).json({ 
            success: false, 
            error: 'Требуется авторизация' 
        });
    }
}

// API для работы с сотрудниками/архитекторами
app.get('/api/db/architects', async (req, res) => {
    try {
        const architects = await db.query('SELECT * FROM architects');
        res.json({ success: true, architects });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/db/architects/:id', async (req, res) => {
    try {
        const architect = await db.getOne('SELECT * FROM architects WHERE id = ?', [req.params.id]);
        
        if (!architect) {
            return res.status(404).json({ success: false, error: 'Сотрудник не найден' });
        }

        // Получаем проекты, в которых участвовал сотрудник
        const projects = await db.query(
            `SELECT p.* FROM projects p
             JOIN project_architects pa ON p.id = pa.project_id
             WHERE pa.architect_id = ?`,
            [req.params.id]
        );

        // Получаем статьи, автором которых является сотрудник
        const articles = await db.query(
            `SELECT a.* FROM articles a
             JOIN article_architects aa ON a.id = aa.article_id
             WHERE aa.architect_id = ?`,
            [req.params.id]
        );

        res.json({
            success: true,
            architect: {
                ...architect,
                projects,
                articles
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API для получения изображений кейсов
app.get('/api/db/cases', async (req, res) => {
    try {
        const cases = await db.query(`
            SELECT entity_id, url, alt_text, title, sort_order
            FROM images 
            WHERE entity_type = 'case' 
            ORDER BY sort_order
        `);
        
        res.json({ success: true, cases });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API для получения изображений услуг
app.get('/api/services', async (req, res) => {
    try {
        const servicesImages = await db.query(
            'SELECT id, title, alt_text, direct_url, entity_type FROM images WHERE entity_id = ? ORDER BY id',
            [101]
        );
        
        console.log('Запрос изображений услуг, найдено:', servicesImages.length);
        
        res.json({
            success: true,
            data: servicesImages,
            count: servicesImages.length
        });
    } catch (error) {
        console.error('Ошибка получения изображений услуг:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения изображений услуг'
        });
    }
});

// ------------ API для портфолио ------------

// API для получения данных портфолио
app.get('/api/portfolio', async (req, res) => {
    try {
        console.log('Получение данных портфолио...');
        
        // Получаем только изображения портфолио (houses, apartments, offices)
        const images = await db.query(`
            SELECT 
                id,
                url,
                alt_text,
                title,
                entity_type,
                entity_id,
                direct_url
            FROM images 
            WHERE entity_type IN ('houses', 'apartments', 'offices')
            ORDER BY entity_id, id
        `);
        
        // Группируем по типам для удобства
        const portfolio = {
            all: [],
            apartments: [],
            houses: [],
            offices: []
        };
        
        images.forEach(image => {
            // Добавляем во все проекты (только те, что прошли фильтр)
            portfolio.all.push(image);
            
            // Добавляем в соответствующую категорию
            if (image.entity_type === 'apartments') {
                portfolio.apartments.push(image);
            } else if (image.entity_type === 'houses') {
                portfolio.houses.push(image);
            } else if (image.entity_type === 'offices') {
                portfolio.offices.push(image);
            }
        });
        
        console.log(`Найдено изображений: ${images.length}`);
        console.log(`Квартиры: ${portfolio.apartments.length}, Дома: ${portfolio.houses.length}, Офисы: ${portfolio.offices.length}`);
        
        // Возвращаем данные
        res.json({
            success: true,
            data: portfolio,
            total: images.length,
            counts: {
                all: portfolio.all.length,
                apartments: portfolio.apartments.length,
                houses: portfolio.houses.length,
                offices: portfolio.offices.length
            }
        });
        
    } catch (error) {
        console.error('Ошибка получения данных портфолио:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения данных: ' + error.message
        });
    }
});

// API для получения конкретного проекта
app.get('/api/portfolio/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        console.log(`Получение проекта с ID: ${projectId}`);
        
        // Получаем конкретный проект
        const image = await db.getOne(`
            SELECT 
                id,
                url,
                alt_text,
                title,
                entity_type,
                entity_id,
                direct_url
            FROM images 
            WHERE id = ?
        `, [projectId]);
        
        if (!image) {
            return res.status(404).json({
                success: false,
                error: 'Проект не найден'
            });
        }
        
        res.json({
            success: true,
            data: image
        });
        
    } catch (error) {
        console.error('Ошибка получения проекта:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения проекта: ' + error.message
        });
    }
});

// ------------ Конец API для портфолио ------------

// ------------ Функции-помощники ------------

// Функция транслитерации для создания slug
function transliterate(text) {
    const ru = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
        'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
        'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
        'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch',
        'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
        'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
        'Е': 'E', 'Ё': 'E', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
        'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
        'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
        'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Ch',
        'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
        'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };
    
    let slug = text.split('').map(char => ru[char] || char).join('');
    slug = slug.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Удаляем все, кроме букв, цифр, пробелов и дефисов
        .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
        .replace(/-+/g, '-') // Заменяем множественные дефисы на один
        .replace(/^-+|-+$/g, ''); // Удаляем дефисы в начале и конце
    
    return slug;
}

// Функция для получения прямой ссылки на изображение из публичной ссылки Яндекс.Диска
function getDirectImageUrl(publicUrl) {
    if (!publicUrl) return null;
    
    try {
        // Метод 1: Извлекаем публичный ключ и формируем download ссылку через API
        const match = publicUrl.match(/\/([a-zA-Z0-9%+/=]+)$/);
        if (match && match[1]) {
            const publicKey = decodeURIComponent(match[1]);
            
            // Пробуем разные варианты для получения длинных URL
            const downloadOptions = [
                // Вариант 1: Прямая ссылка через download API (самая длинная)
                `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`,
                // Вариант 2: Preview URL без обрезки с высоким качеством
                `https://downloader.disk.yandex.ru/preview?url=ya-disk-public%3A%2F%2F${encodeURIComponent(publicKey)}&crop=0&size=1920x1080`,
                // Вариант 3: Preview URL без размера (полный размер)
                `https://downloader.disk.yandex.ru/preview?url=ya-disk-public%3A%2F%2F${encodeURIComponent(publicKey)}&crop=0`,
                // Вариант 4: Альтернативный формат
                `https://downloader.disk.yandex.ru/preview?url=ya-disk-public%3A%2F%2F${publicKey}&crop=0&size=XXL`
            ];
            
            // Возвращаем первый вариант для получения самого длинного URL
            return downloadOptions[1]; // Используем preview с размером как компромисс
        }
        
        // Метод 2: Если не удалось извлечь ключ, возвращаем исходную ссылку
        return publicUrl;
    } catch (error) {
        console.error('Ошибка обработки URL изображения:', error);
        return publicUrl;
    }
}

// Функция для получения прямой ссылки через API Яндекс.Диска
async function getActualDownloadUrl(publicUrl) {
    try {
        console.log('Получаю прямую ссылку для:', publicUrl);
        
        // Метод 1: Используем API загрузки с публичным ключом для получения самой длинной ссылки
        const downloadResponse = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                },
                timeout: 10000 // 10 секунд таймаут
            }
        );
        
        if (downloadResponse.data && downloadResponse.data.href) {
            console.log('Получена прямая длинная ссылка через API загрузки');
            return downloadResponse.data.href;
        }
        
        throw new Error('API загрузки не вернул прямую ссылку');
        
    } catch (apiError) {
        console.log('Ошибка API загрузки:', apiError.message);
        
        try {
            // Метод 2: Используем альтернативный способ через preview API с максимальным качеством
            const match = publicUrl.match(/\/([a-zA-Z0-9%+/=]+)$/);
            if (match && match[1]) {
                const publicKey = decodeURIComponent(match[1]);
                
                // Пробуем разные размеры для получения самого качественного изображения
                const previewUrls = [
                    `https://downloader.disk.yandex.ru/preview?url=ya-disk-public%3A%2F%2F${encodeURIComponent(publicKey)}&crop=0&size=XXXL`,
                    `https://downloader.disk.yandex.ru/preview?url=ya-disk-public%3A%2F%2F${encodeURIComponent(publicKey)}&crop=0&size=XXL`,
                    `https://downloader.disk.yandex.ru/preview?url=ya-disk-public%3A%2F%2F${encodeURIComponent(publicKey)}&crop=0&size=1920x1080`,
                    `https://downloader.disk.yandex.ru/preview?url=ya-disk-public%3A%2F%2F${encodeURIComponent(publicKey)}&crop=0`
                ];
                
                // Проверяем каждый URL по очереди, начиная с самого качественного
                for (const previewUrl of previewUrls) {
                    try {
                        console.log('Попытка получения ссылки через preview API:', previewUrl);
                        const testResponse = await axios.head(previewUrl, { timeout: 5000 });
                        if (testResponse.status === 200) {
                            console.log('Preview URL работает:', previewUrl);
                            return previewUrl;
                        }
                    } catch (previewError) {
                        console.log('Preview URL недоступен:', previewUrl, previewError.message);
                        continue; // Пробуем следующий URL
                    }
                }
            }
            
            // Метод 3: Используем прямой download API без авторизации
            const directDownloadUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`;
            
            try {
                const directResponse = await axios.get(directDownloadUrl, { timeout: 5000 });
                if (directResponse.data && directResponse.data.href) {
                    console.log('Получена прямая ссылка через публичный API');
                    return directResponse.data.href;
                }
            } catch (directError) {
                console.log('Прямой API недоступен:', directError.message);
            }
            
            // Метод 4: Fallback на исходную публичную ссылку
            console.log('Используем исходную публичную ссылку как fallback');
            return publicUrl;
            
        } catch (fallbackError) {
            console.error('Все методы получения прямой ссылки не сработали:', fallbackError.message);
            return publicUrl;
        }
    }
}

// Функция для проверки доступности URL
async function validateImageUrl(url) {
    try {
        const response = await axios.head(url, { 
            timeout: 5000,
            validateStatus: function (status) {
                return status >= 200 && status < 400; // Принимаем 2xx и 3xx статусы
            }
        });
        return response.status >= 200 && response.status < 400;
    } catch (error) {
        console.log('URL недоступен:', url, error.message);
        return false;
    }
}

// Функция для создания безопасного имени файла
function createSafeFileName(originalName, prefix = '') {
    // Получаем расширение файла
    const ext = path.extname(originalName);
    // Убираем расширение из имени
    const nameWithoutExt = path.basename(originalName, ext);
    
    // Транслитерируем и очищаем имя файла
    const safeName = transliterate(nameWithoutExt)
        .replace(/[^a-zA-Z0-9-_]/g, '') // Убираем все кроме букв, цифр, дефисов и подчеркиваний
        .toLowerCase()
        .substring(0, 50); // Ограничиваем длину
    
    // Генерируем короткий уникальный суффикс
    const timestamp = Date.now().toString().slice(-6); // Последние 6 цифр времени
    const randomStr = Math.random().toString(36).substring(2, 5); // 3 случайных символа
    
    return `${prefix}${safeName}-${timestamp}${randomStr}${ext}`;
}

// ------------ API для создания статей ------------

// Создание новой статьи
app.post('/api/db/articles', upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'blockImage_0', maxCount: 1 },
    { name: 'blockImage_1', maxCount: 1 },
    { name: 'blockImage_2', maxCount: 1 },
    { name: 'blockImage_3', maxCount: 1 },
    { name: 'blockImage_4', maxCount: 1 },
    { name: 'blockImage_5', maxCount: 1 },
    { name: 'blockImage_6', maxCount: 1 },
    { name: 'blockImage_7', maxCount: 1 },
    { name: 'blockImage_8', maxCount: 1 },
    { name: 'blockImage_9', maxCount: 1 }
]), async (req, res) => {
    let connection;
    try {
        // Начинаем транзакцию
        connection = await db.pool.getConnection();
        await connection.beginTransaction();

        const {
            title,
            category,
            publicationDate,
            authorId,
            shortDescription,
            contentBlocks,
            status = 'draft'
        } = req.body;

        console.log('Создание статьи:', { title, category, contentBlocks: typeof contentBlocks });
        console.log('Загруженные файлы:', req.files ? Object.keys(req.files) : 'нет');

        // Валидация обязательных полей
        if (!title || !category) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ 
                success: false, 
                error: 'Название и категория обязательны' 
            });
        }

        // Генерируем slug из заголовка
        let slug = transliterate(title);
        
        // Проверяем уникальность slug
        const existingSlug = await connection.query(
            'SELECT id FROM articles WHERE slug = ?',
            [slug]
        );
        
        if (existingSlug[0].length > 0) {
            // Добавляем случайный суффикс для уникальности
            const suffix = Math.random().toString(36).substring(2, 8);
            slug = `${slug}-${suffix}`;
        }

        let mainImageUrl = null;
        let directImageUrl = null;

        // Загружаем главное изображение на Яндекс.Диск
        if (req.files && req.files.mainImage && req.files.mainImage[0]) {
            const mainImageFile = req.files.mainImage[0];
            try {
                console.log('Загружаю главное изображение:', mainImageFile.originalname);
                
                // Создаем папку для статей, если её нет
                const articlesFolderPath = `${BASE_PATH}/articles`;
                try {
                    await axios.put(
                        `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(articlesFolderPath)}`,
                        null,
                        {
                            headers: {
                                'Authorization': `OAuth ${YANDEX_TOKEN}`
                            }
                        }
                    );
                } catch (err) {
                    // Папка уже существует, игнорируем ошибку
                }

                // Создаем папку для конкретной статьи
                const articleFolderPath = `${articlesFolderPath}/${slug}`;
                await axios.put(
                    `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(articleFolderPath)}`,
                    null,
                    {
                        headers: {
                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                        }
                    }
                );

                // Создаем безопасное имя файла
                const fileName = createSafeFileName(mainImageFile.originalname, 'main-');
                const filePath = `${articleFolderPath}/${fileName}`;
                
                console.log('Безопасное имя файла:', fileName);
                
                // Получаем URL для загрузки
                const uploadUrlResponse = await axios.get(
                    `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`,
                    {
                        headers: {
                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                        }
                    }
                );

                // Загружаем файл
                await axios.put(uploadUrlResponse.data.href, mainImageFile.buffer, {
                    headers: {
                        'Content-Type': mainImageFile.mimetype
                    }
                });

                // Публикуем файл
                await axios.put(
                    `https://cloud-api.yandex.net/v1/disk/resources/publish?path=${encodeURIComponent(filePath)}`,
                    null,
                    {
                        headers: {
                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                        }
                    }
                );

                // Получаем публичную ссылку
                const fileInfoResponse = await axios.get(
                    `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(filePath)}`,
                    {
                        headers: {
                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                        }
                    }
                );

                mainImageUrl = fileInfoResponse.data.public_url;
                
                // Получаем прямую ссылку для скачивания
                try {
                    // Сначала пробуем более стабильные preview ссылки
                    directImageUrl = getDirectImageUrl(mainImageUrl);
                    console.log('После getDirectImageUrl directImageUrl:', directImageUrl);
                    
                    // Проверяем, что полученная ссылка действительно работает
                    const isUrlValid = await validateImageUrl(directImageUrl);
                    console.log('Результат проверки preview ссылки isUrlValid:', isUrlValid);
                    
                    if (!isUrlValid) {
                        console.log('Главное изображение: preview ссылка недоступна, пробуем API загрузки');
                        
                        // Пробуем API загрузки как fallback
                        const downloadUrl = await getActualDownloadUrl(mainImageUrl);
                        console.log('Загрузочная ссылка:', downloadUrl);
                        
                        const isDownloadValid = await validateImageUrl(downloadUrl);
                        console.log('Загрузочная ссылка валидна:', isDownloadValid);
                        
                        if (isDownloadValid) {
                            directImageUrl = downloadUrl;
                            console.log('Главное изображение: используем загрузочную ссылку');
                            console.log('directImageUrl после загрузочной:', directImageUrl);
                        } else {
                            console.log('Главное изображение: все ссылки недоступны, используем публичную как последний вариант');
                            directImageUrl = mainImageUrl;
                            console.log('directImageUrl после fallback на публичную:', directImageUrl);
                        }
                    } else {
                        console.log('Главное изображение: preview ссылка проверена и работает');
                        console.log('directImageUrl остается preview:', directImageUrl);
                    }
                } catch (directUrlError) {
                    console.log('Не удалось получить ссылки для главного изображения, используем публичную:', directUrlError.message);
                    directImageUrl = mainImageUrl;
                    console.log('directImageUrl после ошибки:', directImageUrl);
                }
                
                console.log('Публичная ссылка:', mainImageUrl);
                console.log('Прямая ссылка:', directImageUrl);
                
            } catch (uploadError) {
                console.error('Ошибка загрузки главного изображения:', uploadError);
                // Продолжаем без изображения
            }
        }

        // Создаем статью в БД
        console.log('=== СОХРАНЕНИЕ В БД ===');
        console.log('Что сохраняется как main_image_url:', directImageUrl);
        console.log('Длина URL:', directImageUrl ? directImageUrl.length : 'null');
        
        const [articleResult] = await connection.query(
            `INSERT INTO articles (title, slug, category, short_description, main_image_url, status, publication_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, slug, category, shortDescription, directImageUrl, status, publicationDate || new Date()]
        );

        const articleId = articleResult.insertId;
        console.log('Статья создана с ID:', articleId);

        // Связываем статью с автором
        if (authorId) {
            await connection.query(
                'INSERT INTO article_architects (article_id, architect_id, is_main_author) VALUES (?, ?, ?)',
                [articleId, authorId, 1]
            );
            console.log('Автор привязан к статье');
        }

        // Обрабатываем блоки контента
        if (contentBlocks) {
            let parsedBlocks;
            try {
                parsedBlocks = typeof contentBlocks === 'string' 
                    ? JSON.parse(contentBlocks) 
                    : contentBlocks;
            } catch (e) {
                console.log('Не удалось распарсить блоки контента:', e);
                parsedBlocks = [];
            }

            if (Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
                console.log('Обрабатываю блоки контента:', parsedBlocks.length);
                
                for (let i = 0; i < parsedBlocks.length; i++) {
                    const block = parsedBlocks[i];
                    console.log(`Блок ${i}:`, block.type);
                    
                    if (block.type === 'text' && block.content) {
                        await connection.query(
                            `INSERT INTO content_blocks (entity_type, entity_id, block_type, content, sort_order) 
                             VALUES ('article', ?, 'text', ?, ?)`,
                            [articleId, block.content, block.order || i]
                        );
                        console.log(`Текстовый блок ${i} сохранен`);
                        
                    } else if (block.type === 'image') {
                        let imageDirectUrl = null;
                        
                        // Проверяем, есть ли файл изображения для этого блока
                        const imageFieldName = `blockImage_${block.imageIndex}`;
                        if (block.imageIndex >= 0 && req.files && req.files[imageFieldName] && req.files[imageFieldName][0]) {
                            const imageFile = req.files[imageFieldName][0];
                            
                            try {
                                console.log(`Загружаю изображение блока ${i}:`, imageFile.originalname);
                                
                                const articleFolderPath = `${BASE_PATH}/articles/${slug}`;
                                
                                // Создаем безопасное имя файла для блока
                                const fileName = createSafeFileName(imageFile.originalname, `block${i}-`);
                                const filePath = `${articleFolderPath}/${fileName}`;
                                
                                console.log('Безопасное имя файла блока:', fileName);
                                
                                // Получаем URL для загрузки
                                const uploadUrlResponse = await axios.get(
                                    `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`,
                                    {
                                        headers: {
                                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                                        }
                                    }
                                );

                                // Загружаем файл
                                await axios.put(uploadUrlResponse.data.href, imageFile.buffer, {
                                    headers: {
                                        'Content-Type': imageFile.mimetype
                                    }
                                });

                                // Публикуем файл
                                await axios.put(
                                    `https://cloud-api.yandex.net/v1/disk/resources/publish?path=${encodeURIComponent(filePath)}`,
                                    null,
                                    {
                                        headers: {
                                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                                        }
                                    }
                                );

                                // Получаем публичную ссылку
                                const fileInfoResponse = await axios.get(
                                    `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(filePath)}`,
                                    {
                                        headers: {
                                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                                        }
                                    }
                                );

                                const publicUrl = fileInfoResponse.data.public_url;
                                
                                // Получаем прямую ссылку
                                try {
                                    // Сначала пробуем более стабильные preview ссылки
                                    imageDirectUrl = getDirectImageUrl(publicUrl);
                                    console.log(`После getDirectImageUrl для блока ${i}:`, imageDirectUrl);
                                    
                                    // Проверяем валидность полученной ссылки
                                    const isUrlValid = await validateImageUrl(imageDirectUrl);
                                    console.log(`Результат проверки preview ссылки блока ${i}:`, isUrlValid);
                                    
                                    if (!isUrlValid) {
                                        console.log(`Блок контента ${i}: preview ссылка недоступна, пробуем API загрузки`);
                                        
                                        const downloadUrl = await getActualDownloadUrl(publicUrl);
                                        console.log(`Загрузочная ссылка блока ${i}:`, downloadUrl);
                                        
                                        const isDownloadValid = await validateImageUrl(downloadUrl);
                                        console.log(`Загрузочная ссылка блока ${i} валидна:`, isDownloadValid);
                                        
                                        if (isDownloadValid) {
                                            imageDirectUrl = downloadUrl;
                                            console.log(`Блок контента ${i}: используем загрузочную ссылку`);
                                        } else {
                                            console.log(`Блок контента ${i}: все ссылки недоступны, используем публичную`);
                                            imageDirectUrl = publicUrl;
                                        }
                                    } else {
                                        console.log(`Блок контента ${i}: preview ссылка проверена и работает`);
                                    }
                                } catch (directUrlError) {
                                    console.log(`Не удалось получить ссылки для блока ${i}, используем публичную:`, directUrlError.message);
                                    imageDirectUrl = publicUrl;
                                }
                                
                                console.log(`Блок ${i} - публичная ссылка:`, publicUrl);
                                console.log(`Блок ${i} - прямая ссылка:`, imageDirectUrl);
                                
                            } catch (imageUploadError) {
                                console.error(`Ошибка загрузки изображения блока ${i}:`, imageUploadError);
                            }
                        }
                        
                        console.log(`=== СОХРАНЕНИЕ БЛОКА ${i} В БД ===`);
                        console.log(`Что сохраняется как image_url для блока ${i}:`, imageDirectUrl);
                        console.log(`Длина URL блока ${i}:`, imageDirectUrl ? imageDirectUrl.length : 'null');
                        
                        await connection.query(
                            `INSERT INTO content_blocks (entity_type, entity_id, block_type, content, image_url, caption, sort_order) 
                             VALUES ('article', ?, 'image', ?, ?, ?, ?)`,
                            [articleId, block.caption || '', imageDirectUrl, block.caption || '', block.order || i]
                        );
                        console.log(`Блок изображения ${i} сохранен`);
                    }
                }
            } else {
                console.log('Блоки контента пусты или неверного формата');
            }
        }

        // Фиксируем транзакцию
        await connection.commit();
        connection.release();

        res.json({ 
            success: true, 
            articleId,
            slug,
            mainImageUrl: directImageUrl,
            message: 'Статья успешно создана' 
        });

    } catch (error) {
        console.error('Ошибка создания статьи:', error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Загрузка изображений для блоков контента
app.post('/api/db/articles/:articleId/content-images', upload.array('images', 20), async (req, res) => {
    try {
        const articleId = req.params.articleId;
        const { blockIndices } = req.body;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Изображения не выбраны' 
            });
        }

        const uploadedImages = [];

        // Получаем информацию о статье для создания папки
        const article = await db.getOne('SELECT slug FROM articles WHERE id = ?', [articleId]);
        if (!article) {
            return res.status(404).json({ 
                success: false, 
                error: 'Статья не найдена' 
            });
        }

        const articleFolderPath = `${BASE_PATH}/articles/${article.slug}`;

        // Загружаем каждое изображение
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const blockIndex = blockIndices ? blockIndices[i] : i;
            
            try {
                console.log(`Загружаю изображение блока ${blockIndex}:`, file.originalname);
                
                // Создаем безопасное имя файла для блока
                const fileName = createSafeFileName(file.originalname, `block${blockIndex}-`);
                const filePath = `${articleFolderPath}/${fileName}`;
                
                console.log('Безопасное имя файла блока:', fileName);
                
                // Получаем URL для загрузки
                const uploadUrlResponse = await axios.get(
                    `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`,
                    {
                        headers: {
                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                        }
                    }
                );

                // Загружаем файл
                await axios.put(uploadUrlResponse.data.href, file.buffer, {
                    headers: {
                        'Content-Type': file.mimetype
                    }
                });

                // Публикуем файл
                await axios.put(
                    `https://cloud-api.yandex.net/v1/disk/resources/publish?path=${encodeURIComponent(filePath)}`,
                    null,
                    {
                        headers: {
                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                        }
                    }
                );

                // Получаем публичную ссылку
                const fileInfoResponse = await axios.get(
                    `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(filePath)}`,
                    {
                        headers: {
                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                        }
                    }
                );

                const publicUrl = fileInfoResponse.data.public_url;
                const directUrl = getDirectImageUrl(publicUrl);
                
                console.log(`Блок ${blockIndex} - публичная ссылка:`, publicUrl);
                console.log(`Блок ${blockIndex} - прямая ссылка:`, directUrl);

                uploadedImages.push({
                    blockIndex,
                    url: directUrl, // Возвращаем прямую ссылку
                    publicUrl: publicUrl, // И публичную тоже для справки
                    fileName: file.originalname
                });

            } catch (uploadError) {
                console.error(`Ошибка загрузки изображения ${i}:`, uploadError);
                uploadedImages.push({
                    blockIndex,
                    error: uploadError.message
                });
            }
        }

        res.json({ 
            success: true, 
            images: uploadedImages 
        });

    } catch (error) {
        console.error('Ошибка загрузки изображений блоков:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Удаление статьи
app.delete('/api/db/articles/:id', async (req, res) => {
    let connection;
    try {
        const articleId = req.params.id;
        
        // Проверяем существование статьи
        const article = await db.getOne('SELECT * FROM articles WHERE id = ?', [articleId]);
        if (!article) {
            return res.status(404).json({ 
                success: false, 
                error: 'Статья не найдена' 
            });
        }
        
        // Начинаем транзакцию
        connection = await db.pool.getConnection();
        await connection.beginTransaction();
        
        // Удаляем связанные записи (каскадное удаление должно работать автоматически)
        
        // Удаляем связи с авторами
        await connection.query(
            'DELETE FROM article_architects WHERE article_id = ?',
            [articleId]
        );
        
        // Удаляем блоки контента
        await connection.query(
            'DELETE FROM content_blocks WHERE entity_type = "article" AND entity_id = ?',
            [articleId]
        );
        
        // Удаляем изображения из БД
        await connection.query(
            'DELETE FROM images WHERE entity_type = "article" AND entity_id = ?',
            [articleId]
        );
        
        // Удаляем саму статью
        await connection.query(
            'DELETE FROM articles WHERE id = ?',
            [articleId]
        );
        
        // Пытаемся удалить папку статьи с Яндекс.Диска (необязательно)
        if (article.slug) {
            try {
                const articleFolderPath = `${BASE_PATH}/articles/${article.slug}`;
                await axios.delete(
                    `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(articleFolderPath)}&permanently=true`,
                    {
                        headers: {
                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                        }
                    }
                );
            } catch (diskError) {
                console.log('Не удалось удалить папку с Яндекс.Диска:', diskError.message);
                // Не прерываем операцию, если не удалось удалить папку
            }
        }
        
        // Фиксируем транзакцию
        await connection.commit();
        connection.release();
        
        res.json({ 
            success: true, 
            message: 'Статья успешно удалена' 
        });
        
    } catch (error) {
        console.error('Ошибка удаления статьи:', error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ------------ API для работы с Яндекс Диском ------------

// Маршрут для получения списка папок
app.get('/api/folders', async (req, res) => {
    try {
        const response = await axios.get(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(BASE_PATH)}`, {
            headers: {
                'Authorization': `OAuth ${YANDEX_TOKEN}`
            }
        });

        const folders = response.data._embedded.items
            .filter(item => item.type === 'dir')
            .map(folder => ({
                name: folder.name,
                path: folder.path,
                created: folder.created
            }));

        res.json({ success: true, folders });
    } catch (error) {
        console.error('Ошибка получения списка папок:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.message || error.message 
        });
    }
});

// Маршрут для создания папки
app.post('/api/folders', async (req, res) => {
    const { folderName } = req.body;
    if (!folderName) {
        return res.status(400).json({ success: false, error: 'Имя папки обязательно' });
    }

    try {
        const folderPath = `${BASE_PATH}/${folderName}`;
        await axios.put(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(folderPath)}`, null, {
            headers: {
                'Authorization': `OAuth ${YANDEX_TOKEN}`
            }
        });

        res.json({ success: true, folderPath });
    } catch (error) {
        console.error('Ошибка создания папки:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.message || error.message 
        });
    }
});

// Получение ссылки для загрузки файла
app.get('/api/upload-url', async (req, res) => {
    const { folderPath, fileName } = req.query;
    if (!folderPath || !fileName) {
        return res.status(400).json({ success: false, error: 'Путь папки и имя файла обязательны' });
    }

    try {
        const filePath = `${folderPath}/${fileName}`;
        const response = await axios.get(`https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`, {
            headers: {
                'Authorization': `OAuth ${YANDEX_TOKEN}`
            }
        });

        res.json({ success: true, uploadUrl: response.data.href });
    } catch (error) {
        console.error('Ошибка получения URL для загрузки:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.message || error.message 
        });
    }
});

// Загрузка файла на Яндекс.Диск и добавление его в БД как изображение
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'Файл не выбран' });
    }

    const { folderPath, entityType, entityId } = req.body;
    if (!folderPath) {
        return res.status(400).json({ success: false, error: 'Путь папки обязателен' });
    }

    try {
        // Получение ссылки для загрузки
        const fileName = req.file.originalname;
        const filePath = `${folderPath}/${fileName}`;
        
        const uploadUrlResponse = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );

        const uploadUrl = uploadUrlResponse.data.href;

        // Загрузка файла
        const fileData = fs.readFileSync(req.file.path);
        
        await axios.put(uploadUrl, fileData, {
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        });

        // Удаление временного файла
        fs.unlinkSync(req.file.path);

        // Получение публичной ссылки
        let publicUrl = null;
        try {
            await axios.put(
                `https://cloud-api.yandex.net/v1/disk/resources/publish?path=${encodeURIComponent(filePath)}`,
                null,
                {
                    headers: {
                        'Authorization': `OAuth ${YANDEX_TOKEN}`
                    }
                }
            );

            // Получение информации о файле для получения публичной ссылки
            const fileInfoResponse = await axios.get(
                `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(filePath)}`,
                {
                    headers: {
                        'Authorization': `OAuth ${YANDEX_TOKEN}`
                    }
                }
            );

            publicUrl = fileInfoResponse.data.public_url;
            
            // Если указан тип и ID сущности, добавляем изображение в БД
            if (entityType && entityId && publicUrl) {
                const imageData = {
                    url: publicUrl,
                    alt_text: fileName,
                    title: fileName,
                    entity_type: entityType,
                    entity_id: entityId,
                    sort_order: 0
                };
                
                const imageId = await db.insert('images', imageData);
                console.log(`Изображение добавлено в БД с ID: ${imageId}`);
            }
            
        } catch (error) {
            console.error('Ошибка публикации файла:', error.response?.data || error.message);
        }

        res.json({ success: true, filePath, publicUrl });
    } catch (error) {
        console.error('Ошибка загрузки файла:', error.response?.data || error.message);
        // Удаление временного файла в случае ошибки
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.message || error.message 
        });
    }
});

// API для создания нового проекта
app.post('/api/db/projects', upload.any(), async (req, res) => {
    console.log('\n=== НАЧАЛО СОЗДАНИЯ ПРОЕКТА ===');
    console.log('Время:', new Date().toISOString());
    console.log('req.body:', req.body);
    console.log('req.files:', req.files ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, size: f.size })) : 'нет файлов');
    
    try {
        const { title, type, description, area, location, year, status, contentBlocks } = req.body;
        
        // Валидация обязательных полей
        if (!title) {
            return res.status(400).json({
                success: false,
                error: 'Название проекта обязательно'
            });
        }
        
        console.log('Создание проекта:', { title, type, area, location, year, status });
        console.log('Полученные файлы:', req.files ? req.files.length : 0);
        
        // Генерируем slug из заголовка
        let slug = transliterate(title);
        
        // Проверяем уникальность slug
        const existingSlug = await db.getOne('SELECT id FROM projects WHERE slug = ?', [slug]);
        if (existingSlug) {
            // Добавляем случайный суффикс для уникальности
            const suffix = Math.random().toString(36).substring(2, 8);
            slug = `${slug}-${suffix}`;
        }
        
        console.log('Сгенерированный slug:', slug);
        
        // Создаем проект в базе данных с правильными полями согласно структуре БД
        const projectData = {
            title: title,
            slug: slug,
            description: description || null, // Исходные данные проекта из формы
            project_type: type || null, // Используем новое поле project_type для типа проекта
            location: location || null,
            year_completed: year || null, // Правильное название поля в БД
            area: area ? parseFloat(area) : null,
            status: status === 'published' ? 'published' : 'draft',
            path_to_file: null // Пока null, обновим после загрузки обложки
        };
        
        console.log('Данные для вставки в БД:', projectData);
        
        const projectId = await db.insert('projects', projectData);
        
        console.log('Проект создан с ID:', projectId);
        
        // Создаем папку для проекта
        const safeTitleForFolder = transliterate(title).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const projectFolderName = `project_${projectId}_${safeTitleForFolder}`;
        const projectFolderPath = path.join(__dirname, 'pic2', 'projects', projectFolderName);
        
        console.log('Создание папки проекта:', projectFolderPath);
        
        // Создаем папку если её нет
        const projectsDir = path.join(__dirname, 'pic2', 'projects');
        if (!fs.existsSync(projectsDir)) {
            console.log('Создаю папку projects:', projectsDir);
            fs.mkdirSync(projectsDir, { recursive: true });
        }
        
        if (!fs.existsSync(projectFolderPath)) {
            console.log('Создаю папку проекта:', projectFolderPath);
            fs.mkdirSync(projectFolderPath, { recursive: true });
            console.log('Папка проекта создана успешно');
        } else {
            console.log('Папка проекта уже существует');
        }
        
        let coverImagePath = null;
        
        // Обрабатываем обложку проекта
        const coverImage = req.files?.find(file => file.fieldname === 'coverImage');
        console.log('Обложка найдена в файлах:', !!coverImage);
        
        if (coverImage) {
            console.log('Обрабатываю обложку:', coverImage.originalname);
            const coverFileName = createSafeFileName(coverImage.originalname, 'cover_');
            const coverFilePath = path.join(projectFolderPath, coverFileName);
            
            fs.writeFileSync(coverFilePath, coverImage.buffer);
            coverImagePath = `/pic2/projects/${projectFolderName}/${coverFileName}`;
            
            console.log('Сохранена обложка:', coverImagePath);
            
            // Обновляем путь к обложке в проекте (используем правильное поле path_to_file)
            await db.update('projects', { path_to_file: coverImagePath }, 'id = ?', [projectId]);
            console.log('Обновлен путь к обложке в БД');
        }
        
        // Обрабатываем блоки контента и сохраняем их в БД
        if (contentBlocks) {
            let blocks;
            try {
                blocks = JSON.parse(contentBlocks);
                console.log('Обработка блоков контента:', blocks.length);
            } catch (e) {
                console.log('Ошибка парсинга блоков контента:', e.message);
                blocks = [];
            }
            
            for (const block of blocks) {
                let imagePath = null;
                let imagePath2 = null;
                
                console.log(`Обрабатываю блок ${block.order}: ${block.type}`);
                
                // Обрабатываем изображения в блоке
                if (block.type === 'image' && block.imageIndex !== undefined) {
                    const imageFile = req.files?.find(file => file.fieldname === `blockImage_${block.imageIndex}`);
                    if (imageFile) {
                        const fileName = createSafeFileName(imageFile.originalname, `block_${block.order}_`);
                        const filePath = path.join(projectFolderPath, fileName);
                        
                        fs.writeFileSync(filePath, imageFile.buffer);
                        imagePath = `/pic2/projects/${projectFolderName}/${fileName}`;
                        
                        console.log('Сохранено изображение блока:', imagePath);
                    }
                } else if (block.type === 'two_images') {
                    // Обрабатываем левое изображение
                    if (block.imageIndexLeft !== undefined) {
                        const imageFileLeft = req.files?.find(file => file.fieldname === `blockImage_${block.imageIndexLeft}`);
                        if (imageFileLeft) {
                            const fileName = createSafeFileName(imageFileLeft.originalname, `block_${block.order}_left_`);
                            const filePath = path.join(projectFolderPath, fileName);
                            
                            fs.writeFileSync(filePath, imageFileLeft.buffer);
                            imagePath = `/pic2/projects/${projectFolderName}/${fileName}`;
                            console.log('Сохранено левое изображение блока:', imagePath);
                        }
                    }
                    
                    // Обрабатываем правое изображение
                    if (block.imageIndexRight !== undefined) {
                        const imageFileRight = req.files?.find(file => file.fieldname === `blockImage_${block.imageIndexRight}`);
                        if (imageFileRight) {
                            const fileName = createSafeFileName(imageFileRight.originalname, `block_${block.order}_right_`);
                            const filePath = path.join(projectFolderPath, fileName);
                            
                            fs.writeFileSync(filePath, imageFileRight.buffer);
                            imagePath2 = `/pic2/projects/${projectFolderName}/${fileName}`;
                            console.log('Сохранено правое изображение блока:', imagePath2);
                        }
                    }
                } else if (block.type === 'image_text' || block.type === 'text_image') {
                    if (block.imageIndex !== undefined) {
                        const imageFile = req.files?.find(file => file.fieldname === `blockImage_${block.imageIndex}`);
                        if (imageFile) {
                            const fileName = createSafeFileName(imageFile.originalname, `block_${block.order}_`);
                            const filePath = path.join(projectFolderPath, fileName);
                            
                            fs.writeFileSync(filePath, imageFile.buffer);
                            imagePath = `/pic2/projects/${projectFolderName}/${fileName}`;
                            console.log('Сохранено изображение комбинированного блока:', imagePath);
                        }
                    }
                }
                
                // Сохраняем блок контента в БД (используем таблицу project_content_blocks)
                try {
                    const blockData = {
                        project_id: projectId,
                        block_type: block.type,
                        content: block.content || null,
                        image_path: imagePath,
                        image_path_2: imagePath2,
                        image_alt: block.captionLeft || block.caption || null,
                        image_alt_2: block.captionRight || null,
                        caption: block.captionLeft || block.caption || null,
                        sort_order: block.order || 0
                    };
                    
                    const blockId = await db.insert('project_content_blocks', blockData);
                    console.log(`Блок ${block.type} сохранен в БД с ID: ${blockId}`);
                } catch (blockError) {
                    console.error(`Ошибка сохранения блока ${block.order}:`, blockError.message);
                }
            }
        }
        
        res.json({
            success: true,
            message: 'Проект успешно создан',
            projectId: projectId,
            folderPath: projectFolderName
        });
        
    } catch (error) {
        console.error('\n=== ОШИБКА СОЗДАНИЯ ПРОЕКТА ===');
        console.error('Время:', new Date().toISOString());
        console.error('Тип ошибки:', error.constructor.name);
        console.error('Сообщение:', error.message);
        console.error('Стек:', error.stack);
        console.error('=== КОНЕЦ ОШИБКИ ===\n');
        
        // Убеждаемся что возвращаем JSON
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message || 'Внутренняя ошибка сервера'
            });
        }
    }
});

// API для получения проекта по ID
app.get('/api/db/projects/:id', async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        
        // Валидация ID проекта
        if (!projectId || isNaN(projectId)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID проекта'
            });
        }
        
        // Получаем данные проекта
        const project = await db.getOne('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Проект не найден'
            });
        }
        
        // Получаем блоки контента проекта
        const contentBlocks = await db.getAll(
            'SELECT * FROM project_content_blocks WHERE project_id = ? ORDER BY sort_order ASC',
            [projectId]
        );
        
        res.json({
            success: true,
            project: {
                ...project,
                contentBlocks: contentBlocks
            }
        });
        
    } catch (error) {
        console.error('Ошибка получения проекта:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения проекта: ' + error.message
        });
    }
});

// API для обновления проекта
app.put('/api/db/projects/:id', upload.any(), async (req, res) => {
    console.log('\n=== НАЧАЛО ОБНОВЛЕНИЯ ПРОЕКТА ===');
    console.log('Время:', new Date().toISOString());
    console.log('Project ID:', req.params.id);
    console.log('req.body:', req.body);
    console.log('req.files:', req.files ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, size: f.size })) : 'нет файлов');
    
    try {
        const projectId = parseInt(req.params.id);
        const { title, type, description, area, location, year, status, contentBlocks } = req.body;
        
        // Валидация ID проекта
        if (!projectId || isNaN(projectId)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный ID проекта'
            });
        }
        
        // Проверяем, существует ли проект
        const existingProject = await db.getOne('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                error: 'Проект не найден'
            });
        }
        
        // Валидация обязательных полей
        if (!title) {
            return res.status(400).json({
                success: false,
                error: 'Название проекта обязательно'
            });
        }
        
        console.log('Обновление проекта:', { title, type, area, location, year, status });
        console.log('Существующий проект:', existingProject.title);
        
        // Генерируем новый slug из заголовка если название изменилось
        let slug = existingProject.slug;
        if (title !== existingProject.title) {
            slug = transliterate(title);
            
            // Проверяем уникальность slug (исключая текущий проект)
            const existingSlug = await db.getOne('SELECT id FROM projects WHERE slug = ? AND id != ?', [slug, projectId]);
            if (existingSlug) {
                // Добавляем случайный суффикс для уникальности
                const suffix = Math.random().toString(36).substring(2, 8);
                slug = `${slug}-${suffix}`;
            }
        }
        
        console.log('Slug проекта:', slug);
        
        // Получаем информацию о папке проекта
        const safeTitleForFolder = transliterate(existingProject.title).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const projectFolderName = `project_${projectId}_${safeTitleForFolder}`;
        const projectFolderPath = path.join(__dirname, 'pic2', 'projects', projectFolderName);
        
        // Создаем папку проекта если её нет
        if (!fs.existsSync(projectFolderPath)) {
            console.log('Создаю папку проекта:', projectFolderPath);
            fs.mkdirSync(projectFolderPath, { recursive: true });
        }
        
        // Обновляем основные данные проекта
        const projectData = {
            title: title,
            slug: slug,
            description: description || null,
            project_type: type || null,
            location: location || null,
            year_completed: year || null,
            area: area ? parseFloat(area) : null,
            status: status === 'published' ? 'published' : 'draft'
        };
        
        console.log('Данные для обновления в БД:', projectData);
        
        // Обрабатываем обложку проекта если загружена новая
        const coverImage = req.files?.find(file => file.fieldname === 'coverImage');
        if (coverImage) {
            console.log('Обрабатываю новую обложку:', coverImage.originalname);
            const coverFileName = createSafeFileName(coverImage.originalname, 'cover_');
            const coverFilePath = path.join(projectFolderPath, coverFileName);
            
            // Удаляем старую обложку если есть
            if (existingProject.path_to_file) {
                const oldCoverPath = path.join(__dirname, existingProject.path_to_file.replace(/^\//, ''));
                if (fs.existsSync(oldCoverPath)) {
                    console.log('Удаляю старую обложку:', oldCoverPath);
                    fs.unlinkSync(oldCoverPath);
                }
            }
            
            fs.writeFileSync(coverFilePath, coverImage.buffer);
            projectData.path_to_file = `/pic2/projects/${projectFolderName}/${coverFileName}`;
            
            console.log('Сохранена новая обложка:', projectData.path_to_file);
        }
        
        // Обновляем проект в базе данных
        await db.update('projects', projectData, 'id = ?', [projectId]);
        console.log('Проект обновлен в БД');
        
        // Обрабатываем блоки контента
        if (contentBlocks) {
            let blocks;
            try {
                blocks = JSON.parse(contentBlocks);
                console.log('Обработка блоков контента:', blocks.length);
            } catch (e) {
                console.log('Ошибка парсинга блоков контента:', e.message);
                blocks = [];
            }
            
            // Получаем существующие блоки контента для сохранения путей к изображениям
            console.log('Получение существующих блоков контента...');
            const existingBlocks = await db.query(
                'SELECT * FROM project_content_blocks WHERE project_id = ? ORDER BY sort_order',
                [projectId]
            );
            
            // Создаем карту существующих изображений по ID блока
            const existingImages = {};
            existingBlocks.forEach(block => {
                existingImages[block.id] = {
                    image_path: block.image_path,
                    image_path_2: block.image_path_2,
                    image_alt: block.image_alt,
                    image_alt_2: block.image_alt_2,
                    caption: block.caption
                };
            });
            
            console.log('Найдено существующих блоков:', existingBlocks.length);
            
            // Удаляем все существующие блоки контента проекта
            console.log('Удаление существующих блоков контента...');
            await db.query('DELETE FROM project_content_blocks WHERE project_id = ?', [projectId]);
            
            // Добавляем новые блоки контента
            for (const block of blocks) {
                let imagePath = null;
                let imagePath2 = null;
                
                console.log(`Обрабатываю блок ${block.order}: ${block.type}`);
                
                // Получаем существующие изображения для этого блока по ID (если блок существующий)
                const existingImageData = block.existingBlockId ? existingImages[block.existingBlockId] : null;
                
                // Обрабатываем изображения в блоке
                if (block.type === 'image') {
                    // Проверяем, есть ли новое изображение
                    if (block.imageIndex !== undefined) {
                        const imageFile = req.files?.find(file => file.fieldname === `blockImage_${block.imageIndex}`);
                        if (imageFile) {
                            const fileName = createSafeFileName(imageFile.originalname, `block_${block.order}_`);
                            const filePath = path.join(projectFolderPath, fileName);
                            
                            fs.writeFileSync(filePath, imageFile.buffer);
                            imagePath = `/pic2/projects/${projectFolderName}/${fileName}`;
                            
                            console.log('Сохранено новое изображение блока:', imagePath);
                        }
                    }
                    
                    // Если нет нового изображения, используем существующее из клиентской части
                    if (!imagePath && block.existingImagePath) {
                        imagePath = block.existingImagePath;
                        console.log('Используется существующее изображение из клиента:', imagePath);
                    }
                    // Если нет пути от клиента, используем данные из БД
                    if (!imagePath && existingImageData && existingImageData.image_path) {
                        imagePath = existingImageData.image_path;
                        console.log('Используется существующее изображение из БД:', imagePath);
                    }
                    
                } else if (block.type === 'two_images') {
                    // Обрабатываем левое изображение
                    if (block.imageIndexLeft !== undefined) {
                        const imageFileLeft = req.files?.find(file => file.fieldname === `blockImage_${block.imageIndexLeft}`);
                        if (imageFileLeft) {
                            const fileName = createSafeFileName(imageFileLeft.originalname, `block_${block.order}_left_`);
                            const filePath = path.join(projectFolderPath, fileName);
                            
                            fs.writeFileSync(filePath, imageFileLeft.buffer);
                            imagePath = `/pic2/projects/${projectFolderName}/${fileName}`;
                            console.log('Сохранено новое левое изображение блока:', imagePath);
                        }
                    }
                    
                    // Обрабатываем правое изображение
                    if (block.imageIndexRight !== undefined) {
                        const imageFileRight = req.files?.find(file => file.fieldname === `blockImage_${block.imageIndexRight}`);
                        if (imageFileRight) {
                            const fileName = createSafeFileName(imageFileRight.originalname, `block_${block.order}_right_`);
                            const filePath = path.join(projectFolderPath, fileName);
                            
                            fs.writeFileSync(filePath, imageFileRight.buffer);
                            imagePath2 = `/pic2/projects/${projectFolderName}/${fileName}`;
                            console.log('Сохранено новое правое изображение блока:', imagePath2);
                        }
                    }
                    
                    // Если нет новых изображений, используем существующие из клиентской части
                    if (!imagePath && block.existingImagePathLeft) {
                        imagePath = block.existingImagePathLeft;
                        console.log('Используется существующее левое изображение из клиента:', imagePath);
                    }
                    // Если нет пути от клиента, используем данные из БД
                    if (!imagePath && existingImageData && existingImageData.image_path) {
                        imagePath = existingImageData.image_path;
                        console.log('Используется существующее левое изображение из БД:', imagePath);
                    }
                    
                    if (!imagePath2 && block.existingImagePathRight) {
                        imagePath2 = block.existingImagePathRight;
                        console.log('Используется существующее правое изображение из клиента:', imagePath2);
                    }
                    // Если нет пути от клиента, используем данные из БД
                    if (!imagePath2 && existingImageData && existingImageData.image_path_2) {
                        imagePath2 = existingImageData.image_path_2;
                        console.log('Используется существующее правое изображение из БД:', imagePath2);
                    }
                    
                } else if (block.type === 'image_text' || block.type === 'text_image') {
                    // Проверяем, есть ли новое изображение
                    if (block.imageIndex !== undefined) {
                        const imageFile = req.files?.find(file => file.fieldname === `blockImage_${block.imageIndex}`);
                        if (imageFile) {
                            const fileName = createSafeFileName(imageFile.originalname, `block_${block.order}_`);
                            const filePath = path.join(projectFolderPath, fileName);
                            
                            fs.writeFileSync(filePath, imageFile.buffer);
                            imagePath = `/pic2/projects/${projectFolderName}/${fileName}`;
                            console.log('Сохранено новое изображение комбинированного блока:', imagePath);
                        }
                    }
                    
                    // Если нет нового изображения, используем существующее из клиентской части
                    if (!imagePath && block.existingImagePath) {
                        imagePath = block.existingImagePath;
                        console.log('Используется существующее изображение комбинированного блока из клиента:', imagePath);
                    }
                    // Если нет пути от клиента, используем данные из БД
                    if (!imagePath && existingImageData && existingImageData.image_path) {
                        imagePath = existingImageData.image_path;
                        console.log('Используется существующее изображение комбинированного блока из БД:', imagePath);
                    }
                }
                
                // Сохраняем блок контента в БД
                try {
                    const blockData = {
                        project_id: projectId,
                        block_type: block.type,
                        content: block.content || null,
                        image_path: imagePath,
                        image_path_2: imagePath2,
                        image_alt: block.captionLeft || block.caption || null,
                        image_alt_2: block.captionRight || null,
                        caption: block.captionLeft || block.caption || null,
                        sort_order: block.order || 0
                    };
                    
                    console.log(`💾 Сохранение блока ${block.order} (${block.type}) в БД:`);
                    console.log('   - image_path:', imagePath);
                    console.log('   - image_path_2:', imagePath2);
                    console.log('   - caption:', block.captionLeft || block.caption || null);
                    
                    const blockId = await db.insert('project_content_blocks', blockData);
                    console.log(` Блок ${block.type} сохранен в БД с ID: ${blockId}`);
                } catch (blockError) {
                    console.error(` Ошибка сохранения блока ${block.order}:`, blockError.message);
                }
            }
        }
        
        res.json({
            success: true,
            message: 'Проект успешно обновлен',
            projectId: projectId
        });
        
    } catch (error) {
        console.error('\n=== ОШИБКА ОБНОВЛЕНИЯ ПРОЕКТА ===');
        console.error('Время:', new Date().toISOString());
        console.error('Тип ошибки:', error.constructor.name);
        console.error('Сообщение:', error.message);
        console.error('Стек:', error.stack);
        
        res.status(500).json({
            success: false,
            error: 'Ошибка обновления проекта: ' + error.message
        });
    }
});

// API endpoint для Interior Design с использованием Replicate adirik/interior-design
app.post('/api/interior-design-replicate', upload.single('image'), async (req, res) => {
    console.log('\n === INTERIOR DESIGN REPLICATE (adirik/interior-design) ===');
    console.log('Время запроса:', new Date().toISOString());
    console.log('IP клиента:', req.ip || req.connection.remoteAddress);
    
    try {
        console.log(' Проверяем входные данные...');
        console.log('req.body:', req.body);
        console.log('req.file:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : 'НЕТ ФАЙЛА');
        
        if (!req.file) {
            console.log(' Файл не загружен');
            return res.status(400).json({ 
                success: false, 
                error: 'Изображение не загружено' 
            });
        }

        const { style, prompt, negative_prompt } = req.body;
        
        if (!style || !prompt) {
            console.log(' Отсутствуют обязательные параметры:', { style, prompt });
            return res.status(400).json({ 
                success: false, 
                error: 'Стиль и описание обязательны' 
            });
        }

        console.log(' Валидация пройдена');
        console.log(' Параметры запроса:', { 
            style, 
            prompt, 
            negative_prompt,
            fileSize: req.file.size,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype
        });

        // Функция нейроперевода с русского на английский через Replicate ALMA-7B
        async function translateRussianToEnglishAI(text) {
            if (!text || text.trim() === '') return '';
            
            try {
                console.log('🤖 Запуск нейроперевода для:', text);
                
                // Проверяем, есть ли русские символы в тексте
                const hasRussian = /[а-яё]/i.test(text);
                if (!hasRussian) {
                    console.log('🌐 Текст уже на английском, пропускаем перевод');
                    return text;
                }
                
                const translationOutput = await replicate.run(
                    "meta/meta-llama-3-8b-instruct",
                    {
                        input: {
                            prompt: `Translate the following Russian text to English. Only provide the English translation, nothing else:\n\n${text}`,
                            max_tokens: 100,
                            temperature: 0.1,
                            top_p: 0.9
                        }
                    }
                );
                
                // Обрабатываем ответ модели (может быть массивом строк)
                let translatedText = '';
                if (Array.isArray(translationOutput)) {
                    translatedText = translationOutput.join('').trim();
                } else {
                    translatedText = String(translationOutput).trim();
                }
                
                // Очищаем перевод от лишних символов и повторов исходного промта
                translatedText = translatedText
                    .replace(/^.*English:\s*/i, '') // убираем возможный префикс
                    .replace(/Russian:.*$/i, '') // убираем если повторился исходник
                    .replace(/\n.*$/s, '') // берем только первую строку
                    .trim();
                
                console.log('🌐 Нейроперевод завершен:', translatedText);
                return translatedText || text; // если перевод пустой, возвращаем оригинал
                
            } catch (error) {
                console.error(' Ошибка нейроперевода:', error.message);
                console.log(' Используем базовый словарный перевод как fallback');
                
                // Fallback к базовому переводу
                return translateBasicRussianToEnglish(text);
            }
        }

        // Функция базового перевода как fallback
        function translateBasicRussianToEnglish(text) {
            if (!text) return '';
            
            const translations = {
                'стул': 'chair', 'стол': 'table', 'диван': 'sofa', 'кровать': 'bed',
                'красный': 'red', 'красная': 'red', 'синий': 'blue', 'синяя': 'blue',
                'подсветка': 'lighting', 'свет': 'light', 'освещение': 'lighting',
                'по центру': 'in the center', 'комната': 'room', 'стена': 'wall', 'стены': 'walls', 'стен': 'walls'
            };
            
            let translatedText = text.toLowerCase();
            for (const [russian, english] of Object.entries(translations)) {
                const regex = new RegExp(russian, 'gi');
                translatedText = translatedText.replace(regex, english);
            }
            
            return translatedText;
        }

        // Инициализируем Replicate SDK
        const Replicate = require('replicate');
        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN
        });

        // Перевод промта с помощью нейросети
        console.log('🌐 Исходный промт:', prompt);
        const translatedPrompt = await translateRussianToEnglishAI(prompt);
        const translatedNegativePrompt = negative_prompt ? await translateRussianToEnglishAI(negative_prompt) : '';
        
        console.log('🌐 Переведенный промт:', translatedPrompt);

        // Карта стилей для интеграции в промт
        const styleMap = {
            'minimalist': 'minimalist style, clean lines, neutral colors, simple furniture, uncluttered space',
            'scandinavian': 'scandinavian style, light wood, white walls, cozy textiles, natural materials, hygge atmosphere',
            'industrial': 'industrial style, raw materials, exposed pipes, concrete walls, metal accents, urban loft feeling',
            'loft': 'loft style, industrial design, exposed brick walls, metal fixtures, high ceilings, urban atmosphere',
            'modern': 'modern style, contemporary furniture, geometric shapes, bold colors, innovative design',
            'contemporary': 'contemporary style, current trends, sleek lines, neutral palette, functional design',
            'classic': 'classic style, elegant furniture, ornate details, rich fabrics, traditional design, timeless appeal',
            'neoclassic': 'neoclassic style, refined elegance, marble accents, classical proportions, luxury finishes',
            'provence': 'provence style, french country, pastel colors, floral patterns, vintage furniture, rustic charm',
            'art-deco': 'art deco style, geometric patterns, metallic accents, bold colors, glamorous details, 1920s elegance',
            'vintage': 'vintage style, retro furniture, aged patina, antique accessories, nostalgic atmosphere',
            'japanese': 'japanese style, minimalist design, natural materials, zen aesthetics, clean lines, harmony',
            'high-tech': 'high-tech style, futuristic design, metallic surfaces, advanced technology, sleek appearance',
            'rustic': 'rustic style, wooden furniture, natural textures, earthy colors, countryside feel, cozy atmosphere',
            'mediterranean': 'mediterranean style, warm colors, natural stone, terracotta tiles, coastal influence, relaxed atmosphere',
            'boho': 'bohemian style, vibrant colors, layered textiles, artistic elements, free-spirited decor, eclectic mix',
            'eclectic': 'eclectic style, mixed patterns, colorful decor, unique accessories, creative combinations',
            'tropical': 'tropical style, bright colors, natural materials, palm motifs, beach house feel, relaxed vibe',
            'coastal': 'coastal style, light blues, white accents, nautical elements, beachy atmosphere, relaxed mood',
            'mid-century': 'mid-century modern style, retro furniture, warm woods, clean lines, 1950s-60s aesthetic'
        };

        // Формируем итоговый промт с учетом стиля
        const styleDescription = styleMap[style] || style;
        const finalPrompt = `${styleDescription}, ${translatedPrompt}`;
        
        console.log('🎨 Финальный промт с стилем:', finalPrompt);

        // Конвертируем изображение в data URL
        const base64Image = req.file.buffer.toString('base64');
        const imageDataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
        console.log('🖼️ Изображение конвертировано в data URL, размер:', base64Image.length);

        // Подготавливаем данные для Replicate API
        console.log('🤖 Отправляем запрос к Replicate API...');
        console.log('📝 Параметры для модели:');
        console.log('   - Промт:', finalPrompt);
        console.log('   - Негативный промт:', translatedNegativePrompt || "low quality, blurry, distorted, cluttered, messy, poor lighting, old furniture, outdated design");
        console.log('   - Guidance Scale:', 12.0);
        console.log('   - Prompt Strength:', 1.0);
        console.log('   - Inference Steps:', 30);
        
        const output = await replicate.run(
            "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
            {
                input: {
                    image: imageDataUrl,
                    prompt: finalPrompt,
                    negative_prompt: translatedNegativePrompt || "low quality, blurry, distorted, cluttered, messy, poor lighting, old furniture, outdated design",
                    num_inference_steps: 30,
                    guidance_scale: 12.0,
                    prompt_strength: 1.0,
                    seed: Math.floor(Math.random() * 1000000)
                }
            }
        );

        console.log('✅ Генерация завершена успешно');
        console.log('🖼️ Результат:', output);
        
        // Получаем URL изображения
        const outputImageUrl = output;
        
        // Скачиваем изображение и конвертируем в base64
        let editedImageBase64;
        try {
            const imageResponse = await axios.get(outputImageUrl, { responseType: 'arraybuffer' });
            editedImageBase64 = Buffer.from(imageResponse.data).toString('base64');
            console.log('✅ Изображение скачано и конвертировано в base64');
        } catch (downloadError) {
            console.log('⚠️ Не удалось скачать изображение, используем URL:', downloadError.message);
            editedImageBase64 = null;
        }
        
        res.json({
            success: true,
            message: 'Дизайн интерьера успешно изменен с помощью adirik/interior-design',
            originalImage: `data:image/jpeg;base64,${base64Image}`,
            editedImage: editedImageBase64 ? `data:image/png;base64,${editedImageBase64}` : outputImageUrl,
            editedImageUrl: outputImageUrl,
            style: style,
            originalPrompt: prompt,
            translatedPrompt: translatedPrompt,
            finalPrompt: finalPrompt,
            negative_prompt: negative_prompt,
            translatedNegativePrompt: translatedNegativePrompt,
            model: 'adirik/interior-design',
            provider: 'Replicate SDK',
            processingTime: 'auto' // SDK автоматически ждет завершения
        });

    } catch (error) {
        console.error('\n❌ === КРИТИЧЕСКАЯ ОШИБКА INTERIOR DESIGN ===');
        console.error('Время:', new Date().toISOString());
        console.error('Ошибка:', error.message);
        console.error('Стек:', error.stack);
        
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Отображение HTML страниц

// Страница входа в админ-панель
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin_login.html'));
});

// Админ-панель с проверкой авторизации
app.get('/admin', (req, res) => {
    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!req.session || !req.session.isAuthenticated) {
        return res.redirect('/admin/login');
    }
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Страница "О нас"
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

// Тестовая страница
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// Тестовая страница для статей
app.get('/test_simple_article.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_simple_article.html'));
});

// Продвинутая тестовая страница для статей с блоками
app.get('/test_advanced_article.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_advanced_article.html'));
});

// Тестовая страница для создания администраторов
app.get('/test_admin_create.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_admin_create.html'));
});

// Тестовая страница для создания проектов
app.get('/test_project_creation.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_project_creation.html'));
});

// Тестовая страница для блоков проекта
app.get('/test_project_blocks.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_project_blocks.html'));
});

// Тестовая страница для Interior Design
app.get('/test_interior_design.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_interior_design.html'));
});

// Простая тестовая страница для загрузки изображений
app.get('/test_simple_upload.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_simple_upload.html'));
});

// Маршруты для тестовых страниц
app.get('/test_image_blocks.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_image_blocks.html'));
});

// Отладочная страница для изображений статей
app.get('/test_images_debug.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_images_debug.html'));
});

// Запуск сервера
app.listen(PORT, async () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📋 Админ-панель: http://localhost:${PORT}/admin`);
    console.log(`🏠 Главная страница: http://localhost:${PORT}`);
    console.log(`🧪 Тестовые страницы:`);
    console.log(`   - http://localhost:${PORT}/test_simple_article.html`);
    console.log(`   - http://localhost:${PORT}/test_advanced_article.html`);
    console.log(`   - http://localhost:${PORT}/test_image_blocks.html`);
    console.log(`   - http://localhost:${PORT}/test_admin_create.html`);
    console.log(`   - http://localhost:${PORT}/test_project_creation.html`);
    console.log(`   - http://localhost:${PORT}/test_simple_upload.html`);
    console.log(`   - http://localhost:${PORT}/test_interior_design.html 🏠 НОВОЕ!`);
    
    // Проверяем подключение к БД
    try {
        const isConnected = await db.testConnection();
        if (isConnected) {
            console.log('✅ База данных подключена');
        } else {
            console.error('❌ Нет подключения к базе данных');
        }
    } catch (error) {
        console.error('❌ Ошибка проверки БД:', error.message);
    }
    
    console.log('\n🎯 Сервер готов к работе!\n');
});