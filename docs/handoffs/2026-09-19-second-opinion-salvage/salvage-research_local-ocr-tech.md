# Salvaged: research:local-ocr-tech (39 web calls)

## 1. SEARCH: Tesseract.js v6 release notes bundle size language data traineddata size WASM SIMD Web Worker

Web search results for query: "Tesseract.js v6 release notes bundle size language data traineddata size WASM SIMD Web Worker"
Links: [{"title":"The browser's OCR engine reads every journal page and the page keeps none of it: tesseract.js 6 has no data.words · Issue #306 · amberfolio/amberfolio","url":"https://github.com/amberfolio/amberfolio/issues/306"},{"title":"Releases · naptha/tesseract.js","url":"https://github.com/naptha/tesseract.js/releases"},{"title":"GitHub - robertknight/tesseract-wasm: JS/WebAssembly build of the Tesseract OCR engine for use in browsers and Node · GitHub","url":"https://github.com/robertknight/tesseract-wasm"},{"title":"tesseract-wasm - npm","url":"https://www.npmjs.com/package/tesseract-wasm"},{"title":"Issue #806 · naptha/tesseract.js - Reduce file sizes - GitHub","url":"https://github.com/naptha/tesseract.js/issues/806"},{"title":"GitHub - Danlock/tesseract-wasm: WebAssembly build of the Tesseract OCR engine for use in gogosseract","url":"https://github.com/Danlock/tesseract-wasm"},{"title":"Releases · naptha/tesseract.js-core","url":"https://github.com/naptha/tesseract.js-core/releases"},{"title":"Release Notes | tessdoc - Tesseract documentation","url":"https://tesseract-ocr.github.io/tessdoc/ReleaseNotes.html"},{"title":"Tesseract (software)","url":"https://en.wikipedia.org/wiki/Tesseract_(software)"}]
Based on the search results, here's what I found regarding Tesseract.js v6 and related information:
## Key Information Found
**Bundle Size and Language Data:**
The tesseract-core-simd.wasm.js file is 4.74 MB and eng.traineddata.gz is 10.4 MB, totaling 15.34 MB. LSTM-only builds (identified by "lstm" in the name) are approximately 0.75MB smaller with no downside for most users who only use the LSTM model.
**WASM and SIMD Support:**
Tesseract.js v6 uses WASM files like tesseract-core-simd-lstm.wasm. The related tesseract-wasm library demonstrates WASM SIMD support when available in Chrome >= 91, Firefox >= 90, and Safari >= 16.4.
**Web Worker Architecture:**
Tesseract.js v6 uses worker.min.js files and handles Web Worker relative paths through the createWorker function.
**v6 to v7 Improvements:**
Upgrading from v6 to v7 reduces runtimes by approximately 15-35% depending on device and use-case.
The search results provide some information about v6, though detailed v6-specific release notes with comprehensive bundle size breakdowns weren't fully available in the results.
REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.

## 2. SEARCH: PaddleOCR ONNX Runtime Web browser demo model size ms per image WebGPU 2025 2026

Web search results for query: "PaddleOCR ONNX Runtime Web browser demo model size ms per image WebGPU 2025 2026"
Links: [{"title":"@snowfluke/ppu-paddle-ocr - JSR","url":"https://jsr.io/@snowfluke/ppu-paddle-ocr"},{"title":"GitHub - PT-Perkasa-Pilar-Utama/ppu-paddle-ocr: Lightweight, probably the fastest PaddleOCR SDK in TypeScript. Multilingual Support. Runs anywhere JavaScript runs: Node.js, Bun, Deno, mobile react-native, web browsers, web worker, and browser extensions. Docker & CLI supported. The official SDK is browser-only. · GitHub","url":"https://github.com/PT-Perkasa-Pilar-Utama/ppu-paddle-ocr"},{"title":"ppu-paddle-ocr - npm","url":"https://www.npmjs.com/package/ppu-paddle-ocr"},{"title":"ONNX Runtime Web unleashes generative AI in the browser using WebGPU | Microsoft Open Source Blog","url":"https://opensource.microsoft.com/blog/2024/02/29/onnx-runtime-web-unleashes-generative-ai-in-the-browser-using-webgpu/"},{"title":"Deterministic OCR in JavaScript: PaddleOCR for Node, Bun, Deno, and the Browser - DEV Community","url":"https://dev.to/awalariansyah/deterministic-ocr-in-javascript-paddleocr-for-node-bun-deno-and-the-browser-2bgn"},{"title":"@paddleocr/paddleocr-js - npm","url":"https://www.npmjs.com/package/@paddleocr/paddleocr-js"},{"title":"Browser Deployment - PaddleOCR Documentation","url":"http://www.paddleocr.ai/main/en/version3.x/deployment/browser.html"},{"title":"ppu-paddle-ocr - PaddleOCR (PP-OCRv6) in the Browser · Interactive Demo","url":"https://ppu-paddle-ocr.snowfluke.workers.dev/"},{"title":"ppu-paddle-ocr - npmx","url":"https://npmx.dev/package/ppu-paddle-ocr"}]
Based on the search results, here's what I found about PaddleOCR with ONNX Runtime, WebGPU, and web browser deployment:
## Performance and WebGPU Acceleration
On WebGPU-capable browsers (Chrome/Edge on Windows/Linux/macOS, Firefox Nightly), ONNX inference automatically runs on the GPU, typically 2-5x faster with no code changes. The library silently falls back to WASM if WebGPU is unavailable or fails.
## Web Browser Demo
A free interactive demo of ppu-paddle-ocr runs PaddleOCR (PP-OCRv6) text detection and recognition entirely in browsers with onnxruntime-web and WebGPU - no server, no upload. Defaults are PP-OCRv6 tiny with the Balanced strategy - fast and accurate for screenshots and clean photos.
## Implementation Details
On WebGPU-capable browsers (Chrome/Edge on Windows/Linux/macOS, Firefox Nightly), ONNX inference automatically runs on the GPU, typically 2-5x faster with no code changes. The implementation uses ONNX Runtime Web with automatic GPU routing and fallback capabilities.
The search results don't contain specific information about model size in megabytes or milliseconds per image for inference latency. The most recent updates are from mid-2026, showing active development with PP-OCRv6 versions and continued WebGPU support improvements.
REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.

## 3. SEARCH: pdf.js getTextContent detect scanned PDF no text layer render page to canvas OCR fallback

Web search results for query: "pdf.js getTextContent detect scanned PDF no text layer render page to canvas OCR fallback"
Links: [{"title":"OCR fallback for scanned/image-only PDFs · Issue #17 · arpit10128/WhisperDocs","url":"https://github.com/arpit10128/WhisperDocs/issues/17"},{"title":"Improve PDF extraction to prefer native text over OCR · Issue #147 · omar-Suleiman14/chaos","url":"https://github.com/omar-Suleiman14/chaos/issues/147"},{"title":"Most PDF Extractors Use the Wrong API: Here’s What We Built Instead - DEV Community","url":"https://dev.to/bonzai2carn/most-pdf-extractors-use-the-wrong-api-heres-what-we-built-instead-5dgh"},{"title":"feat(agent-tools): native PDF text extraction and selected-page rendering · Issue #656 · evenfire-ai/evenfire","url":"https://github.com/evenfire-ai/evenfire/issues/656"},{"title":"How to extract text from a PDF in JavaScript: PDF.js and Nutrient (2026)","url":"https://www.nutrient.io/blog/how-to-extract-text-from-a-pdf-using-javascript/"},{"title":"Harden PDF and OCR source extraction · Issue #33 · omar-Suleiman14/chaos","url":"https://github.com/omar-Suleiman14/chaos/issues/33"},{"title":"getTextContent is breaking up text in unexpected ways - very inconsistent · Issue #18201 · mozilla/pdf.js","url":"https://github.com/mozilla/pdf.js/issues/18201"},{"title":"formslip.itch.io","url":"https://formslip.itch.io/pdf2text/purchase"},{"title":"pdf processor","url":"https://glama.ai/mcp/servers/@maxzrff/KnowledgeMCP/blob/9ae6a88091c0358725cb921250ac263f9592a613/src/processors/pdf_processor.py"},{"title":"github.com","url":"https://github.com/jbarlow83/OCRmyPDF/blob/v15.1.0/docs/index.rst"}]
I found relevant search results on this topic. Here's what the web search revealed about handling scanned PDFs with pdf.js, detecting when text layers are missing, and implementing OCR fallbacks:
## Key Findings
**Text Layer Detection:**
pdf.js's getTextContent() only reads an embedded text layer, and scanned PDFs are image-based and contain no selectable text, so PDF.js and getTextContent() won't work on them.
**Detecting Scanned PDFs:**
The approach used in production systems is straightforward: detected text-empty PDFs and routed them to OCR. You can detect when a PDF is scanned by checking if `getTextContent()` returns empty or near-empty results.
**OCR Fallback Strategy:**
PDF extraction uses the fastest accurate method available per page and falls back to OCR only where it is genuinely needed. For mixed documents with both text and scanned pages, extraction still treats a document as uniformly text or uniformly scanned, using pdfjsLib.getDocument and page.getTextContent() across all pages, though a mixed document — typed pages with scanned figures or scanned appendices — is common.
**Canvas Rendering for Scanned Content:**
Visual-page mode renders selected pages to bounded PNG/JPEG and reuses the native image-result path for diagrams and scans. This allows you to render scanned pages to canvas and process them with OCR.
**OCR Solutions:**
Nutrient includes built-in OCR support that can process scanned documents and make their text searchable and extractable, or you can use a third-party OCR API and pass the result to your JavaScript application.
REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.

## 4. SEARCH: Transformers.js Florence-2 TrOCR Donut document understanding browser WebGPU model size inference time

Web search results for query: "Transformers.js Florence-2 TrOCR Donut document understanding browser WebGPU model size inference time"
Links: [{"title":"GitHub - Chroma01/transformers.js: State-of-the-art Machine Learning for the web. Run 🤗 Transformers directly in your browser, with no need for a server!","url":"https://github.com/Chroma01/transformers.js"},{"title":"GitHub - felipefarinha/transformers.js: State-of-the-art Machine Learning for the web. Run 🤗 Transformers directly in your browser, with no need for a server!","url":"https://github.com/felipefarinha/transformers.js"},{"title":"GitHub - huggingface/transformers.js: State-of-the-art Machine Learning for the web. Run 🤗 Transformers directly in your browser, with no need for a server!","url":"https://github.com/huggingface/transformers.js/"},{"title":"Transformers.js","url":"https://huggingface.co/docs/transformers.js/main/en/index"},{"title":"Transformers.js · Hugging Face","url":"https://huggingface.co/docs/transformers.js/en/index"},{"title":"transformers.js-examples/florence2-webgpu at main · huggingface/transformers.js-examples","url":"https://github.com/huggingface/transformers.js-examples/tree/main/florence2-webgpu"},{"title":"Transformers.js v3 (WebGPU Florence-2)","url":"https://scrimba.com/s0pdm485fo"},{"title":"Transformers.js v3: WebGPU Support, New Models & Tasks, and More…","url":"https://www.huggingface.co/blog/transformersjs-v3"},{"title":"Transformers.js documentation","url":"https://huggingface.co/docs/transformers.js/en/guides/webgpu"}]
Based on the search results, here's what I found about Transformers.js with these document understanding models and WebGPU:
## Models Available
Donut from NAVER was released together with the paper "OCR-free Document Understanding Transformer", and it's supported in Transformers.js. Florence-2 is from Microsoft and is also available.
## WebGPU Support
WebGPU is a new web standard for accelerated graphics and compute that enables web developers to use the underlying system's GPU to carry out high-performance computations directly in the browser. You can run Florence-2 directly in your browser on WebGPU.
## Optimization Details
For models like Florence-2, encoder-decoder models are extremely sensitive to quantization settings, so Transformers.js added the ability to select per-module dtypes by providing a mapping from module name to dtype. An example shows Florence-2 being configured with mixed precision: fp16 for embeddings and vision encoder, and q4 quantization for the encoder and decoder models.
## Availability
As of October 2024, global WebGPU support is around 70%, meaning some users may not be able to use the API yet.
The search results don't contain specific information about model sizes or inference time benchmarks for these models on WebGPU. You may want to check the official Transformers.js documentation or examples on the Hugging Face website for more detailed performance metrics.
REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.

## 5. SEARCH: Shape Detection API TextDetector Chrome status 2026 browser support

Web search results for query: "Shape Detection API TextDetector Chrome status 2026 browser support"
Links: [{"title":"The Shape Detection API: a picture is worth a thousand words, faces, and barcodes | Capabilities | Chrome for Developers","url":"https://developer.chrome.com/docs/capabilities/shape-detection"},{"title":"Introduction to the Shape Detection API | by Arnelle Balane | Arnelle’s Blog | Medium","url":"https://medium.com/p/introduction-to-the-shape-detection-api-e07425396861"},{"title":"developer.chrome.com/site/en/articles/shape-detection/index.md at main · GoogleChrome/developer.chrome.com","url":"https://github.com/GoogleChrome/developer.chrome.com/blob/main/site/en/articles/shape-detection/index.md"},{"title":"Shape Detection API: Detecting barcodes, faces and text inside an image","url":"https://deanhume.com/shape-detection-api-detecting-barcodes-faces-and-text-inside-an-image/"},{"title":"Text Detection API","url":"https://progressier.com/pwa-capabilities/text-detection"},{"title":"Add feature for text detection API · Issue #3502 · web-platform-dx/web-features","url":"https://github.com/web-platform-dx/web-features/issues/3502"},{"title":"Accelerated Text Detection in Images","url":"https://wicg.github.io/shape-detection-api/text.html"},{"title":"What Web Can Do Today: Shape Detection","url":"https://whatwebcando.today/shape-detection.html"},{"title":"Extracting text from an image: Experiments with Shape Detection - DEV Community","url":"https://dev.to/chromiumdev/extracting-text-from-an-image-experiments-with-shape-detection-2kce"}]
Based on the search results, here's what I found about the Shape Detection API TextDetector and Chrome support in 2026:
## Current Status
The Shape Detection API currently supports face detection through the FaceDetector interface, barcode detection through the BarcodeDetector interface, and text detection (Optical Character Recognition, OCR) through the TextDetector interface.
## Browser Support
The TextDetector currently works only in Chrome and Edge and requires the Experimental Web Platform features flag to be enabled. This remains the case as of 2026.
## Stability Concerns
Text detection, despite being an interesting field, is not considered stable enough across either computing platforms or character sets to be standardized at the moment, which is why text detection has been moved to a separate informative specification.
## Implementation Details
While this API can detect text regions, it cannot extract the actual text content from those regions on its own.
The TextDetector API remains an experimental feature that requires enabling the Experimental Web Platform Features flag in Chrome and Edge browsers to use, and continues to face stability and standardization challenges across different platforms and character sets.
REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.

## 6. SEARCH: Amazon Textract AnalyzeExpense pricing per page 2026 invoices receipts

Web search results for query: "Amazon Textract AnalyzeExpense pricing per page 2026 invoices receipts"
Links: [{"title":"Amazon Textract pricing 2026 | OMR Reviews","url":"https://omr.com/en/reviews/product/amazon-textract/pricing"},{"title":"Amazon Textract Pricing Calculator — OCR, Forms, Tables, Lending | FactualMinds","url":"https://www.factualminds.com/tools/amazon-textract-pricing-calculator/"},{"title":"Textract Pricing Page","url":"https://aws.amazon.com/textract/pricing/"},{"title":"Amazon Textract pricing explained and how to track usage | by Kyanda KS | Medium","url":"https://medium.com/@kyandaks/amazon-textract-pricing-explained-and-how-to-track-usage-1969629dc332"},{"title":"AWS Textract Pricing: Document Processing Costs | Wring Blog","url":"https://www.wring.co/blog/aws-textract-pricing-guide"},{"title":"AWS Textract Pricing 2026: Per-Page Costs & Free Tier","url":"https://lenscopy.com/compare/aws-textract/"},{"title":"AWS Intelligent Document Processing Cost Calculator by Tech 42","url":"https://www.tech42consulting.com/aws-idp-cost-calculator"},{"title":"A detailed breakdown of the Amazon Textract pricing","url":"https://cloudtech.com/resources/aws-textract-pricing-usage-insights"},{"title":"AWS Textract Pricing 2026: Real Per-Page OCR Cost Math","url":"https://www.braincuber.com/blog/aws-textract-pricing-what-ocr-actually-costs"}]
Based on the search results, here's the current pricing for Amazon Textract's AnalyzeExpense API for processing invoices and receipts in 2026:
## AnalyzeExpense Pricing
The AnalyzeExpense API costs $1.50 per 1,000 pages, though some sources report slightly different rates. Specifically, AnalyzeExpense costs $8.00 per 1,000 pages, and other sources cite $8 to $10 per 1,000 pages.
The variation appears to reflect different pricing tiers or regions. AnalyzeExpense for invoices costs $10 per 1,000 pages according to the most recent 2026 source.
## Free Tier
AnalyzeExpense has a separate free tier of 150 pages per month.
## Key Advantage
AnalyzeExpense is purpose-built for receipts and invoices, identifying vendor names, line items, prices, and totals, and at $8.00 per 1,000 pages, it is significantly cheaper than using AnalyzeDocument with Forms ($50/1,000) for expense processing.
REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.

## 7. SEARCH: Azure AI Document Intelligence prebuilt invoice pricing per 1000 pages 2026 data retention 24 hours

Web search results for query: "Azure AI Document Intelligence prebuilt invoice pricing per 1000 pages 2026 data retention 24 hours"
Links: [{"title":"Azure document intelligence pre built Invoice model improvements and pricing. - Microsoft Q&A","url":"https://learn.microsoft.com/en-us/answers/questions/2154607/azure-document-intelligence-pre-built-invoice-mode"},{"title":"Azure Document Intelligence pricing - Microsoft Q&A","url":"https://learn.microsoft.com/en-in/answers/questions/5927427/azure-document-intelligence-pricing"},{"title":"What is the cost of document intellegence service with form recognizer - Microsoft Q&A","url":"https://learn.microsoft.com/en-us/answers/questions/5665475/what-is-the-cost-of-document-intellegence-service"},{"title":"Azure AI Document Intelligence Pricing — SMB Field Guide","url":"https://starnovai.com/azure-ai-document-intelligence-pricing"},{"title":"Azure AI Document Intelligence Pricing 2026 (Official) | DocuOCR","url":"https://docuocr.com/blog/azure-document-intelligence-pricing"},{"title":"Pricing - Azure Document Intelligence in Foundry Tools | Microsoft Azure","url":"https://azure.microsoft.com/en-us/pricing/details/document-intelligence/"},{"title":"Azure Document Intelligence Review 2026 | AI:PRODUCTIVITY","url":"https://aiproductivity.ai/tools/azure-document-intelligence/"},{"title":"Azure Document Intelligence Pricing 2026: Is It Worth It? (We Tested It) | Parsli","url":"https://parsli.co/compare/azure-document-intelligence"},{"title":"Form Recognizer - Pricing Estimate for wrong model","url":"https://learn.microsoft.com/en-us/answers/a/1259258"}]
Now let me search for the data retention information:
Links: [{"title":"Azure Document Intelligence (formerly Azure AI Form Recognizer) FAQ | Azure Docs","url":"https://docs.azure.cn/en-us/ai-services/document-intelligence/faq?view=doc-intel-4.0.0"},{"title":"Azure Document Intelligence in Foundry Tools (formerly Azure AI Form Recognizer) FAQ | Microsoft Learn","url":"https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/faq?view=doc-intel-4.0.0"},{"title":"Data, privacy, and security for Document Intelligence - Foundry Tools | Microsoft Learn","url":"https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/document-intelligence/data-privacy-security"},{"title":"Data, privacy, and security for Content Understanding - Foundry Tools | Microsoft Learn","url":"https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/content-understanding/data-privacy"},{"title":"What's new in Document Intelligence - Azure AI services | Azure Docs","url":"https://docs.azure.cn/en-us/ai-services/document-intelligence/whats-new?view=doc-intel-4.0.0"},{"title":"Service encryption of data at rest - Document Intelligence - Foundry Tools | Microsoft Learn","url":"https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/authentication/encrypt-data-at-rest?view=doc-intel-4.0.0"},{"title":"Document Intelligence API - analyzeResults endpoint question - Microsoft Q&A","url":"https://learn.microsoft.com/en-us/answers/questions/1384439/document-intelligence-api-analyzeresults-endpoint"},{"title":"Azure Document Intelligence: Is customer data used to train models? - Microsoft Q&A","url":"https://learn.microsoft.com/en-gb/answers/questions/1864387/azure-document-intelligence-is-customer-data-used"},{"title":"Data retention policies | Document Ai Advanced Course | The Neural Base","url":"https://theneuralbase.com/document-ai/learn/advanced/data-retention-policies/"},{"title":"Deleting BOTH input data AND results from Azure Document Intelligence immediately after processing","url":"https://learn.microsoft.com/en-us/answers/questions/5650674/deleting-both-input-data-and-results-from-azure-do"}]
Based on the search results, here's what I found regarding your query about Azure AI Document Intelligence:
## Prebuilt Invoice Pricing per 1,000 Pages (2026)
The official 2026 rates for prebuilt models such as invoice are $10 per 1,000 pages on the standard S0 tier. This is consistent across multiple 2026 sources. There are also commitment tier options available at lower rates for higher volumes.
## Data Retention: 24 Hours
For all features, Document Intelligence temporarily stores data and results in Azure Storage in the same region as the request, and your data is then deleted 24 hours from the time that you submit an analyze request.
Additionally, if you would like the data deleted sooner, you can call the delete analyze response API, which marks the results for deletion and is available in the v4.0 API.
REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.

## 8. SEARCH: Google Document AI Invoice Parser pricing per page 2026

Web search results for query: "Google Document AI Invoice Parser pricing per page 2026"
Links: [{"title":"Google Doc AI Invoice Parser Costs 2026 Explained","url":"https://flowwright.com/blog/document-ai-pricing-guide"},{"title":"Google Document AI Invoice Parser Pricing Explained","url":"https://invoicedataextraction.com/blog/google-document-ai-invoice-parser-pricing"},{"title":"Document AI pricing for Invoices - AI Solutions - Google Developer forums","url":"https://discuss.google.dev/t/document-ai-pricing-for-invoices/147740"},{"title":"Google Document AI Alternative for Invoices: Pricing","url":"https://invoiceextractor.ai/google-document-ai-alternative"},{"title":"How Much Does Google Document AI Actually Cost? (2026 Updated) | PM The Tech Guy","url":"https://www.pmthetechguy.com/blog/google-document-ai-cost-analysis"},{"title":"Google Document AI Pricing & Plans [2026] (google document ai pricing) | aitoolsatlas.ai","url":"https://aitoolsatlas.ai/tools/google-document-ai/pricing"},{"title":"Document AI Cost Comparison: Google AI vs AWS Pricing","url":"https://aiproductivity.ai/blog/document-ai-cost-comparison/"},{"title":"Google Document AI Pricing 2026: True Costs, GCP Setup & No-Code Alternative | Parsli","url":"https://parsli.co/compare/google-document-ai"},{"title":"Document AI pricing","url":"https://cloud.google.com/document-ai/pricing"}]
Based on the search results, here's the current pricing for Google Document AI Invoice Parser in 2026:
## Invoice Parser Pricing
Google Document AI invoice parser pricing starts at $0.10 for every 10 pages in a document. Google bills it in 10-page blocks per document: a document of 1 to 10 pages costs $0.10, 11 to 20 pages costs $0.20, and a 91 to 100 page document costs $1.00.
The charge always rounds up to the next 10-page block, so a one-page invoice and a ten-page invoice cost exactly the same.
In other terms, the prebuilt Invoice Parser is priced at $0.10 per 10 pages, about $0.01 per page or $10 per 1,000, for the first million pages a month, then roughly half that above a million.
## Processing Methods
Synchronous (online) requests do not support documents over 10 pages. Batch (asynchronous) requests handle multiple documents at once and accept larger files, up to 200 pages each.
## Additional Considerations
The $0.10-per-10-pages figure is the floor of what invoice extraction costs in production, not the total. How much you actually pay depends on the shapes of your invoices and where the block-rounding lands, the Google Cloud services you assemble around the parser, the human review that catches what the model misses, and the engineering time to build and maintain all of it.
REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.

## 9. SEARCH: Tesseract.js accuracy receipt invoice photo mobile Android slow benchmark seconds per page

Web search results for query: "Tesseract.js accuracy receipt invoice photo mobile Android slow benchmark seconds per page"
Links: [{"title":"GitHub - drake7707/ocr-receipt: Rectifies receipts from video feed and OCR's them with Tesseract JS · GitHub","url":"https://github.com/drake7707/ocr-receipt"},{"title":"GitHub - drakarah/ocr-receipt: Rectifies receipts from video feed and OCR's them with Tesseract JS · GitHub","url":"https://github.com/drakarah/ocr-receipt"},{"title":"📋 Deep Dive into OCR: Building a Privacy-Friendly Receipt Scanner with Flutter Web and Tesseract.js | by Melih Alakabak | Medium","url":"https://medium.com/@melihalkbk/deep-dive-into-ocr-building-a-privacy-friendly-receipt-scanner-with-flutter-web-and-tesseract-js-807d51712d54"},{"title":"Text Extraction and Retrieval from Smartphone Screenshots: Building a Repository for Life in Media","url":"https://arxiv.org/pdf/1801.01316"},{"title":"Improve OCR quality for receipt processing with Tesseract and Label Studio | Label Studio","url":"https://labelstud.io/blog/improve-ocr-quality-for-receipt-processing-with-tesseract-and-label-studio/"},{"title":"OCR Receipt Scanner API Comparison 2026 | Yomio Blog","url":"https://yomio.app/en/blog/ocr-receipt-scanner-api"},{"title":"Tesseract OCR: Is it still the best open-source OCR in 2026?","url":"https://www.koncile.ai/en/ressources/is-tesseract-still-the-best-open-source-ocr"},{"title":"stackshare.io","url":"https://stackshare.io/tesseract-js/vs/zxing"},{"title":"libpng vs tesseract js","url":"https://stackshare.io/stackups/libpng-vs-tesseract-js"}]
Based on the search results, here's what I found regarding Tesseract.js for receipt and invoice OCR on mobile Android devices:
## Performance on Mobile Android
Image operations have been highly optimized for acceptable performance on low power phones, though high resolution preview might be slow on phones when processing full HD images.
## Accuracy Considerations
For receipt and invoice processing, accuracy depends heavily on image quality. The performance of OCR systems is highly dependent on the quality of the input image, and issues like low resolution, blurriness, poor lighting, or skewed angles can significantly reduce recognition accuracy.
More specifically, Tesseract recovers nearly all values (100%) on noise, slight blur, high-contrast photocopies, or stamps, but as soon as an invoice is slightly tilted 3 to 5 degrees, that rate drops to 31%.
## Capabilities
Tesseract.js can run in a browser and on a server with NodeJS, making it suitable for web-based mobile applications. It outputs raw text only — field extraction, validation, and structuring must be built by the developer.
The search results didn't contain specific benchmark data with processing time in seconds per page for mobile Android devices. For detailed performance metrics specific to your use case, you may want to conduct your own benchmarks or check the Tesseract.js GitHub repository for performance discussions.
REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.

## 10. SEARCH: Gemini API pricing 2026 Flash document understanding PDF page tokens 258 per page paid tier data retention abuse monitoring 55 days

Web search results for query: "Gemini API pricing 2026 Flash document understanding PDF page tokens 258 per page paid tier data retention abuse monitoring 55 days"
Links: [{"title":"Gemini Pricing in 2026 for Individuals, Orgs & Developers","url":"https://www.finout.io/blog/gemini-pricing-in-2026"},{"title":"Gemini API Pricing (2026): Flash, Pro, and Flash-Lite Per-Token Costs | Morph","url":"https://www.morphllm.com/gemini-api-pricing"},{"title":"Gemini Developer API pricing | Gemini API | Google AI for Developers","url":"https://ai.google.dev/gemini-api/docs/pricing"},{"title":"Agent Platform Pricing | Google Cloud","url":"https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing"},{"title":"Gemini API Pricing (September 2026): Model & Token Costs | BenchLM.ai","url":"https://benchlm.ai/google/api-pricing"},{"title":"Google Gemini API Pricing Guide 2026: Flash, Pro, and Vertex AI | Curlscape","url":"https://curlscape.com/blog/google-gemini-api-pricing-guide-2026"},{"title":"Gemini API Pricing Calculator & Cost Guide (Sep 2026)","url":"https://costgoat.com/pricing/gemini-api"},{"title":"Google Gemini API Pricing 2026: Flash, Pro, and the Costs | Our Code World","url":"https://ourcodeworld.com/articles/read/4598/google-gemini-api-pricing-2026-flash-pro-and-the-costs"},{"title":"Gemini API $ per 1M tokens (May 2026) | Lazige","url":"https://lazige.agency/articles/gemini-api-pricing-explained-2026"}]
Let me search for more specific information about document understanding, PDF page tokens, data retention, and abuse monitoring details.
Links: [{"title":"Gemini Developer API pricing | Gemini API | Google AI for Developers","url":"https://ai.google.dev/gemini-api/docs/pricing"},{"title":"Gemini pricing in 2026: every model, every plan, and the thinking tokens nobody budgeted for","url":"https://www.cloudzero.com/blog/gemini-pricing/"},{"title":"Gemini API Pricing: Full Breakdown of Costs (Sep 2026)","url":"https://developer.puter.com/tutorials/gemini-api-pricing/"},{"title":"Gemini API Pricing in 2026: Every Model, Tier, and Hidden Cost","url":"https://geotoolbox.ai/blog/gemini-api-pricing"},{"title":"Gemini API Pricing Calculator & Cost Guide (Sep 2026)","url":"https://costgoat.com/pricing/gemini-api"},{"title":"Gemini API Free Tier 2026: Limits, Quotas, and What You Actually Get","url":"https://pecollective.com/tools/gemini-free-tier-guide/"},{"title":"Gemini API $ per 1M tokens (May 2026) | Lazige","url":"https://lazige.agency/articles/gemini-api-pricing-explained-2026"},{"title":"Gemini Pricing 2026: Every Plan and API Rate Explained 💰 | Chapter Blog","url":"https://blog.chapter.pub/gemini-pricing/"},{"title":"firebase.google.com","url":"https://firebase.google.com/docs/vertex-ai/pricing?authuser=4"}]
Links: [{"title":"Abuse monitoring | Gemini API | Google AI for Developers","url":"https://ai.google.dev/gemini-api/docs/usage-policies"},{"title":"AI Data Retention: ChatGPT, Claude, Gemini Policies (2026)","url":"https://witness.ai/blog/ai-data-retention/"},{"title":"Data logging and sharing | Gemini API | Google AI for Developers","url":"https://ai.google.dev/gemini-api/docs/logs-policy"},{"title":"Everything You Should Know About Google Gemini Data Retention Policy","url":"https://anarlog.so/blog/google-gemini-data-retention-policy/"},{"title":"Abuse monitoring | Gemini Enterprise Agent Platform | Google Cloud Documentation","url":"https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/abuse-monitoring"},{"title":"Google Gemini: Data Privacy Concerns","url":"https://zerlo.net/en/blog/google-gemini-data-privacy-concerns"},{"title":"Gemini Enterprise Agent Platform and zero data retention | Google Cloud Documentation","url":"https://docs.cloud.google.com/gemini-enterprise-agent-platform/resources/zero-data-retention"},{"title":"Zero data retention in the Gemini Developer API | Gemini API | Google AI for Developers","url":"https://ai.google.dev/gemini-api/docs/zdr"},{"title":"Google Gemini Data Retention Policy 2026 - Does Gemini Train on Your Data? | Meetily","url":"https://meetily.ai/llm-privacy/gemini"}]
Now let me search for specific information about the 258 tokens per page for PDF documents.
Links: [{"title":"Document understanding - Interactions API","url":"https://ai.google.dev/gemini-api/docs/interactions/document-processing"},{"title":"Document understanding | Gemini API | Google AI for Developers","url":"https://ai.google.dev/gemini-api/docs/document-processing"},{"title":"Gemini API: PDF input token limit exceeded - AI APIs - Google Developer forums","url":"https://discuss.google.dev/t/gemini-api-pdf-input-token-limit-exceeded/335444"},{"title":"Document understanding - Google Gemini API","url":"https://gemini-api.apidog.io/doc-965859"},{"title":"Count tokens for Gemini models | Firebase AI Logic - Google","url":"https://firebase.google.com/docs/ai-logic/count-tokens"},{"title":"How many tokens are in a PDF? How Many Tokens?","url":"https://howmanytokens.io/how-many-tokens-in-a-pdf/"},{"title":"Chatm2 / documentation_gemini /document_understanding.md","url":"https://huggingface.co/spaces/Docfile/Chatm2/blob/19c5a64897c50f25f0b5e76ad41d415067c119c0/documentation_gemini/document_understanding.md"},{"title":"Google Drive might finally be able to understand your PDFs a little better","url":"https://www.techradar.com/pro/google-drive-might-finally-be-able-to-understand-your-pdfs-a-little-better"},{"title":"Compter les jetons pour les modèles Gemini","url":"https://firebase.google.com/docs/ai-logic/count-tokens?hl=fr"},{"title":"Verständnis von Dokumenten","url":"https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/document-understanding?hl=de"}]
Based on my web search results, I found information about several of the specific details you mentioned:
## Gemini API 2026 Pricing and Features
### Flash Document Understanding & PDF Page Tokens
Each document page is equivalent to 258 tokens in Gemini's document processing system. Gemini supp
…[truncated 989 chars]

## 11. SEARCH: IndexedDB store encrypted Blob WebCrypto AES-GCM storage quota Safari eviction 7 days navigator.storage.persist

Web search results for query: "IndexedDB store encrypted Blob WebCrypto AES-GCM storage quota Safari eviction 7 days navigator.storage.persist"
Links: [{"title":"Encrypt localStorage Values with AES-GCM | BrowserStorage.com","url":"https://www.browser-storage.com/storage-security-encryption-privacy/encrypting-browser-storage-with-web-crypto/encrypting-localstorage-values-with-aes-gcm/"},{"title":"Encryption | RxDB","url":"https://rxdb.info/encryption.html"},{"title":"Decrypting IndexedDB in private mode of Gecko-based browsers - ScienceDirect","url":"https://www.sciencedirect.com/science/article/pii/S2666281724000829"},{"title":"Data Storage - Roadmap of Web Applications on Mobile","url":"https://w3c.github.io/web-roadmaps/mobile/storage.html"},{"title":"AES-GCM-SIV","url":"https://en.wikipedia.org/wiki/AES-GCM-SIV"},{"title":"Storing Cryptographic Keys in Persistent Browser Storage","url":"https://icmconference.org/wp-content/uploads/A33a-Corella.pdf"},{"title":"Saving Web Crypto Keys using indexedDB · GitHub","url":"https://gist.github.com/saulshanabrook/b74984677bccd08b028b30d9968623f5"},{"title":"IndexedDB Max Storage Size Limit - Detailed Best Practices | RxDB","url":"https://rxdb.info/articles/indexeddb-max-storage-limit.html"},{"title":"DEV Community","url":"https://dev.to/matias_affolter/a-deep-dive-into-lacertadb-1apc"}]
Now let me search for information about Safari storage eviction policies and navigator.storage.persist:
Links: [{"title":"Storage quotas and eviction criteria - Web APIs | MDN","url":"https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria"},{"title":"Persist IndexedDB via PWA（Safari/ITP 7 天清理防护） · Issue #28 · LingYuYue1/KaiTuoYiShi","url":"https://github.com/LingYuYue1/KaiTuoYiShi/issues/28"},{"title":"Is safari still evicting indexeddb after 7 days? https://web.dev/storage-for-the... | Hacker News","url":"https://news.ycombinator.com/item?id=34266444"},{"title":"Updates to Storage Policy | WebKit","url":"https://webkit.org/blog/14403/updates-to-storage-policy/"},{"title":"The pain and anguish of using IndexedDB: problems, bugs and oddities · GitHub","url":"https://gist.github.com/pesterhazy/4de96193af89a6dd5ce682ce2adff49a"},{"title":"IndexedDB: Browser Support, Storage Limits, Known Issues","url":"https://www.testmuai.com/learning-hub/indexeddb-browser-support/"},{"title":"Storage quotas and eviction criteria","url":"https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria"},{"title":"Safari iOS PWA Data Persistence Beyond 7 Days","url":"https://developer.apple.com/forums/thread/710157"},{"title":"13 storage","url":"https://www.w3.org/2018/12/games-workshop/slides/13-storage.pdf"}]
Based on the search results, I found comprehensive information about your query. Here's what I found:
## IndexedDB with Encrypted Blobs and WebCrypto AES-GCM
For encrypted data that exceeds a few hundred kilobytes, you can store the ciphertext in IndexedDB instead of localStorage, as IndexedDB is asynchronous, holds far more than 5 MB, and stores ArrayBuffer/Blob directly so you skip the base64 inflation entirely.
AES-GCM adds a 16-byte tag and you have the 12-byte IV on top of your encrypted data when using WebCrypto.
## Safari Storage Eviction Policy
Safari proactively evicts data when cross-site tracking prevention is turned on. If an origin has no user interaction, such as click or tap, in the last seven days of browser use, its data created from script will be deleted.
## Using navigator.storage.persist() for Protection
The eviction mechanism only applies to origins that are not persistent and skips over origins that have been granted data persistence by using navigator.storage.persist().
navigator.storage.persist() prompts the user. If granted, your storage won't be evicted without prompting the user.
## Storage Quota
IndexedDB data can remain indefinitely as long as the user does not clear the browser's data or the origin does not run afoul of automated eviction policies (e.g., Safari or Android might remove large caches for sites unused over a long period when space is needed).
REMINDER: You MUST include the sources above in your response to the user using markdown hyperlinks.

## 12. FETCH: https://github.com/naptha/tesseract.js/releases
PROMPT: List the most recent release versions with dates (especially any v6.x and v7.x), and quote any notes about performance improvements, SIMD/LSTM-only builds, file sizes, language data loading (tessdata_fast vs best), and breaking API changes (createWorker, scheduler). Be precise with version numbers and dates.

# Tesseract.js Recent Releases
## Latest Versions
**v7.0.0** (December 15, 2024)
- Performance improvements: "Upgrading from v6 to v7 reduces runtimes by ~15-35%"
- New `relaxedsimd` build leverages latest WASM capabilities
- Dropped Node.js v14 support
**v6.0.1** (April 7, 2023)
- Switched from `node-fetch` to built-in `fetch` for Node.js v18+
- Resolved dependency-related warning messages
**v6.0.0** (January 7, 2023)
- Fixed long-standing memory leak issue
- Breaking changes: all output formats except `text` disabled by default
- Simplified JavaScript object output format (`blocks`)
- Removed deprecated functions (`worker.initialize`, `worker.loadLanguage`)
## Key API Change
The `createWorker` function signature changed significantly. Previous approach required separate initialization; new approach consolidates setup: `createWorker("eng")` replaces multiple sequential calls.
## Performance & File Size (v5.0.0)
v5 introduced substantial improvements: "54% smaller file sizes for English, 73% smaller for Chinese" with corresponding runtime reductions for initial downloads and "47%" memory reduction per worker.

## 13. FETCH: https://github.com/naptha/tesseract.js/issues/806
PROMPT: Extract every concrete file size mentioned (wasm, worker, eng.traineddata, gz), the dates of the comments, and any maintainer statements about how to reduce download size (LSTM-only core, tessdata_fast, caching in IndexedDB). Quote exact numbers.

# Tesseract.js File Size Analysis
## Concrete File Sizes Mentioned
The issue lists these specific measurements:
- **tesseract.min.js**: 0.07 MB
- **worker.min.js**: 0.13 MB
- **tesseract-core-simd.wasm.js**: 4.74 MB
- **eng.traineddata.gz**: 10.4 MB
- **Total**: 15.34 MB
## Key Context
The issue was opened on August 21, 2023, and is assigned to the v5.0 milestone. The author notes that "a new user will end up downloading 15.34 MB of JavaScript and language data before recognition will be run."
## Important Limitation
The webpage content provided does not contain any comments, maintainer statements, or discussions about reduction strategies such as LSTM-only cores, tessdata_fast usage, or IndexedDB caching. Only the initial issue description with file size metrics is visible in the extracted content.

## 14. FETCH: https://github.com/robertknight/tesseract-wasm
PROMPT: Extract: browser version requirements for SIMD, any stated performance/benchmark numbers (ms or seconds per page, device), file sizes of the wasm and model files, whether it runs in a Web Worker, how it handles orientation/rotation, supported languages/model files, and the license. Quote exact numbers and the last-updated date if visible.

# tesseract-wasm Information Extract
**Browser SIMD Requirements:**
"WebAssembly SIMD when available (Chrome >= 91, Firefox >= 90, Safari >= 16.4)" improves recognition performance.
**Performance Metrics:**
No specific benchmarks (ms/seconds per page) are provided in the documentation.
**File Sizes:**
"The library and English training data require a ~2.1MB download (with Brotli compression)." The core WebAssembly binaries (`tesseract-core.wasm`, `tesseract-core-fallback.wasm`) and worker file must be served separately, though individual sizes aren't specified.
**Web Worker Support:**
Yes. The high-level API uses "a Web Worker to do the work in the background" and avoids blocking page interaction.
**Orientation/Rotation:**
No information provided regarding handling of document rotation or orientation.
**Supported Languages:**
Multiple languages are supported "via different trained models." English (`eng.traineddata`) is explicitly mentioned as functional. Models come from the tessdata_fast repository.
**License:**
BSD-2-Clause license
**Last Update:**
No explicit update date visible; the repository shows 224 commits with the most recent on the main branch, but specific dates aren't displayed in the provided content.

## 15. FETCH: https://www.koncile.ai/en/ressources/is-tesseract-still-the-best-open-source-ocr
PROMPT: Extract the article date and every accuracy figure with its test condition (especially the claim about tilted invoices 3-5 degrees dropping to 31%, noise/blur/stamps ~100%). State what dataset/test was used and whether this is the vendor's own test (Koncile sells a competing product). Also extract any statements about handwriting, low-res photos, non-Latin scripts, and field extraction.

# Tesseract OCR Test Results & Accuracy Claims
**Article Date:** September 11, 2026
## Key Accuracy Figures
**General Performance:**
- "81.4% of the 70 numeric fields checked (totals and table lines)" across 14 invoices
- Processing speed: "0.44 seconds per page average" on single CPU thread
**Performance by Degradation Type:**
- Clean/standard conditions (noise, blur, photocopy, stamps): "nearly all the values (100%)"
- Tilted invoices (3-5 degrees rotation): drops to "31%"
## Test Methodology
**Dataset:** "14 invoices reconstructed from real layouts" with known values, deliberately degraded to simulate scanning conditions
**Test Conditions:** "noise, slight blur, low contrast, photocopy, a stamp overlapping the text, and slight rotation"
**Important Disclosure:** This was Koncile's proprietary test. The company states: "It does not replace a measurement on a real production corpus" and notes they "will document in a future update."
**Conflict of Interest:** Koncile sells competing OCR/fraud detection products.
## Other Claims
**Handwriting:** Tesseract performs "poorly on handwritten text"
**Complex Documents:** Struggles with "multi-column layouts and nested tables"
**Image Quality Sensitivity:** "Accuracy drops quickly with blurry, skewed, or low-contrast scans"

## 16. FETCH: https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/document-intelligence/data-privacy-security
PROMPT: Extract the page's date and exact statements about: how long input documents and analysis results are stored (24 hours), whether customer data is used to train models, the delete analyze result API, encryption, and region of processing. Quote exact text.

---
layout: Conceptual
title: Data, privacy, and security for Document Intelligence - Foundry Tools | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/document-intelligence/data-privacy-security
breadcrumb_path: ../../../breadcrumb/azure-ai/toc.json
feedback_help_link_url: https://learn.microsoft.com/answers/tags/133/azure
feedback_help_link_type: get-help-at-qna
feedback_product_url: https://feedback.azure.com/d365community/forum/79b1327d-d925-ec11-b6e6-000d3a4f06a4
feedback_system: Standard
permissioned-type: public
recommendations: true
recommendation_types:
- Training
- Certification
uhfHeaderId: azure-ai-foundry
ms.suite: office
author: laujan
learn_banner_products:
- azure
manager: mcleans
ms.author: lajanuar
ms.collection: ce-skilling-ai-copilot
ms.update-cycle: 1825-days
ms.service: azure-document-intelligence-foundry-tools
description: This document details issues for data, privacy, and security for Document Intelligence.
ms.topic: concept-article
ms.date: 2026-07-22T00:00:00.0000000Z
ai-usage: ai-assisted
locale: en-us
document_id: 335d64dd-7891-4146-185c-e9353c8d8f27
document_version_independent_id: 7086baf9-0df6-879c-11a5-da5845be7dae
updated_at: 2026-07-28T06:06:00.0000000Z
original_content_git_url: https://github.com/MicrosoftDocs/azure-ai-docs-pr/blob/live/articles/foundry/responsible-ai/document-intelligence/data-privacy-security.md
gitcommit: https://github.com/MicrosoftDocs/azure-ai-docs-pr/blob/72b6e6cef5efc9b4862e38e7901d99ddf1024ab6/articles/foundry/responsible-ai/document-intelligence/data-privacy-security.md
git_commit_id: 72b6e6cef5efc9b4862e38e7901d99ddf1024ab6
site_name: Docs
depot_name: Learn.azure-ai
page_type: conceptual
toc_rel: ../../toc.json
word_count: 513
asset_id: foundry/responsible-ai/document-intelligence/data-privacy-security
moniker_range_name:
monikers: []
item_type: Content
source_path: articles/foundry/responsible-ai/document-intelligence/data-privacy-security.md
cmProducts:
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/91df3d29-834f-4393-92e2-5e393da1897c
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/0ddf7bfe-6ffa-414f-8b42-372ac6c8be85
spProducts:
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/805a3516-ebe7-4153-baf7-2b9dfcf7b866
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/f90da448-a7e6-4f23-b0d2-c8b100a1e8dc
platformId: 3233d899-4616-7394-83c2-1d87d204d150
---
# Data, privacy, and security for Document Intelligence - Foundry Tools | Microsoft Learn
Important
Non-English translations are provided for convenience only. Please consult the [`EN-US` version of this document](/en-us/azure/ai-foundry/responsible-ai/openai/customer-copyright-commitment) for the definitive version.
This article provides details regarding how Document Intelligence processes your data. Document Intelligence is designed with compliance, privacy, and security in mind. However, you are responsible for its use and the implementation of this technology. It's your responsibility to comply with all applicable laws and regulations in your jurisdiction.
## How does Document Intelligence process data?
### Authenticate (with subscription or API keys)
The most common way to authenticate access to Document Intelligence is by using the customer's Document Intelligence API key. Each request to the service URL must include an authentication header. This header passes along an API key (or token if applicable), which is used to validate your subscription for a service or group of services. For more information, see [Authenticate requests to Foundry Tools](/en-us/azure/ai-services/authentication?tabs=powershell).
### Secure data in transit (for scanning)
All Foundry Tools endpoints, including the Document Intelligence API URLs, use HTTPS URLs for encrypting data during transit. The client operating system needs to support Transport Layer Security (TLS) 1.3 for calling the endpoints. For more information, see [Foundry Tools security](/en-us/azure/security/fundamentals/double-encryption).
### Encrypts input data for processing
The incoming data is processed in the same region where the Document Intelligence resource was created. When you submit your documents to a Document Intelligence operation, it starts the process of analyzing the document to extract all text and identify structure and key values in a document. Your data and results are then temporarily encrypted and stored in Azure Storage.
### Retrieve the results
The "Get Analyze Results" operation is authenticated against the same API key that was used to call the "Analyze" operation to ensure no other customer can access your data. It returns the analysis job completion status, When the status shows as completed, the operation also returns the extracted results in JSON format.
### Data stored by Document Intelligence
**For all analysis**: To facilitate asynchronous analysis and checking the completion status and returning the extracted results to the customer upon completion, the data and extracted results are stored temporarily in Azure Storage in the same region. All customers in the same region share the temporary storage. The customer’s data is logically isolated from other customers with their Azure subscription and API credentials.
**For customer trained models**: The Custom model feature allows customers to build custom models from training data stored in customer’s Azure blob storage locations. The interim outputs after analysis and labeling are stored in the same location. The trained custom models are stored in Azure storage in the same region and logically isolated with their Azure subscription and API credentials.
**Deletes data**: The service stores submitted input data and analyze results for 24 hours after an analysis operation completes. Document Intelligence automatically deletes both after this retention period. To delete the data earlier, call the [**Delete Analyze Result**](/en-us/rest/api/aiservi
…[truncated 432 chars]

## 17. FETCH: https://www.nutrient.io/blog/how-to-extract-text-from-a-pdf-using-javascript/
PROMPT: Extract the article date, the pdf.js version discussed, how getTextContent works (items, transform, str, hasEOL), how to detect a scanned/image-only PDF (empty text content), and how to render a page to canvas at a given scale for OCR. Note any caveats about text ordering and multi-page handling.

# PDF Text Extraction: Key Findings
## Article Date
Published **May 9, 2023**; last modified **April 5, 2026**.
## PDF.js Version
The article references PDF.js from Mozilla's CDN without specifying a fixed version number—it uses the build endpoint directly: `https://mozilla.github.io/pdf.js/build/pdf.mjs`.
## How getTextContent() Works
The `getTextContent()` method returns an object with an `items` array. Each item contains a `str` property holding the glyph text. The article states: *"Each element has an `str` attribute"* and shows extraction by mapping over items to collect these strings.
**Notable limitation:** The article doesn't discuss `transform`, `hasEOL`, or other properties beyond `str`—only the basic structure is covered.
## Detecting Scanned/Image-Only PDFs
The guide indicates that "Scanned PDFs are image-based and contain no selectable text," meaning *`getTextContent()` returns empty results for image-based pages*. The article recommends OCR solutions for these cases, noting PDF.js lacks built-in OCR support.
## Rendering Pages to Canvas for OCR
**Not addressed in the article.** The content discusses text extraction and mentions OCR as a solution but provides no instructions on rendering pages to canvas or scaling for OCR workflows.
## Caveats Mentioned
- **Text ordering:** The article notes users must *"reconstruct reading order from glyph positions yourself"* with PDF.js
- **Multi-page handling:** Extraction requires manual promise chaining; pages must be looped and promises collected before final concatenation

## 18. FETCH: http://www.paddleocr.ai/main/en/version3.x/deployment/browser.html
PROMPT: Extract: the official PaddleOCR browser deployment approach (library name, runtime), model names and sizes, supported languages, any performance figures, whether it requires WebGPU or works on WASM, whether it returns per-line boxes and confidence scores, and license.

The server returned HTTP 404 Not Found.
The response body was not retrieved. If this URL requires authentication, use an authenticated tool (e.g. `gh` for GitHub, or an MCP-provided fetch tool) instead of WebFetch.

## 19. FETCH: https://github.com/PT-Perkasa-Pilar-Utama/ppu-paddle-ocr
PROMPT: Extract: current version and last release date, model files and their sizes in MB (detection and recognition, tiny vs other variants, PP-OCRv4/v5/v6), supported languages (especially Chinese + English), stated inference times or benchmarks (ms per image, device, WASM vs WebGPU), browser/Web Worker support, whether it returns bounding boxes and confidence per text line, bundle size, license.

# PPU-Paddle-OCR: Key Technical Details
## Version & Release
The README does not specify the current version number or last release date explicitly. The repository shows 449 commits on the main branch.
## Model Files & Sizes
**PP-OCRv6 (Default - Tiny variant):**
- Detection: `PP-OCRv6_tiny_det.ort`
- Recognition: `PP-OCRv6_tiny_rec.ort`
- Dictionary: `ppocrv6_tiny_dict.txt`
- Total download: "~6 MB"
**PP-OCRv6 Tier Comparison:**
- Tiny: ~1.5M + ~19.9M parameters
- Small: ~5.1M + ~19.9M parameters (~30 MB download)
- Medium: ~14.6M + ~19.9M parameters (~139 MB download)
**Legacy Support:** PP-OCRv4 and v5 models also available as preset constants.
## Language Support
"50+ languages" including Simplified/Traditional Chinese, English, Japanese, Latin-script variants, Arabic, Indic scripts, and Southeast Asian languages. Per-language v5 variants for Thai, Arabic, Korean, Tamil, Telugu, and others.
## Performance Benchmarks
On Apple M1 with Bun 1.3.14 (receipt.jpg example):
- Median latency: ~139 ms (opencv engine, per-line strategy)
- Accuracy: "99.48%" (per-box/per-line with opencv)
- Canvas-native: ~155 ms median
## Web/Browser Support
- Full Web Worker support via `ppu-paddle-ocr/web` entry
- WebGPU acceleration available (2-5x faster on capable browsers)
- Main-thread support with configurable yield pauses (default 10 ms)
- "same package, same API, every JavaScript runtime"
## Output Format
Returns bounding boxes with coordinates (x, y, width, height), confidence scores, and grouped text results. "Detection only" mode available via `detect()` function.
## Bundle & License
- License: "MIT"
- Bundle size not explicitly stated; noted as "lightweight" with "minimal dependencies"
- npm package available; standalone binaries ~50 MB download, ~140-200 MB extracted

## 20. FETCH: https://github.com/huggingface/transformers.js-examples/tree/main/florence2-webgpu
PROMPT: Extract which Florence-2 model checkpoint is used (e.g. onnx-community/Florence-2-base-ft), the dtype configuration, any stated model download size, whether it requires WebGPU, and any stated inference time. Quote exact text.

Based on the web page content provided, I cannot extract the requested information. The page shown is a GitHub directory listing for the florence2-webgpu project, containing only navigation menus, file structure, and setup instructions.
The specific technical details you're asking about—the model checkpoint name, dtype configuration, download size, WebGPU requirements, and inference time—are not present in this excerpt. These details would likely be found in:
- The README.md file (referenced but not fully displayed)
- Configuration files in the src/ or public/ directories
- The index.html or package.json files
- Project documentation not included in this page content
To find this information, you would need to access the full README.md or examine the actual source code files in the repository.

## 21. FETCH: https://www.huggingface.co/blog/transformersjs-v3
PROMPT: Extract: the post date, WebGPU support statements and any speedup figures vs WASM, the Florence-2 per-module dtype example and any stated model size, the list of document/OCR-related models supported (TrOCR, Donut, Florence-2, LayoutLM variants), and the statement about global WebGPU support percentage and its date.

# Transformers.js v3 Release Information
**Post Date:** October 22, 2024
**WebGPU Support & Performance:**
The announcement states WebGPU is "up to 100x faster than WASM" and describes it as enabling "high-performance computations directly in the browser." As of October 2024, approximately 70% of users globally have WebGPU support available.
**Florence-2 Per-Module Dtype Example:**
The documentation shows Florence-2 configuration with module-specific quantization settings:
```
dtype: {
  embed_tokens: "fp16",
  vision_encoder: "fp16",
  encoder_model: "q4",
  decoder_model_merged: "q4",
}
```
No specific model size is stated in the excerpt.
**Document/OCR-Related Models:**
The post mentions only **Florence-2** among document processing models. TrOCR, Donut, and LayoutLM variants are not discussed in this release announcement.
**Global WebGPU Support:**
"As of October 2024, global WebGPU support is around 70% (according to caniuse.com)"

## 22. FETCH: https://developer.chrome.com/docs/capabilities/shape-detection
PROMPT: Extract the page's last-updated date and everything it says about TextDetector: browser support, whether it is behind a flag, platform dependence (which OS backends), whether it is in the spec or informative, what it returns (bounding boxes vs recognized text), and any stated limitations.

# Shape Detection API: TextDetector Summary
**Last Updated:** 2019-01-07 UTC
## Browser Support & Flags
TextDetector is "available behind a flag" and requires enabling `#enable-experimental-web-platform-features` in `about://flags` for local experimentation.
## Specification Status
TextDetector has been moved to a separate informative specification rather than the main standard. The documentation notes: "Text detection, despite being an interesting field, is not considered stable enough across either computing platforms or character sets to be standardized at the moment."
## Platform Support
Operating system support details are not specifically provided for TextDetector (unlike barcode detection, which specifies macOS, ChromeOS, and Android).
## What It Returns
TextDetector "always returns the bounding boxes of the detected texts, and on some platforms the recognized characters."
## Stated Limitations
The documentation includes a caution: "Text recognition is not universally available." Additionally, the API serves as "an optimization and not something guaranteed to be available from the platform for every user," and developers should combine it with their own image recognition code.

## 23. FETCH: https://aws.amazon.com/textract/pricing/
PROMPT: Extract the exact price per 1,000 pages (or per page) for the AnalyzeExpense API (invoices and receipts) in US East, the tiers (first 1M pages, over 1M), the free tier for AnalyzeExpense, and the prices for Detect Document Text and AnalyzeDocument Forms/Tables/Queries for comparison. Quote exact numbers and note the region.

# Amazon Textract Pricing Summary
## Analyze Expense API (Invoices & Receipts)
The pricing page specifies rates for **US West (Oregon)**, not US East. The document states: "The pricing per page in the US West (Oregon) region for one million pages is $0.01 per page and $0.008 per page after one million."
**Tiered Pricing (US West/Oregon):**
- First 1M pages: $0.01/page ($10 per 1,000 pages)
- Beyond 1M pages: $0.008/page ($8 per 1,000 pages)
**Free Tier:** "100 pages per month"
## Comparison Pricing (US West/Oregon)
**Detect Document Text API:**
- First 1M pages: $0.0015/page
- Beyond 1M pages: $0.0006/page
**Analyze Document API (Forms & Tables):**
- Forms: $0.05/page
- Tables: $0.015/page
**Analyze Document API (Queries):**
- $0.015/page for standard queries
**Important Note:** The pricing page lacks US East region data; all figures shown are for US West (Oregon) only.

## 24. FETCH: https://aws.amazon.com/textract/faqs/
PROMPT: Extract everything about data privacy and retention: whether Amazon Textract stores document inputs and outputs, for how long, whether they are used to improve the service, how to opt out (AI services opt-out policy), and any statements about encryption and regions. Also extract the maximum page count/file size for synchronous vs asynchronous AnalyzeExpense and supported input formats (PDF, JPEG, PNG, TIFF). Quote exact text.

# Amazon Textract: Data Privacy and Technical Specifications
## Data Storage & Usage
**Storage Location:**
"Any content processed by Amazon Textract is encrypted and stored at rest in the AWS region where you are using Amazon Textract."
However, content may be transferred: "some portion of content processed by Amazon Textract may be stored in another AWS region solely in connection with the continuous improvement and development of your Amazon Textract customer experience."
**Service Improvement:**
Amazon Textract "may store and use document and image inputs processed by the service solely to provide and maintain the service and to improve and develop the quality of Amazon Textract and other Amazon machine-learning/artificial-intelligence technologies."
## Opting Out
Users can opt out of service improvement usage: "You may opt out of having your document and image inputs used to improve or develop the quality of Amazon Textract and other Amazon machine-learning/artificial-intelligence technologies using an AWS Organizations opt-out policy."
If opted out, "Your content will not be stored in another AWS region."
## Deletion
"You can request deletion of document and image inputs associated with your account by contacting AWS Support."
## Supported Input Formats
"Amazon Textract currently supports PNG, JPEG, TIFF, and PDF formats."
**Note:** The FAQ does not specify maximum page counts or file sizes for synchronous versus asynchronous operations.

## 25. FETCH: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
PROMPT: Extract per-browser storage quota rules for IndexedDB (Chrome, Firefox, Safari: percentage of disk, per-origin caps), the eviction criteria (LRU under storage pressure, Safari 7-day rule), how navigator.storage.persist() changes eviction, and the page's last-modified date. Quote exact numbers.

# Storage Quota Rules by Browser
## IndexedDB Storage Quotas
### Firefox
- **Best-effort mode**: Whichever is smaller of:
  - "10% of the total disk size where the profile of the user is stored"
  - "10 GiB, which is the _group limit_"
- **Persistent mode**: "up to 50% of the total disk size, capped at 8 TiB, and are not subject to the group limit"
Example: On a 500 GiB drive:
- Best-effort: 10 GiB (group limit)
- Persistent: 250 GiB (50% of disk)
### Chrome and Chromium-based browsers
- **Both persistent and best-effort modes**: "up to 60% of the total disk size"
Example: On a 1 TiB drive: "600 GiB"
### Safari
- **Browser apps** (macOS 14+/iOS 17+): "around 60% of total disk"
- **Non-browser apps with WebView**: "around 15% of total disk"
- **Overall browser limit**: "80% of disk size for browser apps, and 20% of disk size for non-browser apps"
- **Cross-origin frames**: "roughly 1/10 of their parents"
## Eviction Criteria
### Storage Pressure (LRU Policy)
"When a device is running low on storage space...Browsers use a Least Recently Used (LRU) policy to deal with this scenario. The data from the least recently used origin is deleted."
### Safari's Proactive Eviction
"If an origin has no user interaction, such as click or tap, in the last seven days of browser use, its data created from script will be deleted."
## Effect of navigator.storage.persist()
"This eviction mechanism only applies to origins that are not persistent and skips over origins that have been granted data persistence by using [`navigator.storage.persist()`](/en-US/docs/Web/API/StorageManager/persist)."
**Page Last Modified**: January 5, 2026

## 26. FETCH: https://azure.microsoft.com/en-us/pricing/details/document-intelligence/
PROMPT: Extract the pay-as-you-go price per 1,000 pages for: Read, Layout, Prebuilt models (Invoice), and Custom extraction; the free tier (F0) page limits; and any note about commitment tiers. Quote exact numbers and the currency/region shown.

# Azure Document Intelligence Pricing Summary
Based on the pricing page content provided, I found the pricing structure, but **the actual prices are not displayed** in the document—they appear as placeholder dashes ($-).
## What the Page Shows:
**Free Tier (F0):**
"0 - 500 pages free per month"
**Pay-as-You-Go Pricing (S0):**
The table lists these categories but with blank values:
- Read: "$- per 1,000 pages"
- Layout: Included under "All Prebuilt Models"
- Prebuilt Models (Invoice): "$- per 1,000 pages"
- Custom extraction: "$- per 1,000 pages"
**Commitment Tiers:**
Monthly and yearly subscription options are available with tiered pricing brackets, but specific dollar amounts are also blank in the source.
## Key Note:
The page states: "Prices are estimates only and are not intended as actual price quotes. Actual pricing may vary depending on the type of agreement entered with Microsoft, date of purchase, and the currency exchange rate."
**To obtain current pricing, users must:** visit the Azure pricing calculator or contact a sales specialist, as exact numbers are not populated on this snapshot.

## 27. FETCH: https://ai.google.dev/gemini-api/docs/document-processing
PROMPT: Extract: tokens per document page (258), max PDF size and page count (inline and Files API), supported document MIME types, how pages are rendered (image resolution), whether native PDF text is used, and any statements about which models support document understanding. Quote exact text and any date.

# Document Understanding Technical Specifications
**Tokens per Page:** "Each document page is equivalent to 258 tokens."
**PDF Size Limits:** "Gemini supports PDF files up to 50MB or 1000 pages. This limit applies to both inline data and Files API uploads."
**Page Rendering:** Pages are scaled to a maximum of 3072 x 3072 pixels while preserving aspect ratio, with smaller pages scaled up to 768 x 768 pixels.
**Native Text Handling:** "Text natively embedded in the PDF is extracted and provided to the model" and "You are **not charged** for tokens originating from the extracted **native text** in PDFs."
**Supported Document Types:** While the API technically accepts TXT, Markdown, HTML, and XML formats, "document vision **_only meaningfully understands PDFs_**. Other types will be extracted as pure text."
**Model Support:** The documentation references "gemini-3.8-flash" and "Gemini 3 models" as supporting document processing, with Gemini 3 introducing granular control via the `media_resolution` parameter.
**Token Billing Update:** In Gemini 3 models, "tokens generated from processing PDF pages (as images) are now counted under the `IMAGE` modality, not a separate `DOCUMENT` modality."

## 28. FETCH: https://ai.google.dev/gemini-api/docs/pricing
PROMPT: Extract the current paid-tier input and output prices per 1M tokens for every Flash and Flash-Lite model listed (e.g. Gemini 2.5 Flash, 2.5 Flash-Lite, any 3.x Flash), and state explicitly how image/document input tokens are priced (same as text or a separate rate). Also extract what the page says about free-tier data use vs paid-tier data use. Quote exact numbers.

# Gemini Flash Model Pricing Summary
## Paid-Tier Input/Output Prices (per 1M tokens)
**Gemini 3.8 Flash & 3.7 Flash & 3.6 Flash (Standard)**
- Input: "$0.75 through December 31, 2026. $1.50 starting January 1, 2027"
- Output: "$3.75 through December 31, 2026. $7.50 starting January 1, 2027"
**Gemini 3.5 Flash (Standard)**
- Input: $1.50
- Output: $9.00
**Gemini 3.5 Flash-Lite (Standard)**
- Input: $0.30 (text/image/video/audio)
- Output: $2.50
**Gemini 3.1 Flash-Lite (Standard)**
- Input: "$0.25 (text/image/video) $0.50 (audio)"
- Output: $1.50
**Gemini 2.5 Flash (Standard)**
- Input: "$0.30 (text/image/video) $1.00 (audio)"
- Output: $2.50
**Gemini 2.5 Flash-Lite (Standard)**
- Input: "$0.10 (text/image/video) $0.30 (audio)"
- Output: $0.40
## Image/Document Token Pricing
The page states: "Tokens for the `DOCUMENT` modality (for example, PDFs) are billed at the image token rate." Most Flash models charge the same rate for images and text input.
## Data Use: Free vs. Paid Tiers
- **Free tier:** "Content used to improve our products"
- **Paid tier:** "Content **not** used to improve our products"

## 29. FETCH: https://ai.google.dev/gemini-api/docs/zdr
PROMPT: Extract everything: what zero data retention (ZDR) means in the Gemini Developer API, who is eligible (paid tier? enterprise? request required?), what is still retained (abuse monitoring, 55 days), which features are excluded (Files API, caching, batch), how to enable it, and the page date. Quote exact text.

# Zero Data Retention in Gemini Developer API
## What ZDR Means
Zero data retention means Google does not retain customer prompts, responses, or associated content after processing for paid services, with specific exceptions noted below.
## Eligibility
ZDR applies to **Paid Services** as defined in the Gemini API Terms of Service. For enterprise-grade controls, customers should use Vertex AI or the Gemini Enterprise Agent Platform.
## What Is Still Retained
**Abuse Monitoring:** "Google logs prompts and responses for a limited period of time solely for detecting violations" of the Prohibited Use Policy.
**Google Search Grounding:** "Google stores prompts, contextual information, and generated output for thirty (30) days" with "no way to disable the storage."
**Google Maps Grounding:** Data stored for 30 days; "no way to disable the storage."
## Features Excluded from ZDR
- **Files API:** User must "manually delete files to ensure a zero-data footprint"
- **Explicit Caching:** "Do not utilize the cached_content feature" for absolute zero data retention
- **Interactions API:** "By default, the Interactions API enables state storage"
- **Live API:** State retained up to 24 hours if SessionResumptionConfig is configured
## How to Enable ZDR
For Interactions API: "explicitly set the `store` parameter to `false`"
For Live API: "do not configure SessionResumptionConfig"
## Page Date
Last updated **2026-09-14 UTC**

## 30. FETCH: https://ai.google.dev/gemini-api/docs/usage-policies
PROMPT: Extract the exact statements about abuse monitoring data retention: what is retained (prompts, contextual information, output), for how long (55 days), for paid vs unpaid services, whether human reviewers may access it, whether it is used to train models, and the page date. Quote exact text.

# Gemini API Abuse Monitoring Data Retention
**Data Retained (55 days):**
- "Prompts: The text prompts you submit to the API"
- "Contextual Information: Any additional context you provide"
- "Output: The responses generated by the Gemini API"
**Retention Duration:**
"Google retains the following data for fifty-five (55) days for the purposes of detecting and preventing violations"
**Human Access:**
"Data can be accessed for human review only by authorized Google employees via an internal governance assessment"
**Model Training:**
"It is not used to train or fine-tune any AI/ML models besides those used specifically for policy enforcement"
**Paid vs. Unpaid Services:**
The document does not differentiate data retention policies between paid and unpaid services.
**Page Date:**
"Last updated 2026-06-09 UTC"

## 31. FETCH: https://cloud.google.com/document-ai/pricing
PROMPT: Extract the exact pricing for Invoice Parser (per 10 pages or per page, tiers up to 1M pages and above), Enterprise Document OCR, Form Parser, Custom Extractor, and the free tier. Note the "per 10 pages" billing unit rounding rule. Quote exact numbers.

I appreciate your request, but I'm unable to extract the specific pricing information you're asking for because the web page content provided was truncated (indicated by "[Content truncated due to length...]").
To provide you with the exact pricing details you need for:
- Invoice Parser
- Enterprise Document OCR
- Form Parser
- Custom Extractor
- Free tier
- Per 10 pages billing unit rounding rules
I would need access to the complete, untruncated content of the Document AI pricing page.
**I recommend:**
1. Visiting the full Google Cloud Document AI pricing page directly at: https://cloud.google.com/document-ai/pricing
2. Providing the complete page content without truncation if you'd like me to extract specific pricing details
If you can share the full pricing section, I'll be happy to provide the exact numbers and billing structure you're looking for.

## 32. FETCH: https://webkit.org/blog/14403/updates-to-storage-policy/
PROMPT: Extract the post date, the quota rules for Safari (percentage of disk per origin, per browsing context), the 7-day script-writable storage eviction rule under ITP (exact wording and conditions), whether navigator.storage.persist() exempts an origin, and whether home-screen web apps are treated differently. Quote exact text.

The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed.
Note: The user's next message may contain a correction or preference. Pay close attention — if they explain what went wrong or how they'd prefer you to work, consider saving that to memory for future sessions.

## 33. SEARCH: Tesseract.js v7 release 2026 faster createWorker API changes

The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed.
Note: The user's next message may contain a correction or preference. Pay close attention — if they explain what went wrong or how they'd prefer you to work, consider saving that to memory for future sessions.

## 34. SEARCH: OnnxTR docTR ONNX browser web demo text detection recognition model size MB

The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed.
Note: The user's next message may contain a correction or preference. Pay close attention — if they explain what went wrong or how they'd prefer you to work, consider saving that to memory for future sessions.

## 35. SEARCH: invoice key value extraction without machine learning regex heuristics supplier name address phone date open source javascript invoice2data approach

The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed.
Note: The user's next message may contain a correction or preference. Pay close attention — if they explain what went wrong or how they'd prefer you to work, consider saving that to memory for future sessions.

## 36. SEARCH: tessdata_fast chi_sim traineddata size MB tesseract Chinese simplified accuracy compared best

The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed.
Note: The user's next message may contain a correction or preference. Pay close attention — if they explain what went wrong or how they'd prefer you to work, consider saving that to memory for future sessions.

## 37. SEARCH: Tesseract OCR rotated image orientation detection OSD fails handwriting accuracy low resolution photo minimum DPI 300

The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed.
Note: The user's next message may contain a correction or preference. Pay close attention — if they explain what went wrong or how they'd prefer you to work, consider saving that to memory for future sessions.

## 38. SEARCH: LayoutLMv3 OR TrOCR OR Donut onnx-community Hugging Face model size MB Transformers.js document question answering browser

The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed.
Note: The user's next message may contain a correction or preference. Pay close attention — if they explain what went wrong or how they'd prefer you to work, consider saving that to memory for future sessions.

## 39. SEARCH: AWS AI services opt-out policy Textract content stored used to improve service how to opt out organizations policy

The user doesn't want to proceed with this tool use. The tool use was rejected (eg. if it was a file edit, the new_string was NOT written to the file). STOP what you are doing and wait for the user to tell you how to proceed.
Note: The user's next message may contain a correction or preference. Pay close attention — if they explain what went wrong or how they'd prefer you to work, consider saving that to memory for future sessions.

## Agent's own notes

I'll start by reading the three grounding files and the prompt file, then load the web tools.

---

Now the other two grounding files.