import { randomUUID } from 'node:crypto';
import {
  assertPublicRequest, clientKey, HttpError, insertRow, json, legacyHandler, parseBody, rateLimit,
  safeMessage, storage, supabase, text, verifyFormToken,
} from './common.mjs';

const BUCKET = 'dumle-community-videos';
const MAX_BYTES = 60 * 1024 * 1024;
const LGAS = new Set([
  'Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru',
  'Bonny', 'Degema', 'Eleme', 'Emohua', 'Etche', 'Gokana', 'Ikwerre', 'Khana',
  'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma',
  'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai',
]);
const MIME_TYPES = new Map([
  ['video/mp4', 'mp4'], ['video/quicktime', 'mov'], ['video/webm', 'webm'],
  ['video/x-msvideo', 'avi'], ['video/mpeg', 'mpeg'], ['video/3gpp', '3gp'],
  ['video/ogg', 'ogv'], ['video/x-m4v', 'm4v'],
]);

function action(event) {
  return new URLSearchParams(event.rawQuery || '').get('action') || '';
}

function safeFileName(value) {
  const name = text(value || '', 'file name', 255, true).split(/[\\/]/).pop();
  if (!/\.(mp4|mov|webm|avi|mpeg|mpg|3gp|m4v|ogv)$/i.test(name)) {
    throw new HttpError(415, 'Choose an MP4, MOV, WebM, AVI, MPEG, or 3GP video.');
  }
  return name.replace(/[\u0000-\u001f\u007f]/g, '') || 'community-video';
}

async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed.' }, { Allow: 'POST' });
  try {
    assertPublicRequest(event);
    const input = parseBody(event);
    verifyFormToken(input.token);
    const selectedAction = action(event);

    if (selectedAction === 'presign') {
      if (text(input.website || '', 'website', 200)) return json(200, { ok: true, discard: true });
      await rateLimit(event, 'video', 3, 3600);
      if (input.consent !== true) throw new HttpError(400, 'Please confirm permission to share this video.');
      const name = text(input.name || '', 'name', 120);
      const contact = text(input.contact || '', 'contact', 120);
      const lga = text(input.lga || '', 'LGA', 80, true);
      const ward = text(input.ward || '', 'ward', 80, true);
      const topic = input.topic || 'other';
      if (!LGAS.has(lga) || !['campaign', 'area', 'other'].includes(topic)) {
        throw new HttpError(400, 'Please check the LGA and video topic.');
      }
      const originalName = safeFileName(input.fileName);
      const sizeBytes = Number(input.sizeBytes);
      if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_BYTES) {
        throw new HttpError(413, 'Choose a video smaller than 60 MB.');
      }
      const mimeType = text(input.mimeType || '', 'video type', 100, true).toLowerCase();
      const extension = MIME_TYPES.get(mimeType);
      const allowedExtensions = extension === 'mpeg' ? 'mpeg|mpg' : extension;
      if (!extension || !new RegExp(`\\.(${allowedExtensions})$`, 'i').test(originalName)) {
        throw new HttpError(415, 'Choose a supported video file (MP4, MOV, WebM, AVI, MPEG, or 3GP).');
      }

      const ipHash = clientKey(event, 'video-upload');
      const objectName = `${randomUUID()}.${extension}`;
      const ticket = randomUUID();
      const path = `/storage/v1/object/upload/sign/${BUCKET}/${objectName}`;
      const { data } = await supabase(path, { method: 'POST', body: JSON.stringify({}) });
      const uploadPath = data?.url || data?.signedURL || data?.signedUrl;
      const token = data?.token;
      if (typeof uploadPath !== 'string' || typeof token !== 'string') {
        throw new HttpError(503, 'Could not prepare secure video storage.');
      }
      const base = process.env.SUPABASE_URL.replace(/\/+$/, '');
      const url = /^https?:\/\//i.test(uploadPath)
        ? new URL(uploadPath)
        : new URL(
          uploadPath.startsWith('/storage/v1/')
            ? uploadPath
            : `/storage/v1/${uploadPath.replace(/^\/+/, '')}`,
          base,
        );
      url.searchParams.set('token', token);
      await insertRow('video_upload_tickets', {
        id: ticket,
        storage_path: objectName,
        ip_hash: ipHash,
        name,
        contact,
        lga,
        ward,
        topic,
        original_name: originalName,
        mime_type: mimeType,
        size_bytes: sizeBytes,
      });
      return json(200, { ok: true, upload_url: url.href, upload_id: ticket });
    }

    if (selectedAction === 'finalize') {
      if (text(input.website || '', 'website', 200)) return json(200, { ok: true });
      const uploadId = text(input.upload_id || '', 'upload ID', 80, true);
      if (!/^[a-f0-9-]{36}$/i.test(uploadId)) throw new HttpError(400, 'Invalid upload.');
      const ipHash = clientKey(event, 'video-upload');
      const { data: tickets } = await supabase(
        `/rest/v1/video_upload_tickets?id=eq.${encodeURIComponent(uploadId)}&ip_hash=eq.${ipHash}&select=*&limit=1`,
      );
      if (!Array.isArray(tickets) || !tickets.length) throw new HttpError(404, 'Upload session expired. Please start again.');
      const ticket = tickets[0];
      if (Date.now() - new Date(ticket.created_at).getTime() > 30 * 60 * 1000) {
        throw new HttpError(410, 'Upload session expired. Please start again.');
      }

      const { data: info } = await storage(`/object/info/${BUCKET}/${encodeURIComponent(ticket.storage_path)}`);
      const metadata = info?.metadata || {};
      const actualSize = Number(metadata.size || info?.size || info?.contentLength);
      if (!Number.isSafeInteger(actualSize) || actualSize !== ticket.size_bytes || actualSize > MAX_BYTES) {
        await storage(`/object/${BUCKET}`, {
          method: 'DELETE',
          body: JSON.stringify({ prefixes: [ticket.storage_path] }),
        });
        throw new HttpError(400, 'The uploaded video could not be verified. Please try again.');
      }

      try {
        await insertRow('videos', {
          name: ticket.name,
          contact: ticket.contact,
          lga: ticket.lga,
          ward: ticket.ward,
          topic: ticket.topic,
          original_name: ticket.original_name,
          storage_path: ticket.storage_path,
          mime_type: ticket.mime_type,
          size_bytes: actualSize,
          consent: true,
          status: 'new',
        });
        await supabase(`/rest/v1/video_upload_tickets?id=eq.${encodeURIComponent(uploadId)}`, {
          method: 'DELETE',
          headers: { Prefer: 'return=minimal' },
        });
      } catch (error) {
        await storage(`/object/${BUCKET}`, {
          method: 'DELETE',
          body: JSON.stringify({ prefixes: [ticket.storage_path] }),
        }).catch(() => {});
        throw error;
      }
      return json(201, { ok: true });
    }

    throw new HttpError(400, 'Invalid video action.');
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return json(status, { ok: false, error: safeMessage(error) });
  }
}

export default legacyHandler(handler);
