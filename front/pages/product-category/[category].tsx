import Link from "next/link";
import axios from "axios";
import { api } from "../../lib/api";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { Menu } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";

import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Card from "../../components/Card/Card";
import Pagination from "../../components/Util/Pagination";
import { apiProductsType, itemType } from "../../context/cart/cart-types";
import DownArrow from "../../public/icons/DownArrow";
import { getPusher } from "../../lib/pusher";

type OrderType = "latest" | "price" | "price-desc";

type Props = {
  items: itemType[];
  page: number;
  numberOfProducts: number;
  orderby: OrderType;
};

const ProductCategory: React.FC<Props> = ({
  items,
  page,
  numberOfProducts,
  orderby,
}) => {
  const t = useTranslations("Category");

  const router = useRouter();
  const { category } = router.query;
  const lastPage = Math.ceil(numberOfProducts / 10);

  const [currentItems, setCurrentItems] = useState(items);

  useEffect(() => {
    setCurrentItems(items);
  }, [items]);

  useEffect(() => {
    const refetch = async () => {
      try {
        const branchId = getCookie("branch_id");
        const params: any =
          category === "new-arrivals"
            ? { order_by: "createdAt.desc", limit: 10 }
            : {
                order_by: orderby === "price" ? "price" : orderby === "price-desc" ? "price.desc" : "createdAt.desc",
                offset: page === 1 ? 0 : (page - 1) * 10,
                limit: 10,
                category,
              };
        if (branchId) params.branch_id = branchId;
        const res = await api.get(`/api/v1/products`, { params });
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const mapped = list.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price ?? 0),
          img1: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image1 || ""),
          img2: Array.isArray(p.images) && p.images.length > 1 ? p.images[1] : (p.image2 || ""),
          categoryName: p?.category?.name ?? "",
          branch_stock: p.branch_stock !== undefined ? p.branch_stock : null,
        }));
        setCurrentItems(mapped);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Category branch change refetch failed", e);
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
  }, [category, orderby, page]);

  // Realtime: refresh category list when products update
  useEffect(() => {
    let subscribed = true;
    let channel: any = null;
    let pusher: any = null;
    (async () => {
      try {
        pusher = await getPusher();
        if (!pusher) {
          console.warn('Pusher not available for category page');
          return;
        }
        channel = pusher.subscribe('products');
        console.log('Subscribed to products channel (category page)');
        const refetch = async () => {
          try {
            const branchId = getCookie("branch_id");
            const params: any =
              category === "new-arrivals"
                ? { order_by: "createdAt.desc", limit: 10 }
                : {
                    order_by: orderby === "price" ? "price" : orderby === "price-desc" ? "price.desc" : "createdAt.desc",
                    offset: page === 1 ? 0 : (page - 1) * 10,
                    limit: 10,
                    category,
                  };
            if (branchId) params.branch_id = branchId;
            const res = await api.get(`/api/v1/products`, { params });
            if (!subscribed) return;
            const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            const mapped = list.map((p: any) => ({
              id: p.id,
              name: p.name,
              price: Number(p.price ?? 0),
              img1: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image1 || ""),
              img2: Array.isArray(p.images) && p.images.length > 1 ? p.images[1] : (p.image2 || ""),
              categoryName: p?.category?.name ?? "",
              branch_stock: p.branch_stock,
            }));
            setCurrentItems(mapped);
          } catch (_) {}
        };
        channel.bind('product.updated', (data: any) => {
          console.log('Product updated event received:', data);
          refetch();
        });
        channel.bind('product.created', (data: any) => {
          console.log('Product created event received:', data);
          console.log('New product added by admin - refreshing category list');
          refetch();
        });
        channel.bind('product.deleted', (data: any) => {
          console.log('Product deleted event received:', data);
          console.log('Product deleted by admin - refreshing category list');
          refetch();
        });
        channel.bind('product.stock.updated', (data: any) => {
          console.log('Product stock updated:', data);
          console.log('Stock changed - refreshing category list');
          refetch();
        });
      } catch (_) {}
    })();
    return () => {
      subscribed = false;
      try { if (channel) channel.unbind_all(); } catch {}
      try { if (pusher) pusher.disconnect(); } catch {}
    };
  }, [category, orderby, page]);

  const capitalizedCategory =
    category!.toString().charAt(0).toUpperCase() +
    category!.toString().slice(1);

  const firstIndex = page === 1 ? page : page * 10 - 9;
  const lastIndex = page * 10;

  return (
    <div>
      {/* ===== Head Section ===== */}
      <Header title={`${capitalizedCategory} - Haru Fashion`} />

      <main id="main-content">
        {/* ===== Breadcrumb Section ===== */}
        <div className="bg-lightgreen h-16 w-full flex items-center">
          <div className="app-x-padding app-max-width w-full">
            <div className="breadcrumb">
              <Link href="/">
                <a className="text-gray400">{t("home")}</a>
              </Link>{" "}
              / <span className="capitalize">{t(category as string)}</span>
            </div>
          </div>
        </div>

        {/* ===== Heading & Filter Section ===== */}
        <div className="app-x-padding app-max-width w-full mt-8">
          <h3 className="text-4xl mb-2 capitalize">{t(category as string)}</h3>
          <div className="flex flex-col-reverse sm:flex-row gap-4 sm:gap-0 justify-between mt-4 sm:mt-6">
            <span>
              {t("showing_from_to", {
                from: firstIndex,
                to: numberOfProducts < lastIndex ? numberOfProducts : lastIndex,
                all: numberOfProducts,
              })}
            </span>
            {category !== "new-arrivals" && <SortMenu orderby={orderby} />}
          </div>
        </div>

        {/* ===== Main Content Section ===== */}
        <div className="app-x-padding app-max-width mt-3 mb-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-10 sm:gap-y-6 mb-10">
            {currentItems.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
          {category !== "new-arrivals" && (
            <Pagination
              currentPage={page}
              lastPage={lastPage}
              orderby={orderby}
            />
          )}
        </div>
      </main>

      {/* ===== Footer Section ===== */}
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({
  params,
  locale,
  query: { page = 1, orderby = "latest" },
  req,
}) => {
  const paramCategory = params!.category as string;
  const start = +page === 1 ? 0 : (+page - 1) * 10;

  // Get branch_id from cookies
  const cookies = req.headers.cookie || "";
  const branchMatch = cookies.match(/branch_id=([^;]+)/);
  const branchId = branchMatch ? branchMatch[1] : undefined;

  let numberOfProducts = 0;
  try {
    if (paramCategory !== "new-arrivals") {
      const numberOfProductsResponse = await api.get(
        `/api/v1/products/count`,
        { params: { category: paramCategory } }
      );
      numberOfProducts = +numberOfProductsResponse.data.count;
    } else {
      numberOfProducts = 10;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Category count fetch failed", err);
    numberOfProducts = 0;
  }

  let order_by: string;
  if (orderby === "price") {
    order_by = "price";
  } else if (orderby === "price-desc") {
    order_by = "price.desc";
  } else {
    order_by = "createdAt.desc";
  }

  try {
    const res = await api.get(`/api/v1/products`, {
      params:
        paramCategory === "new-arrivals"
          ? { 
              order_by: "createdAt.desc", 
              limit: 10,
              ...(branchId ? { branch_id: branchId } : {}),
            }
          : {
              order_by,
              offset: start,
              limit: 10,
              category: paramCategory,
              ...(branchId ? { branch_id: branchId } : {}),
            },
    });
    
    // Handle both array response and data.data response
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    
    const items: itemType[] = list.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price ?? 0),
      img1: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image1 || ""),
      img2: Array.isArray(p.images) && p.images.length > 1 ? p.images[1] : (p.image2 || ""),
      categoryName: p?.category?.name ?? "",
      branch_stock: p.branch_stock !== undefined ? p.branch_stock : null,
    }));

    const loc = typeof locale === 'string' && locale ? locale : 'en';
    return {
      props: {
        messages: (await import(`../../messages/common/${loc}.json`)).default,
        items,
        numberOfProducts,
        page: +page,
        orderby,
      },
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Category products fetch failed", err);
    const loc = typeof locale === 'string' && locale ? locale : 'en';
    return {
      props: {
        messages: (await import(`../../messages/common/${loc}.json`)).default,
        items: [],
        numberOfProducts,
        page: +page,
        orderby,
      },
    };
  }
};

const SortMenu: React.FC<{ orderby: OrderType }> = ({ orderby }) => {
  const t = useTranslations("Navigation");
  const router = useRouter();
  const { category } = router.query;

  let currentOrder: string;

  if (orderby === "price") {
    currentOrder = "sort_by_price";
  } else if (orderby === "price-desc") {
    currentOrder = "sort_by_price_desc";
  } else {
    currentOrder = "sort_by_latest";
  }
  return (
    <Menu as="div" className="relative">
      <Menu.Button as="a" href="#" className="flex items-center capitalize">
        {t(currentOrder)} <DownArrow />
      </Menu.Button>
      <Menu.Items className="flex flex-col z-10 items-start text-xs sm:text-sm w-auto sm:right-0 absolute p-1 border border-gray200 bg-white mt-2 outline-none">
        <Menu.Item>
          {({ active }) => (
            <button
              type="button"
              onClick={() =>
                router.push(`/product-category/${category}?orderby=latest`)
              }
              className={`${
                active ? "bg-gray100 text-gray500" : "bg-white"
              } py-2 px-4 text-left w-full focus:outline-none whitespace-nowrap ${
                currentOrder === "sort_by_latest" && "bg-gray500 text-gray100"
              }`}
            >
              {t("sort_by_latest")}
            </button>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <button
              type="button"
              onClick={() =>
                router.push(`/product-category/${category}?orderby=price`)
              }
              className={`${
                active ? "bg-gray100 text-gray500" : "bg-white"
              } py-2 px-4 text-left w-full focus:outline-none whitespace-nowrap ${
                currentOrder === "sort_by_price" && "bg-gray500 text-gray100"
              }`}
            >
              {t("sort_by_price")}
            </button>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <button
              type="button"
              onClick={() =>
                router.push(`/product-category/${category}?orderby=price-desc`)
              }
              className={`${
                active ? "bg-gray100 text-gray500" : "bg-white"
              } py-2 px-4 text-left w-full focus:outline-none whitespace-nowrap ${
                currentOrder === "sort_by_price_desc" &&
                "bg-gray500 text-gray100"
              }`}
            >
              {t("sort_by_price_desc")}
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
};

export default ProductCategory;
