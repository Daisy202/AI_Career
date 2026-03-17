import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button, Input, Label } from "./ui-elements";
import { useLoginUser, useRegisterUser } from "@workspace/api-client-react";
import { useCareerStore } from "@/store/use-career-store";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  school: z.string().optional(),
  level: z.string().optional(),
});

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { toast } = useToast();
  const setUser = useCareerStore((state) => state.setUser);
  
  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", school: "", level: "" },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        setUser(res.user);
        onOpenChange(false);
        toast({ title: "Success", description: "Logged in successfully" });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.data?.error || "Login failed", variant: "destructive" });
      }
    });
  };

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        setUser(res.user);
        onOpenChange(false);
        toast({ title: "Success", description: "Registered successfully" });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.data?.error || "Registration failed", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Welcome to CareerGuideZW</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" {...loginForm.register("email")} />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" {...loginForm.register("password")} />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Full Name</Label>
                <Input id="reg-name" {...registerForm.register("name")} />
                {registerForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" {...registerForm.register("email")} />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input id="reg-password" type="password" {...registerForm.register("password")} />
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-school">School (Optional)</Label>
                <Input id="reg-school" {...registerForm.register("school")} />
              </div>
              <div className="space-y-2">
                <Label>Level (Optional)</Label>
                <Select onValueChange={(v) => registerForm.setValue("level", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Form 4">Form 4</SelectItem>
                    <SelectItem value="Form 6">Form 6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}