import * as Print from 'expo-print';
import { InteractionManager } from 'react-native';
import { shareLocalFile } from './shareExportFile';

export type SharePdfOptions = {
  /** Called once the PDF file is generated, before the share sheet opens. */
  onPdfReady?: () => void;
};

const PRINT_TIMEOUT_MS = 60000;

async function printHtmlToPdf(html: string) {
  return Promise.race([
    Print.printToFileAsync({ html }),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('PDF generation timed out. Please try again.')),
        PRINT_TIMEOUT_MS,
      );
    }),
  ]);
}

async function waitForSharePresentation() {
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
  // Let any loading modal finish dismissing before the native share sheet opens.
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 320);
  });
}

export async function shareHtmlAsPdf(fileName: string, html: string, options?: SharePdfOptions) {
  const { uri } = await printHtmlToPdf(html);
  options?.onPdfReady?.();
  await waitForSharePresentation();
  await shareLocalFile(uri, 'application/pdf', fileName);
}
