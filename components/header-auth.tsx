import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { LogOutIcon } from "lucide-react";

import { createClient } from "@/utils/supabase/server";

export default async function AuthButton() {
  const {
    data: { user },
  } = await createClient().auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      Hey, <Link href={'/protected'} className="hover:underline">{user.email}!</Link> 
      <form action={signOutAction}>
      <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <LogOutIcon size="16" />
                  Sign Out
                  </Button>
      </form> 
    
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      {/* <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Sign up</Link>
      </Button> */}
    </div>
  );
}
