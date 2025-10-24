import { useCallback, useEffect, useState } from "react";
import { GetServerSideProps, GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslations } from "next-intl";

import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Card from "../components/Card/Card";
import Pagination from "../components/Util/Pagination";
import useWindowSize from "../components/Util/useWindowSize";
import { apiProductsType, itemType } from "../context/cart/cart-types";
import axios from "axios";
import { api } from "../lib/api";
import { getPusher } from "../lib/pusher";

type Props = {
  items: itemType[];
  searchWord: string;
};

const Search: React.FC<Props> = ({ items, searchWord }) => {
  const t = useTranslations("Search");
  const [currentItems, setCurrentItems] = useState(items);

  useEffect(() => {
    setCurrentItems(items);
  }, [items]);

  // Realtime: refresh search results when products update
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
            const res = await api.get(`/api/v1/products/search`, { params: { q: searchWord } });
            if (!subscribed) return;
            const fetchedProducts: apiProductsType[] = res.data.data.map(
              (product: apiProductsType) => ({
                ...product,
                img1: product.image1,
                img2: product.image2,
              })
            );
            let refreshedItems: apiProductsType[] = [];
            fetchedProducts.forEach((product: apiProductsType) => {
              refreshedItems.push(product);
            });
            setCurrentItems(refreshedItems);
          } catch (_) {}
        };
        channel.bind('product.updated', refetch);
        channel.bind('product.created', () => {
          console.log('New product added - refreshing search results');
          refetch();
        });
        channel.bind('product.deleted', () => {
          console.log('Product deleted - refreshing search results');
          refetch();
        });
        channel.bind('product.stock.updated', () => {
          console.log('Product stock updated - refreshing search results');
          refetch();
        });
      } catch (_) {}
    })();
    return () => {
      subscribed = false;
      try { if (channel) channel.unbind_all(); } catch {}
      try { if (pusher) pusher.disconnect(); } catch {}
    };
  }, [searchWord]);

  return (
    <div>
      {/* ===== Head Section ===== */}
      <Header title={`Haru Fashion`} />

      <main id="main-content">
        {/* ===== Breadcrumb Section ===== */}
        <div className="bg-lightgreen h-16 w-full flex items-center">
          <div className="app-x-padding app-max-width w-full">
            <div className="breadcrumb">
              <Link href="/">
                <a className="text-gray400">{t("home")}</a>
              </Link>{" "}
              / <span>{t("search_results")}</span>
            </div>
          </div>
        </div>

        {/* ===== Heading & Filter Section ===== */}
        <div className="app-x-padding app-max-width w-full mt-8">
          <h1 className="text-3xl mb-2">
            {t("search_results")}: &quot;{searchWord}&quot;
          </h1>
          {currentItems.length > 0 && (
            <div className="flex justify-between mt-6">
              <span>
                {t("showing_results", {
                  products: currentItems.length,
                })}
              </span>
            </div>
          )}
        </div>

        {/* ===== Main Content Section ===== */}
        <div className="app-x-padding app-max-width mt-3 mb-14">
          {currentItems.length < 1 ? (
            <div className="flex justify-center items-center h-72">
              {t("no_result")}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-10 sm:gap-y-6 mb-10">
              {currentItems.map((item) => (
                <Card key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ===== Footer Section ===== */}
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  query: { q = "" },
}) => {
  try {
    const res = await api.get(`/api/v1/products/search`, { params: { q } });
    const fetchedProducts: apiProductsType[] = res.data.data.map(
      (product: apiProductsType) => ({
        ...product,
        img1: product.image1,
        img2: product.image2,
      })
    );

    let items: apiProductsType[] = [];
    fetchedProducts.forEach((product: apiProductsType) => {
      items.push(product);
    });

    return {
      props: {
        messages: (await import(`../messages/common/${locale}.json`)).default,
        items,
        searchWord: q,
      },
    };
  } catch (err: any) {
    // Surface minimal info in logs during SSR; render gracefully
    // eslint-disable-next-line no-console
    console.error("Search SSR request failed", {
      status: err?.response?.status,
      data: err?.response?.data,
      url: err?.config?.url,
      params: err?.config?.params,
    });
    return {
      props: {
        messages: (await import(`../messages/common/${locale}.json`)).default,
        items: [],
        searchWord: q,
      },
    };
  }
};

export default Search;
