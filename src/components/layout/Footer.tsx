import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Prasad Kavuri</p>
        <div className="flex gap-6">
          <Link href="https://linkedin.com/in/pkavuri" target="_blank" className="hover:text-foreground">
            LinkedIn
          </Link>
          <Link href="https://github.com/prasad-kavuri" target="_blank" className="hover:text-foreground">
            GitHub
          </Link>
          <Link href="mailto:vbkavuri@gmail.com" className="hover:text-foreground">
            Email
          </Link>
        </div>
      </div>
    </footer>
  );
}