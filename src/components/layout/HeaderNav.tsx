import Link from "next/link";

interface NavItem { label: string; href: string; }

export function HeaderNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="hidden lg:flex items-center gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="px-4 py-2 text-[#4A4A4A] hover:text-[#C41E3A] font-medium text-sm transition-colors rounded-lg hover:bg-gray-50"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}