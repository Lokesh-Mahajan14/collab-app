"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileText,
  Link2,
  Loader2,
  Paperclip,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import axios from "axios";

type DocumentItem = {
  id: string;
  type: "FILE" | "LINK";
  title: string;
  url: string;
  fileName: string | null;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  };
};

type WorkspaceFilesClientProps = {
  userId: string;
  workspaceId: string;
  workspaceName: string;
  memberCount: number;
  documents: DocumentItem[];
};

function formatBytes(value: number | null) {
  if (!value || value <= 0) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? Math.round(size) : size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function WorkspaceFilesClient({
  userId,
  workspaceId,
  workspaceName,
  memberCount,
  documents,
}: WorkspaceFilesClientProps) {
  const router = useRouter();
  const uploadFormRef = useRef<HTMLFormElement>(null);
  const linkFormRef = useRef<HTMLFormElement>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [localDocuments, setLocalDocuments] = useState(documents);

  useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  const fileCount = localDocuments.filter(
    (document) => document.type === "FILE",
  ).length;
  const linkCount = localDocuments.filter(
    (document) => document.type === "LINK",
  ).length;

  async function handleFileUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      toast.error("Choose a file to upload");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      if (uploadTitle.trim()) {
        formData.append("title", uploadTitle.trim());
      }

      const response = await fetch(`/api/workspaces/${workspaceId}/documents`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload document");
      }

      toast.success("Document uploaded");
      setLocalDocuments((currentDocuments) => [
        data.document,
        ...currentDocuments,
      ]);
      setUploadTitle("");
      setSelectedFile(null);
      uploadFormRef.current?.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document",
      );
    } finally {
      setIsUploading(false);
    }
  }

  const handleDelete = async (documentId: string) => {
  if (!documentId) {
    toast.error("Document ID is missing");
    return;
  }

  try {
    await axios.delete(
      `/api/workspaces/${workspaceId}/documents/${documentId}`,
    );

    toast.success("Document deleted successfully");

    setLocalDocuments((currentDocuments) =>
      currentDocuments.filter((document) => document.id !== documentId),
    );
  } catch (error) {
    toast.error(
      axios.isAxiosError(error)
        ? error.response?.data?.error ?? "Failed to delete document"
        : "Failed to delete document",
    );
  }
};

  async function handleCreateLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!linkTitle.trim()) {
      toast.error("Link title is required");
      return;
    }

    if (!linkUrl.trim()) {
      toast.error("Link URL is required");
      return;
    }

    setIsSavingLink(true);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "LINK",
          title: linkTitle.trim(),
          url: linkUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save link");
      }

      toast.success("Link saved");
      setLocalDocuments((currentDocuments) => [
        data.document,
        ...currentDocuments,
      ]);
      setLinkTitle("");
      setLinkUrl("");
      linkFormRef.current?.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save link",
      );
    } finally {
      setIsSavingLink(false);
    }
  }

  return (
    <div className="space-y-8 p-6">
      <section className="rounded-3xl border border-border/60 bg-linear-to-br from-background via-background to-muted/30 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Workspace files
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Files and Links
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Upload documents, share references, and keep every member on the
              same source of truth for {workspaceName}.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Documents</p>
              <p className="text-2xl font-semibold">{documents.length}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Files</p>
              <p className="text-2xl font-semibold">{fileCount}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Links</p>
              <p className="text-2xl font-semibold">{linkCount}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Members</p>
              <p className="text-2xl font-semibold">{memberCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form
          ref={uploadFormRef}
          onSubmit={handleFileUpload}
          className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-muted/70 p-3">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Upload a document</h2>
              <p className="text-sm text-muted-foreground">
                Add PDFs, images, spreadsheets, or any other project file.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="document-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="document-title"
                placeholder="Project brief"
                value={uploadTitle}
                onChange={(event) => setUploadTitle(event.target.value)}
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="document-file" className="text-sm font-medium">
                File
              </label>
              <Input
                id="document-file"
                type="file"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Stored in this workspace only. Every workspace member can view
                and download it.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" />
              {selectedFile ? selectedFile.name : "No file selected"}
            </div>
            <Button type="submit" disabled={isUploading} className="gap-2">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload file"}
            </Button>
          </div>
        </form>

        <form
          ref={linkFormRef}
          onSubmit={handleCreateLink}
          className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-muted/70 p-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Add a link</h2>
              <p className="text-sm text-muted-foreground">
                Save specs, design references, docs, or external resources.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="link-title" className="text-sm font-medium">
                Link title
              </label>
              <Input
                id="link-title"
                placeholder="Product requirements"
                value={linkTitle}
                onChange={(event) => setLinkTitle(event.target.value)}
                disabled={isSavingLink}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="link-url" className="text-sm font-medium">
                URL
              </label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                disabled={isSavingLink}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSavingLink} className="gap-2">
              {isSavingLink ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {isSavingLink ? "Saving..." : "Save link"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Workspace library</h2>
            <p className="text-sm text-muted-foreground">
              Shared documents and references for the whole workspace.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Visible to all members
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {localDocuments.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-background shadow-sm">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-base font-semibold">No documents yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload the first file or save a useful link to start building
                the workspace library.
              </p>
            </div>
          ) : (
            localDocuments.map((document) => (
              <article
                key={document.id}
                className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "rounded-2xl p-3",
                      document.type === "FILE"
                        ? "bg-blue-500/10 text-blue-600"
                        : "bg-emerald-500/10 text-emerald-600",
                    )}
                  >
                    {document.type === "FILE" ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <Link2 className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">
                          {document.title}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground">
                          {document.type === "FILE"
                            ? (document.fileName ?? document.mimeType ?? "File")
                            : document.url}
                        </p>
                      </div>

                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {document.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Added by{" "}
                        {document.uploadedBy.name ?? document.uploadedBy.email}
                      </span>
                      <span>•</span>
                      <span>{formatDate(document.createdAt)}</span>
                      {document.type === "FILE" && document.size ? (
                        <>
                          <span>•</span>
                          <span>{formatBytes(document.size)}</span>
                        </>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-muted-foreground">
                        {document.type === "FILE"
                          ? "Downloadable for every workspace member."
                          : "Open the saved reference in a new tab."}
                      </div>

                      <div className="flex items-center gap-2">
                        {document.uploadedBy.id === userId && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(document.id)}
                          >
                            Delete
                          </Button>
                        )}
                        {document.type === "FILE" ? (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="gap-2"
                          >
                            <a
                              href={`/api/workspaces/${workspaceId}/documents/${document.id}/download`}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        ) : (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="gap-2"
                          >
                            <a
                              href={document.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Link2 className="h-4 w-4" />
                              Open link
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
