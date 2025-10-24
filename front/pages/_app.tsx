import { NextComponentType, NextPageContext } from "next";
import { useEffect } from "react";
import Router from "next/router";
import NProgress from "nprogress";
import { NextIntlProvider } from "next-intl";

import { ProvideCart } from "../context/cart/CartProvider";
import { ProvideWishlist } from "../context/wishlist/WishlistProvider";
import { ProvideAuth } from "../context/AuthContext";
import { ProvideAdminAuth } from "../context/AdminAuthContext";
import { getCookie, setCookie } from "cookies-next";
import { api } from "../lib/api";

import "../styles/globals.css";
import "animate.css";
import "nprogress/nprogress.css";

// Import Swiper styles
import "swiper/swiper.min.css";
import "swiper/components/navigation/navigation.min.css";
import "swiper/components/pagination/pagination.min.css";
import "swiper/components/scrollbar/scrollbar.min.css";

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

type AppCustomProps = {
  Component: NextComponentType<NextPageContext, any, {}>;
  pageProps: any;
  cartState: string;
  wishlistState: string;
};

const MyApp = ({ Component, pageProps }: AppCustomProps) => {
  // Ensure a default branch is selected for guests
  useEffect(() => {
    const ensureDefaultBranch = async () => {
      try {
        const existing = getCookie("branch_id");
        if (existing) return;
        const res = await api.get(`/api/v1/branches`);
        const list: Array<{ id: number; name?: string }> = Array.isArray(res.data) ? res.data : [];
        if (list.length > 0) {
          const main = list.find((b) => {
            const n = String(b.name || '').toLowerCase().trim();
            return n === 'main' || n === 'main branch' || n === 'default' || n === 'primary';
          });
          const defaultId = (main?.id ?? list[0].id);
          setCookie("branch_id", String(defaultId), { path: "/" });
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("branch-changed", { detail: { branch_id: defaultId } }));
          }
        }
      } catch (_e) {
        // silently ignore
      }
    };
    ensureDefaultBranch();
  }, []);

  return (
    <NextIntlProvider messages={pageProps?.messages}>
      <ProvideAuth>
        <ProvideAdminAuth>
          <ProvideWishlist>
            <ProvideCart>
              <Component {...pageProps} />
            </ProvideCart>
          </ProvideWishlist>
        </ProvideAdminAuth>
      </ProvideAuth>
    </NextIntlProvider>
  );
};

export default MyApp;
