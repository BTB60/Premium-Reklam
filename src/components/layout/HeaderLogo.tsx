import Link from "next/link";

export function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 flex-shrink-0">
      <img
        src="/Backup_of_YENILOGO.svg"
        alt="Premium Reklam"
        className="h-10 w-auto object-contain"
      />
    </Link>
  );
}