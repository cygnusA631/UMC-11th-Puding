import { cn } from "../../utils/cn";

interface MovieImageProps {
  src: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export function MovieImage({ src, alt, className, width, height }: MovieImageProps) {
  if (!src) {
    return (
      <div role="img" aria-label={`${alt} 이미지 없음`} className={cn(className, "flex items-center justify-center bg-[#e6e8ed] text-sm text-[#5b626d]")}>
        <span>이미지 없음</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} width={width} height={height} />;
}
