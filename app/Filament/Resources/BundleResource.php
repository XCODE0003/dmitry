<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BundleResource\Pages;
use App\Filament\Resources\BundleResource\RelationManagers;
use App\Models\Bundle;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class BundleResource extends Resource
{
    protected static ?string $model = Bundle::class;

    protected static ?string $navigationIcon = 'heroicon-o-briefcase';
    protected static ?string $navigationLabel = 'Связки';
    protected static ?string $pluralLabel = 'Связки';
    protected static ?string $pluralModelLabel = 'Связки';
    protected static ?string $pluralModelLabelSingular = 'Связка';
    protected static ?string $label = 'Связка';
    
   

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->label('Название связки')
                    ->maxLength(255),
                Forms\Components\TextInput::make('time')
                    ->label('Время в часах')
                    ->required(),
                Forms\Components\TextInput::make('min_deposit')
                    ->label('Минимальная сумма')
                    ->required(),
                Forms\Components\TextInput::make('income_percent')
                    ->label('Процент дохода')
                    ->required(),
                Forms\Components\Toggle::make('status')
                    ->label('Статус')
                    ->required(),
                Forms\Components\Section::make('Описание связки')
                    ->columnSpanFull()
                    ->schema([
                        Forms\Components\Repeater::make('coins')
                            ->label('Монеты или биржи')
                            ->columnSpanFull()
                    ->schema([
                        Forms\Components\FileUpload::make('image')
                            ->required()
                            ->image()
                            ->label('Логотип'),
                        Forms\Components\TextInput::make('name')
                            ->label('Название')
                            ->required()
                            ->maxLength(255),
                    ])->columns(2)
            
                    ])->columns(2)
            ])  ;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Название связки'),
                Tables\Columns\TextColumn::make('time')
                        ->label('Время в часах'),
                Tables\Columns\TextColumn::make('min_deposit')
                    ->label('Минимальная сумма'),
                Tables\Columns\TextColumn::make('income_percent')
                    ->label('Процент дохода'),
                Tables\Columns\ToggleColumn::make('status')
                    ->label('Статус')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\Filter::make('status')
                    ->query(fn (Builder $query): Builder => $query->where('status', true))
                    ->label('Активные')
                    ->toggle(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBundles::route('/'),
            'create' => Pages\CreateBundle::route('/create'),
            'edit' => Pages\EditBundle::route('/{record}/edit'),
        ];
    }
}
