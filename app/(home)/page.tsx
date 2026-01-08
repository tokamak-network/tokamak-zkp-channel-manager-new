/**
 * Home Page
 *
 * Redirects to create-channel
 */

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/create-channel");
}
