import Image from "next/image";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
  size?: number;
};

export function AppLogo({ className, size = 40 }: AppLogoProps) {
  return (
    <Image
      src="/Logo.png"
      alt="Tool Tracker"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      priority
    />
  );
}
