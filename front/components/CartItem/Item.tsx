import Image from "next/image";
import React, { FC } from "react";
import { resolveImageUrl } from "../../lib/images";
import { roundDecimal } from "../Util/utilFunc";

type Props = {
  img: string;
  name: string;
  price: number;
  qty: number;
  onAdd?: () => void;
  onRemove?: () => void;
  onDelete?: () => void;
  canAddMore?: boolean;
};

const Item: FC<Props> = ({
  img,
  name,
  price,
  qty,
  onAdd,
  onRemove,
  onDelete,
  canAddMore = true,
}) => {
  const src = resolveImageUrl(img as string);
  return (
    <div className="item flex bg-white my-4 border-b-2 pb-4 border-gray200">
      {src ? (
        <Image className="w-2/12" src={src} alt={name} width={70} height={104} unoptimized />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="w-2/12" src="/og.png" alt={name} width={70} height={104} />
      )}
      <div className="midPart mx-4 flex-grow">
        <span>{name}</span>
        <div className="plusOrMinus w-2/6 mt-4 flex border border-gray300 divide-x-2 divide-gray300">
          <div
            onClick={onRemove}
            className="h-full w-12 flex justify-center items-center cursor-pointer hover:bg-gray500 hover:text-gray100"
          >
            -
          </div>
          <div className="h-full w-12 flex justify-center items-center pointer-events-none">
            {qty}
          </div>
          <div
            onClick={() => { if (canAddMore && onAdd) onAdd(); }}
            className={`h-full w-12 flex justify-center items-center ${canAddMore ? 'cursor-pointer hover:bg-gray500 hover:text-gray100' : 'opacity-50 cursor-not-allowed'}`}
          >
            +
          </div>
        </div>
      </div>
      <div className="lastPart flex flex-col items-end">
        <button
          onClick={onDelete}
          type="button"
          className="outline-none text-gray300 hover:text-gray500 focus:outline-none text-xl mb-3"
        >
          &#10005;
        </button>
        <span>$ {roundDecimal(price)}</span>
      </div>
    </div>
  );
};

export default Item;
