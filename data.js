// ============================================================
// DỮ LIỆU SHOWCASE — tách khỏi giao diện, đúng bài học lõi của khóa:
// sửa dữ liệu ở một chỗ, mọi nơi trên trang tự cập nhật.
// Khi có sản phẩm thật của học sinh, chỉ sửa file này (qua PR).
// Quy ước an toàn: chỉ dùng TÊN NHÓM + BIỆT DANH và lớp của học sinh.
// Không họ tên đầy đủ, không ảnh chân dung, không thông tin liên hệ.
// ============================================================

window.SHOWCASE_DATA = {
  course: {
    name: "Build Website bằng AI Coding Agent",
    audience: "Học sinh lớp 7 đến lớp 10",
    sessions: 24,
    parts: 2,
    teacher: "Nguyễn Mạnh Quý",
    domain: "manhquy.is-a.dev"
  },

  // Hành trình 24 buổi, rút gọn thành các chặng để kể chuyện bằng cuộn trang.
  journey: [
    { code: "Buổi 1", title: "Lập nhóm, tạo kho mã", text: "Hai nhóm hỗn hợp được thành lập.", tag: "Khởi hành" },
    { code: "M0", title: "Trang hello lên sóng", text: "Cài công cụ agent, nạp cấu hình do giáo viên cấp và đưa trang đầu tiên lên địa chỉ dùng thử công khai.", tag: "Học phần 1" },
    { code: "M1", title: "Trang chủ từ bản đặc tả", text: "Nhóm viết bản đặc tả sản phẩm, rồi giao việc cho agent theo từng lát cắt nhỏ có tiêu chí xong rõ ràng.", tag: "Học phần 1" },
    { code: "M2", title: "Danh mục và trang chi tiết", text: "Sản phẩm được tách thành dữ liệu riêng: sửa giá một chỗ, trang danh mục, trang chi tiết và giỏ hàng cùng cập nhật.", tag: "Học phần 1" },
    { code: "M3", title: "Giỏ hàng và đặt hàng thử", text: "Giỏ hàng tính tiền từ dữ liệu thật của nhóm.", tag: "Học phần 1" },
    { code: "Kiểm thử chéo", title: "Nhóm này phá, nhóm kia sửa", text: "Hai nhóm dùng thử sản phẩm của nhau trên điện thoại, ghi phiếu lỗi chỉ gồm hiện tượng và bước tái hiện.", tag: "Học phần 1" },
    { code: "HP2", title: "Điều phối agent nâng cao", text: "Cùng sản phẩm đó được nâng cấp bằng kỹ thuật ngữ cảnh, vòng lặp kiểm chứng, đa agent và kỹ năng tự tạo.", tag: "Học phần 2" },
    { code: "Buổi 12", title: "Showcase và vấn đáp", text: "Mỗi nhóm trình diễn sản phẩm sống.", tag: "Đích đến" }
  ],

  // Số liệu bằng chứng quy trình (cập nhật theo khóa thật).
  stats: [
    { value: 24, suffix: "", label: "buổi học trong hai học phần" },
    { value: 60, suffix: " phút", label: "thực hành trong mỗi buổi 120 phút" },
    { value: 100, suffix: "%", label: "thay đổi vào sản phẩm đều qua pull request được duyệt" },
    { value: 4, suffix: "", label: "vai trò luân phiên: điều phối, vận hành, duyệt, ghi chép" }
  ],

  // Các khái niệm học sinh làm chủ sau hai học phần (dải chạy ngang).
  concepts: ["Prompt 5 thành phần", "Ngữ cảnh (Context)", "Bản đặc tả SPEC", "Pull Request", "Đọc diff", "Review chéo", "Cloudflare Pages", "Cơ sở dữ liệu D1", "Harness", "Vòng lặp kiểm chứng", "MCP", "Đa agent", "Tự tạo Skill", "Hook"],

  // Một thay đổi đi qua cổng chất lượng: 5 trạm, không đường tắt.
  prSteps: [
    { icon: "branch", title: "Tạo nhánh", text: "Mọi thay đổi bắt đầu trên nhánh riêng, không ai sửa thẳng bản đang chạy." },
    { icon: "pr", title: "Mở pull request", text: "Mô tả rõ thay đổi gì, vì sao, và cách kiểm chứng." },
    { icon: "eye", title: "Duyệt trên bản xem trước", text: "Người duyệt mở đúng bản xem trước của PR đó, kiểm tra trên điện thoại." },
    { icon: "check", title: "Sửa theo nhận xét", text: "Nhận xét phải cụ thể. Tác giả sửa hoặc giải trình, không tự duyệt bài của mình." },
    { icon: "rocket", title: "Merge là lên sóng", text: "Chỉ khi được duyệt, thay đổi mới nhập vào bản chính và tự cập nhật công khai." }
  ],

  // Hỏi đáp ngắn cho phụ huynh (hiển thị dạng accordion).
  faqs: [
    { q: "Học sinh có phải tự gõ code không?", a: "Các em đã có nền HTML, CSS và Python cơ bản. Trong khóa này, AI agent gánh phần viết code; học sinh học ra quyết định, viết đặc tả, giao việc theo lát cắt và kiểm duyệt kết quả, là những kỹ năng quyết định chất lượng sản phẩm." },
    { q: "Sản phẩm trên trang này có phải hàng thật không?", a: "Đây là website bán hàng chạy thật trên internet, nhưng toàn bộ dữ liệu khách hàng và đơn hàng đều là dữ liệu giả trong môi trường kiểm thử. Khóa học không dùng thanh toán thật." },
    { q: "Làm sao biết từng em có thật sự tham gia?", a: "Mọi thay đổi đều qua pull request gắn tài khoản cá nhân, có người khác duyệt. Buổi 4 và buổi 9 có kiểm tra thực hành cá nhân, và buổi showcase có vấn đáp từng em về phần mình làm." },
    { q: "Buổi trình diễn cuối khóa diễn ra khi nào, tôi theo dõi bằng cách nào?", a: "Buổi 12 của mỗi học phần là buổi showcase: các nhóm trình diễn sản phẩm đang chạy thật và từng em trả lời vấn đáp cá nhân. Tình trạng dự án được cập nhật ngay trên trang này sau buổi trình diễn, nên phụ huynh ở xa vẫn theo dõi được hành trình của con." },
    { q: "Thông tin của học sinh trên trang có an toàn?", a: "Trang chỉ hiển thị tên nhóm và biệt danh kèm lớp của học sinh. Không có họ tên đầy đủ, ảnh chân dung hay thông tin liên hệ của các em." }
  ],

  // Các gian trưng bày. demoUrl / repoUrl để "#" khi chưa có sản phẩm thật.
  exhibits: [
    {
      id: "nhom-sao-bang",
      team: "Nhóm Sao Băng",
      field: "Tiệm đồ handmade",
      classes: "Lớp 7 đến lớp 9",
      members: ["Biệt danh An", "Biệt danh Bình", "Biệt danh Chi", "Biệt danh Dũng"],
      summary: "Tiệm bán đồ thủ công do nhóm tự chụp ảnh sản phẩm, tự viết mô tả và tự định giá. Trang chi tiết kể câu chuyện làm ra từng món đồ.",
      milestones: ["M0", "M1", "M2", "M3"],
      upgrades: ["Giỏ hàng lưu đơn ở máy chủ kiểm thử", "Trang quản trị xem đơn bằng mã truy cập của nhóm"],
      quote: "Agent viết code rất nhanh, nên phần khó nhất của nhóm là đọc kỹ những gì agent đã sửa trước khi duyệt.",
      demoUrl: "#",
      repoUrl: "#",
      hue: "blue",
      products: [
        { name: "Túi tote thêu tay", price: 120000 },
        { name: "Móc khóa len móc", price: 45000 },
        { name: "Sổ tay bìa vải", price: 65000 },
        { name: "Nến thơm handmade", price: 85000 }
      ],
      progressDone: 4,
      statusText: "Đã hoàn thành học phần 1",
      nextStep: "Học phần 2: nâng cấp lên AI (kết nối MCP, đa agent)",
      updatedNote: "Cập nhật sau buổi 12, học phần 1",
      sample: true
    },
    {
      id: "nhom-mam-xanh",
      team: "Nhóm Mầm Xanh",
      field: "Tiệm cây cảnh mini",
      classes: "Lớp 8 đến lớp 10",
      members: ["Biệt danh Hà", "Biệt danh Khang", "Biệt danh Linh"],
      summary: "Tiệm cây cảnh để bàn kèm hướng dẫn chăm sóc từng loại cây. Mỗi cây có mức độ dễ chăm để khách mới chơi cây chọn đúng khả năng của mình.",
      milestones: ["M0", "M1", "M2", "M3"],
      upgrades: ["Bộ lọc cây theo mức độ dễ chăm", "Nhóm tự tạo một kỹ năng riêng cho agent của nhóm"],
      quote: "Nhóm bị nhóm bạn bắt được 6 lỗi ở buổi kiểm thử chéo. Sửa xong hết 6 lỗi đó là lúc nhóm hiểu sản phẩm của mình nhất.",
      demoUrl: "#",
      repoUrl: "#",
      hue: "green",
      products: [
        { name: "Sen đá mini", price: 45000 },
        { name: "Xương rồng trứng", price: 55000 },
        { name: "Cây kim tiền nhỏ", price: 95000 },
        { name: "Chậu đất nung vẽ tay", price: 65000 }
      ],
      progressDone: 4,
      statusText: "Đã hoàn thành học phần 1",
      nextStep: "Học phần 2: nâng cấp lên AI (kết nối MCP, đa agent)",
      updatedNote: "Cập nhật sau buổi 12, học phần 1",
      sample: true
    }
  ]
};
