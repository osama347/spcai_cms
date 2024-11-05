import { createClient } from "@/utils/supabase/server";
import {
  InfoIcon,
  UserIcon,
  UsersIcon,
  MailIcon,
  KeyIcon,
  CalendarIcon,
  MoveRight,
  
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Signup from "@/components/Signup";
import { signOutAction } from "../actions";

export default async function UserProfile() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const getInitials = (email: string): string => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };
  

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto py-8 px-4">
      <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 transition duration-200">
  <span className="mr-2">Go to Dashboard</span>
  <MoveRight />
</Link>
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <InfoIcon size="24" className="text-primary" />
            <p className="text-lg font-medium">
              Welcome to your protected user profile page
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <Avatar className="w-24 h-24 text-2xl font-bold">
            <AvatarFallback>{getInitials(user.email || "default@example.com")}</AvatarFallback>

            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {user.email ? user.email.split("@")[0] : "No email available"}
              </h1>
              <p className="text-muted-foreground mb-4">{user.email}</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <MailIcon size="16" />
                  Update Email
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <KeyIcon size="16" />
                  Change Password
                </Button>
                {/* <form action={signOutAction}>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <LogOutIcon size="16" />
                  Sign Out
                  </Button>
                  </form> */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="signup">Sign Up Another User</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon size="24" />
                Your Profile Details
              </CardTitle>
              <CardDescription>
                View and manage your account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={user.id}
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastSignIn">Last Sign In</Label>
                  <Input
                    id="lastSignIn"
                    value={
                      user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString()
                        : "No sign-in data available"
                    }
                    readOnly
                  />
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon size="16" className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Account created on{" "}
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon size="24" />
                Sign Up Another User
              </CardTitle>
              <CardDescription>
                Create a new account for another user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Signup />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
