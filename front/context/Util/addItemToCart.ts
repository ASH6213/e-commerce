import { itemType } from "../cart/cart-types";

const addItemToCart = (
  cartItems: itemType[],
  item: itemType,
  add_one = false
) => {
  const duplicate = cartItems.some((cartItem) => cartItem.id === item.id);

  if (duplicate) {
    return cartItems.map((cartItem) => {
      if (cartItem.id === item.id) {
        let itemQty = 0;
        !item.qty || add_one
          ? (itemQty = cartItem.qty! + 1)
          : (itemQty = cartItem.qty! + item.qty!);

        // Update all fields from new item, not just quantity
        return {
          ...cartItem,
          name: item.name || cartItem.name,
          price: item.price || cartItem.price,
          img1: item.img1 || cartItem.img1,
          img2: item.img2 || cartItem.img2,
          qty: itemQty,
        };
      }
      return cartItem;
    });
  }
  // console.log(itemQty);
  let itemQty = 0;
  !item.qty ? itemQty++ : (itemQty = item.qty);
  return [
    ...cartItems,
    {
      id: item.id,
      name: item.name,
      price: item.price,
      img1: item.img1,
      img2: item.img2,
      qty: itemQty,
    },
  ];
};

export default addItemToCart;
