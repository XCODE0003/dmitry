<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bundles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('time');
            $table->string('min_deposit');
            $table->string('income_percent');
            $table->boolean('status')->default(true);
            $table->json('coins')->nullable();
            $table->integer('category_id')->nullable();
            $table->enum('type', ['fixed', 'percent'])->default('fixed');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bundles');
    }
};
