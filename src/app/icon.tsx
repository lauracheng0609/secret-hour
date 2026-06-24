import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 112,
          background: "linear-gradient(135deg, #FFE3F9 0%, #ffd6f5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="320" height="290" viewBox="0 0 110 100" fill="none">
          <path
            d="M55 90 C55 90 10 58 10 30 C10 14 22 4 35 4 C44 4 52 9 55 17 C58 9 66 4 75 4 C88 4 100 14 100 30 C100 58 55 90 55 90Z"
            fill="#FF4894"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
