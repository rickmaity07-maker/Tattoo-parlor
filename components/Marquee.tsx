"use client";

export default function Marquee() {
  // Remove the loud outlined marquee — replace with a quiet divider moment
  return (
    <div className="relative z-10 flex items-center justify-center py-20 md:py-28">
      <div className="h-px w-16 bg-[#E8E0D4]/15" />
    </div>
  );
}
