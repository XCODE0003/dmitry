const mysql = require('mysql2/promise');
const moment = require('moment');
const dotenv = require('dotenv');
const { Telegraf } = require('telegraf');
const path = require('path');

// Загружаем переменные окружения из .env файла
dotenv.config({ path: '../../.env' });

// Инициализация бота Telegram
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Конфигурация подключения к MySQL
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// Функция для проверки завершенных сделок
async function checkCompletedDeals() {
  let connection;
  
  try {
    // Подключение к базе данных
    connection = await mysql.createConnection(dbConfig);
    
    // Получаем текущее время в формате UNIX timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // Получаем все активные сделки, у которых истек срок
    const [deals] = await connection.execute(
      'SELECT * FROM deals WHERE status = "active" AND date_end <= ? AND notify_send = 0',
      [currentTimestamp]
    );
    
    console.log(`Найдено ${deals.length} завершенных сделок`);
    
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
