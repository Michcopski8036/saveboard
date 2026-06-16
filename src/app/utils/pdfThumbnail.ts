// Renders page 1 of a PDF File to a JPEG Blob for use as a card thumbnail.
// pdfjs is loaded lazily (only when a PDF is actually uploaded) so it stays out
// of the main bundle. Returns null on any failure — callers fall back to the
// generic 'placeholder:pdf' card image.
export async function renderPdfThumbnail(file: File): Promise<Blob | null> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    // Vite resolves the `?url` import to the emitted worker asset URL.
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);

    // Scale the page to a ~600px-wide thumbnail (crisp on cards, small to store).
    const TARGET_WIDTH = 600;
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // White backdrop so transparent PDFs don't render black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    return await new Promise<Blob | null>(resolve =>
      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.8)
    );
  } catch (e) {
    console.error('PDF thumbnail render failed', e);
    return null;
  }
}
