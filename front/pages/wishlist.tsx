import Link from "next/link";
import Image from "next/image";
import { GetStaticProps } from "next";
import { useTranslations } from "next-intl";
import { useState, useCallback, useEffect } from "react";

import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import LeftArrow from "../public/icons/LeftArrow";
import Button from "../components/Buttons/Button";
import GhostButton from "../components/Buttons/GhostButton";
import { useCart } from "../context/cart/CartProvider";
import { useWishlist } from "../context/wishlist/WishlistProvider";
import { useAuth } from "../context/AuthContext";
import { resolveImageUrl } from "../lib/images";
import { useWishlistAlerts, WishlistAlert } from "../lib/hooks/useWishlistAlerts";
import { api } from "../lib/api";
import { getCookie } from "cookies-next";

// let w = window.innerWidth;

const Wishlist = () => {
  const t = useTranslations("CartWishlist");
  const { addOne } = useCart();
  const { wishlist, deleteWishlistItem, clearWishlist } = useWishlist();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<WishlistAlert[]>([]);
  const [refreshedWishlist, setRefreshedWishlist] = useState<any[]>([]);
  const [stockStatus, setStockStatus] = useState<Record<number, { available: number; inStock: boolean }>>({});

  // Real-time wishlist alerts
  const handlePriceDropped = useCallback((alert: WishlistAlert) => {
    console.log('Price dropped:', alert);
    setAlerts(prev => [alert, ...prev].slice(0, 5)); // Keep last 5 alerts
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🔥 Price Drop Alert!`, {
        body: `${alert.product.name} - ${alert.product.discount_percentage}% off!`,
        icon: alert.product.images?.[0] || '/logo.png',
      });
    }
  }, []);

  const handleBackInStock = useCallback((alert: WishlistAlert) => {
    console.log('Back in stock:', alert);
    setAlerts(prev => [alert, ...prev].slice(0, 5));
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`✅ Back in Stock!`, {
        body: `${alert.product.name} is now available!`,
        icon: alert.product.images?.[0] || '/logo.png',
      });
    }
  }, []);

  useWishlistAlerts({
    userId: user?.id,
    enabled: !!user?.id,
    onPriceDropped: handlePriceDropped,
    onBackInStock: handleBackInStock,
  });

  // Refresh wishlist with latest product data and check stock
  useEffect(() => {
    const refreshWishlistData = async () => {
      if (wishlist.length === 0) {
        setRefreshedWishlist([]);
        setStockStatus({});
        return;
      }
      
      const branchId = getCookie('branch_id') as string;
      const statusMap: Record<number, { available: number; inStock: boolean }> = {};
      
      const updated = await Promise.all(
        wishlist.map(async (item) => {
          try {
            const res = await api.get(`/api/v1/products/${item.id}`, {
              params: branchId ? { branch_id: branchId } : undefined,
            });
            const product = res.data;
            const images = Array.isArray(product.images) ? product.images : [];
            
            // Use branch-specific stock if branch is selected
            let availableStock = product.stock || 0;
            if (branchId && product.branch_stock !== undefined) {
              availableStock = product.branch_stock;
            }
            
            // Track stock status
            statusMap[item.id] = {
              available: availableStock,
              inStock: availableStock > 0,
            };
            
            return {
              ...item,
              name: product.name || item.name,
              price: Number(product.price ?? item.price),
              img1: images.length > 0 ? images[0] : item.img1,
              img2: images.length > 1 ? images[1] : item.img2,
            };
          } catch (e) {
            console.error('Failed to refresh item:', item.id, e);
            statusMap[item.id] = { available: 0, inStock: false };
            return item;
          }
        })
      );
      
      setRefreshedWishlist(updated);
      setStockStatus(statusMap);
    };

    refreshWishlistData();
    
    // Refresh every 10 seconds
    const interval = setInterval(refreshWishlistData, 10000);
    
    return () => clearInterval(interval);
  }, [wishlist]); // Watch entire wishlist array

  // Use refreshed wishlist if available, otherwise use original
  const displayWishlist = refreshedWishlist.length > 0 ? refreshedWishlist : wishlist;

  let subtotal = 0;

  return (
    <div>
      {/* ===== Head Section ===== */}
      <Header title={`Wishlist - Haru Fashion`} />

      <main id="main-content">
        {/* ===== Real-time Alerts ===== */}
        {alerts.length > 0 && (
          <div className="app-max-width px-4 sm:px-8 md:px-20 w-full mt-4">
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                className={`mb-2 p-4 rounded-lg shadow-md ${
                  alert.type === 'price_drop' 
                    ? 'bg-green-50 border-l-4 border-green-500' 
                    : 'bg-blue-50 border-l-4 border-blue-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {alert.type === 'price_drop' ? '💰 Price Drop Alert!' : '📦 Back in Stock!'}
                    </p>
                    <p className="text-sm text-gray-700">{alert.message}</p>
                    {alert.type === 'price_drop' && (
                      <p className="text-sm text-green-600 font-medium">
                        Save {alert.product.discount_percentage}%!
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setAlerts(prev => prev.filter((_, i) => i !== index))}
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
            {t("wishlist")}
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

        {/* ===== Wishlist Table Section ===== */}
        <div className="app-max-width px-4 sm:px-8 md:px-20 mb-14 flex flex-col lg:flex-row">
          <div className="h-full w-full">
            <table className="w-full mb-6">
              <thead>
                <tr className="border-t-2 border-b-2 border-gray200">
                  <th className="font-normal hidden md:table-cell text-left sm:text-center py-2 xl:w-72">
                    {t("product_image")}
                  </th>
                  <th className="font-normal hidden md:table-cell text-left sm:text-center py-2 xl:w-72">
                    {t("product_name")}
                  </th>
                  <th className="font-normal md:hidden text-left sm:text-center py-2 xl:w-72">
                    {t("product_details")}
                  </th>
                  <th
                    className={`font-normal py-2 ${
                      wishlist.length === 0 ? "text-center" : "text-right"
                    }`}
                  >
                    {t("unit_price")}
                  </th>
                  <th className="font-normal hidden sm:table-cell py-2 max-w-xs">
                    {t("add")}
                  </th>
                  <th className="font-normal hidden sm:table-cell py-2 text-right w-10 whitespace-nowrap">
                    {t("remove")}
                  </th>
                  <th className="font-normal sm:hidden py-2 text-right w-10">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {wishlist.length === 0 ? (
                  <tr className="w-full text-center h-60 border-b-2 border-gray200">
                    <td colSpan={5}>{t("wishlist_is_empty")}</td>
                  </tr>
                ) : (
                  displayWishlist.map((item) => {
                    const stock = stockStatus[item.id];
                    const isOutOfStock = stock && !stock.inStock;
                    
                    subtotal += item.price * item.qty!;
                    return (
                      <tr className={`border-b-2 border-gray200 ${isOutOfStock ? 'bg-red-50' : ''}`} key={item.id}>
                        <td className="my-3 flex justify-center flex-col items-start sm:items-center">
                          <Link
                            href={`/products/${encodeURIComponent(item.id)}`}
                          >
                            <a className="relative inline-block">
                              {isOutOfStock && (
                                <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-xs font-bold z-10">
                                  Out of Stock
                                </div>
                              )}
                              {resolveImageUrl(item.img1 as string) ? (
                                <Image
                                  src={resolveImageUrl(item.img1 as string)}
                                  alt={item.name}
                                  width={95}
                                  height={128}
                                  className="h-32 xl:mr-4"
                                  unoptimized
                                />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src="/og.png"
                                  alt={item.name}
                                  width={95}
                                  height={128}
                                  className="h-32 xl:mr-4"
                                />
                              )}
                            </a>
                          </Link>
                          <span className="text-xs md:hidden">{item.name}</span>
                        </td>
                        <td className="text-center hidden md:table-cell">
                          {item.name}
                        </td>
                        <td className="text-right text-gray400">
                          $ {item.price}
                        </td>
                        <td className="text-center hidden sm:table-cell max-w-xs text-gray400">
                          {isOutOfStock ? (
                            <div className="text-center text-red-600 text-sm font-semibold">
                              Out of Stock
                            </div>
                          ) : (
                            <Button
                              value={t("add_to_cart")}
                              extraClass="hidden sm:block m-auto"
                              onClick={() => addOne!(item)}
                            />
                          )}
                        </td>
                        <td
                          className="text-right pl-8"
                          style={{ minWidth: "3rem" }}
                        >
                          {!isOutOfStock && (
                            <Button
                              value={t("add")}
                              onClick={() => addOne!(item)}
                              extraClass="sm:hidden mb-4 whitespace-nowrap"
                            />
                          )}
                          <button
                            onClick={() => deleteWishlistItem!(item)}
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
                onClick={clearWishlist}
                extraClass="w-full sm:w-48 whitespace-nowrap"
              >
                {t("clear_wishlist")}
              </GhostButton>
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

export default Wishlist;
