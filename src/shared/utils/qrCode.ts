import QRCode from 'qrcode';

export const qrcodeFunction = async ({ data }: { data: object }): Promise<string> => {
  return QRCode.toDataURL(JSON.stringify(data), { errorCorrectionLevel: 'H' });
};
