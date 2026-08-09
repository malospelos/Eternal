import './reference-overlay.css';

const REF_PATH = `${import.meta.env.BASE_URL}ref/r00.txt`;

async function mountExactReference() {
  try {
    const response = await fetch(REF_PATH, { cache: 'no-store' });
    if (!response.ok) throw new Error(`reference ${response.status}`);
    const b64 = (await response.text()).trim();
    if (!b64 || b64.length < 50000) throw new Error('reference incomplete');

    const img = document.createElement('img');
    img.id = 'exact-reference-ui';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.src = `data:image/webp;base64,${b64}`;
    img.decoding = 'sync';

    await img.decode();
    if (img.naturalWidth !== 1536 || img.naturalHeight !== 1024) {
      throw new Error(`unexpected reference size ${img.naturalWidth}x${img.naturalHeight}`);
    }

    document.body.appendChild(img);
    document.documentElement.classList.add('exact-reference-ready');
  } catch (error) {
    document.documentElement.classList.add('exact-reference-failed');
    console.warn('Referencia visual exacta no disponible; se mantiene la UI jugable.', error);
  }
}

void mountExactReference();
