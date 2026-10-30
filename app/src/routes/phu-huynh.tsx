import { createFileRoute } from '@tanstack/react-router'
import { FaqList, RolesAccordion } from '../components/sections'

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
          <h2 className="sec">Phụ huynh đồng hành cùng con thế nào</h2>
          <div className="role-list" style={{ marginTop: 44 }}>
            {TIPS.map((r, i) => (
              <div className="tip-row" key={r.t}>
                <span className="idx">0{i + 1}</span>
                <h3>{r.t}</h3>
                <p>{r.d}</p>
              </div>
            ))}
          </div>
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
        </div>
      </section>

      <section className="roles" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <h2 className="sec">AI gánh phần thực thi, học sinh giữ bốn vị trí</h2>
          <p className="sec-sub">
            Bốn vai trò luân phiên mỗi buổi. Em nào cũng phải qua đủ cả bốn,
            nên không ai làm thay ai được lâu. Bấm vào từng vai trò để xem mô
            tả.
          </p>
          <RolesAccordion />
        </div>
      </section>

      <section className="faq">
        <div className="wrap">
          <h2 className="sec">Hỏi đáp cho phụ huynh</h2>
          <FaqList />
        </div>
      </section>
    </main>
  )
}
