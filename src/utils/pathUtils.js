import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 현재 모듈 파일 경로를 기준으로 'client' 디렉토리 접근
 * @returns {path} - 폴더 경로
 */
function getClientPath() {
  return path.join(__dirname, '..', '..', 'client'); 
}

export { getClientPath };