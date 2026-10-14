import CartClient from './CartClient';

export default function CartPage() {
  return <CartClient />;
}

import type { Metadata } from "next";
import { pageMetadata } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Your shopping cart",
  description: "Review your OneStop Life cart and check out securely with cash on delivery or online payment.",
  path: "/cart",
  noIndex: true,
});
