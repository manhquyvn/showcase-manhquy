import { createFileRoute } from '@tanstack/react-router'
import { FaqList, RolesAccordion } from '../components/sections'
import { Slide } from '../components/animate-ui/primitives/effects/slide'

export const Route = createFileRoute('/phu-huynh')({
  component: ParentsPage,
  head: () => ({
    meta: [{ title: 'Dành cho phụ huynh — Phòng triển lãm số' }],
  }),
})

const TIPS = [
  {
    t: 'Xem buổi trình diễn của con',
    d: 'Buổi 12 của mỗi học phần là buổi showcase. Con trình diễn sản phẩm đang chạy thật và trả lời vấn đáp về phần mình làm.',
  },
  {
    t: 'Hỏi con về vai trò của tuần này',
    d: 'Bốn vai trò luân phiên mỗi buổi: điều phối, vận hành agent, kiểm duyệt, ghi chép. Hỏi con tuần này giữ vai nào là cách dễ nhất để con kể lại việc học.',
  },
  {
    t: 'Xem bằng chứng thay vì nghe kể',
    d: 'Mỗi thay đổi trên dự án đều có pull request và bản dùng thử đi kèm. Phụ huynh bấm vào cửa hàng ở trang dự án là thấy đúng thứ con và nhóm vừa làm xong.',
  },
]

function ParentsPage() {
  return (
    <main>
      <section className="roles" style={{ paddingTop: 128 }}>
        <div className="wrap">
          <Slide asChild inView offset={20}>
            <h2 className="sec">Phụ huynh đồng hành cùng con thế nào</h2>
          </Slide>
          <div className="role-list" style={{ marginTop: 44 }}>
            {TIPS.map((r, i) => (
              <Slide asChild inView offset={24} delay={i * 110} key={r.t}>
              <div className="tip-row">
                <span className="idx">0{i + 1}</span>
                <h3>{r.t}</h3>
                <p>{r.d}</p>
              </div>
              </Slide>
            ))}
          </div>
          <Slide asChild inView offset={28}>
          <div className="parent-card">
            <div>
              <h3>Có câu hỏi về tiến độ của con?</h3>
              <p>
                Giáo viên cập nhật tình trạng dự án trên trang này sau mỗi
                mốc. Việc riêng của từng em, phụ huynh trao đổi trực tiếp với
                giáo viên qua trang liên hệ.
              </p>
            </div>
            <a
              className="btn primary"
              href="https://www.manhquy.id.vn/vi/contact"
              target="_blank"
              rel="noopener"
            >
              Liên hệ giáo viên
            </a>
          </div>
          </Slide>
        </div>
      </section>

      <section className="roles" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Slide asChild inView offset={20}>
            <h2 className="sec">AI gánh phần thực thi, học sinh giữ bốn vị trí</h2>
          </Slide>
          <p className="sec-sub">
            Bốn vai trò luân phiên mỗi buổi. Em nào cũng phải qua đủ cả bốn,
            nên không ai làm thay ai được lâu. Bấm vào từng vai trò để xem mô
            tả.
          </p>
          <Slide inView offset={28}>
            <RolesAccordion />
          </Slide>
        </div>
      </section>

      <section className="faq">
        <div className="wrap">
          <Slide asChild inView offset={20}>
            <h2 className="sec">Hỏi đáp cho phụ huynh</h2>
          </Slide>
          <Slide inView offset={28}>
            <FaqList />
          </Slide>
        </div>
      </section>
    </main>
  )
}
