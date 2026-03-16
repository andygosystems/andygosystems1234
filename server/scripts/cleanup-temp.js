const fs = require('fs');
const path = require('path');

const dir = process.env.TEMP_UPLOADS_DIR || path.resolve(__dirname, '../../public/uploads/temp');
const now = Date.now();
const maxAge = 24 * 60 * 60 * 1000;

if (!fs.existsSync(dir)) process.exit(0);
const files = fs.readdirSync(dir);
for (const f of files) {
  const p = path.join(dir, f);
  try {
    const st = fs.statSync(p);
    if (st.isFile() && now - st.mtimeMs > maxAge) {
      fs.unlinkSync(p);
    }
  } catch {}
}
