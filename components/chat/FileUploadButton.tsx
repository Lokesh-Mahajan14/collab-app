"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";

interface Props {
  onUploaded: (file: any) => void;
}

export default function FileUploadButton({
  onUploaded,
}: Props) {

  const inputRef =
    useRef<HTMLInputElement>(null);

  async function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {

    const file =
      e.target.files?.[0];

    if (!file) return;

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const response =
      await fetch(
        "/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

    const data =
      await response.json();

    onUploaded(data);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
      />

      <button
        type="button"
        onClick={() =>
          inputRef.current?.click()
        }
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          border
          hover:bg-muted
        "
      >
        <Plus className="h-5 w-5" />
      </button>
    </>
  );
}