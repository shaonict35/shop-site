import { redirect } from "next/navigation";

// Redirect /admin to /valobasa
export default function AdminPageRedirect() {
  redirect("/valobasa");
}
