import fitz  # PyMuPDF
import os


def extract_text_from_pdf(pdf_path):
    """Extract text content from a PDF file."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page_num in range(len(doc)):
            page = doc[page_num]
            text += page.get_text()
        doc.close()

        # Clean up text
        text = text.strip()
        if not text:
            raise ValueError("No text could be extracted from the PDF.")

        # Limit text to ~15000 chars to stay within API limits
        if len(text) > 15000:
            text = text[:15000]

        return text
    except Exception as e:
        raise ValueError(f"Error reading PDF: {str(e)}")


def cleanup_file(filepath):
    """Remove a file after processing."""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception:
        pass
