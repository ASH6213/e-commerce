import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { resolveImageUrl } from "../lib/images";
import { useTranslations } from "next-intl";

import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import LeftArrow from "../public/icons/LeftArrow";
import Button from "../components/Buttons/Button";
import GhostButton from "../components/Buttons/GhostButton";
import { GetStaticProps } from "next";
import { roundDecimal } from "../components/Util/utilFunc";
import { useCart } from "../context/cart/CartProvider";
import { useRouter } from "next/router";
import { useCartStockWarnings, CartStockWarning } from "../lib/hooks/useCartStockWarnings";
import { api } from "../lib/api";
import { getCookie } from "cookies-next";

// let w = window.innerWidth;

const ShoppingCart = () => {
  const t = useTranslations("CartWishlist");
  const router = useRouter();
  const [deli, setDeli] = useState("Pickup");
  const { cart, addOne, removeItem, deleteItem, clearCart } = useCart();
  const [stockWarnings, setStockWarnings] = useState<CartStockWarning[]>([]);
  const [stockStatus, setStockStatus] = useState<Record<number, { available: number; inStock: boolean }>>({});
  const [priceChanges, setPriceChanges] = useState<Array<{ id: number; name: string; oldPrice: number; newPrice: number }>>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<number, number>>({});
  const [stockDataLoaded, setStockDataLoaded] = useState(false);

  // Real-time cart stock warnings
  const handleLowStock = useCallback((warning: CartStockWarning) => {
    setStockWarnings(prev => [warning, ...prev].slice(0, 3));
    
    // Update stock status in real-time
    setStockStatus(prev => ({
      ...prev,
      [warning.product.id]: {
        available: warning.product.available_stock,
        inStock: warning.product.available_stock >= (cart.find(item => item.id === warning.product.id)?.qty || 1),
      }
    }));
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`⚠️ Low Stock Warning`, {
        body: warning.message,
        icon: warning.product.images?.[0] || '/logo.png',
      });
    }
  }, [cart]);

  const handleOutOfStock = useCallback((warning: CartStockWarning) => {
    setStockWarnings(prev => [warning, ...prev].slice(0, 3));
    
    // Update stock status in real-time
    setStockStatus(prev => ({
      ...prev,
      [warning.product.id]: {
        available: 0,
        inStock: false,
      }
    }));
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`❌ Out of Stock!`, {
        body: warning.message,
        icon: warning.product.images?.[0] || '/logo.png',
      });
    }
  }, []);

  useCartStockWarnings({
    cartItems: cart,
    enabled: cart.length > 0,
    onLowStock: handleLowStock,
    onOutOfStock: handleOutOfStock,
  });

  // Check stock availability and prices for all cart items
  useEffect(() => {
    const checkStockAndPrices = async () => {
      if (cart.length === 0) {
        setStockStatus({});
        setCurrentPrices({});
        setPriceChanges([]);
        setStockDataLoaded(false);
        return;
      }

      const branchId = getCookie('branch_id') as string;
      
      const statusMap: Record<number, { available: number; inStock: boolean }> = {};
      const pricesMap: Record<number, number> = {};
      const changes: Array<{ id: number; name: string; oldPrice: number; newPrice: number }> = [];
      
      await Promise.all(
        cart.map(async (item) => {
          try {
            const res = await api.get(`/api/v1/products/${item.id}`, {
              params: branchId ? { branch_id: branchId } : undefined,
            });
            const product = res.data;
            
            // Use branch-specific stock if branch is selected
            let availableStock = product.stock || 0;
            if (branchId && product.branch_stock !== undefined) {
              availableStock = product.branch_stock;
            }
            
            console.log(`Product ${item.id} check:`, {
              globalStock: product.stock,
              branchStock: product.branch_stock,
              branchId,
              using: availableStock
            });
            
            statusMap[item.id] = {
              available: availableStock,
              inStock: availableStock >= (item.qty || 1),
            };
            
            // Check price changes
            const currentPrice = Number(product.price || 0);
            pricesMap[item.id] = currentPrice;
            
            // Detect price change (with tolerance for floating point)
            if (Math.abs(currentPrice - item.price) > 0.01) {
              changes.push({
                id: item.id,
                name: item.name,
                oldPrice: item.price,
                newPrice: currentPrice,
              });
            }
            
          } catch (e) {
            console.error('Failed to check product data for:', item.id);
            statusMap[item.id] = { available: 0, inStock: false };
            pricesMap[item.id] = item.price;
          }
        })
      );
      
      setStockStatus(statusMap);
      setCurrentPrices(pricesMap);
      setPriceChanges(changes);
      setStockDataLoaded(true);
    };

    checkStockAndPrices();
    
    // Refresh stock and prices every 10 seconds
    const interval = setInterval(checkStockAndPrices, 10000);
    
    return () => clearInterval(interval);
  }, [cart]); // Re-check when cart changes

  // Check if any items are out of stock
  const hasOutOfStockItems = Object.values(stockStatus).some(status => !status.inStock);

  let subtotal = 0;

  let deliFee = 0;
  if (deli === "Yangon") {
    deliFee = 2.0;
  } else if (deli === "Others") {
    deliFee = 7.0;
  }

  return (
    <div>
      {/* ===== Head Section ===== */}
      <Header title={`Shopping Cart - Haru Fashion`} />

      <main id="main-content">
        {/* ===== Price Change Warning ===== */}
        {priceChanges.length > 0 && (
          <div className="app-max-width px-4 sm:px-8 md:px-20 w-full mt-4">
            <div className="mb-2 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">
                    ℹ️ تم تحديث الأسعار
                  </p>
                  <p className="text-sm text-blue-700 mt-1">تغيرت أسعار بعض المنتجات:</p>
                  <ul className="text-xs text-blue-600 mt-2">
                    {priceChanges.map(change => (
                      <li key={change.id} className="mt-1">
                        • {change.name}: 
                        <span className={change.newPrice > change.oldPrice ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          {' '}${roundDecimal(change.oldPrice)} → ${roundDecimal(change.newPrice)}
                          {change.newPrice > change.oldPrice ? ' ⬆️' : ' ⬇️'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => setPriceChanges([])}
                  className="ml-4 text-blue-400 hover:text-blue-600"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* ===== Stock Warnings ===== */}
        {stockWarnings.length > 0 && (
          <div className="app-max-width px-4 sm:px-8 md:px-20 w-full mt-4">
            {stockWarnings.map((warning, index) => (
              <div 
                key={index} 
                className={`mb-2 p-4 rounded-lg shadow-md ${
                  warning.warning_type === 'out_of_stock' 
                    ? 'bg-red-50 border-l-4 border-red-500' 
                    : 'bg-yellow-50 border-l-4 border-yellow-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {warning.warning_type === 'out_of_stock' ? '❌ Out of Stock!' : '⚠️ Low Stock Warning'}
                    </p>
                    <p className="text-sm text-gray-700">{warning.message}</p>
                  </div>
                  <button
                    onClick={() => setStockWarnings(prev => prev.filter((_, i) => i !== index))}
                    className="ml-4 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== Heading & Continue Shopping */}
        <div className="app-max-width px-4 sm:px-8 md:px-20 w-full border-t-2 border-gray100">
          <h1 className="text-2xl sm:text-4xl text-center sm:text-left mt-6 mb-2 animatee__animated animate__bounce">
            {t("shopping_cart")}
          </h1>
          
          <div className="mt-6 mb-3">
            <Link href="/">
              <a className="inline-block">
                <LeftArrow size="sm" extraClass="inline-block" />{" "}
                {t("continue_shopping")}
              </a>
            </Link>
          </div>
        </div>

        {/* ===== Cart Table Section ===== */}
        <div className="app-max-width px-4 sm:px-8 md:px-20 mb-14 flex flex-col lg:flex-row">
          <div className="h-full w-full lg:w-4/6 mr-4">
            <table className="w-full mb-6">
              <thead>
                <tr className="border-t-2 border-b-2 border-gray200">
                  <th className="font-normal text-left sm:text-center py-2 xl:w-72">
                    {t("product_details")}
                  </th>
                  <th
                    className={`font-normal py-2 hidden sm:block ${
                      cart.length === 0 ? "text-center" : "text-right"
                    }`}
                  >
                    {t("unit_price")}
                  </th>
                  <th className="font-normal py-2">{t("quantity")}</th>
                  <th className="font-normal py-2 text-right">{t("amount")}</th>
                  <th
                    className="font-normal py-2 text-right"
                    style={{ minWidth: "3rem" }}
                  ></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr className="w-full text-center h-60 border-b-2 border-gray200">
                    <td colSpan={5}>{t("cart_is_empty")}</td>
                  </tr>
                ) : (
                  cart.map((item) => {
                    const stock = stockStatus[item.id];
                    const isOutOfStock = stock && !stock.inStock;
                    const availableStock = stock?.available ?? 0;
                    const currentPrice = currentPrices[item.id] ?? item.price;
                    const priceChanged = Math.abs(currentPrice - item.price) > 0.01;
                    
                    subtotal += currentPrice * item.qty!;
                    return (
                      <tr className={`border-b-2 border-gray200 ${isOutOfStock ? 'bg-red-50' : ''}`} key={item.id}>
                        <td className="my-3 flex flex-col xl:flex-row items-start sm:items-center xl:space-x-2 text-center xl:text-left">
                          <Link
                            href={`/products/${encodeURIComponent(item.id)}`}
                          >
                            <a className="relative inline-block">
                              {isOutOfStock && (
                                <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-xs font-bold z-10">
                                  Out of Stock
                                </div>
                              )}
                              <Image
                                src={resolveImageUrl(item.img1 as string)}
                                alt={item.name}
                                width={95}
                                height={128}
                                className="h-32 xl:mr-4"
                                unoptimized
                                onError={(e) => {
                                  const t = e.target as HTMLImageElement;
                                  // eslint-disable-next-line no-param-reassign
                                  t.src = "/og.png";
                                }}
                              />
                            </a>
                          </Link>
                          <span>{item.name}</span>
                        </td>
                        <td className="text-right text-gray400 hidden sm:table-cell">
                          {priceChanged && (
                            <span className="line-through text-gray-300 text-xs block">
                              $ {roundDecimal(item.price)}
                            </span>
                          )}
                          <span className={priceChanged ? 'text-blue-600 font-semibold' : ''}>
                            $ {roundDecimal(currentPrice)}
                            {priceChanged && <span className="ml-1 text-xs">🔄</span>}
                          </span>
                        </td>
                        <td>
                          {isOutOfStock ? (
                            <div className="mx-auto text-center">
                              <div className="text-red-600 font-semibold text-sm">Out of Stock</div>
                              <div className="text-xs text-gray-500 mt-1">Available: {availableStock}</div>
                            </div>
                          ) : (
                            <div className="mx-auto">
                              <div className="w-12 h-32 sm:h-auto sm:w-3/4 md:w-2/6 mx-auto flex flex-col-reverse sm:flex-row border border-gray300 sm:divide-x-2 divide-gray300">
                                <div
                                  onClick={() => removeItem!(item)}
                                  className="h-full w-12 flex justify-center items-center cursor-pointer hover:bg-gray500 hover:text-gray100"
                                >
                                  -
                                </div>
                                <div className="h-full w-12 flex justify-center items-center pointer-events-none">
                                  {item.qty}
                                </div>
                                <div
                                  onClick={() => {
                                    // Check if adding one more would exceed available stock
                                    if (availableStock > 0 && item.qty! < availableStock) {
                                      addOne!(item);
                                    }
                                  }}
                                  className={`h-full w-12 flex justify-center items-center cursor-pointer ${
                                    availableStock > 0 && item.qty! < availableStock
                                      ? 'hover:bg-gray500 hover:text-gray100'
                                      : 'opacity-50 cursor-not-allowed'
                                  }`}
                                >
                                  +
                                </div>
                              </div>
                              {/* Show stock info only if quantity is at or near maximum AND data is loaded */}
                              {stockDataLoaded && stock && item.qty! >= availableStock && availableStock > 0 && (
                                <div className="text-center mt-1">
                                  <span className="text-xs text-orange-600 font-semibold">
                                    ⚠️ Max: {availableStock}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="text-right text-gray400">
                          {priceChanged && (
                            <span className="line-through text-gray-300 text-xs block">
                              $ {roundDecimal(item.price * item.qty!)}
                            </span>
                          )}
                          <span className={priceChanged ? 'text-blue-600 font-semibold' : ''}>
                            $ {roundDecimal(currentPrice * item.qty!)}
                          </span>
                          <br />
                          <span className="text-xs">
                            ($ {roundDecimal(currentPrice)})
                          </span>
                        </td>
                        <td className="text-right" style={{ minWidth: "3rem" }}>
                          <button
                            onClick={() => deleteItem!(item)}
                            type="button"
                            className="outline-none text-gray300 hover:text-gray500 focus:outline-none text-4xl sm:text-2xl"
                          >
                            &#10005;
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <div>
              <GhostButton
                onClick={clearCart}
                extraClass="hidden sm:inline-block"
              >
                {t("clear_cart")}
              </GhostButton>
            </div>
          </div>
          <div className="h-full w-full lg:w-4/12 mt-10 lg:mt-0">
            {/* Cart Totals */}
            <div className="border border-gray500 divide-y-2 divide-gray200 p-6">
              <h2 className="text-xl mb-3">{t("cart_totals")}</h2>
              <div className="flex justify-between py-2">
                <span className="uppercase">{t("subtotal")}</span>
                <span>$ {roundDecimal(subtotal)}</span>
              </div>
              <div className="py-3">
                <span className="uppercase">{t("delivery")}</span>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <input
                        type="radio"
                        name="deli"
                        value="Pickup"
                        id="pickup"
                        checked={deli === "Pickup"}
                        onChange={() => setDeli("Pickup")}
                      />{" "}
                      <label htmlFor="pickup" className="cursor-pointer">
                        {t("store_pickup")}
                      </label>
                    </div>
                    <span>{t("free")}</span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <input
                        type="radio"
                        name="deli"
                        value="Yangon"
                        id="ygn"
                        checked={deli === "Yangon"}
                        onChange={() => setDeli("Yangon")}
                        // defaultChecked
                      />{" "}
                      <label htmlFor="ygn" className="cursor-pointer">
                        {t("within_yangon")}
                      </label>
                    </div>
                    <span>$ 2.00</span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <input
                        type="radio"
                        name="deli"
                        value="Others"
                        id="others"
                        checked={deli === "Others"}
                        onChange={() => setDeli("Others")}
                      />{" "}
                      <label htmlFor="others" className="cursor-pointer">
                        {t("other_cities")}
                      </label>
                    </div>
                    <span>$ 7.00</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between py-3">
                <span>{t("grand_total")}</span>
                <span>$ {roundDecimal(subtotal + deliFee)}</span>
              </div>
              
              {/* Out of Stock Warning */}
              {hasOutOfStockItems && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-red-800 text-sm font-bold mb-2">
                    ⚠️ لا يمكنك إكمال الطلب
                  </p>
                  <p className="text-red-700 text-sm">
                    بعض المنتجات في السلة غير متوفرة بالكمية المطلوبة. يرجى تعديل الكميات أو حذف المنتجات غير المتوفرة قبل المتابعة.
                  </p>
                  <ul className="mt-2 text-xs text-red-600">
                    {cart.filter(item => {
                      const stock = stockStatus[item.id];
                      return stock && !stock.inStock;
                    }).map(item => {
                      const stock = stockStatus[item.id];
                      return (
                        <li key={item.id} className="mt-1">
                          • {item.name}: طلبت {item.qty} لكن المتوفر {stock?.available || 0} فقط
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              <Button
                value={hasOutOfStockItems ? "❌ عدّل الكميات أولاً" : t("proceed_to_checkout")}
                size="xl"
                extraClass={`w-full ${hasOutOfStockItems ? 'bg-red-600 hover:bg-red-700 opacity-75 cursor-not-allowed' : ''}`}
                onClick={() => !hasOutOfStockItems && router.push(`/checkout`)}
                disabled={cart.length < 1 || hasOutOfStockItems}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ===== Footer Section ===== */}
      <Footer />
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      messages: (await import(`../messages/common/${locale}.json`)).default,
    },
  };
};

export default ShoppingCart;
