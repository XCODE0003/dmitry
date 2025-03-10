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
        $amount = (int) $amount;

        if ($amount <= 0) {
            return response()->json(['success' => false, 'message' => 'Сумма должна быть больше 0'], 400);
        }

        if ($this->getBalance() < $amount) {
            return response()->json(['success' => false, 'message' => 'Недостаточно средств'], 400);
        }

        $bundle = Bundle::find($bundle_id);

        if (!$bundle) {
            return response()->json(['success' => false, 'message' => 'Связка не найдена'], 400);
        }
        if ($bundle->min_deposit > $amount) {
            return response()->json(['success' => false, 'message' => 'Сумма должна быть больше минимальной суммы инвестиции'], 400);
        }

        $profit = ($amount * $bundle->income_percent / 100);
        $date_end = Carbon::now()->addHours($bundle->time);

        try {
            $deal = Deal::query()->create([
                'user_id' => $this->tg_id,
                'bundle_id' => $bundle_id,
                'amount' => $amount,
                'profit' => $profit,
                'date_end' => $date_end->timestamp,
            ]);

            if ($deal) {
                $this->removeBalance($amount);
                return response()->json(['success' => true, 'message' => 'Инвестиция прошла успешно']);
            }
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Произошла ошибка при создании инвестиции'], 400);
        }

        return response()->json(['success' => false, 'message' => 'Инвестиция не прошла'], 400);
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
        if (!$deal) {
            return response()->json(['success' => false, 'message' => 'Инвестиция не найдена']);
        }
        if ($deal->user_id !== $this->tg_id) {
            return response()->json(['success' => false, 'message' => 'Вы не можете забрать прибыль этого пользователя']);
        }
        if ($deal->type === 'fixed' && $deal->date_end > Carbon::now()->timestamp) {
            return response()->json(['success' => false, 'message' => 'Инвестиция не завершена'], 400);
        }
        if ($deal->type === 'fixed') {
            $this->addBalance($deal->amount + $deal->profit);
        }
        else{
            $this->addBalance($deal->amount);
        }
        $deal->status = 'completed';
        $deal->save();
        return response()->json(['success' => true, 'message' => 'Вывод средств прошел успешно']);
    }
}
