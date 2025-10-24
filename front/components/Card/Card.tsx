import { FC, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { resolveImageUrl } from "../../lib/images";
import { useTranslations } from "next-intl";

import Heart from "../../public/icons/Heart";
import styles from "./Card.module.css";
import HeartSolid from "../../public/icons/HeartSolid";
import { itemType } from "../../context/cart/cart-types";
import { useCart } from "../../context/cart/CartProvider";
import { useWishlist } from "../../context/wishlist/WishlistProvider";

type Props = {
  item: itemType;
};

const Card: FC<Props> = ({ item }) => {
  const t = useTranslations("CartWishlist");
  const { wishlist, addToWishlist, deleteWishlistItem } = useWishlist();
  const { addOne } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [err1, setErr1] = useState(false);
  const [err2, setErr2] = useState(false);
  const [isWLHovered, setIsWLHovered] = useState(false);

  const { id, name, price, img1, img2, branch_stock } = item;
  const src1 = resolveImageUrl(img1 as string);
  const src2 = resolveImageUrl(img2 as string);

  const itemLink = `/products/${encodeURIComponent(id)}`;

  const alreadyWishlisted =
    wishlist.filter((wItem) => wItem.id === id).length > 0;

  // Check if product is out of stock at selected branch
  const isOutOfStock = branch_stock !== undefined && branch_stock !== null && branch_stock === 0;

  const handleWishlist = () => {
    alreadyWishlisted ? deleteWishlistItem!(item) : addToWishlist!(item);
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <Link href={itemLink}>
          <a
            tabIndex={-1}
            onMouseOver={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {!isHovered && src1 && (
              <Image
                src={src1}
                alt={name}
                width={230}
                height={300}
                layout="responsive"
                unoptimized
                onError={() => setErr1(true)}
              />
            )}
            {isHovered && src2 && (
              <Image
                className="transition-transform transform hover:scale-110 duration-1000"
                src={src2}
                alt={name}
                width={230}
                height={300}
                layout="responsive"
                unoptimized
                onError={() => setErr2(true)}
              />
            )}
            {!isHovered && (!src1 || err1) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/og.png" alt={name} style={{ width: '100%', height: 'auto' }} />
            )}
            {isHovered && (!src2 || err2) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/og.png" alt={name} style={{ width: '100%', height: 'auto' }} />
            )}
          </a>
        </Link>
        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-gray500 text-white px-3 py-1 rounded text-sm font-semibold">
            Out of Stock
          </div>
        )}
        <button
          type="button"
          className="absolute top-2 right-2 p-1 rounded-full"
          aria-label="Wishlist"
          onClick={handleWishlist}
          onMouseOver={() => setIsWLHovered(true)}
          onMouseLeave={() => setIsWLHovered(false)}
        >
          {isWLHovered || alreadyWishlisted ? <HeartSolid /> : <Heart />}
        </button>
        {!isOutOfStock && (
          <button
            type="button"
            onClick={() => addOne!(item)}
            className={styles.addBtn}
          >
            {t("add_to_cart")}
          </button>
        )}
      </div>

      <div className="content">
        <Link href={itemLink}>
          <a className={styles.itemName}>{name}</a>
        </Link>
        <div className="text-gray400">$ {price}</div>
        {!isOutOfStock && (
          <button
            type="button"
            onClick={() => addOne!(item)}
            className="uppercase font-bold text-sm sm:hidden"
          >
            {t("add_to_cart")}
          </button>
        )}
      </div>
    </div>
  );
};

export default Card;
