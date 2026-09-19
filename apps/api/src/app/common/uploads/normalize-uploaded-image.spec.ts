import sharp from 'sharp';
import { BadRequestException } from '@nestjs/common';
import { normalizeUploadedImage } from './normalize-uploaded-image';

it('accepts a real PNG and rejects spoofed MIME types and invalid content', async () => {
  const png = await sharp({
    create: { width: 2, height: 2, channels: 3, background: '#ffffff' },
  })
    .png()
    .toBuffer();
  const result = await normalizeUploadedImage(png, 'image/png');
  expect((await sharp(result.buffer).metadata()).format).toBe('png');
  await expect(
    normalizeUploadedImage(png, 'image/jpeg'),
  ).rejects.toBeInstanceOf(BadRequestException);
  await expect(
    normalizeUploadedImage(Buffer.from('<script>bad</script>'), 'image/png'),
  ).rejects.toBeInstanceOf(BadRequestException);
});
