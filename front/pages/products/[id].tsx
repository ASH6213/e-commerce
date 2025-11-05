import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";

import Link from "next/link";
import Image from "next/image";
import { resolveImageUrl } from "../../lib/images";
import { Disclosure } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { api } from "../../lib/api";
import { getCookie } from "cookies-next";

import Heart from "../../public/icons/Heart";
import DownArrow from "../../public/icons/DownArrow";
import FacebookLogo from "../../public/icons/FacebookLogo";
import InstagramLogo from "../../public/icons/InstagramLogo";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import GhostButton from "../../components/Buttons/GhostButton";
import Button from "../../components/Buttons/Button";
import Card from "../../components/Card/Card";

// swiperjs
import { Swiper, SwiperSlide } from "swiper/react";

// import Swiper core and required modules
import SwiperCore, { Pagination } from "swiper/core";
import { apiProductsType, itemType } from "../../context/cart/cart-types";
import { useWishlist } from "../../context/wishlist/WishlistProvider";
import { useCart } from "../../context/cart/CartProvider";
import HeartSolid from "../../public/icons/HeartSolid";
import { getPusher } from "../../lib/realtime";

// install Swiper modules
SwiperCore.use([Pagination]);

type Props = {
  product: itemType;
  products: itemType[];
};

const Product: React.FC<Props> = ({ product, products }) => {
  const { addItem } = useCart();
  const { wishlist, addToWishlist, deleteWishlistItem } = useWishlist();
  const [size, setSize] = useState("M");
  const img1 = resolveImageUrl(product.img1 as string);
  const img2 = resolveImageUrl(product.img2 as string);
  const [mainImg, setMainImg] = useState(img1);
  const [currentQty, setCurrentQty] = useState(1);
  const t = useTranslations("Category");
  const [displayedPrice, setDisplayedPrice] = useState<number>(product.price);
  const [branchStock, setBranchStock] = useState<number | undefined>(product.branch_stock);

  const alreadyWishlisted =
    wishlist.filter((wItem) => wItem.id === product.id).length > 0;

  useEffect(() => {
    setMainImg(img1 as string);
  }, [product, img1]);

  useEffect(() => {
    const refetch = async () => {
      try {
        const branchId = getCookie("branch_id");
        const res = await api.get(`/api/v1/products/${product.id}`, {
          params: branchId ? { branch_id: branchId } : undefined,
        });
        const p: any = res.data;
        setDisplayedPrice(Number(p?.price ?? product.price));
        setBranchStock(p?.branch_stock);
      } catch (_e) {
        // keep current displayedPrice and branchStock
      }
    };
    const onBranchChanged = () => refetch();
    if (typeof window !== "undefined") {
      window.addEventListener("branch-changed", onBranchChanged as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("branch-changed", onBranchChanged as EventListener);
      }
    };
  }, [product.id]);

  // Realtime: refresh product details if updated
  useEffect(() => {
    let subscribed = true;
    let channel: any = null;
    let pusher: any = null;
    (async () => {
      try {
        pusher = await getPusher();
        if (!pusher) return;
        channel = pusher.subscribe('products');
        const refetch = async () => {
          try {
            const branchId = getCookie("branch_id");
            const res = await api.get(`/api/v1/products/${product.id}`, {
              params: branchId ? { branch_id: branchId } : undefined,
            });
            const p: any = res.data;
            if (!subscribed) return;
            setDisplayedPrice(Number(p?.price ?? product.price));
            setBranchStock(p?.branch_stock);
            // update product name in current view
            // no set for product prop; but title uses product.name; leave as-is unless page reload
          } catch (_) {}
        };
        channel.bind('product.updated', refetch);
      } catch (_) {}
    })();
    return () => {
      subscribed = false;
      try { if (channel) channel.unbind_all(); } catch {}
      try { if (pusher) pusher.disconnect(); } catch {}
    };
  }, [product.id]);

  const handleSize = (value: string) => {
    setSize(value);
  };

  const currentItem = {
    ...product,
    qty: currentQty,
  };

  const handleWishlist = () => {
    alreadyWishlisted
      ? deleteWishlistItem!(currentItem)
      : addToWishlist!(currentItem);
  };

  return (
    <div>
      {/* ===== Head Section ===== */}
      <Header title={`${product.name} - Haru Fashion`} />

      <main id="main-content">
        {/* ===== Breadcrumb Section ===== */}
        <div className="bg-lightgreen h-16 w-full flex items-center border-t-2 border-gray200">
          <div className="app-x-padding app-max-width w-full">
            <div className="breadcrumb">
              <Link href="/">
                <a className="text-gray400">{t("home")}</a>
              </Link>{" "}
              /{" "}
              <Link href={`/product-category/${product.categoryName}`}>
                <a className="text-gray400 capitalize">
                  {t(product.categoryName as string)}
                </a>
              </Link>{" "}
              / <span>{product.name}</span>
            </div>
          </div>
        </div>
        {/* ===== Main Content Section ===== */}
        <div className="itemSection app-max-width app-x-padding flex flex-col md:flex-row">
          <div className="imgSection w-full md:w-1/2 h-full flex">
            <div className="hidden sm:block w-full sm:w-1/4 h-full space-y-4 my-4">
              {img1 && (
                <Image
                className={`cursor-pointer ${
                  mainImg === img1
                    ? "opacity-100 border border-gray300"
                    : "opacity-50"
                }`}
                onClick={() => setMainImg(img1)}
                src={img1 as string}
                alt={product.name}
                width={1000}
                height={1282}
              />
              )}
              {img2 && (
                <Image
                className={`cursor-pointer ${
                  mainImg === img2
                    ? "opacity-100 border border-gray300"
                    : "opacity-50"
                }`}
                onClick={() => setMainImg(img2)}
                src={img2 as string}
                alt={product.name}
                width={1000}
                height={1282}
              />
              )}
            </div>
            <div className="w-full sm:w-3/4 h-full m-0 sm:m-4">
              <Swiper
                slidesPerView={1}
                spaceBetween={0}
                loop={true}
                pagination={{
                  clickable: true,
                }}
                className="mySwiper sm:hidden"
              >
                <SwiperSlide>
                  <Image
                    className="each-slide w-full"
                    src={img1 as string}
                    width={1000}
                    height={1282}
                    alt={product.name}
                    priority
                  />
                </SwiperSlide>
                <SwiperSlide>
                  <Image
                    className="each-slide w-full"
                    src={img2 as string}
                    width={1000}
                    height={1282}
                    alt={product.name}
                  />
                </SwiperSlide>
              </Swiper>
              <div className="hidden sm:block h-full">
                {mainImg && (
                  <Image
                    className="w-full"
                    src={mainImg as string}
                    width={1000}
                    height={1282}
                    alt={product.name}
                    priority
                  />
                )}
              </div>
            </div>
          </div>
          <div className="infoSection w-full md:w-1/2 h-auto py-8 sm:pl-4 flex flex-col">
            <h1 className="text-3xl mb-4">{product.name}</h1>
            <span className="text-2xl text-gray400 mb-2">
              $ {displayedPrice}
            </span>
            <span className="mb-2 text-justify">{product.detail}</span>
            <span className="mb-2">
              {t("availability")}:{" "}
              {branchStock !== undefined && branchStock !== null && branchStock === 0 ? (
                <span className="text-red-600 font-semibold">Out of Stock</span>
              ) : (
                <span className="text-green-600">{t("in_stock")}</span>
              )}
            </span>
            <span className="mb-2">
              {t("size")}: {size}
            </span>
            <div className="sizeContainer flex space-x-4 text-sm mb-4">
              <div
                onClick={() => handleSize("S")}
                className={`w-8 h-8 flex items-center justify-center border ${
                  size === "S"
                    ? "border-gray500"
                    : "border-gray300 text-gray400"
                } cursor-pointer hover:bg-gray500 hover:text-gray100`}
              >
                S
              </div>
              <div
                onClick={() => handleSize("M")}
                className={`w-8 h-8 flex items-center justify-center border ${
                  size === "M"
                    ? "border-gray500"
                    : "border-gray300 text-gray400"
                } cursor-pointer hover:bg-gray500 hover:text-gray100`}
              >
                M
              </div>
              <div
                onClick={() => handleSize("L")}
                className={`w-8 h-8 flex items-center justify-center border ${
                  size === "L"
                    ? "border-gray500"
                    : "border-gray300 text-gray400"
                } cursor-pointer hover:bg-gray500 hover:text-gray100`}
              >
                L
              </div>
            </div>
            <div className="addToCart flex flex-col sm:flex-row md:flex-col lg:flex-row space-y-4 sm:space-y-0 mb-4">
              <div className={`plusOrMinus h-12 flex border justify-center border-gray300 divide-x-2 divide-gray300 mb-4 mr-0 sm:mr-4 md:mr-0 lg:mr-4 ${branchStock !== undefined && branchStock !== null && branchStock === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                <div
                  onClick={() => setCurrentQty((prevState) => prevState - 1)}
                  className={`${
                    currentQty === 1 && "pointer-events-none"
                  } h-full w-full sm:w-12 flex justify-center items-center cursor-pointer hover:bg-gray500 hover:text-gray100`}
                >
                  -
                </div>
                <div className="h-full w-28 sm:w-12 flex justify-center items-center pointer-events-none">
                  {currentQty}
                </div>
                {(() => {
                  const max = typeof branchStock === 'number' ? branchStock : undefined;
                  const disabled = typeof max === 'number' && currentQty >= max;
                  return (
                    <div
                      onClick={() => { if (!disabled) setCurrentQty((prevState) => prevState + 1); }}
                      className={`h-full w-full sm:w-12 flex justify-center items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray500 hover:text-gray100'}`}
                    >
                      +
                    </div>
                  );
                })()}
              </div>
              <div className="flex h-12 space-x-4 w-full">
                {branchStock !== undefined && branchStock !== null && branchStock === 0 ? (
                  <div className="flex-grow flex items-center justify-center bg-gray200 text-gray500 font-semibold text-lg border border-gray300">
                    Out of Stock
                  </div>
                ) : (
                  <Button
                    value={t("add_to_cart")}
                    size="lg"
                    extraClass={`flex-grow text-center whitespace-nowrap`}
                    onClick={() => addItem!(currentItem)}
                  />
                )}
                <GhostButton onClick={handleWishlist}>
                  {alreadyWishlisted ? (
                    <HeartSolid extraClass="inline" />
                  ) : (
                    <Heart extraClass="inline" />
                  )}
                </GhostButton>
              </div>
            </div>
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="py-2 focus:outline-none text-left mb-4 border-b-2 border-gray200 flex items-center justify-between">
                    <span>{t("details")}</span>
                    <DownArrow
                      extraClass={`${
                        open ? "" : "transform rotate-180"
                      } w-5 h-5 text-purple-500`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel
                    className={`text-gray400 animate__animated animate__bounceIn`}
                  >
                    {product.detail}
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
            <div className="flex items-center space-x-4 mt-4">
              <span>{t("share")}</span>
              <FacebookLogo extraClass="h-4 cursor-pointer text-gray400 hover:text-gray500" />
              <InstagramLogo extraClass="h-4 cursor-pointer text-gray400 hover:text-gray500" />
            </div>
          </div>
        </div>
        {/* ===== Horizontal Divider ===== */}
        <div className="border-b-2 border-gray200"></div>

        {/* ===== You May Also Like Section ===== */}
        <div className="recSection my-8 app-max-width app-x-padding">
          <h2 className="text-3xl mb-6">{t("you_may_also_like")}</h2>
          <Swiper
            slidesPerView={2}
            // centeredSlides={true}
            spaceBetween={10}
            loop={true}
            grabCursor={true}
            pagination={{
              clickable: true,
              type: "bullets",
            }}
            className="mySwiper card-swiper sm:hidden"
          >
            {products.map((item) => (
              <SwiperSlide key={item.id}>
                <div className="mb-6">
                  <Card key={item.id} item={item} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-10 sm:gap-y-6 mb-10">
            {products.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
        </div>
      </main>

      {/* ===== Footer Section ===== */}
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params, locale, req }) => {
  const paramId = params!.id as string;
  try {
    // Get branch_id from cookies
    const cookies = req.headers.cookie || "";
    const branchMatch = cookies.match(/branch_id=([^;]+)/);
    const branchId = branchMatch ? branchMatch[1] : undefined;

    const res = await api.get(`/api/v1/products/${paramId}`, {
      params: branchId ? { branch_id: branchId } : undefined,
    });
    const p: any = res.data;

    const product: itemType = {
      id: p.id,
      name: p.name,
      price: Number(p.price ?? 0),
      detail: p.description ?? "",
      img1: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "",
      img2: Array.isArray(p.images) && p.images.length > 1 ? p.images[1] : "",
      categoryName: p?.category?.name ?? "",
      branch_stock: p.branch_stock !== undefined ? p.branch_stock : null,
    };

    // Related products (simple: take first 5 from list)
    let products: itemType[] = [];
    try {
      const listRes = await api.get(`/api/v1/products`, {
        params: branchId ? { branch_id: branchId } : undefined,
      });
      const list: any[] = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.data || []);
      products = list.slice(0, 5).map((rp: any) => ({
        id: rp.id,
        name: rp.name,
        price: Number(rp.price ?? 0),
        img1: Array.isArray(rp.images) && rp.images.length > 0 ? rp.images[0] : "",
        img2: Array.isArray(rp.images) && rp.images.length > 1 ? rp.images[1] : "",
        branch_stock: rp.branch_stock !== undefined ? rp.branch_stock : null,
      }));
    } catch (err) {
      console.error("Related products fetch failed", err);
      products = [];
    }

    const loc = typeof locale === 'string' && locale ? locale : 'en';
    return {
      props: {
        product,
        products,
        messages: (await import(`../../messages/common/${loc}.json`)).default,
      },
    };
  } catch (err: any) {
    console.error("Product fetch failed", {
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return { notFound: true };
  }
};

export default Product;
