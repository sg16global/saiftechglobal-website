/**
 * Official SAIF TECH GLOBAL LLC golden emblem.
 * The image file (emblem-base.png) is shown exactly as supplied — never cropped or drawn on.
 * The ™ mark sits outside the image via CSS, and the container blocks right-click / drag-to-save.
 * (Static build: /js/musa.js re-attaches the right-click guard, since React does not run there.)
 */
export const EMBLEM_SRC = "/assets/emblem-base.png";
export const EMBLEM_ALT = "SAIF TECH GLOBAL LLC™ Official Trademark Emblem";
export const EMBLEM_TITLE = "© 2026 SAIF TECH GLOBAL LLC. All Rights Reserved.";

export default function ProtectedEmblem({
  className = "",
  imgClassName = "",
  size,
  eager = false,
}: {
  className?: string;
  imgClassName?: string;
  size?: number;
  eager?: boolean;
}) {
  return (
    <span
      className={`emblem-protect ${className}`}
      title={EMBLEM_TITLE}
      data-voice="This is the official golden emblem of Saif Tech Global LLC — a trademark and copyrighted asset of the company."
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <img
        src={EMBLEM_SRC}
        alt={EMBLEM_ALT}
        title={EMBLEM_TITLE}
        draggable={false}
        width={size ?? 512}
        height={size ?? 512}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={imgClassName}
        style={size ? { width: size, height: size } : undefined}
      />
      <span className="emblem-tm" aria-hidden="true">
        ™
      </span>
    </span>
  );
}
