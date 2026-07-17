import { ImageResponse } from 'next/og'

export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: '#2563eb',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 100,
          color: 'white',
          fontWeight: 700,
        }}
      >
        מ
      </div>
    ),
    { width: 192, height: 192 }
  )
}
