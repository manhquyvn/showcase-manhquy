import { createFileRoute } from '@tanstack/react-router'
import { JourneyExplorer, PrStepper, Receipt } from '../components/sections'

export const Route = createFileRoute('/lo-trinh')({
  component: JourneyPage,
  head: () => ({
    meta: [{ title: 'Lộ trình học — Phòng triển lãm số' }],
  }),
})

function JourneyPage() {
  return (
    <main>
      <section className="journey" style={{ paddingTop: 64 }}>
        <div className="wrap journey-head">
          <h2 className="sec">Lộ trình con đi qua trong 24 buổi</h2>
          <p className="sec-sub">
            Bấm vào từng chặng để xem con làm gì và bằng chứng nào được để
            lại.
          </p>
        </div>
        <div className="wrap">
          <JourneyExplorer />
        </div>
      </section>

      <section className="process" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <h2 className="sec">Không một thay đổi nào đi đường tắt</h2>
          <p className="sec-sub">
            Bấm vào từng trạm để xem trạm đó chặn lỗi gì.
          </p>
          <PrStepper />
          <Receipt />
        </div>
      </section>
    </main>
  )
}
