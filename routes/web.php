<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', 'HomeController@index');
Route::get('/list.json', 'BookController@list');
Route::post('/create', 'BookController@create');
Route::post('/edit', 'BookController@edit');
Route::get('/fetch', 'BookController@fetch');
Route::post('/delete', 'BookController@delete');
Route::get('/help', 'HomeController@help');
Route::get('/privacy-policy', 'HomeController@privacy_policy');
Route::get('/images/P/{path}', 'BookController@fetchImage');

Route::group([ 'prefix' => 'shelves' ], function () {
    Route::get('/list.json', 'BookshelfController@list');
});

Route::group([ 'prefix' => 'contact' ], function () {
    Route::match([ 'get', 'post' ], '/', 'HomeController@contact');
    Route::post('/submit', 'HomeController@contact_submit');
});

Route::group([ 'prefix' => 'settings' ], function () {
    Route::redirect('/', '/settings/account');

    Route::group([ 'prefix' => 'account' ], function () {
        Route::get('/', 'Setting\AccountController@index');
        Route::post('/update', 'Setting\AccountController@update');
        Route::get('/delete', 'Setting\AccountController@delete');
        Route::post('/delete', 'Setting\AccountController@confirm_delete');
    });
});

Auth::routes([ 'verify' => true ]);
