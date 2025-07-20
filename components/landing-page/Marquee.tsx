import { Marquee } from "@/components/magicui/marquee";
import { cn } from "@/lib/utils";
import Image from "next/image";

const logos = [
  { src: "/images/logo1.png", alt: "Arcane" },
  { src: "/images/logo2.png", alt: "Codelify" },
  { src: "/images/logo3.jpg", alt: "New Duet" },
  { src: "/images/logo4.jpg", alt: "Recycle" },
  { src: "/images/logo5.png", alt: "Protected" },
  { src: "/images/logo2.png", alt: "Techlify" },
  { src: "/images/logo1.png", alt: "Nectar" },
];

const MarqueeSection = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-[#FAFAFA] py-10">
      <p className="text-xs font-bold tracking-wider text-gray-400 dark:text-gray-500 mb-6">CLIENTS USING CROPDIRECT</p>
      <Marquee className="[--duration:25s]">
        {logos.map((logo, idx) => (
          <div key={idx} className="mx-6">
            <Image
              src={logo.src}
              alt={logo.alt}
              width={120}
              height={48}
              className="object-contain filter grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
            />
          </div>
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-[#FAFAFA] to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-[#FAFAFA] to-transparent"></div>
    </div>
  );
};

export default MarqueeSection;
