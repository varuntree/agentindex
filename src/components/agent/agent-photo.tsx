import Image from "next/image";

type PhotoSize = "sm" | "md" | "lg" | "xl";

interface AgentPhotoProps {
  photoUrl?: string | null;
  firstName: string;
  lastName: string;
  size?: PhotoSize;
  className?: string;
}

const sizeMap: Record<PhotoSize, { px: number; text: string }> = {
  sm: { px: 40, text: "text-sm" },
  md: { px: 64, text: "text-lg" },
  lg: { px: 80, text: "text-xl" },
  xl: { px: 200, text: "text-5xl" },
};

function AgentPhoto({
  photoUrl,
  firstName,
  lastName,
  size = "md",
  className = "",
}: AgentPhotoProps) {
  const { px, text } = sizeMap[size];
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const alt = `${firstName} ${lastName}`;

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={alt}
        width={px}
        height={px}
        className={`rounded-full border-2 border-black object-cover ${className}`}
        style={{ width: px, height: px }}
        priority={size === "xl"}
        sizes={
          size === "xl"
            ? "200px"
            : size === "lg"
              ? "80px"
              : size === "md"
                ? "64px"
                : "40px"
        }
      />
    );
  }

  return (
    <div
      className={`rounded-full border-2 border-black bg-voqo-green flex items-center justify-center shrink-0 ${className}`}
      style={{ width: px, height: px }}
      aria-label={alt}
    >
      <span className={`font-bold text-white ${text}`}>{initials}</span>
    </div>
  );
}

export { AgentPhoto, type AgentPhotoProps };
