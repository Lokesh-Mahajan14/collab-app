import { CreateAttachmentDTO } from "@/types/message";

interface Props {
  attachment: CreateAttachmentDTO;
  onRemove: () => void;
}

export default function AttachmentPreview({
  attachment,
  onRemove,
}: Props) {

  const isImage =
    attachment.mimeType.startsWith(
      "image/"
    );

  return (
    <div
      className="
        mx-auto
        mb-3
        max-w-4xl
      "
    >
      <div
        className="
          relative
          w-fit
          rounded-xl
          border
          bg-muted
          p-3
        "
      >

        <button
          onClick={onRemove}
          className="
            absolute
            right-2
            top-2
            z-10
            rounded-full
            bg-background
            px-2
          "
        >
          ✕
        </button>

        {isImage ? (

          <img
            src={attachment.url}
            alt=""
            className="
              max-h-48
              rounded-lg
              object-cover
            "
          />

        ) : (

          <div
            className="
              flex
              items-center
              gap-3
              pr-8
            "
          >
            <div className="text-3xl">
              📄
            </div>

            <div>
              <p className="font-medium">
                {attachment.fileName}
              </p>

              <p className="text-xs text-muted-foreground">
                {(attachment.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

        )}

      </div>
    </div>
  );
}