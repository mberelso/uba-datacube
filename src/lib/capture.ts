import { toBlob } from 'html-to-image'

export interface CaptureOptions {
  scale?: number
  backgroundColor?: string
}

/**
 * Konvertiert ein DOM-Element zuverlässig in ein PNG-Blob (mittels html-to-image).
 */
export async function capturePng(node: HTMLElement, opts: CaptureOptions = {}): Promise<Blob> {
  const scale = opts.scale ?? 2
  const backgroundColor = opts.backgroundColor ?? '#0f172a'

  const blob = await toBlob(node, {
    quality: 0.95,
    pixelRatio: scale,
    backgroundColor,
    cacheBust: true,
    filter: (domNode) => {
      // Exclude elements marked to be ignored during export
      if (domNode instanceof HTMLElement && domNode.dataset.noExport !== undefined) {
        return false
      }
      return true
    },
  })

  if (!blob) {
    throw new Error('Erzeugung des PNG-Bildes ist fehlgeschlagen.')
  }

  return blob
}

/**
 * Kapselt navigator.share mit Web-Share API und Fallback auf automatischen Download.
 */
export async function shareOrDownload(
  blob: Blob,
  filename: string,
  shareText = 'Umweltdaten aus Deutschland'
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' })

  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'Umweltpuls Export',
        text: shareText,
        files: [file],
      })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'shared'
      // Fallback on error/rejection
    }
  }

  // Fallback: Programmatic Download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return 'downloaded'
}
