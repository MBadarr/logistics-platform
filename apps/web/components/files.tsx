"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Alert } from "@repo/ui/alert";

type StoredFile = { key: string; name: string; size: number };

export function Files() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load(next?: string) {
    const response = await fetch("/api/files" + (next ? `?cursor=${encodeURIComponent(next)}` : ""), { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message ?? "Unable to load your files");
    setFiles(current => next ? [...current, ...data.files] : data.files);
    setCursor(data.cursor);
  }
  useEffect(() => { void load().catch(failure => setError(failure.message)); }, []);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    const file = body.get("file");
    if (!(file instanceof File) || !file.name) return;
    if (file.size > 10 * 1024 * 1024) { setError("Choose a file of 10 MB or smaller."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/files", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to upload your file");
      form.reset();
      setMessage("Your file was uploaded.");
      await load();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Upload failed. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <section className="mt-10 rounded-2xl border border-card-border bg-white p-6">
      <h2 className="text-xl font-medium">Your files</h2>
      <p className="my-3 text-sm text-muted">Upload documents up to 10 MB. Your files are private to your account.</p>
      <form onSubmit={upload} className="my-5 flex flex-wrap items-center gap-4">
        <Input name="file" type="file" aria-label="Choose a file" required disabled={busy} />
        <Button type="submit" loading={busy}>Upload file</Button>
      </form>
      {error && <Alert>{error}</Alert>}
      {message && <p role="status" className="my-3 text-sm">{message}</p>}
      <ul className="divide-y divide-divider">
        {files.map(file => <li key={file.key} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="wrap-anywhere">{file.name} ({Math.ceil(file.size / 1024)} KB)</span><a className="text-link" href={`/api/files/download?key=${encodeURIComponent(file.key)}`}>Download</a></li>)}
      </ul>
      {cursor && <Button variant="outline" onClick={() => { void load(cursor).catch(failure => setError(failure.message)); }}>Load more</Button>}
    </section>
  );
}
