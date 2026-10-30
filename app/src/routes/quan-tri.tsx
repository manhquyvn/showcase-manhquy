import { createFileRoute } from '@tanstack/react-router'
import { AdminServerPanel } from '../components/AdminServerPanel'
import { AdminRound2Panel } from '../components/AdminRound2Panel'

export const Route = createFileRoute('/quan-tri')({
  component: AdminPage,
  head: () => ({
    meta: [{ title: 'Quản trị showcase — Dành cho giáo viên' }],
  }),
})

function AdminPage() {
  return (
    <main>
      <section className="exhibits" style={{ paddingTop: 128 }}>
        <div className="wrap">
          <h2 className="sec">Quản trị showcase</h2>
          <p className="sec-sub">
            Trang dành cho giáo viên. Mọi thay đổi tại đây ghi thẳng vào hệ
            thống và hiện ngay trên trang của phụ huynh: duyệt nội dung, tình
            trạng nhóm, thông tin nhóm và sản phẩm, checklist sẵn sàng, bàn
            giao cuối khóa, link riêng từng bé, sổ đồng ý phụ huynh, nhật ký
            kiểm toán và đóng băng cuối khóa.
          </p>

          <AdminServerPanel />

          <AdminRound2Panel />
        </div>
      </section>
    </main>
  )
}
