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
async function checkCompletedDeals() {
  let connection;
  
  try {
    // Подключение к базе данных
    connection = await mysql.createConnection(dbConfig);
    
    // Получаем текущее время в формате UNIX timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // Получаем все активные сделки с типом "fixed", у которых истек срок
    const [deals] = await connection.execute(`
      SELECT d.* 
      FROM deals d
      JOIN bundles b ON d.bundle_id = b.id
      WHERE d.status = "active" 
        AND d.date_end <= ? 
        AND d.notify_send = 0
        AND b.type = "fixed"
    `, [currentTimestamp]);
    
    console.log(`Найдено ${deals.length} завершенных сделок с типом "fixed"`);
    
    // Обрабатываем каждую завершенную сделку
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
        
        // Отправляем уведомление пользователю
        await bot.telegram.sendMessage(
          deal.user_id,
          `✅ Ваша инвестиция завершена!\n\n` +
          `💰 Сумма инвестиции: ${deal.amount} USDT\n` +
          `💸 Прибыль: ${deal.profit} USDT\n` +
          `📊 Общая сумма: ${parseFloat(deal.amount) + parseFloat(deal.profit)} USDT\n\n` +
          `Чтобы вывести средства, перейдите в раздел "В работе" и нажмите кнопку "Вывести"`
        );

        await connection.execute(
          'UPDATE deals SET notify_send = 1 WHERE id = ?',
          [deal.id]
        );
        
        console.log(`Отправлено уведомление пользователю ${deal.user_id} о завершении сделки ${deal.id}`);
        
      } catch (error) {
        console.error(`Ошибка при обработке сделки ${deal.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Ошибка при проверке завершенных сделок:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Запускаем проверку каждую минуту
setInterval(checkCompletedDeals, 60000);

// Запускаем проверку сразу при старте скрипта
checkCompletedDeals();

console.log('Скрипт проверки завершенных сделок запущен');
