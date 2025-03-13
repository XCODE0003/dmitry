const mysql = require('mysql2/promise');
const moment = require('moment');
const dotenv = require('dotenv');
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

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
  let mongoClient;
  
  try {
    // Подключение к базе данных MySQL
    connection = await mysql.createConnection(dbConfig);
    
    // Получаем текущее время
    const now = moment().utc();
    console.log(`Текущее время UTC: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
    
    // Московское время (UTC+3)
    const mskTime = moment().utc().add(3, 'hours');
    console.log(`Текущее время МСК: ${mskTime.format('YYYY-MM-DD HH:mm:ss')}`);
    
    // Текущая дата в формате YYYY-MM-DD
    const currentDate = mskTime.format('YYYY-MM-DD');
    
    // Проверяем, что сейчас 7:00 по МСК (4:00 по UTC) с погрешностью в несколько минут
    const currentHour = now.hour();
    const currentMinute = now.minute();
    
    // Проверяем, было ли уже выполнено начисление сегодня
    const [lastAccrual] = await connection.execute(
      'SELECT * FROM accrual_logs WHERE date = ? LIMIT 1',
      [currentDate]
    );
    
    if (lastAccrual.length > 0) {
      console.log(`Начисление за ${currentDate} уже было выполнено в ${lastAccrual[0].created_at}`);
      return;
    }
    
    if (!(currentHour === 4 && currentMinute < 15)) {
      console.log('Сейчас не 7:00 по МСК (4:00 UTC), пропускаем начисление процентов');
      return;
    }
    
    console.log('Начинаем процесс начисления процентов (7:00 МСК)');
    
    // Получаем все активные сделки с типом "percent"
    const [deals] = await connection.execute(`
      SELECT d.* 
      FROM deals d
      JOIN bundles b ON d.bundle_id = b.id
      WHERE d.status = "active" AND b.type = "percent"
    `);
    
    console.log(`Найдено ${deals.length} активных сделок с типом "percent"`);
    
    if (deals.length === 0) {
      // Даже если нет сделок, записываем факт проверки
      await connection.execute(
        'INSERT INTO accrual_logs (date, deals_count, created_at) VALUES (?, ?, NOW())',
        [currentDate, 0]
      );
      console.log(`Нет активных сделок для начисления. Запись о проверке добавлена в лог.`);
      return;
    }
    
    // Подключение к MongoDB
    const mongoUri = process.env.MONGO_DB_DSN;
    console.log('MongoDB URI:', mongoUri);
    
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log('Подключение к MongoDB успешно установлено');
    
    const db = mongoClient.db(process.env.MONGO_DB_DATABASE);
    const usersCollection = db.collection('users');
    
    // Счетчики для логирования
    let successCount = 0;
    let errorCount = 0;
    let totalProfit = 0;
    
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
          errorCount++;
          continue;
        }
        
        // Рассчитываем дневную прибыль (income_percent / 100 * amount)
        const dailyProfit = (parseFloat(bundle.income_percent) / 100) * parseFloat(deal.amount);
        const roundedDailyProfit = parseFloat(dailyProfit.toFixed(2));
        totalProfit += roundedDailyProfit;
        
        // Обновляем общую прибыль сделки
        const newProfit = parseFloat(deal.profit) + roundedDailyProfit;
        
        // Обновляем запись в базе данных
        await connection.execute(
          'UPDATE deals SET profit = ? WHERE id = ?',
          [newProfit, deal.id]
        );
        
        // Добавляем прибыль к балансу пользователя в MongoDB
        const userId = parseInt(deal.user_id);
        console.log(`Обновление баланса для пользователя с ID: ${userId}`);
        
        const result = await usersCollection.updateOne(
          { id: userId },
          { $inc: { balance: roundedDailyProfit } }
        );
        
        console.log(`Обновлен баланс пользователя ${deal.user_id}: +${roundedDailyProfit} USDT, результат:`, 
          result.matchedCount ? 'Пользователь найден' : 'Пользователь не найден', 
          result.modifiedCount ? 'Баланс обновлен' : 'Баланс не обновлен'
        );
        
        // Отправляем уведомление пользователю
        // await bot.telegram.sendMessage(
        //   deal.user_id,
        //   `💰 Ежедневное начисление прибыли!\n\n` +
        //   `📊 Инвестиция: ${deal.amount} USDT\n` +
        //   `✅ Начислено: ${roundedDailyProfit} USDT\n` +
        //   `💵 Общая прибыль: ${newProfit} USDT\n\n` +
        //   `Прибыль автоматически добавлена на ваш баланс!`
        // );
        
        console.log(`Начислена прибыль ${roundedDailyProfit} USDT для сделки ${deal.id} пользователя ${deal.user_id}`);
        successCount++;
        
      } catch (error) {
        console.error(`Ошибка при обработке сделки ${deal.id}:`, error);
        errorCount++;
      }
    }
    
    // Записываем информацию о выполненном начислении
    await connection.execute(
      'INSERT INTO accrual_logs (date, deals_count, success_count, error_count, total_profit, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [currentDate, deals.length, successCount, errorCount, totalProfit]
    );
    
    console.log(`Начисление за ${currentDate} выполнено успешно. Обработано сделок: ${deals.length}, успешно: ${successCount}, с ошибками: ${errorCount}, общая прибыль: ${totalProfit} USDT`);
    
  } catch (error) {
    console.error('Ошибка при начислении ежедневной прибыли:', error);
  } finally {
    // Закрываем соединения
    if (connection) {
      await connection.end();
    }
    if (mongoClient) {
      await mongoClient.close();
      console.log('Соединение с MongoDB закрыто');
    }
  }
}

function checkTimeAndRunAccruals() {
  dailyPercentAccruals();
}

// Проверяем каждые 20 минут (1200000 мс)
setInterval(checkTimeAndRunAccruals, 60000); // 300000 мс = 5 минут

// Запускаем проверку сразу при старте скрипта
checkTimeAndRunAccruals();

console.log('Скрипт проверки начисления процентов запущен (будет выполняться в 7:00 по МСК)');
