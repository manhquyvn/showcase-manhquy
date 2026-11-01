import { createFileRoute } from '@tanstack/react-router'
import { JourneyExplorer, PrStepper, Receipt } from '../components/sections'
import { Slide } from '../components/animate-ui/primitives/effects/slide'

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
          <Slide asChild inView offset={20}>
            <h2 className="sec">Lộ trình con đi qua trong 24 buổi</h2>
          </Slide>
          <p className="sec-sub">
            Bấm vào từng chặng để xem con làm gì và bằng chứng nào được để
            lại.
          </p>
        </div>
        <div className="wrap">
          <Slide inView offset={32}>
            <JourneyExplorer />
          </Slide>
        </div>
      </section>

      <section className="process" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Slide asChild inView offset={20}>
            <h2 className="sec">Không một thay đổi nào đi đường tắt</h2>
          </Slide>
          <p className="sec-sub">
            Bấm vào từng trạm để xem trạm đó chặn lỗi gì.
          </p>
          <Slide inView offset={32}>
            <PrStepper />
            <Receipt />
          </Slide>
        </div>
      </section>
    </main>
  )
}
