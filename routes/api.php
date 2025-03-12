<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Service\User\UserService;
use App\Models\Bundle;
use App\Models\Deal;
use App\Models\Category;
use Carbon\Carbon;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('user')->group(function () {
    Route::get('/get/{id}', function ($id) {
        $user = new UserService((int)$id);
        return response()->json($user->getUser());
    });
    Route::get('/balance/{id}', function ($id) {
        $user = new UserService((int)$id);
        return response()->json(['balance' => $user->getBalance()]);
    });
    Route::post('/invest', function (Request $request) {
        $user = new UserService($request->user_id);
        return $user->invest($request->bundle_id, $request->amount);
    });
});

Route::get('/bundles', function (Request $request) {
    if ($request->category_id !== 'invest') {
        $bundles = Bundle::query()->where('category_id', $request->category_id)->get();
    } else {
        $bundles = Bundle::all();
    }

    return response()->json($bundles);
});

Route::get('/categories', function () {
    $categories = Category::all();
    return response()->json($categories);
});

Route::get('/deals/{id}', function ($id) {
    $deals = Deal::query()->where('user_id', $id)->where('status', '!=', 'completed')->get();
    $deals->load('bundle');
    return response()->json($deals);
});

Route::post('/withdraw', function (Request $request) {
    $user = new UserService($request->user_id);
    return $user->withdraw($request->deal_id);
});

Route::get('/user/{id}/info', function ($id) {
    // Получаем фиксированные сделки
    $deals_fixed = Deal::query()
        ->join('bundles', 'deals.bundle_id', '=', 'bundles.id')
        ->where('deals.user_id', $id)
        ->where('bundles.type', 'fixed')
        ->select('deals.*', 'bundles.type')
        ->get();
    
    // Получаем процентные сделки
    $deals_percent = Deal::query()
        ->join('bundles', 'deals.bundle_id', '=', 'bundles.id')
        ->where('deals.user_id', $id)
        ->where('bundles.type', 'percent')
        ->select('deals.*', 'bundles.type', 'bundles.income_percent')
        ->get();
    
    // Активные фиксированные сделки
    $deal_active_fixed = $deals_fixed->where('status', '!=', 'completed');
    
    // Активные процентные сделки
    $deal_active_percent = $deals_percent->where('status', '!=', 'completed');
    
    // Расчет прибыли для процентных сделок на основе дней с момента создания
    $percent_profit = 0;
    foreach ($deal_active_percent as $deal) {
        // Получаем дату создания сделки
        $created_at = Carbon::parse($deal->created_at);
        
        // Получаем текущее время
        $now = Carbon::now();
        
        // Рассчитываем количество дней с 7 утра после создания
        // Если сделка создана до 7 утра, считаем первый день с сегодняшнего дня в 7 утра
        // Если после 7 утра, то с завтрашнего дня в 7 утра
        $start_date = $created_at->copy();
        if ($start_date->hour < 7) {
            $start_date->setTime(7, 0, 0);
        } else {
            $start_date->addDay()->setTime(7, 0, 0);
        }
        
        // Если начальная дата еще не наступила, прибыль = 0
        if ($start_date > $now) {
            continue;
        }
        
        // Рассчитываем количество полных дней с 7 утра
        $days = 0;
        $current_date = $start_date->copy();
        
        while ($current_date <= $now) {
            $days++;
            $current_date->addDay();
        }
        
        // Рассчитываем прибыль на основе количества дней и процента дохода
        $daily_profit = ($deal->amount * $deal->income_percent / 100);
        $deal_profit = $daily_profit * $days;
        
        $percent_profit += $deal_profit;
    }
    
    $total_profit = $deals_fixed->sum('profit') + $percent_profit;
    $total_in_work = $deal_active_fixed->sum('amount') + $deal_active_percent->sum('amount');
    
    return response()->json([
        'total_profit' => $total_profit,
        'total_in_work' => $total_in_work
    ]);
});
