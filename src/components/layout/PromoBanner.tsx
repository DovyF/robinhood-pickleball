/** Small promo strip shown at the very top of every store page (not checkout). */
export function PromoBanner() {
  return (
    <div className="bg-gold-400 px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-[#0d0d0d]">
      Apply code <span className="font-bold">LONGBOW</span> at checkout to get <span className="font-bold">25% off</span>
    </div>
  );
}
