// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const discounts = [];
  input.cart.lines.forEach((line) => {
    // Assert that merchandise is of type ProductVariant
    const productVariant = line.merchandise;

    if (productVariant.__typename === "ProductVariant") {
      const discount = getDiscounts(productVariant.metafield, line.quantity);

      if (discount != null) {
        discounts.push({
          targets: [
            {
              productVariant: { id: productVariant.id },
            },
          ],
          value: {
            fixedAmount: { amount: discount },
          },
          message: "(Bulk Order Discount: -$" + discount.toFixed(2) + ")",
        });
      }
    }
  });
  return {
    discountApplicationStrategy: DiscountApplicationStrategy.All,
    discounts: discounts,
  };
}

function getDiscounts(meta, quantity) {
  if (meta?.value == undefined || meta.value.split(",").length == 1) {
    return null;
  }

  let orig_price = 0;

  let price = meta.value.split(",").reduce((accumulator, item) => {
    let qb_qty = parseFloat(item.split(";")[0]);
    let qb_price = parseFloat(item.split(";")[1]);

    if (qb_qty == 0) {
      orig_price = qb_price;
    }

    if (quantity >= qb_qty) {
      accumulator = qb_price;
    }
    return accumulator;
  }, 0);

  if (price == orig_price) {
    return null;
  }

  return (orig_price - price) * quantity;
}