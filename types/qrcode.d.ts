declare module "qrcode" {
  export interface QRCodeToDataURLOptions {
    type?: "image/png" | "image/jpeg" | "image/webp";
    rendererOpts?: {
      quality?: number;
    };
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export interface QRCodeFileStreamOptions extends QRCodeToDataURLOptions {
    type?: "png" | "svg" | "utf8" | "terminal";
  }

  export function toDataURL(
    text: string,
    options?: QRCodeToDataURLOptions,
  ): Promise<string>;

  const QRCode: {
    toDataURL: typeof toDataURL;
  };

  export default QRCode;
}
