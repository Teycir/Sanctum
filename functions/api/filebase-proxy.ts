// Cloudflare Worker Proxy for Filebase S3 API

interface Env {
  // Add environment variables here if needed
  [key: string]: unknown;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request } = context;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Expose-Headers": "ETag, x-amz-meta-cid",
  };

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract Filebase request details from headers
    const filebaseUrl = request.headers.get("X-Filebase-URL");
    const filebaseMethod = request.headers.get("X-Filebase-Method") || "PUT";

    if (!filebaseUrl) {
      return new Response("Missing X-Filebase-URL header", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Forward all AWS signature headers
    const forwardHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (
        key.startsWith("x-amz-") ||
        key === "authorization" ||
        key === "host" ||
        key === "content-type"
      ) {
        forwardHeaders[key] = value;
      }
    });

    // Get request body
    const body = request.method === "POST" ? await request.arrayBuffer() : null;

    // Forward to Filebase
    const filebaseResponse = await fetch(filebaseUrl, {
      method: filebaseMethod,
      headers: forwardHeaders,
      body: body,
    });

    // Get response body
    const responseBody = await filebaseResponse.arrayBuffer();

    // Forward response with CORS headers
    const responseHeaders = new Headers(corsHeaders);
    filebaseResponse.headers.forEach((value, key) => {
      if (key === "x-amz-meta-cid" || key === "etag") {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set("Content-Type", filebaseResponse.headers.get("Content-Type") || "application/octet-stream");

    return new Response(responseBody, {
      status: filebaseResponse.status,
      statusText: filebaseResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Proxy error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
