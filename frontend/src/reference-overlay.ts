import './reference-overlay.css';

const REF_PATH = `${import.meta.env.BASE_URL}ref/r00.txt`;

async function mountExactReference() {
  try {
    const response = await fetch(REF_PATH, { cache: 'no-store' });
    if (!response.ok) throw new Error(`reference ${response.status}`);
    const b64 = (await response.text()).trim();
    const img = document.createElement('img');
    img.id = 'exact-reference-ui';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.src = `data:image/webp;base64,${b64}`;
    img.decoding = 'sync';
    document.body.appendChild(img);
    await img.decode().catch(() => undefined);
    document.documentElement.classList.add('exact-reference-ready');
  } catch (error) {
    console.error('No se pudo montar la referencia visual exacta', error);
  }
}

void mountExactReference();
