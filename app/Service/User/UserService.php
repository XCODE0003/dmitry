<?php

namespace App\Service\User;

use Illuminate\Support\Facades\DB;
use App\Models\Deal;
use App\Models\Bundle;
use Carbon\Carbon;

class UserService
{
    private $tg_id;
    public function __construct($tg_id)
    {
        $this->tg_id = $tg_id;
    }

    public function invest($bundle_id, $amount)
    {
        if($this->getBalance() < $amount) {
            return response()->json(['success' => false, 'message' => 'Недостаточно средств']);
        }
        $bundle = Bundle::find($bundle_id);
        $profit = ($amount * $bundle->income_percent / 100) ;
        $date_end = Carbon::now()->addHours($bundle->time);
        $deal = Deal::query()->create([
            'user_id' => $this->tg_id,
            'bundle_id' => $bundle_id,
            'amount' => $amount,
            'profit' => $profit,
            'date_end' => $date_end->timestamp,
        ]);
        if($deal){
            $this->removeBalance($amount);
            return response()->json(['success' => true, 'message' => 'Инвестиция прошла успешно']);
        }
        return response()->json(['success' => false, 'message' => 'Инвестиция не прошла']);
    }
    public function getUser()
    {
        return DB::connection('mongodb')
            ->getMongoClient()
            ->selectCollection(env('MONGO_DB_DATABASE'), 'users')->findOne(['id' => $this->tg_id]);
    }
    public function getAllUsers()
    {
        return DB::connection('mongodb')
            ->getMongoClient()
            ->selectCollection(env('MONGO_DB_DATABASE'), 'users')
            ->find()
            ->toArray();
    }

    public function addBalance($balance)
    {
        $balance = (float)$balance;

        return DB::connection('mongodb')
            ->getMongoClient()
            ->selectCollection(env('MONGO_DB_DATABASE'), 'users')->updateOne(['id' => $this->tg_id], ['$inc' => ['balance' => $balance]]);
    }
    public function setBalance($balance)
    {
        $balance = (float)$balance;
        return DB::connection('mongodb')
            ->getMongoClient()
            ->selectCollection(env('MONGO_DB_DATABASE'), 'users')->updateOne(['id' => $this->tg_id], ['$set' => ['balance' => $balance]]);
    }
    public function removeBalance($balance)
    {
        $balance = (float)$balance;
        return DB::connection('mongodb')
            ->getMongoClient()
            ->selectCollection(env('MONGO_DB_DATABASE'), 'users')->updateOne(['id' => $this->tg_id], ['$inc' => ['balance' => -$balance]]);
    }

    public function getBalance()
    {
        return DB::connection('mongodb')
            ->getMongoClient()
            ->selectCollection(env('MONGO_DB_DATABASE'), 'users')->findOne(['id' => $this->tg_id])['balance'];
    }

    public function withdraw($deal_id)
    {
        $deal = Deal::find($deal_id);
        if(!$deal) {
            return response()->json(['success' => false, 'message' => 'Инвестиция не найдена']);
        }
        if($deal->user_id !== $this->tg_id) {
            return response()->json(['success' => false, 'message' => 'Вы не можете забрать прибыль этого пользователя']);
        }
        if($deal->date_end > Carbon::now()->timestamp) {
            return response()->json(['success' => false, 'message' => 'Инвестиция не завершена'], 400);
        }
        $this->addBalance($deal->amount + $deal->profit);
        $deal->delete();
        return response()->json(['success' => true, 'message' => 'Вывод средств прошел успешно']);
    }
    
}

