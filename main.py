"""
PDF ⇔ PNG 変換 Web アプリケーション
FastAPI を使用したサーバーサイド実装
"""

import os
import io
import shutil
import tempfile
import zipfile
import unicodedata
import re
from pathlib import Path
from typing import List

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request

from PIL import Image
import fitz  # PyMuPDF


def sanitize_filename(filename: str) -> str:
    """
    ファイル名を安全な形式に変換（日本語対応）
    """
    # Unicode正規化
    filename = unicodedata.normalize('NFKC', filename)
    # 安全でない文字を削除
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # 長さ制限
    if len(filename) > 200:
        name, ext = os.path.splitext(filename)
        filename = name[:200-len(ext)] + ext
    return filename

app = FastAPI(title="PDF ⇔ PNG Converter")

# 静的ファイルとテンプレートの設定
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# アップロードディレクトリの作成
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """メインページの表示"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/convert-pdf-to-png")
async def convert_pdf_to_png(files: List[UploadFile] = File(...)):
    """
    PDF → PNG 変換
    複数のPDFファイルを受け取り、各ページをPNGに変換してZIPで返す
    """
    if not files:
        raise HTTPException(status_code=400, detail="ファイルが選択されていません")

    # 一時ディレクトリの作成
    temp_dir = tempfile.mkdtemp()

    try:
        all_png_files = []

        for upload_file in files:
            # PDFファイルのチェック
            if not upload_file.filename.lower().endswith('.pdf'):
                raise HTTPException(
                    status_code=400,
                    detail=f"{upload_file.filename} はPDFファイルではありません"
                )

            # ファイル名をサニタイズ
            safe_filename = sanitize_filename(upload_file.filename)

            # PDFファイルの保存
            pdf_path = Path(temp_dir) / safe_filename
            with open(pdf_path, "wb") as f:
                content = await upload_file.read()
                f.write(content)

            # PyMuPDFでPDFを開く
            try:
                pdf_document = fitz.open(str(pdf_path))
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"{upload_file.filename} を開けませんでした: {str(e)}"
                )

            # ベースファイル名（拡張子なし）
            base_name = Path(safe_filename).stem

            # 各ページをPNGに変換（メモリ効率を考慮してページごとに処理）
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]

                # 高品質でレンダリング（DPI 150）
                zoom = 2  # 150 DPI相当
                mat = fitz.Matrix(zoom, zoom)
                pix = page.get_pixmap(matrix=mat)

                # PNG画像として保存
                png_filename = f"{base_name}_{page_num + 1:03d}.png"
                png_path = Path(temp_dir) / png_filename
                pix.save(str(png_path))

                all_png_files.append((png_filename, png_path))

                # メモリ解放
                pix = None

            pdf_document.close()

        # ZIPファイルの作成（UTF-8対応）
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for png_filename, png_path in all_png_files:
                # UTF-8エンコーディングでファイル名を追加
                zipinfo = zipfile.ZipInfo(filename=png_filename)
                zipinfo.compress_type = zipfile.ZIP_DEFLATED
                zipinfo.flag_bits = 0x800  # UTF-8フラグ
                with open(png_path, 'rb') as f:
                    zip_file.writestr(zipinfo, f.read())

        zip_buffer.seek(0)

        # ZIPファイル名の決定
        if len(files) == 1:
            safe_base_name = Path(sanitize_filename(files[0].filename)).stem
            zip_filename = f"{safe_base_name}_png_export.zip"
        else:
            zip_filename = "pdf_to_png_export.zip"

        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={zip_filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"変換エラー: {str(e)}")
    finally:
        # 一時ディレクトリのクリーンアップ
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.post("/convert-png-to-pdf")
async def convert_png_to_pdf(files: List[UploadFile] = File(...)):
    """
    PNG → PDF 変換
    複数のPNG画像を受け取り、1つのPDFに結合する
    """
    if not files:
        raise HTTPException(status_code=400, detail="ファイルが選択されていません")

    # 一時ディレクトリの作成
    temp_dir = tempfile.mkdtemp()

    try:
        # 画像ファイルのリスト
        image_files = []

        for upload_file in files:
            # PNG画像のチェック
            if not upload_file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                raise HTTPException(
                    status_code=400,
                    detail=f"{upload_file.filename} は対応する画像ファイルではありません（PNG/JPG対応）"
                )

            # ファイル名をサニタイズ
            safe_filename = sanitize_filename(upload_file.filename)

            # 画像ファイルの保存
            img_path = Path(temp_dir) / safe_filename
            with open(img_path, "wb") as f:
                content = await upload_file.read()
                f.write(content)

            image_files.append((safe_filename, img_path))

        # ファイル名順にソート
        image_files.sort(key=lambda x: x[0])

        # 画像を開く
        images = []
        for filename, img_path in image_files:
            try:
                img = Image.open(img_path)
                # RGBモードに変換（PDFに保存するため）
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                images.append(img)
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"{filename} を開けませんでした: {str(e)}"
                )

        if not images:
            raise HTTPException(
                status_code=400,
                detail="有効な画像がありません"
            )

        # PDFファイルの作成
        pdf_path = Path(temp_dir) / "merged_from_pngs.pdf"

        # 最初の画像を使用してPDFを作成、残りを追加
        images[0].save(
            str(pdf_path),
            "PDF",
            resolution=100.0,
            save_all=True,
            append_images=images[1:] if len(images) > 1 else []
        )

        # PDFファイルを読み込んでレスポンス
        with open(pdf_path, "rb") as f:
            pdf_content = f.read()

        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=merged_from_pngs.pdf"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"変換エラー: {str(e)}")
    finally:
        # 一時ディレクトリのクリーンアップ
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
