export default function Footer() {
  return (
    <footer className="snap-section z-10 w-full border-t border-parchment/10 px-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <p className="font-display text-lg font-light tracking-wide text-parchment/50">Iron Rose</p>
        <div className="flex gap-10 text-[10px] uppercase tracking-[0.3em] text-parchment/35">
          <a href="#" className="cursor-none transition-opacity hover:opacity-70">Instagram</a>
          <a href="mailto:book@ironrose.studio" className="cursor-none transition-opacity hover:opacity-70">Email</a>
        </div>
        <p className="text-[10px] tracking-widest text-parchment/25">© 2026</p>
      </div>
    </footer>
  );
}