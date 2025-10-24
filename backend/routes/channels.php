<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Public channel for products - anyone can listen
Broadcast::channel('products', function () {
    return true;
});

// Public channel for orders - anyone can listen
Broadcast::channel('orders', function () {
    return true;
});

// Public channel for wishlist alerts - anyone can listen
// Frontend filters by user_id
Broadcast::channel('wishlist', function () {
    return true;
});

// Public channel for cart stock warnings - anyone can listen
Broadcast::channel('cart', function () {
    return true;
});
