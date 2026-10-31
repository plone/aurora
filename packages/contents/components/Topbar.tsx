export default function Topbar({ children }: { children: React.ReactNode }) {
  return (
    <section
      className={`
        topbar sticky top-0 z-1 mb-6 flex w-full flex-wrap items-end gap-4 bg-background py-2
        lg:flex-nowrap
      `}
    >
      {children}
    </section>
  );
}
