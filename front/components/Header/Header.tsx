import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

import TopNav from "./TopNav";
import WhistlistIcon from "../../public/icons/WhistlistIcon";
import UserIcon from "../../public/icons/UserIcon";
import AuthForm from "../Auth/AuthForm";
import SearchForm from "../SearchForm/SearchForm";
import CartItem from "../CartItem/CartItem";
import Menu from "../Menu/Menu";
import UserMenu from "./UserMenu";
import AppHeader from "./AppHeader";
import { useWishlist } from "../../context/wishlist/WishlistProvider";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

import styles from "./Header.module.css";

type Props = {
  title?: string;
};

const Header: React.FC<Props> = ({ title }) => {
  const t = useTranslations("Navigation");
  const { wishlist } = useWishlist();
  const { user } = useAuth();
  const [animate, setAnimate] = useState("");
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [didMount, setDidMount] = useState<boolean>(false); // to disable Can't perform a React state Warning
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);

  // Calculate Number of Wishlist
  let noOfWishlist = wishlist.length;

  // Animate Wishlist Number
  const handleAnimate = useCallback(() => {
    if (noOfWishlist === 0) return;
    setAnimate("animate__animated animate__headShake");
  }, [noOfWishlist, setAnimate]);

  // Set animate when no of wishlist changes
  useEffect(() => {
    handleAnimate();
    setTimeout(() => {
      setAnimate("");
    }, 1000);
  }, [handleAnimate]);

  const handleScroll = useCallback(() => {
    const offset = window.scrollY;
    if (offset > 30) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  }, [setScrolled]);

  useEffect(() => {
    setDidMount(true);
    window.addEventListener("scroll", handleScroll);
    const loadCategories = async () => {
      try {
        const res = await api.get(`/api/v1/categories`);
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setCategories(list);
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    };
    loadCategories();
    return () => setDidMount(false);
  }, [handleScroll]);

  if (!didMount) {
    return null;
  }
  return (
    <>
      {/* ===== <head> section ===== */}
      <AppHeader title={title} />

      {/* ===== Skip to main content button ===== */}
      <a
        href="#main-content"
        className="whitespace-nowrap absolute z-50 left-4 opacity-90 rounded-md bg-white px-4 py-3 transform -translate-y-40 focus:translate-y-0 transition-all duration-300"
      >
        {t("skip_to_main_content")}
      </a>

      {/* ===== Top Navigation ===== */}
      <TopNav />

      {/* ===== Main Navigation ===== */}
      <nav
        className={`${
          scrolled ? "bg-white sticky top-0 shadow-md z-50" : "bg-transparent"
        } w-full z-50 h-20 relative`}
      >
        <div className="app-max-width w-full">
          <div
            className={`flex justify-between align-baseline app-x-padding ${styles.mainMenu}`}
          >
            {/* Hamburger Menu (now visible on desktop too) */}
            <div className="flex-1 lg:flex-0">
              <Menu />
            </div>

            {/* Left Nav */}
            <ul className={`flex-0 lg:flex-1 flex ${styles.leftMenu}`}>
              {categories.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link href={`/product-category/${c.slug}`}>
                    <a>{c.name}</a>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Haru Logo */}
            <div className="flex-1 flex justify-center items-center cursor-pointer">
              <div className="w-32 h-auto">
                <Link href="/">
                  <a>
                    <Image
                      className="justify-center"
                      src="/logo.svg"
                      alt="Picture of the author"
                      width={220}
                      height={50}
                      layout="responsive"
                    />
                  </a>
                </Link>
              </div>
            </div>

            {/* Right Nav */}
            <ul className={`flex-1 flex justify-end ${styles.rightMenu}`}>
              <li>
                <SearchForm />
              </li>
              <li>
                {user ? (
                  <UserMenu />
                ) : (
                  <AuthForm>
                    <UserIcon />
                  </AuthForm>
                )}
              </li>
              <li>
                <Link href="/wishlist" passHref>
                  {/* <a className="relative" aria-label="Wishlist"> */}
                  <button
                    type="button"
                    className="relative"
                    aria-label="Wishlist"
                  >
                    <WhistlistIcon />
                    {noOfWishlist > 0 && (
                      <span
                        className={`${animate} absolute text-xs -top-3 -right-3 bg-gray500 text-gray100 py-1 px-2 rounded-full`}
                      >
                        {noOfWishlist}
                      </span>
                    )}
                  </button>
                  {/* </a> */}
                </Link>
              </li>
              <li>
                <CartItem />
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
