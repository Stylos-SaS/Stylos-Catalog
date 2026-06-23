import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const MAX_CANVAS_DIMENSION = 16384;

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

function resolveCapturePixelRatio(height: number): number {
  const preferred = 2;
  if (height * preferred <= MAX_CANVAS_DIMENSION) return preferred;
  return Math.max(1, Math.floor(MAX_CANVAS_DIMENSION / height));
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

type CaptureLayoutSnapshot = {
  parentMaxHeight: string;
  parentOverflow: string;
  parentOverflowY: string;
  parentHeight: string;
  scrollTop: number;
};

function unlockCaptureLayout(node: HTMLElement): CaptureLayoutSnapshot {
  const parent = node.parentElement;
  const snapshot: CaptureLayoutSnapshot = {
    parentMaxHeight: parent?.style.maxHeight ?? "",
    parentOverflow: parent?.style.overflow ?? "",
    parentOverflowY: parent?.style.overflowY ?? "",
    parentHeight: parent?.style.height ?? "",
    scrollTop: parent?.scrollTop ?? 0,
  };

  if (parent) {
    parent.style.maxHeight = "none";
    parent.style.overflow = "visible";
    parent.style.overflowY = "visible";
    parent.style.height = "auto";
    parent.scrollTop = 0;
  }

  void node.offsetHeight;
  return snapshot;
}

function restoreCaptureLayout(node: HTMLElement, snapshot: CaptureLayoutSnapshot) {
  const parent = node.parentElement;
  if (!parent) return;

  parent.style.maxHeight = snapshot.parentMaxHeight;
  parent.style.overflow = snapshot.parentOverflow;
  parent.style.overflowY = snapshot.parentOverflowY;
  parent.style.height = snapshot.parentHeight;
  parent.scrollTop = snapshot.scrollTop;
}

export async function captureConfirmationNode(node: HTMLElement): Promise<string> {
  const layoutSnapshot = unlockCaptureLayout(node);
  const captureWidth = node.scrollWidth;
  const captureHeight = node.scrollHeight;
  const pixelRatio = resolveCapturePixelRatio(captureHeight);

  try {
    await waitForImages(node);

    return await toPng(node, {
      backgroundColor: "#ffffff",
      cacheBust: true,
      pixelRatio,
      width: captureWidth,
      height: captureHeight,
      fetchRequestInit: { mode: "cors" as RequestMode },
    });
  } finally {
    restoreCaptureLayout(node, layoutSnapshot);
  }
}

export async function exportConfirmationAsPng(node: HTMLElement, filename: string) {
  const dataUrl = await captureConfirmationNode(node);
  triggerDownload(dataUrl, filename);
}

export async function exportConfirmationAsPdf(node: HTMLElement, filename: string) {
  const dataUrl = await captureConfirmationNode(node);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No se pudo procesar la imagen del documento"));
  });

  const imgWidth = contentWidth;
  const imgHeight = (img.height * contentWidth) / img.width;
  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= contentHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= contentHeight;
  }

  pdf.save(filename);
}
