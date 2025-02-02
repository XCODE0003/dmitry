<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bundle extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'time', 'risk', 'min_deposit', 'capacity', 'income_percent', 'coins'];

    protected $casts = [
        'coins' => 'array',
    ];

    public function deals()
    {
        return $this->hasMany(Deal::class);
    }
}
