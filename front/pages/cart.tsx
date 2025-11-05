import Link from "next/link";
import Image from "next/image";
import { GetStaticProps } from "next";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";

import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import LeftArrow from "../public/icons/LeftArrow";
import Button from "../components/Buttons/Button";
import GhostButton from "../components/Buttons/GhostButton";
import { useCart } from "../context/cart/CartProvider";
import { resolveImageUrl } from "../lib/images";

const Cart = () => {
  const t = useTranslations("CartWishlist");
  const router = useRouter();
  const { cart, addOne, removeItem, deleteItem, clearCart } = useCart();

  let subtotal = 0;

  return (
    <div>
      {/* ===== Head Section ===== */}
      <Header title={`Shopping Cart - Haru Fashion`} />

      <main id="main-content">
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
          <div className="h-full w-full lg:w-2/3 lg:pr-8">
            <table className="w-full mb-6">
              <thead>
                <tr className="border-t-2 border-b-2 border-gray200">
                  <th className="font-normal text-center py-3 px-2">
                    {t("product_image")}
                  </th>
                  <th className="font-normal text-left py-3 px-4">
                    {t("product_name")}
                  </th>
                  <th className="font-normal py-3 text-right px-2">
                    {t("unit_price")}
                  </th>
                  <th className="font-normal hidden sm:table-cell py-3 text-center px-2">
                    {t("quantity")}
                  </th>
                  <th className="font-normal hidden sm:table-cell py-3 text-right px-2">
                    {t("total")}
                  </th>
                  <th className="font-normal py-3 text-right px-2 whitespace-nowrap">
                    {t("remove")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr className="w-full text-center h-60 border-b-2 border-gray200">
                    <td colSpan={6}>{t("cart_is_empty")}</td>
                  </tr>
                ) : (
                  cart.map((item) => {
                    const itemTotal = item.price * item.qty!;
                    subtotal += itemTotal;
                    return (
                      <tr className="border-b-2 border-gray200" key={item.id}>
                        <td className="py-4 px-2">
                          <Link
                            href={`/products/${encodeURIComponent(item.id)}`}
                          >
                            <a className="flex justify-center">
                              {resolveImageUrl(item.img1 as string) ? (
                                <Image
                                  src={resolveImageUrl(item.img1 as string)}
                                  alt={item.name}
                                  width={80}
                                  height={100}
                                  objectFit="cover"
                                  className="rounded"
                                  unoptimized
                                />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src="/og.png"
                                  alt={item.name}
                                  style={{ width: '80px', height: '100px', objectFit: 'cover' }}
                                  className="rounded"
                                />
                              )}
                            </a>
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-left">
                          <Link href={`/products/${encodeURIComponent(item.id)}`}>
                            <a className="hover:text-gray500 font-medium">
                              {item.name}
                            </a>
                          </Link>
                        </td>
                        <td className="py-4 px-2 text-right text-gray400">
                          $ {item.price.toFixed(2)}
                        </td>
                        <td className="py-4 px-2 text-center hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => removeItem!(item)}
                              className="w-8 h-8 border border-gray300 rounded hover:bg-gray100 flex items-center justify-center"
                              type="button"
                            >
                              −
                            </button>
                            <span className="w-12 text-center font-medium">{item.qty}</span>
                            <button
                              onClick={() => addOne!(item)}
                              className="w-8 h-8 border border-gray300 rounded hover:bg-gray100 flex items-center justify-center"
                              type="button"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-right hidden sm:table-cell font-medium text-gray500">
                          $ {itemTotal.toFixed(2)}
                        </td>
                        <td className="py-4 px-2 text-right align-top">
                          <div className="flex flex-col items-end gap-3">
                            <div className="sm:hidden flex items-center gap-2">
                              <button
                                onClick={() => removeItem!(item)}
                                className="w-7 h-7 border border-gray300 rounded hover:bg-gray100 flex items-center justify-center text-sm"
                                type="button"
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                              {(() => {
                                const max = typeof item.branch_stock === 'number' ? item.branch_stock : (typeof item.stock === 'number' ? item.stock : undefined);
                                const disabled = typeof max === 'number' && item.qty! >= max;
                                return (
                                  <button
                                    onClick={() => {
                                      if (disabled) return;
                                      addOne!(item);
                                    }}
                                    className={`w-7 h-7 border border-gray300 rounded flex items-center justify-center text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray100'}`}
                                    type="button"
                                  >
                                    +
                                  </button>
                                );
                              })()}
                            </div>
                            <button
                              onClick={() => deleteItem!(item)}
                              type="button"
                              className="text-gray400 hover:text-red-600 text-xl"
                              title="Remove item"
                            >
                              ×
                            </button>
                          </div>
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
                extraClass="w-full sm:w-48 whitespace-nowrap"
              >
                {t("clear_cart")}
              </GhostButton>
            </div>
          </div>

          {/* ===== Cart Summary Section ===== */}
          {cart.length > 0 && (
            <div className="h-full w-full lg:w-1/3 mt-8 lg:mt-0">
              <div className="border-2 border-gray200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray500">
                  {t("cart_summary")}
                </h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray400">
                    <span>{t("subtotal")}</span>
                    <span>$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray400">
                    <span>{t("shipping")}</span>
                    <span>{t("calculated_at_checkout")}</span>
                  </div>
                  <div className="border-t-2 border-gray200 pt-3 flex justify-between font-semibold text-lg text-gray500">
                    <span>{t("total")}</span>
                    <span>$ {subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  value={t("proceed_to_checkout")}
                  onClick={() => router.push("/checkout")}
                  extraClass="w-full"
                />
                <Link href="/">
                  <a className="block text-center mt-4 text-gray400 hover:text-gray500">
                    {t("continue_shopping")}
                  </a>
                </Link>
              </div>
            </div>
          )}
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

export default Cart;
