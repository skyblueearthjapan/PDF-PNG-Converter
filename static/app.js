/**
 * PDF ⇔ PNG 変換ツール - フロントエンド JavaScript
 */

// PDF → PNG 変換機能
class PDFToPNGConverter {
    constructor() {
        this.files = [];
        this.uploadArea = document.getElementById('pdf-upload-area');
        this.fileInput = document.getElementById('pdf-file-input');
        this.fileList = document.getElementById('pdf-file-list');
        this.convertBtn = document.getElementById('pdf-convert-btn');
        this.statusDiv = document.getElementById('pdf-status');

        this.initEventListeners();
    }

    initEventListeners() {
        // クリックでファイル選択
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // ファイル選択
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // ドラッグ＆ドロップ
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // 変換ボタン
        this.convertBtn.addEventListener('click', () => {
            this.convertToPNG();
        });
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => {
            // PDFファイルのみ
            if (!file.name.toLowerCase().endsWith('.pdf')) {
                this.showStatus(`${file.name} はPDFファイルではありません`, 'error');
                return false;
            }
            // 重複チェック
            if (this.files.some(f => f.name === file.name && f.size === file.size)) {
                return false;
            }
            return true;
        });

        this.files = [...this.files, ...newFiles];
        this.updateFileList();
        this.updateConvertButton();
    }

    updateFileList() {
        if (this.files.length === 0) {
            this.fileList.innerHTML = '';
            return;
        }

        this.fileList.innerHTML = this.files.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <span class="file-icon">📄</span>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="file-remove" onclick="pdfConverter.removeFile(${index})">削除</button>
            </div>
        `).join('');
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileList();
        this.updateConvertButton();
    }

    updateConvertButton() {
        this.convertBtn.disabled = this.files.length === 0;
    }

    async convertToPNG() {
        if (this.files.length === 0) return;

        this.convertBtn.disabled = true;
        this.showStatus('変換中です。しばらくお待ちください...', 'loading');

        const formData = new FormData();
        this.files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/convert-pdf-to-png', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '変換に失敗しました');
            }

            // ZIPファイルのダウンロード
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // ファイル名をレスポンスヘッダーから取得
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'pdf_to_png_export.zip';
            if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showStatus('変換が完了しました！ZIPファイルをダウンロード中...', 'success');

            // リセット
            setTimeout(() => {
                this.files = [];
                this.fileInput.value = '';
                this.updateFileList();
                this.updateConvertButton();
                this.hideStatus();
            }, 3000);

        } catch (error) {
            this.showStatus(`エラー: ${error.message}`, 'error');
            this.convertBtn.disabled = false;
        }
    }

    showStatus(message, type) {
        this.statusDiv.className = `status-message show ${type}`;
        if (type === 'loading') {
            this.statusDiv.innerHTML = `<span class="loading-spinner"></span>${message}`;
        } else {
            this.statusDiv.textContent = message;
        }
    }

    hideStatus() {
        this.statusDiv.classList.remove('show');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// PNG → PDF 変換機能
class PNGToPDFConverter {
    constructor() {
        this.files = [];
        this.uploadArea = document.getElementById('png-upload-area');
        this.fileInput = document.getElementById('png-file-input');
        this.fileList = document.getElementById('png-file-list');
        this.convertBtn = document.getElementById('png-convert-btn');
        this.statusDiv = document.getElementById('png-status');

        this.initEventListeners();
    }

    initEventListeners() {
        // クリックでファイル選択
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // ファイル選択
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // ドラッグ＆ドロップ
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // 変換ボタン
        this.convertBtn.addEventListener('click', () => {
            this.convertToPDF();
        });
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => {
            // 画像ファイルのみ
            const validExtensions = ['.png', '.jpg', '.jpeg'];
            const isValidImage = validExtensions.some(ext =>
                file.name.toLowerCase().endsWith(ext)
            );

            if (!isValidImage) {
                this.showStatus(`${file.name} は対応する画像ファイルではありません`, 'error');
                return false;
            }

            // 重複チェック
            if (this.files.some(f => f.name === file.name && f.size === file.size)) {
                return false;
            }
            return true;
        });

        this.files = [...this.files, ...newFiles];
        // ファイル名順にソート
        this.files.sort((a, b) => a.name.localeCompare(b.name));
        this.updateFileList();
        this.updateConvertButton();
    }

    updateFileList() {
        if (this.files.length === 0) {
            this.fileList.innerHTML = '';
            return;
        }

        this.fileList.innerHTML = this.files.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <span class="file-icon">🖼️</span>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="file-remove" onclick="pngConverter.removeFile(${index})">削除</button>
            </div>
        `).join('');
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileList();
        this.updateConvertButton();
    }

    updateConvertButton() {
        this.convertBtn.disabled = this.files.length === 0;
    }

    async convertToPDF() {
        if (this.files.length === 0) return;

        this.convertBtn.disabled = true;
        this.showStatus('結合中です。しばらくお待ちください...', 'loading');

        const formData = new FormData();
        this.files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/convert-png-to-pdf', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '変換に失敗しました');
            }

            // PDFファイルのダウンロード
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // ファイル名をレスポンスヘッダーから取得
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'merged_from_pngs.pdf';
            if (contentDisposition) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (matches && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showStatus('結合が完了しました！PDFファイルをダウンロード中...', 'success');

            // リセット
            setTimeout(() => {
                this.files = [];
                this.fileInput.value = '';
                this.updateFileList();
                this.updateConvertButton();
                this.hideStatus();
            }, 3000);

        } catch (error) {
            this.showStatus(`エラー: ${error.message}`, 'error');
            this.convertBtn.disabled = false;
        }
    }

    showStatus(message, type) {
        this.statusDiv.className = `status-message show ${type}`;
        if (type === 'loading') {
            this.statusDiv.innerHTML = `<span class="loading-spinner"></span>${message}`;
        } else {
            this.statusDiv.textContent = message;
        }
    }

    hideStatus() {
        this.statusDiv.classList.remove('show');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// 初期化
let pdfConverter;
let pngConverter;

document.addEventListener('DOMContentLoaded', () => {
    pdfConverter = new PDFToPNGConverter();
    pngConverter = new PNGToPDFConverter();
});
