const mysql = require('mysql2/promise');
const moment = require('moment');
const dotenv = require('dotenv');
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');

// Определяем путь к корню проекта
const projectRoot = '/var/www/html';
const envPath = path.join(projectRoot, '.env');

console.log('Путь к .env файлу:', envPath);
console.log('Файл существует:', fs.existsSync(envPath));

// Загружаем переменные окружения из .env файла
dotenv.config({ path: envPath });

// Проверка загрузки переменных окружения
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_DATABASE:', process.env.DB_DATABASE);

// Конфигурация подключения к MySQL
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'dmitry',
  database: process.env.DB_DATABASE || 'dmitry',
};

console.log('DB Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

// Инициализация бота Telegram
const botToken = process.env.TELEGRAM_BOT_TOKEN || '7224607757:AAEq4qW8ugEnZ99Fkgzh7B-1FtCv_r1mN-E';
const bot = new Telegraf(botToken);

// Функция для проверки завершенных сделок


// Функция для ежедневного начисления прибыли для сделок с типом "percent"
async function dailyPercentAccruals() {
  let connection;
  
  try {
    // Подключение к базе данных
    connection = await mysql.createConnection(dbConfig);
    
    // Получаем текущее время
    const now = moment().utc();
    console.log(`Текущее время UTC: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
    
    // Проверяем, что сейчас 10:00 UTC (с погрешностью в несколько минут для надежности)
    const currentHour = now.hour();
    const currentMinute = now.minute();
    
    if (!(currentHour === 10 && currentMinute < 5)) {
      console.log('Сейчас не 10:00 UTC, пропускаем начисление процентов');
      return;
    }
    
    // Получаем все активные сделки с типом "percent"
    const [deals] = await connection.execute(`
      SELECT d.* 
      FROM deals d
      JOIN bundles b ON d.bundle_id = b.id
      WHERE d.status = "active" AND b.type = "percent"
    `);
    
    console.log(`Найдено ${deals.length} активных сделок с типом "percent"`);
    
    // Обрабатываем каждую сделку
    for (const deal of deals) {
      try {
        // Получаем информацию о связке (bundle)
        const [bundles] = await connection.execute(
          'SELECT * FROM bundles WHERE id = ?',
          [deal.bundle_id]
        );
        
        const bundle = bundles[0];
        
        if (!bundle) {
          console.error(`Связка с ID ${deal.bundle_id} не найдена для сделки ${deal.id}`);
          continue;
        }
        
        // Рассчитываем дневную прибыль (income_percent / 100 * amount)
        const dailyProfit = (parseFloat(bundle.income_percent) / 100) * parseFloat(deal.amount);
        const roundedDailyProfit = parseFloat(dailyProfit.toFixed(2));
        
        // Обновляем общую прибыль сделки
        const newProfit = parseFloat(deal.profit) + roundedDailyProfit;
        
        // Обновляем запись в базе данных
        await connection.execute(
          'UPDATE deals SET profit = ? WHERE id = ?',
          [newProfit, deal.id]
        );
        
        // Отправляем уведомление пользователю
        await bot.telegram.sendMessage(
          deal.user_id,
          `💰 Ежедневное начисление прибыли!\n\n` +
          `📊 Инвестиция: ${deal.amount} USDT\n` +
          `✅ Начислено: ${roundedDailyProfit} USDT\n` +
          `💵 Общая прибыль: ${newProfit} USDT`
        );
        
        console.log(`Начислена прибыль ${roundedDailyProfit} USDT для сделки ${deal.id} пользователя ${deal.user_id}`);
        
      } catch (error) {
        console.error(`Ошибка при обработке сделки ${deal.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Ошибка при начислении ежедневной прибыли:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

function checkTimeAndRunAccruals() {
  dailyPercentAccruals();
}

setInterval(checkTimeAndRunAccruals, 1200000);

checkTimeAndRunAccruals();

console.log('Скрипт проверки завершенных сделок и начисления процентов запущен');
