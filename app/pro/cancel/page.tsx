import Link from "next/link";
import { XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function ProCancelPage() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border bg-card p-6 text-center shadow-soft">
      <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
      <h1 className="text-3xl font-black">Подключение отменено</h1>
      <p className="mt-2 text-muted-foreground">Про не был активирован. Можно вернуться и попробовать снова.</p>
      <Link href="/pro" className={buttonVariants({ className: "mt-5" })}>
        Вернуться к Про
      </Link>
    </div>
  );
}
