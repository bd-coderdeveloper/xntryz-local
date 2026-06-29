import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to dashboard home
  redirect("/home");
  return null;
}