import QRCode from 'qrcode';

export const qrcodeFunction = async ({ data }: { data: unknown }): Promise<string> => {
  return QRCode.toDataURL(JSON.stringify(data), { errorCorrectionLevel: 'H' });
};
