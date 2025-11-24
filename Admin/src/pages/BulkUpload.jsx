import React, { useState } from "react";

const pythonScript = `import pandas as pd
import json, math

df = pd.read_excel("/content/filtered_products.xlsx")
columns = ['Itemname','Packing','Companyname','price','Discount For Customer (%)','Discount for Promoter in %','image']
df = df[columns]
chunk_size = 250
num_chunks = math.ceil(len(df) / chunk_size)
for i in range(num_chunks):
    start = i*chunk_size
    chunk = df.iloc[start:start+chunk_size]
    products = chunk.to_dict(orient="records")
    out = {"products": products}
    with open(f"/content/p_part_{i+1}.json","w",encoding="utf-8") as f:
        json.dump(out,f,ensure_ascii=False,indent=4)
`;

const BulkUpload = () => {
  const [copied, setCopied] = useState("");

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("failed");
      setTimeout(() => setCopied(""), 2000);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4">Bulk Upload — Products</h1>

        <section className="mb-6">
          <h2 className="text-lg font-medium mb-2">Step 1 — Prepare CSV / Excel</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Export your product data to CSV or Excel.</li>
            <li>Remove columns not needed by the product model.</li>
            <li>Keep required columns. Example mapping:</li>
          </ol>

          <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm">
            <div><strong>CSV column</strong> → <strong>Target key</strong></div>
            <div>Itemname → Itemname</div>
            <div>Packing → Packing</div>
            <div>Companyname → Companyname</div>
            <div>price → price (MRP)</div>
            <div>Discount For Customer (%) → Discount For Customer (%)</div>
            <div>Discount for Promoter in % → Discount for Promoter in %</div>
            <div>image → image (public URL)</div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-medium mb-2">Step 2 — Convert CSV/Excel to JSON</h2>
          <p className="text-sm mb-2">Use Google Colab or local Python to convert the cleaned Excel to JSON files, split into chunks (≤250 products) to avoid server limits.</p>

          <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 mb-2">
            <pre className="text-xs whitespace-pre-wrap">{pythonScript}</pre>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => copy(pythonScript, "python")}
              className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
            >
              Copy Python script
            </button>
            <span className="text-sm self-center">{copied === "python" ? "Copied" : ""}</span>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-medium mb-2">Step 3 — Get Admin Token</h2>
          <p className="text-sm mb-2">Use Postman to call the admin login endpoint (e.g. <code>/api/admin/login</code>), POST email & password, copy the returned token.</p>
          <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-sm">
            Authorization header example:
            <pre className="mt-2 text-xs">Key: Authorization
Value: Bearer &lt;your-token&gt;</pre>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-medium mb-2">Step 4 — Upload JSON chunks</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Open Postman → POST → your bulk upload endpoint (e.g. <code>/api/admin/bulk-products</code>).</li>
            <li>In Body → raw → JSON, paste one JSON file (max 250 products) and send.</li>
            <li>Repeat for each JSON file generated.</li>
            <li>Server returns success or error details per chunk.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">Tips & Best Practices</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Keep a backup of original CSV/JSON files.</li>
            <li>Test with a small chunk first (5–10 products).</li>
            <li>Ensure image URLs are public and reachable.</li>
            <li>Validate required fields (Itemname, price) to avoid failures.</li>
            <li>If upload errors occur, inspect the server response for row-level issues.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default BulkUpload;
