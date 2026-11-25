import QRCode from "qrcode";

export function generateQrCodeDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "Q",
    margin: 4,
    width: 512,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
