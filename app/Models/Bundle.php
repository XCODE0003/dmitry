<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bundle extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'time', 'min_deposit', 'income_percent', 'coins', 'status'];

    protected $casts = [
        'coins' => 'array',
    ];

    public function deals()
    {
        return $this->hasMany(Deal::class);
    }
}
