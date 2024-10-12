import { NextResponse } from "next/server";

export async function POST(req) {
  const formData = await req.formData();
  const files = formData.getAll("image");

  if (!files || files.length === 0) {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }

  try {
    const formData = new FormData();
    // formData.append("image", fileBuffer);
    for (const [index, file] of files.entries()) {
      const fileBuffer = await file.arrayBuffer();
      formDataToSend.append(`image${index + 1}`, fileBuffer);
    }

    const response = await fetch(
      "https://c26a-34-125-246-198.ngrok-free.app/process_images",
      {
        method: "POST",
        body: formData,
        headers: {
          // 'Content-Type': 'multipart/form-data' is not needed; fetch sets it automatically
        },
      }
    );

    const llmResponse = await response.json();

    return NextResponse.json({ diagnosis: llmResponse.data.diagnosis });
  } catch (error) {
    console.error("Error sending file to LLM:", error);
    return NextResponse.json(
      { message: "Failed to extract diagnosis" },
      { status: 500 }
    );
  }
}
