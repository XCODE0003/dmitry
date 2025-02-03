<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Service\User\UserService;
use App\Models\Bundle;
use App\Models\Deal;

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
        $user->invest($request->bundle_id, $request->amount);
        return response()->json(['message' => 'Investment successful']);
    });
});

Route::get('/bundles', function () {
    $bundles = Bundle::all();
    return response()->json($bundles);
});

Route::get('/deals/{id}', function ($id) {
    $deals = Deal::query()->where('user_id', $id)->get();
    $deals->load('bundle');
    return response()->json($deals);
});

Route::post('/withdraw', function (Request $request) {
    $user = new UserService($request->user_id);
    return $user->withdraw($request->deal_id);
});

