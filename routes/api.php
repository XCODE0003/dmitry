<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Service\User\UserService;
use App\Models\Bundle;
use App\Models\Deal;
use App\Models\Category;
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
    $deals = Deal::query()
        ->join('bundles', 'deals.bundle_id', '=', 'bundles.id')
        ->where('deals.user_id', $id)
        ->where('bundles.type', 'fixed')
        ->select('deals.*', 'bundles.type')
        ->get();
    
    $deals_percent = Deal::query()
        ->join('bundles', 'deals.bundle_id', '=', 'bundles.id')
        ->where('deals.user_id', $id)
        ->where('bundles.type', 'percent')
        ->where('deals.created_at', '<=', now()->subHours(24))
        ->where('deals.created_at', '>=', now()->subDays(1))
        ->select('deals.*', 'bundles.type')
        ->get();
    
    $deal_active = $deals->where('status', '!=', 'completed');
    
    $deal_active_percent = $deals_percent->where('status', '!=', 'completed');
    
    $total_profit = $deal_active->sum('profit') + $deal_active_percent->sum('profit');
    $total_in_work = $deal_active->sum('amount') + $deal_active_percent->sum('amount');
    
    return response()->json([
        'total_profit' => $total_profit,
        'total_in_work' => $total_in_work
    ]);
});
