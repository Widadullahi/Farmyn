export default function BrandLogo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-2.5">
      <span className={inverse ? "rounded-xl bg-white p-1" : ""}>
        <svg aria-hidden="true" viewBox="205 160 102 96" className="h-11 w-12 shrink-0 overflow-hidden">
          <image href="/farmyn-logo.png" width="512" height="512" />
        </svg>
      </span>
      <span>
        <span className={`block font-display text-[28px] font-bold leading-none tracking-tight ${inverse ? "text-white" : "text-[#104f3c]"}`}>
          Farm<span className={inverse ? "text-[#a6d982]" : "text-[#438823]"}>yn</span>
        </span>
        <span className={`mt-1.5 block text-[9px] font-semibold tracking-[0.1em] ${inverse ? "text-white/75" : "text-[#4d6257]"}`}>FRESH FROM THE FARM</span>
      </span>
    </span>
  );
}
